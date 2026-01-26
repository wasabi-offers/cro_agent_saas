import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseKey);
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * GET /api/funnel-paths?funnelId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Analyzes real user paths from tracking_events
 * Returns top transitions (step A → step B) with counts
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const funnelId = searchParams.get('funnelId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!funnelId) {
      return NextResponse.json({ error: 'funnelId is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Get all pageview events for this funnel, ordered by session and time
    let query = supabase
      .from('tracking_events')
      .select('session_id, funnel_step_name, created_at')
      .eq('funnel_id', funnelId)
      .eq('event_type', 'funnel_step')
      .not('funnel_step_name', 'is', null)
      .order('session_id', { ascending: true })
      .order('created_at', { ascending: true });

    if (startDate && endDate) {
      query = query.gte('created_at', `${startDate}T00:00:00Z`);
      query = query.lte('created_at', `${endDate}T23:59:59Z`);
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        success: true,
        transitions: [],
        totalSessions: 0,
        message: 'No tracking data found for this funnel'
      });
    }

    // Build sequences per session
    const sessionPaths: { [sessionId: string]: string[] } = {};

    events.forEach(event => {
      if (!sessionPaths[event.session_id]) {
        sessionPaths[event.session_id] = [];
      }
      // Only add if not duplicate (consecutive same step)
      const lastStep = sessionPaths[event.session_id][sessionPaths[event.session_id].length - 1];
      if (lastStep !== event.funnel_step_name) {
        sessionPaths[event.session_id].push(event.funnel_step_name);
      }
    });

    // Count transitions (A → B)
    const transitionCounts: { [key: string]: number } = {};
    const stepVisits: { [step: string]: number } = {};

    Object.values(sessionPaths).forEach(path => {
      // Count visits per step
      path.forEach(step => {
        stepVisits[step] = (stepVisits[step] || 0) + 1;
      });

      // Count transitions
      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const key = `${from}→${to}`;
        transitionCounts[key] = (transitionCounts[key] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const transitions = Object.entries(transitionCounts)
      .map(([key, count]) => {
        const [from, to] = key.split('→');
        return {
          from,
          to,
          count,
          percentage: ((count / Object.keys(sessionPaths).length) * 100).toFixed(1)
        };
      })
      .sort((a, b) => b.count - a.count);

    // Find entry points (steps that appear first in sessions)
    const entryPoints: { [step: string]: number } = {};
    Object.values(sessionPaths).forEach(path => {
      if (path.length > 0) {
        const firstStep = path[0];
        entryPoints[firstStep] = (entryPoints[firstStep] || 0) + 1;
      }
    });

    // Find exit points (steps that appear last in sessions)
    const exitPoints: { [step: string]: number } = {};
    Object.values(sessionPaths).forEach(path => {
      if (path.length > 0) {
        const lastStep = path[path.length - 1];
        exitPoints[lastStep] = (exitPoints[lastStep] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      transitions,
      totalSessions: Object.keys(sessionPaths).length,
      stepVisits,
      entryPoints: Object.entries(entryPoints)
        .map(([step, count]) => ({ step, count }))
        .sort((a, b) => b.count - a.count),
      exitPoints: Object.entries(exitPoints)
        .map(([step, count]) => ({ step, count }))
        .sort((a, b) => b.count - a.count),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error: any) {
    console.error('Error analyzing funnel paths:', error);
    return NextResponse.json(
      { error: 'Failed to analyze paths', details: error.message },
      { status: 500 }
    );
  }
}
