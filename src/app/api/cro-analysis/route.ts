import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDataForAIAnalysis, fetchCRODashboardData } from "@/lib/supabase-data";
import { queryRAG } from "@/lib/rag-client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CRO_SYSTEM_PROMPT = `You are an expert CRO (Conversion Rate Optimization) consultant with 15+ years of experience. You analyze website behavior data and provide actionable, prioritized recommendations.

Your expertise includes:
- User behavior analysis
- A/B testing strategy
- UX optimization
- Mobile optimization
- Conversion funnel optimization
- Click and engagement analysis
- Heatmap interpretation
- Session recording insights

When analyzing data, you should:
1. Identify the most critical issues first (high impact, quick wins)
2. Provide specific, actionable recommendations
3. Estimate potential impact (High/Medium/Low)
4. Suggest A/B test ideas with clear hypotheses
5. Consider both mobile and desktop experiences
6. Focus on revenue-generating optimizations

Format your responses in Italian (the user's language) with clear sections:
- 🚨 Problemi Critici
- 💡 Raccomandazioni Prioritarie
- 🧪 A/B Test Suggeriti
- 📊 Detailed Analysis

Be direct, practical, and focus on ROI-driven recommendations.`;

export async function POST(request: Request) {
  try {
    const { question, analysisType } = await request.json();

    // Fetch real data from Supabase
    const analyticsContext = await getDataForAIAnalysis();
    const dashboardData = await fetchCRODashboardData();

    let userPrompt = "";

    if (analysisType === "full-analysis") {
      userPrompt = `Analyze this Microsoft Clarity data and provide a complete CRO report with priorities, issues and A/B tests to implement:

${analyticsContext}

I want a complete analysis with:
1. The 3 most critical issues to fix immediately
2. 5 priority recommendations with impact estimate
3. 3 specific A/B tests to launch with clear hypotheses
4. Considerations on mobile vs desktop`;
    } else if (analysisType === "ab-tests") {
      userPrompt = `Based on this data, suggest 5-7 specific A/B tests to implement:

${analyticsContext}

For each test I want:
- Test name
- Hypothesis to validate
- Control variant vs variant
- KPIs to monitor
- Estimated impact (High/Medium/Low)
- Priority (1-5)`;
    } else if (analysisType === "ux-issues") {
      userPrompt = `Analyze the UX issues detected (dead clicks, rage clicks, quickbacks) and suggest solutions:

${analyticsContext}

Focus on:
1. Why are users clicking on non-clickable elements?
2. What causes rage clicks?
3. Why do users go back quickly?
4. How to improve the experience on mobile vs desktop`;
    } else {
      // Custom question: try RAG first
      if (question?.trim()) {
        const ragResult = await queryRAG({
          question: `${question}\n\nData context: ${analyticsContext?.substring(0, 2000) || "No data"}`,
          user_id: "cro_analysis",
          top_k: 12,
        });
        if (ragResult?.answer) {
          return NextResponse.json({
            success: true,
            analysis: ragResult.answer,
            source: "rag",
            dataSnapshot: dashboardData
              ? {
                  totalSessions: dashboardData.summary.totalSessions,
                  totalUsers: dashboardData.summary.totalUsers,
                  uxIssuesCount: dashboardData.uxIssues.length,
                  deadClicks: dashboardData.summary.totalDeadClicks,
                  rageClicks: dashboardData.summary.totalRageClicks,
                  mobilePercentage: dashboardData.summary.mobilePercentage.toFixed(1),
                }
              : undefined,
          });
        }
      }
      userPrompt = `${question}

Here is the current analytics data:

${analyticsContext}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4096,
      system: CRO_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      success: true,
      analysis: responseText,
      source: "claude",
      dataSnapshot: {
        totalSessions: dashboardData.summary.totalSessions,
        totalUsers: dashboardData.summary.totalUsers,
        uxIssuesCount: dashboardData.uxIssues.length,
        deadClicks: dashboardData.summary.totalDeadClicks,
        rageClicks: dashboardData.summary.totalRageClicks,
        mobilePercentage: dashboardData.summary.mobilePercentage.toFixed(1),
      },
    });
  } catch (error) {
    console.error("CRO Analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return dashboard data without AI analysis
    const dashboardData = await fetchCRODashboardData();

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
