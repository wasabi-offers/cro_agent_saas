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
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ABTestProposal {
  id: string;
  funnel_id: string;
  category: string;
  element: string;
  current_value: string;
  proposed_value: string;
  expected_impact: string;
  reasoning: string;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  created_at: string;
  funnels?: {
    id: string;
    name: string;
  };
}

interface ABTestData {
  proposals: ABTestProposal[];
  summary: {
    totalProposals: number;
    pendingCount: number;
    activeCount: number;
    completedCount: number;
  };
}

export default function ABTestsPage() {
  const [abTestData, setAbTestData] = useState<ABTestData | null>(null);
  const [proposals, setProposals] = useState<ABTestProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<ABTestProposal | null>(null);

  // Filtri
  const [selectedFunnel, setSelectedFunnel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");
  const [availableFunnels, setAvailableFunnels] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ab-tests-data');
        const result = await response.json();

        if (result.success) {
          setAbTestData(result.data);
          setProposals(result.data.proposals || []);

          // Extract unique funnels from proposals
          const funnelsMap = new Map<string, string>();
          result.data.proposals?.forEach((p: ABTestProposal) => {
            if (p.funnels) {
              funnelsMap.set(p.funnels.id, p.funnels.name);
            }
          });
          const funnels = Array.from(funnelsMap.entries()).map(([id, name]) => ({ id, name }));
          setAvailableFunnels(funnels);

          if (result.data.proposals && result.data.proposals.length > 0) {
            setSelectedTest(result.data.proposals[0]);
          }
        } else {
          setError(result.error || 'Failed to load data');
        }
      } catch (err) {
        console.error('Error loading A/B test data:', err);
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ab-tests-data');
      const result = await response.json();

      if (result.success) {
        setAbTestData(result.data);
        setProposals(result.data.proposals || []);

        // Extract unique funnels from proposals
        const funnelsMap = new Map<string, string>();
        result.data.proposals?.forEach((p: ABTestProposal) => {
          if (p.funnels) {
            funnelsMap.set(p.funnels.id, p.funnels.name);
          }
        });
        const funnels = Array.from(funnelsMap.entries()).map(([id, name]) => ({ id, name }));
        setAvailableFunnels(funnels);

        if (result.data.proposals && result.data.proposals.length > 0) {
          setSelectedTest(result.data.proposals[0]);
        }
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('Error refreshing A/B test data:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/30';
      case 'pending':
        return 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30';
      case 'completed':
        return 'bg-[#6366F1]/20 text-[#6366F1] border-[#6366F1]/30';
      case 'rejected':
        return 'bg-[#64748B]/20 text-[#64748B] border-[#64748B]/30';
      default:
        return 'bg-[#64748B]/20 text-[#64748B] border-[#64748B]/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Zap className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FlaskConical className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cta':
      case 'button':
        return <Target className="w-4 h-4" />;
      case 'headline':
      case 'copy':
        return <Sparkles className="w-4 h-4" />;
      case 'layout':
      case 'design':
        return <MousePointerClick className="w-4 h-4" />;
      case 'form':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FlaskConical className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="A/B Tests" breadcrumb={["Dashboard", "A/B Tests"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#0F172A] text-[14px]">Analyzing data for A/B test suggestions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="A/B Tests" breadcrumb={["Dashboard", "A/B Tests"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 p-6 bg-[#0B0F19] border border-[#EF4444]/30 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-[#EF4444]" />
            <p className="text-[#EF4444] text-[14px]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#6366F1] text-white rounded-lg text-sm hover:bg-[#6366F1] transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header title="A/B Tests" breadcrumb={["Dashboard", "A/B Tests"]} />

      <div className="p-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[24px] font-bold text-[#0F172A] mb-2">A/B Test Proposals</h1>
              <p className="text-[14px] text-[#64748B]">
                {proposals.length > 0
                  ? "AI-generated test proposals based on your funnel data"
                  : "No A/B test proposals available yet"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh Data
              </button>
              <Link
                href="/explore-ai"
                className="flex items-center gap-2 px-5 py-3 bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30 text-[14px] font-medium rounded-xl hover:bg-[#06B6D4]/30 transition-all"
              >
                <Brain className="w-4 h-4" />
                Ask AI for More
              </Link>
            </div>
          </div>

          {/* Filtri */}
          {proposals.length > 0 && (
            <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-xl p-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#0F172A]" />
                <span className="text-[13px] text-[#0F172A] font-semibold">Funnel:</span>
                <select
                  value={selectedFunnel}
                  onChange={(e) => setSelectedFunnel(e.target.value)}
                  className="px-3 py-2 bg-white/60 border border-[#6366F1]/30 rounded-lg text-[13px] text-[#0F172A] focus:outline-none focus:border-[#6366F1] transition-all"
                >
                  <option value="all">All Funnels</option>
                  {availableFunnels.map(funnel => (
                    <option key={funnel.id} value={funnel.id}>{funnel.name}</option>
                  ))}
                </select>
              </div>

              <div className="h-6 w-px bg-[#6366F1]/30" />

              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#64748B]">Sort by:</span>
                <button
                  onClick={() => setSortBy("date")}
                  className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    sortBy === "date"
                      ? "bg-[#6366F1] text-white"
                      : "bg-white/60 text-[#0F172A] border border-[#6366F1]/30"
                  }`}
                >
                  Date
                </button>
                <button
                  onClick={() => setSortBy("status")}
                  className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    sortBy === "status"
                      ? "bg-[#6366F1] text-white"
                      : "bg-white/60 text-[#0F172A] border border-[#6366F1]/30"
                  }`}
                >
                  Status
                </button>
              </div>

              {abTestData && abTestData.summary.activeCount > 0 && (
                <>
                  <div className="h-6 w-px bg-[#1E293B]" />
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-lg">
                    <Zap className="w-4 h-4 text-[#06B6D4]" />
                    <span className="text-[12px] text-[#06B6D4] font-medium">
                      {abTestData.summary.activeCount} Active Test{abTestData.summary.activeCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stats from Real Data */}
        {abTestData && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6366F1]/20 rounded-lg flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-[#6366F1]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#0F172A]">{abTestData.summary.totalProposals}</p>
                  <p className="text-[12px] text-[#64748B]">Total Proposals</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#f59e0b]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#0F172A]">
                    {abTestData.summary.pendingCount}
                  </p>
                  <p className="text-[12px] text-[#0F172A] font-semibold">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#06B6D4]/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#0F172A]">
                    {abTestData.summary.activeCount}
                  </p>
                  <p className="text-[12px] text-[#64748B]">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6366F1]/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#6366F1]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#0F172A]">
                    {abTestData.summary.completedCount}
                  </p>
                  <p className="text-[12px] text-[#0F172A] font-semibold">Completed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tests List */}
          <div className="lg:col-span-2 space-y-4">
            {proposals.length === 0 ? (
              <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-2xl p-12 text-center">
                <FlaskConical className="w-16 h-16 text-[#6366F1]/50 mx-auto mb-4" />
                <h3 className="text-[18px] font-semibold text-[#0F172A] mb-2">
                  No A/B Test Proposals Yet
                </h3>
                <p className="text-[14px] text-[#64748B] mb-6">
                  A/B test proposals will appear here when the AI generates them based on your funnel data.
                </p>
                <Link
                  href="/explore-ai"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#6366F1] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  <Brain className="w-4 h-4" />
                  Ask AI to Generate Proposals
                </Link>
              </div>
            ) : (
              proposals
                .filter(p => selectedFunnel === 'all' || p.funnel_id === selectedFunnel)
                .map((proposal, index) => {
                  const isActive = proposal.status === 'active';
                  const isPending = proposal.status === 'pending';

                  return (
                    <div
                      key={proposal.id}
                      onClick={() => setSelectedTest(proposal)}
                      className={`bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 rounded-2xl p-6 cursor-pointer transition-all hover:from-[#6366F1]/25 hover:to-[#6366F1]/10 relative ${
                        selectedTest?.id === proposal.id
                          ? 'border-2 border-[#6366F1]'
                          : isActive
                          ? 'border-2 border-[#06B6D4]/50'
                          : 'border border-[#6366F1]/30'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#06B6D4] rounded-full flex items-center justify-center animate-pulse">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white">
                              #{index + 1}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1 ${getStatusColor(proposal.status)}`}>
                              {getStatusIcon(proposal.status)}
                              {proposal.status.toUpperCase()}
                            </span>
                            <span className="text-[12px] text-[#0F172A] flex items-center gap-1.5">
                              {getCategoryIcon(proposal.category)}
                              {proposal.category}
                            </span>
                          </div>

                          <h3 className="text-[16px] text-[#0F172A] font-semibold mb-2">
                            Test {proposal.element}
                          </h3>
                          <p className="text-[14px] text-[#94A3B8] mb-3">
                            {proposal.reasoning}
                          </p>

                          <div className="flex items-center gap-4">
                            <span className="text-[13px] text-[#06B6D4] font-medium flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4" />
                              {proposal.expected_impact}
                            </span>
                            {proposal.funnels && (
                              <span className="text-[12px] text-[#0F172A] flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5" />
                                {proposal.funnels.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowRight className="w-5 h-5 text-[#64748B]" />
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#6366F1]/20 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] text-[#0F172A] uppercase mb-1 font-bold">Current</p>
                          <p className="text-[13px] text-[#0F172A]">{proposal.current_value}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[#0F172A] uppercase mb-1 font-bold">Proposed</p>
                          <p className="text-[13px] text-[#06B6D4] font-medium">{proposal.proposed_value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedTest ? (
              <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-2xl p-6 sticky top-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#6366F1]" />
                  <h2 className="text-[16px] font-semibold text-[#0F172A]">Proposal Details</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[11px] text-[#64748B] uppercase tracking-wide">Element</label>
                    <p className="text-[15px] text-[#0F172A] font-medium mt-1">{selectedTest.element}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#0F172A] uppercase tracking-wide font-bold">Category</label>
                    <div className="flex items-center gap-2 mt-2">
                      {getCategoryIcon(selectedTest.category)}
                      <span className="text-[13px] text-[#0F172A]">{selectedTest.category}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#64748B] uppercase tracking-wide">Status</label>
                    <div className="mt-2">
                      <span className={`px-3 py-1.5 rounded-full text-[12px] font-medium border flex items-center gap-1 w-fit ${getStatusColor(selectedTest.status)}`}>
                        {getStatusIcon(selectedTest.status)}
                        {selectedTest.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#0F172A] uppercase tracking-wide font-bold">Current Value</label>
                    <p className="text-[14px] text-[#0F172A] mt-1 bg-white/60 p-3 rounded-lg border border-[#6366F1]/20">{selectedTest.current_value}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#64748B] uppercase tracking-wide">Proposed Value</label>
                    <p className="text-[14px] text-[#06B6D4] font-medium mt-1 bg-[#06B6D4]/10 p-3 rounded-lg border border-[#06B6D4]/30">{selectedTest.proposed_value}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#0F172A] uppercase tracking-wide font-bold">Expected Impact</label>
                    <p className="text-[14px] text-[#06B6D4] font-medium mt-1 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {selectedTest.expected_impact}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#64748B] uppercase tracking-wide">Reasoning</label>
                    <p className="text-[13px] text-[#0F172A] mt-1 leading-relaxed">{selectedTest.reasoning}</p>
                  </div>

                  {selectedTest.funnels && (
                    <div>
                      <label className="text-[11px] text-[#0F172A] uppercase tracking-wide font-bold">Funnel</label>
                      <div className="flex items-center gap-2 mt-2">
                        <Target className="w-4 h-4 text-[#6366F1]" />
                        <span className="text-[13px] text-[#0F172A]">{selectedTest.funnels.name}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-[#64748B] uppercase tracking-wide">Created</label>
                    <p className="text-[13px] text-[#94A3B8] mt-1">
                      {new Date(selectedTest.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#6366F1]/20">
                    <Link
                      href="/explore-ai"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/60 text-[#6366F1] border border-[#6366F1]/30 rounded-lg text-[13px] font-medium hover:bg-white/80 transition-all"
                    >
                      <Brain className="w-4 h-4" />
                      Get AI Implementation Guide
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-2xl p-6 text-center">
                <FlaskConical className="w-12 h-12 text-[#6366F1]/50 mx-auto mb-4" />
                <p className="text-[14px] text-[#0F172A]">
                  Select a proposal to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
