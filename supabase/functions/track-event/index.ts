import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { events, session_info } = await req.json()

    console.log('📊 Received events:', events.length)

    // Process each event
    const sessionIds = new Set()

    for (const event of events) {
      sessionIds.add(event.sessionId || event.session_id)

      // Upsert session if this is first event
      if (event.type === 'pageview' || event.event_type === 'pageview') {
        const sessionId = event.sessionId || event.session_id
        const { error: sessionError } = await supabaseClient
          .from('tracking_sessions')
          .upsert({
            session_id: sessionId,
            first_seen_at: new Date(event.timestamp).toISOString(),
            last_activity_at: new Date(event.timestamp).toISOString(),
            device_type: event.deviceType || session_info?.deviceType || 'unknown',
            browser: event.browser || session_info?.browser || 'unknown',
            os: event.os || 'unknown',
            screen_width: event.screenWidth,
            screen_height: event.screenHeight,
            viewport_width: event.viewportWidth,
            viewport_height: event.viewportHeight,
            language: event.language,
            entry_url: event.url,
            entry_path: event.path,
            entry_title: event.title,
            referrer: event.referrer,
            utm_source: event.utm_source,
            utm_medium: event.utm_medium,
            utm_campaign: event.utm_campaign,
            utm_term: event.utm_term,
            utm_content: event.utm_content,
          }, {
            onConflict: 'session_id',
            ignoreDuplicates: false
          })

        if (sessionError) {
          console.error('Session upsert error:', sessionError)
        }
      }

      // Insert event
      const eventData: any = {
        session_id: event.sessionId || event.session_id,
        event_type: event.type || event.event_type,
        timestamp: event.timestamp,
        url: event.url || event.page_url,
        path: event.path,
        title: event.title,
      }

      // Add click data
      if (event.clickData || event.click_x) {
        eventData.click_x = event.clickData?.x || event.click_x
        eventData.click_y = event.clickData?.y || event.click_y
        eventData.click_element = event.clickData?.element || event.event_data?.tag
        eventData.click_element_id = event.clickData?.elementId
        eventData.click_element_class = event.clickData?.elementClass
        eventData.click_element_text = event.clickData?.elementText
        eventData.is_cta_click = event.clickData?.isCtaClick
      }

      // Add scroll data
      if (event.scrollData) {
        eventData.scroll_depth = event.scrollData.depth
        eventData.scroll_percentage = event.scrollData.percentage
        eventData.max_scroll_depth = event.scrollData.maxDepth
      }

      // Add mouse data
      if (event.mouseData) {
        eventData.mouse_x = event.mouseData.x
        eventData.mouse_y = event.mouseData.y
        eventData.mouse_speed = event.mouseData.movementSpeed
      }

      // Add form data
      if (event.formData) {
        eventData.form_id = event.formData.formId
        eventData.form_name = event.formData.formName
        eventData.form_field_name = event.formData.fieldName
        eventData.form_field_type = event.formData.fieldType
        eventData.form_action = event.formData.action
      }

      // Add funnel data
      if (event.funnelData) {
        eventData.funnel_id = event.funnelData.funnelId
        eventData.funnel_step_name = event.funnelData.stepName
        eventData.funnel_step_order = event.funnelData.stepOrder
      } else if (event.funnel_id) {
        eventData.funnel_id = event.funnel_id
        eventData.funnel_step_order = event.step_number
      }

      // Add time data
      if (event.timeData) {
        eventData.time_on_page = event.timeData.timeOnPage
        eventData.user_engaged = event.timeData.engaged
      } else if (event.time_on_page) {
        eventData.time_on_page = event.time_on_page
      }

      const { error: eventError } = await supabaseClient
        .from('tracking_events')
        .insert(eventData)

      if (eventError) {
        console.error('Event insert error:', eventError)
      }
    }

    console.log(`✅ Tracked ${events.length} events for ${sessionIds.size} session(s)`)

    return new Response(
      JSON.stringify({
        success: true,
        eventsProcessed: events.length,
        sessions: Array.from(sessionIds)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
