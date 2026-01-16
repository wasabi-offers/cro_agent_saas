import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// This API generates A/B test suggestions based on analytics data
// In production, this would analyze real data from Supabase

interface AnalyticsContext {
  pageMetrics: {
    page: string;
    bounceRate: number;
    scrollDepth: number;
    rageClicks: number;
    deadClicks: number;
    avgTimeOnPage: number;
  }[];
  funnelDropoffs: {
    step: string;
    dropoffRate: number;
  }[];
  devicePerformance: {
    device: string;
    conversionRate: number;
  }[];
}

interface ABTestSuggestion {
  priority: "high" | "medium" | "low";
  page: string;
  element: string;
  hypothesis: string;
  expectedImpact: string;
  metrics: string[];
  reasoning: string;
  dataSource: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { context } = body as { context?: AnalyticsContext };

    /* REMOVED: Mock suggestions - using only real AI analysis now
    const mockSuggestions: ABTestSuggestion[] = [
      {
        priority: "high",
        page: "/checkout",
        element: "Payment Form",
        hypothesis: "Simplifying the payment form by reducing fields will increase checkout completion by 25%",
        expectedImpact: "+25% checkout completion",
        metrics: ["Checkout Completion Rate", "Cart Abandonment", "Time to Complete"],
        reasoning: "Analysis shows 45% of users abandon at the payment step. Session recordings reveal confusion around the billing address section.",
        dataSource: "clarity",
      },
      {
        priority: "high", 
        page: "/products/[id]",
        element: "Add to Cart Button",
        hypothesis: "Making the Add to Cart button sticky on mobile will increase add-to-cart rate by 18%",
        expectedImpact: "+18% add-to-cart rate",
        metrics: ["Add to Cart Rate", "Mobile Conversion", "Scroll Depth"],
        reasoning: "Heatmap data shows mobile users scroll past the CTA. Only 30% of mobile sessions see the button without scrolling back up.",
        dataSource: "crazy_egg",
      },
      {
        priority: "medium",
        page: "/",
        element: "Hero Section",
        hypothesis: "Adding a video background to the hero will increase engagement by 35%",
        expectedImpact: "+35% time on page",
        metrics: ["Time on Page", "Scroll Depth", "Bounce Rate"],
        reasoning: "Current hero has 52% bounce rate. Users spend only 2.3 seconds before scrolling or leaving.",
        dataSource: "google_analytics",
      },
    ]; */

    // Claude API analysis - REQUIRED (no mock fallback)
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "ANTHROPIC_API_KEY not configured. Cannot generate test suggestions.",
        },
        { status: 500 }
      );
    }

    if (!context) {
      return NextResponse.json(
        {
          success: false,
          error: "Analytics context is required",
        },
        { status: 400 }
      );
    }

    console.log("🤖 Calling Claude API for A/B test suggestions...");
    try {
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });


      const prompt = `You are a CRO (Conversion Rate Optimization) expert. Based on the following analytics data, generate 3-5 A/B test suggestions.

Analytics Data:
${JSON.stringify(context, null, 2)}

For each suggestion, provide:
1. Priority (high/medium/low)
2. Target page
3. Element to test
4. Hypothesis
5. Expected impact
6. Metrics to track
7. Reasoning based on the data
8. Data source that supports this suggestion

IMPORTANT: Return ONLY a valid JSON array, no text before or after.

Format: [{"priority": "high", "page": "...", "element": "...", "hypothesis": "...", "expectedImpact": "...", "metrics": [...], "reasoning": "...", "dataSource": "..."}]`;

      const message = await client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
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
        let jsonText = textContent.text.trim();
        console.log("Raw response length:", jsonText.length);

        try {
          // Remove markdown code blocks if present
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
          } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
          }

          // Extract JSON array
          const jsonMatch = jsonText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }

          const suggestions = JSON.parse(jsonText);
          console.log(`✅ Parsed ${suggestions.length} test suggestions`);
          return NextResponse.json({
            success: true,
            suggestions,
            generatedAt: new Date().toISOString(),
            source: "ai",
          });
        } catch (parseError) {
          console.error("❌ Error parsing AI response:", parseError);
          return NextResponse.json(
            {
              success: false,
              error: "Failed to parse AI response",
              rawResponse: textContent.text.substring(0, 500),
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: "No text content in Claude response",
        },
        { status: 500 }
      );
    } catch (aiError) {
      console.error("❌ AI generation error:", aiError);
      return NextResponse.json(
        {
          success: false,
          error: aiError instanceof Error ? aiError.message : "AI analysis failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Generate tests error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/* REMOVED: GET endpoint with mock stats - not needed
export async function GET() {
  return NextResponse.json({
    success: true,
    lastGenerated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    nextGeneration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    totalSuggestions: 8,
    pendingTests: 6,
    runningTests: 1,
    completedTests: 1,
  });
}
*/


