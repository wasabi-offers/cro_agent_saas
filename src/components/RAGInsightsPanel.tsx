"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface RAGInsightsPanelProps {
  /** Domanda predefinita basata sul contesto (es. funnel, heatmap) */
  defaultQuestion?: string;
  /** Placeholder per l'input */
  placeholder?: string;
  /** Titolo del pannello */
  title?: string;
  /** Altezza massima (default: 300px) */
  maxHeight?: string;
}

export default function RAGInsightsPanel({
  defaultQuestion = "",
  placeholder = "Chiedi al RAG CRO: best practices, raccomandazioni, A/B test...",
  title = "RAG CRO Insights",
  maxHeight = "300px",
}: RAGInsightsPanelProps) {
  const [question, setQuestion] = useState(defaultQuestion);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ file: string; preview: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQuery = async () => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAnswer(null);
    setSources([]);

    try {
      const res = await fetch("/api/cro-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          user_id: "ui_panel",
          top_k: 10,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore RAG");
      }

      setAnswer(data.answer || "");
      if (data.sources?.length) {
        setSources(
          data.sources.map((s: { file: string; preview?: string }) => ({
            file: s.file,
            preview: s.preview || "",
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di connessione");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-[#111111] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#7c5cff]" />
          <span className="text-[13px] font-semibold text-[#fafafa]">
            {title}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#666666]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#666666]" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[#2a2a2a]">
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[13px] text-[#fafafa] placeholder:text-[#555555] focus:outline-none focus:border-[#7c5cff]"
            />
            <button
              onClick={handleQuery}
              disabled={!question.trim() || isLoading}
              className="px-4 py-2 bg-[#7c5cff] hover:bg-[#6b4ce6] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[13px] font-medium text-white flex items-center gap-2 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isLoading ? "..." : "Chiedi"}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-[12px] text-[#ff6b6b]">{error}</p>
          )}

          {answer && (
            <div
              className="mt-3 p-3 bg-[#111111] border border-[#2a2a2a] rounded-lg overflow-y-auto"
              style={{ maxHeight }}
            >
              <p className="text-[13px] text-[#fafafa] whitespace-pre-wrap leading-relaxed">
                {answer}
              </p>
              {sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                  <p className="text-[11px] text-[#666666] mb-1">Fonti:</p>
                  <ul className="text-[11px] text-[#888888] space-y-0.5">
                    {sources.slice(0, 3).map((s, i) => (
                      <li key={i} className="truncate">
                        {s.file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
