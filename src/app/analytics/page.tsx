"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Clock,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  Zap,
  Brain,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { CRODashboardData } from "@/lib/supabase-data";

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<CRODashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/analytics-data');
        const result = await response.json();
        
        if (result.success) {
          setDashboardData(result.data);
        } else {
          setError(result.error || 'Failed to load data');
        }
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'desktop':
      case 'pc':
        return <Monitor className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Analytics" breadcrumb={["Dashboard", "Analytics"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading Clarity data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Analytics" breadcrumb={["Dashboard", "Analytics"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 p-6 bg-[#0a0a0a] border border-[#ff6b6b]/30 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-[#ff6b6b]" />
            <p className="text-[#ff6b6b] text-[14px]">{error || 'No data available'}</p>
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

  const { summary, trafficByDevice, uxIssues, engagementByDevice } = dashboardData;

  return (
    <div className="min-h-screen bg-black">
      <Header title="Analytics" breadcrumb={["Dashboard", "Analytics"]} />

      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-[#fafafa] mb-2">Analytics Overview</h1>
            <p className="text-[14px] text-[#666666]">
              Real-time data from Microsoft Clarity
            </p>
          </div>
          <Link
            href="/explore-ai"
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
          >
            <Brain className="w-4 h-4" />
            Explore with AI
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <span className="text-[13px] text-[#888888]">Total Sessions</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {summary.totalSessions.toLocaleString()}
            </p>
            <p className="text-[12px] text-[#666666] mt-1">
              {summary.totalUsers.toLocaleString()} unique users
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#00d4aa]" />
              </div>
              <span className="text-[13px] text-[#888888]">Pages/Session</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {summary.avgPagesPerSession.toFixed(2)}
            </p>
            <p className="text-[12px] text-[#666666] mt-1">
              Scroll depth: {summary.avgScrollDepth.toFixed(0)}%
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[13px] text-[#888888]">Active Time</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {formatDuration(summary.avgActiveTime)}
            </p>
            <p className="text-[12px] text-[#666666] mt-1">
              Total: {formatDuration(summary.avgTotalTime)}
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#ff6b6b]/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#ff6b6b]" />
              </div>
              <span className="text-[13px] text-[#888888]">UX Issues</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {(summary.totalDeadClicks + summary.totalRageClicks + summary.totalQuickbacks).toLocaleString()}
            </p>
            <p className="text-[12px] text-[#666666] mt-1">
              Clicks & quickbacks
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Traffic by Device */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-[18px] font-semibold text-[#fafafa]">Traffic by Device</h2>
              <p className="text-[13px] text-[#666666] mt-1">Sessions and users breakdown</p>
            </div>
            <div className="p-6 space-y-4">
              {trafficByDevice.map((device) => {
                const percentage = (device.total_session_count / summary.totalSessions) * 100;
                const color = device.device === 'Mobile' ? '#7c5cff' : 
                             device.device === 'Desktop' || device.device === 'PC' ? '#00d4aa' : '#f59e0b';
                
                return (
                  <div key={device.device} className="p-4 bg-[#111111] rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <div style={{ color }}>{getDeviceIcon(device.device)}</div>
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#fafafa]">{device.device}</p>
                          <p className="text-[12px] text-[#666666]">{percentage.toFixed(1)}% of traffic</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[16px] font-bold text-[#fafafa]">
                          {device.total_session_count.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-[#666666]">sessions</p>
                      </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-center">
                      <div>
                        <p className="text-[12px] text-[#888888]">Users</p>
                        <p className="text-[13px] font-medium text-[#fafafa]">
                          {device.distinct_user_count.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] text-[#888888]">Pages/Sess</p>
                        <p className="text-[13px] font-medium text-[#fafafa]">
                          {device.pages_per_session.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] text-[#888888]">Bots</p>
                        <p className="text-[13px] font-medium text-[#f59e0b]">
                          {device.total_bot_session_count.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* UX Issues by Device */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-[18px] font-semibold text-[#fafafa]">UX Issues by Device</h2>
              <p className="text-[13px] text-[#666666] mt-1">Click issues and user frustration</p>
            </div>
            <div className="divide-y divide-white/5">
              {uxIssues.slice(0, 10).map((issue, idx) => {
                const severity = issue.sessions_with_metric_percentage > 20 ? 'high' : 
                                issue.sessions_with_metric_percentage > 10 ? 'medium' : 'low';
                const severityColor = severity === 'high' ? '#ff6b6b' : 
                                     severity === 'medium' ? '#f59e0b' : '#00d4aa';
                
                return (
                  <div key={idx} className="px-6 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${severityColor}20` }}
                        >
                          {issue.metric_name.includes('Dead') ? (
                            <MousePointerClick className="w-4 h-4" style={{ color: severityColor }} />
                          ) : issue.metric_name.includes('Rage') ? (
                            <Zap className="w-4 h-4" style={{ color: severityColor }} />
                          ) : (
                            <AlertTriangle className="w-4 h-4" style={{ color: severityColor }} />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] text-[#fafafa] font-medium">
                            {issue.metric_name.replace('Count', '')}
                          </p>
                          <p className="text-[12px] text-[#666666]">{issue.device}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-[#fafafa]">
                          {issue.sub_total.toLocaleString()}
                        </p>
                        <p 
                          className="text-[11px] font-medium"
                          style={{ color: severityColor }}
                        >
                          {issue.sessions_with_metric_percentage}% of sessions
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
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="text-[18px] font-semibold text-[#fafafa]">Engagement by Device</h2>
            <p className="text-[13px] text-[#666666] mt-1">Time on site and engagement rates</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {engagementByDevice.map((device) => {
                const engagementRate = device.total_time > 0 
                  ? (device.active_time / device.total_time) * 100 
                  : 0;
                const isGood = engagementRate > 50;
                
                return (
                  <div key={device.device} className="p-6 bg-[#111111] rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                        {getDeviceIcon(device.device)}
                      </div>
                      <h3 className="text-[16px] font-semibold text-[#fafafa]">{device.device}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
                        <p className="text-[20px] font-bold text-[#fafafa]">
                          {formatDuration(device.total_time)}
                        </p>
                        <p className="text-[11px] text-[#888888]">Total Time</p>
                      </div>
                      <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
                        <p className="text-[20px] font-bold text-[#00d4aa]">
                          {formatDuration(device.active_time)}
                        </p>
                        <p className="text-[11px] text-[#888888]">Active Time</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[12px] mb-2">
                        <span className="text-[#888888]">Engagement Rate</span>
                        <span className={isGood ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'}>
                          {engagementRate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isGood ? 'bg-gradient-to-r from-[#7c5cff] to-[#00d4aa]' : 'bg-[#ff6b6b]'}`}
                          style={{ width: `${engagementRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* UX Issues Summary */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff6b6b]/5 border border-[#ff6b6b]/30 rounded-2xl p-6 text-center">
            <MousePointerClick className="w-8 h-8 text-[#ff6b6b] mx-auto mb-3" />
            <p className="text-[32px] font-bold text-[#fafafa]">
              {summary.totalDeadClicks.toLocaleString()}
            </p>
            <p className="text-[14px] text-[#888888]">Dead Clicks</p>
            <p className="text-[12px] text-[#666666] mt-2">
              Users clicking non-interactive elements
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-6 text-center">
            <Zap className="w-8 h-8 text-[#f59e0b] mx-auto mb-3" />
            <p className="text-[32px] font-bold text-[#fafafa]">
              {summary.totalRageClicks.toLocaleString()}
            </p>
            <p className="text-[14px] text-[#888888]">Rage Clicks</p>
            <p className="text-[12px] text-[#666666] mt-2">
              Frustrated repeated clicking
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-6 text-center">
            <TrendingUp className="w-8 h-8 text-[#7c5cff] mx-auto mb-3 rotate-180" />
            <p className="text-[32px] font-bold text-[#fafafa]">
              {summary.totalQuickbacks.toLocaleString()}
            </p>
            <p className="text-[14px] text-[#888888]">Quickbacks</p>
            <p className="text-[12px] text-[#666666] mt-2">
              Users quickly navigating back
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
