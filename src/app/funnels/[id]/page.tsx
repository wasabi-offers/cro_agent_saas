"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import DateRangePicker from "@/components/DateRangePicker";
import ROIEstimator from "@/components/ROIEstimator";
import TrackingSetup from "@/components/TrackingSetup";
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
  FlaskConical,
  Lightbulb,
  Zap,
  Code,
  List,
} from "lucide-react";
import CROComparisonTable from "@/components/CROComparisonTable";
import SaveItemDialog from "@/components/SaveItemDialog";
import FunnelVisualizer from "@/components/FunnelVisualizer";
import FunnelBuilder from "@/components/FunnelBuilder";
import VisualAnnotations from "@/components/VisualAnnotations";
import HeatmapVisualization from "@/components/HeatmapVisualization";
import { CROTableRow, SavedFunnel, funnelStorage } from "@/lib/saved-items";
import { ConversionFunnel, fetchFunnel, updateFunnel } from "@/lib/supabase-funnels";

interface AnalysisResult {
  category: string;
  insights: string[];
  proposals: Array<{
    element: string;
    current: string;
    proposed: string;
    impact: string;
  }>;
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
  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "heatmap" | "abtests" | "setup">("overview");
  const [showEditBuilder, setShowEditBuilder] = useState(false);

  // Analysis state
  const [analysisMode, setAnalysisMode] = useState<"funnel" | "page">("funnel");
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [analysisError, setAnalysisError] = useState("");
  const [croTableRows, setCroTableRows] = useState<CROTableRow[]>([]);
  const [isGeneratingCROTable, setIsGeneratingCROTable] = useState(false);
  const [croTableError, setCroTableError] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "list">("list");

  // Heatmap state
  const [selectedHeatmapPage, setSelectedHeatmapPage] = useState<number>(0);
  const [heatmapType, setHeatmapType] = useState<"click" | "scroll" | "move">("click");

  // A/B Test state
  const [selectedABPage, setSelectedABPage] = useState<number>(0);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [abTestSuggestions, setAbTestSuggestions] = useState<any[]>([]);
  const [abTestError, setAbTestError] = useState("");
  const [savedProposals, setSavedProposals] = useState<any[]>([]);
  const [proposalFilter, setProposalFilter] = useState<"all" | "pending" | "active" | "completed" | "rejected">("all");
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);

  // Date range state
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };
  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  useEffect(() => {
    const loadData = async (showLoader = true) => {
      if (showLoader) setIsLoading(true);
      const funnelData = await fetchFunnel(funnelId);

      // Fetch LIVE stats from tracking with date filters
      if (funnelData) {
        try {
          const params = new URLSearchParams({
            funnelId,
            startDate: dateRange.start,
            endDate: dateRange.end,
            _t: Date.now().toString() // Prevent caching
          });

          const liveStatsResponse = await fetch(
            `/api/funnel-stats/live?${params.toString()}`,
            {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            }
          );
          if (liveStatsResponse.ok) {
            const liveData = await liveStatsResponse.json();
            if (liveData.success && liveData.liveStats) {
              // Create a NEW object to force React to detect the change
              funnelData = {
                ...funnelData,
                conversionRate: liveData.conversionRate,
                steps: funnelData.steps.map((step: any) => {
                  const liveStat = liveData.liveStats.find((ls: any) => ls.stepName === step.name);
                  if (liveStat) {
                    return {
                      ...step,
                      visitors: liveStat.visitors,
                      dropoff: liveStat.dropoff
                    };
                  }
                  return step;
                })
              };
            }
          }
        } catch (liveError) {
          console.warn('⚠️ Could not fetch live stats:', liveError);
        }
      }

      setFunnel(funnelData);
      if (showLoader) setIsLoading(false);
    };

    loadData();

    // Auto-refresh every 3 seconds for real-time data
    const interval = setInterval(() => {
      loadData(false); // Silent refresh without loader
    }, 3000);

    return () => clearInterval(interval);
  }, [funnelId, dateRange]);

  // Load saved A/B test proposals from database
  const loadSavedProposals = async () => {
    setIsLoadingProposals(true);
    try {
      const response = await fetch(`/api/ab-proposals?funnelId=${funnelId}`);
      if (response.ok) {
        const data = await response.json();
        setSavedProposals(data.proposals || []);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  // Update proposal status
  const updateProposalStatus = async (proposalId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/ab-proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        // Reload proposals
        loadSavedProposals();
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
    }
  };

  // Load proposals when switching to A/B Tests tab
  useEffect(() => {
    if (activeTab === 'abtests') {
      loadSavedProposals();
    }
  }, [activeTab, funnelId]);

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
    setCroTableRows([]);

    try {
      // Get real URL from funnel step
      let url: string;

      if (analysisMode === "page") {
        // Analyze specific page
        const step = funnel.steps[selectedPage];
        if (!step.url) {
          setAnalysisError(`❌ No URL configured for "${step.name}". Please edit the funnel and add a URL for this step.`);
          setIsAnalyzing(false);
          return;
        }
        url = step.url;
      } else {
        // Analyze entire funnel - use first step URL
        const firstStep = funnel.steps[0];
        if (!firstStep.url) {
          setAnalysisError(`❌ No URL configured for the first step "${firstStep.name}". Please edit the funnel and add URLs for each step.`);
          setIsAnalyzing(false);
          return;
        }
        url = firstStep.url;
      }

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
            type: analysisMode === "funnel" ? 'funnel' : 'landing',
          }),
        }),
      ]);

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || "Analysis failed");
      }

      const analysisData = await analysisResponse.json();
      setAnalysisResults(analysisData.results);

      // CRO table is optional - don't fail if it errors
      if (croTableResponse.ok) {
        const croTableData = await croTableResponse.json();
        setCroTableRows(croTableData.rows);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || "An error occurred during analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCROTable = async () => {
    if (!funnel) return;

    setIsGeneratingCROTable(true);
    setCroTableError("");

    try {
      // Get URL based on analysis mode
      let url: string;

      if (analysisMode === "page") {
        const step = funnel.steps[selectedPage];
        if (!step.url) {
          setCroTableError(`❌ No URL configured for "${step.name}". Please edit the funnel and add a URL for this step.`);
          setIsGeneratingCROTable(false);
          return;
        }
        url = step.url;
      } else {
        const firstStep = funnel.steps[0];
        if (!firstStep.url) {
          setCroTableError(`❌ No URL configured for the first step "${firstStep.name}". Please edit the funnel and add URLs for each step.`);
          setIsGeneratingCROTable(false);
          return;
        }
        url = firstStep.url;
      }

      const response = await fetch("/api/generate-cro-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          type: analysisMode === "funnel" ? 'funnel' : 'landing',
          funnelData: {
            id: funnel.id,
            name: funnel.name,
            steps: funnel.steps.map(step => ({
              name: step.name,
              url: step.url,
              visitors: step.visitors,
              dropoff: step.dropoff,
            })),
            conversionRate: funnel.conversionRate,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate CRO table");
      }

      const data = await response.json();
      if (data.success) {
        setCroTableRows(data.rows);
        console.log("✅ CRO Table generated with real funnel data");
      } else {
        throw new Error(data.error || "Failed to generate CRO table");
      }
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred generating the CRO table";
      console.error("❌ CRO Table generation error:", errorMsg);
      setCroTableError(errorMsg);
    } finally {
      setIsGeneratingCROTable(false);
    }
  };

  const handleGenerateABTests = async () => {
    if (!funnel) return;

    setIsGeneratingTests(true);
    setAbTestError("");
    setAbTestSuggestions([]);

    try {
      const step = funnel.steps[selectedABPage];

      // Check if URL exists
      if (!step.url) {
        setAbTestError(`❌ No URL configured for "${step.name}". Please edit the funnel and add a URL for this step.`);
        setIsGeneratingTests(false);
        return;
      }

      // Check if analysis has been run
      if (!analysisResults || analysisResults.length === 0) {
        setAbTestError(`❌ Please run the CRO Analysis first. A/B tests are generated based on analysis insights.`);
        setIsGeneratingTests(false);
        return;
      }

      // Call AI to generate real A/B test suggestions based on analysis
      const response = await fetch('/api/generate-ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: step.url,
          pageName: step.name,
          dropoff: step.dropoff,
          funnelName: funnel.name,
          stepIndex: selectedABPage,
          totalSteps: funnel.steps.length,
          analysisInsights: analysisResults, // Pass analysis results for correlation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to generate A/B tests');
      }

      const data = await response.json();
      setAbTestSuggestions(data.tests);

      // Save proposals to database automatically
      if (data.tests && data.tests.length > 0) {
        try {
          const saveResponse = await fetch('/api/ab-proposals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              funnelId: funnelId,
              proposals: data.tests.map((test: any) => ({
                category: test.category || 'optimization',
                element: test.element,
                current_value: test.current,
                proposed_value: test.proposed,
                expected_impact: test.impact,
                reasoning: test.reasoning,
              })),
            }),
          });

          if (saveResponse.ok) {
            console.log('✅ Proposals saved to database');
            // Reload proposals list
            loadSavedProposals();
          } else {
            console.warn('⚠️ Failed to save proposals to database');
          }
        } catch (saveError) {
          console.error('Error saving proposals:', saveError);
          // Don't show error to user - proposals are still visible in UI
        }
      }
    } catch (err: any) {
      console.error('A/B test generation error:', err);
      setAbTestError(err.message || "An error occurred while generating tests. Please try again.");
    } finally {
      setIsGeneratingTests(false);
    }
  };

  // Old mock data removed - now using real AI generation via /api/generate-ab-tests

  const handleEditFunnel = async (updatedFunnel: { name: string; steps: any[]; connections?: any[] }) => {
    console.warn('💾💾💾 HANDLE EDIT FUNNEL - Received from builder:', updatedFunnel);
    console.warn('💾💾💾 HANDLE EDIT FUNNEL - Connections:', updatedFunnel.connections);
    console.warn('💾💾💾 HANDLE EDIT FUNNEL - Number of connections:', updatedFunnel.connections?.length || 0);

    const success = await updateFunnel(funnelId, updatedFunnel);

    if (success) {
      console.warn('💾💾💾 HANDLE EDIT FUNNEL - Update successful! Reloading from database...');
      // Reload funnel data from database
      const funnelData = await fetchFunnel(funnelId);
      console.warn('💾💾💾 HANDLE EDIT FUNNEL - Reloaded data:', funnelData);
      console.warn('💾💾💾 HANDLE EDIT FUNNEL - Reloaded connections:', funnelData?.connections);
      setFunnel(funnelData);
      setShowEditBuilder(false);
      alert('✅ Funnel modificato con successo!');
    } else {
      console.warn('💾💾💾 HANDLE EDIT FUNNEL - Update failed, using local data');
      // If Supabase not configured, update locally
      const updatedConversionFunnel: ConversionFunnel = {
        id: funnelId,
        name: updatedFunnel.name,
        steps: updatedFunnel.steps,
        connections: updatedFunnel.connections,
        conversionRate: updatedFunnel.steps[0].visitors > 0
          ? (updatedFunnel.steps[updatedFunnel.steps.length - 1].visitors / updatedFunnel.steps[0].visitors) * 100
          : 0,
      };
      setFunnel(updatedConversionFunnel);
      setShowEditBuilder(false);
    }
  };

  const handleSave = (data: { name: string; categoryId: string; url?: string }) => {
    if (!funnel) return;

    const savedFunnel: SavedFunnel = {
      id: `funnel_${Date.now()}`,
      name: data.name,
      categoryId: data.categoryId,
      url: data.url,
      steps: funnel.steps.map(step => ({
        name: step.name,
        url: `https://example.com/${step.name.toLowerCase().replace(/\s+/g, '-')}`,
        visitors: step.visitors,
        dropoff: step.dropoff,
      })),
      analysis: croTableRows.length > 0 ? {
        generatedAt: new Date().toISOString(),
        comparisonTable: croTableRows,
        summary: `Analysis of ${data.name}`,
        expectedImpact: {
          totalLift: '+18-30%',
          confidence: 82,
        },
      } : undefined,
      savedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    funnelStorage.save(savedFunnel);
    alert('Funnel saved successfully!');
    setShowSaveDialog(false);
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
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <div className="h-10 w-px bg-[#2a2a2a]" />
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
            <div className="h-10 w-px bg-[#2a2a2a]" />
            <button
              onClick={() => setShowEditBuilder(true)}
              className="px-4 py-2.5 bg-[#7c5cff] text-white rounded-xl text-[14px] font-medium hover:bg-[#6b4ee6] transition-all flex items-center gap-2"
            >
              <FileSearch className="w-4 h-4" />
              Modifica Funnel
            </button>
          </div>
        </div>

        {/* Edit Builder */}
        {showEditBuilder && (
          <div className="mb-8">
            <FunnelBuilder
              initialFunnel={{ name: funnel.name, steps: funnel.steps, connections: funnel.connections }}
              onSave={handleEditFunnel}
              onCancel={() => setShowEditBuilder(false)}
            />
          </div>
        )}

        {/* Funnel Visualizer */}
        {!showEditBuilder && (
          <div className="mb-8">
            <FunnelVisualizer steps={funnel.steps} name={funnel.name} connections={funnel.connections} />
          </div>
        )}

        {/* Tabs */}
        {!showEditBuilder && (
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
          <button
            onClick={() => setActiveTab("abtests")}
            className={`px-6 py-3 text-[14px] font-medium transition-all relative flex items-center gap-2 ${
              activeTab === "abtests"
                ? "text-[#fafafa]"
                : "text-[#666666] hover:text-[#888888]"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            A/B Tests
            {activeTab === "abtests" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("setup")}
            className={`px-6 py-3 text-[14px] font-medium transition-all relative flex items-center gap-2 ${
              activeTab === "setup"
                ? "text-[#fafafa]"
                : "text-[#666666] hover:text-[#888888]"
            }`}
          >
            <Code className="w-4 h-4" />
            Setup
            {activeTab === "setup" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa]" />
            )}
          </button>
        </div>
        )}

        {/* Tab Content */}
        {!showEditBuilder && (
        <>
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
                        {/* Background bar (always full width) */}
                        <div className="relative h-20 rounded-xl border border-[#2a2a2a] bg-[#111111] overflow-hidden">
                          {/* Progress bar showing relative volume */}
                          <div
                            className={`absolute inset-0 transition-all ${
                              isLast
                                ? 'bg-gradient-to-r from-[#00d4aa]/30 to-[#00d4aa]/10'
                                : 'bg-gradient-to-r from-[#7c5cff]/30 to-[#7c5cff]/10'
                            }`}
                            style={{ width: `${Math.max(widthPercentage, 8)}%` }}
                          />

                          {/* Content layer */}
                          <div className="relative z-10 h-full flex items-center px-6">
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

              {/* Analyze Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                <button
                  onClick={handleGenerateCROTable}
                  disabled={isGeneratingCROTable}
                  className="bg-[#0a0a0a] border-2 border-[#7c5cff] text-[#7c5cff] px-6 py-4 rounded-xl font-medium text-[15px] hover:bg-[#7c5cff]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingCROTable ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Generate CRO Decision Table
                    </>
                  )}
                </button>
              </div>

              {/* CRO Table Error */}
              {croTableError && (
                <div className="mt-4 flex items-center gap-2 text-[#ff6b6b] text-[14px] bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4" />
                  {croTableError}
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {analysisResults.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
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

                  {/* View Mode Toggle */}
                  <div className="flex gap-3">
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
                  </div>
                </div>

                {/* Visual View */}
                {viewMode === "visual" && (
                  <VisualAnnotations
                    pageUrl={
                      analysisMode === "page"
                        ? funnel.steps[selectedPage].url || ""
                        : funnel.steps[0].url || ""
                    }
                    annotations={[]}
                  />
                )}

                {/* List View */}
                {viewMode === "list" && analysisResults.map((result, index) => {
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

                      {/* Insights */}
                      <div className="space-y-3 mb-6">
                        <h4 className="text-[14px] font-semibold text-[#fafafa] mb-3">📊 Analysis</h4>
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

                      {/* Proposals */}
                      {result.proposals && result.proposals.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[14px] font-semibold text-[#00d4aa] mb-3">💡 Concrete Proposals</h4>
                          {result.proposals.map((proposal: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-[#111111] border border-[#00d4aa]/20 rounded-xl p-5"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h5 className="text-[15px] font-semibold text-[#fafafa]">{proposal.element}</h5>
                                <span className="text-[12px] font-bold text-[#00d4aa] bg-[#00d4aa]/10 px-3 py-1 rounded-full">
                                  {proposal.impact}
                                </span>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <p className="text-[12px] text-[#888888] mb-1">Current:</p>
                                  <p className="text-[14px] text-[#fafafa] bg-[#0a0a0a] p-3 rounded-lg">{proposal.current}</p>
                                </div>

                                <div>
                                  <p className="text-[12px] text-[#888888] mb-1">Proposed:</p>
                                  <div className="text-[14px] text-[#00d4aa] bg-[#0a0a0a] p-3 rounded-lg whitespace-pre-line">
                                    {proposal.proposed}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* CRO Comparison Table */}
                {croTableRows.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[20px] font-semibold text-[#fafafa]">
                        CRO Decision Table
                      </h3>
                      <button
                        onClick={() => setShowSaveDialog(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#00d4aa] text-white rounded-xl text-[14px] font-medium hover:bg-[#00c499] transition-all"
                      >
                        <Zap className="w-4 h-4" />
                        Save Funnel Analysis
                      </button>
                    </div>
                    <CROComparisonTable rows={croTableRows} />
                  </div>
                )}
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
            <HeatmapVisualization
              pageUrl={funnel.steps[selectedHeatmapPage].url || ''}
              funnelId={funnelId}
              stepName={funnel.steps[selectedHeatmapPage].name}
              heatmapType={heatmapType === 'move' ? 'movement' : heatmapType as 'click' | 'scroll' | 'movement'}
            />
          </div>
        )}

        {activeTab === "abtests" && (
          <div className="space-y-6">
            {/* Saved A/B Test Proposals */}
            {savedProposals.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-xl flex items-center justify-center">
                      <List className="w-5 h-5 text-[#00d4aa]" />
                    </div>
                    <div>
                      <h2 className="text-[20px] font-semibold text-[#fafafa]">
                        A/B Test Proposals
                      </h2>
                      <p className="text-[14px] text-[#888888] mt-1">
                        {savedProposals.length} proposal{savedProposals.length > 1 ? 's' : ''} tracked
                      </p>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-2">
                    {['all', 'pending', 'active', 'completed', 'rejected'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setProposalFilter(filter as any)}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                          proposalFilter === filter
                            ? 'bg-[#7c5cff] text-white'
                            : 'bg-[#111111] text-[#666666] hover:text-[#888888]'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Proposals List */}
                <div className="space-y-4">
                  {savedProposals
                    .filter((p) => proposalFilter === 'all' || p.status === proposalFilter)
                    .map((proposal) => {
                      const statusColors = {
                        pending: { bg: 'bg-[#f59e0b]/10', border: 'border-[#f59e0b]/30', text: 'text-[#f59e0b]' },
                        active: { bg: 'bg-[#00d4aa]/10', border: 'border-[#00d4aa]/30', text: 'text-[#00d4aa]' },
                        completed: { bg: 'bg-[#7c5cff]/10', border: 'border-[#7c5cff]/30', text: 'text-[#7c5cff]' },
                        rejected: { bg: 'bg-[#666666]/10', border: 'border-[#666666]/30', text: 'text-[#666666]' },
                      };
                      const colors = statusColors[proposal.status as keyof typeof statusColors];

                      return (
                        <div
                          key={proposal.id}
                          className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#7c5cff]/30 transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-[16px] font-semibold text-[#fafafa]">
                                  {proposal.element}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${colors.bg} ${colors.border} ${colors.text} border`}>
                                  {proposal.category}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${colors.bg} ${colors.border} ${colors.text} border`}>
                                  {proposal.status}
                                </span>
                              </div>
                              <p className="text-[13px] text-[#888888] mb-3">
                                {proposal.reasoning}
                              </p>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[11px] text-[#666666] mb-1">Current</p>
                                  <p className="text-[14px] text-[#fafafa] font-mono bg-[#0a0a0a] px-3 py-2 rounded">
                                    {proposal.current_value}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] text-[#666666] mb-1">Proposed</p>
                                  <p className="text-[14px] text-[#00d4aa] font-mono bg-[#0a0a0a] px-3 py-2 rounded">
                                    {proposal.proposed_value}
                                  </p>
                                </div>
                              </div>
                              {proposal.expected_impact && (
                                <div className="mt-3 flex items-center gap-2 text-[13px] text-[#00d4aa]">
                                  <TrendingUp className="w-4 h-4" />
                                  Expected: {proposal.expected_impact}
                                </div>
                              )}
                            </div>

                            {/* Status Actions */}
                            <div className="ml-4 flex flex-col gap-2">
                              {proposal.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateProposalStatus(proposal.id, 'active')}
                                    className="px-4 py-2 bg-[#00d4aa]/10 border border-[#00d4aa]/30 text-[#00d4aa] rounded-lg text-[13px] font-medium hover:bg-[#00d4aa]/20 transition-all"
                                  >
                                    Start Test
                                  </button>
                                  <button
                                    onClick={() => updateProposalStatus(proposal.id, 'rejected')}
                                    className="px-4 py-2 bg-[#666666]/10 border border-[#666666]/30 text-[#666666] rounded-lg text-[13px] font-medium hover:bg-[#666666]/20 transition-all"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {proposal.status === 'active' && (
                                <button
                                  onClick={() => updateProposalStatus(proposal.id, 'completed')}
                                  className="px-4 py-2 bg-[#7c5cff]/10 border border-[#7c5cff]/30 text-[#7c5cff] rounded-lg text-[13px] font-medium hover:bg-[#7c5cff]/20 transition-all"
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {savedProposals.filter((p) => proposalFilter === 'all' || p.status === proposalFilter).length === 0 && (
                  <div className="text-center py-8 text-[#666666]">
                    <p>No {proposalFilter !== 'all' ? proposalFilter : ''} proposals yet</p>
                  </div>
                )}
              </div>
            )}

            {/* A/B Test Generator */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold text-[#fafafa]">
                    AI-Powered A/B Test Suggestions
                  </h2>
                  <p className="text-[14px] text-[#888888] mt-1">
                    Expert CRO analysis with data-driven recommendations
                  </p>
                </div>
              </div>

              {/* Page Selector */}
              <div className="mb-6">
                <label className="block text-[14px] text-[#888888] mb-3">
                  Select Funnel Step to Optimize
                </label>
                <select
                  value={selectedABPage}
                  onChange={(e) => setSelectedABPage(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[15px] focus:outline-none focus:border-[#7c5cff] transition-all"
                >
                  {funnel.steps.map((step, idx) => (
                    <option key={idx} value={idx}>
                      Step {idx + 1}: {step.name} (Dropoff: {step.dropoff}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Banner */}
              <div className="mb-6 bg-gradient-to-r from-[#7c5cff]/10 to-[#00d4aa]/10 border border-[#7c5cff]/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-[#7c5cff] flex-shrink-0 mt-0.5" />
                  <div className="text-[13px] text-[#888888]">
                    <p className="font-medium text-[#fafafa] mb-1">Expert CRO AI Analysis</p>
                    <p>Our AI analyzes conversion data, heatmaps, user behavior, and applies proven CRO techniques including: Cialdini's persuasion principles, behavioral psychology, F-pattern eye tracking, Fitts's Law, color psychology, and tested copywriting frameworks (AIDA, PAS, FAB).</p>
                  </div>
                </div>
              </div>

              {/* ROI Estimator */}
              <div className="mb-6">
                <ROIEstimator />
              </div>

              {/* Error Message */}
              {abTestError && (
                <div className="mb-6 flex items-center gap-2 text-[#ff6b6b] text-[14px] bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4" />
                  {abTestError}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerateABTests}
                disabled={isGeneratingTests}
                className="w-full bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white px-6 py-4 rounded-xl font-medium text-[15px] hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGeneratingTests ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing & Generating Tests...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate AI Test Suggestions
                  </>
                )}
              </button>
            </div>

            {/* Test Suggestions */}
            {abTestSuggestions.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#00d4aa]" />
                  <h2 className="text-[20px] font-semibold text-[#fafafa]">
                    Recommended Tests for: {funnel.steps[selectedABPage].name}
                  </h2>
                </div>

                {abTestSuggestions.map((test) => {
                  const priorityColors = {
                    high: { bg: "bg-[#ff6b6b]/10", border: "border-[#ff6b6b]/30", text: "text-[#ff6b6b]" },
                    medium: { bg: "bg-[#f59e0b]/10", border: "border-[#f59e0b]/30", text: "text-[#f59e0b]" },
                    low: { bg: "bg-[#7c5cff]/10", border: "border-[#7c5cff]/30", text: "text-[#7c5cff]" }
                  };
                  const colors = priorityColors[test.priority as keyof typeof priorityColors];

                  return (
                    <div
                      key={test.id}
                      className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 hover:border-[#7c5cff]/30 transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`px-3 py-1 rounded-full border ${colors.bg} ${colors.border}`}>
                              <span className={`text-[12px] font-bold uppercase ${colors.text}`}>
                                {test.priority} priority
                              </span>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/20">
                              <span className="text-[12px] font-bold text-[#00d4aa]">
                                {test.confidence}% confidence
                              </span>
                            </div>
                          </div>
                          <h3 className="text-[20px] font-semibold text-[#fafafa] mb-2">
                            Test #{test.id}: {test.element}
                          </h3>
                          <p className="text-[15px] text-[#888888] leading-relaxed">
                            {test.hypothesis}
                          </p>
                        </div>
                        <div className="text-right ml-6">
                          <p className="text-[12px] text-[#888888] mb-1">Expected Impact</p>
                          <p className="text-[20px] font-bold text-[#00d4aa]">{test.expectedImpact}</p>
                        </div>
                      </div>

                      {/* Variants Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
                          <p className="text-[12px] text-[#888888] mb-2 uppercase font-bold">Control (Current)</p>
                          <p className="text-[14px] text-[#fafafa]">{test.variant.current}</p>
                        </div>
                        <div className="bg-[#111111] border border-[#00d4aa]/30 rounded-xl p-4">
                          <p className="text-[12px] text-[#00d4aa] mb-2 uppercase font-bold">Variant (Proposed)</p>
                          <p className="text-[14px] text-[#fafafa]">{test.variant.proposed}</p>
                        </div>
                      </div>

                      {/* Screenshot Preview */}
                      {test.screenSelector && funnel.steps[selectedABPage]?.url && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[14px] font-semibold text-[#fafafa]">📸 Element Screenshot</h4>
                            <p className="text-[12px] text-[#888888]">{test.screenDescription || 'Target element'}</p>
                          </div>
                          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
                            <div className="relative">
                              <img
                                src={`/api/screenshot?url=${encodeURIComponent(funnel.steps[selectedABPage].url)}&selector=${encodeURIComponent(test.screenSelector)}`}
                                alt={`Screenshot of ${test.element}`}
                                className="w-full h-auto"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement?.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="p-8 text-center bg-gradient-to-br from-[#0a0a0a] to-[#111111]">
                                        <div class="text-[40px] mb-3">🖼️</div>
                                        <p class="text-[14px] text-[#888888] mb-4">Could not capture screenshot</p>
                                        <a href="${funnel.steps[selectedABPage].url}" target="_blank" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white rounded-xl text-[14px] font-medium hover:shadow-lg transition-all">
                                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                          View on Page
                                        </a>
                                        <p class="text-[12px] text-[#666666] mt-3">Element: <code class="text-[#7c5cff]">${test.screenSelector}</code></p>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            </div>
                            <div className="p-3 bg-[#0a0a0a] border-t border-[#2a2a2a] text-[12px] text-[#888888]">
                              <span className="text-[#00d4aa]">●</span> Target: <code className="text-[#7c5cff]">{test.screenSelector}</code>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Detailed Reasoning */}
                      <div className="bg-[#111111] rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Lightbulb className="w-5 h-5 text-[#7c5cff]" />
                          <h4 className="text-[16px] font-semibold text-[#fafafa]">Expert Analysis & Reasoning</h4>
                        </div>
                        <div className="text-[14px] text-[#888888] leading-relaxed whitespace-pre-line">
                          {test.reasoning}
                        </div>
                      </div>

                      {/* Test Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#111111] rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-[#7c5cff]" />
                            <span className="text-[12px] text-[#888888]">Key Metrics</span>
                          </div>
                          <div className="space-y-1">
                            {test.metrics.map((metric: string, idx: number) => (
                              <p key={idx} className="text-[13px] text-[#fafafa]">• {metric}</p>
                            ))}
                          </div>
                        </div>
                        <div className="bg-[#111111] rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-[#00d4aa]" />
                            <span className="text-[12px] text-[#888888]">Test Duration</span>
                          </div>
                          <p className="text-[14px] text-[#fafafa] font-medium">{test.testDuration}</p>
                        </div>
                        <div className="bg-[#111111] rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-[#f59e0b]" />
                            <span className="text-[12px] text-[#888888]">Implementation</span>
                          </div>
                          <button className="text-[14px] text-[#7c5cff] hover:text-[#00d4aa] font-medium transition-colors">
                            Create Test →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Setup Tab */}
        {activeTab === "setup" && funnel && (
          <TrackingSetup
            funnelId={funnel.id}
            funnelName={funnel.name}
            steps={funnel.steps.map((step, index) => ({
              name: step.name,
              page: index === 0 ? '/' : `/${step.name.toLowerCase().replace(/\s+/g, '-')}`,
              url: step.url // Pass the saved URL if it exists
            }))}
          />
        )}
        </>
        )}
      </div>

      {/* Save Dialog */}
      {funnel && (
        <SaveItemDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={handleSave}
          type="funnel"
          defaultName={funnel.name}
          defaultUrl={`https://example.com/${funnel.name.toLowerCase().replace(/\s+/g, '-')}`}
        />
      )}
    </div>
  );
}
