import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 240;

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 3,
  baseDelay = 5000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isOverloaded =
        err?.status === 529 ||
        err?.status === 429 ||
        err?.error?.type === "overloaded_error" ||
        err?.message?.includes("overloaded") ||
        err?.message?.includes("rate_limit");

      if (isOverloaded && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[${label}] Overloaded/rate-limited (attempt ${attempt}/${maxRetries}), retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`[${label}] Max retries exceeded`);
}

const GEMINI_PROMPT = `You are a world-class CRO (Conversion Rate Optimization) strategist with 15+ years of experience analyzing landing pages, checkout flows, and sales funnels.

Analyze this screenshot in EXTREME detail. Examine every single element visible on the page:

1. **Header & Navigation**: Logo placement, menu items, trust badges, phone numbers, cart icons
2. **Hero Section**: Headline copy, subheadline, hero image, CTA buttons, value proposition clarity
3. **Above the fold**: What the user sees first without scrolling — is the CTA visible? Is the value clear?
4. **Trust signals**: Testimonials, reviews, security badges, guarantees, certifications, partner logos
5. **Form fields**: Number of fields, labels, placeholder text, validation, friction points
6. **CTA buttons**: Color, size, copy, placement, contrast with background, urgency elements
7. **Pricing**: How price is displayed, anchoring, discounts, payment options
8. **Urgency/Scarcity**: Timers, stock counters, limited offers — are they genuine or fake-looking?
9. **Social proof**: Reviews count, star ratings, user photos, case studies
10. **Copy & Messaging**: Tone, clarity, benefit-focused vs feature-focused, reading level
11. **Visual hierarchy**: Font sizes, spacing, color contrast, eye flow, F-pattern or Z-pattern
12. **Mobile responsiveness**: If visible, how elements stack, touch target sizes
13. **Footer**: Links, trust badges, contact info, legal pages
14. **Pop-ups / Overlays**: Exit intent, welcome mats, notification bars
15. **Page speed indicators**: Heavy images, too many elements, bloated sections
16. **Color psychology**: Button colors, background colors, emotional triggers
17. **Whitespace usage**: Cramped vs clean layout
18. **Accessibility**: Contrast ratios, font sizes, alt text indicators
19. **Micro-copy**: Error messages, helper text, tooltips, labels
20. **Cross-sell / Upsell**: Product recommendations, bundles, add-ons

For EACH element you identify, note:
- What it currently looks like / says
- What's wrong with it from a CRO perspective
- How it specifically hurts conversion
- What the fix should be (be very specific, not generic)

Be brutally honest. Find at least 25-30 issues. Don't hold back. Real CRO audits find dozens of problems.
Include both major issues AND subtle micro-optimizations that compound into significant conversion lifts.`;

const GPT_PROMPT = `You are a senior CRO analyst. You have received a detailed CRO analysis of a webpage screenshot from another expert.

Your job is to take this raw analysis and organize it into a PROFESSIONAL comparison table with at least 25 rows (aim for 30+ if the analysis supports it).

CRITICAL: Output ONLY valid JSON. No markdown, no explanation, no preamble. Just the JSON array.

Each row must be a JSON object with exactly these 5 fields:
{
  "area": "The specific page area/element (e.g., 'Header Timer', 'CTA Button', 'Form Fields')",
  "problem": "The specific problem found (be concrete, quote actual text/colors when possible)",
  "impact": "Alto|Medio|Basso|Critico",
  "why_reduces_conversion": "Psychological/UX reason WHY this hurts conversion (cite specific principles like Hick's Law, Fogg Behavior Model, etc.)",
  "action": "The EXACT action to take — specific copy, specific color hex codes, specific layout change. Not vague advice."
}

Rules:
- Minimum 25 rows, ideally 30+
- Impact values MUST be one of: "Critico", "Alto", "Medio", "Basso"
- Sort by impact: Critico first, then Alto, then Medio, then Basso
- Be SPECIFIC in actions — don't say "improve copy", say exactly what the new copy should be
- Quote actual text from the page when describing problems
- Reference CRO principles (Cialdini, Kahneman, Nielsen, Fogg) in the "why" column
- Each area should be unique — don't repeat the same element

Here is the raw CRO analysis to organize:

---
USER_CONTEXT
---
GEMINI_ANALYSIS`;

const CLAUDE_REVIEW_PROMPT = `You are a CRO expert reviewer. Another team has analyzed a webpage and produced a CRO comparison table.

Your job is to:
1. Review every single row — verify the reasoning is sound
2. Add ANY issues they MISSED (there are always blind spots)
3. Upgrade weak suggestions with better, more specific alternatives
4. Flag any wrong or misleading advice

Output format — respond ONLY with valid JSON:
{
  "corrections": [
    {
      "row_area": "Which row area this correction applies to",
      "original_action": "What they suggested",
      "improved_action": "Your improved suggestion",
      "reason": "Why your version is better"
    }
  ],
  "additional_issues": [
    {
      "area": "New area they missed",
      "problem": "The problem",
      "impact": "Alto|Medio|Basso|Critico",
      "why_reduces_conversion": "Why it hurts conversion",
      "action": "Specific action to take"
    }
  ],
  "overall_verdict": "2-3 sentences summarizing the quality of the analysis and the top 3 priorities"
}

Rules:
- Add at least 3-5 additional issues they missed
- Provide at least 2-3 corrections/improvements
- Be constructive but rigorous
- The overall_verdict should prioritize the 3 most impactful changes

Here is the original CRO analysis table (JSON) and the context:

USER_CONTEXT

TABLE_JSON`;

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      const rawText = await request.text();
      body = JSON.parse(rawText);
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: "Image too large. Please use a smaller screenshot (max ~5MB) or lower resolution." },
        { status: 413 }
      );
    }

    const { imageBase64, userMessage } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    const missingKeys: string[] = [];
    if (!process.env.GEMINI_API_KEY) missingKeys.push("GEMINI_API_KEY");
    if (!process.env.OPENAI_API_KEY) missingKeys.push("OPENAI_API_KEY");
    if (!process.env.ANTHROPIC_API_KEY) missingKeys.push("ANTHROPIC_API_KEY");

    if (missingKeys.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing API keys: ${missingKeys.join(", ")}` },
        { status: 500 }
      );
    }

    const userContext = userMessage || "Analyze this page for CRO issues.";

    // ═══════════════════════════════════════
    // STEP 1: Gemini — Deep Visual Analysis
    // ═══════════════════════════════════════
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const geminiResult = await withRetry(
      () =>
        geminiModel.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${GEMINI_PROMPT}\n\nUser context: "${userContext}"` },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 16000,
            temperature: 0.2,
          },
        }),
      "Gemini"
    );

    const geminiAnalysis = geminiResult.response.text();

    if (!geminiAnalysis || geminiAnalysis.length < 100) {
      return NextResponse.json(
        { success: false, error: "Gemini analysis was empty or too short" },
        { status: 500 }
      );
    }

    // ═══════════════════════════════════════
    // STEP 2: GPT — Structured Table Generation
    // ═══════════════════════════════════════
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      timeout: 120_000,
    });

    const gptPrompt = GPT_PROMPT
      .replace("USER_CONTEXT", userContext)
      .replace("GEMINI_ANALYSIS", geminiAnalysis);

    const gptResult = await withRetry(
      () =>
        openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: "You output ONLY valid JSON arrays. No markdown fences, no explanation." },
            { role: "user", content: gptPrompt },
          ],
          max_tokens: 16000,
          temperature: 0.1,
        }),
      "GPT"
    );

    const gptRaw = gptResult.choices[0]?.message?.content || "[]";

    let tableData: any[];
    try {
      const cleaned = gptRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      tableData = JSON.parse(cleaned);
    } catch {
      tableData = [];
      console.error("Failed to parse GPT table output:", gptRaw.substring(0, 500));
    }

    // ═══════════════════════════════════════
    // STEP 3: Claude — Expert Review
    // ═══════════════════════════════════════
    const claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 5,
      timeout: 120_000,
    });

    const claudePrompt = CLAUDE_REVIEW_PROMPT
      .replace("USER_CONTEXT", userContext)
      .replace("TABLE_JSON", JSON.stringify(tableData, null, 2));

    let claudeReview: any;

    try {
      const claudeResult = await claude.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [
          { role: "user", content: claudePrompt },
        ],
      });

      const claudeRaw = claudeResult.content.find((c) => c.type === "text")?.text || "{}";

      try {
        const cleaned = claudeRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        claudeReview = JSON.parse(cleaned);
      } catch {
        claudeReview = {
          corrections: [],
          additional_issues: [],
          overall_verdict: claudeRaw,
        };
      }
    } catch (claudeErr: any) {
      console.error("Claude review failed after retries, returning results without review:", claudeErr?.message);
      claudeReview = {
        corrections: [],
        additional_issues: [],
        overall_verdict: "⚠️ Claude review was unavailable (server overloaded). The Gemini + GPT analysis above is still valid. Try again later for the expert review.",
      };
    }

    return NextResponse.json({
      success: true,
      geminiAnalysis,
      tableData,
      claudeReview,
    });
  } catch (error: any) {
    const message = error?.message || error?.toString() || "Unknown error in CRO analysis pipeline";
    const isBodyTooLarge = message.includes("body exceeded") || message.includes("too large") || message.includes("ENOBUFS");
    console.error("Error in CRO chat pipeline:", message);
    return NextResponse.json(
      {
        success: false,
        error: isBodyTooLarge
          ? "Image too large. Please use a smaller screenshot."
          : message,
      },
      { status: isBodyTooLarge ? 413 : 500 }
    );
  }
}
