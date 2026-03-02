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
    const stepOrder = searchParams.get('step');
    const days = parseInt(searchParams.get('days') || '30');

    if (!funnelId) {
      return NextResponse.json({ success: false, error: 'funnel_id is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build event query
    let eventsQuery = supabase
      .from('quiz_events')
      .select('step_order, step_name, answer_id, answer_text, answer_value, time_on_step_seconds, hesitation_detected, user_id, event_type, timestamp')
      .eq('funnel_id', funnelId)
      .in('event_type', ['answer_click', 'answer_change', 'option_hover'])
      .gte('created_at', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(5000);

    if (stepOrder) {
      eventsQuery = eventsQuery.eq('step_order', parseInt(stepOrder));
    }

    const { data: events } = await eventsQuery;

    // Get sessions for completion correlation
    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select('user_id, status, answers_given')
      .eq('funnel_id', funnelId)
      .gte('started_at', startDate.toISOString());

    const allEvents = events || [];
    const allSessions = sessions || [];
    const completedUsers = new Set(allSessions.filter(s => s.status === 'completed').map(s => s.user_id));
    const abandonedUsers = new Set(allSessions.filter(s => s.status === 'abandoned').map(s => s.user_id));

    // Group by step
    const stepMap = new Map<number, {
      stepName: string;
      answers: Map<string, {
        text: string;
        value: string;
        clicks: number;
        changes: number;
        hovers: number;
        users: Set<string>;
        completedUsers: Set<string>;
        abandonedUsers: Set<string>;
        times: number[];
        hesitations: number;
      }>;
    }>();

    for (const e of allEvents) {
      if (!e.answer_id) continue;
      const so = e.step_order || 0;

      if (!stepMap.has(so)) {
        stepMap.set(so, { stepName: e.step_name || `Step ${so}`, answers: new Map() });
      }

      const stepData = stepMap.get(so)!;

      if (!stepData.answers.has(e.answer_id)) {
        stepData.answers.set(e.answer_id, {
          text: e.answer_text || e.answer_id,
          value: e.answer_value || e.answer_id,
          clicks: 0,
          changes: 0,
          hovers: 0,
          users: new Set(),
          completedUsers: new Set(),
          abandonedUsers: new Set(),
          times: [],
          hesitations: 0,
        });
      }

      const ansData = stepData.answers.get(e.answer_id)!;

      if (e.event_type === 'answer_click') {
        ansData.clicks++;
        ansData.users.add(e.user_id);
        if (e.time_on_step_seconds) ansData.times.push(e.time_on_step_seconds);
        if (e.hesitation_detected) ansData.hesitations++;
        if (completedUsers.has(e.user_id)) ansData.completedUsers.add(e.user_id);
        if (abandonedUsers.has(e.user_id)) ansData.abandonedUsers.add(e.user_id);
      } else if (e.event_type === 'answer_change') {
        ansData.changes++;
      } else if (e.event_type === 'option_hover') {
        ansData.hovers++;
      }
    }

    // Build response
    const answerAnalysis = Array.from(stepMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([stepOrd, data]) => {
        const totalClicks = Array.from(data.answers.values()).reduce((s, a) => s + a.clicks, 0);

        return {
          stepOrder: stepOrd,
          stepName: data.stepName,
          totalClicks,
          answers: Array.from(data.answers.entries())
            .map(([id, a]) => ({
              answerId: id,
              answerText: a.text,
              answerValue: a.value,
              totalClicks: a.clicks,
              uniqueUsers: a.users.size,
              percentage: totalClicks > 0 ? Math.round((a.clicks / totalClicks) * 100) : 0,
              answerChanges: a.changes,
              optionHovers: a.hovers,
              avgTimeBeforeClick: a.times.length > 0
                ? Math.round(a.times.reduce((s, t) => s + t, 0) / a.times.length * 100) / 100
                : 0,
              hesitationCount: a.hesitations,
              completionCorrelation: {
                usersWhoCompleted: a.completedUsers.size,
                usersWhoAbandoned: a.abandonedUsers.size,
                completionRate: a.users.size > 0
                  ? Math.round((a.completedUsers.size / a.users.size) * 100)
                  : 0,
              },
            }))
            .sort((a, b) => b.totalClicks - a.totalClicks),
        };
      });

    // ── Most popular answer path (for completed users) ──
    const completedPaths: Array<Record<number, string>> = [];
    for (const s of allSessions) {
      if (s.status === 'completed' && s.answers_given && Array.isArray(s.answers_given)) {
        const path: Record<number, string> = {};
        for (const a of s.answers_given) {
          path[a.step_order] = a.answer_text || a.answer_id;
        }
        completedPaths.push(path);
      }
    }

    // Find most common path
    const pathStrings = completedPaths.map(p =>
      Object.entries(p).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([, v]) => v).join(' → ')
    );
    const pathCounts = new Map<string, number>();
    for (const p of pathStrings) {
      pathCounts.set(p, (pathCounts.get(p) || 0) + 1);
    }
    const topPaths = Array.from(pathCounts.entries())
      .map(([path, count]) => ({ path, count, pct: completedPaths.length > 0 ? Math.round((count / completedPaths.length) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      answerAnalysis,
      topCompletionPaths: topPaths,
      period: { days },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
