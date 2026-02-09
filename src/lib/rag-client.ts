/**
 * Shared client for RAG CRO (Railway API)
 * Docs: https://rag-system-cro-production.up.railway.app/docs
 * POST /query → { question, top_k?, system_prompt? }
 * Response: { answer, sources: [{ chunk_index, source, relevance_score, doc_id, preview }], chunks_used }
 */

const DEFAULT_RAG_API_URL = "https://rag-system-cro-production.up.railway.app";
const RAG_TIMEOUT_MS = 60_000; // Queries may take 5–30s; 60s as per guide

const DEFAULT_SYSTEM_PROMPT =
  "You are a CRO (Conversion Rate Optimization) expert. Respond in clear, practical, data-driven English. Provide actionable recommendations and verifiable best practices.";

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
  /** Ignored by the API; kept for compatibility */
  user_id?: string;
  similarity_threshold?: number;
  filter_file?: string;
  use_context?: boolean;
}

export interface RAGResponse {
  answer: string;
  sources?: RAGSource[];
  chunks_used?: number;
  /** Additional fields if returned by the API */
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
}

/** Result: success response or error message (API, timeout, network) */
export type RAGResult = RAGResponse | { error: string };

export function isRAGConfigured(): boolean {
  const url = process.env.RAG_API_URL ?? DEFAULT_RAG_API_URL;
  return !!url?.trim();
}

function getRAGBaseUrl(): string {
  const url = process.env.RAG_API_URL ?? DEFAULT_RAG_API_URL;
  return url?.trim() ? url.replace(/\/$/, "") : DEFAULT_RAG_API_URL;
}

export async function queryRAG(params: RAGQueryParams): Promise<RAGResult | null> {
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
      return { error: "Invalid RAG response" };
    }

    if (!response.ok) {
      const detail = typeof data?.detail === "string" ? data.detail : `RAG error ${response.status}`;
      console.error("[RAG] Error", response.status, detail);
      return { error: detail };
    }

    const answer = data?.answer;
    if (answer == null || answer === "") {
      return { error: "RAG returned no text (empty answer)" };
    }

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
    const message = err instanceof Error ? err.message : "Network error";
    if (err instanceof Error) console.error("[RAG]", err.message);
    if (err instanceof Error && err.name === "AbortError") {
      return { error: "Timeout: RAG service did not respond within 60s" };
    }
    return { error: message };
  }
}
