import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Funnel tracking event
interface FunnelTrackingEvent {
  funnelId: string;
  stepName: string;
  timestamp: string;
  userAgent: string;
  referrer: string;
  sessionId: string;
}

// Landing page tracking events (heatmap)
interface LandingTrackingBatch {
  landingId: string;
  sessionId: string;
  events: Array<{
    type: "click" | "scroll" | "movement" | "session_start";
    timestamp: number;
    x?: number;
    y?: number;
    percentage?: number;
    target?: string;
    targetId?: string | null;
    targetClass?: string | null;
    pageWidth?: number;
    pageHeight?: number;
    viewportHeight?: number;
    // Session info
    userAgent?: string;
    screenWidth?: number;
    screenHeight?: number;
    viewportWidth?: number;
    referrer?: string;
    language?: string;
  }>;
}

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

    // Check if it's landing tracking or funnel tracking
    if (body.landingId && body.events) {
      return await handleLandingTracking(body as LandingTrackingBatch);
    } else if (body.funnelId) {
      return await handleFunnelTracking(body as FunnelTrackingEvent);
    } else {
      return NextResponse.json(
        { error: "Invalid tracking data" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ Tracking Error:", error);
    return NextResponse.json(
      {
        error: "Failed to track event",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle landing page tracking (heatmap data)
async function handleLandingTracking(batch: LandingTrackingBatch) {
  const supabase = getSupabaseClient();

  console.log(`📊 Landing Tracking: ${batch.events.length} events for landing ${batch.landingId}`);

  // Separate session_start from other events
  const sessionEvent = batch.events.find(e => e.type === 'session_start');
  const trackingEvents = batch.events.filter(e => e.type !== 'session_start');

  // Insert or update session
  if (sessionEvent) {
    const { error: sessionError } = await supabase
      .from('tracking_sessions')
      .upsert({
        landing_id: batch.landingId,
        session_id: batch.sessionId,
        user_agent: sessionEvent.userAgent,
        screen_width: sessionEvent.screenWidth,
        screen_height: sessionEvent.screenHeight,
        viewport_width: sessionEvent.viewportWidth,
        viewport_height: sessionEvent.viewportHeight,
        referrer: sessionEvent.referrer,
        language: sessionEvent.language,
      }, {
        onConflict: 'session_id'
      });

    if (sessionError) {
      console.error("❌ Session insert error:", sessionError);
    } else {
      console.log(`✅ Session recorded: ${batch.sessionId}`);
    }
  }

  // Insert tracking events
  if (trackingEvents.length > 0) {
    const eventsToInsert = trackingEvents.map(event => ({
      landing_id: batch.landingId,
      session_id: batch.sessionId,
      event_type: event.type,
      x_position: event.x || null,
      y_position: event.y || null,
      scroll_percentage: event.percentage || null,
      page_width: event.pageWidth || null,
      page_height: event.pageHeight || null,
      viewport_height: event.viewportHeight || null,
      target_element: event.target || null,
      target_id: event.targetId || null,
      target_class: event.targetClass || null,
      timestamp: event.timestamp,
    }));

    const { data, error: eventsError } = await supabase
      .from('tracking_events')
      .insert(eventsToInsert);

    if (eventsError) {
      console.error("❌ Events insert error:", eventsError);
      return NextResponse.json(
        {
          success: false,
          error: eventsError.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Tracked ${eventsToInsert.length} events`);
  }

  return NextResponse.json({
    success: true,
    message: `Tracked ${batch.events.length} events`,
    landingId: batch.landingId,
    sessionId: batch.sessionId,
  });
}

// Handle funnel tracking (existing functionality)
async function handleFunnelTracking(event: FunnelTrackingEvent) {
  // Validate required fields
  if (!event.funnelId || !event.stepName || !event.sessionId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  console.log("📊 Funnel Tracking Event:", {
    funnelId: event.funnelId,
    stepName: event.stepName,
    sessionId: event.sessionId,
    timestamp: event.timestamp,
  });

  // TODO: Implement funnel tracking in database
  // For now just log and return success

  return NextResponse.json({
    success: true,
    message: "Event tracked successfully",
    event: {
      funnelId: event.funnelId,
      stepName: event.stepName,
      sessionId: event.sessionId,
      timestamp: event.timestamp,
    },
  });
}

// OPTIONS handler for CORS preflight requests
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
