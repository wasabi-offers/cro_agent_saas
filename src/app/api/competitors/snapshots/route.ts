import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get("competitor_id");
    const limit = parseInt(searchParams.get("limit") || "10");
    const includeScreenshot = searchParams.get("include_screenshot") !== "false";

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    const deviceType = searchParams.get("device_type");

    const selectFields = includeScreenshot
      ? "*"
      : "id, competitor_id, page_title, page_meta_description, captured_at, analysis_result, changes_detected, change_severity, change_summary, cro_score, previous_snapshot_id, created_at, device_type, viewport_width, viewport_height, braintrust_span_id";

    let query = supabase
      .from("competitor_snapshots")
      .select(selectFields)
      .order("captured_at", { ascending: false })
      .limit(limit);

    if (competitorId) {
      query = query.eq("competitor_id", competitorId);
    }

    if (deviceType && (deviceType === "desktop" || deviceType === "mobile")) {
      query = query.eq("device_type", deviceType);
    }

    const { data: snapshots, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      snapshots: snapshots || [],
    });
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
