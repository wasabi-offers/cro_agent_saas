import { NextRequest, NextResponse } from "next/server";
import { queryRAG, isRAGConfigured } from "@/lib/rag-client";

/**
 * API route to call the RAG CRO system (Railway)
 * POST /api/rag-cro
 * Body: { question, top_k?, system_prompt? }
 */
export async function POST(req: NextRequest) {
  if (!isRAGConfigured()) {
    return NextResponse.json(
      {
        error: "RAG CRO not configured",
        details: "Set RAG_API_URL in .env (default: Railway RAG API)",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { question, top_k = 10, system_prompt } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Parameter 'question' is required (string)" },
        { status: 400 }
      );
    }

    const result = await queryRAG({
      question,
      top_k,
      system_prompt,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Missing question or RAG unavailable" },
        { status: 502 }
      );
    }
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
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
