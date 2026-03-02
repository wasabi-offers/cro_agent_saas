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
    const userId = searchParams.get('user_id');
    const days = parseInt(searchParams.get('days') || '30');
    const { start, end } = getDateRange(days);

    const supabase = getSupabase();

    if (userId) {
      const { data: touchpoints } = await supabase
        .from('attribution_touchpoints')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });

      const { data: user } = await supabase
        .from('tracking_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: aiInsights } = await supabase
        .from('ai_behavioral_insights')
        .select('detected_intent, behavioral_segment, engagement_score, predicted_action, analyzed_at')
        .eq('user_id', userId)
        .order('analyzed_at', { ascending: true })
        .limit(20);

      return NextResponse.json({
        success: true,
        user,
        touchpoints: touchpoints || [],
        aiInsights: aiInsights || [],
      });
    }

    let query = supabase
      .from('tracking_users')
      .select('user_id, first_seen_at, last_seen_at, total_sessions, total_conversions, total_revenue, lifecycle_stage, first_touch_source, first_touch_medium')
      .gte(days <= 1 ? 'last_seen_at' : 'first_seen_at', start)
      .order('last_seen_at', { ascending: false })
      .limit(50);
    if (end) query = query.lt(days <= 1 ? 'last_seen_at' : 'first_seen_at', end);

    const { data: users } = await query;

    return NextResponse.json({ success: true, users: users || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
