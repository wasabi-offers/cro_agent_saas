import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: events array required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    console.log(`📊 Tracking ${events.length} events`);

    // Process each event
    const sessionIds = new Set<string>();

    for (const event of events) {
      sessionIds.add(event.sessionId);

      // Upsert session if this is first event
      if (event.type === 'pageview') {
        const { error: sessionError } = await supabase
          .from('tracking_sessions')
          .upsert({
            session_id: event.sessionId,
            first_seen_at: new Date(event.timestamp).toISOString(),
            last_activity_at: new Date(event.timestamp).toISOString(),
            device_type: event.deviceType,
            browser: event.browser,
            os: event.os,
            screen_width: event.screenWidth,
            screen_height: event.screenHeight,
            viewport_width: event.viewportWidth,
            viewport_height: event.viewportHeight,
            language: event.language,
            entry_url: event.url,
            entry_path: event.path,
            entry_title: event.title,
            referrer: event.referrer,
            utm_source: event.utm_source,
            utm_medium: event.utm_medium,
            utm_campaign: event.utm_campaign,
            utm_term: event.utm_term,
            utm_content: event.utm_content,
          }, {
            onConflict: 'session_id',
            ignoreDuplicates: false
          });

        if (sessionError) {
          console.error('Session upsert error:', sessionError);
        }
      }

      // Insert event
      const eventData: any = {
        session_id: event.sessionId,
        event_type: event.type,
        timestamp: event.timestamp,
        url: event.url,
        path: event.path,
        title: event.title,
      };

      // Add click data
      if (event.clickData) {
        eventData.click_x = event.clickData.x;
        eventData.click_y = event.clickData.y;
        eventData.click_element = event.clickData.element;
        eventData.click_element_id = event.clickData.elementId;
        eventData.click_element_class = event.clickData.elementClass;
        eventData.click_element_text = event.clickData.elementText;
        eventData.is_cta_click = event.clickData.isCtaClick;
      }

      // Add scroll data
      if (event.scrollData) {
        eventData.scroll_depth = event.scrollData.depth;
        eventData.scroll_percentage = event.scrollData.percentage;
        eventData.max_scroll_depth = event.scrollData.maxDepth;
      }

      // Add mouse data
      if (event.mouseData) {
        eventData.mouse_x = event.mouseData.x;
        eventData.mouse_y = event.mouseData.y;
        eventData.mouse_speed = event.mouseData.movementSpeed;
      }

      // Add form data
      if (event.formData) {
        eventData.form_id = event.formData.formId;
        eventData.form_name = event.formData.formName;
        eventData.form_field_name = event.formData.fieldName;
        eventData.form_field_type = event.formData.fieldType;
        eventData.form_action = event.formData.action;
      }

      // Add funnel data
      if (event.funnelData) {
        eventData.funnel_id = event.funnelData.funnelId;
        eventData.funnel_step_name = event.funnelData.stepName;
        eventData.funnel_step_order = event.funnelData.stepOrder;
      }

      // Add time data
      if (event.timeData) {
        eventData.time_on_page = event.timeData.timeOnPage;
        eventData.user_engaged = event.timeData.engaged;
      }

      const { error: eventError } = await supabase
        .from('tracking_events')
        .insert(eventData);

      if (eventError) {
        console.error('Event insert error:', eventError);
      }
    }

    console.log(`✅ Tracked ${events.length} events for ${sessionIds.size} session(s)`);

    return NextResponse.json({
      success: true,
      eventsProcessed: events.length,
      sessions: Array.from(sessionIds)
    });

  } catch (error: any) {
    console.error("❌ Tracking Error:", error);
    return NextResponse.json(
      {
        error: "Failed to track events",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
