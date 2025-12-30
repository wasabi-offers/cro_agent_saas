import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface LinkAnalysis {
  url: string;
  title: string;
  pageType: string;
  description: string;
  keyElements: string[];
  marketingTactics: string[];
  callToAction: string;
  error?: string;
}

async function fetchPageContent(url: string): Promise<{ content: string; title: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1] : "";

    // Extract text content (remove scripts, styles, and tags)
    let textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Limit content length
    textContent = textContent.substring(0, 5000);

    return {
      content: `Title: ${title}\nMeta Description: ${metaDesc}\n\nPage Content:\n${textContent}`,
      title,
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

async function analyzePageWithClaude(url: string, pageContent: string): Promise<LinkAnalysis> {
  const prompt = `Sei un esperto di marketing digitale e analisi web. Analizza questa pagina web e fornisci un'analisi dettagliata.

URL: ${url}

CONTENUTO DELLA PAGINA:
${pageContent}

Rispondi SOLO in questo formato JSON esatto:
{
  "pageType": "tipo di pagina (es: Landing Page, Pagina Prodotto, Checkout, Blog Post, Homepage, Squeeze Page, VSL Page, Webinar Registration, ecc.)",
  "description": "breve descrizione di cosa offre/vende questa pagina (max 100 parole)",
  "keyElements": ["elemento chiave 1", "elemento chiave 2", "elemento chiave 3"],
  "marketingTactics": ["tattica marketing 1", "tattica marketing 2", "tattica marketing 3"],
  "callToAction": "principale call-to-action della pagina"
}`;

  try {
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

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        url,
        title: "",
        pageType: parsed.pageType || "Unknown",
        description: parsed.description || "",
        keyElements: parsed.keyElements || [],
        marketingTactics: parsed.marketingTactics || [],
        callToAction: parsed.callToAction || "",
      };
    }

    throw new Error("Failed to parse response");
  } catch (error) {
    console.error(`Error analyzing ${url}:`, error);
    return {
      url,
      title: "",
      pageType: "Error",
      description: "Impossibile analizzare questa pagina",
      keyElements: [],
      marketingTactics: [],
      callToAction: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { links } = body as { links: string[] };

    if (!links || links.length === 0) {
      return NextResponse.json(
        { success: false, error: "No links provided" },
        { status: 400 }
      );
    }

    // Limit to 10 links max
    const linksToAnalyze = links.slice(0, 10);
    const results: LinkAnalysis[] = [];

    for (const link of linksToAnalyze) {
      // Skip mailto, tel, and anchor links
      if (link.startsWith("mailto:") || link.startsWith("tel:") || link.startsWith("#")) {
        continue;
      }

      // Fetch page content
      const pageData = await fetchPageContent(link);

      if (pageData) {
        // Analyze with Claude
        const analysis = await analyzePageWithClaude(link, pageData.content);
        analysis.title = pageData.title;
        results.push(analysis);
      } else {
        results.push({
          url: link,
          title: "",
          pageType: "Unreachable",
          description: "Impossibile raggiungere questa pagina",
          keyElements: [],
          marketingTactics: [],
          callToAction: "",
          error: "Page not accessible",
        });
      }
    }

    return NextResponse.json({
      success: true,
      analyses: results,
      analyzedCount: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Link Analysis API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

