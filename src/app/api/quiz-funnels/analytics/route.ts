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
      return NextResponse.json(
        { success: false, error: 'funnel_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Funnel info
    const { data: funnel } = await supabase
      .from('quiz_funnels')
      .select('*')
      .eq('id', funnelId)
      .single();

    if (!funnel) {
      return NextResponse.json({ success: false, error: 'Funnel not found' }, { status: 404 });
    }

    // Steps
    const { data: steps } = await supabase
      .from('quiz_funnel_steps')
      .select('*')
      .eq('funnel_id', funnelId)
      .order('step_order');

    // Sessions
    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('funnel_id', funnelId)
      .gte('started_at', startDateStr)
      .order('started_at', { ascending: false })
      .limit(1000);

    // Events
    const { data: events } = await supabase
      .from('quiz_events')
      .select('event_type, step_order, step_name, answer_id, answer_text, time_on_step_seconds, hesitation_detected, user_id, timestamp')
      .eq('funnel_id', funnelId)
      .gte('created_at', startDateStr)
      .limit(5000);

    const allSessions = sessions || [];
    const allEvents = events || [];
    const allSteps = steps || [];

    // ── Overview metrics ──
    const totalStarts = allSessions.length;
    const completed = allSessions.filter(s => s.status === 'completed');
    const abandoned = allSessions.filter(s => s.status === 'abandoned');
    const inProgress = allSessions.filter(s => s.status === 'in_progress');

    const completionRate = totalStarts > 0 ? Math.round((completed.length / totalStarts) * 100) : 0;
    const avgCompletionTime = completed.length > 0
      ? Math.round(completed.reduce((s, c) => s + (c.total_time_seconds || 0), 0) / completed.length)
      : 0;
    const uniqueUsers = new Set(allSessions.map(s => s.user_id)).size;

    // ── Step-by-step funnel ──
    const stepFunnel = allSteps.map(step => {
      const stepViews = allEvents.filter(e => e.step_order === step.step_order && e.event_type === 'step_view');
      const stepAnswers = allEvents.filter(e => e.step_order === step.step_order && e.event_type === 'answer_click');
      const stepDrops = abandoned.filter(s => s.dropoff_step === step.step_order);
      const stepHesitations = allEvents.filter(e => e.step_order === step.step_order && e.hesitation_detected);

      const usersViewed = new Set(stepViews.map(e => e.user_id)).size;
      const usersAnswered = new Set(stepAnswers.map(e => e.user_id)).size;

      return {
        stepOrder: step.step_order,
        stepName: step.step_name,
        stepType: step.step_type,
        questionText: step.question_text,
        usersEntered: usersViewed,
        usersAnswered: usersAnswered,
        usersDropped: stepDrops.length,
        dropoffRate: usersViewed > 0 ? Math.round((stepDrops.length / usersViewed) * 100) : 0,
        conversionFromPrevious: 100,
        avgTimeSeconds: stepAnswers.length > 0
          ? Math.round(stepAnswers.reduce((s, e) => s + (e.time_on_step_seconds || 0), 0) / stepAnswers.length * 100) / 100
          : 0,
        hesitationCount: stepHesitations.length,
        hesitationRate: usersViewed > 0 ? Math.round((stepHesitations.length / usersViewed) * 100) : 0,
      };
    });

    // Calculate conversion from previous step
    for (let i = 1; i < stepFunnel.length; i++) {
      if (stepFunnel[i - 1].usersEntered > 0) {
        stepFunnel[i].conversionFromPrevious = Math.round(
          (stepFunnel[i].usersEntered / stepFunnel[i - 1].usersEntered) * 100
        );
      }
    }

    // ── Top answers per step ──
    const topAnswers: Record<number, Array<{ answerId: string; answerText: string; clicks: number; uniqueUsers: number; pct: number }>> = {};

    for (const step of allSteps) {
      const stepAnswerEvents = allEvents.filter(
        e => e.step_order === step.step_order && e.event_type === 'answer_click' && e.answer_id
      );

      const answerMap = new Map<string, { text: string; clicks: number; users: Set<string> }>();
      for (const e of stepAnswerEvents) {
        if (!answerMap.has(e.answer_id)) {
          answerMap.set(e.answer_id, { text: e.answer_text || e.answer_id, clicks: 0, users: new Set() });
        }
        const entry = answerMap.get(e.answer_id)!;
        entry.clicks++;
        entry.users.add(e.user_id);
      }

      const totalClicks = stepAnswerEvents.length;
      topAnswers[step.step_order] = Array.from(answerMap.entries())
        .map(([id, data]) => ({
          answerId: id,
          answerText: data.text,
          clicks: data.clicks,
          uniqueUsers: data.users.size,
          pct: totalClicks > 0 ? Math.round((data.clicks / totalClicks) * 100) : 0,
        }))
        .sort((a, b) => b.clicks - a.clicks);
    }

    // ── Dropoff reasons ──
    const dropoffReasons: Record<string, number> = {};
    for (const s of abandoned) {
      const reason = s.dropoff_reason || 'unknown';
      dropoffReasons[reason] = (dropoffReasons[reason] || 0) + 1;
    }

    // ── Device breakdown ──
    const deviceMap = new Map<string, number>();
    for (const s of allSessions) {
      const dt = s.device_type || 'unknown';
      deviceMap.set(dt, (deviceMap.get(dt) || 0) + 1);
    }
    const devices = Array.from(deviceMap.entries())
      .map(([name, count]) => ({ name, count, pct: Math.round((count / totalStarts) * 100) }))
      .sort((a, b) => b.count - a.count);

    // ── Source breakdown ──
    const sourceMap = new Map<string, { starts: number; completions: number }>();
    for (const s of allSessions) {
      const src = s.source || 'direct';
      if (!sourceMap.has(src)) sourceMap.set(src, { starts: 0, completions: 0 });
      sourceMap.get(src)!.starts++;
      if (s.status === 'completed') sourceMap.get(src)!.completions++;
    }
    const sources = Array.from(sourceMap.entries())
      .map(([name, data]) => ({
        name,
        starts: data.starts,
        completions: data.completions,
        completionRate: data.starts > 0 ? Math.round((data.completions / data.starts) * 100) : 0,
      }))
      .sort((a, b) => b.starts - a.starts);

    // ── Daily trend ──
    const dailyMap = new Map<string, { starts: number; completions: number; abandonments: number }>();
    for (const s of allSessions) {
      const day = new Date(s.started_at).toISOString().split('T')[0];
      if (!dailyMap.has(day)) dailyMap.set(day, { starts: 0, completions: 0, abandonments: 0 });
      dailyMap.get(day)!.starts++;
      if (s.status === 'completed') dailyMap.get(day)!.completions++;
      if (s.status === 'abandoned') dailyMap.get(day)!.abandonments++;
    }
    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      funnel: {
        id: funnel.id,
        name: funnel.name,
        slug: funnel.slug,
      },
      overview: {
        totalStarts,
        totalCompleted: completed.length,
        totalAbandoned: abandoned.length,
        totalInProgress: inProgress.length,
        completionRate,
        avgCompletionTimeSeconds: avgCompletionTime,
        uniqueUsers,
        totalSteps: allSteps.length,
      },
      stepFunnel,
      topAnswers,
      dropoffReasons: Object.entries(dropoffReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
      devices,
      sources,
      dailyTrend,
      period: { days, startDate: startDateStr },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
