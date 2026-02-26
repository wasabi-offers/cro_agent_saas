import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Use SERVICE_ROLE_KEY to bypass RLS
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

    // Sort so pageviews come first (they carry richer session data)
    const sorted = [...events].sort((a, b) => {
      const aType = a.type || a.event_type
      const bType = b.type || b.event_type
      if (aType === 'pageview' && bType !== 'pageview') return -1
      if (aType !== 'pageview' && bType === 'pageview') return 1
      return 0
    })

    for (const event of sorted) {
      // Support both flat snake_case (current script) and camelCase (legacy)
      const sessionId = event.session_id || event.sessionId
      const userId = event.user_id || event.userId || null
      const eventType = event.type || event.event_type

      if (!sessionId) continue
      sessionIds.add(sessionId)

      // ── Ensure session exists (once per session per batch) ──
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
          // Current script sends source/medium; legacy sends utm_source/utm_medium
          utm_source: event.source || event.utm_source || null,
          utm_medium: event.medium || event.utm_medium || null,
          utm_campaign: event.campaign || event.utm_campaign || null,
          utm_term: event.term || event.utm_term || null,
          utm_content: event.content || event.utm_content || null,
        }

        const { error: sessErr } = await supabaseClient
          .from('tracking_sessions')
          .upsert(sessionData, { onConflict: 'session_id', ignoreDuplicates: true })

        if (sessErr) console.error('Session upsert error:', sessErr.message)
      }

      // ── Build event data ──
      const evtData: Record<string, unknown> = {
        session_id: sessionId,
        event_type: eventType,
        timestamp: event.timestamp || Date.now(),
        url: event.url || event.page_url || null,
        path: event.path || null,
        title: event.title || null,
      }

      // Click data — flat (current) or nested (legacy)
      if (event.click_x != null || event.clickData) {
        evtData.click_x = event.click_x ?? event.clickData?.x
        evtData.click_y = event.click_y ?? event.clickData?.y
        evtData.click_element = event.element ?? event.clickData?.element
        evtData.click_element_id = event.element_id ?? event.clickData?.elementId
        evtData.click_element_class = event.element_class ?? event.clickData?.elementClass
        evtData.click_element_text = event.element_text ?? event.clickData?.elementText
        evtData.is_cta_click = event.is_cta_click ?? event.clickData?.isCtaClick
      }

      // Scroll data
      if (event.scroll_depth != null || event.scrollData) {
        evtData.scroll_depth = event.scroll_depth ?? event.scrollData?.depth
        evtData.scroll_percentage = event.scroll_percentage ?? event.scrollData?.percentage
        evtData.max_scroll_depth = event.max_scroll_depth ?? event.scrollData?.maxDepth
      }

      // Mouse data
      if (event.mouse_x != null || event.mouseData) {
        evtData.mouse_x = event.mouse_x ?? event.mouseData?.x
        evtData.mouse_y = event.mouse_y ?? event.mouseData?.y
        evtData.mouse_speed = event.mouse_speed ?? event.mouseData?.movementSpeed
      }

      // Form data
      if (event.form_id != null || event.field_name != null || event.formData) {
        evtData.form_id = event.form_id ?? event.formData?.formId
        evtData.form_name = event.form_name ?? event.formData?.formName
        evtData.form_field_name = event.field_name ?? event.formData?.fieldName
        evtData.form_field_type = event.field_type ?? event.formData?.fieldType
        evtData.form_action = event.form_action ?? event.form_action_url ?? event.formData?.action
      }

      // Funnel data
      if (event.funnel_id != null || event.funnelData) {
        evtData.funnel_id = event.funnel_id ?? event.funnelData?.funnelId
        evtData.funnel_step_name = event.funnel_step_name ?? event.step_name ?? event.funnelData?.stepName
        evtData.funnel_step_order = event.step_order ?? event.funnelData?.stepOrder
      }

      // Time data
      if (event.time_on_page != null || event.timeData) {
        evtData.time_on_page = event.time_on_page ?? event.timeData?.timeOnPage
        evtData.user_engaged = event.engaged ?? event.timeData?.engaged
      }

      const { error: evtErr } = await supabaseClient
        .from('tracking_events')
        .insert(evtData)

      if (evtErr) console.error('Event insert error:', evtErr.message, '| type:', eventType)
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
    console.error('Track-event error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
