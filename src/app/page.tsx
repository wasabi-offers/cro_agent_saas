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
  Critico: { color: "#EF4444", bg: "bg-[#EF4444]/10 border-[#EF4444]/30", order: 0 },
  Alto: { color: "#6366F1", bg: "bg-[#6366F1]/10 border-[#6366F1]/30", order: 1 },
  Medio: { color: "#F59E0B", bg: "bg-[#F59E0B]/10 border-[#F59E0B]/30", order: 2 },
  Basso: { color: "#06B6D4", bg: "bg-[#06B6D4]/10 border-[#06B6D4]/30", order: 3 },
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

  const compressImage = useCallback((dataUrl: string, maxWidth = 1920, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(dataUrl); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch { resolve(dataUrl); }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const raw = reader.result as string;
      setImagePreview(raw);
      try {
        const compressed = await compressImage(raw);
        setImageBase64(compressed);
      } catch {
        setImageBase64(raw);
      }
    };
    reader.readAsDataURL(file);
  }, [compressImage]);

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

      <div className="px-8 py-6 max-w-content mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-[24px] font-semibold text-[#0F172A] mb-2">
            {t("dashboard.title")}
          </h1>
          <p className="text-[15px] text-[#94A3B8]">
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
            className={`relative border-2 border-dashed rounded-2xl transition-all duration-150 min-h-[320px] flex items-center justify-center ${
              isDragging
                ? "border-[#6366F1] bg-[#6366F1]/5"
                : imagePreview
                ? "border-[#E2E8F0] bg-[#F8FAFC]"
                : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#6366F1]/50 hover:bg-[#6366F1]/5 cursor-pointer"
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
                  className="absolute top-2 right-2 z-10 w-8 h-8 bg-[#0F172A]/80 text-white rounded-full flex items-center justify-center hover:bg-[#EF4444] transition-colors duration-150"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <img
                  src={imagePreview}
                  alt="Uploaded screenshot"
                  className="w-full h-full object-contain rounded-xl max-h-[400px]"
                />
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-[#6366F1]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-[#6366F1]" strokeWidth={1.5} />
                </div>
                <p className="text-[16px] font-semibold text-[#0F172A] mb-2">
                  {t("dashboard.dropHere")}
                </p>
                <p className="text-[13px] text-[#94A3B8] mb-4">
                  {t("dashboard.orClick")}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-5 py-2.5 bg-[#6366F1] text-white rounded-xl text-[14px] font-medium hover:bg-[#4F46E5] transition-all duration-150"
                >
                  <ImageIcon className="w-4 h-4 inline mr-2" strokeWidth={1.5} />
                  {t("dashboard.chooseFile")}
                </button>
              </div>
            )}
          </div>

          {/* Context & Controls */}
          <div className="flex flex-col gap-4">
            {/* Context Input */}
            <div className="flex-1">
              <label className="block text-[13px] font-semibold text-[#0F172A] mb-2">
                {t("dashboard.context")}
              </label>
              <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder={t("dashboard.contextPlaceholder")}
                rows={5}
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 transition-all duration-150 resize-none"
              />
            </div>

            {/* Pipeline Status */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
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
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1 border transition-all duration-150 ${
                          isActive
                            ? "bg-[#6366F1]/10 border-[#6366F1]/40 shadow-sm"
                            : isDone
                            ? "bg-[#06B6D4]/10 border-[#06B6D4]/30"
                            : "bg-white border-[#E2E8F0]"
                        }`}
                      >
                        {isActive ? (
                          <Loader2 className="w-4 h-4 text-[#6366F1] animate-spin shrink-0" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#06B6D4] shrink-0" />
                        ) : (
                          <StepIcon className="w-4 h-4 text-[#CBD5E1] shrink-0" strokeWidth={1.5} />
                        )}
                        <div className="min-w-0">
                          <p
                            className={`text-[12px] font-semibold ${
                              isActive ? "text-[#6366F1]" : isDone ? "text-[#06B6D4]" : "text-[#CBD5E1]"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[10px] text-[#94A3B8] truncate">{step.desc}</p>
                        </div>
                      </div>
                      {idx < 2 && (
                        <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isDone ? "text-[#06B6D4]" : "text-[#CBD5E1]"}`} strokeWidth={1.5} />
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
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl text-[16px] font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-brand"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("dashboard.analyzingWith")} {pipelineStep === "gemini" ? "Gemini" : pipelineStep === "gpt" ? "GPT" : "Claude"}...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                  {t("dashboard.startAnalysis")}
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-[13px] text-[#EF4444]">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="space-y-6">
            {/* Gemini Raw Analysis (collapsible) */}
            <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowGemini(!showGemini)}
                className="w-full flex items-center justify-between px-6 py-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#6366F1]/10 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-[#6366F1]" strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-semibold text-[#0F172A]">
                      {t("dashboard.geminiRaw")}
                    </p>
                    <p className="text-[12px] text-[#94A3B8]">
                      {t("dashboard.geminiRawDesc")}
                    </p>
                  </div>
                </div>
                {showGemini ? (
                  <ChevronUp className="w-5 h-5 text-[#94A3B8]" strokeWidth={1.5} />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#94A3B8]" strokeWidth={1.5} />
                )}
              </button>
              {showGemini && (
                <div className="p-6 border-t border-[#E2E8F0] bg-white">
                  <div className="prose max-w-none text-[13px] text-[#334155] leading-relaxed whitespace-pre-wrap">
                    {result.geminiAnalysis}
                  </div>
                </div>
              )}
            </div>

            {/* Main CRO Table */}
            <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-5 bg-gradient-to-r from-[#6366F1]/5 to-[#8B5CF6]/5 border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center">
                    <Table2 className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#0F172A]">
                      {t("dashboard.croTable")}
                    </h2>
                    <p className="text-[13px] text-[#94A3B8]">
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
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg}`}
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
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider w-[140px]">
                        {t("table.area")}
                      </th>
                      <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        {t("table.problem")}
                      </th>
                      <th className="text-center px-4 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider w-[90px]">
                        {t("table.impact")}
                      </th>
                      <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        {t("table.whyReduces")}
                      </th>
                      <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        {t("table.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {result.tableData.map((row, idx) => {
                      const impact = impactConfig[row.impact] || impactConfig.Medio;
                      const correction = getCorrection(row.area);

                      return (
                        <>
                          <tr
                            key={idx}
                            className={`hover:bg-[#F8FAFC] transition-colors duration-150 ${correction ? "bg-[#F59E0B]/5" : ""}`}
                          >
                            <td className="px-5 py-4 align-top">
                              <span className="text-[13px] font-semibold text-[#0F172A]">
                                {row.area}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className="text-[13px] text-[#334155] leading-relaxed">
                                {row.problem}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${impact.bg}`}
                                style={{ color: impact.color }}
                              >
                                {row.impact}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className="text-[13px] text-[#64748B] leading-relaxed">
                                {row.why_reduces_conversion}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className="text-[13px] text-[#0F172A] leading-relaxed font-medium">
                                {row.action}
                              </span>
                            </td>
                          </tr>
                          {correction && (
                            <tr key={`correction-${idx}`} className="bg-gradient-to-r from-[#8B5CF6]/5 to-[#8B5CF6]/10">
                              <td className="px-5 py-3 align-top" colSpan={2}>
                                <div className="flex items-center gap-2">
                                  <Brain className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" strokeWidth={1.5} />
                                  <span className="text-[11px] font-semibold text-[#8B5CF6] uppercase tracking-wider">
                                    {t("dashboard.claudeReview")}
                                  </span>
                                </div>
                                <p className="text-[12px] text-[#94A3B8] mt-1 italic">
                                  {correction.reason}
                                </p>
                              </td>
                              <td className="px-4 py-3 align-top text-center">
                                <span className="text-[10px] font-semibold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full">
                                  {t("dashboard.upgrade")}
                                </span>
                              </td>
                              <td className="px-5 py-3 align-top" colSpan={2}>
                                <p className="text-[12px] text-[#8B5CF6] font-medium leading-relaxed">
                                  {correction.improved_action}
                                </p>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}

                    {result.claudeReview?.additional_issues?.length > 0 && (
                      <>
                        <tr className="bg-gradient-to-r from-[#8B5CF6]/10 to-[#8B5CF6]/5">
                          <td colSpan={5} className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-[#8B5CF6]" strokeWidth={1.5} />
                              <span className="text-[13px] font-semibold text-[#8B5CF6]">
                                {t("dashboard.additionalIssues")}
                              </span>
                              <span className="text-[11px] text-[#8B5CF6]/70">
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
                              className="bg-[#8B5CF6]/5 hover:bg-[#8B5CF6]/10 transition-colors duration-150"
                            >
                              <td className="px-5 py-4 align-top">
                                <div className="flex items-center gap-1.5">
                                  <Brain className="w-3 h-3 text-[#8B5CF6] shrink-0" strokeWidth={1.5} />
                                  <span className="text-[13px] font-semibold text-[#0F172A]">
                                    {row.area}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <span className="text-[13px] text-[#334155]">{row.problem}</span>
                              </td>
                              <td className="px-4 py-4 align-top text-center">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${impact.bg}`}
                                  style={{ color: impact.color }}
                                >
                                  {row.impact}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <span className="text-[13px] text-[#64748B]">
                                  {row.why_reduces_conversion}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <span className="text-[13px] text-[#0F172A] font-medium">
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

              {/* Table Footer */}
              <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
                <p className="text-[12px] text-[#94A3B8]">
                  {result.tableData.length + (result.claudeReview?.additional_issues?.length || 0)} {t("dashboard.totalIssues")}
                </p>
                <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
                  <Eye className="w-3 h-3" /> Gemini
                  <span className="text-[#CBD5E1] mx-1">→</span>
                  <Table2 className="w-3 h-3" /> GPT
                  <span className="text-[#CBD5E1] mx-1">→</span>
                  <Brain className="w-3 h-3" /> Claude
                </div>
              </div>
            </div>

            {/* Claude Overall Verdict */}
            {result.claudeReview?.overall_verdict && (
              <div className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#8B5CF6]/15 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-[#8B5CF6]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#0F172A]">
                      {t("dashboard.claudeVerdict")}
                    </h3>
                    <p className="text-[12px] text-[#94A3B8]">
                      {t("dashboard.claudeVerdictDesc")}
                    </p>
                  </div>
                </div>
                <p className="text-[14px] text-[#334155] leading-relaxed pl-[52px]">
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
