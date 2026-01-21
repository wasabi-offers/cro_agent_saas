import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get("funnelId");

    if (!funnelId) {
      return NextResponse.json(
        { success: false, error: "funnelId is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    // Fetch all proposals for this funnel
    const { data: proposals, error } = await supabase
      .from('funnel_ab_proposals')
      .select('*')
      .eq('funnel_id', funnelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching proposals:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proposals: proposals || [],
    });
  } catch (error) {
    console.error("Error in GET /api/ab-proposals:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { funnelId, proposals } = body;

    if (!funnelId || !proposals || !Array.isArray(proposals)) {
      return NextResponse.json(
        { success: false, error: "funnelId and proposals array are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    // Insert proposals
    const proposalsToInsert = proposals.map((p: any) => ({
      funnel_id: funnelId,
      category: p.category,
      element: p.element,
      current_value: p.current_value,
      proposed_value: p.proposed_value,
      expected_impact: p.expected_impact,
      reasoning: p.reasoning,
      status: 'pending',
    }));

    const { data, error } = await supabase
      .from('funnel_ab_proposals')
      .insert(proposalsToInsert)
      .select();

    if (error) {
      console.error('Error inserting proposals:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Create analysis record
    await supabase
      .from('funnel_ab_analyses')
      .insert({
        funnel_id: funnelId,
        has_proposals: true,
        next_analysis_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
      });

    return NextResponse.json({
      success: true,
      proposals: data,
      message: `${data.length} proposals saved`,
    });
  } catch (error) {
    console.error("Error in POST /api/ab-proposals:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
