import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Lightweight endpoint called by the client tracker every ~15s.
 * Returns the latest AI recommendation for a given session without
 * performing a new Gemini call -- it reads from the most recent
 * ai_behavioral_insights row written by ai-analyze-behavior.
 *
 * If no insight exists yet, or it's stale (>60s), it triggers
 * a quick rule-based fallback so the client always gets a response.
 */

const STALE_THRESHOLD_MS = 60_000

interface RecommendRequest {
  session_id: string
  user_id?: string
  time_on_page?: number
  scroll_depth?: number
  cta_clicks?: number
  exit_intents?: number
  rage_clicks?: number
  current_section?: string
}

function ruleFallback(req: RecommendRequest): { action: string; params: Record<string, unknown>; source: string } {
  const t = req.time_on_page || 0
  const scroll = req.scroll_depth || 0
  const ctaClicks = req.cta_clicks || 0
  const exitIntents = req.exit_intents || 0
  const rageClicks = req.rage_clicks || 0

  if (exitIntents > 0 && ctaClicks === 0 && t > 10) {
    return {
      action: 'show_exit_offer',
      params: { message: 'Wait! Get 10% off before you go.', position: 'center' },
      source: 'rule_fallback',
    }
  }

  if (rageClicks > 2) {
    return {
      action: 'show_help',
      params: { message: 'Need help? Click here to chat with us.' },
      source: 'rule_fallback',
    }
  }

  if (scroll > 70 && ctaClicks === 0 && t > 30) {
    return {
      action: 'highlight_cta',
      params: { animation: 'pulse', duration: 3000 },
      source: 'rule_fallback',
    }
  }

  if (t > 60 && scroll < 30) {
    return {
      action: 'show_social_proof',
      params: { type: 'recent_purchase', position: 'bottom-left' },
      source: 'rule_fallback',
    }
  }

  return { action: 'none', params: {}, source: 'rule_fallback' }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RecommendRequest = await req.json()
    const { session_id } = body

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: insights } = await supabase
      .rpc('get_latest_ai_insight', { p_session_id: session_id })

    const insight = insights?.[0] || null
    const now = Date.now()

    if (insight && (now - new Date(insight.analyzed_at).getTime()) < STALE_THRESHOLD_MS) {
      const intervention = insight.recommended_intervention || 'none'

      if (intervention !== 'none' && !insight.intervention_executed) {
        await supabase.rpc('log_ai_intervention', {
          p_session_id: session_id,
          p_user_id: body.user_id || null,
          p_insight_id: insight.id,
          p_type: intervention,
          p_params: JSON.stringify(insight.intervention_params || {}),
        })

        await supabase
          .from('ai_behavioral_insights')
          .update({ intervention_executed: true })
          .eq('id', insight.id)
      }

      return new Response(
        JSON.stringify({
          action: intervention,
          params: insight.intervention_params || {},
          source: 'ai',
          meta: {
            intent: insight.detected_intent,
            segment: insight.behavioral_segment,
            engagement: insight.engagement_score,
            predicted_action: insight.predicted_action,
            confidence: insight.prediction_confidence,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    const fallback = ruleFallback(body)

    return new Response(
      JSON.stringify(fallback),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('[AI Recommend] Error:', error.message)
    return new Response(
      JSON.stringify({ action: 'none', params: {}, source: 'error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  }
})
