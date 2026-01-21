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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");

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
        return 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30';
      case 'pending':
        return 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30';
      case 'completed':
        return 'bg-[#7c5cff]/20 text-[#7c5cff] border-[#7c5cff]/30';
      case 'rejected':
        return 'bg-[#666666]/20 text-[#666666] border-[#666666]/30';
      default:
        return 'bg-[#666666]/20 text-[#666666] border-[#666666]/30';
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
              <h1 className="text-[24px] font-bold text-[#fafafa] mb-2">A/B Test Proposals</h1>
              <p className="text-[14px] text-[#666666]">
                {proposals.length > 0
                  ? "AI-generated test proposals based on your funnel data"
                  : "No A/B test proposals available yet"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
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
                className="flex items-center gap-2 px-5 py-3 bg-[#00d4aa]/20 text-[#00d4aa] border border-[#00d4aa]/30 text-[14px] font-medium rounded-xl hover:bg-[#00d4aa]/30 transition-all"
              >
                <Brain className="w-4 h-4" />
                Ask AI for More
              </Link>
            </div>
          </div>

          {/* Filtri */}
          {proposals.length > 0 && (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#888888]" />
                <span className="text-[13px] text-[#888888]">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[13px] text-[#fafafa] focus:outline-none focus:border-[#7c5cff] transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="h-6 w-px bg-[#2a2a2a]" />

              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#888888]">Sort by:</span>
                <button
                  onClick={() => setSortBy("date")}
                  className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    sortBy === "date"
                      ? "bg-[#7c5cff] text-white"
                      : "bg-[#111111] text-[#888888] border border-[#2a2a2a]"
                  }`}
                >
                  Date
                </button>
                <button
                  onClick={() => setSortBy("status")}
                  className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    sortBy === "status"
                      ? "bg-[#7c5cff] text-white"
                      : "bg-[#111111] text-[#888888] border border-[#2a2a2a]"
                  }`}
                >
                  Status
                </button>
              </div>

              {abTestData && abTestData.summary.activeCount > 0 && (
                <>
                  <div className="h-6 w-px bg-[#2a2a2a]" />
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#00d4aa]/10 border border-[#00d4aa]/30 rounded-lg">
                    <Zap className="w-4 h-4 text-[#00d4aa]" />
                    <span className="text-[12px] text-[#00d4aa] font-medium">
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
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-[#7c5cff]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#fafafa]">{abTestData.summary.totalProposals}</p>
                  <p className="text-[12px] text-[#666666]">Total Proposals</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#f59e0b]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#fafafa]">
                    {abTestData.summary.pendingCount}
                  </p>
                  <p className="text-[12px] text-[#666666]">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#00d4aa]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#fafafa]">
                    {abTestData.summary.activeCount}
                  </p>
                  <p className="text-[12px] text-[#666666]">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#7c5cff]" />
                </div>
                <div>
                  <p className="text-[24px] font-bold text-[#fafafa]">
                    {abTestData.summary.completedCount}
                  </p>
                  <p className="text-[12px] text-[#666666]">Completed</p>
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
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
                <FlaskConical className="w-16 h-16 text-[#333333] mx-auto mb-4" />
                <h3 className="text-[18px] font-semibold text-[#fafafa] mb-2">
                  No A/B Test Proposals Yet
                </h3>
                <p className="text-[14px] text-[#666666] mb-6">
                  A/B test proposals will appear here when the AI generates them based on your funnel data.
                </p>
                <Link
                  href="/explore-ai"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#7c5cff] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  <Brain className="w-4 h-4" />
                  Ask AI to Generate Proposals
                </Link>
              </div>
            ) : (
              proposals
                .filter(p => selectedStatus === 'all' || p.status === selectedStatus)
                .map((proposal, index) => {
                  const isActive = proposal.status === 'active';
                  const isPending = proposal.status === 'pending';

                  return (
                    <div
                      key={proposal.id}
                      onClick={() => setSelectedTest(proposal)}
                      className={`bg-[#0a0a0a] rounded-2xl p-6 cursor-pointer transition-all hover:bg-[#111111] relative ${
                        selectedTest?.id === proposal.id
                          ? 'border-2 border-[#7c5cff]'
                          : isActive
                          ? 'border-2 border-[#00d4aa]/50'
                          : 'border border-white/10'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#00d4aa] rounded-full flex items-center justify-center animate-pulse">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white">
                              #{index + 1}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1 ${getStatusColor(proposal.status)}`}>
                              {getStatusIcon(proposal.status)}
                              {proposal.status.toUpperCase()}
                            </span>
                            <span className="text-[12px] text-[#666666] flex items-center gap-1.5">
                              {getCategoryIcon(proposal.category)}
                              {proposal.category}
                            </span>
                          </div>

                          <h3 className="text-[16px] text-[#fafafa] font-semibold mb-2">
                            Test {proposal.element}
                          </h3>
                          <p className="text-[14px] text-[#888888] mb-3">
                            {proposal.reasoning}
                          </p>

                          <div className="flex items-center gap-4">
                            <span className="text-[13px] text-[#00d4aa] font-medium flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4" />
                              {proposal.expected_impact}
                            </span>
                            {proposal.funnels && (
                              <span className="text-[12px] text-[#666666] flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5" />
                                {proposal.funnels.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowRight className="w-5 h-5 text-[#666666]" />
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#2a2a2a] grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] text-[#666666] uppercase mb-1">Current</p>
                          <p className="text-[13px] text-[#888888]">{proposal.current_value}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[#666666] uppercase mb-1">Proposed</p>
                          <p className="text-[13px] text-[#00d4aa] font-medium">{proposal.proposed_value}</p>
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
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sticky top-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#7c5cff]" />
                  <h2 className="text-[16px] font-semibold text-[#fafafa]">Proposal Details</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Element</label>
                    <p className="text-[15px] text-[#fafafa] font-medium mt-1">{selectedTest.element}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Category</label>
                    <div className="flex items-center gap-2 mt-2">
                      {getCategoryIcon(selectedTest.category)}
                      <span className="text-[13px] text-[#fafafa]">{selectedTest.category}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Status</label>
                    <div className="mt-2">
                      <span className={`px-3 py-1.5 rounded-full text-[12px] font-medium border flex items-center gap-1 w-fit ${getStatusColor(selectedTest.status)}`}>
                        {getStatusIcon(selectedTest.status)}
                        {selectedTest.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Current Value</label>
                    <p className="text-[14px] text-[#888888] mt-1 bg-[#111111] p-3 rounded-lg">{selectedTest.current_value}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Proposed Value</label>
                    <p className="text-[14px] text-[#00d4aa] font-medium mt-1 bg-[#00d4aa]/10 p-3 rounded-lg border border-[#00d4aa]/30">{selectedTest.proposed_value}</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Expected Impact</label>
                    <p className="text-[14px] text-[#00d4aa] font-medium mt-1 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {selectedTest.expected_impact}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Reasoning</label>
                    <p className="text-[13px] text-[#fafafa] mt-1 leading-relaxed">{selectedTest.reasoning}</p>
                  </div>

                  {selectedTest.funnels && (
                    <div>
                      <label className="text-[11px] text-[#666666] uppercase tracking-wide">Funnel</label>
                      <div className="flex items-center gap-2 mt-2">
                        <Target className="w-4 h-4 text-[#7c5cff]" />
                        <span className="text-[13px] text-[#fafafa]">{selectedTest.funnels.name}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-[#666666] uppercase tracking-wide">Created</label>
                    <p className="text-[13px] text-[#888888] mt-1">
                      {new Date(selectedTest.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
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
