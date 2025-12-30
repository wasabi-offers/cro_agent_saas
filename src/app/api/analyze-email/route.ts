import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromName, fromEmail, subject, textBody, htmlBody } = body;

    if (!subject && !textBody) {
      return NextResponse.json(
        { success: false, error: "Email content is required" },
        { status: 400 }
      );
    }

    const emailContent = `
FROM: ${fromName || "Unknown"} <${fromEmail || "unknown@email.com"}>
SUBJECT: ${subject || "No subject"}

BODY:
${textBody || "No text body available"}
`.trim();

    const prompt = `You are a world-class Email Marketing Expert with 15+ years of experience analyzing email campaigns for Fortune 500 companies.

Analyze this marketing email and provide actionable insights:

${emailContent}

Provide your analysis in the following format (use these exact headers):

## 📊 Overall Score
Give a score from 1-10 and a brief explanation.

## 🎯 Subject Line Analysis
- Effectiveness
- Emotional triggers used
- Improvements suggested

## ✍️ Copy & Messaging
- Tone and voice
- Key persuasion techniques
- Call-to-action effectiveness
- Urgency/scarcity tactics used

## 🧠 Psychological Triggers
List the psychological principles used (social proof, FOMO, reciprocity, etc.)

## 📱 Structure & Readability
- Layout effectiveness
- Scanability
- Mobile-friendliness assessment

## 💡 Key Takeaways
3-5 bullet points of the most valuable insights a marketer can learn from this email.

## 🔧 Improvement Suggestions
Top 3 specific, actionable improvements.

Be specific, practical, and focus on actionable insights. Use Italian language for the analysis.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const analysis =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      success: true,
      analysis,
      emailSubject: subject,
      fromName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Email Analysis API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

