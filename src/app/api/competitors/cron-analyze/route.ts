import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { captureScreenshot, DeviceType } from "@/lib/competitor-screenshot";
import {
  analyzeBaselineScreenshot,
  compareScreenshots,
} from "@/lib/gemini";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function analyzeDevice(
  supabase: any,
  competitor: any,
  device: DeviceType
) {
  const screenshotBase64 = await captureScreenshot(competitor.website_url, device);

  const { data: previousSnapshots } = await supabase
    .from("competitor_snapshots")
    .select("id, screenshot_base64, cro_score, captured_at")
    .eq("competitor_id", competitor.id)
    .eq("device_type", device)
    .order("captured_at", { ascending: false })
    .limit(1);

  const previousSnapshot =
    previousSnapshots && previousSnapshots.length > 0
      ? previousSnapshots[0]
      : null;

  let analysis;

  if (previousSnapshot?.screenshot_base64) {
    analysis = await compareScreenshots(
      previousSnapshot.screenshot_base64,
      screenshotBase64
    );
  } else {
    analysis = await analyzeBaselineScreenshot(screenshotBase64);
  }

  const viewport = device === "mobile" ? { w: 390, h: 844 } : { w: 1280, h: 900 };
  const snapshotId = `snap_${competitor.id}_${device}_${Date.now()}`;

  const { error: insertError } = await supabase
    .from("competitor_snapshots")
    .insert({
      id: snapshotId,
      competitor_id: competitor.id,
      screenshot_base64: screenshotBase64,
      captured_at: new Date().toISOString(),
      analysis_result: analysis,
      changes_detected: analysis.changes_detected,
      change_severity: analysis.severity,
      change_summary: analysis.summary,
      cro_score: analysis.cro_score,
      previous_snapshot_id: previousSnapshot?.id || null,
      device_type: device,
      viewport_width: viewport.w,
      viewport_height: viewport.h,
    });

  if (insertError) {
    throw insertError;
  }

  return { snapshotId, analysis, device };
}

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data: competitors, error: fetchError } = await supabase
      .from("competitors")
      .select("*")
      .eq("status", "active");

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!competitors || competitors.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active competitors to analyze",
        results: [],
      });
    }

    const results = [];

    for (const competitor of competitors) {
      try {
        const [desktopResult, mobileResult] = await Promise.all([
          analyzeDevice(supabase, competitor, "desktop"),
          analyzeDevice(supabase, competitor, "mobile"),
        ]);

        const updateData: Record<string, unknown> = {
          last_analyzed_at: new Date().toISOString(),
          last_cro_score: desktopResult.analysis.cro_score,
        };

        const changesDetected = desktopResult.analysis.changes_detected || mobileResult.analysis.changes_detected;
        if (changesDetected) {
          updateData.total_changes_detected =
            (competitor.total_changes_detected || 0) + 1;
        }

        await supabase
          .from("competitors")
          .update(updateData)
          .eq("id", competitor.id);

        results.push({
          competitor: competitor.name,
          status: "success",
          desktop: {
            changes_detected: desktopResult.analysis.changes_detected,
            severity: desktopResult.analysis.severity,
            cro_score: desktopResult.analysis.cro_score,
            snapshot_id: desktopResult.snapshotId,
          },
          mobile: {
            changes_detected: mobileResult.analysis.changes_detected,
            severity: mobileResult.analysis.severity,
            cro_score: mobileResult.analysis.cro_score,
            snapshot_id: mobileResult.snapshotId,
          },
          changes_detected: changesDetected,
        });
      } catch (err) {
        console.error(`Error analyzing ${competitor.name}:`, err);
        results.push({
          competitor: competitor.name,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const totalAnalyzed = results.filter((r) => r.status === "success").length;
    const totalChanges = results.filter(
      (r) => r.status === "success" && r.changes_detected
    ).length;

    return NextResponse.json({
      success: true,
      message: `Analyzed ${totalAnalyzed}/${competitors.length} competitors (desktop + mobile). ${totalChanges} with changes detected.`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cron-analyze:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
