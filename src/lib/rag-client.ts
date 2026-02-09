/**
 * Client condiviso per il RAG CRO (Railway API)
 * Docs: https://rag-system-cro-production.up.railway.app/docs
 * POST /query → { question, top_k?, system_prompt? }
 * Response: { answer, sources: [{ chunk_index, source, relevance_score, doc_id, preview }], chunks_used }
 */

const DEFAULT_RAG_API_URL = "https://rag-system-cro-production.up.railway.app";
const RAG_TIMEOUT_MS = 60_000; // Query possono richiedere 5–30s; 60s come da guida

const DEFAULT_SYSTEM_PROMPT =
  "Sei un esperto CRO (Conversion Rate Optimization). Rispondi in modo chiaro, pratico e basato su dati. Fornisci raccomandazioni actionable e best practice verificabili.";

export interface RAGSource {
  chunk_index: number;
  source: string;
  relevance_score: number;
  doc_id: string;
  preview: string;
}

export interface RAGQueryParams {
  question: string;
  top_k?: number;
  system_prompt?: string;
  /** Ignorato dalla API; mantenuto per compatibilità */
  user_id?: string;
  similarity_threshold?: number;
  filter_file?: string;
  use_context?: boolean;
}

export interface RAGResponse {
  answer: string;
  sources?: RAGSource[];
  chunks_used?: number;
  /** Campi aggiuntivi se l’API li restituisce */
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
}

export function isRAGConfigured(): boolean {
  const url = process.env.RAG_API_URL ?? DEFAULT_RAG_API_URL;
  return !!url?.trim();
}

function getRAGBaseUrl(): string {
  const url = process.env.RAG_API_URL ?? DEFAULT_RAG_API_URL;
  return url?.trim() ? url.replace(/\/$/, "") : DEFAULT_RAG_API_URL;
}

export async function queryRAG(params: RAGQueryParams): Promise<RAGResponse | null> {
  const baseUrl = getRAGBaseUrl();
  const question = params.question?.trim();
  if (!question) return null;

  const top_k = params.top_k ?? 5;
  const system_prompt = params.system_prompt?.trim() || DEFAULT_SYSTEM_PROMPT;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RAG_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, top_k, system_prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let data: Record<string, unknown>;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return null;
    }

    if (!response.ok) {
      const detail = typeof data?.detail === "string" ? data.detail : "RAG request failed";
      console.error("[RAG] Error", response.status, detail);
      return null;
    }

    const answer = data?.answer;
    if (answer == null || answer === "") return null;

    const sources = Array.isArray(data.sources) ? data.sources : undefined;

    return {
      answer: typeof answer === "string" ? answer : JSON.stringify(answer),
      sources: sources as RAGSource[] | undefined,
      chunks_used: typeof data.chunks_used === "number" ? data.chunks_used : undefined,
      model: data.model as string | undefined,
      input_tokens: data.input_tokens as number | undefined,
      output_tokens: data.output_tokens as number | undefined,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error) console.error("[RAG]", err.message);
    return null;
  }
}
