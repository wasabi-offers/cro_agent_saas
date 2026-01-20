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
 * POST /api/funnel-stats/calculate
 *
 * Calculates funnel statistics from real tracking data
 * Uses the new advanced tracking system (tracking_events table)
 *
 * Body:
 * {
 *   "funnelId": "funnel_123"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { funnelId } = body;

    if (!funnelId) {
      return NextResponse.json(
        { error: "funnelId is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    console.log(`📊 Calculating stats for funnel: ${funnelId}`);

    // Get funnel info
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, name')
      .eq('id', funnelId)
      .single();

    if (funnelError || !funnel) {
      console.error("❌ Funnel not found:", funnelError);
      return NextResponse.json(
        { error: "Funnel not found" },
        { status: 404 }
      );
    }

    // Get all steps for this funnel (ordered)
    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('id, name, step_order')
      .eq('funnel_id', funnelId)
      .order('step_order', { ascending: true });

    if (stepsError || !steps) {
      console.error("❌ Error fetching steps:", stepsError);
      return NextResponse.json(
        { error: "Failed to fetch steps" },
        { status: 500 }
      );
    }

    if (steps.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No steps found for this funnel"
      });
    }

    // Query tracking events for this funnel
    const { data: events, error: eventsError } = await supabase
      .from('tracking_events')
      .select('session_id, funnel_step_name')
      .eq('funnel_id', funnelId)
      .eq('event_type', 'funnel_step');

    if (eventsError) {
      console.error("❌ Error fetching tracking events:", eventsError);
      return NextResponse.json(
        { error: "Failed to fetch tracking data" },
        { status: 500 }
      );
    }

    console.log(`📈 Found ${events?.length || 0} tracking events`);

    // Group events by step name and count unique sessions
    const stepVisitors: { [stepName: string]: Set<string> } = {};

    events?.forEach(event => {
      if (!stepVisitors[event.funnel_step_name]) {
        stepVisitors[event.funnel_step_name] = new Set();
      }
      stepVisitors[event.funnel_step_name].add(event.session_id);
    });

    const stepStats = [];
    let previousVisitors = 0;

    // Calculate stats for each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const uniqueVisitors = stepVisitors[step.name]?.size || 0;

      // Calculate dropoff from previous step
      let dropoff = 0;
      if (i > 0 && previousVisitors > 0) {
        dropoff = ((previousVisitors - uniqueVisitors) / previousVisitors) * 100;
      }

      stepStats.push({
        stepId: step.id,
        stepName: step.name,
        visitors: uniqueVisitors,
        dropoff: Math.max(0, Math.round(dropoff * 100) / 100),
      });

      // Update step in database
      const { error: updateError } = await supabase
        .from('funnel_steps')
        .update({
          visitors: uniqueVisitors,
          dropoff: Math.max(0, Math.round(dropoff * 100) / 100),
        })
        .eq('id', step.id);

      if (updateError) {
        console.error(`❌ Error updating step ${step.name}:`, updateError);
      } else {
        console.log(`✅ Updated "${step.name}": ${uniqueVisitors} visitors, ${dropoff.toFixed(1)}% dropoff`);
      }

      previousVisitors = uniqueVisitors;
    }

    // Calculate overall conversion rate (last step / first step)
    const firstStepVisitors = stepStats[0]?.visitors || 0;
    const lastStepVisitors = stepStats[stepStats.length - 1]?.visitors || 0;
    const conversionRate = firstStepVisitors > 0
      ? (lastStepVisitors / firstStepVisitors) * 100
      : 0;

    // Update funnel conversion rate
    const { error: funnelUpdateError } = await supabase
      .from('funnels')
      .update({
        conversion_rate: Math.round(conversionRate * 100) / 100,
      })
      .eq('id', funnelId);

    if (funnelUpdateError) {
      console.error(`❌ Error updating funnel:`, funnelUpdateError);
    } else {
      console.log(`✅ Updated funnel "${funnel.name}": ${conversionRate.toFixed(2)}% conversion rate`);
    }

    console.log("✅ Stats calculation complete!");

    return NextResponse.json({
      success: true,
      funnelId: funnel.id,
      funnelName: funnel.name,
      conversionRate: Math.round(conversionRate * 100) / 100,
      steps: stepStats,
    });

  } catch (error: any) {
    console.error("❌ Error calculating funnel stats:", error);
    return NextResponse.json(
      { error: "Failed to calculate stats", details: error.message },
      { status: 500 }
    );
  }
}
