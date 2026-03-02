import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

const SYSTEM_PROMPT = `You are a Quiz Funnel Optimization AI expert.
You analyze quiz funnel data to identify:
1. Where users drop off and WHY
2. Which questions cause confusion or hesitation
3. Which answer patterns lead to completion vs abandonment
4. Specific actionable recommendations to improve completion rates
5. User segments based on quiz behavior

You MUST respond with valid JSON only, no markdown, no explanation.`

const ANALYSIS_PROMPT = `Analyze this quiz funnel performance data and provide actionable insights.

QUIZ FUNNEL: {funnel_name}
TOTAL STARTS: {total_starts} | COMPLETIONS: {total_completions} | COMPLETION RATE: {completion_rate}%

STEP-BY-STEP DATA:
{steps_data}

DROPOFF ANALYSIS:
{dropoff_data}

ANSWER DISTRIBUTION:
{answer_data}

RECENT ABANDONMENT PATTERNS:
{abandonment_patterns}

HESITATION DATA:
{hesitation_data}

Respond with this exact JSON structure:
{
  "insights": [
    {
      "type": "dropoff_analysis|answer_pattern|completion_prediction|step_optimization|user_segment_analysis",
      "title": "Clear, actionable title",
      "summary": "Detailed explanation of the finding",
      "severity": "critical|warning|info|success",
      "affected_step": null or step_number,
      "affected_answer": null or "answer_id",
      "metrics": {
        "key_metric_name": value
      },
      "recommendations": [
        {
          "action": "reword_question|simplify_options|add_explanation|reorder_steps|remove_step|split_step|add_progress_indicator|add_social_proof|change_answer_format",
          "details": "Specific actionable recommendation",
          "priority": "high|medium|low",
          "expected_impact": "+X% completion rate"
        }
      ],
      "confidence": 0.0-1.0
    }
  ],
  "overall_score": 0-100,
  "top_priority": "The single most impactful change to make",
  "reasoning": "Brief overall analysis"
}`

interface AnalysisRequest {
  funnel_id: string
  analysis_type?: string
  days?: number
}

interface StepData {
  step_order: number
  step_name: string
  users_viewed: number
  users_answered: number
  users_dropped: number
  dropoff_rate: number
  avg_time_seconds: number
  hesitation_count: number
}

async function callGemini(prompt: string, apiKey: string) {
  const start = Date.now()

  const response = await fetch(
    `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  const latency = Date.now() - start

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  const usage = data.usageMetadata || {}

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(text)
  } catch {
    console.error('[AI Quiz] Failed to parse Gemini response:', text.substring(0, 200))
    parsed = {
      insights: [],
      overall_score: 0,
      top_priority: 'Analysis failed - using defaults',
      reasoning: 'Parse error',
    }
  }

  return {
    result: parsed,
    tokens: {
      prompt: usage.promptTokenCount || 0,
      completion: usage.candidatesTokenCount || 0,
    },
    latency,
  }
}

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

    const body: AnalysisRequest = await req.json()
    const { funnel_id, days = 30 } = body

    if (!funnel_id) {
      return new Response(
        JSON.stringify({ error: 'funnel_id required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString()

    // Fetch funnel info
    const { data: funnel } = await supabase
      .from('quiz_funnels')
      .select('*')
      .eq('id', funnel_id)
      .single()

    if (!funnel) {
      return new Response(
        JSON.stringify({ error: 'Funnel not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 },
      )
    }

    // Fetch step definitions
    const { data: steps } = await supabase
      .from('quiz_funnel_steps')
      .select('*')
      .eq('funnel_id', funnel_id)
      .order('step_order')

    // Fetch events for analysis
    const { data: events } = await supabase
      .from('quiz_events')
      .select('event_type, step_order, step_name, answer_id, answer_text, time_on_step_seconds, hesitation_detected, hesitation_duration_ms, user_id')
      .eq('funnel_id', funnel_id)
      .gte('created_at', startDateStr)
      .order('timestamp', { ascending: false })
      .limit(2000)

    // Fetch sessions for dropoff analysis
    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select('status, dropoff_step, dropoff_reason, total_time_seconds, completion_percentage, last_step_reached, answers_given, device_type, source')
      .eq('funnel_id', funnel_id)
      .gte('created_at', startDateStr)
      .limit(500)

    // Fetch answer stats
    const { data: answerStats } = await supabase
      .from('quiz_answer_stats')
      .select('*')
      .eq('funnel_id', funnel_id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('step_order')

    // Build analysis data
    const stepsData = (steps || []).map(s => {
      const stepEvents = (events || []).filter(e => e.step_order === s.step_order)
      const views = stepEvents.filter(e => e.event_type === 'step_view')
      const answers = stepEvents.filter(e => e.event_type === 'answer_click')
      const drops = (sessions || []).filter(sess => sess.dropoff_step === s.step_order)
      const hesitations = stepEvents.filter(e => e.hesitation_detected)

      return {
        step_order: s.step_order,
        step_name: s.step_name,
        question: s.question_text,
        users_viewed: new Set(views.map(e => e.user_id)).size,
        users_answered: new Set(answers.map(e => e.user_id)).size,
        users_dropped: drops.length,
        avg_time_seconds: answers.length > 0
          ? Math.round(answers.reduce((s, e) => s + (e.time_on_step_seconds || 0), 0) / answers.length * 100) / 100
          : 0,
        hesitation_count: hesitations.length,
        avg_hesitation_ms: hesitations.length > 0
          ? Math.round(hesitations.reduce((s, e) => s + (e.hesitation_duration_ms || 0), 0) / hesitations.length)
          : 0,
      }
    })

    const totalStarts = (sessions || []).length
    const totalCompletions = (sessions || []).filter(s => s.status === 'completed').length
    const completionRate = totalStarts > 0 ? Math.round((totalCompletions / totalStarts) * 100) : 0

    const dropoffData = (sessions || [])
      .filter(s => s.status === 'abandoned')
      .reduce((acc: Record<string, { count: number; reasons: Record<string, number> }>, s) => {
        const step = `step_${s.dropoff_step}`
        if (!acc[step]) acc[step] = { count: 0, reasons: {} }
        acc[step].count++
        const reason = s.dropoff_reason || 'unknown'
        acc[step].reasons[reason] = (acc[step].reasons[reason] || 0) + 1
        return acc
      }, {})

    const answerData = (answerStats || []).reduce((acc: Record<string, Array<{ answer: string; clicks: number }>>, a) => {
      const key = `step_${a.step_order}`
      if (!acc[key]) acc[key] = []
      acc[key].push({ answer: a.answer_text || a.answer_id, clicks: a.total_clicks })
      return acc
    }, {})

    const abandonmentPatterns = (sessions || [])
      .filter(s => s.status === 'abandoned')
      .slice(0, 20)
      .map(s => ({
        dropped_at_step: s.dropoff_step,
        reason: s.dropoff_reason,
        time_spent: s.total_time_seconds,
        steps_answered: s.last_step_reached,
        device: s.device_type,
        source: s.source,
      }))

    const hesitationData = stepsData
      .filter(s => s.hesitation_count > 0)
      .map(s => ({
        step: s.step_order,
        name: s.step_name,
        hesitations: s.hesitation_count,
        avg_hesitation_ms: s.avg_hesitation_ms,
      }))

    // Build prompt
    let prompt = ANALYSIS_PROMPT
      .replace('{funnel_name}', funnel.name)
      .replace('{total_starts}', String(totalStarts))
      .replace('{total_completions}', String(totalCompletions))
      .replace('{completion_rate}', String(completionRate))
      .replace('{steps_data}', JSON.stringify(stepsData, null, 1))
      .replace('{dropoff_data}', JSON.stringify(dropoffData, null, 1))
      .replace('{answer_data}', JSON.stringify(answerData, null, 1))
      .replace('{abandonment_patterns}', JSON.stringify(abandonmentPatterns, null, 1))
      .replace('{hesitation_data}', JSON.stringify(hesitationData, null, 1))

    const { result, tokens, latency } = await callGemini(prompt, geminiKey)

    // Save each insight
    const insights = (result.insights as Array<Record<string, unknown>>) || []
    const savedInsightIds: string[] = []

    for (const insight of insights) {
      const { data: insightId, error: saveErr } = await supabase.rpc('save_quiz_ai_insight', {
        p_funnel_id: funnel_id,
        p_analysis_type: insight.type || 'general',
        p_title: insight.title || 'Untitled insight',
        p_summary: insight.summary || '',
        p_severity: insight.severity || 'info',
        p_affected_step: insight.affected_step || null,
        p_affected_answer: insight.affected_answer || null,
        p_metrics: JSON.stringify(insight.metrics || {}),
        p_recommendations: JSON.stringify(insight.recommendations || []),
        p_data_points: totalStarts,
        p_confidence: Number(insight.confidence) || 0.5,
        p_model: GEMINI_MODEL,
        p_prompt_tokens: tokens.prompt,
        p_completion_tokens: tokens.completion,
        p_latency: latency,
      })

      if (saveErr) {
        console.error('[AI Quiz] Save insight error:', saveErr.message)
      } else if (insightId) {
        savedInsightIds.push(insightId)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        funnel_id,
        funnel_name: funnel.name,
        overall_score: result.overall_score,
        top_priority: result.top_priority,
        insights_count: insights.length,
        saved_insight_ids: savedInsightIds,
        meta: {
          model: GEMINI_MODEL,
          latency_ms: latency,
          tokens_used: tokens.prompt + tokens.completion,
          data_points: totalStarts,
          days_analyzed: days,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('[AI Quiz] Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
