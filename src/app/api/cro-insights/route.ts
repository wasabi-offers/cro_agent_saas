import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// This API generates CRO insights from analytics data

interface InsightRequest {
  type: "page_analysis" | "funnel_analysis" | "device_analysis" | "general";
  data: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as InsightRequest;
    const { type, data } = body;

    /* REMOVED: Mock insights - using only real AI analysis now
    const mockInsights: Record<string, string[]> = {
      page_analysis: [
        "The checkout page has a 45% drop-off rate, significantly higher than the 30% industry average. Consider simplifying the form.",
        "Mobile users show 60% more rage clicks on the navigation menu. The tap targets may be too small.",
        "Users spend an average of only 12 seconds on the pricing page before leaving. The value proposition needs to be clearer.",
      ],
      funnel_analysis: [
        "The biggest drop-off (60%) occurs between 'Add to Cart' and 'View Cart'. Users may not realize items were added.",
        "Users who view 3+ products are 4x more likely to convert. Consider adding product recommendations.",
        "The checkout to purchase conversion is 40%, below the 55% benchmark. Focus on reducing checkout friction.",
      ],
      device_analysis: [
        "Mobile conversion rate (1.2%) is 65% lower than desktop (3.4%). Mobile UX optimization is critical.",
        "Tablet users have the highest average order value but lowest traffic. Consider targeted tablet campaigns.",
        "Mobile session duration is 40% shorter than desktop. Key information must be visible immediately.",
      ],
      general: [
        "Based on your data, the highest-impact opportunity is improving mobile checkout UX.",
        "Your bounce rate has decreased 5% this month, indicating improved content relevance.",
        "Traffic from social media has 2x higher conversion than organic. Consider increasing social spend.",
      ],
    }; */

    // Claude API analysis - REQUIRED (no mock fallback)
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "ANTHROPIC_API_KEY not configured. Cannot generate insights.",
        },
        { status: 500 }
      );
    }

    console.log("🤖 Calling Claude API for CRO insights...");
    try {
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });


      const prompt = `You are a CRO analyst. Based on the following ${type} data, provide 3 actionable insights:

Data:
${JSON.stringify(data, null, 2)}

Provide specific, data-driven insights with recommendations. Keep each insight to 2-3 sentences.`;

      const message = await client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      console.log("✅ Received response from Claude");
      const textContent = message.content.find((c) => c.type === "text");
      if (textContent && textContent.type === "text") {
        const insights = textContent.text.split("\n").filter((line) => line.trim());
        console.log(`✅ Generated ${insights.length} insights`);
        return NextResponse.json({
          success: true,
          insights,
          type,
          generatedAt: new Date().toISOString(),
          source: "ai",
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: "No text content in Claude response",
        },
        { status: 500 }
      );
    } catch (aiError) {
      console.error("❌ AI insight error:", aiError);
      return NextResponse.json(
        {
          success: false,
          error: aiError instanceof Error ? aiError.message : "AI analysis failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("CRO insights error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}


