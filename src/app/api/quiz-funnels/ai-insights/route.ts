import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnel_id');
    const analysisType = searchParams.get('type');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = getSupabase();

    let query = supabase
      .from('quiz_ai_insights')
      .select('*')
      .eq('is_dismissed', false)
      .order('analyzed_at', { ascending: false })
      .limit(limit);

    if (funnelId) query = query.eq('funnel_id', funnelId);
    if (analysisType) query = query.eq('analysis_type', analysisType);
    if (severity) query = query.eq('severity', severity);

    const { data: insights, error } = await query;
    if (error) throw error;

    // Group by severity
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const i of insights || []) {
      const sev = i.severity || 'info';
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;

      const type = i.analysis_type || 'general';
      byType[type] = (byType[type] || 0) + 1;
    }

    const actionableInsights = (insights || []).filter(i => i.is_actionable);
    const criticalInsights = (insights || []).filter(i => i.severity === 'critical');

    return NextResponse.json({
      success: true,
      totalInsights: (insights || []).length,
      actionableCount: actionableInsights.length,
      criticalCount: criticalInsights.length,
      bySeverity,
      byType,
      insights: (insights || []).map(i => ({
        id: i.id,
        funnelId: i.funnel_id,
        type: i.analysis_type,
        title: i.insight_title,
        summary: i.insight_summary,
        severity: i.severity,
        affectedStep: i.affected_step,
        affectedAnswer: i.affected_answer_id,
        metrics: i.metrics,
        recommendations: i.recommendations,
        confidence: i.confidence_score,
        dataPointsAnalyzed: i.data_points_analyzed,
        isActionable: i.is_actionable,
        analyzedAt: i.analyzed_at,
        expiresAt: i.expires_at,
        model: i.model_used,
        latencyMs: i.latency_ms,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { funnel_id, days = 30 } = body;

    if (!funnel_id) {
      return NextResponse.json({ success: false, error: 'funnel_id is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-quiz-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ funnel_id, days, analysis_type: 'manual' }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI analysis failed: ${errText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'id and action are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (action === 'dismiss') {
      const { error } = await supabase
        .from('quiz_ai_insights')
        .update({ is_dismissed: true })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Insight dismissed' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
