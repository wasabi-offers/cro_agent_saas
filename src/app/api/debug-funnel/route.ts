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

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Get all funnels
    const { data: funnels, error: funnelsError } = await supabase
      .from('funnels')
      .select('*')
      .order('created_at', { ascending: false });

    if (funnelsError) {
      return NextResponse.json({ error: funnelsError.message }, { status: 500 });
    }

    if (funnels.length === 0) {
      return NextResponse.json({ message: 'No funnels found' });
    }

    const funnel = funnels[0]; // Most recent

    // Get steps
    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('*')
      .eq('funnel_id', funnel.id)
      .order('step_order', { ascending: true });

    if (stepsError) {
      return NextResponse.json({ error: stepsError.message }, { status: 500 });
    }

    // Get connections
    const { data: connections, error: connectionsError } = await supabase
      .from('funnel_connections')
      .select('*')
      .eq('funnel_id', funnel.id);

    if (connectionsError) {
      return NextResponse.json({ error: connectionsError.message }, { status: 500 });
    }

    // Build structure
    const stepMap: any = {};
    steps?.forEach((s: any, i: number) => {
      stepMap[s.id] = { name: s.name, index: i + 1, order: s.step_order };
    });

    const graph: any = {};
    steps?.forEach((s: any) => {
      graph[s.name] = [];
    });

    connections?.forEach((c: any) => {
      const source = stepMap[c.source_step_id];
      const target = stepMap[c.target_step_id];
      if (source && target) {
        graph[source.name].push(target.name);
      }
    });

    return NextResponse.json({
      funnel: {
        id: funnel.id,
        name: funnel.name,
      },
      steps: steps?.map((s: any) => ({
        name: s.name,
        order: s.step_order,
      })),
      connections: connections?.map((c: any) => {
        const source = stepMap[c.source_step_id];
        const target = stepMap[c.target_step_id];
        return {
          from: source?.name || c.source_step_id,
          to: target?.name || c.target_step_id,
        };
      }),
      graph,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
