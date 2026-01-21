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
          proposals: [],
          summary: {
            totalProposals: 0,
            pendingCount: 0,
            activeCount: 0,
            completedCount: 0,
          }
        }
      });
    }

    // Get all AB test proposals
    const { data: proposals, error } = await supabase
      .from('funnel_ab_proposals')
      .select(`
        *,
        funnels:funnel_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AB proposals:', error);
      return NextResponse.json({
        success: true,
        data: {
          proposals: [],
          summary: {
            totalProposals: 0,
            pendingCount: 0,
            activeCount: 0,
            completedCount: 0,
          }
        }
      });
    }

    const totalProposals = proposals?.length || 0;
    const pendingCount = proposals?.filter(p => p.status === 'pending').length || 0;
    const activeCount = proposals?.filter(p => p.status === 'active').length || 0;
    const completedCount = proposals?.filter(p => p.status === 'completed').length || 0;

    return NextResponse.json({
      success: true,
      data: {
        proposals: proposals || [],
        summary: {
          totalProposals,
          pendingCount,
          activeCount,
          completedCount,
        }
      }
    });
  } catch (error) {
    console.error("AB Tests data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
