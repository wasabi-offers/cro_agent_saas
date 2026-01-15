"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import DateRangePicker from "@/components/DateRangePicker";
import DeviceFilter from "@/components/DeviceFilter";
import StatisticalCalculator from "@/components/StatisticalCalculator";
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
} from "lucide-react";
import { ConversionFunnel } from "@/lib/mock-data";
import CROComparisonTable from "@/components/CROComparisonTable";
import SaveItemDialog from "@/components/SaveItemDialog";
import FunnelVisualizer from "@/components/FunnelVisualizer";
import FunnelBuilder from "@/components/FunnelBuilder";
import { CROTableRow, SavedFunnel, funnelStorage } from "@/lib/saved-items";
import { fetchFunnel, updateFunnel } from "@/lib/supabase-funnels";

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
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Heatmap state
  const [selectedHeatmapPage, setSelectedHeatmapPage] = useState<number>(0);
  const [heatmapType, setHeatmapType] = useState<"click" | "scroll" | "move">("click");

  // A/B Test state
  const [selectedABPage, setSelectedABPage] = useState<number>(0);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [abTestSuggestions, setAbTestSuggestions] = useState<any[]>([]);
  const [abTestError, setAbTestError] = useState("");

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
  const [deviceFilter, setDeviceFilter] = useState<"all" | "desktop" | "mobile">("all");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const funnelData = await fetchFunnel(funnelId);
      setFunnel(funnelData);
      setIsLoading(false);
    };

    loadData();
  }, [funnelId, dateRange, deviceFilter]);

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
      // Mock URL - in production this would be real page URLs
      const url = analysisMode === "funnel"
        ? `https://example.com/${funnel.name.toLowerCase().replace(/\s+/g, '-')}`
        : `https://example.com${funnel.steps[selectedPage].name.toLowerCase().replace(/\s+/g, '-')}`;

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

      if (!analysisResponse.ok) throw new Error("Analysis error");

      const analysisData = await analysisResponse.json();
      setAnalysisResults(analysisData.results);

      // CRO table is optional - don't fail if it errors
      if (croTableResponse.ok) {
        const croTableData = await croTableResponse.json();
        setCroTableRows(croTableData.rows);
      }
    } catch (err) {
      setAnalysisError("An error occurred during analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateABTests = async () => {
    if (!funnel) return;

    setIsGeneratingTests(true);
    setAbTestError("");
    setAbTestSuggestions([]);

    try {
      // In production, this would call Claude API for AI-powered test generation
      // For now, using mock data with detailed, expert-level suggestions
      const mockSuggestions = [
        {
          id: 1,
          priority: "high",
          element: "CTA Button",
          hypothesis: "Changing the CTA button from generic 'Submit' to action-oriented 'Start Free Trial' will increase conversions by 18-22%",
          variant: {
            current: "Blue button with text 'Submit'",
            proposed: "Green button (#00d4aa) with text 'Start Free Trial' and arrow icon →"
          },
          expectedImpact: "+20% conversion rate",
          reasoning: `Based on comprehensive CRO analysis:

**Data Analysis:**
- Current dropoff at this step: ${funnel.steps[selectedABPage].dropoff}%
- Heatmap shows 45% of users hover over button but don't click
- Average hesitation time: 8.2 seconds (industry benchmark: 3-4s)

**CRO Principles Applied:**
1. **Action-Oriented Copy**: Using verb-first language creates urgency and clarity. Studies show action verbs increase conversions by 15-25% (Source: Nielsen Norman Group)
2. **Color Psychology**: Green signals "go" and "safe to proceed" - tests by HubSpot showed green CTAs convert 21% better than red
3. **Visual Hierarchy**: Adding arrow creates directional cue, leveraging the Von Restorff effect
4. **Social Proof Integration**: The word "Start" implies others have already begun, tapping into FOMO

**Technical Justification:**
- F-pattern eye tracking studies show users spend 80% of time in the upper left, making button placement critical
- According to Fitts's Law, larger buttons (recommend 44x44px minimum) reduce cognitive load
- ContrastRatio: Current 3.2:1 vs Proposed 4.8:1 (WCAG AAA compliant)`,
          confidence: 85,
          testDuration: "14 days minimum for statistical significance (95% confidence, 80% power)",
          metrics: ["Click-through rate", "Conversion rate", "Time to decision"]
        },
        {
          id: 2,
          priority: "high",
          element: "Form Fields",
          hypothesis: "Reducing form fields from 8 to 4 (using progressive disclosure) will reduce abandonment by 35%",
          variant: {
            current: "Single page with 8 required fields",
            proposed: "Multi-step form: Step 1 (Name, Email) → Step 2 (Company, Role) with progress indicator"
          },
          expectedImpact: "+35% form completion rate",
          reasoning: `**Friction Analysis:**
- Current form abandonment: 60% (industry average: 67%)
- Field-level analytics show 80% abandon at field 5
- Mobile users show 2.3x higher abandonment

**Psychology & Best Practices:**
1. **Zeigarnik Effect**: People have better memory for incomplete tasks. Multi-step forms leverage this by creating commitment
2. **Progressive Disclosure**: Show only what's needed now reduces cognitive load by 58% (UX study by Baymard Institute)
3. **Goal Gradient Effect**: Progress bars increase completion by 28% as users get closer to goal
4. **Choice Paralysis**: Each additional field reduces completion by 11% (study of 40,000 forms)

**Supporting Data:**
- Expedia removed 1 field and increased profit by $12M annually
- ImageShack reduced fields from 4 to 3, increased signups by 50%
- Marketo's study: For every field removed, conversion increases by 10-20%

**Implementation Strategy:**
- Step 1: Core info only (Name, Email) - "You're 50% done!"
- Step 2: Contextual info (Company, Role) - "Almost there! Final step"
- Use inline validation to prevent errors before submission
- Auto-save progress (reduces anxiety about losing data)`,
          confidence: 92,
          testDuration: "21 days (accounts for weekly traffic patterns)",
          metrics: ["Form abandonment rate", "Field completion rate", "Time per field", "Error rate"]
        },
        {
          id: 3,
          priority: "medium",
          element: "Social Proof Section",
          hypothesis: "Adding real-time social proof notification ('Sarah from London just signed up') above fold will increase trust and conversions by 15%",
          variant: {
            current: "Static testimonial section at bottom of page",
            proposed: "Dynamic notification popup (non-intrusive, bottom-left) showing recent signups with location + small avatar"
          },
          expectedImpact: "+15% conversion rate",
          reasoning: `**Behavioral Economics:**
1. **Herding Effect**: People follow the crowd. Seeing others take action reduces perceived risk
2. **FOMO (Fear of Missing Out)**: Real-time activity creates urgency - "If they're doing it, I should too"
3. **Social Validation**: Cialdini's 6 principles of persuasion - Social Proof is #1 converter

**Case Studies:**
- Booking.com uses "23 people looking at this hotel" - increased bookings by 28%
- TrustPulse study: Real-time notifications increased conversions by 15% on average
- Basecamp added social proof, saw 102.5% increase in conversions

**Technical Specifications:**
- Trigger: Show notification every 8-12 seconds (randomized to appear organic)
- Duration: 4 seconds visible, 1 second fade out
- Content: "[Name] from [City] just [action]" + timestamp "2 minutes ago"
- Design: Subtle shadow, rounded corners, brand colors, small dismiss X
- Mobile: Bottom position with haptic feedback

**A/B Test Variables:**
- Control: No notifications
- Variant A: Real data from last 24h signups
- Variant B: Real data + "Join 2,847 users" counter`,
          confidence: 78,
          testDuration: "14 days",
          metrics: ["Conversion rate", "Time on page", "Scroll depth", "Exit rate"]
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAbTestSuggestions(mockSuggestions);
    } catch (err) {
      setAbTestError("Failed to generate test suggestions. Please try again.");
    } finally {
      setIsGeneratingTests(false);
    }
  };

  const handleEditFunnel = async (updatedFunnel: { name: string; steps: any[]; connections?: any[] }) => {
    const success = await updateFunnel(funnelId, updatedFunnel);

    if (success) {
      // Reload funnel data from database
      const funnelData = await fetchFunnel(funnelId);
      setFunnel(funnelData);
      setShowEditBuilder(false);
      alert('✅ Funnel modificato con successo!');
    } else {
      // If Supabase not configured, update locally
      const updatedConversionFunnel: ConversionFunnel = {
        id: funnelId,
        name: updatedFunnel.name,
        steps: updatedFunnel.steps,
        connections: updatedFunnel.connections,
        conversionRate: (updatedFunnel.steps[updatedFunnel.steps.length - 1].visitors / updatedFunnel.steps[0].visitors) * 100,
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
            <DeviceFilter value={deviceFilter} onChange={setDeviceFilter} />
            <div className="h-10 w-px bg-[#2a2a2a]" />
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

        {activeTab === "abtests" && (
          <div className="space-y-6">
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

              {/* Statistical Tools */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatisticalCalculator />
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
              page: index === 0 ? '/' : `/${step.name.toLowerCase().replace(/\s+/g, '-')}`
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
