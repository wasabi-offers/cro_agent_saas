import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, copyType, channel, toneOfVoice, targetAudience, objectives } = await req.json();

    if (!prompt && !copyType) {
      return NextResponse.json(
        { error: 'Richiesto prompt o copyType' },
        { status: 400 }
      );
    }

    // Costruisci il prompt per Claude
    const systemPrompt = `Sei un copywriter esperto specializzato in marketing e advertising.
Hai 15+ anni di esperienza nella creazione di copy persuasivi e ad alto tasso di conversione.
Conosci perfettamente le tecniche di copywriting: AIDA, PAS, FAB, storytelling, e psicologia della persuasione.
Scrivi sempre in italiano perfetto, con un tono ${toneOfVoice || 'professionale ma coinvolgente'}.`;

    const userPrompt = prompt || `Crea un ${copyType} per una campagna ${channel}.

Target Audience: ${targetAudience || 'Non specificato'}
Obiettivi: ${objectives || 'Massimizzare conversioni'}
Tone of Voice: ${toneOfVoice || 'Professionale'}

Regole:
- Sii conciso ma persuasivo
- Usa tecniche di copywriting comprovate
- Includi una call-to-action chiara
- Ottimizza per il canale ${channel}
${copyType === 'subject_line' ? '- Max 50 caratteri\n- Usa emoji se appropriato' : ''}
${copyType === 'cta' ? '- Max 5 parole\n- Azione chiara e diretta' : ''}`;

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
    const generatedCopy = content.type === 'text' ? content.text : '';

    return NextResponse.json({
      success: true,
      copy: generatedCopy,
      metadata: {
        model: message.model,
        tokens: message.usage,
      },
    });
  } catch (error: any) {
    console.error('Error generating copy:', error);
    return NextResponse.json(
      { error: 'Errore nella generazione del copy', details: error.message },
      { status: 500 }
    );
  }
}
