"use client";

import { useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import { useLanguage } from "@/components/LanguageProvider";
import {
  Upload,
  Send,
  Loader2,
  Image as ImageIcon,
  X,
  Brain,
  Sparkles,
  Eye,
  Table2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

interface TableRow {
  area: string;
  problem: string;
  impact: string;
  why_reduces_conversion: string;
  action: string;
}

interface ClaudeCorrection {
  row_area: string;
  original_action: string;
  improved_action: string;
  reason: string;
}

interface ClaudeAdditional {
  area: string;
  problem: string;
  impact: string;
  why_reduces_conversion: string;
  action: string;
}

interface ClaudeReview {
  corrections: ClaudeCorrection[];
  additional_issues: ClaudeAdditional[];
  overall_verdict: string;
}

interface AnalysisResult {
  geminiAnalysis: string;
  tableData: TableRow[];
  claudeReview: ClaudeReview;
}

type PipelineStep = "idle" | "gemini" | "gpt" | "claude" | "done" | "error";

const impactConfig: Record<string, { color: string; bg: string; order: number }> = {
  Critico: { color: "#ef4444", bg: "bg-[#ef4444]/10 border-[#ef4444]/30", order: 0 },
  Alto: { color: "#F97316", bg: "bg-[#F97316]/10 border-[#F97316]/30", order: 1 },
  Medio: { color: "#f59e0b", bg: "bg-[#f59e0b]/10 border-[#f59e0b]/30", order: 2 },
  Basso: { color: "#3b82f6", bg: "bg-[#3b82f6]/10 border-[#3b82f6]/30", order: 3 },
};

export default function Home() {
  const { t } = useLanguage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGemini, setShowGemini] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleAnalyze = async () => {
    if (!imageBase64) return;

    setError(null);
    setResult(null);
    setPipelineStep("gemini");

    try {
      const stepTimer = setInterval(() => {
        setPipelineStep((prev) => {
          if (prev === "gemini") return "gpt";
          if (prev === "gpt") return "claude";
          clearInterval(stepTimer);
          return prev;
        });
      }, 15000);

      const response = await fetch("/api/cro-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
          userMessage: userMessage || undefined,
        }),
      });

      clearInterval(stepTimer);

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setPipelineStep("done");
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      } else {
        setError(data.error);
        setPipelineStep("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setPipelineStep("error");
    }
  };

  const handleClear = () => {
    setImagePreview(null);
    setImageBase64(null);
    setUserMessage("");
    setResult(null);
    setError(null);
    setPipelineStep("idle");
  };

  const isAnalyzing = ["gemini", "gpt", "claude"].includes(pipelineStep);

  const getCorrection = (area: string): ClaudeCorrection | undefined => {
    return result?.claudeReview?.corrections?.find(
      (c) => c.row_area.toLowerCase() === area.toLowerCase()
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" breadcrumb={["Dashboard"]} />

      <div className="p-10 max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a1a] mb-2">
            {t("dashboard.title")}
          </h1>
          <p className="text-[15px] text-[#888888]">
            {t("dashboard.subtitle")}
          </p>
        </div>

        {/* Upload & Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Image Upload */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl transition-all min-h-[320px] flex items-center justify-center ${
              isDragging
                ? "border-[#F97316] bg-[#F97316]/5"
                : imagePreview
                ? "border-[#e0e0e0] bg-[#f8f9fa]"
                : "border-[#d0d0d0] bg-[#f8f9fa] hover:border-[#F97316]/50 hover:bg-[#F97316]/5 cursor-pointer"
            }`}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
            />

            {imagePreview ? (
              <div className="relative w-full h-full p-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="absolute top-2 right-2 z-10 w-8 h-8 bg-[#1a1a1a]/80 text-white rounded-full flex items-center justify-center hover:bg-[#ff6b6b] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <img
                  src={imagePreview}
                  alt="Uploaded screenshot"
                  className="w-full h-full object-contain rounded-xl max-h-[400px]"
                />
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-[#F97316]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-[#F97316]" />
                </div>
                <p className="text-[16px] font-semibold text-[#1a1a1a] mb-2">
                  {t("dashboard.dropHere")}
                </p>
                <p className="text-[13px] text-[#888888] mb-4">
                  {t("dashboard.orClick")}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-5 py-2.5 bg-[#F97316] text-white rounded-xl text-[14px] font-medium hover:bg-[#EA580C] transition-all"
                >
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  {t("dashboard.chooseFile")}
                </button>
              </div>
            )}
          </div>

          {/* Context & Controls */}
          <div className="flex flex-col gap-4">
            {/* Context Input */}
            <div className="flex-1">
              <label className="block text-[13px] font-semibold text-[#1a1a1a] mb-2">
                {t("dashboard.context")}
              </label>
              <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder={t("dashboard.contextPlaceholder")}
                rows={5}
                className="w-full px-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#bbbbbb] focus:outline-none focus:border-[#F97316] transition-all resize-none"
              />
            </div>

            {/* Pipeline Status */}
            <div className="bg-[#f8f9fa] border border-[#e0e0e0] rounded-xl p-4">
              <p className="text-[12px] font-bold text-[#888888] uppercase tracking-wider mb-3">
                {t("dashboard.aiPipeline")}
              </p>
              <div className="flex items-center gap-3">
                {[
                  { id: "gemini", label: "Gemini", desc: t("dashboard.visualAnalysis"), icon: Eye },
                  { id: "gpt", label: "GPT", desc: t("dashboard.tableGeneration"), icon: Table2 },
                  { id: "claude", label: "Claude", desc: t("dashboard.expertReview"), icon: ShieldCheck },
                ].map((step, idx) => {
                  const isActive = pipelineStep === step.id;
                  const isDone =
                    pipelineStep === "done" ||
                    (step.id === "gemini" && ["gpt", "claude"].includes(pipelineStep)) ||
                    (step.id === "gpt" && pipelineStep === "claude");
                  const StepIcon = step.icon;

                  return (
                    <div key={step.id} className="flex items-center gap-3 flex-1">
                      <div
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1 border transition-all ${
                          isActive
                            ? "bg-[#F97316]/10 border-[#F97316]/40 shadow-sm"
                            : isDone
                            ? "bg-[#3b82f6]/10 border-[#3b82f6]/30"
                            : "bg-white border-[#e0e0e0]"
                        }`}
                      >
                        {isActive ? (
                          <Loader2 className="w-4 h-4 text-[#F97316] animate-spin shrink-0" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#3b82f6] shrink-0" />
                        ) : (
                          <StepIcon className="w-4 h-4 text-[#cccccc] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p
                            className={`text-[12px] font-bold ${
                              isActive ? "text-[#F97316]" : isDone ? "text-[#3b82f6]" : "text-[#cccccc]"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[10px] text-[#888888] truncate">{step.desc}</p>
                        </div>
                      </div>
                      {idx < 2 && (
                        <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isDone ? "text-[#3b82f6]" : "text-[#d0d0d0]"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!imageBase64 || isAnalyzing}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#F97316] to-[#3b82f6] text-white rounded-xl text-[16px] font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#F97316]/20"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("dashboard.analyzingWith")} {pipelineStep === "gemini" ? "Gemini" : pipelineStep === "gpt" ? "GPT" : "Claude"}...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t("dashboard.startAnalysis")}
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-[#ff6b6b] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#ff6b6b]">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="space-y-6">
            {/* Gemini Raw Analysis (collapsible) */}
            <div className="border border-[#e0e0e0] rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowGemini(!showGemini)}
                className="w-full flex items-center justify-between px-6 py-4 bg-[#f8f9fa] hover:bg-[#f0f0f5] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F97316]/10 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-[#F97316]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-semibold text-[#1a1a1a]">
                      {t("dashboard.geminiRaw")}
                    </p>
                    <p className="text-[12px] text-[#888888]">
                      {t("dashboard.geminiRawDesc")}
                    </p>
                  </div>
                </div>
                {showGemini ? (
                  <ChevronUp className="w-5 h-5 text-[#888888]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#888888]" />
                )}
              </button>
              {showGemini && (
                <div className="p-6 border-t border-[#e0e0e0] bg-white">
                  <div className="prose max-w-none text-[13px] text-[#444444] leading-relaxed whitespace-pre-wrap">
                    {result.geminiAnalysis}
                  </div>
                </div>
              )}
            </div>

            {/* Main CRO Table */}
            <div className="border border-[#e0e0e0] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-5 bg-gradient-to-r from-[#F97316]/10 to-[#3b82f6]/10 border-b border-[#e0e0e0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#F97316] to-[#3b82f6] rounded-xl flex items-center justify-center">
                    <Table2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold text-[#1a1a1a]">
                      {t("dashboard.croTable")}
                    </h2>
                    <p className="text-[13px] text-[#888888]">
                      {result.tableData.length} {t("dashboard.issuesFound")} — {t("dashboard.generatedBy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {["Critico", "Alto", "Medio", "Basso"].map((level) => {
                    const count = result.tableData.filter((r) => r.impact === level).length;
                    if (count === 0) return null;
                    const cfg = impactConfig[level];
                    return (
                      <span
                        key={level}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg}`}
                        style={{ color: cfg.color }}
                      >
                        {count} {level}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f8f9fa] border-b border-[#e0e0e0]">
                      <th className="text-left px-5 py-3.5 text-[11px] font-bold text-[#888888] uppercase tracking-wider w-[140px]">
                        {t("table.area")}
                      </th>
                      <th className="text-left px-5 py-3.5 text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                        {t("table.problem")}
                      </th>
                      <th className="text-center px-4 py-3.5 text-[11px] font-bold text-[#888888] uppercase tracking-wider w-[90px]">
                        {t("table.impact")}
                      </th>
                      <th className="text-left px-5 py-3.5 text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                        {t("table.whyReduces")}
                      </th>
                      <th className="text-left px-5 py-3.5 text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                        {t("table.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {result.tableData.map((row, idx) => {
                      const impact = impactConfig[row.impact] || impactConfig.Medio;
                      const correction = getCorrection(row.area);

                      return (
                        <>
                          <tr
                            key={idx}
                            className={`hover:bg-[#fafaff] transition-colors ${correction ? "bg-[#f59e0b]/5" : ""}`}
                          >
                            <td className="px-5 py-4 align-top">
                              <span className="text-[13px] font-bold text-[#1a1a1a]">
                                {row.area}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className="text-[13px] text-[#444444] leading-relaxed">
                                {row.problem}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${impact.bg}`}
                                style={{ color: impact.color }}
                              >
                                {row.impact}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className="text-[13px] text-[#666666] leading-relaxed">
                                {row.why_reduces_conversion}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className="text-[13px] text-[#1a1a1a] leading-relaxed font-medium">
                                {row.action}
                              </span>
                            </td>
                          </tr>
                          {/* Claude correction row */}
                          {correction && (
                            <tr key={`correction-${idx}`} className="bg-gradient-to-r from-[#8b5cf6]/5 to-[#8b5cf6]/10">
                              <td className="px-5 py-3 align-top" colSpan={2}>
                                <div className="flex items-center gap-2">
                                  <Brain className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
                                  <span className="text-[11px] font-bold text-[#8b5cf6] uppercase tracking-wider">
                                    {t("dashboard.claudeReview")}
                                  </span>
                                </div>
                                <p className="text-[12px] text-[#888888] mt-1 italic">
                                  {correction.reason}
                                </p>
                              </td>
                              <td className="px-4 py-3 align-top text-center">
                                <span className="text-[10px] font-bold text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-0.5 rounded-full">
                                  {t("dashboard.upgrade")}
                                </span>
                              </td>
                              <td className="px-5 py-3 align-top" colSpan={2}>
                                <p className="text-[12px] text-[#8b5cf6] font-medium leading-relaxed">
                                  {correction.improved_action}
                                </p>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}

                    {/* Claude Additional Issues */}
                    {result.claudeReview?.additional_issues?.length > 0 && (
                      <>
                        <tr className="bg-gradient-to-r from-[#8b5cf6]/10 to-[#8b5cf6]/5">
                          <td colSpan={5} className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-[#8b5cf6]" />
                              <span className="text-[13px] font-bold text-[#8b5cf6]">
                                {t("dashboard.additionalIssues")}
                              </span>
                              <span className="text-[11px] text-[#8b5cf6]/70">
                                — {result.claudeReview.additional_issues.length} {t("dashboard.missedBy")}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {result.claudeReview.additional_issues.map((row, idx) => {
                          const impact = impactConfig[row.impact] || impactConfig.Medio;
                          return (
                            <tr
                              key={`claude-${idx}`}
                              className="bg-[#8b5cf6]/5 hover:bg-[#8b5cf6]/10 transition-colors"
                            >
                              <td className="px-5 py-4 align-top">
                                <div className="flex items-center gap-1.5">
                                  <Brain className="w-3 h-3 text-[#8b5cf6] shrink-0" />
                                  <span className="text-[13px] font-bold text-[#1a1a1a]">
                                    {row.area}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <span className="text-[13px] text-[#444444]">{row.problem}</span>
                              </td>
                              <td className="px-4 py-4 align-top text-center">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${impact.bg}`}
                                  style={{ color: impact.color }}
                                >
                                  {row.impact}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <span className="text-[13px] text-[#666666]">
                                  {row.why_reduces_conversion}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <span className="text-[13px] text-[#1a1a1a] font-medium">
                                  {row.action}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with totals */}
              <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#e0e0e0] flex items-center justify-between">
                <p className="text-[12px] text-[#888888]">
                  {result.tableData.length + (result.claudeReview?.additional_issues?.length || 0)} {t("dashboard.totalIssues")}
                </p>
                <div className="flex items-center gap-1.5 text-[12px] text-[#888888]">
                  <Eye className="w-3 h-3" /> Gemini
                  <span className="text-[#d0d0d0] mx-1">→</span>
                  <Table2 className="w-3 h-3" /> GPT
                  <span className="text-[#d0d0d0] mx-1">→</span>
                  <Brain className="w-3 h-3" /> Claude
                </div>
              </div>
            </div>

            {/* Claude Overall Verdict */}
            {result.claudeReview?.overall_verdict && (
              <div className="bg-gradient-to-br from-[#8b5cf6]/10 to-[#8b5cf6]/5 border border-[#8b5cf6]/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#8b5cf6]/20 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-[#8b5cf6]" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1a1a1a]">
                      {t("dashboard.claudeVerdict")}
                    </h3>
                    <p className="text-[12px] text-[#888888]">
                      {t("dashboard.claudeVerdictDesc")}
                    </p>
                  </div>
                </div>
                <p className="text-[14px] text-[#333333] leading-relaxed pl-[52px]">
                  {result.claudeReview.overall_verdict}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
