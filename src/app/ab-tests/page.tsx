"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import {
  FlaskConical,
  TrendingUp,
  MousePointerClick,
  Zap,
  Target,
  Sparkles,
  RefreshCw,
  Brain,
  AlertCircle,
  Smartphone,
  Monitor,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { CRODashboardData } from "@/lib/supabase-data";

interface ABTestSuggestion {
  id: string;
  name: string;
  hypothesis: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  expectedImpact: string;
  targetDevice: string;
  basedOn: string;
  category: string;
}

export default function ABTestsPage() {
  const [dashboardData, setDashboardData] = useState<CRODashboardData | null>(null);
  const [suggestions, setSuggestions] = useState<ABTestSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<ABTestSuggestion | null>(null);

  // Filtri
  const [selectedFunnel, setSelectedFunnel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"priority" | "date">("priority");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/cro-analysis');
        const result = await response.json();
        
        if (result.success) {
          setDashboardData(result.data);
          // Generate initial suggestions based on real data
          generateSuggestions(result.data);
        } else {
          setError(result.error || 'Failed to load data');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const generateSuggestions = (data: CRODashboardData) => {
    const newSuggestions: ABTestSuggestion[] = [];
    const { summary, uxIssues, trafficByDevice } = data;

    // Mobile dead clicks
    const mobileDeadClicks = uxIssues.filter(i => i.device === 'Mobile' && i.metric_name === 'DeadClickCount');
    if (mobileDeadClicks.length > 0) {
      const total = mobileDeadClicks.reduce((sum, i) => sum + i.sub_total, 0);
      if (total > 500) {
        newSuggestions.push({
          id: 'mobile-touch-targets',
          name: 'Mobile Touch Targets Optimization',
          hypothesis: 'By increasing touch target sizes and adding visual feedback, we will reduce dead clicks by 30%',
          priority: 'HIGH',
          expectedImpact: '+15-20% mobile conversions',
          targetDevice: 'Mobile',
          basedOn: `${total.toLocaleString()} dead clicks detected on mobile`,
          category: 'UX'
        });
      }
    }

    // Mobile rage clicks
    const mobileRageClicks = uxIssues.filter(i => i.device === 'Mobile' && i.metric_name === 'RageClickCount');
    if (mobileRageClicks.length > 0) {
      const total = mobileRageClicks.reduce((sum, i) => sum + i.sub_total, 0);
      if (total > 200) {
        newSuggestions.push({
          id: 'mobile-loading',
          name: 'Mobile Loading Speed Optimization',
          hypothesis: 'By optimizing interactive element response times, we will reduce rage clicks and user frustration',
          priority: 'HIGH',
          expectedImpact: '+10-15% conversions, -25% bounce rate',
          targetDevice: 'Mobile',
          basedOn: `${total.toLocaleString()} rage clicks detected`,
          category: 'Performance'
        });
      }
    }

    // Script errors - check uxIssues for script errors
    const scriptErrors = uxIssues.filter(i => i.metric_name === 'ScriptErrorCount');
    if (scriptErrors.length > 0) {
      const totalErrors = scriptErrors.reduce((sum, i) => sum + i.sub_total, 0);
      const highestPercentage = Math.max(...scriptErrors.map(i => i.sessions_with_metric_percentage));
      if (totalErrors > 100 || highestPercentage > 40) {
        newSuggestions.push({
          id: 'fix-js-errors',
          name: 'Fix JavaScript Errors',
          hypothesis: 'By fixing script errors, we will improve user experience and conversions significantly',
          priority: 'CRITICAL',
          expectedImpact: '+20-30% conversions',
          targetDevice: 'All Devices',
          basedOn: `${totalErrors.toLocaleString()} script errors detected (${highestPercentage.toFixed(0)}% sessions affected)`,
          category: 'Technical'
        });
      }
    }

    // Quickbacks
    const quickbacks = uxIssues.filter(i => i.metric_name === 'QuickbackCount');
    if (quickbacks.length > 0) {
      const total = quickbacks.reduce((sum, i) => sum + i.sub_total, 0);
      if (total > 100) {
        newSuggestions.push({
          id: 'above-fold',
          name: 'Above-the-Fold Content Improvement',
          hypothesis: 'By showing the most relevant content immediately, we will reduce quickbacks and increase engagement',
          priority: 'MEDIUM',
          expectedImpact: '+8-12% time on page',
          targetDevice: 'All Devices',
          basedOn: `${total.toLocaleString()} quickbacks detected`,
          category: 'Content'
        });
      }
    }

    // Mobile traffic dominance
    const mobileTraffic = trafficByDevice.find(d => d.device === 'Mobile');
    if (mobileTraffic && summary.mobilePercentage > 60) {
      newSuggestions.push({
        id: 'mobile-first',
        name: 'Mobile-First Design Overhaul',
        hypothesis: 'With mobile at 86.5% of traffic, prioritizing mobile UX will have outsized impact on overall conversions',
        priority: 'HIGH',
        expectedImpact: '+15-25% overall conversions',
        targetDevice: 'Mobile',
        basedOn: `Mobile represents ${summary.mobilePercentage.toFixed(1)}% of all traffic`,
        category: 'Design'
      });
    }

    // Form optimization
    newSuggestions.push({
      id: 'form-simplify',
      name: 'Mobile Form Simplification',
      hypothesis: 'By reducing form fields and using autofill, we will increase form completion rates on mobile',
      priority: 'MEDIUM',
      expectedImpact: '+10-20% form completion',
      targetDevice: 'Mobile',
      basedOn: 'CRO best practices for mobile',
      category: 'UX'
    });

    // Low engagement fix
    if (summary.avgActiveTime < 60) {
      newSuggestions.push({
        id: 'engagement-boost',
        name: 'Engagement Boost Test',
        hypothesis: 'By adding interactive elements and better content hierarchy, we will increase active time on page',
        priority: 'MEDIUM',
        expectedImpact: '+30-50% active time',
        targetDevice: 'All Devices',
        basedOn: `Average active time is only ${Math.floor(summary.avgActiveTime)}s`,
        category: 'Engagement'
      });
    }

    setSuggestions(newSuggestions.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }));

    if (newSuggestions.length > 0) {
      setSelectedTest(newSuggestions[0]);
    }
  };

  const refreshSuggestionsWithAI = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/chat-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Generate 5 specific A/B test suggestions based on the current data. For each test provide: name, hypothesis, priority (CRITICAL/HIGH/MEDIUM), expected impact, and target device.',
          conversationHistory: []
        }),
      });
      
      // For now, just regenerate from current data
      if (dashboardData) {
        generateSuggestions(dashboardData);
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-[#ff0000]/20 text-[#ff6b6b] border-[#ff0000]/30';
      case 'HIGH':
        return 'bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30';
      case 'MEDIUM':
        return 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30';
      case 'LOW':
        return 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30';
      default:
        return 'bg-[#666666]/20 text-[#666666] border-[#666666]/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'UX':
        return <MousePointerClick className="w-4 h-4" />;
      case 'Performance':
        return <Zap className="w-4 h-4" />;
      case 'Technical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'Content':
        return <Target className="w-4 h-4" />;
      case 'Design':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <FlaskConical className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="A/B Tests" breadcrumb={["Dashboard", "A/B Tests"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Analyzing data for A/B test suggestions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="A/B Tests" breadcrumb={["Dashboard", "A/B Tests"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 p-6 bg-[#0a0a0a] border border-[#ff6b6b]/30 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-[#ff6b6b]" />
            <p className="text-[#ff6b6b] text-[14px]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#7c5cff] text-white rounded-lg text-sm hover:bg-[#6b4ee0] transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title="A/B Tests" breadcrumb={["Dashboard", "A/B Tests"]} />

      <div className="p-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[24px] font-bold text-[#fafafa] mb-2">A/B Test Suggestions</h1>
              <p className="text-[14px] text-[#666666]">
                Data-driven test ideas based on your Clarity insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshSuggestionsWithAI}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh Suggestions
              </button>
              <Link
                href="/explore-ai"
                className="flex items-center gap-2 px-5 py-3 bg-[#00d4aa]/20 text-[#00d4aa] border border-[#00d4aa]/30 text-[14px] font-medium rounded-xl hover:bg-[#00d4aa]/30 transition-all"
              >
                <Brain className="w-4 h-4" />
                Ask AI for More
              </Link>
            </div>
          </div>

          {/* Filtri */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#888888]" />
              <span className="text-[13px] text-[#888888]">Funnel:</span>
              <select
                value={selectedFunnel}
                onChange={(e) => setSelectedFunnel(e.target.value)}
                className="px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[13px] text-[#fafafa] focus:outline-none focus:border-[#7c5cff] transition-all"
              >
                <option value="all">Tutti i Funnel</option>
                <option value="funnel_1">E-commerce Checkout</option>
                <option value="funnel_2">SaaS Free Trial</option>
                <option value="funnel_3">Lead Generation</option>
                <option value="funnel_4">Mobile App Onboarding</option>
                <option value="funnel_5">Newsletter Signup</option>
              </select>
            </div>

            <div className="h-6 w-px bg-[#2a2a2a]" />

            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#888888]">Ordina per:</span>
              <button
                onClick={() => setSortBy("priority")}
                className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  sortBy === "priority"
                    ? "bg-[#7c5cff] text-white"
                    : "bg-[#111111] text-[#888888] border border-[#2a2a2a]"
                }`}
              >
                Priorità
              </button>
              <button
                onClick={() => setSortBy("date")}
                className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  sortBy === "date"
                    ? "bg-[#7c5cff] text-white"
                    : "bg-[#111111] text-[#888888] border border-[#2a2a2a]"
                }`}
              >
                Cronologia
              </button>
            </div>

            {suggestions.filter(s => s.priority === 'CRITICAL').length > 0 && (
              <>
                <div className="h-6 w-px bg-[#2a2a2a]" />
                <div className="flex items-center gap-2 px-3 py-2 bg-[#ff0000]/10 border border-[#ff0000]/30 rounded-lg animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-[#ff6b6b]" />
                  <span className="text-[12px] text-[#ff6b6b] font-medium">
                    {suggestions.filter(s => s.priority === 'CRITICAL').length} test CRITICI urgenti
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats from Real Data */}
        {dashboardData && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-[#7c5cff]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#fafafa]">{suggestions.length}</p>
                  <p className="text-[12px] text-[#666666]">Test Ideas</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff6b6b]/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#ff6b6b]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#fafafa]">
                    {suggestions.filter(s => s.priority === 'CRITICAL' || s.priority === 'HIGH').length}
                  </p>
                  <p className="text-[12px] text-[#666666]">High Priority</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-[#00d4aa]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#fafafa]">
                    {dashboardData.summary.mobilePercentage.toFixed(0)}%
                  </p>
                  <p className="text-[12px] text-[#666666]">Mobile Traffic</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#fafafa]">
                    {(dashboardData.summary.totalDeadClicks + dashboardData.summary.totalRageClicks).toLocaleString()}
                  </p>
                  <p className="text-[12px] text-[#666666]">UX Issues</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tests List */}
          <div className="lg:col-span-2 space-y-4">
            {suggestions.map((suggestion, index) => {
              const isCritical = suggestion.priority === 'CRITICAL';
              const isUrgent = suggestion.priority === 'CRITICAL' || suggestion.priority === 'HIGH';

              return (
              <div
                key={suggestion.id}
                onClick={() => setSelectedTest(suggestion)}
                className={`bg-[#0a0a0a] rounded-2xl p-6 cursor-pointer transition-all hover:bg-[#111111] relative ${
                  selectedTest?.id === suggestion.id
                    ? 'border-2 border-[#7c5cff]'
                    : isCritical
                    ? 'border-2 border-[#ff0000] animate-pulse'
                    : isUrgent
                    ? 'border-2 border-[#ff6b6b]/50'
                    : 'border border-white/10'
                }`}
              >
                {isCritical && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#ff0000] rounded-full flex items-center justify-center animate-bounce">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white">
                        #{index + 1}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority}
                      </span>
                      <span className="text-[12px] text-[#666666] flex items-center gap-1.5">
                        {getCategoryIcon(suggestion.category)}
                        {suggestion.category}
                      </span>
                    </div>

                    <h3 className="text-[16px] text-[#fafafa] font-semibold mb-2">
                      {suggestion.name}
                    </h3>
                    <p className="text-[14px] text-[#888888] mb-3">
                      {suggestion.hypothesis}
                    </p>

                    <div className="flex items-center gap-4">
                      <span className="text-[13px] text-[#00d4aa] font-medium flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        {suggestion.expectedImpact}
                      </span>
                      <span className="text-[12px] text-[#666666] flex items-center gap-1.5">
                        {suggestion.targetDevice === 'Mobile' ? (
                          <Smartphone className="w-3.5 h-3.5" />
                        ) : (
                          <Monitor className="w-3.5 h-3.5" />
                        )}
                        {suggestion.targetDevice}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-[#666666]" />
                </div>

                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <p className="text-[12px] text-[#666666]">
                    <span className="text-[#888888]">Based on:</span> {suggestion.basedOn}
                  </p>
                </div>
              </div>
            );
            })}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedTest ? (
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sticky top-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#7c5cff]" />
                  <h2 className="text-[16px] font-semibold text-[#fafafa]">Test Details</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Test Name</label>
                    <p className="text-[15px] text-[#fafafa] font-medium mt-1">{selectedTest.name}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Hypothesis</label>
                    <p className="text-[14px] text-[#fafafa] mt-1 leading-relaxed">{selectedTest.hypothesis}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Priority</label>
                    <div className="mt-2">
                      <span className={`px-3 py-1.5 rounded-full text-[12px] font-medium border ${getPriorityColor(selectedTest.priority)}`}>
                        {selectedTest.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Expected Impact</label>
                    <p className="text-[14px] text-[#00d4aa] font-medium mt-1">{selectedTest.expectedImpact}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Target Device</label>
                    <div className="flex items-center gap-2 mt-2">
                      {selectedTest.targetDevice === 'Mobile' ? (
                        <Smartphone className="w-4 h-4 text-[#7c5cff]" />
                      ) : (
                        <Monitor className="w-4 h-4 text-[#7c5cff]" />
                      )}
                      <span className="text-[13px] text-[#fafafa]">{selectedTest.targetDevice}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Data Source</label>
                    <p className="text-[13px] text-[#888888] mt-1">{selectedTest.basedOn}</p>
                  </div>

                  <div className="pt-4 border-t border-[#2a2a2a]">
                    <Link
                      href="/explore-ai"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#7c5cff]/20 text-[#a78bff] rounded-lg text-[13px] font-medium hover:bg-[#7c5cff]/30 transition-all"
                    >
                      <Brain className="w-4 h-4" />
                      Get AI Implementation Guide
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-center">
                <FlaskConical className="w-12 h-12 text-[#333333] mx-auto mb-4" />
                <p className="text-[14px] text-[#666666]">
                  Select a test to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
