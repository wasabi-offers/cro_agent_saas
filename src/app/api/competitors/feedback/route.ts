import { NextResponse } from "next/server";
import { logger } from "@/lib/braintrust";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { spanId, score, comment, snapshotId } = body;

    if (!spanId) {
      return NextResponse.json(
        { success: false, error: "spanId is required" },
        { status: 400 }
      );
    }

    if (score === undefined || (score !== 0 && score !== 1)) {
      return NextResponse.json(
        { success: false, error: "score must be 0 (thumbs down) or 1 (thumbs up)" },
        { status: 400 }
      );
    }

    logger.logFeedback({
      id: spanId,
      scores: {
        accuracy: score,
      },
      comment: comment || undefined,
      metadata: {
        snapshot_id: snapshotId,
        feedback_source: "competitor_monitoring_ui",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
