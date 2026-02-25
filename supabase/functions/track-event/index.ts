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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { events } = body
    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(JSON.stringify({ error: 'events array required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`📊 Processing ${events.length} events`)

    const sessionIds = new Set<string>()
    const userIds = new Set<string>()
    let pageviewCount = 0

    for (const event of events) {
      const sessionId = event.session_id
      const userId = event.user_id

      if (!sessionId) continue

      sessionIds.add(sessionId)
      if (userId) userIds.add(userId)

      // ── USER UPSERT (on pageview or new user) ─────────────
      if (userId && (event.type === 'pageview' || event.is_new_user)) {
        const userData: Record<string, unknown> = {
          user_id: userId,
          last_seen_at: new Date().toISOString(),
          device_fingerprint: event.device_fingerprint,
          primary_device_type: event.device_type,
          primary_browser: event.browser,
          primary_os: event.os,
          primary_language: event.language,
          last_touch_source: event.source,
          last_touch_medium: event.medium,
          last_touch_campaign: event.campaign,
          last_touch_content: event.content,
          last_touch_term: event.term,
          last_touch_referrer: event.referrer,
          last_touch_landing_page: event.url,
        }

        if (event.is_new_user) {
          userData.first_seen_at = new Date().toISOString()
          userData.first_touch_source = event.first_touch_source || event.source
          userData.first_touch_medium = event.first_touch_medium || event.medium
          userData.first_touch_campaign = event.first_touch_campaign || event.campaign
          userData.first_touch_content = event.first_touch_content || event.content
          userData.first_touch_term = event.first_touch_term || event.term
          userData.first_touch_referrer = event.referrer
          userData.first_touch_landing_page = event.url
          userData.total_sessions = 1
        }

        const { error: userErr } = await supabase
          .from('tracking_users')
          .upsert(userData, { onConflict: 'user_id', ignoreDuplicates: false })

        if (userErr) {
          console.error('User upsert error:', userErr.message)
        } else if (event.is_new_session && !event.is_new_user) {
          await supabase.rpc('increment_user_sessions', { p_user_id: userId })
        }
      }

      // ── SESSION UPSERT (on pageview) ───────────────────────
      if (event.type === 'pageview') {
        pageviewCount++
        const sessionData = {
          session_id: sessionId,
          user_id: userId || null,
          first_seen_at: new Date(event.timestamp).toISOString(),
          last_activity_at: new Date(event.timestamp).toISOString(),
          device_type: event.device_type || 'unknown',
          browser: event.browser || 'unknown',
          os: event.os || 'unknown',
          screen_width: event.screen_width,
          screen_height: event.screen_height,
          viewport_width: event.viewport_width,
          viewport_height: event.viewport_height,
          language: event.language,
          entry_url: event.url,
          entry_path: event.path,
          entry_title: event.title,
          referrer: event.referrer,
          utm_source: event.source,
          utm_medium: event.medium,
          utm_campaign: event.campaign,
          utm_term: event.term,
          utm_content: event.content,
        }

        const { error: sessErr } = await supabase
          .from('tracking_sessions')
          .upsert(sessionData, { onConflict: 'session_id', ignoreDuplicates: false })

        if (sessErr) console.error('Session upsert error:', sessErr.message)
      }

      // ── ATTRIBUTION TOUCHPOINT (key events only) ──────────
      const touchpointTypes = ['pageview', 'cta_click', 'form_submit', 'conversion', 'funnel_step']
      if (userId && touchpointTypes.includes(event.type)) {
        const tp = {
          user_id: userId,
          session_id: sessionId,
          touchpoint_type: event.type,
          touchpoint_order: event.touchpoint_order || 0,
          source: event.source,
          medium: event.medium,
          campaign: event.campaign,
          content: event.content,
          term: event.term,
          referrer: event.referrer,
          page_url: event.url,
          page_path: event.path,
          page_title: event.title,
          is_conversion: event.is_conversion || event.type === 'conversion',
          conversion_type: event.conversion_type || null,
          conversion_value: event.conversion_value || 0,
          funnel_id: event.funnel_id || null,
          funnel_step_name: event.funnel_step_name || event.step_name || null,
          funnel_step_order: event.step_order || null,
          device_type: event.device_type,
          browser: event.browser,
          os: event.os,
          timestamp: event.timestamp,
        }

        const { error: tpErr } = await supabase.from('attribution_touchpoints').insert(tp)
        if (tpErr) console.warn('Touchpoint error:', tpErr.message)
      }

      // ── CONVERSION (via RPC) ──────────────────────────────
      if (event.type === 'conversion' && userId) {
        try {
          await supabase.rpc('record_conversion', {
            p_user_id: userId,
            p_session_id: sessionId,
            p_conversion_type: event.conversion_type || 'purchase',
            p_conversion_name: event.conversion_name || 'Conversion',
            p_conversion_value: parseFloat(event.conversion_value) || 0,
          })
        } catch (e: any) {
          console.warn('Conversion RPC failed:', e.message)
        }
      }

      // ── TRACKING EVENT (all events → tracking_events) ─────
      const evtData: Record<string, unknown> = {
        session_id: sessionId,
        event_type: event.type,
        timestamp: event.timestamp,
        url: event.url,
        path: event.path,
        title: event.title,
        funnel_id: event.funnel_id || null,
        funnel_step_name: event.funnel_step_name || event.step_name || null,
        funnel_step_order: event.step_order || null,
      }

      // Click data
      if (event.click_x != null) {
        evtData.click_x = event.click_x
        evtData.click_y = event.click_y
        evtData.click_element = event.element
        evtData.click_element_id = event.element_id
        evtData.click_element_class = event.element_class
        evtData.click_element_text = event.element_text
        evtData.is_cta_click = event.is_cta_click
      }

      // Scroll data
      if (event.scroll_depth != null) {
        evtData.scroll_depth = event.scroll_depth
        evtData.scroll_percentage = event.scroll_percentage
        evtData.max_scroll_depth = event.max_scroll_depth
      }

      // Mouse data
      if (event.mouse_x != null) {
        evtData.mouse_x = event.mouse_x
        evtData.mouse_y = event.mouse_y
        evtData.mouse_speed = event.mouse_speed
      }

      // Form data
      if (event.form_id != null || event.field_name != null) {
        evtData.form_id = event.form_id
        evtData.form_name = event.form_name
        evtData.form_field_name = event.field_name
        evtData.form_field_type = event.field_type
        evtData.form_action = event.form_action || event.form_action_url
      }

      // Time data
      if (event.time_on_page != null) {
        evtData.time_on_page = event.time_on_page
        evtData.user_engaged = event.engaged
      }

      const { error: evtErr } = await supabase.from('tracking_events').insert(evtData)
      if (evtErr) console.error('Event insert error:', evtErr.message)

      // ── USER COUNTERS (via RPC) ───────────────────────────
      if (userId) {
        if (event.type === 'pageview') {
          await supabase.rpc('increment_user_pageviews', { p_user_id: userId })
        }
        await supabase.rpc('increment_user_events', { p_user_id: userId })
      }
    }

    console.log(`✅ Done: ${events.length} events | ${userIds.size} users | ${sessionIds.size} sessions`)

    return new Response(
      JSON.stringify({
        success: true,
        eventsProcessed: events.length,
        users: Array.from(userIds),
        sessions: Array.from(sessionIds),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('FATAL:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
