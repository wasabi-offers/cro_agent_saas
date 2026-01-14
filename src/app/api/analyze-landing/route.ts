import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  TrendingUp,
  Type,
  Palette,
  MousePointer,
} from "lucide-react";

// This API analyzes landing pages for CRO improvements
interface AnalysisRequest {
  url: string;
  filters: string[];
}

interface AnalysisResult {
  category: string;
  insights: string[];
  score: number;
  icon: string;
}

const CATEGORY_ICONS = {
  cro: "TrendingUp",
  copy: "Type",
  colors: "Palette",
  experience: "MousePointer",
};

const CATEGORY_LABELS = {
  cro: "CRO & Conversions",
  copy: "Copywriting",
  colors: "Colors & Design",
  experience: "User Experience",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, filters } = body as AnalysisRequest;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Mock results for demo (will be replaced with real AI analysis)
    const mockResults: Record<string, AnalysisResult> = {
      cro: {
        category: CATEGORY_LABELS.cro,
        icon: CATEGORY_ICONS.cro,
        score: 58,
        insights: [
          "Primary CTA button lacks visual dominance - positioned below fold with weak color (#4A90E2). Cialdini's Contrast Principle suggests 50% size increase + high-contrast color (orange/red) could lift clicks by 35-45%. Booking.com case: red CTA increased conversions 21%.",
          "No clear call-to-action (CTA) or sign-up form visible above fold, reducing immediate conversion potential by 50-70%. Research shows 80% of users never scroll - every second counts. Add prominent CTA within first 800px with benefit-driven copy.",
          "Lack of social proof elements (testimonials, reviews, logos) above fold decreases sign-ups by 30-40%. Cialdini's Social Proof principle: add 3-5 customer logos + 1 brief testimonial with photo near primary CTA. VWO study: social proof increased conversions 34%.",
          "Missing urgency/scarcity messaging loses 15-25% conversions. Add countdown timer for limited offer or stock indicator. Psychological reactance theory: scarcity triggers FOMO and increases perceived value. Amazon case: 'Only 3 left' increased urgency-based purchases 28%.",
          "Form has 8 fields including optional ones presented as required. Each field reduces completion by 11% (Unbounce study). Reduce to 3 essential: Name, Email, Password. Use progressive profiling post-signup. HubSpot: 3-field form = 120% more conversions vs 8-field.",
          "Unclear value proposition fails to communicate key benefits within 3 seconds, costing 20-30% of potential sign-ups. Apply Jobs-to-be-Done framework: '[Outcome] in [Timeframe] without [Objection]'. Clarity score current: 3/10. Target: 8+/10.",
          "No exit-intent popup to capture abandoning traffic - missing opportunity to convert 10-15% of bouncing visitors. Implement with lead magnet (free guide/discount/trial extension). Sumo study: exit-intent recovered 12.4% of abandoning visitors on average.",
          "Trust signals (security badges, guarantee, privacy policy) buried in footer. Move above fold near CTA. BJ Fogg's Behavior Model: Trust increases ability to convert. Baymard: visible trust signals increased checkout completion 17%.",
          "Mobile CTA too small (32px) below recommended 44px touch target. 41% of mobile visitors encounter tap errors. Increase to 48px minimum. Google Material Design: proper touch targets reduce mobile friction by 23%.",
          "No micro-commitments or progressive disclosure. Users face binary decision (sign up or leave). Add low-commitment steps: 'See Pricing' → 'Start Free Trial' → 'Create Account'. Hook Model (Nir Eyal): small actions build investment.",
        ],
      },
      copy: {
        category: CATEGORY_LABELS.copy,
        icon: CATEGORY_ICONS.copy,
        score: 52,
        insights: [
          "Headline is generic and doesn't highlight unique value proposition, losing 25-35% of potential customers who scan quickly. Current clarity score: 4/10. Apply Schwartz's 5 Levels of Awareness - rewrite to address prospect's exact stage. Effective formula: [Desired Result] + [Timeframe] + [Credibility].",
          "Copy uses technical jargon ('synergistic solutions', 'paradigm shift') reducing comprehension. Flesch Reading Ease score estimated: 35 (college grad level). Target: 60+ (8th grade). Simplify language - a 12-year-old should understand core value. Nielsen: simple copy increases conversions 124%.",
          "Vague copy about 'documentation examples' doesn't resonate with target audience's pain points, reducing sign-ups by 20-30%. Use Voice of Customer research. Replace features with benefits. Example: 'Easy setup' → 'Launch in 5 minutes without technical skills'. Conversion XL: benefit-focused copy lifted conversions 38%.",
          "Missing concrete proof points and specificity. 'Many customers' is vague vs '10,247+ companies in 63 countries'. Specificity increases credibility 3.2x (Sunstein study). Add exact numbers, locations, results achieved. Shopify: specific testimonials increased trust score 41%.",
          "CTA button copy is generic: 'Click here' or 'Submit'. Use action-oriented, benefit-driven language: 'Get My Free Analysis' or 'Start Saving Now'. Unbounce study: personalized CTA copy increased clicks by 202%. First-person ('Get MY free trial') performs 90% better than third-person.",
          "No objection handling in copy. Address common concerns preemptively: 'No credit card required', 'Cancel anytime', '14-day money-back guarantee'. Reduce perceived risk using Prospect Theory (Kahneman). Risk reversal can increase conversions 25-40%.",
          "Headline-to-body disconnect: headline promises one thing, body delivers another. Creates cognitive dissonance reducing trust by 45%. Ensure message match across all elements. ClickTale: message consistency improved form completion 33%.",
          "Missing emotional triggers in copy. All rational benefits, no emotional resonance. Balance: 70% emotional + 30% rational. Use power words: 'Imagine', 'Discover', 'Transform'. Neuroscience shows emotional decisions happen 3 seconds before rational justification.",
          "Testimonials lack context and credibility markers. Need: Full name, photo, company, specific result achieved. Generic 'Great product!' is worthless. BrightLocal: detailed reviews with photos are trusted 3.4x more. Include video testimonials for 86% trust boost.",
          "Value proposition buried in paragraph 3. Should be in first sentence. Apply AIDA (Attention, Interest, Desire, Action) framework. Lead with strongest benefit. CXL Institute: above-fold value prop testing increased conversions 47%.",
        ],
      },
      colors: {
        category: CATEGORY_LABELS.colors,
        icon: CATEGORY_ICONS.colors,
        score: 61,
        insights: [
          "Text-to-background contrast ratio: 3.2:1 (gray text on light gray). WCAG AA requires minimum 4.5:1 for accessibility compliance. Low contrast reduces readability 58% and increases bounce rate. Darken text to #333333 or darker. WebAIM: proper contrast improved comprehension time 34%.",
          "CTA button color (#4A90E2 blue) lacks psychological urgency. Color psychology research: red/orange creates 20-30% more urgency than blue. Test warm colors. HubSpot case study: red CTA outperformed green by 21%. But test YOUR audience - B2B may prefer blue/green trust colors.",
          "7 different color shades create visual chaos reducing professional perception by 41%. Apply 60-30-10 rule: 60% dominant color, 30% secondary, 10% accent (CTA). Limit palette to 3 primary + 2 accent colors maximum. Adobe study: cohesive color schemes increase brand recognition 80%.",
          "Pure white background (#FFFFFF) causes eye strain in 67% of users during extended viewing. Use off-white (#F8F9FA or #FAFBFC) to reduce visual fatigue by 28%. Medium article: softer backgrounds increased avg. session duration 12%.",
          "Weak visual hierarchy - all elements compete equally. Use color to guide attention flow: Primary CTA (high contrast) → Secondary info (medium) → Footer (low). F-pattern eye-tracking shows users follow color intensity. Nielsen: proper hierarchy improved task completion 31%.",
          "CTA button blends with surrounding elements (similar color values). Needs isolation through contrast + whitespace. Gestalt principles: figure-ground separation. Add 40px+ whitespace around CTA. VWO: isolated CTAs with breathing room increased clicks 232%.",
          "No consistent color psychology application. Blue suggests trust (financial) but you need urgency/action (warm colors). Match color emotions to desired user behavior. Psychology: warm colors increase impulse actions 25%, cool colors increase thoughtful decisions 18%.",
          "Mobile color rendering issues - some colors appear washed out on OLED screens. Test on iPhone 14 Pro (different color profile). 38% of mobile users have adjusted color settings. Ensure minimum contrast works across all displays.",
          "Colorblind accessibility ignored - 8% of males can't distinguish red/green. Use patterns, icons, or text labels in addition to color coding. Add underlines to links, use blue+orange (not red+green). Accessible design increases potential audience 12%.",
          "Footer links barely visible (light gray on white). 23% of users scroll to footer for trust signals. Increase footer contrast to 4.5:1 minimum. Baymard: visible footer links reduced support tickets 19% and improved navigation 27%.",
        ],
      },
      experience: {
        category: CATEGORY_LABELS.experience,
        icon: CATEGORY_ICONS.experience,
        score: 66,
        insights: [
          "Page load time: 4.2 seconds. Google research: 53% mobile users abandon if load >3s. Each 1s delay = 7% conversion loss. Optimize images (use WebP), implement lazy loading, enable CDN. Target: <2s. Walmart case: 1s improvement = 2% conversion increase = $100M+ revenue.",
          "Largest Contentful Paint (LCP): 5.1s (poor). Google Core Web Vitals target: <2.5s. Slow LCP reduces SEO ranking and user patience. Optimize largest image/element. PreloadLCP-eligible content. Etsy: improving LCP increased engagement 12%.",
          "Mobile responsiveness failure on screens <375px (iPhone SE, Galaxy Fold). Elements cut off, horizontal scroll appears. 24% of users have small screens. Use responsive design with min-width 320px. Test on real devices. Mobile-First Indexing: poor mobile UX hurts SEO 35%.",
          "Form lacks real-time validation - users discover errors only after submission. 67% abandon forms after seeing error page. Add inline validation (green checkmark as they type). Expedia: real-time validation reduced errors 40% and increased completions 28%.",
          "No clear visual path or directional cues to guide user toward CTA. Eye-tracking studies show users need guidance. Add: arrows, gaze direction in hero images, contrasting colors creating visual flow. Nielsen: intentional visual paths improved conversion 29%.",
          "Sticky navigation covers 18% of mobile viewport (78px height). Reduces visible content and creates claustrophobia. Implement auto-hide on scroll or reduce to 48px. Medium: auto-hide nav increased mobile reading time 15%.",
          "Missing micro-interactions (button hover states, loading animations, success confirmations). 73% of users expect visual feedback. Add subtle animations (200-300ms). Improves perceived performance even when actual speed unchanged. Slack: micro-interactions increased user satisfaction 23%.",
          "Cognitive load too high - 8 different sections above fold competing for attention. Hick's Law: more choices = slower decisions. Simplify to 3 key elements: headline, value prop, CTA. Remove distractions. Crazy Egg: reducing elements by 50% increased conversions 34%.",
          "No loading states or skeleton screens during data fetch. Creates perception of slowness even if load time is acceptable. Add progressive loading indicators. Instagram: skeleton screens reduced perceived wait time 45% with same actual load time.",
          "Touch targets on mobile too small (<44x44px). Apple HIG & Material Design both recommend 44-48px minimum. Users miss taps 41% of time with small targets. Increase button sizes, add padding. Google: proper touch targets reduced mobile task errors 63%.",
          "Error prevention absent - no confirmation dialogs for destructive actions, no auto-save, no undo. Nielsen's 10 Usability Heuristics: prevent errors rather than recover. Add 'Are you sure?' confirmations. Dropbox: error prevention reduced support tickets 28%.",
          "No breadcrumb navigation or clear back button on deep pages. Users feel lost. 34% bounce when can't find way back. Add breadcrumbs, persistent navigation. Amazon: breadcrumbs reduced navigation-related exits 22%.",
        ],
      },
    };

    // If API key is available, use Claude for real analysis
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const client = new Anthropic();

        // Fetch the landing page HTML (in production, use a proper scraping service)
        let pageContent = "";
        try {
          const pageResponse = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; CROAgent/1.0; +https://croagent.com/bot)",
            },
          });
          pageContent = await pageResponse.text();
          // Limit content to first 50000 chars to avoid token limits
          pageContent = pageContent.substring(0, 50000);
        } catch (fetchError) {
          console.error("Error fetching page:", fetchError);
          // Continue with mock data if fetch fails
        }

        if (pageContent) {
          const filtersList = filters.join(", ");
          const prompt = `You are THE WORLD'S #1 CRO (Conversion Rate Optimization) EXPERT with 20+ years of experience. You have:
- Optimized 1000+ landing pages generating $500M+ in revenue
- Mastery of ALL CRO techniques: Cialdini's 6 principles, behavioral economics (Kahneman & Tversky), neuromarketing, persuasion architecture
- Deep knowledge of: AIDA, PAS, FAB frameworks, Jobs-to-be-Done theory, hook models, gamification, scarcity/urgency psychology
- Expert in: eye-tracking studies (F-pattern, Z-pattern), heatmap analysis, session recordings, A/B testing statistics (Bayesian & Frequentist)
- Case study library: 10,000+ A/B tests with wins/losses/learnings from companies like Booking.com, Amazon, Shopify, HubSpot
- Books mastered: "Influence" (Cialdini), "Predictably Irrational" (Ariely), "Don't Make Me Think" (Krug), "Hooked" (Eyal), "Breakthrough Advertising" (Schwartz)
- Certified in: Google Analytics, Optimizely, VWO, Hotjar, Crazy Egg, Microsoft Clarity

URL: ${url}
Analysis types: ${filtersList}

Page HTML (excerpt):
${pageContent}

CRITICAL INSTRUCTIONS:
You MUST provide EXTREMELY DETAILED, SCIENTIFIC, DATA-DRIVEN analysis. Each insight must include:
✓ Specific metric/observation with percentage
✓ Psychological principle or research reference
✓ Exact recommendation with implementation details
✓ Predicted impact with confidence interval
✓ Real case study reference when possible

For each category (${filtersList}), provide:
1. Score 0-100 (be critical - score below 70 means serious issues)
2. 8-12 COMPREHENSIVE insights (not generic - be specific!)
3. Each insight 200-300 characters with concrete data

Categories deep-dive:
- CRO: Analyze CTA visibility/hierarchy, form friction, trust signals placement, urgency/scarcity tactics, exit-intent strategy, micro-commitments, progressive disclosure, social proof positioning, guarantee/risk reversal, checkout flow optimization, mobile conversion optimization
- Copy: Evaluate headline (clarity score 1-10), value prop strength, benefit vs feature ratio, emotional triggers used, objection handling, tone/voice match to audience, readability (Flesch score), power words usage, storytelling elements, specificity level (vague vs concrete)
- Colors: Assess contrast ratios (WCAG compliance), color psychology application, CTA button color effectiveness, visual hierarchy strength, attention flow guidance, emotional response triggers, brand consistency, accessibility for color-blind users
- Experience: Navigation cognitive load, mobile responsiveness (touch targets 44px+), page speed (LCP, FID, CLS), scroll depth optimization, distraction analysis, white space usage, visual clarity, micro-interactions presence, error prevention/recovery

Respond ONLY in this JSON format:
{
  "cro": { "score": number, "insights": ["detailed 200-300 char insight with data, principle, and impact prediction", ...] },
  "copy": { "score": number, "insights": [...] },
  "colors": { "score": number, "insights": [...] },
  "experience": { "score": number, "insights": [...] }
}

BE BRUTAL. BE SPECIFIC. NO GENERIC ADVICE. Include percentages, psychology principles, case studies, and exact recommendations.`;

          const message = await client.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 8000,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          // Parse Claude's response
          const textContent = message.content.find((c) => c.type === "text");
          if (textContent && textContent.type === "text") {
            try {
              const aiAnalysis = JSON.parse(textContent.text);

              // Transform AI response to match our format
              const results: AnalysisResult[] = filters.map((filter) => {
                const data = aiAnalysis[filter];
                return {
                  category: CATEGORY_LABELS[filter as keyof typeof CATEGORY_LABELS],
                  icon: CATEGORY_ICONS[filter as keyof typeof CATEGORY_ICONS],
                  score: data.score,
                  insights: data.insights,
                };
              });

              return NextResponse.json({
                success: true,
                results,
                analyzedAt: new Date().toISOString(),
                source: "ai",
              });
            } catch (parseError) {
              console.error("Error parsing AI response:", parseError);
              // Fall back to mock data
            }
          }
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
        // Fall back to mock data
      }
    }

    // Return mock results
    const results: AnalysisResult[] = filters.map((filter) =>
      mockResults[filter as keyof typeof mockResults]
    ).filter(Boolean);

    return NextResponse.json({
      success: true,
      results,
      analyzedAt: new Date().toISOString(),
      source: "mock",
    });
  } catch (error) {
    console.error("Landing analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
