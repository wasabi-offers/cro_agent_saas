"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import {
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Zap,
  MousePointerClick,
  BarChart3,
  TrendingUp,
  Clock,
  Link2,
  Brain,
} from "lucide-react";
import type { CRODashboardData } from "@/lib/supabase-data";

interface DataSource {
  id: string;
  name: string;
  type: 'clarity' | 'crazy_egg' | 'google_analytics' | 'supabase';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string | null;
  metrics: {
    sessions?: number;
    users?: number;
    records?: number;
  };
}

export default function DataSourcesPage() {
  const [dashboardData, setDashboardData] = useState<CRODashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

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

  // Build data sources from real data
  const dataSources: DataSource[] = dashboardData ? [
    {
      id: 'supabase',
      name: 'Supabase Database',
      type: 'supabase',
      status: 'connected',
      lastSync: new Date().toISOString(),
      metrics: {
        records: dashboardData.summary.totalSessions,
      }
    },
    {
      id: 'clarity',
      name: 'Microsoft Clarity',
      type: 'clarity',
      status: 'connected',
      lastSync: new Date().toISOString(),
      metrics: {
        sessions: dashboardData.summary.totalSessions,
        users: dashboardData.summary.totalUsers,
      }
    },
    {
      id: 'crazy_egg',
      name: 'Crazy Egg',
      type: 'crazy_egg',
      status: 'disconnected',
      lastSync: null,
      metrics: {}
    },
    {
      id: 'google_analytics',
      name: 'Google Analytics',
      type: 'google_analytics',
      status: 'disconnected',
      lastSync: null,
      metrics: {}
    },
  ] : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-[#00d4aa]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[#ff6b6b]" />;
      default:
        return <AlertCircle className="w-5 h-5 text-[#f59e0b]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30';
      case 'error':
        return 'bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30';
      default:
        return 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30';
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'clarity':
        return <MousePointerClick className="w-6 h-6" />;
      case 'crazy_egg':
        return <BarChart3 className="w-6 h-6" />;
      case 'google_analytics':
        return <TrendingUp className="w-6 h-6" />;
      case 'supabase':
        return <Database className="w-6 h-6" />;
      default:
        return <Database className="w-6 h-6" />;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'clarity':
        return 'from-[#0078d4] to-[#00a4ef]';
      case 'crazy_egg':
        return 'from-[#ff6b35] to-[#f7931e]';
      case 'google_analytics':
        return 'from-[#f59e0b] to-[#ea580c]';
      case 'supabase':
        return 'from-[#3ECF8E] to-[#24B47E]';
      default:
        return 'from-[#7c5cff] to-[#5b3fd9]';
    }
  };

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    // Simulate sync by reloading data
    try {
      const response = await fetch('/api/cro-analysis');
      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
    setSyncingId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Data Sources" breadcrumb={["Dashboard", "Data Sources"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading data sources...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Data Sources" breadcrumb={["Dashboard", "Data Sources"]} />
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

  const connectedSources = dataSources.filter((ds) => ds.status === 'connected').length;

  return (
    <div className="min-h-screen bg-black">
      <Header title="Data Sources" breadcrumb={["Dashboard", "Data Sources"]} />

      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-[#fafafa] mb-2">Data Sources</h1>
            <p className="text-[14px] text-[#666666]">
              Connected analytics integrations
            </p>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#5b3fd9] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/25">
            <Link2 className="w-4 h-4" />
            Add Integration
          </button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#00d4aa]/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#00d4aa]" />
              </div>
              <div>
                <p className="text-[28px] font-bold text-[#fafafa]">{connectedSources}</p>
                <p className="text-[13px] text-[#666666]">Connected</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#7c5cff]/20 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-[#7c5cff]" />
              </div>
              <div>
                <p className="text-[28px] font-bold text-[#fafafa]">
                  {dashboardData?.summary.totalSessions.toLocaleString() || '0'}
                </p>
                <p className="text-[13px] text-[#666666]">Total Sessions</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-[28px] font-bold text-[#fafafa]">Live</p>
                <p className="text-[13px] text-[#666666]">Data Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Sources List */}
        <div className="space-y-4">
          {dataSources.map((source) => (
            <div
              key={source.id}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-5">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getSourceColor(source.type)} flex items-center justify-center text-white`}>
                    {getSourceIcon(source.type)}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[18px] font-semibold text-[#fafafa]">{source.name}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize border ${getStatusColor(source.status)}`}>
                        {source.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mb-4">
                      <span className="text-[13px] text-[#666666] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Last sync: {formatLastSync(source.lastSync)}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="flex gap-6">
                      {source.metrics.sessions !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#7c5cff]" />
                          <span className="text-[13px] text-[#888888]">
                            <span className="text-[#fafafa] font-medium">{source.metrics.sessions.toLocaleString()}</span> sessions
                          </span>
                        </div>
                      )}
                      {source.metrics.users !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
                          <span className="text-[13px] text-[#888888]">
                            <span className="text-[#fafafa] font-medium">{source.metrics.users.toLocaleString()}</span> users
                          </span>
                        </div>
                      )}
                      {source.metrics.records !== undefined && !source.metrics.sessions && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#3ECF8E]" />
                          <span className="text-[13px] text-[#888888]">
                            <span className="text-[#fafafa] font-medium">{source.metrics.records.toLocaleString()}</span> records
                          </span>
                        </div>
                      )}
                      {source.status === 'disconnected' && (
                        <span className="text-[13px] text-[#666666]">Not configured</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {source.status === 'connected' ? (
                    <button
                      onClick={() => handleSync(source.id)}
                      disabled={syncingId === source.id}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] text-[#fafafa] text-[13px] font-medium rounded-lg hover:bg-[#1a1a1a] transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncingId === source.id ? 'animate-spin' : ''}`} />
                      {syncingId === source.id ? 'Syncing...' : 'Sync Now'}
                    </button>
                  ) : (
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#7c5cff]/20 text-[#a78bff] text-[13px] font-medium rounded-lg hover:bg-[#7c5cff]/30 transition-all">
                      <Link2 className="w-4 h-4" />
                      Connect
                    </button>
                  )}
                  <button className="p-2.5 bg-[#111111] text-[#888888] rounded-lg hover:bg-[#1a1a1a] hover:text-[#fafafa] transition-all">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add More Integrations */}
        <div className="mt-8">
          <h2 className="text-[18px] font-semibold text-[#fafafa] mb-4">Available Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Hotjar', description: 'Heatmaps & recordings', icon: '🔥' },
              { name: 'Mixpanel', description: 'Product analytics', icon: '📊' },
              { name: 'Amplitude', description: 'Behavioral analytics', icon: '📈' },
            ].map((integration) => (
              <div
                key={integration.name}
                className="bg-[#0a0a0a] border border-dashed border-white/20 rounded-xl p-5 hover:border-[#7c5cff]/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#111111] rounded-xl flex items-center justify-center text-[24px]">
                    {integration.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-[#fafafa] group-hover:text-[#7c5cff] transition-colors">
                      {integration.name}
                    </p>
                    <p className="text-[12px] text-[#666666]">{integration.description}</p>
                  </div>
                  <Link2 className="w-5 h-5 text-[#555555] group-hover:text-[#7c5cff] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Integration Info */}
        <div className="mt-8 bg-gradient-to-br from-[#7c5cff]/10 to-transparent border border-[#7c5cff]/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#7c5cff]/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#7c5cff]" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#fafafa] mb-2">AI-Powered Analysis</h3>
              <p className="text-[14px] text-[#888888] mb-4">
                Your data is automatically analyzed by Claude AI to provide actionable CRO insights, 
                A/B test suggestions, and optimization recommendations. All data is stored securely in Supabase.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/explore-ai"
                  className="px-4 py-2 bg-[#7c5cff]/20 text-[#a78bff] text-[13px] font-medium rounded-lg hover:bg-[#7c5cff]/30 transition-all"
                >
                  Explore AI Insights
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
