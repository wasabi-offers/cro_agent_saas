import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey)
    throw new Error("Supabase credentials not configured");
  return createClient(supabaseUrl, supabaseKey);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
};

const TOUCHPOINT_EVENTS = new Set([
  "pageview",
  "cta_click",
  "form_submit",
  "conversion",
  "funnel_step",
  "custom",
  "identify",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: events array required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = getSupabaseClient();
    const sessionIds = new Set<string>();
    const ensuredSessions = new Set<string>();
    const ensuredUsers = new Set<string>();

    const sorted = [...events].sort((a, b) => {
      if (a.type === "pageview" && b.type !== "pageview") return -1;
      if (a.type !== "pageview" && b.type === "pageview") return 1;
      return 0;
    });

    for (const event of sorted) {
      const sessionId = event.session_id;
      const userId = event.user_id || null;
      const eventType = event.type;

      if (!sessionId) continue;
      sessionIds.add(sessionId);

      // ── 1. Upsert session ──────────────────────────────
      if (!ensuredSessions.has(sessionId)) {
        ensuredSessions.add(sessionId);
        const ts = event.timestamp
          ? new Date(event.timestamp).toISOString()
          : new Date().toISOString();

        const { error: sessErr } = await supabase
          .from("tracking_sessions")
          .upsert(
            {
              session_id: sessionId,
              user_id: userId,
              first_seen_at: ts,
              last_activity_at: ts,
              device_type: event.device_type || "unknown",
              browser: event.browser || "unknown",
              os: event.os || "unknown",
              screen_width: event.screen_width || null,
              screen_height: event.screen_height || null,
              viewport_width: event.viewport_width || null,
              viewport_height: event.viewport_height || null,
              language: event.language || null,
              entry_url: event.url || null,
              entry_path: event.path || null,
              entry_title: event.title || null,
              referrer: event.referrer || null,
              utm_source: event.source || null,
              utm_medium: event.medium || null,
              utm_campaign: event.campaign || null,
              utm_term: event.term || null,
              utm_content: event.content || null,
            },
            { onConflict: "session_id", ignoreDuplicates: true }
          );
        if (sessErr) console.error("[track] Session upsert error:", sessErr.message);
      }

      // ── 2. Create / update attribution user ────────────
      if (userId && !ensuredUsers.has(userId)) {
        ensuredUsers.add(userId);

        const ftSource = event.first_touch_source || event.source || "direct";
        const ftMedium = event.first_touch_medium || event.medium || "none";
        const ftCampaign = event.first_touch_campaign || event.campaign || null;
        const ftContent = event.first_touch_content || event.content || null;
        const ftTerm = event.first_touch_term || event.term || null;

        const ltSource = event.source || "direct";
        const ltMedium = event.medium || "none";
        const ltCampaign = event.campaign || null;
        const ltContent = event.content || null;
        const ltTerm = event.term || null;

        const now = new Date().toISOString();

        // Step A: Insert user if not exists (preserves first-touch)
        const { error: insertErr } = await supabase
          .from("tracking_users")
          .upsert(
            {
              user_id: userId,
              device_fingerprint: event.device_fingerprint || null,
              first_seen_at: now,
              last_seen_at: now,
              total_sessions: 1,
              total_pageviews: 0,
              total_events: 0,
              total_conversions: 0,
              total_revenue: 0,
              primary_device_type: event.device_type || "unknown",
              primary_browser: event.browser || "unknown",
              primary_os: event.os || "unknown",
              primary_language: event.language || null,
              first_touch_source: ftSource,
              first_touch_medium: ftMedium,
              first_touch_campaign: ftCampaign,
              first_touch_content: ftContent,
              first_touch_term: ftTerm,
              first_touch_referrer: event.referrer || null,
              first_touch_landing_page: event.url || null,
              last_touch_source: ltSource,
              last_touch_medium: ltMedium,
              last_touch_campaign: ltCampaign,
              last_touch_content: ltContent,
              last_touch_term: ltTerm,
              last_touch_referrer: event.referrer || null,
              last_touch_landing_page: event.url || null,
              lifecycle_stage: "visitor",
            },
            { onConflict: "user_id", ignoreDuplicates: true }
          );
        if (insertErr)
          console.error("[track] User insert error:", insertErr.message);

        // Step B: Always update last-touch attribution + timestamps
        const { error: updateErr } = await supabase
          .from("tracking_users")
          .update({
            last_seen_at: now,
            updated_at: now,
            last_touch_source: ltSource,
            last_touch_medium: ltMedium,
            last_touch_campaign: ltCampaign,
            last_touch_content: ltContent,
            last_touch_term: ltTerm,
            last_touch_referrer: event.referrer || null,
            last_touch_landing_page: event.url || null,
          })
          .eq("user_id", userId);
        if (updateErr)
          console.error("[track] User update error:", updateErr.message);

        // Step C: Increment session count for returning users
        if (event.is_new_session === true && event.is_new_user !== true) {
          const { error: rpcErr } = await supabase.rpc(
            "increment_user_sessions",
            { p_user_id: userId }
          );
          if (rpcErr)
            console.error("[track] increment_user_sessions error:", rpcErr.message);
        }
      }

      // ── 3. Insert raw tracking event ───────────────────
      const evtData: Record<string, unknown> = {
        session_id: sessionId,
        event_type: eventType,
        timestamp: event.timestamp || Date.now(),
        url: event.url,
        path: event.path,
        title: event.title,
        funnel_id: event.funnel_id || null,
        funnel_step_name: event.funnel_step_name || event.step_name || null,
        funnel_step_order: event.step_order || null,
      };

      if (event.click_x != null) {
        evtData.click_x = event.click_x;
        evtData.click_y = event.click_y;
        evtData.click_element = event.element;
        evtData.click_element_id = event.element_id;
        evtData.click_element_class = event.element_class;
        evtData.click_element_text = event.element_text;
        evtData.is_cta_click = event.is_cta_click;
      }

      if (event.scroll_depth != null) {
        evtData.scroll_depth = event.scroll_depth;
        evtData.scroll_percentage = event.scroll_percentage;
        evtData.max_scroll_depth = event.max_scroll_depth;
      }

      if (event.mouse_x != null) {
        evtData.mouse_x = event.mouse_x;
        evtData.mouse_y = event.mouse_y;
        evtData.mouse_speed = event.mouse_speed;
      }

      if (event.form_id != null || event.field_name != null) {
        evtData.form_id = event.form_id;
        evtData.form_name = event.form_name;
        evtData.form_field_name = event.field_name;
        evtData.form_field_type = event.field_type;
        evtData.form_action = event.form_action || event.form_action_url;
      }

      if (event.time_on_page != null) {
        evtData.time_on_page = event.time_on_page;
        evtData.user_engaged = event.engaged;
      }

      const { error: evtErr } = await supabase
        .from("tracking_events")
        .insert(evtData);
      if (evtErr)
        console.error("[track] Event insert error:", evtErr.message, "| type:", eventType);

      // ── 4. Insert attribution touchpoint (significant events only) ──
      if (userId && TOUCHPOINT_EVENTS.has(eventType)) {
        const { error: tpErr } = await supabase
          .from("attribution_touchpoints")
          .insert({
            user_id: userId,
            session_id: sessionId,
            touchpoint_type: eventType,
            touchpoint_order: event.touchpoint_order || 0,
            source: event.source || "direct",
            medium: event.medium || "none",
            campaign: event.campaign || null,
            content: event.content || null,
            term: event.term || null,
            referrer: event.referrer || null,
            page_url: event.url || null,
            page_path: event.path || null,
            page_title: event.title || null,
            is_conversion: event.is_conversion === true,
            conversion_type: event.conversion_type || null,
            conversion_value: parseFloat(event.conversion_value) || 0,
            funnel_id: event.funnel_id || null,
            funnel_step_name:
              event.funnel_step_name || event.step_name || null,
            funnel_step_order: event.step_order || null,
            device_type: event.device_type || "unknown",
            browser: event.browser || "unknown",
            os: event.os || "unknown",
            timestamp: event.timestamp || Date.now(),
          });
        if (tpErr)
          console.error("[track] Touchpoint insert error:", tpErr.message);
      }

      // ── 5. Record conversion ───────────────────────────
      if (
        userId &&
        eventType === "conversion" &&
        event.is_conversion === true
      ) {
        const { error: convErr } = await supabase.rpc("record_conversion", {
          p_user_id: userId,
          p_session_id: sessionId,
          p_conversion_type: event.conversion_type || "purchase",
          p_conversion_name: event.conversion_name || "Conversion",
          p_conversion_value: parseFloat(event.conversion_value) || 0,
        });
        if (convErr)
          console.error("[track] record_conversion error:", convErr.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        eventsProcessed: events.length,
        sessions: Array.from(sessionIds),
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[track] Fatal error:", message);
    return NextResponse.json(
      { error: "Failed to track events", details: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
