import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { captureScreenshot } from "@/lib/competitor-screenshot";
import {
  analyzeBaselineScreenshot,
  compareScreenshots,
  CROAnalysisResult,
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

export const maxDuration = 120;

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
        metadata: { type: "competitor_analysis" },
      });

      const screenshotBase64 = await captureScreenshot(competitor.website_url);

      const { data: previousSnapshots } = await supabase
        .from("competitor_snapshots")
        .select("id, screenshot_base64, cro_score, captured_at")
        .eq("competitor_id", competitor_id)
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

      if (analysis.changes_detected && process.env.ANTHROPIC_API_KEY) {
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
              content: `You are a CRO strategist. A competitor website "${competitor.name}" (${competitor.website_url}) made these changes:\n\n${changeSummary}\n\nCRO Score: ${analysis.cro_score_previous || "N/A"} → ${analysis.cro_score}\nOverall impact: ${analysis.overall_impact}\n\nIn 2-3 concise sentences, explain the most likely STRATEGIC REASON why they made these changes. Focus on the business/conversion goal behind the decision. Be concrete and specific, not generic.`,
            }],
          });

          const assumptionText = assumptionResponse.content.find((c) => c.type === "text");
          if (assumptionText && assumptionText.type === "text") {
            analysis.strategic_assumption = assumptionText.text;
          }
        } catch (err) {
          console.error("Error generating strategic assumption:", err);
        }
      }

      const snapshotId = `snap_${competitor_id}_${Date.now()}`;

      const { data: snapshot, error: insertError } = await supabase
        .from("competitor_snapshots")
        .insert({
          id: snapshotId,
          competitor_id: competitor_id,
          screenshot_base64: screenshotBase64,
          captured_at: new Date().toISOString(),
          analysis_result: analysis,
          changes_detected: analysis.changes_detected,
          change_severity: analysis.severity,
          change_summary: analysis.summary,
          cro_score: analysis.cro_score,
          previous_snapshot_id: previousSnapshot?.id || null,
          braintrust_span_id: span.id,
        })
        .select()
        .single();

      if (insertError) {
        return { error: insertError.message, status: 500 };
      }

      const updateData: Record<string, unknown> = {
        last_analyzed_at: new Date().toISOString(),
        last_cro_score: analysis.cro_score,
      };

      if (analysis.changes_detected) {
        updateData.total_changes_detected =
          (competitor.total_changes_detected || 0) + 1;
      }

      await supabase
        .from("competitors")
        .update(updateData)
        .eq("id", competitor_id);

      span.log({
        output: {
          cro_score: analysis.cro_score,
          changes_detected: analysis.changes_detected,
          severity: analysis.severity,
          has_assumption: !!analysis.strategic_assumption,
        },
      });

      return {
        success: true,
        snapshot,
        analysis,
        spanId: span.id,
        message: analysis.changes_detected
          ? `Changes detected! Severity: ${analysis.severity}`
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
