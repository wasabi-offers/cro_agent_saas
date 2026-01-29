import { NextRequest, NextResponse } from "next/server";
import { updateFunnelActiveStatus } from "@/lib/supabase-funnels";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { success: false, error: "is_active must be a boolean" },
        { status: 400 }
      );
    }

    const success = await updateFunnelActiveStatus(id, is_active);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to update funnel status" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating funnel active status:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
