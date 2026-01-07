"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
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
} from "lucide-react";
import {
  generateMockSessions,
  calculateDashboardMetrics,
  calculateDailyMetrics,
  calculateTrafficSources,
  calculateDeviceBreakdown,
  generateMockABTestSuggestions,
  DashboardMetrics,
  DailyMetric,
  TrafficSource,
  DeviceBreakdown,
  ABTestSuggestion,
} from "@/lib/mock-data";
import Link from "next/link";

export default function Home() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([]);
  const [topSuggestions, setTopSuggestions] = useState<ABTestSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      
      setMetrics(dashboardMetrics);
      setDailyMetrics(daily);
      setTrafficSources(sources);
      setDeviceBreakdown(devices);
      setTopSuggestions(suggestions.filter((s) => s.status === 'pending').slice(0, 3));
      
      setIsLoading(false);
    };

    loadData();
  }, []);

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
