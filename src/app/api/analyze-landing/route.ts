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
        score: 72,
        insights: [
          "Primary CTA is not sufficiently visible above the fold. Consider increasing size and improving contrast.",
          "Missing clear value proposition within first 3 seconds of viewing. 60% of users abandon before understanding the offer.",
          "Add urgency/scarcity elements (countdown timer, limited stock) to increase conversion rate by 15-25%.",
          "Implement exit-intent popup with last-minute offer to recover 10-15% of exiting users.",
          "Form requires too many fields (8). Reduce to 3-4 essential fields to increase completions by 30%.",
        ],
      },
      copy: {
        category: CATEGORY_LABELS.copy,
        icon: CATEGORY_ICONS.copy,
        score: 65,
        insights: [
          "Headline doesn't clearly communicate main benefit. Use formula: [Desired result] + [Specific timeframe] + [Without common objection].",
          "Text is too technical. Simplify language using words a 12-year-old would understand.",
          "Missing concrete proof points. Add specific numbers: '10,000+ satisfied customers' instead of 'many customers'.",
          "Generic CTA 'Click here'. Use action-oriented copy: 'Get your 30% discount' or 'Start free now'.",
          "Add strategic social proof: testimonials with real photos near primary CTA.",
        ],
      },
      colors: {
        category: CATEGORY_LABELS.colors,
        icon: CATEGORY_ICONS.colors,
        score: 78,
        insights: [
          "Text-background contrast is 3.2:1. WCAG AA compliance requires at least 4.5:1. Improve readability.",
          "CTA uses color (#4A90E2) that doesn't create enough urgency. Test red/orange to increase clicks by 20-30%.",
          "Too many colors on page (7 different shades). Limit to 3 primary colors + 2 accents for more professional design.",
          "Pure white (#FFFFFF) strains eyes. Use off-white (#F8F9FA) to reduce visual fatigue.",
          "Visual hierarchy is unclear. Use color to guide the eye: Primary CTA → secondary benefits → footer.",
        ],
      },
      experience: {
        category: CATEGORY_LABELS.experience,
        icon: CATEGORY_ICONS.experience,
        score: 81,
        insights: [
          "Loading time is 4.2s. Optimize images and lazy loading to reduce below 2s (15% conversion increase).",
          "On mobile (< 375px) some elements are cut-off. Test on iPhone SE and Galaxy Fold to ensure usability.",
          "Form lacks real-time validation. Add immediate feedback to reduce errors by 40%.",
          "Missing clear visual path. Use directional cues (arrows, gazes in images) to guide toward CTA.",
          "Sticky navigation covers 15% of mobile screen. Reduce or make auto-hide to improve UX.",
          "Add micro-interactions (click animations, hover states) to increase engagement by 12%.",
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
          const prompt = `You are a CRO (Conversion Rate Optimization), UX Design and Marketing expert. Analyze this landing page and provide detailed insights.

URL: ${url}
Analysis types requested: ${filtersList}

Page HTML (excerpt):
${pageContent}

For each requested category (${filtersList}), provide:
1. A score from 0 to 100
2. 4-6 specific and actionable insights
3. Concrete data and percentages when possible

Categories:
- CRO: conversion optimization, CTA, forms, trust elements, urgency/scarcity
- Copy: headline, value proposition, benefits, social proof, tone of voice
- Colors: palette, contrast, color psychology, accessibility, visual hierarchy
- Experience: UX, navigation, mobile responsiveness, performance, micro-interactions

Respond in JSON format with this structure:
{
  "cro": { "score": number, "insights": string[] },
  "copy": { "score": number, "insights": string[] },
  "colors": { "score": number, "insights": string[] },
  "experience": { "score": number, "insights": string[] }
}

Each insight must be:
- Specific and actionable
- Include data/percentages when possible
- Written in English
- Maximum 150 characters`;

          const message = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
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
