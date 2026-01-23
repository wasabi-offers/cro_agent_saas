import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CROTableRow } from "@/lib/saved-items";

interface CROTableRequest {
  url: string;
  type: 'landing' | 'funnel';
  context?: string;
  funnelData?: {
    id: string;
    name: string;
    steps: Array<{
      name: string;
      url?: string;
      visitors: number;
      dropoff: number;
    }>;
    conversionRate: number;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, type, context, funnelData } = body as CROTableRequest;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // Log funnel data if provided
    if (funnelData) {
      console.log("📊 Analyzing funnel:", funnelData.name);
      console.log("📈 Conversion rate:", funnelData.conversionRate.toFixed(2) + "%");
      console.log("📉 Steps with dropoff:");
      funnelData.steps.forEach((step, idx) => {
        if (step.dropoff > 0) {
          console.log(`   ${idx + 1}. ${step.name}: ${step.dropoff}% dropoff (${step.visitors} visitors)`);
        }
      });
    }

    const systemPrompt = `You are an expert CRO consultant with 15+ years of experience. You analyze websites and generate detailed, data-driven optimization recommendations in a structured format.

Your analysis must be:
• Based on REAL CRO principles (Cialdini persuasion, behavioral economics, UX best practices)
• Include SPECIFIC metrics and expected improvements
• Provide EXACT changes to test (not vague suggestions)
• Reference real case studies and research when possible
• Include implementation effort and confidence scores

## FEW-SHOT EXAMPLES OF EXCELLENT CRO DECISION TABLE ROWS:

**Example 1 - Trust Signal Optimization:**
{
  "id": 1,
  "metricObserved": "Scroll depth median 42%. 68% users never reach testimonials section at 800px.",
  "whatYouSee": "Most users don't reach conviction before encountering price at 650px. Trust signals appear too late in funnel.",
  "correctAssumption": "Primary blocker: Social proof appears AFTER price exposure. Users hesitate because belief is incomplete at decision moment. Psychology: Social Proof (Cialdini) must precede commitment ask. Booking.com study: moving reviews above fold increased conversions 34%.",
  "wrongAssumption": "People don't care about reviews / Bad UX only / Price is too high",
  "practicalTest": {
    "title": "Strategic Test - Early Trust Signal",
    "from": "Testimonials section at 800px below fold, after pricing",
    "to": "Move 3 testimonials with photos immediately under headline (200px). Add: full names, photos, companies, specific results. Format: '★★★★★ Increased conversions 67% in 2 weeks - Sarah Chen, Head of Marketing @ TechCorp'",
    "details": [
      "Select 3 highest-impact testimonials with measurable results",
      "Add professional photos (builds credibility +41%)",
      "Include company logos next to testimonials",
      "Add star ratings for visual quick-scan",
      "Keep above price section at 650px"
    ]
  },
  "expectedLift": "+12-18% conversion rate",
  "kpiToObserve": ["Conversion rate (primary)", "Time to CTA click", "Bounce rate at pricing section"],
  "priority": "high"
}

**Example 2 - CTA Copy Optimization:**
{
  "id": 2,
  "metricObserved": "CTA button click-through: 8.2%. Industry benchmark: 12-15%. Button visible (94% viewport), but low engagement.",
  "whatYouSee": "CTA button has visibility but lacks urgency. Generic 'Get Started' copy doesn't communicate value or overcome hesitation.",
  "correctAssumption": "Copy lacks specificity and urgency. Psychology: Loss Aversion (Kahneman) + Specificity Effect. Generic CTAs reduce clicks by 47% vs benefit-driven copy (Unbounce 2024). Users need to know WHAT they get and WHY now.",
  "wrongAssumption": "Button color is wrong / Size needs to increase / Position is bad",
  "practicalTest": {
    "title": "Message Test - Value-Driven CTA",
    "from": "Get Started",
    "to": "Test 3 variants: A) 'Start My Free 14-Day Trial' B) 'Get Instant Access - No Credit Card' C) 'See Results in 7 Days - Start Free'",
    "details": [
      "Variant A emphasizes trial length (reduces risk)",
      "Variant B addresses credit card objection directly",
      "Variant C focuses on outcome timeline + risk reversal",
      "Keep button size/color/position constant to isolate copy impact",
      "Run as multi-armed bandit test for faster learning"
    ]
  },
  "expectedLift": "+15-25% CTA clicks",
  "kpiToObserve": ["CTA click-through rate (primary)", "Trial signup rate", "Time on page before click"],
  "priority": "high"
}

**Example 3 - Form Friction Reduction:**
{
  "id": 3,
  "metricObserved": "Form starts: 312. Form completions: 89 (28.5% completion rate). Industry average: 45-60%. Average fields filled before abandonment: 4.2/7 fields.",
  "whatYouSee": "High form abandonment at field 5 (company size dropdown). Users hesitate when asked for company information early in funnel.",
  "correctAssumption": "Form friction: asking for commitment-heavy information before trust is established. Psychology: Endowment Effect - users protect information until they feel ownership. Progressive profiling reduces abandonment 40% (HubSpot). Ask minimal info upfront, gather more post-signup.",
  "wrongAssumption": "Users are lazy / Form design is ugly / Need better copy",
  "practicalTest": {
    "title": "Structural Test - Minimal Form + Progressive Profiling",
    "from": "7-field form: Name, Email, Password, Company, Company Size, Industry, Phone",
    "to": "3-field form: Email, Password, Company Name. Move Company Size, Industry, Phone to post-signup onboarding flow.",
    "details": [
      "Reduce initial form to absolute minimum (3 fields)",
      "Add progress indicator if keeping multi-step",
      "Collect additional info during onboarding (when trust is higher)",
      "Add micro-copy: 'Takes 30 seconds' near form",
      "Test with/without phone field (often biggest friction point)"
    ]
  },
  "expectedLift": "+35-50% form completion rate",
  "kpiToObserve": ["Form completion rate (primary)", "Time to complete form", "Field-level drop-off rates", "Overall conversion rate"],
  "priority": "high"
}

Generate CRO Decision Table with these columns:
• Metric Observed: Data/behavior with percentages
• What You See: User behavior description
• Correct Assumption: What to do, WHY (psychological principle), with case study
• Wrong Assumption: Common mistakes to avoid
• Practical Test: Exact A/B test with FROM (actual current content) and TO (specific alternatives)
• Expected Lift: Predicted improvement
• KPI to Observe: Metrics to track
• Priority: high/medium/low based on impact vs effort`;

    // Fetch the actual landing page HTML content
    console.log("🌐 Fetching page content from:", url);
    let pageContent = "";
    try {
      const pageResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CROAgent/1.0; +https://croagent.com/bot)",
        },
      });

      if (!pageResponse.ok) {
        console.error(`❌ Failed to fetch page: ${pageResponse.status} ${pageResponse.statusText}`);
      } else {
        pageContent = await pageResponse.text();
        console.log(`✅ Fetched ${pageContent.length} characters`);
        // Limit content to first 100000 chars (increased for better analysis)
        pageContent = pageContent.substring(0, 100000);
        console.log(`📝 Using first ${pageContent.length} characters for analysis`);
      }
    } catch (fetchError) {
      console.error("❌ Error fetching page:", fetchError);
      // If we can't fetch the page, still try to analyze with URL only
    }

    const userPrompt = `Analyze this ${type} and generate a detailed CRO Decision Table based on REAL page content following the examples in the system prompt.

## TARGET PAGE:
URL: ${url}
${context ? `Context: ${context}` : ''}

${funnelData ? `## REAL FUNNEL TRACKING DATA:
Funnel: ${funnelData.name}
Overall Conversion Rate: ${funnelData.conversionRate.toFixed(2)}%
Steps:
${funnelData.steps.map((step, index) => `  ${index + 1}. ${step.name}: ${step.visitors} visitors${step.dropoff > 0 ? `, ${step.dropoff}% dropoff` : ''}`).join('\n')}

PRIMARY OPTIMIZATION TARGETS (by dropoff %):
${funnelData.steps
  .filter(s => s.dropoff > 0)
  .sort((a, b) => b.dropoff - a.dropoff)
  .slice(0, 3)
  .map((s, i) => `  ${i + 1}. ${s.name}: ${s.dropoff}% dropoff - FOCUS HERE`)
  .join('\n')}

Use these REAL metrics to identify bottlenecks:
• Which step has highest dropoff? (primary target)
• What psychological barriers explain the dropoffs?
• Where are users abandoning the funnel?
` : ''}

${pageContent ? `## ACTUAL PAGE HTML (first 100k chars):
${pageContent}

ANALYZE THE REAL CONTENT ABOVE:
• Actual headlines, copy, messaging
• Real CTAs, their text, placement, design
• Actual trust signals, testimonials, social proof
• Real form fields and labels
• Actual colors, visual hierarchy, contrast
• Real page structure and content flow

CRITICAL: Base recommendations on ACTUAL page content. Quote real text in the "from" field of practicalTest.
` : '⚠️ Could not fetch page content. Provide best practices based on URL and funnel data.'}

Generate 5-8 high-impact optimization opportunities following the examples. For EACH opportunity:

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

CRITICAL: Return ONLY a valid JSON array. No explanatory text before or after. Just the JSON array starting with [ and ending with ].

Expected JSON structure:
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

IMPORTANT INSTRUCTIONS:
- Return ONLY the JSON array above
- NO explanatory text before the JSON
- NO explanatory text after the JSON
- NO markdown code blocks (no \`\`\`json)
- Start your response with [ and end with ]
- Make recommendations SPECIFIC and ACTIONABLE based on the ACTUAL page content
- Include real psychological principles, case study references, and concrete numbers`;

    // If API key available, use Claude
    if (process.env.ANTHROPIC_API_KEY) {
      console.log("🤖 Calling Claude API for CRO analysis...");
      try {
        const client = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514", // Upgraded to Sonnet 4 for superior analysis
          max_tokens: 8000, // Increased for comprehensive CRO table
          temperature: 0.3, // Lower for consistent, data-driven output
          top_p: 0.9, // Focused sampling
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" } // Cache system prompt (90% cost savings)
            }
          ],
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt,
                  cache_control: { type: "ephemeral" } // Cache page content too (changes per URL but reused in follow-ups)
                }
              ]
            },
          ],
        });

        console.log("✅ Received response from Claude");
        const textContent = message.content.find((c) => c.type === "text");
        if (textContent && textContent.type === "text") {
          console.log("📄 Parsing JSON response...");
          try {
            // Parse JSON from Claude's response
            let jsonText = textContent.text.trim();
            console.log("Raw response length:", jsonText.length);
            console.log("First 500 chars:", jsonText.substring(0, 500));
            console.log("Last 200 chars:", jsonText.substring(Math.max(0, jsonText.length - 200)));

            // Remove markdown code blocks if present
            if (jsonText.includes('```json')) {
              jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
              console.log("Removed ```json markers");
            } else if (jsonText.includes('```')) {
              jsonText = jsonText.replace(/```\s*/g, '');
              console.log("Removed ``` markers");
            }

            // Try multiple regex patterns to extract JSON array
            let jsonMatch = null;

            // Pattern 1: Most permissive - finds [ ... ] with anything inside
            jsonMatch = jsonText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              console.log("✅ Found JSON array with pattern 1 (permissive)");
              jsonText = jsonMatch[0];
            } else {
              // Pattern 2: Look for array of objects
              jsonMatch = jsonText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
              if (jsonMatch) {
                console.log("✅ Found JSON array with pattern 2 (objects)");
                jsonText = jsonMatch[0];
              } else {
                console.log("⚠️ No JSON array found with regex, trying to clean text");
                // Remove any text before first [ and after last ]
                const firstBracket = jsonText.indexOf('[');
                const lastBracket = jsonText.lastIndexOf(']');
                if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                  jsonText = jsonText.substring(firstBracket, lastBracket + 1);
                  console.log("✅ Extracted text between [ and ]");
                }
              }
            }

            console.log("Attempting to parse JSON...");
            const aiRows = JSON.parse(jsonText);
            console.log(`✅ Successfully parsed JSON with ${aiRows.length} CRO recommendations`);

            // Validate that it's an array
            if (!Array.isArray(aiRows)) {
              throw new Error("Response is not an array");
            }

            // Validate each row has required fields
            console.log("Validating row structure...");
            aiRows.forEach((row: any, index: number) => {
              if (!row.metricObserved) console.warn(`Row ${index + 1}: missing metricObserved`);
              if (!row.correctAssumption) console.warn(`Row ${index + 1}: missing correctAssumption`);
              if (!row.practicalTest) console.warn(`Row ${index + 1}: missing practicalTest`);
              if (!row.expectedLift) console.warn(`Row ${index + 1}: missing expectedLift`);
              if (!Array.isArray(row.kpiToObserve)) console.warn(`Row ${index + 1}: kpiToObserve is not an array`);
            });

            // Transform to CROTableRow format
            const rows: CROTableRow[] = aiRows.map((row: any) => ({
              id: row.id,
              metricObserved: row.metricObserved || '',
              whatYouSee: row.whatYouSee || '',
              correctAssumption: row.correctAssumption || '',
              wrongAssumption: row.wrongAssumption || '',
              practicalTest: row.practicalTest || { title: '', from: '', to: '', details: [] },
              expectedLift: row.expectedLift || '',
              kpiToObserve: Array.isArray(row.kpiToObserve) ? row.kpiToObserve : [],
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
            console.error("❌ Error parsing AI response:", parseError);
            console.log("📝 Full raw response:");
            console.log(textContent.text);
            console.log("---END OF RESPONSE---");

            return NextResponse.json(
              {
                success: false,
                error: "Failed to parse AI response. Check server logs for details.",
                rawResponse: textContent.text.substring(0, 1000),
                parseError: parseError instanceof Error ? parseError.message : "Unknown parse error",
              },
              { status: 500 }
            );
          }
        } else {
          console.error("❌ No text content in Claude response");
          return NextResponse.json(
            {
              success: false,
              error: "No text content in Claude response",
            },
            { status: 500 }
          );
        }
      } catch (aiError) {
        console.error("❌ AI error:", aiError);
        return NextResponse.json(
          {
            success: false,
            error: aiError instanceof Error ? aiError.message : "AI analysis failed",
            details: "Check that ANTHROPIC_API_KEY is valid and has credits",
          },
          { status: 500 }
        );
      }
    }

    // No API key configured
    return NextResponse.json(
      {
        success: false,
        error: "ANTHROPIC_API_KEY not configured. Cannot generate CRO analysis.",
      },
      { status: 500 }
    );

    /* REMOVED: Mock data fallback - we want real analysis only
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
    ]; */
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
