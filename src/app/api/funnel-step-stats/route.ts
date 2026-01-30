import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get("funnelId");
    const stepName = searchParams.get("stepName");
    const dateFrom = searchParams.get("dateFrom") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = searchParams.get("dateTo") || new Date().toISOString();

    if (!funnelId || !stepName) {
      return NextResponse.json({ error: "funnelId and stepName required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        visitors: 0,
        dropoff: 0,
        clicks: 0,
        submits: 0,
        ctr: 0,
        uniqueSessions: 0,
      });
    }

    const { data: events } = await supabase
      .from("tracking_events")
      .select("event_type, session_id")
      .eq("funnel_id", funnelId)
      .eq("funnel_step_name", stepName)
      .gte("timestamp", new Date(dateFrom).getTime())
      .lte("timestamp", new Date(dateTo).getTime())
      .limit(50000);

    const uniqueSessions = new Set<string>();
    let clicks = 0;
    let submits = 0;

    events?.forEach((e: any) => {
      uniqueSessions.add(e.session_id);
      if (e.event_type === "click" || e.event_type === "cta_click") clicks++;
      if (e.event_type === "form_submit") submits++;
    });

    const visitors = uniqueSessions.size;
    const ctr = visitors > 0 ? (clicks / visitors) * 100 : 0;

    return NextResponse.json({
      visitors,
      clicks,
      submits,
      ctr: Math.round(ctr * 10) / 10,
      uniqueSessions: visitors,
    });
  } catch (e) {
    console.error("funnel-step-stats error:", e);
    return NextResponse.json(
      { visitors: 0, dropoff: 0, clicks: 0, submits: 0, ctr: 0, uniqueSessions: 0 },
      { status: 200 }
    );
  }
}
