"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import DateRangePicker from "@/components/DateRangePicker";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  FlaskConical,
  ArrowRight,
  Zap,
  BarChart3,
  MousePointerClick,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Brain,
  RefreshCw,
  AlertTriangle,
  Eye,
  Activity,
} from "lucide-react";
import type { CRODashboardData } from "@/lib/supabase-data";

export default function Home() {
  const [dashboardData, setDashboardData] = useState<CRODashboardData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch real data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/analytics-data');

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setDashboardData(result.data);
        } else {
          setError(result.error || 'Failed to load data');
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to connect to server. Please check console for details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dateRange]);

  // Request AI Analysis
  const requestAIAnalysis = async (analysisType: string) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/cro-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setAiAnalysis(result.analysis);
      } else {
        setError(result.error || 'AI analysis failed');
      }
    } catch (err) {
      console.error('Error requesting AI analysis:', err);
      setError('Failed to get AI analysis. Please check console for details.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Dashboard" breadcrumb={["Dashboard"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading tracking data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Dashboard" breadcrumb={["Dashboard"]} />
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

  if (!dashboardData) {
    return null;
  }

  const { summary, trafficByDevice, uxIssues, engagementByDevice } = dashboardData;

  return (
    <div className="min-h-screen bg-black">
      <Header title="CRO Dashboard" breadcrumb={["Dashboard"]} />

      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-[24px] font-bold text-[#fafafa] mb-1">
              CRO Dashboard
            </h2>
            <p className="text-[14px] text-[#888888]">
              Real-time tracking data from your funnels
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* AI Analysis Banner */}
        <div className="bg-gradient-to-r from-[#7c5cff]/20 via-[#00d4aa]/10 to-[#7c5cff]/20 border border-[#7c5cff]/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-2xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-[#fafafa]">
                  CRO Expert AI
                </h3>
                <p className="text-[14px] text-[#888888]">
                  Automatic data analysis with actionable suggestions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => requestAIAnalysis('full-analysis')}
                disabled={isAnalyzing}
                className="px-5 py-2.5 bg-[#7c5cff] text-white rounded-xl text-[14px] font-medium hover:bg-[#6b4ee0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Full Analysis
                  </>
                )}
              </button>
              <Link
                href="/explore-ai"
                className="px-5 py-2.5 bg-[#00d4aa]/20 text-[#00d4aa] border border-[#00d4aa]/30 rounded-xl text-[14px] font-medium hover:bg-[#00d4aa]/30 transition-all flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Explore AI
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards - Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Total Sessions */}
          <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#7c5cff]/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[#7c5cff]" />
              </div>
              <div className="flex items-center gap-1 text-[13px] font-medium text-[#00d4aa]">
                <TrendingUp className="w-4 h-4" />
                Live
              </div>
            </div>
            <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide mb-1">
              Total Sessions
            </p>
            <p className="text-[#fafafa] text-[32px] font-bold leading-tight">
              {summary.totalSessions.toLocaleString()}
            </p>
            <p className="text-[#666666] text-[12px] mt-1">
              {summary.totalUsers.toLocaleString()} unique users
            </p>
          </div>

          {/* Pages per Session */}
          <div className="bg-gradient-to-br from-[#00d4aa]/20 to-[#00d4aa]/5 border border-[#00d4aa]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#00d4aa]/20 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#00d4aa]" />
              </div>
            </div>
            <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide mb-1">
              Pages/Session
            </p>
            <p className="text-[#fafafa] text-[32px] font-bold leading-tight">
              {summary.avgPagesPerSession.toFixed(2)}
            </p>
            <p className="text-[#666666] text-[12px] mt-1">
              Avg scroll: {summary.avgScrollDepth.toFixed(0)}%
            </p>
          </div>

          {/* Engagement Time */}
          <div className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#f59e0b]" />
              </div>
            </div>
            <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide mb-1">
              Active Time
            </p>
            <p className="text-[#fafafa] text-[32px] font-bold leading-tight">
              {formatDuration(summary.avgActiveTime)}
            </p>
            <p className="text-[#666666] text-[12px] mt-1">
              Total: {formatDuration(summary.avgTotalTime)}
            </p>
          </div>

          {/* UX Issues */}
          <div className="bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff6b6b]/5 border border-[#ff6b6b]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#ff6b6b]/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#ff6b6b]" />
              </div>
              <div className="flex items-center gap-1 text-[13px] font-medium text-[#ff6b6b]">
                <AlertCircle className="w-4 h-4" />
                Warning
              </div>
            </div>
            <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide mb-1">
              UX Issues
            </p>
            <p className="text-[#fafafa] text-[32px] font-bold leading-tight">
              {(summary.totalDeadClicks + summary.totalRageClicks + summary.totalQuickbacks).toLocaleString()}
            </p>
            <p className="text-[#666666] text-[12px] mt-1">
              Dead clicks, rage clicks, quickbacks
            </p>
          </div>
        </div>

        {/* AI Analysis Result */}
        {aiAnalysis && (
          <div className="bg-[#0a0a0a] border border-[#7c5cff]/30 rounded-2xl overflow-hidden mb-10">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#7c5cff]/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[#fafafa]">
                    CRO Expert Analysis
                  </h2>
                  <p className="text-[13px] text-[#666666] mt-0.5">
                    Generated by Claude AI
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiAnalysis(null)}
                className="text-[#666666] hover:text-[#fafafa] transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="prose prose-invert max-w-none text-[14px] leading-relaxed">
                <div className="whitespace-pre-wrap text-[#d4d4d4]">
                  {aiAnalysis}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* UX Issues Breakdown */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff6b6b]/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#ff6b6b]" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[#fafafa]">
                    Detected UX Issues
                  </h2>
                  <p className="text-[13px] text-[#666666] mt-0.5">
                    Dead clicks, rage clicks, quickbacks
                  </p>
                </div>
              </div>
              <button
                onClick={() => requestAIAnalysis('ux-issues')}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-[#7c5cff]/20 text-[#a78bff] rounded-lg text-[13px] font-medium hover:bg-[#7c5cff]/30 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Analyze with AI
              </button>
            </div>

            <div className="p-6">
              {/* Issue Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[#111111] border border-[#ff6b6b]/20 rounded-xl p-4 text-center">
                  <MousePointerClick className="w-6 h-6 text-[#ff6b6b] mx-auto mb-2" />
                  <p className="text-[24px] font-bold text-[#fafafa]">
                    {summary.totalDeadClicks.toLocaleString()}
                  </p>
                  <p className="text-[12px] text-[#888888]">Dead Clicks</p>
                </div>
                <div className="bg-[#111111] border border-[#f59e0b]/20 rounded-xl p-4 text-center">
                  <Zap className="w-6 h-6 text-[#f59e0b] mx-auto mb-2" />
                  <p className="text-[24px] font-bold text-[#fafafa]">
                    {summary.totalRageClicks.toLocaleString()}
                  </p>
                  <p className="text-[12px] text-[#888888]">Rage Clicks</p>
                </div>
                <div className="bg-[#111111] border border-[#7c5cff]/20 rounded-xl p-4 text-center">
                  <ArrowRight className="w-6 h-6 text-[#7c5cff] mx-auto mb-2 rotate-180" />
                  <p className="text-[24px] font-bold text-[#fafafa]">
                    {summary.totalQuickbacks.toLocaleString()}
                  </p>
                  <p className="text-[12px] text-[#888888]">Quickbacks</p>
                </div>
              </div>

              {/* Issues by Device */}
              <h3 className="text-[14px] font-medium text-[#888888] mb-4">
                By Device
              </h3>
              <div className="space-y-3">
                {uxIssues.slice(0, 6).map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#111111] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-medium text-[#fafafa] w-16">
                        {issue.device}
                      </span>
                      <span className="text-[12px] text-[#888888]">
                        {issue.metric_name.replace('Count', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[14px] font-bold text-[#fafafa]">
                        {issue.sub_total.toLocaleString()}
                      </span>
                      <span className="text-[12px] text-[#ff6b6b]">
                        {issue.sessions_with_metric_percentage}% sessions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Device Distribution */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-[#fafafa]">
                  Traffic by Device
                </h2>
                <p className="text-[13px] text-[#666666]">Live tracking data</p>
              </div>
            </div>

            <div className="space-y-4">
              {trafficByDevice.map((device) => {
                const percentage = (device.total_session_count / summary.totalSessions) * 100;
                const color = device.device === 'Mobile' ? '#7c5cff' : 
                             device.device === 'Desktop' ? '#00d4aa' : '#f59e0b';
                
                return (
                  <div key={device.device} className="p-4 bg-[#111111] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] font-medium text-[#fafafa]">
                        {device.device}
                      </span>
                      <span className="text-[12px] text-[#666666]">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: color 
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-[#666666]">Sessions</p>
                        <p className="text-[#fafafa] font-medium">
                          {device.total_session_count.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#666666]">Users</p>
                        <p className="text-[#fafafa] font-medium">
                          {device.distinct_user_count.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#666666]">Pages/Sess</p>
                        <p className="text-[#fafafa] font-medium">
                          {device.pages_per_session.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#666666]">Bot</p>
                        <p className="text-[#fafafa] font-medium">
                          {device.total_bot_session_count.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Engagement by Device */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {engagementByDevice.map((device) => (
            <div
              key={device.device}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-semibold text-[#fafafa]">
                  {device.device}
                </h3>
                <span className="px-2.5 py-1 bg-[#7c5cff]/20 text-[#a78bff] rounded-full text-[11px] font-medium">
                  Engagement
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-[#111111] rounded-xl">
                  <p className="text-[24px] font-bold text-[#fafafa]">
                    {formatDuration(device.total_time)}
                  </p>
                  <p className="text-[12px] text-[#888888]">Total Time</p>
                </div>
                <div className="text-center p-4 bg-[#111111] rounded-xl">
                  <p className="text-[24px] font-bold text-[#00d4aa]">
                    {formatDuration(device.active_time)}
                  </p>
                  <p className="text-[12px] text-[#888888]">Active Time</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-[#888888]">Engagement Rate</span>
                  <span className="text-[#00d4aa] font-medium">
                    {((device.active_time / device.total_time) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] rounded-full"
                    style={{ width: `${(device.active_time / device.total_time) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-[#fafafa]">
                Quick Actions
              </h2>
              <p className="text-[13px] text-[#666666]">
                Generate specific AI analysis
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => requestAIAnalysis('ab-tests')}
              disabled={isAnalyzing}
              className="p-4 bg-[#111111] border border-white/10 rounded-xl hover:border-[#7c5cff]/50 transition-all text-left group"
            >
              <FlaskConical className="w-6 h-6 text-[#7c5cff] mb-3" />
              <h3 className="text-[14px] font-medium text-[#fafafa] mb-1">
                Generate A/B Tests
              </h3>
              <p className="text-[12px] text-[#888888]">
                Data-driven test suggestions
              </p>
            </button>

            <button
              onClick={() => requestAIAnalysis('ux-issues')}
              disabled={isAnalyzing}
              className="p-4 bg-[#111111] border border-white/10 rounded-xl hover:border-[#ff6b6b]/50 transition-all text-left group"
            >
              <AlertTriangle className="w-6 h-6 text-[#ff6b6b] mb-3" />
              <h3 className="text-[14px] font-medium text-[#fafafa] mb-1">
                Analyze UX Issues
              </h3>
              <p className="text-[12px] text-[#888888]">
                Solutions for dead clicks and rage clicks
              </p>
            </button>

            <Link
              href="/explore-ai"
              className="p-4 bg-[#111111] border border-white/10 rounded-xl hover:border-[#00d4aa]/50 transition-all text-left group"
            >
              <Brain className="w-6 h-6 text-[#00d4aa] mb-3" />
              <h3 className="text-[14px] font-medium text-[#fafafa] mb-1">
                Chat with CRO Expert
              </h3>
              <p className="text-[12px] text-[#888888]">
                Ask specific questions about your data
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
