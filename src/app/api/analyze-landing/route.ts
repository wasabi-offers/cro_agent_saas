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
  cro: "CRO & Conversioni",
  copy: "Copywriting",
  colors: "Colori e Design",
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
          "La CTA principale non è sufficientemente visibile above the fold. Considera di aumentare le dimensioni e migliorare il contrasto.",
          "Manca una value proposition chiara nei primi 3 secondi di visualizzazione. Il 60% degli utenti abbandona prima di capire l'offerta.",
          "Aggiungi elementi di urgency/scarcity (es. countdown timer, stock limitato) per aumentare il tasso di conversione del 15-25%.",
          "Implementa exit-intent popup con un'offerta last-minute per recuperare il 10-15% degli utenti in uscita.",
          "La form richiede troppi campi (8). Riduci a 3-4 campi essenziali per aumentare i completamenti del 30%.",
        ],
      },
      copy: {
        category: CATEGORY_LABELS.copy,
        icon: CATEGORY_ICONS.copy,
        score: 65,
        insights: [
          "L'headline non comunica chiaramente il beneficio principale. Usa la formula: [Risultato desiderato] + [Tempo specifico] + [Senza obiezione comune].",
          "Il testo è troppo tecnico. Semplifica il linguaggio usando parole che un bambino di 12 anni capirebbe.",
          "Mancano proof points concreti. Aggiungi numeri specifici: '10.000+ clienti soddisfatti' invece di 'molti clienti'.",
          "La CTA 'Clicca qui' è generica. Usa copy action-oriented: 'Ottieni il tuo sconto del 30%' o 'Inizia gratis ora'.",
          "Aggiungi social proof strategico: testimonianze con foto reali vicino alla CTA principale.",
        ],
      },
      colors: {
        category: CATEGORY_LABELS.colors,
        icon: CATEGORY_ICONS.colors,
        score: 78,
        insights: [
          "Il contrasto tra testo e sfondo è 3.2:1. Per WCAG AA compliance serve almeno 4.5:1. Migliora la leggibilità.",
          "La CTA usa un colore (#4A90E2) che non crea abbastanza urgenza. Testa rosso/arancione per aumentare click del 20-30%.",
          "Troppi colori nella pagina (7 diverse tonalità). Limita a 3 colori primari + 2 accenti per un design più professionale.",
          "Il bianco puro (#FFFFFF) affatica la vista. Usa un off-white (#F8F9FA) per ridurre l'affaticamento visivo.",
          "La gerarchia visiva non è chiara. Usa il colore per guidare l'occhio: CTA principale → benefici secondari → footer.",
        ],
      },
      experience: {
        category: CATEGORY_LABELS.experience,
        icon: CATEGORY_ICONS.experience,
        score: 81,
        insights: [
          "Il tempo di caricamento è 4.2s. Ottimizza immagini e lazy loading per ridurlo sotto i 2s (aumento conversioni del 15%).",
          "Su mobile (< 375px) alcuni elementi sono cut-off. Testa su iPhone SE e Galaxy Fold per garantire usabilità.",
          "Il form non ha validation in real-time. Aggiungi feedback immediato per ridurre errori del 40%.",
          "Manca un chiaro path visivo. Usa directional cues (frecce, sguardi nelle immagini) per guidare verso la CTA.",
          "La navigazione sticky copre il 15% dello schermo mobile. Riducila o rendila auto-hide per migliorare UX.",
          "Aggiungi micro-interactions (animazioni al click, hover states) per aumentare engagement del 12%.",
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
          const prompt = `Sei un esperto di CRO (Conversion Rate Optimization), UX Design e Marketing. Analizza questa landing page e fornisci insights dettagliati.

URL: ${url}
Tipo di analisi richiesta: ${filtersList}

HTML della pagina (estratto):
${pageContent}

Per ogni categoria richiesta (${filtersList}), fornisci:
1. Un punteggio da 0 a 100
2. 4-6 insights specifici e actionable
3. Dati concreti e percentuali quando possibile

Categorie:
- CRO: ottimizzazione conversioni, CTA, form, trust elements, urgency/scarcity
- Copy: headline, value proposition, benefici, social proof, tono di voce
- Colors: palette, contrasti, psicologia colori, accessibilità, gerarchia visiva
- Experience: UX, navigazione, mobile responsiveness, performance, micro-interactions

Rispondi in formato JSON con questa struttura:
{
  "cro": { "score": number, "insights": string[] },
  "copy": { "score": number, "insights": string[] },
  "colors": { "score": number, "insights": string[] },
  "experience": { "score": number, "insights": string[] }
}

Ogni insight deve essere:
- Specifico e actionable
- Includere dati/percentuali quando possibile
- Scritto in italiano
- Massimo 150 caratteri`;

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
