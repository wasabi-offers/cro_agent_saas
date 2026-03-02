import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDateRange } from '@/lib/date-range';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const { start, end } = getDateRange(days);

    const supabase = getSupabase();

    let query = supabase
      .from('ai_behavioral_insights')
      .select('detected_intent, behavioral_segment, engagement_score, predicted_action, prediction_confidence, friction_points, recommended_intervention, intervention_executed, intervention_result, latency_ms, analyzed_at')
      .gte('analyzed_at', start)
      .order('analyzed_at', { ascending: false })
      .limit(500);
    if (end) query = query.lt('analyzed_at', end);

    const { data: insights } = await query;

    const intentMap = new Map<string, number>();
    const segmentMap = new Map<string, number>();
    const predictionMap = new Map<string, number>();
    const interventionMap = new Map<string, { total: number; executed: number; converted: number }>();
    let totalEngagement = 0;
    let totalConfidence = 0;
    let count = 0;

    insights?.forEach(i => {
      count++;
      totalEngagement += i.engagement_score || 0;
      totalConfidence += Number(i.prediction_confidence) || 0;

      const intent = i.detected_intent || 'unknown';
      intentMap.set(intent, (intentMap.get(intent) || 0) + 1);

      const segment = i.behavioral_segment || 'unknown';
      segmentMap.set(segment, (segmentMap.get(segment) || 0) + 1);

      const prediction = i.predicted_action || 'unknown';
      predictionMap.set(prediction, (predictionMap.get(prediction) || 0) + 1);

      const intervention = i.recommended_intervention || 'none';
      if (!interventionMap.has(intervention)) {
        interventionMap.set(intervention, { total: 0, executed: 0, converted: 0 });
      }
      const iv = interventionMap.get(intervention)!;
      iv.total++;
      if (i.intervention_executed) iv.executed++;
      if (i.intervention_result === 'converted') iv.converted++;
    });

    const toArray = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      success: true,
      totalAnalyses: count,
      avgEngagement: count > 0 ? Math.round(totalEngagement / count) : 0,
      avgConfidence: count > 0 ? Math.round((totalConfidence / count) * 100) : 0,
      intents: toArray(intentMap),
      segments: toArray(segmentMap),
      predictions: toArray(predictionMap),
      interventions: Array.from(interventionMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .filter(i => i.name !== 'none')
        .sort((a, b) => b.total - a.total),
      recentInsights: insights?.slice(0, 20) || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
