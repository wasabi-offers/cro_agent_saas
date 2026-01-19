import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { url, pageName, dropoff, funnelName, stepIndex, totalSteps, analysisInsights } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!analysisInsights || analysisInsights.length === 0) {
      return NextResponse.json(
        { error: 'Analysis insights are required. Please run CRO analysis first.' },
        { status: 400 }
      );
    }

    // Format analysis insights for the prompt
    const analysisContext = analysisInsights.map((result: any) => {
      const insights = result.insights?.join('\n- ') || '';
      const proposals = result.proposals?.map((p: any) =>
        `  • ${p.element}: Current "${p.current}" → Proposed "${p.proposed}" (${p.impact})`
      ).join('\n') || '';

      return `${result.category} (Score: ${result.score}/100):
- ${insights}
${proposals ? '\nProposed Changes:\n' + proposals : ''}`;
    }).join('\n\n');

    const prompt = `You are an expert CRO (Conversion Rate Optimization) consultant analyzing a funnel step to generate A/B test recommendations.

**Context:**
- Funnel: ${funnelName}
- Current Step: ${pageName} (Step ${stepIndex + 1} of ${totalSteps})
- Current Dropoff: ${dropoff}%
- Page URL: ${url}

**CRO Analysis Results:**
${analysisContext}

**Your Task:**
Based on the CRO analysis above, generate 3-4 high-impact A/B test suggestions that directly address the issues and proposals identified in the analysis. The A/B tests MUST be correlated with the analysis insights - address the same problems with specific, testable solutions. For each test, provide:

1. **Element**: The specific element to test (e.g., "CTA Button", "Form Fields", "Hero Section")
2. **Priority**: high/medium/low based on expected impact
3. **Hypothesis**: A clear, specific hypothesis about what will happen (e.g., "Changing X to Y will increase Z by N%")
4. **Current**: Description of the current implementation
5. **Proposed**: Detailed description of the proposed variant
6. **Expected Impact**: Quantified expected improvement (e.g., "+25% conversion rate")
7. **Reasoning**: Expert analysis with:
   - Data-driven insights about why this test matters
   - CRO principles and psychological frameworks (e.g., cognitive load, loss aversion, urgency)
   - Real case studies or research to support the recommendation
   - Technical implementation considerations
8. **Confidence**: 0-100 confidence score
9. **Test Duration**: Recommended test duration for statistical significance
10. **Metrics**: 2-4 key metrics to track
11. **ScreenSelector**: CSS selector for the element to screenshot (e.g., "#cta-button", ".hero-section", "header")
12. **ScreenDescription**: Brief description of what to look for in the screenshot

**Important Guidelines:**
- **CRITICAL**: Every A/B test MUST directly address issues identified in the CRO analysis above
- Use the proposed changes from the analysis as the basis for your A/B test variants
- If the analysis identified headline issues, create tests for headlines
- If the analysis identified CTA problems, create tests for CTAs
- Maintain consistency - don't suggest tests for elements not mentioned in the analysis
- Focus on high-impact, evidence-based recommendations
- Reference real CRO studies and frameworks (Nielsen Norman Group, Baymard Institute, etc.)
- Consider the funnel position (this is step ${stepIndex + 1} of ${totalSteps})
- Address the ${dropoff}% dropoff with specific solutions from the analysis
- Be specific and actionable, not generic

Return ONLY valid JSON in this exact format:
{
  "tests": [
    {
      "element": "string",
      "priority": "high" | "medium" | "low",
      "hypothesis": "string",
      "variant": {
        "current": "string",
        "proposed": "string"
      },
      "expectedImpact": "string",
      "reasoning": "string (can use markdown)",
      "confidence": number,
      "testDuration": "string",
      "metrics": ["string", "string", ...],
      "screenSelector": "string (CSS selector like '#hero', '.cta-button', 'nav')",
      "screenDescription": "string (what to look for in screenshot)"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    let jsonText = content.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const result = JSON.parse(jsonText);

    // Add IDs to tests
    const testsWithIds = result.tests.map((test: any, index: number) => ({
      id: index + 1,
      ...test,
    }));

    return NextResponse.json({ tests: testsWithIds });
  } catch (error: any) {
    console.error('A/B test generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate A/B test suggestions' },
      { status: 500 }
    );
  }
}
