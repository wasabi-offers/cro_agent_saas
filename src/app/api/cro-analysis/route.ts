import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDataForAIAnalysis, fetchCRODashboardData } from "@/lib/supabase-data";

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
- 📊 Analisi Dettagliata

Be direct, practical, and focus on ROI-driven recommendations.`;

export async function POST(request: Request) {
  try {
    const { question, analysisType } = await request.json();

    // Fetch real data from Supabase
    const analyticsContext = await getDataForAIAnalysis();
    const dashboardData = await fetchCRODashboardData();

    let userPrompt = "";

    if (analysisType === "full-analysis") {
      userPrompt = `Analizza questi dati di Microsoft Clarity e fornisci un report CRO completo con priorità, problemi e A/B test da implementare:

${analyticsContext}

Voglio un'analisi completa con:
1. I 3 problemi più critici da risolvere subito
2. 5 raccomandazioni prioritarie con stima dell'impatto
3. 3 A/B test specifici da lanciare con ipotesi chiare
4. Considerazioni su mobile vs desktop`;
    } else if (analysisType === "ab-tests") {
      userPrompt = `Basandoti su questi dati, suggerisci 5-7 A/B test specifici da implementare:

${analyticsContext}

Per ogni test voglio:
- Nome del test
- Ipotesi da validare
- Variante di controllo vs variante
- KPI da monitorare
- Impatto stimato (Alto/Medio/Basso)
- Priorità (1-5)`;
    } else if (analysisType === "ux-issues") {
      userPrompt = `Analizza i problemi UX rilevati (dead clicks, rage clicks, quickbacks) e suggerisci soluzioni:

${analyticsContext}

Concentrati su:
1. Perché gli utenti stanno cliccando su elementi non cliccabili?
2. Cosa causa i rage clicks?
3. Perché gli utenti tornano indietro rapidamente?
4. Come migliorare l'esperienza su mobile vs desktop`;
    } else {
      // Custom question
      userPrompt = `${question}

Ecco i dati analytics attuali:

${analyticsContext}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
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
