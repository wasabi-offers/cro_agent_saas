"use client";

import { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Eye,
  MousePointerClick,
  UserCheck,
  UserPlus,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Share2,
  Search,
  Mail,
  Megaphone,
  ArrowRight,
  Copy,
  Check,
  Code,
} from "lucide-react";

interface AttributionData {
  metrics: {
    totalUsers: number;
    newUsers: number;
    returningUsers: number;
    totalSessions: number;
    totalConversions: number;
    totalRevenue: number;
    conversionRate: number;
    touchpoints: number;
    avgSessionsPerUser: string;
  };
  channelAttribution: Array<{
    channel: string;
    medium: string;
    users: number;
    sessions: number;
    conversions: number;
    revenue: number;
  }>;
  lifecycleStages: {
    visitor: number;
    lead: number;
    customer: number;
    returning_customer: number;
  };
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  recentUsers: Array<{
    user_id: string;
    first_seen_at: string;
    last_seen_at: string;
    total_sessions: number;
    total_pageviews: number;
    total_conversions: number;
    total_revenue: number;
    lifecycle_stage: string;
    first_touch_source: string;
    first_touch_medium: string;
    device: string;
    browser: string;
  }>;
}

export default function AttributionPage() {
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedTab, setSelectedTab] = useState<"overview" | "channels" | "users" | "setup">("overview");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/attribution?days=${selectedPeriod}`);
      const result = await response.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || "Failed to load data");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getChannelIcon(channel: string) {
    const lc = channel.toLowerCase();
    if (lc.includes("google")) return <Search className="w-4 h-4" />;
    if (lc.includes("facebook") || lc.includes("instagram")) return <Share2 className="w-4 h-4" />;
    if (lc.includes("email") || lc.includes("mail")) return <Mail className="w-4 h-4" />;
    if (lc.includes("ads") || lc.includes("cpc")) return <Megaphone className="w-4 h-4" />;
    if (lc === "direct") return <Globe className="w-4 h-4" />;
    return <ExternalLink className="w-4 h-4" />;
  }

  function getDeviceIcon(device: string) {
    const lc = device.toLowerCase();
    if (lc === "mobile") return <Smartphone className="w-5 h-5 text-blue-500" />;
    if (lc === "tablet") return <Tablet className="w-5 h-5 text-purple-500" />;
    return <Monitor className="w-5 h-5 text-gray-500" />;
  }

  function getLifecycleColor(stage: string) {
    switch (stage) {
      case "visitor": return "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
      case "lead": return "bg-blue-100 text-blue-700";
      case "customer": return "bg-amber-100 text-amber-700";
      case "returning_customer": return "bg-purple-100 text-purple-700";
      default: return "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
    }
  }

  function formatNumber(num: number) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }

  function formatCurrency(num: number) {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(num);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function copyTrackingScript() {
    const script = `<!-- CRO Attribution Tracking Script -->
<script>
  window.funnelId = "YOUR_FUNNEL_ID";
  window.funnelStep = "YOUR_STEP_NAME";
</script>
<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://cro-agent.vercel.app"}/cro-tracking-attribution.js" defer></script>`;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-[#F97316] animate-spin" />
          <p style={{ color: "var(--text-muted)" }}>Loading attribution data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen" style={{ backgroundColor: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="border-b px-8 py-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
              <div className="w-10 h-10 bg-gradient-to-br from-[#F97316] to-[#3b82f6] rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              Attribution
            </h1>
            <p className="mt-1" style={{ color: "var(--text-muted)" }}>First-party data tracking & multi-touch attribution</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="appearance-none rounded-xl px-4 py-2 pr-10 text-sm font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#F97316] text-white rounded-xl font-medium hover:bg-[#EA580C] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--bg-tertiary)" }}>
          {[
            { id: "overview", label: "Overview", icon: Eye },
            { id: "channels", label: "Channels", icon: Share2 },
            { id: "users", label: "Users", icon: Users },
            { id: "setup", label: "Setup", icon: Code },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{
                backgroundColor: selectedTab === tab.id ? "var(--bg-card)" : "transparent",
                color: selectedTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: selectedTab === tab.id ? "var(--shadow-sm)" : "none",
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <div className="p-8">
        {/* Overview Tab */}
        {selectedTab === "overview" && data && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Total Users</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{formatNumber(data.metrics.totalUsers)}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-[#F97316] flex items-center gap-1">
                    <UserPlus className="w-3 h-3" />
                    {data.metrics.newUsers} new
                  </span>
                  <span className="text-purple-600 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    {data.metrics.returningUsers} returning
                  </span>
                </div>
              </div>

              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <MousePointerClick className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Total Sessions</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{formatNumber(data.metrics.totalSessions)}</p>
                <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                  Avg {data.metrics.avgSessionsPerUser} per user
                </p>
              </div>

              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#F97316]/10 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#F97316]" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Conversions</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{data.metrics.totalConversions}</p>
                <p className="text-sm text-[#F97316] mt-2">
                  {data.metrics.conversionRate}% conversion rate
                </p>
              </div>

              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Revenue</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(data.metrics.totalRevenue)}</p>
                <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                  {data.metrics.touchpoints} touchpoints tracked
                </p>
              </div>
            </div>

            {/* Channel Attribution & Lifecycle */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Channel Attribution */}
              <div className="lg:col-span-2 rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Share2 className="w-5 h-5 text-[#F97316]" />
                  Channel Attribution (First Touch)
                </h3>
                <div className="space-y-3">
                  {data.channelAttribution.length === 0 ? (
                    <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No data yet. Install the tracking script to start collecting data.</p>
                  ) : (
                    data.channelAttribution.map((channel, idx) => {
                      const maxUsers = Math.max(...data.channelAttribution.map((c) => c.users));
                      const percentage = (channel.users / maxUsers) * 100;
                      return (
                        <div key={idx} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getChannelIcon(channel.channel)}
                              <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                                {channel.channel}/{channel.medium}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span style={{ color: "var(--text-muted)" }}>{channel.users} users</span>
                              <span style={{ color: "var(--text-muted)" }}>{channel.sessions} sessions</span>
                              <span className="text-[#F97316] font-medium">{formatCurrency(channel.revenue)}</span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                            <div
                              className="h-full bg-gradient-to-r from-[#F97316] to-[#3b82f6] rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Lifecycle Stages */}
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <TrendingUp className="w-5 h-5 text-[#F97316]" />
                  Lifecycle Stages
                </h3>
                <div className="space-y-4">
                  {Object.entries(data.lifecycleStages).map(([stage, count]) => (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getLifecycleColor(stage)}`}>
                          {stage.replace("_", " ")}
                        </span>
                      </div>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{count}</span>
                    </div>
                  ))}
                </div>

                {/* Lifecycle Funnel Visual */}
                <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border-primary)" }}>
                  <div className="space-y-2">
                    {Object.entries(data.lifecycleStages).map(([stage, count], idx) => {
                      const total = Object.values(data.lifecycleStages).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      const widths = [100, 75, 50, 35];
                      return (
                        <div
                          key={stage}
                          className={`h-8 rounded-lg flex items-center justify-center text-xs font-medium ${getLifecycleColor(stage)}`}
                          style={{ width: `${widths[idx] || 100}%`, marginLeft: "auto", marginRight: "auto" }}
                        >
                          {percentage.toFixed(1)}%
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Device & Browser */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Device Breakdown */}
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Device Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  {data.deviceBreakdown.map((item) => (
                    <div key={item.device} className="text-center p-4 rounded-xl" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                      <div className="flex justify-center mb-2">
                        {getDeviceIcon(item.device)}
                      </div>
                      <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{item.count}</p>
                      <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{item.device}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Browser Breakdown */}
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Browser Breakdown</h3>
                <div className="space-y-3">
                  {data.browserBreakdown.slice(0, 5).map((item) => {
                    const total = data.browserBreakdown.reduce((a, b) => a + b.count, 0);
                    const percentage = total > 0 ? (item.count / total) * 100 : 0;
                    return (
                      <div key={item.browser} className="flex items-center gap-3">
                        <div className="w-20 text-sm" style={{ color: "var(--text-muted)" }}>{item.browser}</div>
                        <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                          <div
                            className="h-full bg-[#F97316] rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-xs text-white font-medium">{item.count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Channels Tab */}
        {selectedTab === "channels" && data && (
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
            <div className="p-6 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Channel Performance</h3>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>First-touch attribution model</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Channel</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Users</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Sessions</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Conversions</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Revenue</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Conv. Rate</th>
                  </tr>
                </thead>
                <tbody style={{ borderColor: "var(--border-primary)" }}>
                  {data.channelAttribution.map((channel, idx) => (
                    <tr key={idx} className="transition-colors border-t" style={{ borderColor: "var(--border-primary)" }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(channel.channel)}
                          <span className="font-medium" style={{ color: "var(--text-primary)" }}>{channel.channel}</span>
                          <span style={{ color: "var(--text-muted)" }}>/ {channel.medium}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium" style={{ color: "var(--text-primary)" }}>{channel.users}</td>
                      <td className="px-6 py-4 text-right" style={{ color: "var(--text-muted)" }}>{channel.sessions}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2 py-1 bg-[#F97316]/10 text-[#F97316] rounded-lg text-sm font-medium">
                          {channel.conversions}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#F97316]">
                        {formatCurrency(channel.revenue)}
                      </td>
                      <td className="px-6 py-4 text-right" style={{ color: "var(--text-primary)" }}>
                        {channel.users > 0 ? ((channel.conversions / channel.users) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === "users" && data && (
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
            <div className="p-6 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Recent Users</h3>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Individual user tracking with complete journey</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>User ID</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>First Seen</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Source</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Sessions</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Pageviews</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Stage</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentUsers.map((user) => (
                    <tr key={user.user_id} className="transition-colors border-t" style={{ borderColor: "var(--border-primary)" }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(user.device || "desktop")}
                          <span className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                            {user.user_id.substring(0, 20)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                        {formatDate(user.first_seen_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                          {user.first_touch_source || "direct"}/{user.first_touch_medium || "none"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium" style={{ color: "var(--text-primary)" }}>{user.total_sessions}</td>
                      <td className="px-6 py-4 text-center" style={{ color: "var(--text-muted)" }}>{user.total_pageviews}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getLifecycleColor(user.lifecycle_stage)}`}>
                          {user.lifecycle_stage?.replace("_", " ") || "visitor"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#F97316]">
                        {formatCurrency(parseFloat(user.total_revenue?.toString() || "0"))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Setup Tab */}
        {selectedTab === "setup" && (
          <div className="space-y-6">
            {/* Tracking Script */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Code className="w-5 h-5 text-[#F97316]" />
                  Tracking Script
                </h3>
                <button
                  onClick={copyTrackingScript}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F97316] text-white rounded-xl font-medium hover:bg-[#EA580C] transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Script"}
                </button>
              </div>
              <p className="mb-4" style={{ color: "var(--text-muted)" }}>
                Add this script to your website to start tracking users with first-party data attribution.
              </p>
              <pre className="text-[#3b82f6] p-4 rounded-xl overflow-x-auto text-sm" style={{ backgroundColor: "var(--bg-tertiary)" }}>
{`<!-- CRO Attribution Tracking Script -->
<script>
  window.funnelId = "YOUR_FUNNEL_ID";
  window.funnelStep = "YOUR_STEP_NAME";
</script>
<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://cro-agent.vercel.app"}/cro-tracking-attribution.js" defer></script>`}
              </pre>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: Users,
                  title: "Persistent User ID",
                  description: "Track users across sessions with first-party cookies and localStorage"
                },
                {
                  icon: Share2,
                  title: "Multi-Touch Attribution",
                  description: "First-touch, last-touch, and linear attribution models"
                },
                {
                  icon: Target,
                  title: "Conversion Tracking",
                  description: "Track purchases, leads, and custom conversions"
                },
                {
                  icon: TrendingUp,
                  title: "Lifecycle Stages",
                  description: "Automatic progression from visitor to customer"
                },
                {
                  icon: Globe,
                  title: "UTM & Referrer Parsing",
                  description: "Automatic detection of traffic sources"
                },
                {
                  icon: MousePointerClick,
                  title: "Full Journey Tracking",
                  description: "Every click, scroll, and page view recorded"
                }
              ].map((feature, idx) => (
                <div key={idx} className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#F97316]/10 to-[#3b82f6]/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-[#F97316]" />
                  </div>
                  <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{feature.title}</h4>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Database Setup */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <ArrowRight className="w-5 h-5 text-[#F97316]" />
                Database Setup
              </h3>
              <ol className="space-y-3" style={{ color: "var(--text-muted)" }}>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#F97316] text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
                  <span>Open Supabase SQL Editor</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#F97316] text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
                  <span>Run the migration file: <code className="px-2 py-1 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>migrations/add_attribution_tracking.sql</code></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#F97316] text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
                  <span>Deploy the updated Edge Function to Supabase</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#F97316] text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">4</span>
                  <span>Install the tracking script on your website</span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
