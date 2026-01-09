"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import TestManagementDashboard from "@/components/TestManagementDashboard";
import {
  FlaskConical,
  TrendingUp,
  BarChart3,
  MousePointerClick,
  Zap,
  Play,
  Pause,
  Check,
  X,
  Calendar,
  Target,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  generateMockABTestSuggestions,
  ABTestSuggestion,
} from "@/lib/mock-data";
import {
  prioritizeTests,
  getRecommendedTests,
  calculateICEScore,
} from "@/lib/test-prioritization";

export default function ABTestsPage() {
  const [suggestions, setSuggestions] = useState<ABTestSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'running' | 'completed'>('all');
  const [selectedTest, setSelectedTest] = useState<ABTestSuggestion | null>(null);
  const [autoPrioritize, setAutoPrioritize] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = generateMockABTestSuggestions();
      setSuggestions(data);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30';
      case 'medium':
        return 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30';
      case 'low':
        return 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30';
      default:
        return 'bg-[#666666]/20 text-[#666666] border-[#666666]/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#f59e0b]/20 text-[#f59e0b]';
      case 'running':
        return 'bg-[#7c5cff]/20 text-[#7c5cff]';
      case 'completed':
        return 'bg-[#00d4aa]/20 text-[#00d4aa]';
      case 'dismissed':
        return 'bg-[#666666]/20 text-[#666666]';
      default:
        return 'bg-[#666666]/20 text-[#666666]';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'clarity':
        return <MousePointerClick className="w-4 h-4" />;
      case 'crazy_egg':
        return <BarChart3 className="w-4 h-4" />;
      case 'google_analytics':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'clarity':
        return 'Microsoft Clarity';
      case 'crazy_egg':
        return 'Crazy Egg';
      case 'google_analytics':
        return 'Google Analytics';
      default:
        return 'Combined Analysis';
    }
  };

  const filteredSuggestions = (() => {
    let filtered = suggestions.filter((s) => {
      if (filter === 'all') return true;
      return s.status === filter;
    });

    // Apply automatic prioritization if enabled
    if (autoPrioritize && filter !== 'completed') {
      filtered = prioritizeTests(filtered);
    }

    return filtered;
  })();

  const updateTestStatus = (id: string, newStatus: ABTestSuggestion['status']) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    if (selectedTest?.id === id) {
      setSelectedTest((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="A/B Tests" breadcrumb={["Dashboard", "A/B Tests"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading A/B tests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title="A/B Tests" breadcrumb={["Dashboard", "A/B Tests"]} />

      <div className="p-10">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-[#fafafa] mb-2">A/B Test Suggestions</h1>
            <p className="text-[14px] text-[#666666]">
              AI-generated test ideas based on your Clarity, Crazy Egg, and GA data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoPrioritize(!autoPrioritize)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all border ${
                autoPrioritize
                  ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30'
                  : 'bg-[#111111] text-[#888888] border-[#2a2a2a]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Auto-Prioritize {autoPrioritize && '✓'}
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/25">
              <RefreshCw className="w-4 h-4" />
              Generate New Ideas
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-[24px] font-bold text-[#fafafa]">
                  {suggestions.filter((s) => s.status === 'pending').length}
                </p>
                <p className="text-[12px] text-[#666666]">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <div>
                <p className="text-[24px] font-bold text-[#fafafa]">
                  {suggestions.filter((s) => s.status === 'running').length}
                </p>
                <p className="text-[12px] text-[#666666]">Running</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-[#00d4aa]" />
              </div>
              <div>
                <p className="text-[24px] font-bold text-[#fafafa]">
                  {suggestions.filter((s) => s.status === 'completed').length}
                </p>
                <p className="text-[12px] text-[#666666]">Completed</p>
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
                  {suggestions.filter((s) => s.priority === 'high').length}
                </p>
                <p className="text-[12px] text-[#666666]">High Priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Management Dashboard */}
        <TestManagementDashboard />

        {/* Divider */}
        <div className="my-10 border-t border-[#2a2a2a]"></div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'pending', 'running', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all capitalize ${
                filter === tab
                  ? 'bg-[#7c5cff] text-white'
                  : 'bg-[#111111] text-[#888888] hover:bg-[#1a1a1a] hover:text-[#fafafa]'
              }`}
            >
              {tab} {tab !== 'all' && `(${suggestions.filter((s) => s.status === tab).length})`}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tests List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredSuggestions.map((suggestion, index) => {
              const iceScore = calculateICEScore(suggestion);

              return (
              <div
                key={suggestion.id}
                onClick={() => setSelectedTest(suggestion)}
                className={`bg-[#0a0a0a] border rounded-2xl p-6 cursor-pointer transition-all hover:bg-[#111111] ${
                  selectedTest?.id === suggestion.id
                    ? 'border-[#7c5cff]'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {autoPrioritize && filter !== 'completed' && 'priorityScore' in suggestion && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white">
                          #{index + 1} · Score: {(suggestion as any).priorityScore}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium uppercase ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize ${getStatusColor(suggestion.status)}`}>
                        {suggestion.status}
                      </span>
                      <span className="text-[12px] text-[#555555] flex items-center gap-1.5">
                        {getSourceIcon(suggestion.dataSource)}
                        {getSourceLabel(suggestion.dataSource)}
                      </span>
                    </div>

                    <h3 className="text-[16px] text-[#fafafa] font-semibold mb-2">
                      {suggestion.element}
                    </h3>
                    <p className="text-[13px] text-[#666666] mb-1">
                      Page: <span className="text-[#888888]">{suggestion.page}</span>
                    </p>
                    <p className="text-[14px] text-[#888888] mb-3">
                      {suggestion.hypothesis}
                    </p>

                    <div className="flex items-center gap-4">
                      <span className="text-[13px] text-[#00d4aa] font-medium flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        {suggestion.expectedImpact}
                      </span>
                      <span className="text-[12px] text-[#555555] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(suggestion.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {suggestion.status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTestStatus(suggestion.id, 'running');
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#7c5cff]/20 text-[#a78bff] text-[12px] font-medium rounded-lg hover:bg-[#7c5cff]/30 transition-all"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Start
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTestStatus(suggestion.id, 'dismissed');
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-[#666666] text-[12px] font-medium rounded-lg hover:bg-white/10 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          Dismiss
                        </button>
                      </>
                    )}
                    {suggestion.status === 'running' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTestStatus(suggestion.id, 'completed');
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#00d4aa]/20 text-[#00d4aa] text-[12px] font-medium rounded-lg hover:bg-[#00d4aa]/30 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Complete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTestStatus(suggestion.id, 'pending');
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-[#666666] text-[12px] font-medium rounded-lg hover:bg-white/10 transition-all"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          Pause
                        </button>
                      </>
                    )}
                    {suggestion.status === 'completed' && (
                      <div className="px-3 py-2 bg-[#00d4aa]/10 text-[#00d4aa] text-[12px] font-medium rounded-lg">
                        ✓ Completed
                      </div>
                    )}
                  </div>
                </div>

                {/* ICE Score - Show when auto-prioritize is enabled */}
                {autoPrioritize && filter !== 'completed' && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#666666] uppercase">ICE Score</span>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-[10px] text-[#888888]">Impact</div>
                          <div className="text-[13px] font-semibold text-[#fafafa]">{iceScore.impact}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-[#888888]">Confidence</div>
                          <div className="text-[13px] font-semibold text-[#fafafa]">{iceScore.confidence}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-[#888888]">Ease</div>
                          <div className="text-[13px] font-semibold text-[#fafafa]">{iceScore.ease}</div>
                        </div>
                        <div className="text-center px-3 py-1 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] rounded-lg">
                          <div className="text-[10px] text-white/80">Total</div>
                          <div className="text-[14px] font-bold text-white">{iceScore.score}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Element</label>
                    <p className="text-[15px] text-[#fafafa] font-medium mt-1">{selectedTest.element}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Page</label>
                    <p className="text-[14px] text-[#888888] mt-1">{selectedTest.page}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Hypothesis</label>
                    <p className="text-[14px] text-[#fafafa] mt-1 leading-relaxed">{selectedTest.hypothesis}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Reasoning</label>
                    <p className="text-[13px] text-[#888888] mt-1 leading-relaxed">{selectedTest.reasoning}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Expected Impact</label>
                    <p className="text-[14px] text-[#00d4aa] font-medium mt-1">{selectedTest.expectedImpact}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Metrics to Track</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTest.metrics.map((metric) => (
                        <span
                          key={metric}
                          className="px-2.5 py-1 bg-[#7c5cff]/20 text-[#a78bff] text-[11px] font-medium rounded-full"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Data Source</label>
                    <div className="flex items-center gap-2 mt-2">
                      {getSourceIcon(selectedTest.dataSource)}
                      <span className="text-[13px] text-[#fafafa]">{getSourceLabel(selectedTest.dataSource)}</span>
                    </div>
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


