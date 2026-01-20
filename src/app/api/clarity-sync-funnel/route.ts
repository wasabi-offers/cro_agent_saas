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
 * POST /api/clarity-sync-funnel
 *
 * Sincronizza i dati di Clarity con i funnel esistenti
 * Usa l'API Export Data di Clarity filtrata per URL per ogni step
 *
 * Body:
 * {
 *   "funnelId": "funnel_123",
 *   "clarityApiKey": "your_clarity_api_key",
 *   "numOfDays": 7 // optional, default 7
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { funnelId, clarityApiKey, numOfDays = 7 } = await req.json();

    if (!funnelId) {
      return NextResponse.json(
        { error: "funnelId is required" },
        { status: 400 }
      );
    }

    if (!clarityApiKey) {
      return NextResponse.json(
        { error: "clarityApiKey is required. Get it from clarity.microsoft.com → Settings → API" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    console.log(`📊 Syncing Clarity data for funnel: ${funnelId}`);

    // Get funnel and steps
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, name')
      .eq('id', funnelId)
      .single();

    if (funnelError || !funnel) {
      return NextResponse.json(
        { error: "Funnel not found" },
        { status: 404 }
      );
    }

    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('id, name, url, step_order')
      .eq('funnel_id', funnelId)
      .order('step_order', { ascending: true });

    if (stepsError || !steps || steps.length === 0) {
      return NextResponse.json(
        { error: "No steps found for this funnel" },
        { status: 404 }
      );
    }

    console.log(`✅ Found ${steps.length} steps in funnel "${funnel.name}"`);

    // Check if steps have URLs configured
    const stepsWithoutUrls = steps.filter(s => !s.url);
    if (stepsWithoutUrls.length > 0) {
      return NextResponse.json({
        error: "Some steps don't have URLs configured. Please add URLs to all steps in the funnel editor.",
        stepsWithoutUrls: stepsWithoutUrls.map(s => s.name),
      }, { status: 400 });
    }

    const stepStats = [];

    // For each step, get traffic data from Clarity filtered by URL
    for (const step of steps) {
      console.log(`\n📈 Fetching Clarity data for step: ${step.name}`);
      console.log(`   URL: ${step.url}`);

      try {
        // Extract clean URL path for Clarity filter
        const urlObj = new URL(step.url);
        const urlPath = urlObj.pathname;

        // Call Clarity API with URL dimension
        const params = new URLSearchParams({
          numOfDays: numOfDays.toString(),
          dimension1: 'Url', // Filter by URL
        });

        const clarityResponse = await fetch(
          `https://www.clarity.ms/export-data/api/v1/project-live-insights?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${clarityApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!clarityResponse.ok) {
          console.error(`❌ Clarity API error for step ${step.name}:`, clarityResponse.status);

          if (clarityResponse.status === 401) {
            return NextResponse.json(
              { error: 'Invalid Clarity API key. Check your key at clarity.microsoft.com → Settings → API' },
              { status: 401 }
            );
          }

          // Continue with next step even if this one fails
          stepStats.push({
            stepId: step.id,
            stepName: step.name,
            visitors: 0,
            error: `Clarity API error: ${clarityResponse.status}`,
          });
          continue;
        }

        const clarityData = await clarityResponse.json();

        // Find traffic data for this specific URL
        let visitors = 0;

        for (const metric of clarityData) {
          if (metric.metricName === 'Traffic' && metric.information) {
            for (const info of metric.information) {
              // Check if URL matches (case-insensitive, partial match)
              const infoUrl = info.dimension1?.toLowerCase() || '';
              const targetUrl = urlPath.toLowerCase();

              if (infoUrl.includes(targetUrl) || targetUrl.includes(infoUrl)) {
                const sessionCount = parseInt(info.totalSessionCount || '0', 10);
                visitors += sessionCount;
                console.log(`   ✅ Found ${sessionCount} sessions for URL: ${info.dimension1}`);
              }
            }
          }
        }

        console.log(`   📊 Total visitors for "${step.name}": ${visitors}`);

        // Update step in database
        const { error: updateError } = await supabase
          .from('funnel_steps')
          .update({ visitors })
          .eq('id', step.id);

        if (updateError) {
          console.error(`❌ Error updating step ${step.name}:`, updateError);
        }

        stepStats.push({
          stepId: step.id,
          stepName: step.name,
          visitors,
        });

      } catch (error: any) {
        console.error(`❌ Error processing step ${step.name}:`, error);
        stepStats.push({
          stepId: step.id,
          stepName: step.name,
          visitors: 0,
          error: error.message,
        });
      }
    }

    // Calculate dropoff rates
    for (let i = 1; i < stepStats.length; i++) {
      const prevVisitors = stepStats[i - 1].visitors;
      const currentVisitors = stepStats[i].visitors;

      const dropoff = prevVisitors > 0
        ? ((prevVisitors - currentVisitors) / prevVisitors) * 100
        : 0;

      stepStats[i].dropoff = Math.round(dropoff * 100) / 100;

      // Update dropoff in database
      await supabase
        .from('funnel_steps')
        .update({ dropoff })
        .eq('id', stepStats[i].stepId);
    }

    // Calculate conversion rate (last / first)
    const firstStepVisitors = stepStats[0]?.visitors || 0;
    const lastStepVisitors = stepStats[stepStats.length - 1]?.visitors || 0;
    const conversionRate = firstStepVisitors > 0
      ? (lastStepVisitors / firstStepVisitors) * 100
      : 0;

    // Update funnel conversion rate
    await supabase
      .from('funnels')
      .update({ conversion_rate: Math.round(conversionRate * 100) / 100 })
      .eq('id', funnelId);

    console.log(`\n✅ Clarity sync complete!`);
    console.log(`   Conversion rate: ${conversionRate.toFixed(2)}%`);

    return NextResponse.json({
      success: true,
      funnel: {
        id: funnelId,
        name: funnel.name,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      steps: stepStats,
      syncedAt: new Date().toISOString(),
      dataRange: `Last ${numOfDays} days`,
    });

  } catch (error: any) {
    console.error("❌ Error syncing Clarity data:", error);
    return NextResponse.json(
      { error: "Failed to sync Clarity data", details: error.message },
      { status: 500 }
    );
  }
}
