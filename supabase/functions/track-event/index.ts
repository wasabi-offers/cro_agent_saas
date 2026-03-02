import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOUCHPOINT_EVENTS = new Set([
  'pageview', 'cta_click', 'form_submit', 'conversion',
  'funnel_step', 'custom', 'identify',
])

async function triggerAIAttribution(conversionId: string, userId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return

  const endpoint = `${supabaseUrl}/functions/v1/ai-attribution`

  await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      conversion_id: conversionId,
      user_id: userId,
    }),
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { events } = body

    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: events array required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const sessionIds = new Set<string>()
    const ensuredSessions = new Set<string>()
    const ensuredUsers = new Set<string>()

    const sorted = [...events].sort((a, b) => {
      const aType = a.type || a.event_type
      const bType = b.type || b.event_type
      if (aType === 'pageview' && bType !== 'pageview') return -1
      if (aType !== 'pageview' && bType === 'pageview') return 1
      return 0
    })

    for (const event of sorted) {
      const sessionId = event.session_id || event.sessionId
      const userId = event.user_id || event.userId || null
      const eventType = event.type || event.event_type

      if (!sessionId) continue
      sessionIds.add(sessionId)

      // ── 1. Upsert session ──────────────────────────────
      if (!ensuredSessions.has(sessionId)) {
        ensuredSessions.add(sessionId)

        const sessionData: Record<string, unknown> = {
          session_id: sessionId,
          user_id: userId,
          first_seen_at: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
          last_activity_at: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
          device_type: event.device_type || event.deviceType || 'unknown',
          browser: event.browser || 'unknown',
          os: event.os || 'unknown',
          screen_width: event.screen_width || event.screenWidth || null,
          screen_height: event.screen_height || event.screenHeight || null,
          viewport_width: event.viewport_width || event.viewportWidth || null,
          viewport_height: event.viewport_height || event.viewportHeight || null,
          language: event.language || null,
          entry_url: event.url || null,
          entry_path: event.path || null,
          entry_title: event.title || null,
          referrer: event.referrer || null,
          utm_source: event.source || event.utm_source || null,
          utm_medium: event.medium || event.utm_medium || null,
          utm_campaign: event.campaign || event.utm_campaign || null,
          utm_term: event.term || event.utm_term || null,
          utm_content: event.content || event.utm_content || null,
        }

        const { error: sessErr } = await supabaseClient
          .from('tracking_sessions')
          .upsert(sessionData, { onConflict: 'session_id', ignoreDuplicates: true })

        if (sessErr) console.error('[edge] Session upsert error:', sessErr.message)
      }

      // ── 2. Create / update attribution user ────────────
      if (userId && !ensuredUsers.has(userId)) {
        ensuredUsers.add(userId)

        const ftSource = event.first_touch_source || event.source || event.utm_source || 'direct'
        const ftMedium = event.first_touch_medium || event.medium || event.utm_medium || 'none'
        const ftCampaign = event.first_touch_campaign || event.campaign || event.utm_campaign || null
        const ftContent = event.first_touch_content || event.content || event.utm_content || null
        const ftTerm = event.first_touch_term || event.term || event.utm_term || null

        const ltSource = event.source || event.utm_source || 'direct'
        const ltMedium = event.medium || event.utm_medium || 'none'
        const ltCampaign = event.campaign || event.utm_campaign || null
        const ltContent = event.content || event.utm_content || null
        const ltTerm = event.term || event.utm_term || null

        const now = new Date().toISOString()

        const { error: insertErr } = await supabaseClient
          .from('tracking_users')
          .upsert(
            {
              user_id: userId,
              device_fingerprint: event.device_fingerprint || null,
              first_seen_at: now,
              last_seen_at: now,
              total_sessions: 1,
              total_pageviews: 0,
              total_events: 0,
              total_conversions: 0,
              total_revenue: 0,
              primary_device_type: event.device_type || event.deviceType || 'unknown',
              primary_browser: event.browser || 'unknown',
              primary_os: event.os || 'unknown',
              primary_language: event.language || null,
              first_touch_source: ftSource,
              first_touch_medium: ftMedium,
              first_touch_campaign: ftCampaign,
              first_touch_content: ftContent,
              first_touch_term: ftTerm,
              first_touch_referrer: event.referrer || null,
              first_touch_landing_page: event.url || null,
              last_touch_source: ltSource,
              last_touch_medium: ltMedium,
              last_touch_campaign: ltCampaign,
              last_touch_content: ltContent,
              last_touch_term: ltTerm,
              last_touch_referrer: event.referrer || null,
              last_touch_landing_page: event.url || null,
              lifecycle_stage: 'visitor',
            },
            { onConflict: 'user_id', ignoreDuplicates: true }
          )
        if (insertErr) console.error('[edge] User insert error:', insertErr.message)

        const { error: updateErr } = await supabaseClient
          .from('tracking_users')
          .update({
            last_seen_at: now,
            updated_at: now,
            last_touch_source: ltSource,
            last_touch_medium: ltMedium,
            last_touch_campaign: ltCampaign,
            last_touch_content: ltContent,
            last_touch_term: ltTerm,
            last_touch_referrer: event.referrer || null,
            last_touch_landing_page: event.url || null,
          })
          .eq('user_id', userId)
        if (updateErr) console.error('[edge] User update error:', updateErr.message)

        const isNewSession = event.is_new_session === true || event.isNewSession === true
        const isNewUser = event.is_new_user === true || event.isNewUser === true

        if (isNewSession && !isNewUser) {
          const { error: rpcErr } = await supabaseClient.rpc(
            'increment_user_sessions',
            { p_user_id: userId }
          )
          if (rpcErr) console.error('[edge] increment_user_sessions error:', rpcErr.message)
        }
      }

      // ── 3. Insert raw tracking event ───────────────────
      const evtData: Record<string, unknown> = {
        session_id: sessionId,
        event_type: eventType,
        timestamp: event.timestamp || Date.now(),
        url: event.url || event.page_url || null,
        path: event.path || null,
        title: event.title || null,
      }

      if (event.click_x != null || event.clickData) {
        evtData.click_x = event.click_x ?? event.clickData?.x
        evtData.click_y = event.click_y ?? event.clickData?.y
        evtData.click_element = event.element ?? event.clickData?.element
        evtData.click_element_id = event.element_id ?? event.clickData?.elementId
        evtData.click_element_class = event.element_class ?? event.clickData?.elementClass
        evtData.click_element_text = event.element_text ?? event.clickData?.elementText
        evtData.is_cta_click = event.is_cta_click ?? event.clickData?.isCtaClick
      }

      if (event.scroll_depth != null || event.scrollData) {
        evtData.scroll_depth = event.scroll_depth ?? event.scrollData?.depth
        evtData.scroll_percentage = event.scroll_percentage ?? event.scrollData?.percentage
        evtData.max_scroll_depth = event.max_scroll_depth ?? event.scrollData?.maxDepth
      }

      if (event.mouse_x != null || event.mouseData) {
        evtData.mouse_x = event.mouse_x ?? event.mouseData?.x
        evtData.mouse_y = event.mouse_y ?? event.mouseData?.y
        evtData.mouse_speed = event.mouse_speed ?? event.mouseData?.movementSpeed
      }

      if (event.form_id != null || event.field_name != null || event.formData) {
        evtData.form_id = event.form_id ?? event.formData?.formId
        evtData.form_name = event.form_name ?? event.formData?.formName
        evtData.form_field_name = event.field_name ?? event.formData?.fieldName
        evtData.form_field_type = event.field_type ?? event.formData?.fieldType
        evtData.form_action = event.form_action ?? event.form_action_url ?? event.formData?.action
      }

      if (event.funnel_id != null || event.funnelData) {
        evtData.funnel_id = event.funnel_id ?? event.funnelData?.funnelId
        evtData.funnel_step_name = event.funnel_step_name ?? event.step_name ?? event.funnelData?.stepName
        evtData.funnel_step_order = event.step_order ?? event.funnelData?.stepOrder
      }

      if (event.time_on_page != null || event.timeData) {
        evtData.time_on_page = event.time_on_page ?? event.timeData?.timeOnPage
        evtData.user_engaged = event.engaged ?? event.timeData?.engaged
      }

      const { error: evtErr } = await supabaseClient
        .from('tracking_events')
        .insert(evtData)

      if (evtErr) console.error('[edge] Event insert error:', evtErr.message, '| type:', eventType)

      // ── 4. Insert attribution touchpoint ───────────────
      if (userId && TOUCHPOINT_EVENTS.has(eventType)) {
        const { error: tpErr } = await supabaseClient
          .from('attribution_touchpoints')
          .insert({
            user_id: userId,
            session_id: sessionId,
            touchpoint_type: eventType,
            touchpoint_order: event.touchpoint_order || 0,
            source: event.source || event.utm_source || 'direct',
            medium: event.medium || event.utm_medium || 'none',
            campaign: event.campaign || event.utm_campaign || null,
            content: event.content || event.utm_content || null,
            term: event.term || event.utm_term || null,
            referrer: event.referrer || null,
            page_url: event.url || null,
            page_path: event.path || null,
            page_title: event.title || null,
            is_conversion: event.is_conversion === true,
            conversion_type: event.conversion_type || null,
            conversion_value: parseFloat(event.conversion_value) || 0,
            funnel_id: event.funnel_id || null,
            funnel_step_name: event.funnel_step_name || event.step_name || null,
            funnel_step_order: event.step_order || null,
            device_type: event.device_type || event.deviceType || 'unknown',
            browser: event.browser || 'unknown',
            os: event.os || 'unknown',
            timestamp: event.timestamp || Date.now(),
          })

        if (tpErr) console.error('[edge] Touchpoint insert error:', tpErr.message)
      }

      // ── 5. Record conversion ───────────────────────────
      if (userId && eventType === 'conversion' && event.is_conversion === true) {
        const { data: convId, error: convErr } = await supabaseClient.rpc('record_conversion', {
          p_user_id: userId,
          p_session_id: sessionId,
          p_conversion_type: event.conversion_type || 'purchase',
          p_conversion_name: event.conversion_name || 'Conversion',
          p_conversion_value: parseFloat(event.conversion_value) || 0,
        })
        if (convErr) console.error('[edge] record_conversion error:', convErr.message)

        // ── 5b. Trigger AI Attribution (fire-and-forget) ───
        if (convId) {
          triggerAIAttribution(convId, userId).catch(e =>
            console.error('[edge] AI attribution trigger error:', e.message)
          )
        }
      }

      // ── 6. Log AI intervention response ──────────────
      if (eventType === 'ai_intervention_response' && userId) {
        const interventionType = event.intervention_type
        const response = event.response
        if (interventionType) {
          await supabaseClient
            .from('ai_interventions')
            .update({
              user_response: response || 'unknown',
              response_time_ms: event.response_time_ms || null,
            })
            .eq('session_id', sessionId)
            .eq('intervention_type', interventionType)
            .order('created_at', { ascending: false })
            .limit(1)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventsProcessed: events.length,
        sessions: Array.from(sessionIds),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('[edge] Track-event error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
