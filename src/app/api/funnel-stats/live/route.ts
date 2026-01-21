import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * GET /api/funnel-stats/live?funnelId=xxx
 *
 * Returns LIVE funnel stats directly from tracking_events
 * No database writes - pure read operation for real-time data
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const funnelId = searchParams.get('funnelId');

    console.log('=====================================');
    console.log('🔍 GET /api/funnel-stats/live');
    console.log('Funnel ID:', funnelId);

    if (!funnelId) {
      return NextResponse.json(
        { error: "funnelId is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Get funnel steps (ordered)
    console.log('📊 Fetching funnel steps from database...');
    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('id, name, step_order')
      .eq('funnel_id', funnelId)
      .order('step_order', { ascending: true });

    console.log('Steps found:', steps?.length || 0);
    console.log('Steps:', JSON.stringify(steps));

    if (stepsError || !steps || steps.length === 0) {
      console.error('❌ No steps found:', stepsError);
      return NextResponse.json({
        success: false,
        error: "No steps found for this funnel"
      }, { status: 404 });
    }

    // Query tracking events for this funnel
    console.log('📊 Fetching tracking events from database...');
    const { data: events, error: eventsError } = await supabase
      .from('tracking_events')
      .select('session_id, funnel_step_name, event_type, funnel_id')
      .eq('funnel_id', funnelId)
      .eq('event_type', 'funnel_step');

    console.log('Events query error:', eventsError);
    console.log('Events found:', events?.length || 0);
    console.log('Sample events:', JSON.stringify(events?.slice(0, 3)));

    if (eventsError) {
      console.error("Error fetching tracking events:", eventsError);
      // Return empty stats if no tracking data yet
      return NextResponse.json({
        success: true,
        liveStats: steps.map((step, index) => ({
          stepId: step.id,
          stepName: step.name,
          stepOrder: step.step_order,
          visitors: 0,
          dropoff: 0,
        })),
        conversionRate: 0,
        totalVisitors: 0,
        conversions: 0,
      });
    }

    // Group events by step name and count unique sessions
    console.log('📊 Grouping events by step name...');
    const stepVisitors: { [stepName: string]: Set<string> } = {};

    events?.forEach(event => {
      if (!stepVisitors[event.funnel_step_name]) {
        stepVisitors[event.funnel_step_name] = new Set();
      }
      stepVisitors[event.funnel_step_name].add(event.session_id);
    });

    console.log('Step visitors map:', Object.keys(stepVisitors).map(key => ({
      stepName: key,
      uniqueVisitors: stepVisitors[key].size
    })));

    // Calculate live stats for each step
    const liveStats = [];
    let previousVisitors = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const uniqueVisitors = stepVisitors[step.name]?.size || 0;

      // Calculate dropoff from previous step
      let dropoff = 0;
      if (i > 0 && previousVisitors > 0) {
        dropoff = ((previousVisitors - uniqueVisitors) / previousVisitors) * 100;
      }

      liveStats.push({
        stepId: step.id,
        stepName: step.name,
        stepOrder: step.step_order,
        visitors: uniqueVisitors,
        dropoff: Math.max(0, Math.round(dropoff * 100) / 100),
      });

      previousVisitors = uniqueVisitors;
    }

    // Calculate overall conversion rate
    const firstStepVisitors = liveStats[0]?.visitors || 0;
    const lastStepVisitors = liveStats[liveStats.length - 1]?.visitors || 0;
    const conversionRate = firstStepVisitors > 0
      ? (lastStepVisitors / firstStepVisitors) * 100
      : 0;

    const response = {
      success: true,
      liveStats,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalVisitors: firstStepVisitors,
      conversions: lastStepVisitors,
    };

    console.log('✅ Returning response:', JSON.stringify(response));
    console.log('=====================================');

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Error fetching live stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch live stats", details: error.message },
      { status: 500 }
    );
  }
}
