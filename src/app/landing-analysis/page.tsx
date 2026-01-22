"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import VisualAnnotations from "@/components/VisualAnnotations";
import BeforeAfterTracking from "@/components/BeforeAfterTracking";
import ExportShareButtons from "@/components/ExportShareButtons";
import CROComparisonTable from "@/components/CROComparisonTable";
import HeatmapVisualization from "@/components/HeatmapVisualization";
import SaveItemDialog from "@/components/SaveItemDialog";
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
  Eye,
  List,
  Clock,
  Table,
  Save,
  Flame,
} from "lucide-react";
import { CROTableRow, SavedLandingPage, landingPageStorage } from "@/lib/saved-items";

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
  const [viewMode, setViewMode] = useState<"visual" | "list" | "history" | "cro-table" | "heatmap">("visual");

  // CRO Table state
  const [croTableRows, setCroTableRows] = useState<CROTableRow[]>([]);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Ref for PDF export
  const exportContentRef = useRef<HTMLDivElement>(null);

  const filters = [
    { id: "all", label: "Complete Analysis", icon: Sparkles },
    { id: "cro", label: "CRO", icon: TrendingUp },
    { id: "copy", label: "Copywriting", icon: Type },
    { id: "colors", label: "Colors", icon: Palette },
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
      setError("Please enter a valid URL");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResults([]);
    setCroTableRows([]);

    try {
      // Run both analysis in parallel
      const [analysisResponse, croTableResponse] = await Promise.all([
        fetch("/api/analyze-landing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            filters: selectedFilters.includes("all")
              ? ["cro", "copy", "colors", "experience"]
              : selectedFilters,
          }),
        }),
        fetch("/api/generate-cro-table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            type: 'landing',
          }),
        }),
      ]);

      if (!analysisResponse.ok) throw new Error("Analysis error");

      const analysisData = await analysisResponse.json();
      setResults(analysisData.results);

      // CRO table is optional - don't fail if it errors
      if (croTableResponse.ok) {
        const croTableData = await croTableResponse.json();
        if (croTableData.success) {
          setCroTableRows(croTableData.rows);
          console.log("✅ CRO Table generated successfully");
        } else {
          console.error("❌ CRO Table generation failed:", croTableData.error);
        }
      } else {
        const errorData = await croTableResponse.json();
        console.error("❌ CRO Table API error:", errorData);
        if (errorData.rawResponse) {
          console.log("📝 Raw AI response:", errorData.rawResponse);
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = (data: { name: string; categoryId: string; url?: string }) => {
    const savedPage: SavedLandingPage = {
      id: `page_${Date.now()}`,
      name: data.name,
      categoryId: data.categoryId,
      url: data.url || url,
      analysis: croTableRows.length > 0 ? {
        generatedAt: new Date().toISOString(),
        comparisonTable: croTableRows,
        summary: `Analysis of ${data.name}`,
        expectedImpact: {
          totalLift: '+15-25%',
          confidence: 85,
        },
      } : undefined,
      savedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    landingPageStorage.save(savedPage);
    alert('Landing page saved successfully!');
    setShowSaveDialog(false);
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

  // Mock annotations for visual view
  const mockAnnotations = [
    {
      id: "1",
      x: 50,
      y: 15,
      type: "critical" as const,
      category: "CRO",
      title: "Weak Above-the-Fold CTA",
      description: "The primary call-to-action button lacks visual hierarchy and is difficult to spot. Studies show that 80% of users never scroll below the fold on landing pages.",
      recommendation: "Increase CTA button size by 50%, use high-contrast colors (purple or teal), and add more whitespace around it. Consider adding a subtle animation or glow effect.",
      impact: "high" as const,
    },
    {
      id: "2",
      x: 30,
      y: 25,
      type: "warning" as const,
      category: "Copywriting",
      title: "Unclear Value Proposition",
      description: "The headline doesn't clearly communicate what the product does or why users should care. It uses generic language instead of specific benefits.",
      recommendation: "Rewrite headline to focus on specific outcomes. Example: 'Increase Sales by 40% in 30 Days' instead of 'The Best Marketing Tool'.",
      impact: "high" as const,
    },
    {
      id: "3",
      x: 70,
      y: 35,
      type: "info" as const,
      category: "User Experience",
      title: "Missing Trust Signals",
      description: "No customer logos, testimonials, or security badges visible in the hero section. This reduces credibility for first-time visitors.",
      recommendation: "Add 3-5 recognizable customer logos just below the CTA. Include a brief testimonial with a real photo and company name.",
      impact: "medium" as const,
    },
    {
      id: "4",
      x: 50,
      y: 50,
      type: "critical" as const,
      category: "CRO",
      title: "Form Has Too Many Fields",
      description: "The signup form requires 8 fields including phone number and company size. Each additional field reduces conversion by an average of 11%.",
      recommendation: "Reduce to 3 essential fields: Name, Email, Password. Collect additional information after signup or make fields optional.",
      impact: "high" as const,
    },
    {
      id: "5",
      x: 25,
      y: 65,
      type: "warning" as const,
      category: "Colors",
      title: "Low Color Contrast",
      description: "The gray text on light gray background has a contrast ratio of 2.1:1, failing WCAG AA standards (minimum 4.5:1). This hurts readability and accessibility.",
      recommendation: "Darken text color to #333333 or darker to achieve minimum 4.5:1 contrast ratio. This will improve readability for all users.",
      impact: "medium" as const,
    },
    {
      id: "6",
      x: 60,
      y: 75,
      type: "success" as const,
      category: "User Experience",
      title: "Good Use of Social Proof",
      description: "The testimonials section uses real photos, full names, and job titles. This builds trust and credibility effectively.",
      recommendation: "Keep this approach and consider adding video testimonials or case study links for even stronger social proof.",
      impact: "low" as const,
    },
    {
      id: "7",
      x: 45,
      y: 85,
      type: "info" as const,
      category: "CRO",
      title: "Missing Exit-Intent Popup",
      description: "No exit-intent mechanism to capture abandoning visitors. This is a missed opportunity to convert 10-15% of bouncing traffic.",
      recommendation: "Implement exit-intent popup offering a lead magnet (free guide, discount, trial extension) in exchange for email.",
      impact: "medium" as const,
    },
  ];

  // Mock historical score data
  const mockHistory = [
    {
      date: "2025-12-15",
      overallScore: 58,
      categoryScores: {
        cro: 52,
        copy: 60,
        colors: 55,
        experience: 65,
      },
    },
    {
      date: "2026-01-02",
      overallScore: 64,
      categoryScores: {
        cro: 60,
        copy: 65,
        colors: 62,
        experience: 68,
      },
      changes: [
        "Improved CTA button visibility and size",
        "Added trust badges to hero section",
      ],
    },
    {
      date: "2026-01-08",
      overallScore: 73,
      categoryScores: {
        cro: 70,
        copy: 72,
        colors: 75,
        experience: 75,
      },
      changes: [
        "Reduced form fields from 8 to 3",
        "Improved color contrast for WCAG compliance",
        "Added exit-intent popup",
      ],
    },
  ];


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
              Analyze Landing Page
            </h2>
          </div>

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-[14px] text-[#888888] mb-2">
              Landing Page URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/landing-page"
              className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[15px] focus:outline-none focus:border-[#7c5cff] transition-all"
            />
          </div>

          {/* Filters */}
          <div className="mb-6">
            <label className="block text-[14px] text-[#888888] mb-3">
              Analysis Type
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
            className="bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white px-6 py-4 rounded-xl font-medium text-[15px] hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* Preview Section */}
        {url && !isAnalyzing && (results.length > 0 || croTableRows.length > 0) && (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#7c5cff]" />
                <h3 className="text-[18px] font-semibold text-[#fafafa]">
                  Anteprima Landing Page
                </h3>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[#7c5cff] hover:text-[#00d4aa] transition-colors flex items-center gap-1"
              >
                Apri in una nuova tab
                <AlertCircle className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden" style={{ height: '600px' }}>
              <iframe
                src={url}
                className="w-full h-full"
                title="Landing Page Preview"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
            <p className="text-[11px] text-[#666666] mt-3">
              💡 Alcuni siti potrebbero bloccare l'anteprima per motivi di sicurezza. In quel caso, apri il link in una nuova tab.
            </p>
          </div>
        )}

        {/* Results Section */}
        {(results.length > 0 || croTableRows.length > 0) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#00d4aa]" />
                <h2 className="text-[20px] font-semibold text-[#fafafa]">
                  Analysis Results
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {/* Save Button */}
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#00d4aa] text-white rounded-xl text-[14px] font-medium hover:bg-[#00c499] transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Analysis
                </button>

                {/* Export/Share Buttons */}
                <ExportShareButtons pageUrl={url} contentRef={exportContentRef} />
              </div>
            </div>

            {/* Export Content Wrapper */}
            <div ref={exportContentRef}>

            {/* View Toggle */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-1">
                <button
                  onClick={() => setViewMode("visual")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    viewMode === "visual"
                      ? "bg-[#7c5cff] text-white"
                      : "text-[#888888] hover:text-[#fafafa]"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Visual
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    viewMode === "list"
                      ? "bg-[#7c5cff] text-white"
                      : "text-[#888888] hover:text-[#fafafa]"
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode("cro-table")}
                  disabled={croTableRows.length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all disabled:opacity-40 ${
                    viewMode === "cro-table"
                      ? "bg-[#7c5cff] text-white"
                      : "text-[#888888] hover:text-[#fafafa]"
                  }`}
                >
                  <Table className="w-4 h-4" />
                  CRO Table {croTableRows.length > 0 && `(${croTableRows.length})`}
                </button>
                <button
                  onClick={() => setViewMode("history")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    viewMode === "history"
                      ? "bg-[#7c5cff] text-white"
                      : "text-[#888888] hover:text-[#fafafa]"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  History
                </button>
                <button
                  onClick={() => setViewMode("heatmap")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    viewMode === "heatmap"
                      ? "bg-[#7c5cff] text-white"
                      : "text-[#888888] hover:text-[#fafafa]"
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  Heatmap
                </button>
              </div>
            </div>

            {/* Visual Annotations View */}
            {viewMode === "visual" && (
              <VisualAnnotations
                pageUrl={url}
                annotations={mockAnnotations}
              />
            )}

            {/* History View */}
            {viewMode === "history" && (
              <BeforeAfterTracking
                pageUrl={url}
                history={mockHistory}
              />
            )}

            {/* Heatmap View */}
            {viewMode === "heatmap" && (
              <HeatmapVisualization
                pageUrl={url}
                landingId={undefined}
                width={1200}
                height={800}
              />
            )}

            {/* CRO Table View */}
            {viewMode === "cro-table" && (
              croTableRows.length > 0 ? (
                <CROComparisonTable rows={croTableRows} />
              ) : (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-12 text-center">
                  <Table className="w-16 h-16 text-[#666666] mx-auto mb-4" />
                  <p className="text-[16px] text-[#888888] mb-2">No CRO Decision Table available</p>
                  <p className="text-[14px] text-[#666666]">
                    The CRO table will be generated automatically during analysis
                  </p>
                </div>
              )
            )}

            {/* List View */}
            {viewMode === "list" && results.map((result, index) => {
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
          </div>
        )}
      </div>

      {/* Save Dialog */}
      <SaveItemDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSave}
        type="landing"
        defaultName={url ? (() => {
          try {
            return new URL(url).hostname;
          } catch {
            return url;
          }
        })() : ''}
        defaultUrl={url}
      />
    </div>
  );
}
