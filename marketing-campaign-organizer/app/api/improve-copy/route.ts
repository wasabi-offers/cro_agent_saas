import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { currentCopy, improvementType, context } = await req.json();

    if (!currentCopy) {
      return NextResponse.json(
        { error: 'Copy corrente richiesto' },
        { status: 400 }
      );
    }

    const improvementPrompts: Record<string, string> = {
      ctr: 'Migliora il copy per aumentare il click-through rate. Rendi più accattivante e persuasivo.',
      engagement: 'Migliora il copy per aumentare l\'engagement. Aggiungi elementi emotivi e storytelling.',
      clarity: 'Migliora la chiarezza del messaggio. Semplifica e rendi più diretto.',
      persuasion: 'Aumenta la persuasività usando tecniche di copywriting avanzate (AIDA, PAS, scarsità, urgenza).',
      seo: 'Ottimizza il copy per SEO mantenendo naturalezza e leggibilità.',
      brevity: 'Rendi il copy più conciso ed efficace, eliminando parole superflue.',
    };

    const systemPrompt = `Sei un copy editor esperto con 15+ anni di esperienza.
Analizzi e migliori copy per massimizzare performance e conversioni.
Conosci tutte le tecniche di copywriting e psicologia della persuasione.`;

    const userPrompt = `Migliora questo copy:

"${currentCopy}"

Obiettivo: ${improvementPrompts[improvementType] || 'Migliora complessivamente il copy'}

${context ? `Contesto aggiuntivo: ${context}` : ''}

Fornisci:
1. Copy migliorato
2. Spiegazione delle modifiche (max 2-3 righe)
3. Score previsto di miglioramento (1-10)`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const content = message.content[0];
    const response = content.type === 'text' ? content.text : '';

    return NextResponse.json({
      success: true,
      improvedCopy: response,
      metadata: {
        model: message.model,
        tokens: message.usage,
      },
    });
  } catch (error: any) {
    console.error('Error improving copy:', error);
    return NextResponse.json(
      { error: 'Errore nel miglioramento del copy', details: error.message },
      { status: 500 }
    );
  }
}
