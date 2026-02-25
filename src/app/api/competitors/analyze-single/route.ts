import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { captureScreenshot, DeviceType } from "@/lib/competitor-screenshot";
import {
  analyzeBaselineScreenshot,
  compareScreenshots,
} from "@/lib/gemini";
import { anthropic, logger } from "@/lib/braintrust";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export const maxDuration = 180;

async function generateStrategicAssumption(
  competitorName: string,
  competitorUrl: string,
  analysis: any,
  device: string
) {
  if (!analysis.changes_detected || !process.env.ANTHROPIC_API_KEY) return null;

  try {
    const changeSummary = Object.entries(analysis.categories || {})
      .filter(([, items]) => (items as any[])?.length > 0)
      .map(([category, items]) => {
        const descriptions = (items as any[]).map((i: any) => {
          let line = `- ${i.description}`;
          if (i.before && i.after) line += ` (from "${i.before}" to "${i.after}")`;
          return line;
        }).join("\n");
        return `${category}:\n${descriptions}`;
      })
      .join("\n\n");

    const assumptionResponse = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are a CRO strategist. A competitor website "${competitorName}" (${competitorUrl}) made these changes on ${device.toUpperCase()} version:\n\n${changeSummary}\n\nCRO Score: ${analysis.cro_score_previous || "N/A"} → ${analysis.cro_score}\nOverall impact: ${analysis.overall_impact}\n\nIn 2-3 concise sentences, explain the most likely STRATEGIC REASON why they made these changes. Focus on the business/conversion goal behind the decision. Be concrete and specific, not generic.`,
      }],
    });

    const assumptionText = assumptionResponse.content.find((c: any) => c.type === "text");
    if (assumptionText && assumptionText.type === "text") {
      return assumptionText.text;
    }
  } catch (err) {
    console.error("Error generating strategic assumption:", err);
  }
  return null;
}

async function analyzeForDevice(
  supabase: any,
  competitor: any,
  device: DeviceType,
  spanId: string
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

  const assumption = await generateStrategicAssumption(
    competitor.name,
    competitor.website_url,
    analysis,
    device
  );
  if (assumption) {
    analysis.strategic_assumption = assumption;
  }

  const viewport = device === "mobile" ? { w: 390, h: 844 } : { w: 1280, h: 900 };
  const snapshotId = `snap_${competitor.id}_${device}_${Date.now()}`;

  const { data: snapshot, error: insertError } = await supabase
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
      braintrust_span_id: spanId,
      device_type: device,
      viewport_width: viewport.w,
      viewport_height: viewport.h,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { snapshot, analysis, device };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { competitor_id } = body;

    if (!competitor_id) {
      return NextResponse.json(
        { success: false, error: "competitor_id is required" },
        { status: 400 }
      );
    }

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

    const result = await logger.traced(async (span) => {
      const { data: competitor, error: compError } = await supabase
        .from("competitors")
        .select("*")
        .eq("id", competitor_id)
        .single();

      if (compError || !competitor) {
        return { error: "Competitor not found", status: 404 };
      }

      span.log({
        input: { competitor_id, competitor_name: competitor.name, url: competitor.website_url },
        metadata: { type: "competitor_analysis", devices: ["desktop", "mobile"] },
      });

      const [desktopResult, mobileResult] = await Promise.all([
        analyzeForDevice(supabase, competitor, "desktop", span.id),
        analyzeForDevice(supabase, competitor, "mobile", span.id),
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
        .eq("id", competitor_id);

      span.log({
        output: {
          desktop_cro_score: desktopResult.analysis.cro_score,
          mobile_cro_score: mobileResult.analysis.cro_score,
          desktop_changes: desktopResult.analysis.changes_detected,
          mobile_changes: mobileResult.analysis.changes_detected,
          severity: desktopResult.analysis.severity,
        },
      });

      return {
        success: true,
        desktop: { snapshot: desktopResult.snapshot, analysis: desktopResult.analysis },
        mobile: { snapshot: mobileResult.snapshot, analysis: mobileResult.analysis },
        spanId: span.id,
        message: changesDetected
          ? `Changes detected! Desktop: ${desktopResult.analysis.severity}, Mobile: ${mobileResult.analysis.severity}`
          : "No changes detected since last analysis",
      };
    }, { name: "competitor-cro-analysis" });

    if ("error" in result && !("success" in result)) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: (result as any).status || 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in analyze-single:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
