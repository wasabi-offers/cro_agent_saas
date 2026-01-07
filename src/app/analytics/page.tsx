"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Eye,
  MousePointerClick,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import {
  generateMockSessions,
  generateMockPageMetrics,
  calculateDailyMetrics,
  calculateTrafficSources,
  calculateDeviceBreakdown,
  Session,
  PageMetrics,
  DailyMetric,
  TrafficSource,
  DeviceBreakdown,
} from "@/lib/mock-data";

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pageMetrics, setPageMetrics] = useState<PageMetrics[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '14d' | '30d'>('30d');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      const sessionsData = generateMockSessions();
      const pages = generateMockPageMetrics();
      const daily = calculateDailyMetrics(sessionsData);
      const sources = calculateTrafficSources(sessionsData);
      const devices = calculateDeviceBreakdown(sessionsData);
      
      setSessions(sessionsData);
      setPageMetrics(pages);
      setDailyMetrics(daily);
      setTrafficSources(sources);
      setDeviceBreakdown(devices);
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Analytics" breadcrumb={["Dashboard", "Analytics"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort pages by issues (rage clicks + dead clicks)
  const pagesWithIssues = [...pageMetrics]
    .sort((a, b) => (b.rageClicks + b.deadClicks) - (a.rageClicks + a.deadClicks))
    .slice(0, 5);

  // Top performing pages by conversion potential
  const topPages = [...pageMetrics]
    .sort((a, b) => b.pageViews - a.pageViews);

  return (
    <div className="min-h-screen bg-black">
      <Header title="Analytics" breadcrumb={["Dashboard", "Analytics"]} />

      <div className="p-10">
        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-8">
          {(['7d', '14d', '30d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-[#7c5cff] text-white'
                  : 'bg-[#111111] text-[#888888] hover:bg-[#1a1a1a] hover:text-[#fafafa]'
              }`}
            >
              Last {period.replace('d', ' days')}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <span className="text-[13px] text-[#888888]">Total Pageviews</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {pageMetrics.reduce((acc, p) => acc + p.pageViews, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#00d4aa]" />
              </div>
              <span className="text-[13px] text-[#888888]">Unique Visitors</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {pageMetrics.reduce((acc, p) => acc + p.uniqueVisitors, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[13px] text-[#888888]">Avg Time on Page</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {formatDuration(pageMetrics.reduce((acc, p) => acc + p.avgTimeOnPage, 0) / pageMetrics.length)}
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#ff6b6b]/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#ff6b6b]" />
              </div>
              <span className="text-[13px] text-[#888888]">UX Issues Found</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {pageMetrics.reduce((acc, p) => acc + p.rageClicks + p.deadClicks, 0)}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Pages with UX Issues */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-[18px] font-semibold text-[#fafafa]">Pages with UX Issues</h2>
              <p className="text-[13px] text-[#666666] mt-1">Based on rage clicks & dead clicks</p>
            </div>
            <div className="divide-y divide-white/5">
              {pagesWithIssues.map((page) => (
                <div key={page.page} className="px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[14px] text-[#fafafa] font-medium mb-1">{page.page}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-[#ff6b6b] flex items-center gap-1">
                          <MousePointerClick className="w-3.5 h-3.5" />
                          {page.rageClicks} rage clicks
                        </span>
                        <span className="text-[12px] text-[#f59e0b] flex items-center gap-1">
                          <MousePointerClick className="w-3.5 h-3.5" />
                          {page.deadClicks} dead clicks
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] text-[#fafafa]">{page.bounceRate.toFixed(1)}%</p>
                      <p className="text-[11px] text-[#666666]">bounce rate</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Pages Performance */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-[18px] font-semibold text-[#fafafa]">Page Performance</h2>
              <p className="text-[13px] text-[#666666] mt-1">All tracked pages</p>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-[#111111] sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#888888] uppercase">Page</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#888888] uppercase">Views</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#888888] uppercase">Bounce</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#888888] uppercase">Scroll</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topPages.map((page) => (
                    <tr key={page.page} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 text-[13px] text-[#fafafa]">{page.page}</td>
                      <td className="px-4 py-3 text-[13px] text-[#7c5cff] text-right font-medium">
                        {page.pageViews.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-right">
                        <span className={page.bounceRate > 50 ? 'text-[#ff6b6b]' : 'text-[#00d4aa]'}>
                          {page.bounceRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#888888] text-right">
                        {page.scrollDepth.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Traffic & Devices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Sources Table */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-[18px] font-semibold text-[#fafafa]">Traffic Sources</h2>
              <p className="text-[13px] text-[#666666] mt-1">Sessions by source</p>
            </div>
            <table className="w-full">
              <thead className="bg-[#111111]">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#888888] uppercase">Source</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#888888] uppercase">Sessions</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#888888] uppercase">Conv.</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#888888] uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trafficSources.map((source) => (
                  <tr key={source.source} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#7c5cff] uppercase">
                          {source.source.charAt(0)}
                        </div>
                        <span className="text-[13px] text-[#fafafa] capitalize">{source.source}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#fafafa] text-right">
                      {source.sessions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#00d4aa] text-right">
                      {source.conversionRate.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#f59e0b] text-right">
                      €{source.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Device Performance */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <h2 className="text-[18px] font-semibold text-[#fafafa] mb-2">Device Performance</h2>
            <p className="text-[13px] text-[#666666] mb-6">Conversion rate by device type</p>

            <div className="space-y-6">
              {deviceBreakdown.map((device) => (
                <div key={device.device}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] text-[#fafafa] capitalize font-medium">{device.device}</span>
                      <span className="text-[12px] text-[#666666]">{device.sessions.toLocaleString()} sessions</span>
                    </div>
                    <span className="text-[14px] text-[#00d4aa] font-medium">{device.conversionRate.toFixed(2)}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] rounded-full transition-all"
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#555555] mt-1">{device.percentage.toFixed(1)}% of total traffic</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


