"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  FileSearch,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Palette,
  MousePointer,
  Type,
} from "lucide-react";

interface AnalysisResult {
  category: string;
  insights: string[];
  score: number;
  icon: string;
}

const iconMap: Record<string, any> = {
  TrendingUp,
  Type,
  Palette,
  MousePointer,
};

export default function LandingAnalysisPage() {
  const [url, setUrl] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState("");

  const filters = [
    { id: "all", label: "Analisi Completa", icon: Sparkles },
    { id: "cro", label: "CRO", icon: TrendingUp },
    { id: "copy", label: "Copywriting", icon: Type },
    { id: "colors", label: "Colori", icon: Palette },
    { id: "experience", label: "User Experience", icon: MousePointer },
  ];

  const toggleFilter = (filterId: string) => {
    if (filterId === "all") {
      setSelectedFilters(["all"]);
    } else {
      const newFilters = selectedFilters.filter((f) => f !== "all");
      if (newFilters.includes(filterId)) {
        const updated = newFilters.filter((f) => f !== filterId);
        setSelectedFilters(updated.length > 0 ? updated : ["all"]);
      } else {
        setSelectedFilters([...newFilters, filterId]);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!url) {
      setError("Inserisci un URL valido");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/analyze-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          filters: selectedFilters.includes("all")
            ? ["cro", "copy", "colors", "experience"]
            : selectedFilters,
        }),
      });

      if (!response.ok) throw new Error("Errore durante l'analisi");

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#00d4aa]";
    if (score >= 60) return "text-[#ff9500]";
    return "text-[#ff6b6b]";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-[#00d4aa]/10 border-[#00d4aa]/20";
    if (score >= 60) return "bg-[#ff9500]/10 border-[#ff9500]/20";
    return "bg-[#ff6b6b]/10 border-[#ff6b6b]/20";
  };

  return (
    <div className="min-h-screen bg-black">
      <Header title="Landing Analysis" breadcrumb={["Dashboard", "Landing Analysis"]} />

      <div className="p-10 max-w-7xl mx-auto">
        {/* Input Section */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
              <FileSearch className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-[20px] font-semibold text-[#fafafa]">
              Analizza Landing Page
            </h2>
          </div>

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-[14px] text-[#888888] mb-2">
              URL della Landing Page
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://esempio.com/landing-page"
              className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[15px] focus:outline-none focus:border-[#7c5cff] transition-all"
            />
          </div>

          {/* Filters */}
          <div className="mb-6">
            <label className="block text-[14px] text-[#888888] mb-3">
              Tipo di Analisi
            </label>
            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => {
                const Icon = filter.icon;
                const isSelected = selectedFilters.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                      isSelected
                        ? "bg-[#7c5cff] text-white"
                        : "bg-[#111111] text-[#888888] border border-[#2a2a2a] hover:border-[#7c5cff]/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-center gap-2 text-[#ff6b6b] text-[14px] bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white px-6 py-4 rounded-xl font-medium text-[15px] hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analisi in corso...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Avvia Analisi
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-[#00d4aa]" />
              <h2 className="text-[20px] font-semibold text-[#fafafa]">
                Risultati Analisi
              </h2>
            </div>

            {results.map((result, index) => {
              const Icon = iconMap[result.icon] || Sparkles;
              return (
                <div
                  key={index}
                  className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#111111] rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#7c5cff]" />
                      </div>
                      <h3 className="text-[18px] font-semibold text-[#fafafa]">
                        {result.category}
                      </h3>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-xl border ${getScoreBgColor(
                        result.score
                      )}`}
                    >
                      <span
                        className={`text-[16px] font-bold ${getScoreColor(
                          result.score
                        )}`}
                      >
                        {result.score}/100
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {result.insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 text-[14px] text-[#888888] bg-[#111111] rounded-xl p-4"
                      >
                        <div className="w-1.5 h-1.5 bg-[#7c5cff] rounded-full mt-2 flex-shrink-0" />
                        <p className="leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
