import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, textBody, productName, productDescription } = body;

    if (!subject && !textBody) {
      return NextResponse.json(
        { success: false, error: "Email content is required" },
        { status: 400 }
      );
    }

    if (!productName || !productDescription) {
      return NextResponse.json(
        { success: false, error: "Product information is required" },
        { status: 400 }
      );
    }

    const originalContent = `Subject: ${subject || ""}\n\nBody: ${textBody || ""}`;

    const prompt = `You are an expert copywriter. Your task is to "swipe" (adapt) the style and structure of the following email to promote a different product.

ORIGINAL EMAIL:
${originalContent}

NEW PRODUCT TO PROMOTE:
Product Name: ${productName}
Product Description: ${productDescription}

INSTRUCTIONS:
1. Analyze the writing style, tone, and structure of the original email
2. Create a new email that maintains the same style and persuasive techniques
3. Replace all product references with the new product
4. Keep the same emotional hooks and call-to-action patterns
5. Make sure the new email feels natural and compelling

Write ONLY the swiped email content (subject line + body), nothing else. Format it as:
Subject: [Your subject line]

[Email body]`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const swipedContent =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      success: true,
      originalContent,
      swipedContent,
      productName,
      productDescription,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Swipe API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

