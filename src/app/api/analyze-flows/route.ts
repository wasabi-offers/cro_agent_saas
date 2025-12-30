import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface EmailForAnalysis {
  id: string;
  subject: string;
  text_body: string;
  created_at: string;
}

interface FlowStep {
  id: string;
  emailId: string;
  subject: string;
  stepNumber: number;
  purpose: string;
  triggerType: string;
  delayFromPrevious: string;
}

interface EmailFlow {
  flowId: string;
  flowName: string;
  flowType: string;
  description: string;
  steps: FlowStep[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderName, emails } = body as {
      senderName: string;
      emails: EmailForAnalysis[];
    };

    if (!emails || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: "No emails provided" },
        { status: 400 }
      );
    }

    // Format emails for analysis
    const emailsText = emails
      .map(
        (email, index) =>
          `EMAIL ${index + 1} (ID: ${email.id}, Date: ${email.created_at}):
Subject: ${email.subject || "No subject"}
Body: ${email.text_body?.substring(0, 500) || "No body"}
---`
      )
      .join("\n\n");

    const prompt = `You are an expert email marketing strategist. Analyze these emails from "${senderName}" and identify the email marketing flows/sequences they represent.

EMAILS TO ANALYZE:
${emailsText}

INSTRUCTIONS:
1. Analyze the subjects, content, and patterns to identify distinct email flows
2. Group emails that belong to the same sequence/flow
3. Determine the purpose and type of each flow (e.g., Welcome Series, Abandoned Cart, Product Launch, Newsletter, Re-engagement, etc.)
4. Order the emails within each flow based on their likely sequence position
5. Identify the trigger type for each email (time-based, action-based, etc.)

RESPOND IN THIS EXACT JSON FORMAT ONLY (no additional text):
{
  "flows": [
    {
      "flowId": "flow_1",
      "flowName": "Welcome Series",
      "flowType": "onboarding",
      "description": "Initial sequence to welcome new subscribers",
      "steps": [
        {
          "id": "step_1",
          "emailId": "actual_email_id_from_input",
          "subject": "Email subject line",
          "stepNumber": 1,
          "purpose": "Welcome and introduce the brand",
          "triggerType": "immediate",
          "delayFromPrevious": "none"
        }
      ]
    }
  ]
}

Important:
- Use the actual email IDs provided in the input
- If an email doesn't fit any flow, create a "Standalone" flow for it
- Be creative in identifying patterns and naming flows
- Estimate delays between emails based on typical email marketing practices`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let flows: EmailFlow[] = [];
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        flows = parsed.flows || [];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { success: false, error: "Failed to parse flow analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      senderName,
      flows,
      analyzedCount: emails.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Flow Analysis API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

