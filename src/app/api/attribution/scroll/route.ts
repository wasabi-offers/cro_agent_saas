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
    const days = parseInt(searchParams.get('days') || '30');
    const { start, end } = getDateRange(days);

    const supabase = getSupabase();

    let query = supabase
      .from('tracking_events')
      .select('scroll_percentage, max_scroll_depth, session_id')
      .eq('event_type', 'scroll')
      .gte('created_at', start);
    if (end) query = query.lt('created_at', end);

    const { data: scrollEvents } = await query;

    const sessionMaxScroll = new Map<string, number>();
    scrollEvents?.forEach(e => {
      const current = sessionMaxScroll.get(e.session_id) || 0;
      const pct = e.max_scroll_depth || e.scroll_percentage || 0;
      if (pct > current) sessionMaxScroll.set(e.session_id, pct);
    });

    const totalSessions = sessionMaxScroll.size;
    const bands = [];
    for (let i = 0; i <= 90; i += 10) {
      const reached = Array.from(sessionMaxScroll.values()).filter(v => v >= i).length;
      bands.push({
        range: `${i}-${i + 10}%`,
        from: i,
        to: i + 10,
        usersReached: reached,
        percentage: totalSessions > 0 ? Math.round((reached / totalSessions) * 100) : 0,
      });
    }

    return NextResponse.json({
      success: true,
      totalSessions,
      scrollBands: bands,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
