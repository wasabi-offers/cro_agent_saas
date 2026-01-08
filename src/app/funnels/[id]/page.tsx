"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  FileSearch,
  Loader2,
  Type,
  Palette,
  MousePointer,
  MousePointerClick,
  Eye,
} from "lucide-react";
import {
  generateMockFunnels,
  ConversionFunnel,
} from "@/lib/mock-data";

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

export default function FunnelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const funnelId = params.id as string;

  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "heatmap">("overview");

  // Analysis state
  const [analysisMode, setAnalysisMode] = useState<"funnel" | "page">("funnel");
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [analysisError, setAnalysisError] = useState("");

  // Heatmap state
  const [selectedHeatmapPage, setSelectedHeatmapPage] = useState<number>(0);
  const [heatmapType, setHeatmapType] = useState<"click" | "scroll" | "move">("click");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // In production: const res = await fetch(`/api/funnels/${funnelId}`);
      const funnels = generateMockFunnels();
      const found = funnels.find(f => f.id === funnelId);
      setFunnel(found || null);
      setIsLoading(false);
    };

    loadData();
  }, [funnelId]);

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
    if (!funnel) return;

    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysisResults([]);

    try {
      // Mock URL - in production this would be real page URLs
      const url = analysisMode === "funnel"
        ? `https://example.com/${funnel.name.toLowerCase().replace(/\s+/g, '-')}`
        : `https://example.com${funnel.steps[selectedPage].name.toLowerCase().replace(/\s+/g, '-')}`;

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

      if (!response.ok) throw new Error("Analysis error");

      const data = await response.json();
      setAnalysisResults(data.results);
    } catch (err) {
      setAnalysisError("An error occurred during analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStepConversion = (currentVisitors: number, previousVisitors: number) => {
    if (previousVisitors === 0) return 100;
    return (currentVisitors / previousVisitors) * 100;
  };

  const getDropoffColor = (dropoff: number) => {
    if (dropoff >= 60) return 'text-[#ff6b6b]';
    if (dropoff >= 40) return 'text-[#f59e0b]';
    return 'text-[#00d4aa]';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Funnel Detail" breadcrumb={["Dashboard", "Funnels", "Loading..."]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading funnel data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Funnel Not Found" breadcrumb={["Dashboard", "Funnels", "Error"]} />
        <div className="p-10 text-center">
          <AlertCircle className="w-16 h-16 text-[#ff6b6b] mx-auto mb-4" />
          <h2 className="text-[24px] font-bold text-[#fafafa] mb-2">Funnel Not Found</h2>
          <p className="text-[14px] text-[#666666] mb-6">
            The funnel you're looking for doesn't exist.
          </p>
          <Link
            href="/funnels"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white rounded-xl font-medium text-[14px] hover:shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Funnels
          </Link>
        </div>
      </div>
    );
  }

  const firstStep = funnel.steps[0];
  const lastStep = funnel.steps[funnel.steps.length - 1];

  return (
    <div className="min-h-screen bg-black">
      <Header title={funnel.name} breadcrumb={["Dashboard", "Funnels", funnel.name]} />

      <div className="p-10 max-w-7xl mx-auto">
        {/* Back Button & Stats Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/funnels"
            className="flex items-center gap-2 text-[14px] text-[#888888] hover:text-[#7c5cff] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Funnels
          </Link>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[12px] text-[#888888]">Conversion Rate</p>
              <p className="text-[24px] font-bold text-[#00d4aa]">
                {funnel.conversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-[#888888]">Total Visitors</p>
              <p className="text-[24px] font-bold text-[#fafafa]">
                {firstStep.visitors.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-[#888888]">Conversions</p>
              <p className="text-[24px] font-bold text-[#00d4aa]">
                {lastStep.visitors.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8 border-b border-[#1a1a1a]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 text-[14px] font-medium transition-all relative ${
              activeTab === "overview"
                ? "text-[#fafafa]"
                : "text-[#666666] hover:text-[#888888]"
            }`}
          >
            Overview
            {activeTab === "overview" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-6 py-3 text-[14px] font-medium transition-all relative flex items-center gap-2 ${
              activeTab === "analysis"
                ? "text-[#fafafa]"
                : "text-[#666666] hover:text-[#888888]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            CRO Analysis
            {activeTab === "analysis" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("heatmap")}
            className={`px-6 py-3 text-[14px] font-medium transition-all relative flex items-center gap-2 ${
              activeTab === "heatmap"
                ? "text-[#fafafa]"
                : "text-[#666666] hover:text-[#888888]"
            }`}
          >
            <MousePointerClick className="w-4 h-4" />
            Heatmap
            {activeTab === "heatmap" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa]" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Funnel Steps */}
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
              <h2 className="text-[18px] font-semibold text-[#fafafa] mb-6">Funnel Steps</h2>

              <div className="space-y-4">
                {funnel.steps.map((step, index) => {
                  const isFirst = index === 0;
                  const isLast = index === funnel.steps.length - 1;
                  const prevStep = index > 0 ? funnel.steps[index - 1] : null;
                  const stepConversion = prevStep
                    ? getStepConversion(step.visitors, prevStep.visitors)
                    : 100;
                  const widthPercentage = (step.visitors / firstStep.visitors) * 100;

                  return (
                    <div key={step.name}>
                      {!isFirst && (
                        <div className="flex items-center gap-4 py-2 pl-8">
                          <ChevronDown className={`w-5 h-5 ${getDropoffColor(step.dropoff)}`} />
                          <span className={`text-[13px] font-medium ${getDropoffColor(step.dropoff)}`}>
                            {step.dropoff}% drop-off
                          </span>
                          <span className="text-[12px] text-[#555555]">
                            ({prevStep!.visitors - step.visitors} users lost)
                          </span>
                        </div>
                      )}

                      <div className="relative">
                        <div
                          className={`h-20 rounded-xl flex items-center px-6 transition-all ${
                            isLast
                              ? 'bg-gradient-to-r from-[#00d4aa]/30 to-[#00d4aa]/10 border border-[#00d4aa]/30'
                              : 'bg-gradient-to-r from-[#7c5cff]/30 to-[#7c5cff]/10 border border-[#7c5cff]/30'
                          }`}
                          style={{ width: `${Math.max(widthPercentage, 20)}%` }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLast ? 'bg-[#00d4aa]/20' : 'bg-[#7c5cff]/20'}`}>
                                <span className={`text-[14px] font-bold ${isLast ? 'text-[#00d4aa]' : 'text-[#7c5cff]'}`}>
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="text-[14px] font-medium text-[#fafafa]">{step.name}</p>
                                <p className="text-[12px] text-[#666666]">
                                  {stepConversion.toFixed(1)}% of previous step
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-[20px] font-bold ${isLast ? 'text-[#00d4aa]' : 'text-[#fafafa]'}`}>
                                {step.visitors.toLocaleString()}
                              </p>
                              <p className="text-[11px] text-[#666666]">users</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                <h3 className="text-[16px] font-semibold text-[#fafafa] mb-4">Summary</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-[13px] text-[#888888]">Total Entered</span>
                    <span className="text-[14px] text-[#fafafa] font-medium">
                      {firstStep.visitors.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-[13px] text-[#888888]">Converted</span>
                    <span className="text-[14px] text-[#00d4aa] font-medium">
                      {lastStep.visitors.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-[13px] text-[#888888]">Lost Users</span>
                    <span className="text-[14px] text-[#ff6b6b] font-medium">
                      {(firstStep.visitors - lastStep.visitors).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-[#888888]">Steps</span>
                    <span className="text-[14px] text-[#fafafa] font-medium">
                      {funnel.steps.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-[#ff6b6b]" />
                  <h3 className="text-[16px] font-semibold text-[#fafafa]">Biggest Drop-offs</h3>
                </div>

                <div className="space-y-3">
                  {[...funnel.steps]
                    .filter((s) => s.dropoff > 0)
                    .sort((a, b) => b.dropoff - a.dropoff)
                    .slice(0, 3)
                    .map((step, index) => (
                      <div
                        key={step.name}
                        className="flex items-center justify-between p-3 bg-[#111111] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[#555555] font-bold">#{index + 1}</span>
                          <span className="text-[13px] text-[#fafafa]">{step.name}</span>
                        </div>
                        <span className={`text-[14px] font-bold ${getDropoffColor(step.dropoff)}`}>
                          -{step.dropoff}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="space-y-6">
            {/* Analysis Options */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
                  <FileSearch className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-[20px] font-semibold text-[#fafafa]">
                  CRO Analysis
                </h2>
              </div>

              {/* Analysis Mode Selector */}
              <div className="mb-6">
                <label className="block text-[14px] text-[#888888] mb-3">
                  Analysis Scope
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setAnalysisMode("funnel")}
                    className={`flex-1 px-6 py-4 rounded-xl text-[14px] font-medium transition-all ${
                      analysisMode === "funnel"
                        ? "bg-[#7c5cff] text-white"
                        : "bg-[#111111] text-[#888888] border border-[#2a2a2a] hover:border-[#7c5cff]/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Target className="w-5 h-5" />
                      Analyze Entire Funnel
                    </div>
                  </button>
                  <button
                    onClick={() => setAnalysisMode("page")}
                    className={`flex-1 px-6 py-4 rounded-xl text-[14px] font-medium transition-all ${
                      analysisMode === "page"
                        ? "bg-[#7c5cff] text-white"
                        : "bg-[#111111] text-[#888888] border border-[#2a2a2a] hover:border-[#7c5cff]/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FileSearch className="w-5 h-5" />
                      Analyze Specific Page
                    </div>
                  </button>
                </div>
              </div>

              {/* Page Selector (if page mode) */}
              {analysisMode === "page" && (
                <div className="mb-6">
                  <label className="block text-[14px] text-[#888888] mb-3">
                    Select Page to Analyze
                  </label>
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[15px] focus:outline-none focus:border-[#7c5cff] transition-all"
                  >
                    {funnel.steps.map((step, idx) => (
                      <option key={idx} value={idx}>
                        Step {idx + 1}: {step.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Analysis Filters */}
              <div className="mb-6">
                <label className="block text-[14px] text-[#888888] mb-3">
                  Analysis Type
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "all", label: "Complete Analysis", icon: Sparkles },
                    { id: "cro", label: "CRO", icon: TrendingUp },
                    { id: "copy", label: "Copywriting", icon: Type },
                    { id: "colors", label: "Colors", icon: Palette },
                    { id: "experience", label: "User Experience", icon: MousePointer },
                  ].map((filter) => {
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
              {analysisError && (
                <div className="mb-6 flex items-center gap-2 text-[#ff6b6b] text-[14px] bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4" />
                  {analysisError}
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
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Start Analysis
                  </>
                )}
              </button>
            </div>

            {/* Analysis Results */}
            {analysisResults.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#00d4aa]" />
                  <h2 className="text-[20px] font-semibold text-[#fafafa]">
                    Analysis Results
                    {analysisMode === "page" && (
                      <span className="text-[16px] text-[#888888] ml-2">
                        - {funnel.steps[selectedPage].name}
                      </span>
                    )}
                  </h2>
                </div>

                {analysisResults.map((result, index) => {
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
        )}

        {activeTab === "heatmap" && (
          <div className="space-y-6">
            {/* Heatmap Controls */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-[20px] font-semibold text-[#fafafa]">
                  Heatmap Visualization
                </h2>
              </div>

              {/* Page Selector */}
              <div className="mb-6">
                <label className="block text-[14px] text-[#888888] mb-3">
                  Select Funnel Step
                </label>
                <select
                  value={selectedHeatmapPage}
                  onChange={(e) => setSelectedHeatmapPage(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[15px] focus:outline-none focus:border-[#7c5cff] transition-all"
                >
                  {funnel.steps.map((step, idx) => (
                    <option key={idx} value={idx}>
                      Step {idx + 1}: {step.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Heatmap Type Selector */}
              <div className="mb-6">
                <label className="block text-[14px] text-[#888888] mb-3">
                  Heatmap Type
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setHeatmapType("click")}
                    className={`flex-1 px-6 py-4 rounded-xl text-[14px] font-medium transition-all ${
                      heatmapType === "click"
                        ? "bg-[#7c5cff] text-white"
                        : "bg-[#111111] text-[#888888] border border-[#2a2a2a] hover:border-[#7c5cff]/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <MousePointerClick className="w-5 h-5" />
                      Click Map
                    </div>
                  </button>
                  <button
                    onClick={() => setHeatmapType("scroll")}
                    className={`flex-1 px-6 py-4 rounded-xl text-[14px] font-medium transition-all ${
                      heatmapType === "scroll"
                        ? "bg-[#7c5cff] text-white"
                        : "bg-[#111111] text-[#888888] border border-[#2a2a2a] hover:border-[#7c5cff]/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ChevronDown className="w-5 h-5" />
                      Scroll Map
                    </div>
                  </button>
                  <button
                    onClick={() => setHeatmapType("move")}
                    className={`flex-1 px-6 py-4 rounded-xl text-[14px] font-medium transition-all ${
                      heatmapType === "move"
                        ? "bg-[#7c5cff] text-white"
                        : "bg-[#111111] text-[#888888] border border-[#2a2a2a] hover:border-[#7c5cff]/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Eye className="w-5 h-5" />
                      Move Map
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Heatmap Visualization */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">
                    {funnel.steps[selectedHeatmapPage].name} - {heatmapType.charAt(0).toUpperCase() + heatmapType.slice(1)} Heatmap
                  </h3>
                  <p className="text-[14px] text-[#888888]">
                    Based on {Math.floor(Math.random() * 2000 + 500).toLocaleString()} user sessions
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>
                    <span className="text-[12px] text-[#888888]">High Activity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                    <span className="text-[12px] text-[#888888]">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#7c5cff]"></div>
                    <span className="text-[12px] text-[#888888]">Low Activity</span>
                  </div>
                </div>
              </div>

              {/* Mock Heatmap Visualization */}
              <div className="relative bg-[#111111] rounded-xl overflow-hidden" style={{ height: '600px' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MousePointerClick className="w-16 h-16 text-[#7c5cff] mx-auto mb-4 opacity-50" />
                    <p className="text-[16px] text-[#888888] mb-2">
                      Heatmap visualization will appear here
                    </p>
                    <p className="text-[14px] text-[#666666]">
                      Showing {heatmapType} data for: {funnel.steps[selectedHeatmapPage].name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111111] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointerClick className="w-4 h-4 text-[#7c5cff]" />
                    <span className="text-[12px] text-[#888888]">Most Clicked</span>
                  </div>
                  <p className="text-[16px] font-semibold text-[#fafafa]">CTA Button</p>
                  <p className="text-[12px] text-[#666666] mt-1">45% of all clicks</p>
                </div>
                <div className="bg-[#111111] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ChevronDown className="w-4 h-4 text-[#00d4aa]" />
                    <span className="text-[12px] text-[#888888]">Avg Scroll Depth</span>
                  </div>
                  <p className="text-[16px] font-semibold text-[#fafafa]">68%</p>
                  <p className="text-[12px] text-[#666666] mt-1">Users reach fold 3</p>
                </div>
                <div className="bg-[#111111] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-[#ff6b6b]" />
                    <span className="text-[12px] text-[#888888]">Rage Clicks</span>
                  </div>
                  <p className="text-[16px] font-semibold text-[#ff6b6b]">23 instances</p>
                  <p className="text-[12px] text-[#666666] mt-1">On form fields</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
