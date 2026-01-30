/**
 * Client condiviso per chiamate al sistema RAG CRO su RunPod
 */

export interface RAGQueryParams {
  question: string;
  user_id?: string;
  top_k?: number;
  similarity_threshold?: number;
  filter_file?: string;
  use_context?: boolean;
}

export interface RAGResponse {
  answer: string;
  sources?: Array<{
    file: string;
    chunk_index: number;
    total_chunks: number;
    similarity: number;
    preview: string;
  }>;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  context_used?: boolean;
  related_conversations?: number;
}

export function isRAGConfigured(): boolean {
  return !!(process.env.RUNPOD_ENDPOINT_ID && process.env.RUNPOD_API_KEY);
}

export async function queryRAG(params: RAGQueryParams): Promise<RAGResponse | null> {
  const endpointId = process.env.RUNPOD_ENDPOINT_ID;
  const apiKey = process.env.RUNPOD_API_KEY;

  if (!endpointId || !apiKey) return null;

  try {
    const response = await fetch(
      `https://api.runpod.ai/v2/${endpointId}/runsync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            action: "query",
            params: {
              question: params.question.trim(),
              user_id: params.user_id ?? "cro_system",
              top_k: params.top_k ?? 15,
              similarity_threshold: params.similarity_threshold ?? 0.2,
              filter_file: params.filter_file,
              use_context: params.use_context ?? true,
            },
          },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const output = data.output ?? data;

    const answer =
      typeof output === "string"
        ? output
        : output?.answer ?? output?.response ?? output?.text;

    if (!answer) return null;

    return {
      answer: typeof answer === "string" ? answer : JSON.stringify(answer),
      sources: output?.sources,
      model: output?.model,
      input_tokens: output?.input_tokens,
      output_tokens: output?.output_tokens,
      context_used: output?.context_used,
      related_conversations: output?.related_conversations,
    };
  } catch {
    return null;
  }
}
