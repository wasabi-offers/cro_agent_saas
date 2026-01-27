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

// PUT - Toggle funnel active status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const funnelId = params.id;
    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: "is_active must be a boolean" },
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

    // Update funnel active status
    const { data, error } = await supabase
      .from('funnels')
      .update({ is_active })
      .eq('id', funnelId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling funnel status:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      funnel: data,
      message: `Funnel ${is_active ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error("Error in PUT /api/funnels/[id]/toggle-active:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
