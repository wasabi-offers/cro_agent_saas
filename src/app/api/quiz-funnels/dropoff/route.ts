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
    const days = parseInt(searchParams.get('days') || '30');

    if (!funnelId) {
      return NextResponse.json({ success: false, error: 'funnel_id is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get step definitions
    const { data: steps } = await supabase
      .from('quiz_funnel_steps')
      .select('step_order, step_name, step_type, question_text')
      .eq('funnel_id', funnelId)
      .order('step_order');

    // Get abandoned sessions
    const { data: abandonedSessions } = await supabase
      .from('quiz_sessions')
      .select('dropoff_step, dropoff_reason, total_time_seconds, last_step_reached, answers_given, device_type, source, medium, browser, os')
      .eq('funnel_id', funnelId)
      .eq('status', 'abandoned')
      .gte('started_at', startDate.toISOString())
      .order('abandoned_at', { ascending: false })
      .limit(500);

    // Get all sessions for comparison
    const { data: allSessions } = await supabase
      .from('quiz_sessions')
      .select('status, started_at')
      .eq('funnel_id', funnelId)
      .gte('started_at', startDate.toISOString());

    const allSteps = steps || [];
    const abandoned = abandonedSessions || [];
    const total = allSessions || [];

    const totalStarts = total.length;
    const totalAbandoned = abandoned.length;

    // ── Per-step dropoff analysis ──
    const stepDropoffs = allSteps.map(step => {
      const droppedHere = abandoned.filter(s => s.dropoff_step === step.step_order);
      const dropoffReasons: Record<string, number> = {};
      const deviceBreakdown: Record<string, number> = {};
      const sourceBreakdown: Record<string, number> = {};
      let totalTimeAtDropoff = 0;

      for (const s of droppedHere) {
        const reason = s.dropoff_reason || 'unknown';
        dropoffReasons[reason] = (dropoffReasons[reason] || 0) + 1;

        const device = s.device_type || 'unknown';
        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;

        const source = s.source || 'direct';
        sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;

        totalTimeAtDropoff += s.total_time_seconds || 0;
      }

      // Find last answer before dropoff
      const lastAnswers: Record<string, number> = {};
      for (const s of droppedHere) {
        const answers = s.answers_given || [];
        if (Array.isArray(answers)) {
          const prevStep = answers.find((a: any) => a.step_order === step.step_order - 1);
          if (prevStep) {
            const key = prevStep.answer_text || prevStep.answer_id || 'unknown';
            lastAnswers[key] = (lastAnswers[key] || 0) + 1;
          }
        }
      }

      return {
        stepOrder: step.step_order,
        stepName: step.step_name,
        stepType: step.step_type,
        questionText: step.question_text,
        usersDropped: droppedHere.length,
        dropoffPct: totalAbandoned > 0 ? Math.round((droppedHere.length / totalAbandoned) * 100) : 0,
        dropoffOfTotal: totalStarts > 0 ? Math.round((droppedHere.length / totalStarts) * 100) : 0,
        avgTimeAtDropoff: droppedHere.length > 0
          ? Math.round(totalTimeAtDropoff / droppedHere.length)
          : 0,
        reasons: Object.entries(dropoffReasons)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count),
        deviceBreakdown: Object.entries(deviceBreakdown)
          .map(([device, count]) => ({ device, count }))
          .sort((a, b) => b.count - a.count),
        sourceBreakdown: Object.entries(sourceBreakdown)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count),
        lastAnswerBeforeDropoff: Object.entries(lastAnswers)
          .map(([answer, count]) => ({ answer, count }))
          .sort((a, b) => b.count - a.count),
      };
    });

    // ── Overall dropoff reasons ──
    const overallReasons: Record<string, number> = {};
    for (const s of abandoned) {
      const r = s.dropoff_reason || 'unknown';
      overallReasons[r] = (overallReasons[r] || 0) + 1;
    }

    // ── Dropoff heatmap (step x reason) ──
    const heatmapData: Array<{ step: number; reason: string; count: number }> = [];
    for (const step of allSteps) {
      for (const s of abandoned) {
        if (s.dropoff_step === step.step_order) {
          heatmapData.push({
            step: step.step_order,
            reason: s.dropoff_reason || 'unknown',
            count: 1,
          });
        }
      }
    }

    // Aggregate heatmap
    const heatmapAgg = new Map<string, number>();
    for (const h of heatmapData) {
      const key = `${h.step}|${h.reason}`;
      heatmapAgg.set(key, (heatmapAgg.get(key) || 0) + 1);
    }
    const heatmap = Array.from(heatmapAgg.entries()).map(([key, count]) => {
      const [step, reason] = key.split('|');
      return { step: parseInt(step), reason, count };
    });

    // ── Daily dropoff trend ──
    const dailyDropoffs = new Map<string, number>();
    for (const s of total) {
      const day = new Date(s.started_at).toISOString().split('T')[0];
      if (!dailyDropoffs.has(day)) dailyDropoffs.set(day, 0);
    }
    for (const s of abandoned) {
      const answersArr = s.answers_given || [];
      const firstTs = Array.isArray(answersArr) && answersArr.length > 0
        ? answersArr[0]?.timestamp
        : null;
      if (firstTs) {
        const day = new Date(firstTs).toISOString().split('T')[0];
        dailyDropoffs.set(day, (dailyDropoffs.get(day) || 0) + 1);
      }
    }

    // ── Critical step (highest dropoff) ──
    const criticalStep = stepDropoffs.reduce(
      (max, s) => (s.usersDropped > max.usersDropped ? s : max),
      stepDropoffs[0] || { stepOrder: 0, usersDropped: 0 }
    );

    return NextResponse.json({
      success: true,
      overview: {
        totalStarts,
        totalAbandoned,
        abandonmentRate: totalStarts > 0 ? Math.round((totalAbandoned / totalStarts) * 100) : 0,
        criticalStep: criticalStep ? {
          stepOrder: criticalStep.stepOrder,
          stepName: criticalStep.stepName,
          usersDropped: criticalStep.usersDropped,
        } : null,
      },
      stepDropoffs,
      overallReasons: Object.entries(overallReasons)
        .map(([reason, count]) => ({ reason, count, pct: totalAbandoned > 0 ? Math.round((count / totalAbandoned) * 100) : 0 }))
        .sort((a, b) => b.count - a.count),
      heatmap,
      period: { days },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
