import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=====================================')
  console.log('🚀 Edge Function: track-event invoked')
  console.log('Method:', req.method)
  console.log('=====================================')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { events } = body
    console.log('📊 Received events count:', events?.length || 0)

    const sessionIds = new Set()
    const userIds = new Set()

    for (const event of events) {
      const sessionId = event.session_id || event.sessionId
      const userId = event.user_id
      
      sessionIds.add(sessionId)
      if (userId) userIds.add(userId)
      
      console.log('🔄 Processing:', event.type, '| User:', userId?.substring(0, 15), '| Session:', sessionId?.substring(0, 15))

      // ============================================
      // HANDLE USER (First-Party Attribution)
      // ============================================
      if (userId && (event.type === 'pageview' || event.is_new_user)) {
        console.log('👤 Upserting user:', userId)
        
        const userData: any = {
          user_id: userId,
          last_seen_at: new Date().toISOString(),
          device_fingerprint: event.device_fingerprint,
          primary_device_type: event.device_type || event.deviceType,
          primary_browser: event.browser,
          primary_os: event.os,
          primary_language: event.language,
        }
        
        // First touch attribution (only on new user)
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
        
        // Last touch attribution (always update)
        userData.last_touch_source = event.source
        userData.last_touch_medium = event.medium
        userData.last_touch_campaign = event.campaign
        userData.last_touch_content = event.content
        userData.last_touch_term = event.term
        userData.last_touch_referrer = event.referrer
        userData.last_touch_landing_page = event.url
        
        const { error: userError } = await supabaseClient
          .from('tracking_users')
          .upsert(userData, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })

        if (userError) {
          console.error('❌ User upsert error:', userError.message)
        } else {
          console.log('✅ User upserted successfully')
          
          // Increment session count for returning users
          if (event.is_new_session && !event.is_new_user) {
            await supabaseClient.rpc('increment_user_sessions', { p_user_id: userId })
          }
        }
      }

      // ============================================
      // HANDLE SESSION
      // ============================================
      if (event.type === 'pageview' || event.event_type === 'pageview') {
        console.log('📄 Upserting session:', sessionId)
        
        const sessionData: any = {
          session_id: sessionId,
          user_id: userId,
          first_seen_at: new Date(event.timestamp).toISOString(),
          last_activity_at: new Date(event.timestamp).toISOString(),
          device_type: event.device_type || event.deviceType || 'unknown',
          browser: event.browser || 'unknown',
          os: event.os || 'unknown',
          screen_width: event.screen_width || event.screenWidth,
          screen_height: event.screen_height || event.screenHeight,
          viewport_width: event.viewport_width || event.viewportWidth,
          viewport_height: event.viewport_height || event.viewportHeight,
          language: event.language,
          entry_url: event.url,
          entry_path: event.path,
          entry_title: event.title,
          referrer: event.referrer,
          utm_source: event.source || event.utm_source,
          utm_medium: event.medium || event.utm_medium,
          utm_campaign: event.campaign || event.utm_campaign,
          utm_term: event.term || event.utm_term,
          utm_content: event.content || event.utm_content,
        }

        const { error: sessionError } = await supabaseClient
          .from('tracking_sessions')
          .upsert(sessionData, {
            onConflict: 'session_id',
            ignoreDuplicates: false
          })

        if (sessionError) {
          console.error('❌ Session upsert error:', sessionError.message)
        } else {
          console.log('✅ Session upserted successfully')
        }
      }

      // ============================================
      // HANDLE TOUCHPOINT (Attribution)
      // ============================================
      if (userId && ['pageview', 'cta_click', 'form_submit', 'conversion', 'funnel_step'].includes(event.type)) {
        const touchpointData: any = {
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
          conversion_type: event.conversion_type,
          conversion_value: event.conversion_value || 0,
          funnel_id: event.funnel_id,
          funnel_step_name: event.funnel_step_name || event.step_name,
          funnel_step_order: event.funnel_step_order,
          device_type: event.device_type || event.deviceType,
          browser: event.browser,
          os: event.os,
          timestamp: event.timestamp
        }

        const { error: touchpointError } = await supabaseClient
          .from('attribution_touchpoints')
          .insert(touchpointData)

        if (touchpointError) {
          // Table might not exist yet, log but don't fail
          console.warn('⚠️ Touchpoint insert error:', touchpointError.message)
        } else {
          console.log('✅ Touchpoint recorded')
        }
      }

      // ============================================
      // HANDLE CONVERSION
      // ============================================
      if (event.type === 'conversion' && userId) {
        console.log('💰 Recording conversion for user:', userId)
        
        try {
          const { data, error } = await supabaseClient.rpc('record_conversion', {
            p_user_id: userId,
            p_session_id: sessionId,
            p_conversion_type: event.conversion_type || 'purchase',
            p_conversion_name: event.conversion_name || 'Conversion',
            p_conversion_value: parseFloat(event.conversion_value) || 0
          })
          
          if (error) {
            console.warn('⚠️ Conversion RPC error:', error.message)
          } else {
            console.log('✅ Conversion recorded:', data)
          }
        } catch (e) {
          console.warn('⚠️ Conversion recording failed:', e.message)
        }
      }

      // ============================================
      // INSERT TRACKING EVENT (existing logic)
      // ============================================
      const eventData: any = {
        session_id: sessionId,
        event_type: event.type || event.event_type,
        timestamp: event.timestamp,
        url: event.url || event.page_url,
        path: event.path,
        title: event.title,
      }

      // Add click data
      if (event.click_x || event.clickData) {
        eventData.click_x = event.click_x || event.clickData?.x
        eventData.click_y = event.click_y || event.clickData?.y
        eventData.click_element = event.element || event.clickData?.element
        eventData.click_element_id = event.element_id || event.clickData?.elementId
        eventData.click_element_class = event.element_class || event.clickData?.elementClass
        eventData.click_element_text = event.element_text || event.clickData?.elementText
        eventData.is_cta_click = event.is_cta_click || event.clickData?.isCtaClick
      }

      // Add scroll data
      if (event.scroll_depth || event.scrollData) {
        eventData.scroll_depth = event.scroll_depth || event.scrollData?.depth
        eventData.scroll_percentage = event.scroll_percentage || event.scrollData?.percentage
        eventData.max_scroll_depth = event.max_scroll_depth || event.scrollData?.maxDepth
      }

      // Add mouse data
      if (event.mouse_x || event.mouseData) {
        eventData.mouse_x = event.mouse_x || event.mouseData?.x
        eventData.mouse_y = event.mouse_y || event.mouseData?.y
        eventData.mouse_speed = event.mouseData?.movementSpeed
      }

      // Add form data
      if (event.form_id || event.formData) {
        eventData.form_id = event.form_id || event.formData?.formId
        eventData.form_name = event.form_name || event.formData?.formName
        eventData.form_field_name = event.formData?.fieldName
        eventData.form_field_type = event.formData?.fieldType
        eventData.form_action = event.form_action || event.formData?.action
      }

      // Add funnel data
      if (event.funnel_id || event.funnelData) {
        eventData.funnel_id = event.funnel_id || event.funnelData?.funnelId
        eventData.funnel_step_name = event.funnel_step_name || event.step_name || event.funnelData?.stepName
        eventData.funnel_step_order = event.funnel_step_order || event.funnelData?.stepOrder
      }

      // Add time data
      if (event.time_on_page || event.timeData) {
        eventData.time_on_page = event.time_on_page || event.timeData?.timeOnPage
        eventData.user_engaged = event.engaged || event.timeData?.engaged
      }

      const { error: eventError } = await supabaseClient
        .from('tracking_events')
        .insert(eventData)

      if (eventError) {
        console.error('❌ Event insert error:', eventError.message)
      } else {
        console.log('✅ Event inserted')
      }

      // ============================================
      // UPDATE USER COUNTERS
      // ============================================
      if (userId) {
        // Increment pageviews
        if (event.type === 'pageview') {
          await supabaseClient
            .from('tracking_users')
            .update({ 
              total_pageviews: supabaseClient.sql`total_pageviews + 1`,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
        }
        
        // Increment events
        await supabaseClient
          .from('tracking_users')
          .update({ 
            total_events: supabaseClient.sql`total_events + 1`,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
      }
    }

    console.log('=====================================')
    console.log(`✅ COMPLETED: ${events.length} events | ${userIds.size} users | ${sessionIds.size} sessions`)
    console.log('=====================================')

    return new Response(
      JSON.stringify({
        success: true,
        eventsProcessed: events.length,
        users: Array.from(userIds),
        sessions: Array.from(sessionIds)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('=====================================')
    console.error('❌ FATAL ERROR:', error.message)
    console.error('=====================================')
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
