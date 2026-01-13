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

    // For demo purposes, return mock suggestions
    // In production, this would use Claude to analyze real data
    
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
    ];

    // If API key is available, use Claude for real analysis
    if (process.env.ANTHROPIC_API_KEY && context) {
      try {
        const client = new Anthropic();
        
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

Format your response as JSON array.`;

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

        // Parse Claude's response
        const textContent = message.content.find((c) => c.type === "text");
        if (textContent && textContent.type === "text") {
          try {
            const suggestions = JSON.parse(textContent.text);
            return NextResponse.json({
              success: true,
              suggestions,
              generatedAt: new Date().toISOString(),
              source: "ai",
            });
          } catch {
            // If parsing fails, return mock data
          }
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError);
        // Fall back to mock suggestions
      }
    }

    return NextResponse.json({
      success: true,
      suggestions: mockSuggestions,
      generatedAt: new Date().toISOString(),
      source: "mock",
    });
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

export async function GET() {
  // Return last generated suggestions (from mock data)
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


