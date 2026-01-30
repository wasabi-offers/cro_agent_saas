import { NextRequest, NextResponse } from "next/server";
import { queryRAG, isRAGConfigured } from "@/lib/rag-client";

/**
 * API route per chiamare il sistema RAG CRO su RunPod
 * POST /api/rag-cro
 * Body: { question, user_id?, top_k?, similarity_threshold?, filter_file?, use_context? }
 */
export async function POST(req: NextRequest) {
  if (!isRAGConfigured()) {
    return NextResponse.json(
      {
        error: "RAG CRO not configured",
        details: "Set RUNPOD_ENDPOINT_ID and RUNPOD_API_KEY in .env",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const {
      question,
      user_id = "default",
      top_k = 10,
      similarity_threshold = 0.1,
      filter_file,
      use_context = true,
    } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Parametro 'question' obbligatorio (string)" },
        { status: 400 }
      );
    }

    const result = await queryRAG({
      question,
      user_id,
      top_k,
      similarity_threshold,
      filter_file,
      use_context,
    });

    if (!result) {
      return NextResponse.json(
        { error: "RAG non ha restituito risposta" },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("RAG CRO API error:", error);
    return NextResponse.json(
      {
        error: "RAG CRO internal error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
