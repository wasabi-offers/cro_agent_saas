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
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'session_id required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: events } = await supabase
      .from('tracking_events')
      .select('event_type, timestamp, url, path, title, click_x, click_y, click_element, click_element_text, is_cta_click, scroll_percentage, max_scroll_depth, form_id, form_name, form_field_name, form_action, funnel_step_name, time_on_page')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })
      .limit(200);

    const { data: session } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    const { data: aiInsights } = await supabase
      .from('ai_behavioral_insights')
      .select('detected_intent, behavioral_segment, engagement_score, recommended_intervention, analyzed_at')
      .eq('session_id', sessionId)
      .order('analyzed_at', { ascending: true });

    const filteredEvents = events?.filter(e =>
      !['mousemove', 'time_on_page'].includes(e.event_type)
    ) || [];

    return NextResponse.json({
      success: true,
      session,
      events: filteredEvents,
      aiInsights: aiInsights || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
