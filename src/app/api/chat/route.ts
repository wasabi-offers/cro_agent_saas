import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    // System prompt with context about the CRO tool
    const systemPrompt = `You are an expert CRO (Conversion Rate Optimization) AI assistant integrated into a comprehensive analytics and optimization platform.

Your role is to:
- Analyze funnel data, heatmaps, analytics, and A/B test results
- Provide actionable optimization recommendations
- Explain complex CRO concepts in simple terms
- Help users understand their data and make data-driven decisions
- Suggest A/B test ideas based on current metrics
- Identify bottlenecks and opportunities in conversion funnels

You have access to the following data from the user's platform:
${context ? JSON.stringify(context, null, 2) : "No context provided"}

Always provide:
1. Clear, concise answers
2. Specific, actionable recommendations
3. Data-backed insights
4. Expected impact estimates when possible

Keep responses focused and practical. Use emojis sparingly but effectively.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    const assistantMessage =
      textContent && "text" in textContent ? textContent.text : "";

    return NextResponse.json({
      message: assistantMessage,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get response from AI assistant",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
