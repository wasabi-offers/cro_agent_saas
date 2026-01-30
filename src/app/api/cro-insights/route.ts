import { NextRequest, NextResponse } from 'next/server';
import { queryRAG, isRAGConfigured } from '@/lib/rag-client';

export async function POST(request: NextRequest) {
  try {
    if (!isRAGConfigured()) {
      return NextResponse.json(
        { error: 'RAG CRO not configured. Set RUNPOD_ENDPOINT_ID and RUNPOD_API_KEY.' },
        { status: 503 }
      );
    }

    const body = await request.json();

    const result = await queryRAG({
      question: body.question,
      user_id: body.user_id || 'cro_system',
      top_k: body.top_k ?? 15,
      similarity_threshold: body.similarity_threshold ?? 0.2,
      use_context: body.use_context ?? true,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'RAG non ha restituito risposta' },
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
