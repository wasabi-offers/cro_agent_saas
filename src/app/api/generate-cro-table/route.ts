import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CROTableRow } from "@/lib/saved-items";

interface CROTableRequest {
  url: string;
  type: 'landing' | 'funnel';
  context?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, type, context } = body as CROTableRequest;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert CRO consultant with 15+ years of experience. You analyze websites and generate detailed, data-driven optimization recommendations in a structured format.

Your analysis must be:
1. Based on REAL CRO principles (Cialdini persuasion, behavioral economics, UX best practices)
2. Include SPECIFIC metrics and expected improvements
3. Provide EXACT changes to test (not vague suggestions)
4. Reference real case studies and research when possible

Generate a CRO Decision Table with these exact columns:
- Metric Observed: What data/behavior you see (with percentages)
- What You See: User behavior description
- Correct Assumption: What to do and WHY (psychological principle)
- Wrong Assumption: Common mistake to avoid
- Practical Test: Exact A/B test with FROM and TO variants
- Expected Lift: Predicted improvement (e.g., +15-20% RPV)
- KPI to Observe: Metrics to track
- Run Test: Status tracking`;

    // Fetch the actual landing page HTML content
    let pageContent = "";
    try {
      const pageResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CROAgent/1.0; +https://croagent.com/bot)",
        },
      });
      pageContent = await pageResponse.text();
      // Limit content to avoid token limits
      pageContent = pageContent.substring(0, 50000);
    } catch (fetchError) {
      console.error("Error fetching page:", fetchError);
      // If we can't fetch the page, still try to analyze with URL only
    }

    const userPrompt = `Analyze this ${type} and generate a detailed CRO Decision Table based on REAL page content:

URL: ${url}
${context ? `Context: ${context}` : ''}

${pageContent ? `ACTUAL PAGE HTML (first 50k chars):
${pageContent}

CRITICAL: Analyze the REAL content above. Look at:
- Actual headlines, copy, and messaging
- Real CTAs and their placement
- Actual trust signals, testimonials, social proof
- Real form fields and their labels
- Actual colors, images, and visual hierarchy
- Real page structure and sections

Base your recommendations on what you ACTUALLY see in the HTML, not generic assumptions.
` : 'WARNING: Could not fetch page content. Provide generic best practices.'}

Generate 5-8 high-impact optimization opportunities based on the ACTUAL page content. For EACH opportunity provide:

1. **Metric Observed**: Specific data point with percentage (e.g., "Scroll depth median 42%. 68% users never reach reviews")

2. **What You See**: User behavior observation (e.g., "Most users don't reach conviction before price. Move trust earlier to reduce hesitation")

3. **Correct Assumption**: What to do and WHY with psychological principle (e.g., "Primary blocker: Mechanism credibility is not established *before* price exposure. Users hesitate because belief is incomplete at decision moment")

4. **Wrong Assumption**: Common mistake (e.g., "People don't care about reviews" or "Bad UX only")

5. **Practical Test**: EXACT change to test based on ACTUAL page content
   - Title: Test name (e.g., "Strategic Test - Hero Reframe")
   - FROM: EXACT current copy/element from the page (quote the actual text you see in the HTML)
   - TO: Your proposed improved version (write the EXACT new copy/change)
   - Details: Step-by-step implementation instructions (array of specific actionable steps)

   IMPORTANT: The FROM field MUST contain actual text/elements from the page HTML. Don't make up examples - use real content!

6. **Expected Lift**: Specific prediction (e.g., "+10-18% RPV", "+6-12% ATC")

7. **KPI to Observe**: Array of 2-4 metrics to track (e.g., ["RPV (primary)", "ATC %", "Time-to-CTA"])

8. **Priority**: "high", "medium", or "low" based on impact vs effort

Return ONLY a JSON array of objects with this structure:
[
  {
    "id": 1,
    "metricObserved": "string",
    "whatYouSee": "string",
    "correctAssumption": "string",
    "wrongAssumption": "string",
    "practicalTest": {
      "title": "string",
      "from": "string",
      "to": "string",
      "details": ["string", "string"]
    },
    "expectedLift": "string",
    "kpiToObserve": ["string", "string"],
    "priority": "high" | "medium" | "low"
  }
]

Make recommendations SPECIFIC and ACTIONABLE. Include real psychological principles, case study references, and concrete numbers.`;

    // If API key available, use Claude
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const client = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const message = await client.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 6000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
        });

        const textContent = message.content.find((c) => c.type === "text");
        if (textContent && textContent.type === "text") {
          try {
            // Parse JSON from Claude's response
            let jsonText = textContent.text.trim();

            // Remove markdown code blocks if present
            if (jsonText.startsWith('```json')) {
              jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
            } else if (jsonText.startsWith('```')) {
              jsonText = jsonText.replace(/```\n?/g, '');
            }

            const aiRows = JSON.parse(jsonText);

            // Transform to CROTableRow format
            const rows: CROTableRow[] = aiRows.map((row: any) => ({
              id: row.id,
              metricObserved: row.metricObserved,
              whatYouSee: row.whatYouSee || '',
              correctAssumption: row.correctAssumption,
              wrongAssumption: row.wrongAssumption || '',
              practicalTest: row.practicalTest,
              expectedLift: row.expectedLift,
              kpiToObserve: row.kpiToObserve,
              runTest: {
                status: 'not-started' as const,
              },
            }));

            return NextResponse.json({
              success: true,
              rows,
              generatedAt: new Date().toISOString(),
              source: "ai",
            });
          } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
            console.log("Raw response:", textContent.text);
            // Fall through to mock data
          }
        }
      } catch (aiError) {
        console.error("AI error:", aiError);
        // Fall through to mock data
      }
    }

    // Mock data fallback
    const mockRows: CROTableRow[] = [
      {
        id: 1,
        metricObserved: "Scroll depth median 42%. 68% users never reach testimonials.",
        whatYouSee: "Most users don't reach conviction before price",
        correctAssumption: "Proof appears too late. Users don't reach conviction before price exposure. Move trust earlier to reduce hesitation.",
        wrongAssumption: "\"People don't care about reviews\"",
        practicalTest: {
          title: "Strategic Test - Hero Reframe",
          from: "\"Restore Your Energy Naturally\"",
          to: "\"Restore Your Energy in 7 Days — Backed by 1,247 Verified Customers\"",
          details: [
            "Insert 1 short testimonial directly under headline",
            "Add trust badges above fold",
          ],
        },
        expectedLift: "+8-15% RPV",
        kpiToObserve: ["RPV (primary)", "ATC %"],
        runTest: {
          status: 'not-started',
        },
      },
      {
        id: 2,
        metricObserved: "Many clicks on non-clickable headline",
        whatYouSee: "Users try to interact",
        correctAssumption: "Headline resonates but users seek clarification. Add interaction to satisfy curiosity instead of forcing scroll.",
        wrongAssumption: "\"Bad UX only\"",
        practicalTest: {
          title: "Structural Test - Interactive Mechanism Reveal",
          from: "Static headline",
          to: "Make headline clickable → expands \"How it Works in 3 Steps\" (collapsed by default)",
        },
        expectedLift: "+5-10% ATC",
        kpiToObserve: ["ATC %", "Time-to-CTA"],
        runTest: {
          status: 'not-started',
        },
      },
      {
        id: 3,
        metricObserved: "Ingredient image receives 23% of all clicks",
        whatYouSee: "Curiosity about how it works",
        correctAssumption: "Users want mechanism clarity, not branding. Visual explanation missing.",
        wrongAssumption: "\"Add more ingredients\"",
        practicalTest: {
          title: "Mechanism Test - Visual Proof",
          from: "Static bottle image",
          to: "Replace with annotated diagram: Step 1: Absorption, Step 2: Cellular activation, Step 3: Energy output",
        },
        expectedLift: "+6-12% RPV",
        kpiToObserve: ["RPV", "Scroll depth"],
        runTest: {
          status: 'not-started',
        },
      },
      {
        id: 4,
        metricObserved: "Avg time on page 2m47s. ATC only 6.1%",
        whatYouSee: "Interest without conviction",
        correctAssumption: "Interest exists, conviction does not. Missing time-based outcome framing to resolve uncertainty.",
        wrongAssumption: "\"They're just browsing\"",
        practicalTest: {
          title: "Framing Test - Outcome Timeline",
          from: "Generic benefit list",
          to: "Add section before price: Headline: \"What You'll Feel — Day by Day\". Day 1-3 / Day 4-7 / Day 8+",
        },
        expectedLift: "+7-14% ATC",
        kpiToObserve: ["ATC %", "RPV"],
        runTest: {
          status: 'not-started',
        },
      },
      {
        id: 5,
        metricObserved: "Users pause at price then scroll upward",
        whatYouSee: "Price anchoring failure",
        correctAssumption: "Value anchoring failure. Price shown before value comparison locks in resistance.",
        wrongAssumption: "\"Lower the price\"",
        practicalTest: {
          title: "Offer Framing Test",
          from: "Price shown directly",
          to: "Insert comparison block ABOVE price: \"$79 = less than $2/day vs energy drinks, coffee, pre-workouts\"",
        },
        expectedLift: "+5-9% RPV",
        kpiToObserve: ["RPV"],
        runTest: {
          status: 'not-started',
        },
      },
      {
        id: 6,
        metricObserved: "FAQ \"Does it work for me?\" opened repeatedly",
        whatYouSee: "Same objection repeats",
        correctAssumption: "Core objection unresolved in main narrative. FAQ is compensating for weak claim placement.",
        wrongAssumption: "\"Add more FAQs\"",
        practicalTest: {
          title: "Message Promotion Test",
          from: "FAQ buried below",
          to: "Pull FAQ answer into bold section: Headline: \"Works Even If Nothing Else Has\" + 3 proof bullets",
        },
        expectedLift: "+6-10% ATC",
        kpiToObserve: ["ATC %", "FAQ opens ↓"],
        runTest: {
          status: 'not-started',
        },
      },
      {
        id: 7,
        metricObserved: "Mobile RPV 38% lower than desktop",
        whatYouSee: "Cognitive overload on mobile",
        correctAssumption: "Mobile cognitive overload. Too many decisions at once during scroll.",
        wrongAssumption: "\"Mobile users don't buy\"",
        practicalTest: {
          title: "Mobile-only Structural Test",
          from: "Long sections",
          to: "Collapse long sections. Single sticky CTA. Progressive disclosure pattern.",
          details: [
            "Sticky progress bar showing scroll %",
            "Auto-expand sections on reach",
          ],
        },
        expectedLift: "+10-18% mobile RPV",
        kpiToObserve: ["Mobile RPV"],
        runTest: {
          status: 'not-started',
        },
      },
    ];

    return NextResponse.json({
      success: true,
      rows: mockRows,
      generatedAt: new Date().toISOString(),
      source: "mock",
    });
  } catch (error) {
    console.error("CRO table generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
