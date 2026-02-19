import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { CroUsageEventType } from "@/lib/cro-usage";

/** GET /api/usage?days=30 - returns event counts by type (for dashboard) */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }
    const days = Math.min(365, Math.max(1, parseInt(req.nextUrl.searchParams.get("days") || "30", 10)));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("cro_usage_events")
      .select("event_type")
      .gte("created_at", since.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    (data || []).forEach((row: { event_type: string }) => {
      counts[row.event_type] = (counts[row.event_type] || 0) + 1;
    });

    return NextResponse.json({
      since: since.toISOString(),
      days,
      by_type: counts,
      total: (data || []).length,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type, payload = {}, user_id, session_id } = body;

    if (!event_type || typeof event_type !== "string") {
      return NextResponse.json(
        { error: "event_type is required (string)" },
        { status: 400 }
      );
    }

    const allowed: CroUsageEventType[] = [
      "landing_analyzed",
      "landing_saved",
      "chat_message",
      "cro_analysis",
      "cro_table_generated",
      "ab_tests_generated",
      "rag_query",
      "page_view",
      "funnel_created",
      "funnel_updated",
      "heatmap_viewed",
      "explore_ai_query",
    ];
    if (!allowed.includes(event_type as CroUsageEventType)) {
      return NextResponse.json(
        { error: `event_type must be one of: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from("cro_usage_events").insert({
      event_type,
      payload: typeof payload === "object" ? payload : {},
      user_id: user_id ?? null,
      session_id: session_id ?? null,
    });

    if (error) {
      console.error("Usage track error:", error);
      return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Usage API error:", e);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
