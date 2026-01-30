import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase not configured");
  }
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * PATCH /api/funnels/[id]/goal
 * Update the conversion goal step for a funnel
 * Body: { goalStepId: string | null }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: funnelId } = await params;
    const body = await req.json();
    const goalStepId = body.goalStepId ?? null;

    if (!funnelId) {
      return NextResponse.json({ error: "funnelId required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // If goalStepId provided, verify it belongs to this funnel
    if (goalStepId) {
      const { data: step, error: stepError } = await supabase
        .from("funnel_steps")
        .select("id")
        .eq("id", goalStepId)
        .eq("funnel_id", funnelId)
        .single();

      if (stepError || !step) {
        return NextResponse.json(
          { error: "Invalid goal step - must belong to this funnel" },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from("funnels")
      .update({ goal_step_id: goalStepId })
      .eq("id", funnelId);

    if (error) {
      console.error("Error updating funnel goal:", error);
      return NextResponse.json(
        { error: "Failed to update goal step" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, goalStepId });
  } catch (err: any) {
    console.error("Goal update error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
