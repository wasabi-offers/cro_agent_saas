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
 * POST /api/funnel-stats/update
 *
 * Aggiorna i contatori dei funnel_steps basandosi sui dati reali di tracking
 * Calcola:
 * - Visitatori unici per ogni step
 * - Dropoff percentuale tra step consecutivi
 * - Conversion rate complessivo del funnel
 *
 * Body (opzionale):
 * {
 *   "funnelId": "funnel_123" // Se omesso, aggiorna tutti i funnel
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { funnelId } = body;

    const supabase = getSupabaseClient();

    console.log("📊 Updating funnel stats...", funnelId ? `for funnel: ${funnelId}` : "for all funnels");

    // Get funnels to update
    const funnelsQuery = supabase
      .from('funnels')
      .select('id, name');

    if (funnelId) {
      funnelsQuery.eq('id', funnelId);
    }

    const { data: funnels, error: funnelsError } = await funnelsQuery;

    if (funnelsError) {
      console.error("❌ Error fetching funnels:", funnelsError);
      return NextResponse.json(
        { error: "Failed to fetch funnels", details: funnelsError.message },
        { status: 500 }
      );
    }

    if (!funnels || funnels.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No funnels found",
      });
    }

    const results = [];

    // Process each funnel
    for (const funnel of funnels) {
      console.log(`\n📈 Processing funnel: ${funnel.name} (${funnel.id})`);

      // Get all steps for this funnel
      const { data: steps, error: stepsError } = await supabase
        .from('funnel_steps')
        .select('id, name, step_order')
        .eq('funnel_id', funnel.id)
        .order('step_order', { ascending: true });

      if (stepsError || !steps) {
        console.error(`❌ Error fetching steps for ${funnel.id}:`, stepsError);
        continue;
      }

      if (steps.length === 0) {
        console.log(`⚠️ No steps found for funnel ${funnel.id}`);
        continue;
      }

      const stepStats = [];

      // Calculate stats for each step
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // Count unique visitors for this step
        const { data: visitorData, error: visitorError } = await supabase
          .from('funnel_tracking_events')
          .select('session_id')
          .eq('funnel_id', funnel.id)
          .eq('step_id', step.id);

        if (visitorError) {
          console.error(`❌ Error counting visitors for step ${step.name}:`, visitorError);
          continue;
        }

        const uniqueVisitors = new Set(visitorData?.map(e => e.session_id) || []).size;

        // Calculate dropoff from previous step
        let dropoff = 0;
        if (i > 0) {
          const previousStepVisitors = stepStats[i - 1].visitors;
          if (previousStepVisitors > 0) {
            dropoff = ((previousStepVisitors - uniqueVisitors) / previousStepVisitors) * 100;
          }
        }

        stepStats.push({
          stepId: step.id,
          stepName: step.name,
          visitors: uniqueVisitors,
          dropoff: Math.max(0, dropoff), // Ensure non-negative
        });

        // Update step in database
        const { error: updateError } = await supabase
          .from('funnel_steps')
          .update({
            visitors: uniqueVisitors,
            dropoff: Math.round(dropoff * 100) / 100, // Round to 2 decimals
          })
          .eq('id', step.id);

        if (updateError) {
          console.error(`❌ Error updating step ${step.name}:`, updateError);
        } else {
          console.log(`✅ Updated step "${step.name}": ${uniqueVisitors} visitors, ${dropoff.toFixed(1)}% dropoff`);
        }
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
        .eq('id', funnel.id);

      if (funnelUpdateError) {
        console.error(`❌ Error updating funnel ${funnel.name}:`, funnelUpdateError);
      } else {
        console.log(`✅ Updated funnel "${funnel.name}": ${conversionRate.toFixed(2)}% conversion rate`);
      }

      results.push({
        funnelId: funnel.id,
        funnelName: funnel.name,
        conversionRate: Math.round(conversionRate * 100) / 100,
        steps: stepStats,
      });
    }

    console.log("\n✅ Funnel stats update complete!");

    return NextResponse.json({
      success: true,
      message: `Updated stats for ${results.length} funnel(s)`,
      results,
    });

  } catch (error: any) {
    console.error("❌ Error updating funnel stats:", error);
    return NextResponse.json(
      { error: "Failed to update funnel stats", details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to trigger update via URL
export async function GET(req: NextRequest) {
  // Allow triggering via GET for easy testing/cron
  const searchParams = req.nextUrl.searchParams;
  const funnelId = searchParams.get('funnelId');

  const fakeRequest = new Request(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(funnelId ? { funnelId } : {}),
  });

  return POST(fakeRequest as NextRequest);
}
