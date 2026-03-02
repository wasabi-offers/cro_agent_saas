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
    const funnelId = searchParams.get('funnel_id');
    const days = parseInt(searchParams.get('days') || '30');
    const { start, end } = getDateRange(days);

    const supabase = getSupabase();

    if (funnelId) {
      let query = supabase
        .from('tracking_events')
        .select('funnel_step_name, funnel_step_order, session_id')
        .eq('event_type', 'funnel_step')
        .eq('funnel_id', funnelId)
        .gte('created_at', start);
      if (end) query = query.lt('created_at', end);

      const { data: steps } = await query;

      const stepMap = new Map<string, { name: string; order: number; sessions: Set<string> }>();
      steps?.forEach(s => {
        const key = s.funnel_step_name || `Step ${s.funnel_step_order}`;
        if (!stepMap.has(key)) {
          stepMap.set(key, { name: key, order: s.funnel_step_order ?? 0, sessions: new Set() });
        }
        stepMap.get(key)!.sessions.add(s.session_id);
      });

      const funnelSteps = Array.from(stepMap.values())
        .sort((a, b) => a.order - b.order)
        .map((s, i, arr) => ({
          name: s.name,
          order: s.order,
          visitors: s.sessions.size,
          dropoff: i > 0 ? arr[i - 1].sessions.size - s.sessions.size : 0,
          dropoffRate: i > 0 && arr[i - 1].sessions.size > 0
            ? Math.round(((arr[i - 1].sessions.size - s.sessions.size) / arr[i - 1].sessions.size) * 100)
            : 0,
          conversionFromPrevious: i > 0 && arr[i - 1].sessions.size > 0
            ? Math.round((s.sessions.size / arr[i - 1].sessions.size) * 100)
            : 100,
        }));

      return NextResponse.json({ success: true, funnelId, steps: funnelSteps });
    }

    let funnelQuery = supabase
      .from('tracking_events')
      .select('funnel_id')
      .not('funnel_id', 'is', null)
      .eq('event_type', 'funnel_step')
      .gte('created_at', start);
    if (end) funnelQuery = funnelQuery.lt('created_at', end);

    const { data: funnels } = await funnelQuery;
    const uniqueFunnels = [...new Set(funnels?.map(f => f.funnel_id).filter(Boolean))];

    return NextResponse.json({ success: true, funnels: uniqueFunnels });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
