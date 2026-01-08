"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import DateRangePicker from "@/components/DateRangePicker";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Clock,
  FlaskConical,
  ArrowRight,
  Zap,
  BarChart3,
  MousePointerClick,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  generateMockSessions,
  calculateDashboardMetrics,
  calculateDailyMetrics,
  calculateTrafficSources,
  calculateDeviceBreakdown,
  generateMockABTestSuggestions,
  generateMockFunnels,
  DashboardMetrics,
  DailyMetric,
  TrafficSource,
  DeviceBreakdown,
  ABTestSuggestion,
  ConversionFunnel,
} from "@/lib/mock-data";
import Link from "next/link";

export default function Home() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([]);
  const [topSuggestions, setTopSuggestions] = useState<ABTestSuggestion[]>([]);
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Date range state
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Default: last 30 days
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };
  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      setIsLoading(true);

      // Generate mock data
      const sessions = generateMockSessions();
      const dashboardMetrics = calculateDashboardMetrics(sessions);
      const daily = calculateDailyMetrics(sessions);
      const sources = calculateTrafficSources(sessions);
      const devices = calculateDeviceBreakdown(sessions);
      const suggestions = generateMockABTestSuggestions();
      const funnelsData = generateMockFunnels();

      setMetrics(dashboardMetrics);
      setDailyMetrics(daily);
      setTrafficSources(sources);
      setDeviceBreakdown(devices);
      setTopSuggestions(suggestions.filter((s) => s.status === 'pending').slice(0, 3));
      setFunnels(funnelsData);

      setIsLoading(false);
    };

    loadData();
  }, [dateRange]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

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

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'clarity':
        return <MousePointerClick className="w-3.5 h-3.5" />;
      case 'crazy_egg':
        return <BarChart3 className="w-3.5 h-3.5" />;
      case 'google_analytics':
        return <TrendingUp className="w-3.5 h-3.5" />;
      default:
        return <Zap className="w-3.5 h-3.5" />;
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Dashboard" breadcrumb={["Dashboard"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading CRO data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Find max for chart scaling
  const maxSessions = Math.max(...dailyMetrics.map((d) => d.sessions));

  return (
    <div className="min-h-screen bg-black">
      <Header title="Dashboard" breadcrumb={["Dashboard"]} />

      <div className="p-10">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-[24px] font-bold text-[#fafafa] mb-1">Overview</h2>
            <p className="text-[14px] text-[#888888]">Monitor your CRO performance metrics</p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Sessions Card */}
          <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#7c5cff]/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[#7c5cff]" />
              </div>
              <div className={`flex items-center gap-1 text-[13px] font-medium ${metrics.sessionsChange >= 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'}`}>
                {metrics.sessionsChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(metrics.sessionsChange).toFixed(1)}%
              </div>
            </div>
            <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide mb-1">
              Total Sessions
            </p>
            <p className="text-[#fafafa] text-[32px] font-bold leading-tight">
              {metrics.totalSessions.toLocaleString()}
            </p>
          </div>

          {/* Conversions Card */}
          <div className="bg-gradient-to-br from-[#00d4aa]/20 to-[#00d4aa]/5 border border-[#00d4aa]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#00d4aa]/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-[#00d4aa]" />
              </div>
              <div className={`flex items-center gap-1 text-[13px] font-medium ${metrics.conversionsChange >= 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'}`}>
                {metrics.conversionsChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(metrics.conversionsChange).toFixed(1)}%
              </div>
            </div>
            <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide mb-1">
              Conversions
            </p>
            <p className="text-[#fafafa] text-[32px] font-bold leading-tight">
              {metrics.totalConversions.toLocaleString()}
            </p>
            <p className="text-[#666666] text-[12px] mt-1">
              {metrics.conversionRate.toFixed(2)}% rate
            </p>
          </div>

          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#f59e0b]" />
              </div>
            </div>
            <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide mb-1">
              Revenue
            </p>
            <p className="text-[#fafafa] text-[32px] font-bold leading-tight">
              {formatCurrency(metrics.revenueTotal)}
            </p>
            <p className="text-[#666666] text-[12px] mt-1">
              {formatCurrency(metrics.revenueTotal / metrics.totalConversions)} avg order
            </p>
          </div>

          {/* Bounce Rate Card */}
          <div className="bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff6b6b]/5 border border-[#ff6b6b]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#ff6b6b]/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#ff6b6b]" />
              </div>
              <div className={`flex items-center gap-1 text-[13px] font-medium ${metrics.bounceRateChange <= 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'}`}>
                {metrics.bounceRateChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {Math.abs(metrics.bounceRateChange).toFixed(1)}%
              </div>
            </div>
            <p className="text-[#888888] text-[13px] font-medium uppercase tracking-wide mb-1">
              Bounce Rate
            </p>
            <p className="text-[#fafafa] text-[32px] font-bold leading-tight">
              {metrics.bounceRate.toFixed(1)}%
            </p>
            <p className="text-[#666666] text-[12px] mt-1">
              Avg duration: {formatDuration(metrics.avgSessionDuration)}
            </p>
          </div>
        </div>

        {/* Funnel Performance Comparison */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden mb-10">
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-[#fafafa]">Funnel Performance</h2>
              <p className="text-[13px] text-[#666666] mt-1">Compare all conversion funnels</p>
            </div>
            <Link
              href="/funnels"
              className="text-[13px] text-[#7c5cff] hover:text-[#a78bff] transition-colors flex items-center gap-1"
            >
              View details
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#111111] border-b border-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#888888] uppercase tracking-wide">Funnel</th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#888888] uppercase tracking-wide">Conv. Rate</th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#888888] uppercase tracking-wide">Visitors</th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#888888] uppercase tracking-wide">Conversions</th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#888888] uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-right text-[12px] font-semibold text-[#888888] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {funnels.map((funnel) => {
                  const firstStep = funnel.steps[0];
                  const lastStep = funnel.steps[funnel.steps.length - 1];
                  const conversionRate = (lastStep.visitors / firstStep.visitors) * 100;
                  const hasIssues = funnel.steps.some(step => step.dropoff > 50);

                  return (
                    <tr key={funnel.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-[#fafafa]">{funnel.name}</p>
                            <p className="text-[12px] text-[#666666]">{funnel.steps.length} steps</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[16px] font-bold ${conversionRate >= 10 ? 'text-[#00d4aa]' : conversionRate >= 5 ? 'text-[#f59e0b]' : 'text-[#ff6b6b]'}`}>
                            {conversionRate.toFixed(1)}%
                          </span>
                          {conversionRate >= 10 ? (
                            <TrendingUp className="w-4 h-4 text-[#00d4aa]" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-[#ff6b6b]" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-[#fafafa]">{firstStep.visitors.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-[#fafafa]">{lastStep.visitors.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        {hasIssues ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/30">
                            <AlertCircle className="w-3 h-3" />
                            ISSUES
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#00d4aa]/20 text-[#00d4aa] border border-[#00d4aa]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            HEALTHY
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href="/funnels"
                          className="inline-flex items-center gap-1 text-[13px] text-[#7c5cff] hover:text-[#a78bff] transition-colors"
                        >
                          Analyze
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Actions */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden mb-10">
          <div className="px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff6b6b] to-[#f59e0b] rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-[#fafafa]">Priority Actions</h2>
                <p className="text-[13px] text-[#666666] mt-1">Critical improvements by funnel</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {funnels.map((funnel) => {
              const criticalStep = funnel.steps.reduce((max, step) =>
                step.dropoff > max.dropoff ? step : max, funnel.steps[0]
              );
              const potentialGain = Math.round(criticalStep.dropoff * 0.3); // 30% improvement potential

              return (
                <div key={`action-${funnel.id}`} className="px-6 py-5 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium uppercase bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/30">
                          HIGH PRIORITY
                        </span>
                        <span className="text-[12px] text-[#666666]">{funnel.name}</span>
                      </div>
                      <h3 className="text-[15px] text-[#fafafa] font-medium mb-2">
                        Fix {criticalStep.name} step - {criticalStep.dropoff.toFixed(0)}% dropoff
                      </h3>
                      <p className="text-[13px] text-[#888888] mb-3">
                        Users are abandoning at this step. Simplify the process, reduce form fields, and add trust signals.
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-[#00d4aa] font-medium flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Potential: +{potentialGain}% conversion rate
                        </span>
                        <span className="text-[12px] text-[#666666]">
                          Impact: ~€{Math.round(metrics?.revenueTotal || 0 / 10 * potentialGain).toLocaleString()}/month
                        </span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-[#7c5cff]/20 text-[#a78bff] text-[13px] font-medium rounded-lg hover:bg-[#7c5cff]/30 transition-all whitespace-nowrap">
                      Create Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cross-Funnel AI Insights */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden mb-10">
          <div className="px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-[#fafafa]">AI Insights</h2>
                <p className="text-[13px] text-[#666666] mt-1">Cross-funnel analysis and recommendations</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4">
            <div className="p-4 bg-[#111111] border border-[#7c5cff]/20 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4 text-[#7c5cff]" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] text-[#fafafa] font-medium mb-1">
                    Mobile users show 45% lower conversion across all funnels
                  </p>
                  <p className="text-[13px] text-[#888888] mb-3">
                    Checkout, Lead Gen, and Free Trial funnels all underperform on mobile. Consider mobile-first redesign with larger tap targets and simplified forms.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-[#00d4aa] font-medium">Recommendation: Optimize mobile UX</span>
                    <span className="text-[12px] text-[#666666]">Est. impact: +€4,200/month</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#111111] border border-[#f59e0b]/20 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] text-[#fafafa] font-medium mb-1">
                    Google Ads traffic converts 3x better in Free Trial funnel
                  </p>
                  <p className="text-[13px] text-[#888888] mb-3">
                    Paid traffic shows significantly higher intent. Consider increasing Google Ads budget and applying similar messaging to organic channels.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-[#00d4aa] font-medium">Recommendation: Increase paid acquisition</span>
                    <span className="text-[12px] text-[#666666]">Est. impact: +€6,800/month</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#111111] border border-[#00d4aa]/20 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Target className="w-4 h-4 text-[#00d4aa]" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] text-[#fafafa] font-medium mb-1">
                    Newsletter subscribers convert 2.5x higher in Checkout funnel
                  </p>
                  <p className="text-[13px] text-[#888888] mb-3">
                    Email nurture sequence is working. Consider adding exit-intent popup on high-value pages to capture more email addresses before checkout.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-[#00d4aa] font-medium">Recommendation: Add exit-intent capture</span>
                    <span className="text-[12px] text-[#666666]">Est. impact: +€3,500/month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Sessions Chart */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[18px] font-semibold text-[#fafafa]">Sessions Overview</h2>
                <p className="text-[13px] text-[#666666] mt-1">Last 30 days</p>
              </div>
            </div>
            
            {/* Simple Bar Chart */}
            <div className="h-[200px] flex items-end gap-1">
              {dailyMetrics.map((day, index) => (
                <div
                  key={day.date}
                  className="flex-1 group relative"
                >
                  <div
                    className="w-full bg-gradient-to-t from-[#7c5cff] to-[#a78bff] rounded-t-sm transition-all hover:from-[#8f73ff] hover:to-[#b89dff]"
                    style={{ height: `${(day.sessions / maxSessions) * 100}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1a1a] border border-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    <p className="text-[11px] text-[#fafafa] font-medium">{day.sessions} sessions</p>
                    <p className="text-[10px] text-[#666666]">{day.date}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chart Labels */}
            <div className="flex justify-between mt-3 px-1">
              <span className="text-[11px] text-[#555555]">{dailyMetrics[0]?.date}</span>
              <span className="text-[11px] text-[#555555]">{dailyMetrics[dailyMetrics.length - 1]?.date}</span>
            </div>
          </div>

          {/* A/B Tests Status */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[18px] font-semibold text-[#fafafa]">A/B Tests</h2>
                <p className="text-[13px] text-[#666666] mt-1">Current status</p>
              </div>
              <Link
                href="/ab-tests"
                className="text-[13px] text-[#7c5cff] hover:text-[#a78bff] transition-colors flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#111111] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                  <div>
                    <p className="text-[14px] text-[#fafafa] font-medium">Pending</p>
                    <p className="text-[12px] text-[#666666]">Awaiting review</p>
                  </div>
                </div>
                <span className="text-[24px] font-bold text-[#f59e0b]">{metrics.pendingTests}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#111111] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#7c5cff]" />
                  </div>
                  <div>
                    <p className="text-[14px] text-[#fafafa] font-medium">Running</p>
                    <p className="text-[12px] text-[#666666]">In progress</p>
                  </div>
                </div>
                <span className="text-[24px] font-bold text-[#7c5cff]">{metrics.runningTests}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#111111] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#00d4aa]" />
                  </div>
                  <div>
                    <p className="text-[14px] text-[#fafafa] font-medium">Completed</p>
                    <p className="text-[12px] text-[#666666]">This month</p>
                  </div>
                </div>
                <span className="text-[24px] font-bold text-[#00d4aa]">{metrics.completedTests}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Suggestions */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-[#fafafa]">Top A/B Test Suggestions</h2>
                <p className="text-[13px] text-[#666666] mt-1">AI-generated based on your data</p>
              </div>
              <Link
                href="/ab-tests"
                className="text-[13px] text-[#7c5cff] hover:text-[#a78bff] transition-colors flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="divide-y divide-white/5">
              {topSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="px-6 py-5 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium uppercase ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                        <span className="text-[12px] text-[#666666] flex items-center gap-1.5">
                          {getSourceIcon(suggestion.dataSource)}
                          {suggestion.dataSource.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-[15px] text-[#fafafa] font-medium mb-1">
                        {suggestion.element} - {suggestion.page}
                      </h3>
                      <p className="text-[13px] text-[#888888] mb-2">
                        {suggestion.hypothesis}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-[#00d4aa] font-medium">
                          Expected: {suggestion.expectedImpact}
                        </span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-[#7c5cff]/20 text-[#a78bff] text-[13px] font-medium rounded-lg hover:bg-[#7c5cff]/30 transition-all">
                      Start Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources & Devices */}
          <div className="space-y-6">
            {/* Traffic Sources */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
              <h2 className="text-[16px] font-semibold text-[#fafafa] mb-4">Traffic Sources</h2>
              <div className="space-y-3">
                {trafficSources.slice(0, 5).map((source) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#7c5cff] uppercase">
                        {source.source.charAt(0)}
                      </div>
                      <span className="text-[13px] text-[#fafafa] capitalize">{source.source}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] text-[#fafafa] font-medium">{source.sessions.toLocaleString()}</p>
                      <p className="text-[11px] text-[#00d4aa]">{source.conversionRate.toFixed(1)}% CVR</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
              <h2 className="text-[16px] font-semibold text-[#fafafa] mb-4">Devices</h2>
              <div className="space-y-3">
                {deviceBreakdown.map((device) => (
                  <div key={device.device}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] text-[#fafafa] capitalize">{device.device}</span>
                      <span className="text-[12px] text-[#666666]">{device.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] rounded-full"
                        style={{ width: `${device.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
