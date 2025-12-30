import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const inputType = formData.get("inputType") as string;
    const url = formData.get("url") as string | null;
    const file = formData.get("file") as File | null;
    const textContent = formData.get("textContent") as string | null;

    let contentToAnalyze = "";
    let imageBase64: string | null = null;
    let imageMediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | null = null;

    // Handle different input types
    if (inputType === "url" && url) {
      // Fetch URL content
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ProductAnalyzer/1.0)",
          },
        });
        const html = await response.text();
        // Extract text content from HTML (basic extraction)
        const textOnly = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 8000); // Limit content
        contentToAnalyze = `URL: ${url}\n\nContent:\n${textOnly}`;
      } catch {
        return NextResponse.json(
          { success: false, error: "Failed to fetch URL content" },
          { status: 400 }
        );
      }
    } else if (inputType === "image" && file) {
      // Handle image upload
      const buffer = await file.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString("base64");
      const mimeType = file.type;
      if (mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/gif" || mimeType === "image/webp") {
        imageMediaType = mimeType;
      } else {
        return NextResponse.json(
          { success: false, error: "Unsupported image format. Use JPEG, PNG, GIF, or WebP." },
          { status: 400 }
        );
      }
    } else if (inputType === "pdf" && file) {
      // Handle PDF - extract text (basic approach using file content)
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Basic PDF text extraction (looks for text between parentheses in PDF)
      let text = "";
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const pdfString = decoder.decode(uint8Array);
      
      // Extract text objects from PDF (simplified)
      const textMatches = pdfString.match(/\(([^)]+)\)/g);
      if (textMatches) {
        text = textMatches
          .map((m) => m.slice(1, -1))
          .filter((t) => t.length > 2 && /[a-zA-Z]/.test(t))
          .join(" ");
      }
      
      // If no text found, try stream content
      if (!text || text.length < 50) {
        const streamMatches = pdfString.match(/stream[\s\S]*?endstream/g);
        if (streamMatches) {
          text = streamMatches
            .map((s) => s.replace(/stream|endstream/g, ""))
            .join(" ")
            .replace(/[^\x20-\x7E]/g, " ")
            .replace(/\s+/g, " ")
            .substring(0, 5000);
        }
      }
      
      contentToAnalyze = `PDF Document: ${file.name}\n\nExtracted Content:\n${text.substring(0, 8000)}`;
      
      if (text.length < 50) {
        contentToAnalyze += "\n\n[Note: Limited text could be extracted from this PDF. It may be image-based.]";
      }
    } else if (inputType === "text" && textContent) {
      contentToAnalyze = textContent;
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid input provided" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a Product Marketing Expert. Your task is to analyze the provided content and extract product information to create a clear, compelling product brief.

Based on the input, you must extract and generate:
1. A clear, concise PRODUCT NAME (max 50 characters)
2. A comprehensive PRODUCT DESCRIPTION (150-300 words) that includes:
   - What the product is
   - Key features and benefits
   - Target audience
   - Unique value proposition

Respond ONLY in this exact JSON format:
{
  "product_name": "Product Name Here",
  "product_description": "Full product description here..."
}

If the content doesn't seem to be about a product, do your best to infer what product or service is being described. Use Italian language for the description.`;

    let messages: Anthropic.MessageParam[];

    if (imageBase64 && imageMediaType) {
      // Use vision for image analysis
      messages = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageMediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "Analyze this product image and extract product information to create a product brief.",
            },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: "user",
          content: `Analyze this content and extract product information:\n\n${contentToAnalyze}`,
        },
      ];
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const responseText = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    let productData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        productData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product_name: productData.product_name,
      product_description: productData.product_description,
      inputType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Product Analysis API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

