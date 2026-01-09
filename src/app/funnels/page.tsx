"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  ArrowRight,
  Brain,
  Smartphone,
  Monitor,
  Info,
  ExternalLink,
  Plus,
} from "lucide-react";
import type { CRODashboardData } from "@/lib/supabase-data";

export default function FunnelsListPage() {
  const [dashboardData, setDashboardData] = useState<CRODashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Funnels" breadcrumb={["Dashboard", "Funnels"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Funnels" breadcrumb={["Dashboard", "Funnels"]} />
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

  const { summary, trafficByDevice } = dashboardData;

  // Create pseudo-funnel data based on Clarity metrics
  const deviceFunnels = trafficByDevice.map(device => {
    const engagementRate = summary.avgActiveTime / summary.avgTotalTime;
    const estimatedConversion = engagementRate * (device.pages_per_session / 3) * 100;
    
    return {
      device: device.device,
      sessions: device.total_session_count,
      users: device.distinct_user_count,
      pagesPerSession: device.pages_per_session,
      estimatedEngagement: engagementRate * 100,
      potentialDropoff: 100 - estimatedConversion,
    };
  });

  return (
    <div className="min-h-screen bg-black">
      <Header title="Funnels" breadcrumb={["Dashboard", "Funnels"]} />

      <div className="p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-[#fafafa] mb-2">Conversion Funnels</h1>
            <p className="text-[15px] text-[#888888]">
              User journey analysis based on Clarity data
            </p>
          </div>
          <Link
            href="/explore-ai"
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
          >
            <Brain className="w-4 h-4" />
            AI Funnel Analysis
          </Link>
        </div>

        {/* Info Banner */}
        <div className="bg-[#0a0a0a] border border-[#7c5cff]/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#7c5cff]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-[#7c5cff]" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#fafafa] mb-2">
                Funnel Data from Clarity
              </h3>
              <p className="text-[14px] text-[#888888] mb-3">
                Currently showing engagement metrics by device. For custom conversion funnels, 
                configure goal tracking in Clarity or connect Google Analytics for detailed funnel data.
              </p>
              <Link
                href="/data-sources"
                className="text-[13px] text-[#7c5cff] hover:text-[#a78bff] transition-colors"
              >
                Configure Data Sources →
              </Link>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <span className="text-[13px] text-[#888888]">Total Sessions</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {summary.totalSessions.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#00d4aa]" />
              </div>
              <span className="text-[13px] text-[#888888]">Pages/Session</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {summary.avgPagesPerSession.toFixed(2)}
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[13px] text-[#888888]">Scroll Depth</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {summary.avgScrollDepth.toFixed(0)}%
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#ff6b6b]/20 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[#ff6b6b]" />
              </div>
              <span className="text-[13px] text-[#888888]">Mobile Traffic</span>
            </div>
            <p className="text-[28px] font-bold text-[#fafafa]">
              {summary.mobilePercentage.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Device Engagement Funnels */}
        <h2 className="text-[20px] font-semibold text-[#fafafa] mb-6">Engagement by Device</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {deviceFunnels.map((funnel) => {
            const isGoodEngagement = funnel.estimatedEngagement > 50;
            const color = funnel.device === 'Mobile' ? '#7c5cff' : 
                         funnel.device === 'Desktop' || funnel.device === 'PC' ? '#00d4aa' : '#f59e0b';
            
            return (
              <div
                key={funnel.device}
                className={`bg-[#0a0a0a] border-2 rounded-2xl p-8 transition-all ${
                  isGoodEngagement ? 'border-[#00d4aa]/30' : 'border-[#f59e0b]/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {funnel.device === 'Mobile' ? (
                      <Smartphone className="w-6 h-6" style={{ color }} />
                    ) : (
                      <Monitor className="w-6 h-6" style={{ color }} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-[#fafafa]">{funnel.device}</h3>
                    <p className="text-[12px] text-[#666666]">Engagement Funnel</p>
                  </div>
                </div>

                {/* Funnel Visualization */}
                <div className="space-y-4 mb-6">
                  {/* Step 1: Sessions */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] text-[#888888]">Sessions</span>
                      <span className="text-[14px] font-bold text-[#fafafa]">
                        {funnel.sessions.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: color }} />
                    </div>
                  </div>

                  {/* Step 2: Multi-page Sessions */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] text-[#888888]">Multi-page ({funnel.pagesPerSession.toFixed(1)} pg/s)</span>
                      <span className="text-[14px] font-bold text-[#fafafa]">
                        {Math.round(funnel.sessions * 0.7).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: color, opacity: 0.8 }} />
                    </div>
                    <span className="absolute right-0 -top-1 text-[10px] text-[#ff6b6b]">-30%</span>
                  </div>

                  {/* Step 3: Engaged */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] text-[#888888]">Engaged Users</span>
                      <span className="text-[14px] font-bold text-[#fafafa]">
                        {Math.round(funnel.sessions * (funnel.estimatedEngagement / 100)).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ width: `${funnel.estimatedEngagement}%`, backgroundColor: color, opacity: 0.6 }} 
                      />
                    </div>
                    <span className="absolute right-0 -top-1 text-[10px] text-[#ff6b6b]">
                      -{(100 - funnel.estimatedEngagement).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2a2a2a]">
                  <div>
                    <p className="text-[11px] text-[#666666] uppercase">Users</p>
                    <p className="text-[16px] font-bold text-[#fafafa]">
                      {funnel.users.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#666666] uppercase">Engagement</p>
                    <p className={`text-[16px] font-bold ${isGoodEngagement ? 'text-[#00d4aa]' : 'text-[#f59e0b]'}`}>
                      {funnel.estimatedEngagement.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA to Explore AI */}
        <div className="bg-gradient-to-r from-[#7c5cff]/20 via-[#00d4aa]/10 to-[#7c5cff]/20 border border-[#7c5cff]/30 rounded-2xl p-8 text-center">
          <Brain className="w-12 h-12 text-[#7c5cff] mx-auto mb-4" />
          <h3 className="text-[20px] font-semibold text-[#fafafa] mb-2">
            Get AI-Powered Funnel Insights
          </h3>
          <p className="text-[14px] text-[#888888] mb-6 max-w-lg mx-auto">
            Ask our AI to analyze your user journeys, identify drop-off points, and suggest 
            optimizations based on your Clarity data.
          </p>
          <Link
            href="/explore-ai"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white rounded-xl font-medium text-[14px] hover:shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            <Brain className="w-4 h-4" />
            Explore with AI
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
