"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import {
  MousePointerClick,
  ArrowDown,
  Eye,
  RefreshCw,
  Brain,
  AlertCircle,
  Smartphone,
  Monitor,
  Tablet,
  Zap,
  AlertTriangle,
  Info,
} from "lucide-react";
import type { CRODashboardData } from "@/lib/supabase-data";
import RAGInsightsPanel from "@/components/RAGInsightsPanel";

export default function HeatmapsPage() {
  const [dashboardData, setDashboardData] = useState<CRODashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/cro-analysis');
        const result = await response.json();
        
        if (result.success) {
          setDashboardData(result.data);
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
        return <Eye className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="Heatmaps" breadcrumb={["Dashboard", "Heatmaps"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#0F172A] text-[14px]">Loading click data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="Heatmaps" breadcrumb={["Dashboard", "Heatmaps"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-[#EF4444]/20 to-[#EF4444]/5 border border-[#EF4444]/30 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-[#EF4444]" />
            <p className="text-[#EF4444] text-[14px]">{error || 'No data available'}</p>
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

  const { summary, uxIssues, trafficByDevice } = dashboardData;

  // Filter issues by device
  const filteredIssues = selectedDevice === 'all' 
    ? uxIssues 
    : uxIssues.filter(i => i.device.toLowerCase() === selectedDevice.toLowerCase());

  // Group issues by type
  const deadClicks = filteredIssues.filter(i => i.metric_name === 'DeadClickCount');
  const rageClicks = filteredIssues.filter(i => i.metric_name === 'RageClickCount');
  const quickbacks = filteredIssues.filter(i => i.metric_name === 'QuickbackCount');
  const scriptErrors = filteredIssues.filter(i => i.metric_name === 'ScriptErrorCount');
  const excessiveScrolls = filteredIssues.filter(i => i.metric_name === 'ExcessiveScrollCount');

  return (
    <div className="min-h-screen bg-white">
      <Header title="Heatmaps" breadcrumb={["Dashboard", "Heatmaps"]} />

      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-[#0F172A] mb-2">Click & Interaction Data</h1>
            <p className="text-[14px] text-[#0F172A] font-semibold">
              User interaction patterns from Microsoft Clarity
            </p>
          </div>
          <Link
            href="/explore-ai"
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
          >
            <Brain className="w-4 h-4" />
            Analyze with AI
          </Link>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#6366F1]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-[#6366F1]" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#0F172A] mb-2">
                Clarity Click Insights
              </h3>
              <p className="text-[14px] text-[#0F172A] mb-3">
                This data comes from Microsoft Clarity which tracks dead clicks, rage clicks, and other 
                user frustration signals. For visual heatmaps, connect Crazy Egg or Hotjar in Data Sources.
              </p>
              <Link
                href="/data-sources"
                className="text-[13px] text-[#6366F1] hover:text-[#818CF8] transition-colors font-semibold"
              >
                Configure Data Sources →
              </Link>
            </div>
          </div>
        </div>

        {/* RAG CRO Insights */}
        <div className="mb-8">
          <RAGInsightsPanel
            defaultQuestion="How to interpret dead clicks and rage clicks in heatmaps? CRO best practices"
            placeholder="Ask RAG: heatmap interpretation, dead clicks, rage clicks..."
            title="RAG CRO - Heatmap Insights"
          />
        </div>

        {/* Device Filter */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-[13px] text-[#94A3B8] mr-2">Filter by device:</span>
          {['all', 'mobile', 'desktop', 'tablet'].map((device) => (
            <button
              key={device}
              onClick={() => setSelectedDevice(device)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all capitalize ${
                selectedDevice === device
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-white/60 text-[#0F172A] border border-[#6366F1]/30 hover:bg-white/80'
              }`}
            >
              {device === 'all' ? 'All Devices' : device}
            </button>
          ))}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-[#EF4444]/20 to-[#EF4444]/5 border border-[#EF4444]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#EF4444]/20 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-[#EF4444]" />
              </div>
              <span className="text-[13px] text-[#0F172A] font-bold">Dead Clicks</span>
            </div>
            <p className="text-[32px] font-bold text-[#0F172A]">
              {summary.totalDeadClicks.toLocaleString()}
            </p>
            <p className="text-[12px] text-[#0F172A] mt-1">
              Clicks on non-interactive elements
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[13px] text-[#0F172A] font-bold">Rage Clicks</span>
            </div>
            <p className="text-[32px] font-bold text-[#0F172A]">
              {summary.totalRageClicks.toLocaleString()}
            </p>
            <p className="text-[12px] text-[#0F172A] mt-1">
              Frustrated repeated clicking
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#6366F1]/20 rounded-lg flex items-center justify-center">
                <ArrowDown className="w-5 h-5 text-[#6366F1] rotate-180" />
              </div>
              <span className="text-[13px] text-[#94A3B8]">Quickbacks</span>
            </div>
            <p className="text-[32px] font-bold text-[#0F172A]">
              {summary.totalQuickbacks.toLocaleString()}
            </p>
            <p className="text-[12px] text-[#0F172A] mt-1">
              Quick navigation back
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#06B6D4]/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#06B6D4]" />
              </div>
              <span className="text-[13px] text-[#94A3B8]">Scroll Depth</span>
            </div>
            <p className="text-[32px] font-bold text-[#0F172A]">
              {summary.avgScrollDepth.toFixed(0)}%
            </p>
            <p className="text-[12px] text-[#0F172A] mt-1">
              Average page scroll
            </p>
          </div>
        </div>

        {/* Issues by Device */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Dead Clicks */}
          <div className="bg-[#0B0F19] border border-[#CBD5E1] rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-[#CBD5E1] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EF4444]/20 rounded-lg flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-[#EF4444]" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-[#0F172A]">Dead Clicks</h2>
                  <p className="text-[12px] text-[#64748B]">By device</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {deadClicks.length > 0 ? deadClicks.map((issue, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-[#EF4444]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#EF4444]/20 rounded-lg flex items-center justify-center">
                      {getDeviceIcon(issue.device)}
                    </div>
                    <span className="text-[14px] font-medium text-[#0F172A]">{issue.device}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-bold text-[#0F172A]">
                      {issue.sub_total.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#EF4444]">
                      {issue.sessions_with_metric_percentage}% of sessions
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-[14px] text-[#0F172A] text-center py-4">No data for selected filter</p>
              )}
            </div>
          </div>

          {/* Rage Clicks */}
          <div className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-[#f59e0b]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#f59e0b]" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#0F172A]">Rage Clicks</h2>
                  <p className="text-[12px] text-[#0F172A] font-semibold">User frustration</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {rageClicks.length > 0 ? rageClicks.map((issue, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-[#EF4444]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                      {getDeviceIcon(issue.device)}
                    </div>
                    <span className="text-[14px] font-medium text-[#0F172A]">{issue.device}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-bold text-[#0F172A]">
                      {issue.sub_total.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#f59e0b]">
                      {issue.sessions_with_metric_percentage}% of sessions
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-[14px] text-[#0F172A] text-center py-4">No data for selected filter</p>
              )}
            </div>
          </div>
        </div>

        {/* Script Errors Alert */}
        {scriptErrors.length > 0 && (
          <div className="bg-gradient-to-r from-[#EF4444]/20 to-[#EF4444]/5 border border-[#EF4444]/30 rounded-2xl p-6 mb-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#EF4444]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
              </div>
              <div className="flex-1">
                <h3 className="text-[16px] font-semibold text-[#0F172A] mb-2">
                  ⚠️ Script Errors Detected
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {scriptErrors.map((err, idx) => (
                    <div key={idx} className="bg-white/60 rounded-lg p-3 border border-[#6366F1]/20">
                      <div className="flex items-center gap-2 mb-1">
                        {getDeviceIcon(err.device)}
                        <span className="text-[13px] font-medium text-[#0F172A]">{err.device}</span>
                      </div>
                      <p className="text-[18px] font-bold text-[#EF4444]">
                        {err.sub_total.toLocaleString()} errors
                      </p>
                      <p className="text-[11px] text-[#0F172A]">
                        {err.sessions_with_metric_percentage}% of sessions affected
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/explore-ai"
                  className="text-[13px] text-[#EF4444] hover:text-[#ff8080] transition-colors font-medium"
                >
                  Get AI recommendations to fix these errors →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Traffic Distribution */}
        <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-2xl p-6">
          <h2 className="text-[18px] font-semibold text-[#0F172A] mb-6">Traffic by Device</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trafficByDevice.map((device) => {
              const percentage = (device.total_session_count / summary.totalSessions) * 100;
              const color = device.device === 'Mobile' ? '#6366F1' : 
                           device.device === 'Desktop' || device.device === 'PC' ? '#06B6D4' : '#f59e0b';
              
              return (
                <div key={device.device} className="p-6 bg-white/60 rounded-xl border border-[#6366F1]/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <div style={{ color }}>{getDeviceIcon(device.device)}</div>
                    </div>
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#0F172A]">{device.device}</h3>
                      <p className="text-[12px] text-[#0F172A]">{percentage.toFixed(1)}% of traffic</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white/80 rounded-lg border border-[#6366F1]/20">
                      <p className="text-[18px] font-bold text-[#0F172A]">
                        {device.total_session_count.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-[#0F172A] font-semibold">Sessions</p>
                    </div>
                    <div className="text-center p-3 bg-white/80 rounded-lg border border-[#6366F1]/20">
                      <p className="text-[18px] font-bold text-[#0F172A]">
                        {device.distinct_user_count.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-[#0F172A] font-semibold">Users</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
