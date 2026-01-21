import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalSessions: 0,
            totalUsers: 0,
            avgPagesPerSession: 0,
            avgScrollDepth: 0,
            avgTotalTime: 0,
            avgActiveTime: 0,
            totalDeadClicks: 0,
            totalRageClicks: 0,
            totalQuickbacks: 0,
            botSessions: 0,
            mobilePercentage: 0,
            desktopPercentage: 0,
          },
          byDevice: [],
          uxIssues: [],
        }
      });
    }

    // Get unique sessions count
    const { count: totalSessions } = await supabase
      .from('tracking_sessions')
      .select('*', { count: 'exact', head: true });

    // Get unique users (distinct session_id count is users in this case)
    const { data: sessions } = await supabase
      .from('tracking_sessions')
      .select('session_id, device_type');

    const totalUsers = sessions?.length || 0;

    // Get device breakdown
    const deviceCounts = {
      mobile: sessions?.filter(s => s.device_type === 'mobile').length || 0,
      desktop: sessions?.filter(s => s.device_type === 'desktop').length || 0,
      tablet: sessions?.filter(s => s.device_type === 'tablet').length || 0,
    };

    const mobilePercentage = totalSessions > 0 ? (deviceCounts.mobile / totalSessions) * 100 : 0;
    const desktopPercentage = totalSessions > 0 ? (deviceCounts.desktop / totalSessions) * 100 : 0;

    // Get events data
    const { data: events } = await supabase
      .from('tracking_events')
      .select('event_type, scroll_depth, time_on_page');

    // Calculate UX issues
    const deadClicks = events?.filter(e => e.event_type === 'dead_click').length || 0;
    const rageClicks = events?.filter(e => e.event_type === 'rage_click').length || 0;
    const exitIntents = events?.filter(e => e.event_type === 'exit_intent').length || 0;

    // Calculate scroll depth average
    const scrollEvents = events?.filter(e => e.scroll_depth !== null) || [];
    const avgScrollDepth = scrollEvents.length > 0
      ? scrollEvents.reduce((sum, e) => sum + (e.scroll_depth || 0), 0) / scrollEvents.length
      : 0;

    // Calculate time on page average
    const timeEvents = events?.filter(e => e.time_on_page !== null) || [];
    const avgTotalTime = timeEvents.length > 0
      ? timeEvents.reduce((sum, e) => sum + (e.time_on_page || 0), 0) / timeEvents.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSessions: totalSessions || 0,
          totalUsers,
          avgPagesPerSession: 0, // TODO: implement if needed
          avgScrollDepth,
          avgTotalTime,
          avgActiveTime: avgTotalTime * 0.7, // Estimate active time as 70% of total
          totalDeadClicks: deadClicks,
          totalRageClicks: rageClicks,
          totalQuickbacks: exitIntents,
          botSessions: 0,
          mobilePercentage,
          desktopPercentage,
        },
        byDevice: [
          { device: 'Mobile', sessions: deviceCounts.mobile, percentage: mobilePercentage },
          { device: 'Desktop', sessions: deviceCounts.desktop, percentage: desktopPercentage },
          { device: 'Tablet', sessions: deviceCounts.tablet, percentage: (deviceCounts.tablet / (totalSessions || 1)) * 100 },
        ],
        uxIssues: [
          { type: 'Dead Clicks', count: deadClicks, severity: deadClicks > 100 ? 'HIGH' : deadClicks > 50 ? 'MEDIUM' : 'LOW' },
          { type: 'Rage Clicks', count: rageClicks, severity: rageClicks > 50 ? 'HIGH' : rageClicks > 20 ? 'MEDIUM' : 'LOW' },
          { type: 'Exit Intent', count: exitIntents, severity: exitIntents > 100 ? 'HIGH' : exitIntents > 50 ? 'MEDIUM' : 'LOW' },
        ],
      }
    });
  } catch (error) {
    console.error("Analytics data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
