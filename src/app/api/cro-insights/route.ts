import { NextRequest, NextResponse } from 'next/server';
import { queryRAG, isRAGConfigured } from '@/lib/rag-client';

export async function POST(request: NextRequest) {
  try {
    if (!isRAGConfigured()) {
      return NextResponse.json(
        { error: 'RAG CRO not configured. Set RAG_API_URL in .env if needed.' },
        { status: 503 }
      );
    }

    const body = await request.json();

    const result = await queryRAG({
      question: body.question,
      top_k: body.top_k ?? 15,
      system_prompt: body.system_prompt,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Missing question or RAG unavailable' },
        { status: 502 }
      );
    }
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('RAG Query Error:', error);
    return NextResponse.json(
      { error: 'Failed to query RAG system' },
      { status: 500 }
    );
  }
}
