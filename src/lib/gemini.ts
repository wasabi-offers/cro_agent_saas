import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger, traced } from "@/lib/braintrust";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface CROChangeItem {
  description: string;
  before?: string;
  after?: string;
  impact: "positive" | "negative" | "neutral";
  importance: "low" | "medium" | "high" | "critical";
}

export interface PageElement {
  element_type: string;
  position: string;
  content: string;
  styling: string;
  cro_role: string;
}

export interface CROAnalysisResult {
  summary: string;
  is_baseline: boolean;
  changes_detected: boolean;
  severity: "none" | "minor" | "moderate" | "major";
  overall_impact: "positive" | "negative" | "neutral" | "mixed";
  cro_score: number;
  cro_score_previous?: number;
  page_structure: {
    total_sections: number;
    page_height_estimate: string;
    sections: Array<{
      section_name: string;
      position: string;
      elements: PageElement[];
    }>;
  };
  categories: {
    text_changes: CROChangeItem[];
    layout_ux_changes: CROChangeItem[];
    visual_ui_changes: CROChangeItem[];
    cta_changes: CROChangeItem[];
    navigation_changes: CROChangeItem[];
    trust_signals: CROChangeItem[];
    pricing_offers: CROChangeItem[];
  };
  key_observations: string[];
  recommendations: string[];
}

const BASELINE_PROMPT = `You are the world's top CRO (Conversion Rate Optimization) analyst. You must analyze this FULL-PAGE website screenshot with EXTREME thoroughness. This is a complete full-page capture from top to bottom.

## YOUR TASK: Complete Element-by-Element Page Audit

Scan the ENTIRE page from top to bottom. For EVERY visible section and element, document:

### 1. PAGE STRUCTURE MAPPING
Break the page into sections (top to bottom). For each section identify:
- Section name (e.g. "Top Navigation Bar", "Hero Section", "Features Grid", "Testimonials", "Pricing Table", "Footer")
- Position (e.g. "top 0-100px", "middle 400-800px", "bottom 2000-2400px")
- Every element inside with:
  - element_type: "logo" | "nav_link" | "headline" | "subheadline" | "paragraph" | "button_cta" | "image" | "icon" | "badge" | "testimonial" | "price" | "form_field" | "video" | "card" | "list_item" | "social_link" | "footer_link" | "banner" | "popup" | "countdown" | "rating" | "checkbox" | "dropdown" | "search_bar" | "other"
  - position: where exactly on the page (e.g. "hero section, center-aligned, below headline")
  - content: the exact text or description of what's shown
  - styling: colors, font size estimate, bold/italic, background, border, shadow, padding
  - cro_role: what role this plays in conversion (e.g. "primary CTA", "trust builder", "urgency trigger", "value proposition", "objection handler", "social proof", "navigation aid")

### 2. CRO ELEMENT ANALYSIS
For each element, evaluate its CRO effectiveness:
- Headlines: Are they benefit-driven? Clear value proposition?
- CTAs: Text, color, size, contrast, placement. How many CTAs total? Are they above the fold?
- Trust signals: What proof/credibility elements exist? Where are they placed?
- Social proof: Testimonials, reviews, user counts, logos
- Pricing: How is pricing displayed? Is there anchoring? Urgency?
- Forms: How many fields? Is there friction?
- Images: Are they relevant? Do they support the message?
- Navigation: Is it clean? Does it distract from conversion?
- White space, visual hierarchy, reading flow
- Mobile indicators: responsive elements, hamburger menus

### 3. SCORING
Score the overall CRO effectiveness 1-100 based on:
- Value proposition clarity (0-15)
- CTA effectiveness (0-15)
- Trust & social proof (0-15)
- Visual hierarchy & design (0-10)
- Content quality & persuasion (0-15)
- UX & navigation (0-10)
- Urgency & scarcity (0-10)
- Form/checkout friction (0-10)

Respond ONLY with valid JSON in this exact structure (no markdown, no backticks):
{
  "summary": "Comprehensive CRO audit summary (4-6 sentences covering the full page)",
  "is_baseline": true,
  "changes_detected": false,
  "severity": "none",
  "overall_impact": "neutral",
  "cro_score": <1-100>,
  "page_structure": {
    "total_sections": <number>,
    "page_height_estimate": "<e.g. ~3500px>",
    "sections": [
      {
        "section_name": "e.g. Navigation Bar",
        "position": "e.g. top 0-80px",
        "elements": [
          {
            "element_type": "logo",
            "position": "top-left",
            "content": "Brand Name visible",
            "styling": "white background, ~40px height, left-aligned",
            "cro_role": "brand recognition"
          }
        ]
      }
    ]
  },
  "categories": {
    "text_changes": [],
    "layout_ux_changes": [],
    "visual_ui_changes": [],
    "cta_changes": [],
    "navigation_changes": [],
    "trust_signals": [],
    "pricing_offers": []
  },
  "key_observations": ["observation1", "observation2", "...at least 8-10 observations"],
  "recommendations": ["recommendation1", "recommendation2", "...at least 8-10 actionable recommendations"]
}

BE EXHAUSTIVE. Map EVERY element you can see. Do NOT skip sections. Analyze the ENTIRE page from the very top navigation to the very bottom footer. The more detail, the better.`;

const COMPARISON_PROMPT = `You are the world's top CRO (Conversion Rate Optimization) analyst specializing in competitive intelligence and change detection. You are comparing two FULL-PAGE screenshots of the same website taken on different days.

The FIRST image is the PREVIOUS version (yesterday).
The SECOND image is the CURRENT version (today).

Both images are full-page captures from top to bottom.

## YOUR TASK: Pixel-Level Element-by-Element Comparison

### STEP 1: MAP BOTH PAGES
First, mentally map every section and element on BOTH pages from top to bottom:
- Navigation bar (logo, menu items, CTA buttons, search, cart)
- Announcement/promo bars
- Hero section (headline, subheadline, CTA, hero image/video)
- Feature/benefit sections
- Product/service cards or grids
- Testimonials/reviews section
- Social proof (logos, user counts, ratings)
- Pricing tables or offers
- FAQ sections
- Lead capture forms
- Trust badges / certifications
- Footer (links, social media, legal, newsletter signup)
- Popups, banners, floating elements
- Any other sections

### STEP 2: COMPARE ELEMENT BY ELEMENT
Go through EVERY element on both versions and check for ANY difference, no matter how small:

1. **TEXT CHANGES** (CRITICAL - read every word):
   - Headlines: exact wording comparison
   - Subheadlines: exact wording comparison
   - Body paragraphs: any word changes, additions, removals
   - Button text: exact CTA text comparison
   - Menu items: any label changes
   - Footer text: copyright, legal, description changes
   - Pricing text: numbers, currency, period
   - Testimonial text: quotes, names, titles
   - Badge/label text: "NEW", "SALE", "LIMITED", etc.
   - For EACH text change, provide the exact "before" and "after" text

2. **LAYOUT/UX CHANGES**:
   - Section order: did any sections move up or down?
   - Section added or removed entirely?
   - Element spacing changes (more/less padding or margin)
   - Column layout changes (e.g. 3-col became 4-col)
   - Element alignment changes (left to center, etc.)
   - Content width changes
   - Section height changes
   - For EACH layout change, describe the exact position shift

3. **VISUAL/UI CHANGES**:
   - Background color changes (even subtle shade differences)
   - Button color/style changes
   - Font size or weight changes
   - Image replacements (different photo, illustration, or graphic)
   - Icon changes
   - Border or shadow changes
   - Gradient changes
   - Opacity or overlay changes
   - For EACH visual change, describe before styling vs after styling

4. **CTA CHANGES** (HIGH PRIORITY):
   - Button text changes
   - Button color changes
   - Button size changes (bigger/smaller)
   - Button position changes (moved higher/lower)
   - Number of CTAs changed (added or removed)
   - CTA urgency additions (countdown, "limited time", etc.)
   - For EACH CTA change, explain the CRO impact

5. **NAVIGATION CHANGES**:
   - Menu items added or removed
   - Menu item text changes
   - Menu order changes
   - Dropdown content changes
   - Header layout changes
   - Search bar changes
   - Cart/account icon changes

6. **TRUST SIGNALS**:
   - New or removed testimonials
   - Changed review counts or ratings
   - New or removed partner/client logos
   - New or removed certification badges
   - Guarantee text changes
   - "As seen in" section changes

7. **PRICING/OFFERS**:
   - Price amount changes
   - Discount percentage changes
   - New promotional banners
   - Shipping offer changes
   - Bundle/package changes
   - Payment method icon changes
   - Trial/free offer changes

### STEP 3: BUILD THE PAGE STRUCTURE MAP
Map the CURRENT version's full page structure (same as baseline), documenting every section and element with position, content, styling, and CRO role.

### STEP 4: ASSESS CRO IMPACT
For each change:
- Is it "positive" (improves conversions), "negative" (hurts conversions), or "neutral"?
- Is it "low", "medium", "high", or "critical" importance?
- Explain WHY it matters for conversion rate

### STEP 5: SCORE
Score both versions 1-100 for CRO effectiveness and show the delta.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "summary": "Detailed summary of ALL changes detected across the entire page (4-6 sentences)",
  "is_baseline": false,
  "changes_detected": <true if ANY change found, false only if pages are pixel-identical>,
  "severity": "<none|minor|moderate|major>",
  "overall_impact": "<positive|negative|neutral|mixed>",
  "cro_score": <current version score 1-100>,
  "cro_score_previous": <previous version score 1-100>,
  "page_structure": {
    "total_sections": <number of sections in current version>,
    "page_height_estimate": "<e.g. ~4200px>",
    "sections": [
      {
        "section_name": "Section Name",
        "position": "position range on page",
        "elements": [
          {
            "element_type": "type",
            "position": "exact position in section",
            "content": "exact visible text or element description",
            "styling": "colors, sizes, fonts, backgrounds",
            "cro_role": "conversion role of this element"
          }
        ]
      }
    ]
  },
  "categories": {
    "text_changes": [{"description": "Exact description of what changed", "before": "exact old text", "after": "exact new text", "impact": "positive|negative|neutral", "importance": "low|medium|high|critical"}],
    "layout_ux_changes": [{"description": "...", "before": "old layout state", "after": "new layout state", "impact": "...", "importance": "..."}],
    "visual_ui_changes": [{"description": "...", "before": "old visual style", "after": "new visual style", "impact": "...", "importance": "..."}],
    "cta_changes": [{"description": "...", "before": "old CTA state", "after": "new CTA state", "impact": "...", "importance": "..."}],
    "navigation_changes": [{"description": "...", "before": "...", "after": "...", "impact": "...", "importance": "..."}],
    "trust_signals": [{"description": "...", "before": "...", "after": "...", "impact": "...", "importance": "..."}],
    "pricing_offers": [{"description": "...", "before": "...", "after": "...", "impact": "...", "importance": "..."}]
  },
  "key_observations": ["obs1", "obs2", "...at least 8-10 detailed observations"],
  "recommendations": ["rec1", "rec2", "...at least 8-10 actionable recommendations based on current state and changes"]
}

CRITICAL RULES:
- Analyze the ENTIRE page, not just above-the-fold. Scroll through both images completely.
- Report EVERY change, even a single word or pixel-level color shift.
- If the pages look identical, still map all elements and confirm "changes_detected: false".
- Be exhaustive. Missing a change is a failure.
- Include at least 8-10 key observations and recommendations.`;

export async function analyzeBaselineScreenshot(
  screenshotBase64: string
): Promise<CROAnalysisResult> {
  return traced(async (span) => {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 16000,
        temperature: 0.1,
      },
    });

    const result = await model.generateContent([
      BASELINE_PROMPT,
      {
        inlineData: {
          data: screenshotBase64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Gemini response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]) as CROAnalysisResult;

    span.log({
      input: { prompt: "BASELINE_PROMPT", screenshotLength: screenshotBase64.length },
      output: parsed,
      metadata: { model: "gemini-2.0-flash", type: "baseline_analysis" },
    });

    return parsed;
  }, { name: "gemini-baseline-analysis" });
}

export async function compareScreenshots(
  previousBase64: string,
  currentBase64: string
): Promise<CROAnalysisResult> {
  return traced(async (span) => {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 16000,
        temperature: 0.1,
      },
    });

    const result = await model.generateContent([
      COMPARISON_PROMPT,
      {
        inlineData: {
          data: previousBase64,
          mimeType: "image/jpeg",
        },
      },
      {
        inlineData: {
          data: currentBase64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Gemini response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]) as CROAnalysisResult;

    span.log({
      input: {
        prompt: "COMPARISON_PROMPT",
        previousLength: previousBase64.length,
        currentLength: currentBase64.length,
      },
      output: parsed,
      metadata: { model: "gemini-2.0-flash", type: "screenshot_comparison" },
    });

    return parsed;
  }, { name: "gemini-screenshot-comparison" });
}
