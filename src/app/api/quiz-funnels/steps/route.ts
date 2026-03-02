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

    if (stepOrder) {
      const step = parseInt(stepOrder);

      const { data: stepDef } = await supabase
        .from('quiz_funnel_steps')
        .select('*')
        .eq('funnel_id', funnelId)
        .eq('step_order', step)
        .single();

      const { data: events } = await supabase
        .from('quiz_events')
        .select('*')
        .eq('funnel_id', funnelId)
        .eq('step_order', step)
        .gte('created_at', startDate.toISOString())
        .order('timestamp', { ascending: false })
        .limit(2000);

      const allEvents = events || [];

      const views = allEvents.filter(e => e.event_type === 'step_view');
      const answers = allEvents.filter(e => e.event_type === 'answer_click');
      const changes = allEvents.filter(e => e.event_type === 'answer_change');
      const hesitations = allEvents.filter(e => e.event_type === 'hesitation' || e.hesitation_detected);
      const hovers = allEvents.filter(e => e.event_type === 'option_hover');
      const backs = allEvents.filter(e => e.event_type === 'step_back');
      const exits = allEvents.filter(e => e.event_type === 'exit_intent_on_step');

      const uniqueViewers = new Set(views.map(e => e.user_id)).size;
      const uniqueAnswerers = new Set(answers.map(e => e.user_id)).size;

      // Answer distribution
      const answerMap = new Map<string, { text: string; clicks: number; users: Set<string>; times: number[] }>();
      for (const e of answers) {
        if (!e.answer_id) continue;
        if (!answerMap.has(e.answer_id)) {
          answerMap.set(e.answer_id, { text: e.answer_text || e.answer_id, clicks: 0, users: new Set(), times: [] });
        }
        const entry = answerMap.get(e.answer_id)!;
        entry.clicks++;
        entry.users.add(e.user_id);
        if (e.time_on_step_seconds) entry.times.push(e.time_on_step_seconds);
      }

      const answerDistribution = Array.from(answerMap.entries())
        .map(([id, data]) => ({
          answerId: id,
          answerText: data.text,
          totalClicks: data.clicks,
          uniqueUsers: data.users.size,
          percentage: answers.length > 0 ? Math.round((data.clicks / answers.length) * 100) : 0,
          avgTimeBeforeClick: data.times.length > 0
            ? Math.round(data.times.reduce((s, t) => s + t, 0) / data.times.length * 100) / 100
            : 0,
        }))
        .sort((a, b) => b.totalClicks - a.totalClicks);

      // Time distribution
      const timeBuckets: Record<string, number> = {
        '0-3s': 0, '3-5s': 0, '5-10s': 0, '10-20s': 0, '20-30s': 0, '30s+': 0
      };
      for (const e of answers) {
        const t = e.time_on_step_seconds || 0;
        if (t <= 3) timeBuckets['0-3s']++;
        else if (t <= 5) timeBuckets['3-5s']++;
        else if (t <= 10) timeBuckets['5-10s']++;
        else if (t <= 20) timeBuckets['10-20s']++;
        else if (t <= 30) timeBuckets['20-30s']++;
        else timeBuckets['30s+']++;
      }

      // Hover analysis
      const hoverMap = new Map<string, number>();
      for (const e of hovers) {
        if (!e.answer_id) continue;
        hoverMap.set(e.answer_id, (hoverMap.get(e.answer_id) || 0) + 1);
      }

      return NextResponse.json({
        success: true,
        step: {
          definition: stepDef,
          metrics: {
            uniqueViewers,
            uniqueAnswerers,
            answerRate: uniqueViewers > 0 ? Math.round((uniqueAnswerers / uniqueViewers) * 100) : 0,
            totalAnswerChanges: changes.length,
            totalHesitations: hesitations.length,
            hesitationRate: uniqueViewers > 0 ? Math.round((hesitations.length / uniqueViewers) * 100) : 0,
            totalBackNavigations: backs.length,
            totalExitIntents: exits.length,
            avgTimeSeconds: answers.length > 0
              ? Math.round(
                  answers.reduce((s, e) => s + (e.time_on_step_seconds || 0), 0) / answers.length * 100
                ) / 100
              : 0,
          },
          answerDistribution,
          timeDistribution: Object.entries(timeBuckets).map(([bucket, count]) => ({ bucket, count })),
          hoverAnalysis: Array.from(hoverMap.entries())
            .map(([id, count]) => ({
              answerId: id,
              hoverCount: count,
              answerText: answerMap.get(id)?.text || id,
            }))
            .sort((a, b) => b.hoverCount - a.hoverCount),
        },
      });
    }

    // Return all steps overview
    const { data: allSteps } = await supabase
      .from('quiz_funnel_steps')
      .select('*')
      .eq('funnel_id', funnelId)
      .order('step_order');

    return NextResponse.json({ success: true, steps: allSteps || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { funnel_id, steps } = body;

    if (!funnel_id || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { success: false, error: 'funnel_id and steps array required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const stepsData = steps.map((s: any, i: number) => ({
      funnel_id,
      step_order: s.step_order ?? i + 1,
      step_name: s.step_name || `Step ${i + 1}`,
      step_type: s.step_type || 'question',
      question_text: s.question_text || null,
      answers: s.answers || [],
      is_required: s.is_required !== false,
      is_branching: s.is_branching || false,
      branching_rules: s.branching_rules || [],
      metadata: s.metadata || {},
    }));

    const { data, error } = await supabase
      .from('quiz_funnel_steps')
      .upsert(stepsData, { onConflict: 'funnel_id,step_order' })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, steps: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
