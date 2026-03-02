import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

const SYSTEM_PROMPT = `You are an AI attribution analyst for digital marketing.
Given a user's complete journey (all touchpoints from first visit to conversion),
you must assign a credit weight to each touchpoint based on its ACTUAL contribution to the conversion.

Unlike static models (first-touch, last-touch, linear), you analyze:
- The engagement depth at each touchpoint (time spent, scroll depth, clicks)
- The content consumed at each stage
- The time gaps between touchpoints
- The channel quality and intent signals
- Whether the touchpoint introduced the user, nurtured them, or closed the deal

You MUST respond with valid JSON only.`

const ATTRIBUTION_PROMPT = `Analyze this complete conversion journey and assign AI-powered attribution credits.

CONVERSION:
- Type: {conversion_type}
- Value: {conversion_value} EUR
- Date: {conversion_date}

USER PROFILE:
- First seen: {first_seen}
- Total sessions: {total_sessions}
- Device: {device}
- First touch: {first_touch}
- Last touch: {last_touch}

COMPLETE TOUCHPOINT JOURNEY ({touchpoint_count} touchpoints):
{touchpoints_json}

BEHAVIORAL INSIGHTS (AI analysis during journey):
{insights_json}

Rules:
1. All credits MUST sum to exactly 1.0
2. Each credit must be between 0.0 and 1.0
3. Consider engagement depth, not just position
4. A touchpoint where user spent 5 minutes reading deserves more than a 2-second bounce
5. The introducing touchpoint and the closing touchpoint often deserve more, but nurturing matters too

Respond with:
{
  "attribution": [
    {
      "touchpoint_id": "uuid",
      "source": "channel source",
      "medium": "channel medium",
      "credit": 0.XX,
      "reasoning": "Why this touchpoint deserves this credit"
    }
  ],
  "journey_analysis": "Overall journey description",
  "key_insight": "The single most important finding about this conversion path"
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
      )
    }

    const body = await req.json()
    const { conversion_id, user_id } = body

    if (!conversion_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'conversion_id and user_id required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const [conversionRes, touchpointsRes, userRes, insightsRes] = await Promise.all([
      supabase
        .from('attribution_conversions')
        .select('*')
        .eq('id', conversion_id)
        .single(),
      supabase
        .from('attribution_touchpoints')
        .select('*')
        .eq('user_id', user_id)
        .order('timestamp', { ascending: true }),
      supabase
        .from('tracking_users')
        .select('*')
        .eq('user_id', user_id)
        .single(),
      supabase
        .from('ai_behavioral_insights')
        .select('detected_intent, behavioral_segment, engagement_score, predicted_action, friction_points, analyzed_at')
        .eq('user_id', user_id)
        .order('analyzed_at', { ascending: true })
        .limit(20),
    ])

    const conversion = conversionRes.data
    const touchpoints = touchpointsRes.data || []
    const user = userRes.data
    const insights = insightsRes.data || []

    if (!conversion) {
      return new Response(
        JSON.stringify({ error: 'Conversion not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 },
      )
    }

    if (touchpoints.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No touchpoints found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 },
      )
    }

    const touchpointsSummary = touchpoints.map((tp, i) => ({
      index: i + 1,
      id: tp.id,
      type: tp.touchpoint_type,
      source: tp.source,
      medium: tp.medium,
      campaign: tp.campaign,
      page_title: tp.page_title,
      page_path: tp.page_path,
      is_conversion: tp.is_conversion,
      device: tp.device_type,
      timestamp: new Date(tp.timestamp).toISOString(),
    }))

    const insightsSummary = insights.map(ins => ({
      intent: ins.detected_intent,
      segment: ins.behavioral_segment,
      engagement: ins.engagement_score,
      prediction: ins.predicted_action,
      friction: ins.friction_points,
      when: ins.analyzed_at,
    }))

    const prompt = ATTRIBUTION_PROMPT
      .replace('{conversion_type}', conversion.conversion_type || 'purchase')
      .replace('{conversion_value}', String(conversion.conversion_value || 0))
      .replace('{conversion_date}', conversion.converted_at || 'unknown')
      .replace('{first_seen}', user?.first_seen_at || 'unknown')
      .replace('{total_sessions}', String(user?.total_sessions || 1))
      .replace('{device}', user?.primary_device_type || 'unknown')
      .replace('{first_touch}', `${user?.first_touch_source || 'direct'}/${user?.first_touch_medium || 'none'}`)
      .replace('{last_touch}', `${user?.last_touch_source || 'direct'}/${user?.last_touch_medium || 'none'}`)
      .replace('{touchpoint_count}', String(touchpoints.length))
      .replace('{touchpoints_json}', JSON.stringify(touchpointsSummary, null, 1))
      .replace('{insights_json}', insightsSummary.length > 0
        ? JSON.stringify(insightsSummary, null, 1)
        : 'No AI insights available for this journey')

    const start = Date.now()
    const geminiRes = await fetch(
      `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    )
    const latency = Date.now() - start

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      throw new Error(`Gemini API error ${geminiRes.status}: ${errText}`)
    }

    const geminiData = await geminiRes.json()
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const usage = geminiData.usageMetadata || {}

    let aiResult: { attribution?: Array<{ touchpoint_id: string; source: string; medium: string; credit: number; reasoning: string }>; journey_analysis?: string; key_insight?: string }
    try {
      aiResult = JSON.parse(responseText)
    } catch {
      console.error('[AI Attribution] Parse error:', responseText.substring(0, 200))
      const equalCredit = Number((1 / touchpoints.length).toFixed(4))
      aiResult = {
        attribution: touchpoints.map(tp => ({
          touchpoint_id: tp.id,
          source: tp.source,
          medium: tp.medium,
          credit: equalCredit,
          reasoning: 'Fallback to equal distribution due to parse error',
        })),
        journey_analysis: 'AI analysis failed, using equal distribution',
        key_insight: 'N/A',
      }
    }

    // Normalize credits to sum to 1.0
    const attributions = aiResult.attribution || []
    const totalCredit = attributions.reduce((sum, a) => sum + (a.credit || 0), 0)
    if (totalCredit > 0 && Math.abs(totalCredit - 1.0) > 0.01) {
      for (const a of attributions) {
        a.credit = Number((a.credit / totalCredit).toFixed(4))
      }
    }

    const touchpointsPayload = attributions.map(a => ({
      touchpoint_id: a.touchpoint_id,
      source: a.source || 'unknown',
      medium: a.medium || 'none',
      credit: a.credit,
      reasoning: a.reasoning || '',
    }))

    const { error: saveErr } = await supabase.rpc('save_ai_attribution', {
      p_conversion_id: conversion_id,
      p_user_id: user_id,
      p_touchpoints: JSON.stringify(touchpointsPayload),
      p_model_version: GEMINI_MODEL,
    })

    if (saveErr) console.error('[AI Attribution] Save error:', saveErr.message)

    return new Response(
      JSON.stringify({
        success: true,
        conversion_id,
        attribution: attributions,
        journey_analysis: aiResult.journey_analysis,
        key_insight: aiResult.key_insight,
        meta: {
          model: GEMINI_MODEL,
          latency_ms: latency,
          tokens_used: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
          touchpoints_analyzed: touchpoints.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('[AI Attribution] Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
