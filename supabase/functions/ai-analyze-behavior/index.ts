import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

const SYSTEM_PROMPT = `You are a CRO (Conversion Rate Optimization) behavioral analyst AI.
You analyze sequences of user events on landing pages and sales funnels to determine:
1. User intent (what they're trying to do)
2. Behavioral segment (what type of buyer they are)
3. Engagement level (how interested they are)
4. Predicted next action (what they'll likely do)
5. Friction points (what's blocking them)
6. Recommended intervention (what we should do to help convert)

You MUST respond with valid JSON only, no markdown, no explanation.`

const ANALYSIS_PROMPT = `Analyze this user behavior sequence on a sales/landing page.

SESSION INFO:
- Device: {device_type} / {browser} / {os}
- Source: {source} / {medium}
- Campaign: {campaign}
- Time on page: {time_on_page}s
- Max scroll: {max_scroll}%
- Total clicks: {total_clicks}
- CTA clicks: {cta_clicks}
- Rage clicks: {rage_clicks}
- Dead clicks: {dead_clicks}
- Form interactions: {form_interactions}
- Exit intents: {exit_intents}

RECENT EVENTS (last {event_count}):
{events_json}

SEMANTIC CONTEXT (what user is looking at):
{semantic_context}

Respond with this exact JSON structure:
{
  "intent": "browsing|comparing|ready_to_buy|confused|leaving|researching|price_checking|trust_seeking",
  "behavioral_segment": "impulse_buyer|researcher|price_sensitive|trust_seeker|window_shopper|returning_prospect",
  "engagement_score": 0-100,
  "predicted_action": "will_convert|will_bounce|will_return_later|needs_nudge|undecided",
  "prediction_confidence": 0.0-1.0,
  "friction_points": ["string describing each friction point detected"],
  "attention_zones": [{"zone": "section name", "time_pct": 0-100, "interest": "high|medium|low"}],
  "recommended_intervention": "none|show_social_proof|highlight_cta|show_exit_offer|simplify_form|show_urgency|show_guarantee|personalize_headline|show_comparison",
  "intervention_params": {},
  "reasoning": "Brief explanation of your analysis"
}`

interface AnalysisRequest {
  session_id: string
  user_id?: string
  events: EventData[]
  session_summary?: SessionSummary
  semantic_context?: SemanticContext
}

interface EventData {
  type: string
  timestamp: number
  [key: string]: unknown
}

interface SessionSummary {
  device_type?: string
  browser?: string
  os?: string
  source?: string
  medium?: string
  campaign?: string
  time_on_page?: number
  max_scroll?: number
  total_clicks?: number
  cta_clicks?: number
  rage_clicks?: number
  dead_clicks?: number
  form_interactions?: number
  exit_intents?: number
}

interface SemanticContext {
  current_section?: string
  visible_content?: string
  price_visible?: boolean
  price_value?: string
  offer_context?: string
  reading_progress?: number
}

function buildAnalysisPrompt(data: AnalysisRequest): string {
  const summary = data.session_summary || {}
  const semantic = data.semantic_context || {}

  const relevantEvents = data.events
    .slice(-30)
    .map(e => ({
      type: e.type,
      ts: e.timestamp,
      ...(e.click_x != null && { click: { x: e.click_x, y: e.click_y, el: e.element, text: e.element_text } }),
      ...(e.scroll_percentage != null && { scroll: e.scroll_percentage }),
      ...(e.form_id != null && { form: { id: e.form_id, field: e.field_name, action: e.form_action } }),
      ...(e.section_topic && { section: e.section_topic }),
    }))

  let prompt = ANALYSIS_PROMPT
    .replace('{device_type}', String(summary.device_type || 'unknown'))
    .replace('{browser}', String(summary.browser || 'unknown'))
    .replace('{os}', String(summary.os || 'unknown'))
    .replace('{source}', String(summary.source || 'direct'))
    .replace('{medium}', String(summary.medium || 'none'))
    .replace('{campaign}', String(summary.campaign || 'none'))
    .replace('{time_on_page}', String(summary.time_on_page || 0))
    .replace('{max_scroll}', String(summary.max_scroll || 0))
    .replace('{total_clicks}', String(summary.total_clicks || 0))
    .replace('{cta_clicks}', String(summary.cta_clicks || 0))
    .replace('{rage_clicks}', String(summary.rage_clicks || 0))
    .replace('{dead_clicks}', String(summary.dead_clicks || 0))
    .replace('{form_interactions}', String(summary.form_interactions || 0))
    .replace('{exit_intents}', String(summary.exit_intents || 0))
    .replace('{event_count}', String(relevantEvents.length))
    .replace('{events_json}', JSON.stringify(relevantEvents, null, 1))

  const semanticStr = semantic.current_section
    ? `Section: ${semantic.current_section}\nContent: ${semantic.visible_content || 'N/A'}\nPrice visible: ${semantic.price_visible || false}\nPrice: ${semantic.price_value || 'N/A'}\nOffer: ${semantic.offer_context || 'N/A'}\nReading progress: ${semantic.reading_progress || 0}%`
    : 'No semantic context available'

  prompt = prompt.replace('{semantic_context}', semanticStr)

  return prompt
}

async function callGemini(prompt: string, apiKey: string): Promise<{ result: Record<string, unknown>; tokens: { prompt: number; completion: number }; latency: number }> {
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
          maxOutputTokens: 1024,
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
    console.error('[AI] Failed to parse Gemini response:', text.substring(0, 200))
    parsed = {
      intent: 'unknown',
      behavioral_segment: 'unknown',
      engagement_score: 50,
      predicted_action: 'undecided',
      prediction_confidence: 0.1,
      friction_points: [],
      attention_zones: [],
      recommended_intervention: 'none',
      intervention_params: {},
      reasoning: 'Parse error - using defaults',
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
    const { session_id, user_id, events, session_summary, semantic_context } = body

    if (!session_id || !events || events.length === 0) {
      return new Response(
        JSON.stringify({ error: 'session_id and events[] required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const prompt = buildAnalysisPrompt(body)
    const { result, tokens, latency } = await callGemini(prompt, geminiKey)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: insightId, error: saveErr } = await supabase.rpc('save_ai_insight', {
      p_session_id: session_id,
      p_user_id: user_id || null,
      p_intent: result.intent || 'unknown',
      p_segment: result.behavioral_segment || 'unknown',
      p_score: Number(result.engagement_score) || 50,
      p_predicted_action: result.predicted_action || 'undecided',
      p_confidence: Number(result.prediction_confidence) || 0,
      p_friction: JSON.stringify(result.friction_points || []),
      p_attention: JSON.stringify(result.attention_zones || []),
      p_intervention: result.recommended_intervention || 'none',
      p_intervention_params: JSON.stringify(result.intervention_params || {}),
      p_events_analyzed: events.length,
      p_model: GEMINI_MODEL,
      p_prompt_tokens: tokens.prompt,
      p_completion_tokens: tokens.completion,
      p_latency_ms: latency,
    })

    if (saveErr) console.error('[AI] Save insight error:', saveErr.message)

    return new Response(
      JSON.stringify({
        success: true,
        insight_id: insightId,
        analysis: {
          intent: result.intent,
          segment: result.behavioral_segment,
          engagement_score: result.engagement_score,
          predicted_action: result.predicted_action,
          confidence: result.prediction_confidence,
          friction_points: result.friction_points,
          recommended_intervention: result.recommended_intervention,
          intervention_params: result.intervention_params,
        },
        meta: {
          model: GEMINI_MODEL,
          latency_ms: latency,
          tokens_used: tokens.prompt + tokens.completion,
          events_analyzed: events.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('[AI] analyze-behavior error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
