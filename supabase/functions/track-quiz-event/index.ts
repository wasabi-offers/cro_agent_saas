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
    const { events } = body

    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: events array required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const processedSessions = new Set<string>()
    let eventsProcessed = 0

    for (const event of events) {
      const funnelSlug = event.funnel_slug
      const eventType = event.event_type
      const userId = event.user_id
      const sessionId = event.session_id

      if (!funnelSlug || !eventType || !userId) continue

      // Resolve funnel ID from slug
      const { data: funnel } = await supabase
        .from('quiz_funnels')
        .select('id')
        .eq('slug', funnelSlug)
        .eq('status', 'active')
        .single()

      if (!funnel) {
        console.error(`[quiz-track] Funnel not found: ${funnelSlug}`)
        continue
      }

      const funnelId = funnel.id
      let quizSessionId = event.quiz_session_id

      // ── Handle quiz_start ──
      if (eventType === 'quiz_start') {
        const { data: newSessionId, error: startErr } = await supabase.rpc('start_quiz_session', {
          p_funnel_id: funnelId,
          p_user_id: userId,
          p_session_id: sessionId,
          p_source: event.source || 'direct',
          p_medium: event.medium || 'none',
          p_campaign: event.campaign || null,
          p_device_type: event.device_type || 'unknown',
          p_browser: event.browser || 'unknown',
          p_os: event.os || 'unknown',
        })

        if (startErr) {
          console.error('[quiz-track] start_quiz_session error:', startErr.message)
        } else {
          quizSessionId = newSessionId
          processedSessions.add(quizSessionId)
        }
      }

      // Try to find existing quiz session if we don't have the DB ID
      if (!quizSessionId || !processedSessions.has(quizSessionId)) {
        const { data: existingSession } = await supabase
          .from('quiz_sessions')
          .select('id')
          .eq('funnel_id', funnelId)
          .eq('user_id', userId)
          .eq('status', 'in_progress')
          .order('started_at', { ascending: false })
          .limit(1)
          .single()

        if (existingSession) {
          quizSessionId = existingSession.id
          processedSessions.add(quizSessionId)
        }
      }

      // ── Insert quiz event ──
      const eventData: Record<string, unknown> = {
        funnel_id: funnelId,
        quiz_session_id: quizSessionId || null,
        user_id: userId,
        session_id: sessionId,
        event_type: eventType,
        step_order: event.step_order ?? null,
        step_name: event.step_name || null,
        answer_id: event.answer_id || null,
        answer_text: event.answer_text || null,
        answer_value: event.answer_value || null,
        previous_answer_id: event.previous_answer_id || null,
        time_on_step_seconds: event.time_on_step_seconds || 0,
        time_since_start_seconds: event.time_since_start_seconds || 0,
        hesitation_detected: event.hesitation_detected || false,
        hesitation_duration_ms: event.hesitation_duration_ms || 0,
        interaction_data: {
          scroll_percentage: event.scroll_percentage,
          away_duration_ms: event.away_duration_ms,
          target_step: event.target_step,
          total_steps_viewed: event.total_steps_viewed,
          click_count: event.click_count,
        },
        device_type: event.device_type || 'unknown',
        browser: event.browser || 'unknown',
        timestamp: event.timestamp || Date.now(),
      }

      const { error: evtErr } = await supabase
        .from('quiz_events')
        .insert(eventData)

      if (evtErr) {
        console.error('[quiz-track] Event insert error:', evtErr.message, '| type:', eventType)
      }

      // ── Record answer ──
      if (eventType === 'answer_click' && quizSessionId) {
        const { error: ansErr } = await supabase.rpc('record_quiz_answer', {
          p_quiz_session_id: quizSessionId,
          p_step_order: event.step_order || 0,
          p_answer_id: event.answer_id || '',
          p_answer_text: event.answer_text || '',
          p_time_seconds: event.time_on_step_seconds || 0,
        })
        if (ansErr) console.error('[quiz-track] record_quiz_answer error:', ansErr.message)

        // Update step view count
        await supabase
          .from('quiz_sessions')
          .update({
            total_steps_viewed: event.total_steps_viewed || 0,
            last_step_reached: Math.max(event.step_order || 0, 0),
            updated_at: new Date().toISOString(),
          })
          .eq('id', quizSessionId)
      }

      // ── Handle quiz completion ──
      if (eventType === 'quiz_complete' && quizSessionId) {
        const { error: compErr } = await supabase.rpc('complete_quiz_session', {
          p_quiz_session_id: quizSessionId,
          p_quiz_score: event.quiz_score || 0,
          p_quiz_result: event.quiz_result || null,
        })
        if (compErr) console.error('[quiz-track] complete_quiz_session error:', compErr.message)

        triggerAIAnalysis(funnelId, supabase)
      }

      // ── Handle quiz abandonment ──
      if (eventType === 'quiz_abandon' && quizSessionId) {
        const { error: abErr } = await supabase.rpc('abandon_quiz_session', {
          p_quiz_session_id: quizSessionId,
          p_dropoff_step: event.dropoff_step || event.step_order || 0,
          p_dropoff_reason: event.dropoff_reason || 'unknown',
        })
        if (abErr) console.error('[quiz-track] abandon_quiz_session error:', abErr.message)
      }

      // ── Update answer stats (aggregate) ──
      if (eventType === 'answer_click' && event.answer_id) {
        const today = new Date().toISOString().split('T')[0]
        const { data: existing } = await supabase
          .from('quiz_answer_stats')
          .select('id, total_clicks, unique_users')
          .eq('funnel_id', funnelId)
          .eq('step_order', event.step_order || 0)
          .eq('answer_id', event.answer_id)
          .eq('date', today)
          .single()

        if (existing) {
          await supabase
            .from('quiz_answer_stats')
            .update({
              total_clicks: existing.total_clicks + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('quiz_answer_stats')
            .insert({
              funnel_id: funnelId,
              step_order: event.step_order || 0,
              answer_id: event.answer_id,
              answer_text: event.answer_text || '',
              total_clicks: 1,
              unique_users: 1,
              date: today,
            })
        }
      }

      eventsProcessed++
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventsProcessed,
        sessions: Array.from(processedSessions),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('[quiz-track] Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})

async function triggerAIAnalysis(funnelId: string, supabase: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return

  try {
    await fetch(`${supabaseUrl}/functions/v1/ai-quiz-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ funnel_id: funnelId, analysis_type: 'auto' }),
    })
  } catch (e) {
    console.error('[quiz-track] AI analysis trigger error:', e.message)
  }
}
