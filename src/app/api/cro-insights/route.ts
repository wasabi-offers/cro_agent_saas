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

    // Mock insights based on type
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
    };

    // If API key is available, use Claude for real insights
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const client = new Anthropic();
        
        const prompt = `You are a CRO analyst. Based on the following ${type} data, provide 3 actionable insights:

Data:
${JSON.stringify(data, null, 2)}

Provide specific, data-driven insights with recommendations. Keep each insight to 2-3 sentences.`;

        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const textContent = message.content.find((c) => c.type === "text");
        if (textContent && textContent.type === "text") {
          const insights = textContent.text.split("\n").filter((line) => line.trim());
          return NextResponse.json({
            success: true,
            insights,
            type,
            generatedAt: new Date().toISOString(),
            source: "ai",
          });
        }
      } catch (aiError) {
        console.error("AI insight error:", aiError);
      }
    }

    return NextResponse.json({
      success: true,
      insights: mockInsights[type] || mockInsights.general,
      type,
      generatedAt: new Date().toISOString(),
      source: "mock",
    });
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


