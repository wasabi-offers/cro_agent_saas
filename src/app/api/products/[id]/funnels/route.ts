import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET funnels for a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    // Fetch funnels for this product
    const { data: funnels, error: funnelsError } = await supabase
      .from('funnels')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (funnelsError) {
      console.error('Error fetching funnels:', funnelsError);
      return NextResponse.json(
        { success: false, error: funnelsError.message },
        { status: 500 }
      );
    }

    // For each funnel, fetch steps and connections
    const enrichedFunnels = await Promise.all(
      (funnels || []).map(async (funnel) => {
        // Fetch steps
        const { data: steps, error: stepsError } = await supabase
          .from('funnel_steps')
          .select('*')
          .eq('funnel_id', funnel.id)
          .order('step_order', { ascending: true });

        if (stepsError) {
          console.error('Error fetching steps:', stepsError);
          return null;
        }

        // Fetch connections
        const { data: connectionRecords, error: connectionsError } = await supabase
          .from('funnel_connections')
          .select('*')
          .eq('funnel_id', funnel.id);

        if (connectionsError) {
          console.error('Error fetching connections:', connectionsError);
        }

        // Map steps
        const mappedSteps = steps.map((step: any) => ({
          name: step.name,
          url: step.url || '',
          visitors: step.visitors || 0,
          dropoff: step.dropoff || 0,
          x: step.position_x,
          y: step.position_y,
        }));

        // Map connections to ReactFlow format
        const mappedConnections = (connectionRecords || []).map((conn: any) => {
          // Find source and target step indices
          const sourceIndex = steps.findIndex((s: any) => s.id === conn.source_step_id);
          const targetIndex = steps.findIndex((s: any) => s.id === conn.target_step_id);

          return {
            source: `step-${sourceIndex + 1}`,
            target: `step-${targetIndex + 1}`,
          };
        });

        // Get live stats from tracking_events
        const { data: events } = await supabase
          .from('tracking_events')
          .select('funnel_step_name, session_id')
          .eq('funnel_id', funnel.id)
          .eq('event_type', 'funnel_step')
          .not('funnel_step_name', 'is', null);

        // Count unique visitors per step
        const stepStats = new Map<string, Set<string>>();
        (events || []).forEach((event: any) => {
          if (!stepStats.has(event.funnel_step_name)) {
            stepStats.set(event.funnel_step_name, new Set());
          }
          stepStats.get(event.funnel_step_name)!.add(event.session_id);
        });

        // Update steps with live data
        const liveSteps = mappedSteps.map((step: any) => {
          const liveVisitors = stepStats.get(step.name)?.size || 0;
          return {
            ...step,
            visitors: liveVisitors,
          };
        });

        // Calculate conversion rate
        const firstStepVisitors = liveSteps[0]?.visitors || 0;
        const lastStepVisitors = liveSteps[liveSteps.length - 1]?.visitors || 0;
        const conversionRate = firstStepVisitors > 0
          ? (lastStepVisitors / firstStepVisitors) * 100
          : 0;

        return {
          id: funnel.id,
          name: funnel.name,
          description: funnel.description,
          conversionRate,
          is_active: funnel.is_active !== false, // Default to true if not set
          steps: liveSteps,
          connections: mappedConnections,
          created_at: funnel.created_at,
          updated_at: funnel.updated_at,
        };
      })
    );

    // Filter out null results
    const validFunnels = enrichedFunnels.filter((f) => f !== null);

    return NextResponse.json({
      success: true,
      funnels: validFunnels,
    });
  } catch (error) {
    console.error("Error in GET /api/products/[id]/funnels:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
