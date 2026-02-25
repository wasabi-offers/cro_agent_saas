import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase credentials not configured");
  return createClient(supabaseUrl, supabaseKey);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
};

/**
 * POST /api/track
 *
 * Accepts the unified flat snake_case event format from cro-tracking-attribution.js.
 * This is a fallback endpoint — the primary path is the Supabase Edge Function.
 */
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

    for (const event of events) {
      const sessionId = event.session_id;
      const userId = event.user_id;

      if (!sessionId) continue;
      sessionIds.add(sessionId);

      // ── Session upsert on pageview ───────────────────────
      if (event.type === "pageview") {
        await supabase.from("tracking_sessions").upsert(
          {
            session_id: sessionId,
            user_id: userId || null,
            first_seen_at: new Date(event.timestamp).toISOString(),
            last_activity_at: new Date(event.timestamp).toISOString(),
            device_type: event.device_type || "unknown",
            browser: event.browser || "unknown",
            os: event.os || "unknown",
            screen_width: event.screen_width,
            screen_height: event.screen_height,
            viewport_width: event.viewport_width,
            viewport_height: event.viewport_height,
            language: event.language,
            entry_url: event.url,
            entry_path: event.path,
            entry_title: event.title,
            referrer: event.referrer,
            utm_source: event.source,
            utm_medium: event.medium,
            utm_campaign: event.campaign,
            utm_term: event.term,
            utm_content: event.content,
          },
          { onConflict: "session_id", ignoreDuplicates: false }
        );
      }

      // ── Insert tracking event ────────────────────────────
      const evtData: Record<string, unknown> = {
        session_id: sessionId,
        event_type: event.type,
        timestamp: event.timestamp,
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

      const { error: evtErr } = await supabase.from("tracking_events").insert(evtData);
      if (evtErr) console.error("Event insert error:", evtErr);
    }

    return NextResponse.json(
      { success: true, eventsProcessed: events.length, sessions: Array.from(sessionIds) },
      { headers: CORS_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Tracking Error:", message);
    return NextResponse.json(
      { error: "Failed to track events", details: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
