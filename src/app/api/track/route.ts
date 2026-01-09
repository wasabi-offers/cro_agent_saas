import { NextRequest, NextResponse } from "next/server";

interface TrackingEvent {
  funnelId: string;
  stepName: string;
  timestamp: string;
  userAgent: string;
  referrer: string;
  sessionId: string;
}

export async function POST(req: NextRequest) {
  try {
    const event: TrackingEvent = await req.json();

    // Validate required fields
    if (!event.funnelId || !event.stepName || !event.sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log the tracking event (in development)
    console.log("📊 Tracking Event Received:", {
      funnelId: event.funnelId,
      stepName: event.stepName,
      sessionId: event.sessionId,
      timestamp: event.timestamp,
      userAgent: event.userAgent,
      referrer: event.referrer,
    });

    // In production, you would:
    // 1. Store the event in a database (PostgreSQL, MongoDB, etc.)
    // 2. Update funnel statistics (visitors count, conversion rates)
    // 3. Track unique sessions to avoid duplicates
    // 4. Calculate drop-off rates and time spent per step

    // Example database call (pseudo-code):
    // await db.trackingEvents.create({
    //   funnel_id: event.funnelId,
    //   step_name: event.stepName,
    //   session_id: event.sessionId,
    //   timestamp: new Date(event.timestamp),
    //   user_agent: event.userAgent,
    //   referrer: event.referrer,
    //   ip_address: req.ip,
    // });
    //
    // await db.funnelStats.updateStepVisitors(event.funnelId, event.stepName);

    // For now, we'll store in localStorage on the client side
    // In production, replace this with actual database storage

    return NextResponse.json(
      {
        success: true,
        message: "Event tracked successfully",
        event: {
          funnelId: event.funnelId,
          stepName: event.stepName,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
        },
      },
      { status: 200 }
    );
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
