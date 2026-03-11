"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, TrendingUp, DollarSign, Target, RefreshCw, ChevronDown,
  ExternalLink, Eye, MousePointerClick, UserCheck, UserPlus,
  Smartphone, Monitor, Tablet, Globe, Share2, Search, Mail,
  Megaphone, ArrowRight, Copy, Check, Code, Brain, Route,
  Zap, Activity, ChevronRight, Clock, ArrowDown, Sparkles,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

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
    channel: string; medium: string; users: number;
    sessions: number; conversions: number; revenue: number;
  }>;
  lifecycleStages: { visitor: number; lead: number; customer: number; returning_customer: number };
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  recentUsers: Array<{
    user_id: string; first_seen_at: string; last_seen_at: string;
    total_sessions: number; total_pageviews: number; total_conversions: number;
    total_revenue: number; lifecycle_stage: string; first_touch_source: string;
    first_touch_medium: string; device: string; browser: string;
  }>;
}

interface AIInsightsData {
  totalAnalyses: number;
  avgEngagement: number;
  avgConfidence: number;
  intents: Array<{ name: string; value: number }>;
  segments: Array<{ name: string; value: number }>;
  predictions: Array<{ name: string; value: number }>;
  interventions: Array<{ name: string; total: number; executed: number; converted: number }>;
}

interface FunnelStep {
  name: string; order: number; visitors: number;
  dropoff: number; dropoffRate: number; conversionFromPrevious: number;
}

interface ScrollBand {
  range: string; from: number; to: number;
  usersReached: number; percentage: number;
}

interface TimelineEvent {
  event_type: string; timestamp: number; path: string; title: string;
  click_element_text: string; is_cta_click: boolean;
  scroll_percentage: number; form_field_name: string;
  form_action: string; funnel_step_name: string;
}

interface TouchpointData {
  id: string; touchpoint_type: string; source: string; medium: string;
  page_title: string; page_path: string; is_conversion: boolean;
  funnel_step_name: string; timestamp: number; touchpoint_order: number;
  conversion_value: number;
}

// ═══════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════

const INTENT_COLORS: Record<string, string> = {
  browsing: "#94a3b8", comparing: "#60a5fa", ready_to_buy: "#34d399",
  confused: "#fbbf24", leaving: "#f87171", researching: "#a78bfa",
  price_checking: "#fb923c", trust_seeking: "#2dd4bf", unknown: "#cbd5e1",
};

const SEGMENT_COLORS: Record<string, string> = {
  impulse_buyer: "#6366F1", researcher: "#06B6D4", price_sensitive: "#eab308",
  trust_seeker: "#8B5CF6", window_shopper: "#94a3b8", returning_prospect: "#10b981",
  unknown: "#cbd5e1",
};

const PIE_COLORS = ["#6366F1", "#06B6D4", "#10b981", "#8B5CF6", "#eab308", "#f43f5e", "#06b6d4", "#94a3b8"];

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

type TabId = "overview" | "channels" | "users" | "journey" | "ai" | "setup";

export default function AttributionPage() {
  const [data, setData] = useState<AttributionData | null>(null);
  const [aiData, setAIData] = useState<AIInsightsData | null>(null);
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [funnelList, setFunnelList] = useState<string[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string>("");
  const [scrollData, setScrollData] = useState<ScrollBand[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [touchpoints, setTouchpoints] = useState<TouchpointData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedTab, setSelectedTab] = useState<TabId>("overview");
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/attribution?days=${selectedPeriod}`);
      const result = await response.json();
      if (result.success) setData(result);
      else setError(result.error || "Failed to load data");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function fetchAIInsights() {
    try {
      const res = await fetch(`/api/attribution/ai-insights?days=${selectedPeriod}`);
      const result = await res.json();
      if (result.success) setAIData(result);
    } catch {}
  }

  async function fetchFunnels() {
    try {
      const res = await fetch(`/api/attribution/funnel?days=${selectedPeriod}`);
      const result = await res.json();
      if (result.success && result.funnels?.length > 0) {
        setFunnelList(result.funnels);
        if (!selectedFunnel) setSelectedFunnel(result.funnels[0]);
      }
    } catch {}
  }

  async function fetchFunnelSteps(fid: string) {
    try {
      const res = await fetch(`/api/attribution/funnel?funnel_id=${fid}&days=${selectedPeriod}`);
      const result = await res.json();
      if (result.success) setFunnelSteps(result.steps || []);
    } catch {}
  }

  async function fetchScroll() {
    try {
      const res = await fetch(`/api/attribution/scroll?days=${selectedPeriod}`);
      const result = await res.json();
      if (result.success) setScrollData(result.scrollBands || []);
    } catch {}
  }

  async function fetchUserJourney(uid: string) {
    try {
      const res = await fetch(`/api/attribution/journey?user_id=${uid}`);
      const result = await res.json();
      if (result.success) setTouchpoints(result.touchpoints || []);
    } catch {}
  }

  useEffect(() => {
    if (selectedTab === "ai") fetchAIInsights();
    if (selectedTab === "journey") { fetchFunnels(); fetchScroll(); }
  }, [selectedTab, selectedPeriod]);

  useEffect(() => {
    if (selectedFunnel) fetchFunnelSteps(selectedFunnel);
  }, [selectedFunnel]);

  useEffect(() => {
    if (selectedUserId) fetchUserJourney(selectedUserId);
  }, [selectedUserId]);

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

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
    const lc = (device || "").toLowerCase();
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
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(num);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function formatTimestamp(ts: number) {
    return new Date(ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function getEventIcon(type: string) {
    switch (type) {
      case "pageview": return <Eye className="w-4 h-4 text-blue-500" />;
      case "cta_click": return <MousePointerClick className="w-4 h-4 text-orange-500" />;
      case "click": return <MousePointerClick className="w-4 h-4 text-gray-400" />;
      case "scroll": return <ArrowDown className="w-4 h-4 text-purple-500" />;
      case "form_interaction": return <Code className="w-4 h-4 text-blue-400" />;
      case "form_submit": return <Check className="w-4 h-4 text-green-500" />;
      case "conversion": return <DollarSign className="w-4 h-4 text-green-600" />;
      case "rage_click": return <Zap className="w-4 h-4 text-red-500" />;
      case "dead_click": return <Target className="w-4 h-4 text-gray-300" />;
      case "exit_intent": return <ExternalLink className="w-4 h-4 text-red-400" />;
      case "funnel_step": return <Route className="w-4 h-4 text-indigo-500" />;
      case "ai_intervention": return <Brain className="w-4 h-4 text-violet-500" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  }

  function copyTrackingScript() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cro-agent.vercel.app";
    const script = `<!-- CRO AI Tracking + Attribution Script -->
<script>
  window.funnelId = "YOUR_FUNNEL_ID";
  window.funnelStep = "YOUR_STEP_NAME";
  window.croSupabaseUrl = "${process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL"}";
  window.croSupabaseKey = "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY"}";
</script>
<script src="${baseUrl}/cro-tracking-ai.js" defer></script>`;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-[#6366F1] animate-spin" />
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
              <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              Attribution & AI Intelligence
            </h1>
            <p className="mt-1" style={{ color: "var(--text-muted)" }}>First-party tracking, multi-touch attribution & AI behavioral analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={selectedPeriod} onChange={e => setSelectedPeriod(parseInt(e.target.value))}
                className="appearance-none rounded-xl px-4 py-2 pr-10 text-sm font-medium cursor-pointer transition-colors"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}>
                <option value={0}>Today</option>
                <option value={1}>Yesterday</option>
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#6366F1] text-white rounded-xl font-medium hover:bg-[#4F46E5] transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--bg-tertiary)" }}>
          {([
            { id: "overview", label: "Overview", icon: Eye },
            { id: "channels", label: "Channels", icon: Share2 },
            { id: "users", label: "Users", icon: Users },
            { id: "journey", label: "Journey", icon: Route },
            { id: "ai", label: "AI Intelligence", icon: Brain },
            { id: "setup", label: "Setup", icon: Code },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{
                backgroundColor: selectedTab === tab.id ? "var(--bg-card)" : "transparent",
                color: selectedTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: selectedTab === tab.id ? "var(--shadow-sm)" : "none",
              }}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>}

      <div className="p-8">
        {/* ═══ OVERVIEW TAB ═══ */}
        {selectedTab === "overview" && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: formatNumber(data.metrics.totalUsers), icon: Users, color: "blue", sub: <><span className="text-[#6366F1]"><UserPlus className="w-3 h-3 inline" /> {data.metrics.newUsers} new</span> <span className="text-purple-600 ml-2"><UserCheck className="w-3 h-3 inline" /> {data.metrics.returningUsers} returning</span></> },
                { label: "Sessions", value: formatNumber(data.metrics.totalSessions), icon: MousePointerClick, color: "purple", sub: `Avg ${data.metrics.avgSessionsPerUser} per user` },
                { label: "Conversions", value: data.metrics.totalConversions, icon: Target, color: "orange", sub: `${data.metrics.conversionRate}% conversion rate` },
                { label: "Revenue", value: formatCurrency(data.metrics.totalRevenue), icon: DollarSign, color: "amber", sub: `${data.metrics.touchpoints} touchpoints tracked` },
              ].map((card, idx) => (
                <div key={idx} className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 bg-${card.color}-100 rounded-xl flex items-center justify-center`}>
                      <card.icon className={`w-5 h-5 text-${card.color}-600`} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{card.label}</span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{card.value}</p>
                  <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Channel + Lifecycle */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Share2 className="w-5 h-5 text-[#6366F1]" /> Channel Attribution (First Touch)
                </h3>
                <div className="space-y-3">
                  {data.channelAttribution.length === 0 ? (
                    <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No data yet. Install the tracking script.</p>
                  ) : data.channelAttribution.map((ch, idx) => {
                    const maxUsers = Math.max(...data.channelAttribution.map(c => c.users));
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getChannelIcon(ch.channel)}
                            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{ch.channel}/{ch.medium}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span style={{ color: "var(--text-muted)" }}>{ch.users} users</span>
                            <span className="text-[#6366F1] font-medium">{formatCurrency(ch.revenue)}</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                          <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full transition-all duration-500"
                            style={{ width: `${(ch.users / maxUsers) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <TrendingUp className="w-5 h-5 text-[#6366F1]" /> Lifecycle Stages
                </h3>
                <div className="space-y-4">
                  {Object.entries(data.lifecycleStages).map(([stage, count]) => (
                    <div key={stage} className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getLifecycleColor(stage)}`}>{stage.replace("_", " ")}</span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border-primary)" }}>
                  <div className="space-y-2">
                    {Object.entries(data.lifecycleStages).map(([stage, count], idx) => {
                      const total = Object.values(data.lifecycleStages).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? (count / total) * 100 : 0;
                      const widths = [100, 75, 50, 35];
                      return (
                        <div key={stage} className={`h-8 rounded-lg flex items-center justify-center text-xs font-medium ${getLifecycleColor(stage)}`}
                          style={{ width: `${widths[idx] || 100}%`, margin: "0 auto" }}>
                          {pct.toFixed(1)}%
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Device & Browser */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Device Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  {data.deviceBreakdown.map(item => (
                    <div key={item.device} className="text-center p-4 rounded-xl" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                      <div className="flex justify-center mb-2">{getDeviceIcon(item.device)}</div>
                      <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{item.count}</p>
                      <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{item.device}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Browser Breakdown</h3>
                <div className="space-y-3">
                  {data.browserBreakdown.slice(0, 5).map(item => {
                    const total = data.browserBreakdown.reduce((a, b) => a + b.count, 0);
                    const pct = total > 0 ? (item.count / total) * 100 : 0;
                    return (
                      <div key={item.browser} className="flex items-center gap-3">
                        <div className="w-20 text-sm" style={{ color: "var(--text-muted)" }}>{item.browser}</div>
                        <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                          <div className="h-full bg-[#6366F1] rounded-full flex items-center justify-end pr-2" style={{ width: `${pct}%` }}>
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

        {/* ═══ CHANNELS TAB ═══ */}
        {selectedTab === "channels" && data && (
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
            <div className="p-6 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Channel Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <tr>
                    {["Channel", "Users", "Sessions", "Conversions", "Revenue", "Conv. Rate"].map(h => (
                      <th key={h} className={`${h === "Channel" ? "text-left" : "text-right"} px-6 py-3 text-xs font-semibold uppercase`} style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.channelAttribution.map((ch, idx) => (
                    <tr key={idx} className="border-t" style={{ borderColor: "var(--border-primary)" }}>
                      <td className="px-6 py-4"><div className="flex items-center gap-2">{getChannelIcon(ch.channel)}<span className="font-medium" style={{ color: "var(--text-primary)" }}>{ch.channel}</span><span style={{ color: "var(--text-muted)" }}>/ {ch.medium}</span></div></td>
                      <td className="px-6 py-4 text-right font-medium" style={{ color: "var(--text-primary)" }}>{ch.users}</td>
                      <td className="px-6 py-4 text-right" style={{ color: "var(--text-muted)" }}>{ch.sessions}</td>
                      <td className="px-6 py-4 text-right"><span className="px-2 py-1 bg-[#6366F1]/10 text-[#6366F1] rounded-lg text-sm font-medium">{ch.conversions}</span></td>
                      <td className="px-6 py-4 text-right font-semibold text-[#6366F1]">{formatCurrency(ch.revenue)}</td>
                      <td className="px-6 py-4 text-right" style={{ color: "var(--text-primary)" }}>{ch.users > 0 ? ((ch.conversions / ch.users) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ USERS TAB ═══ */}
        {selectedTab === "users" && data && (
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
            <div className="p-6 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Recent Users</h3>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Click a user to see their journey in the Journey tab</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <tr>
                    {["User ID", "First Seen", "Source", "Sessions", "Stage", "Revenue", ""].map(h => (
                      <th key={h} className={`${["Revenue"].includes(h) ? "text-right" : ["Sessions"].includes(h) ? "text-center" : "text-left"} px-6 py-3 text-xs font-semibold uppercase`} style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentUsers.map(user => (
                    <tr key={user.user_id} className="border-t cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                      style={{ borderColor: "var(--border-primary)" }}
                      onClick={() => { setSelectedUserId(user.user_id); setSelectedTab("journey"); }}>
                      <td className="px-6 py-4"><div className="flex items-center gap-2">{getDeviceIcon(user.device)}<span className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{user.user_id.substring(0, 20)}...</span></div></td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(user.first_seen_at)}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--text-primary)" }}>{user.first_touch_source || "direct"}/{user.first_touch_medium || "none"}</td>
                      <td className="px-6 py-4 text-center font-medium" style={{ color: "var(--text-primary)" }}>{user.total_sessions}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${getLifecycleColor(user.lifecycle_stage)}`}>{user.lifecycle_stage?.replace("_", " ")}</span></td>
                      <td className="px-6 py-4 text-right font-semibold text-[#6366F1]">{formatCurrency(parseFloat(user.total_revenue?.toString() || "0"))}</td>
                      <td className="px-6 py-4"><ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ JOURNEY TAB ═══ */}
        {selectedTab === "journey" && (
          <div className="space-y-6">
            {/* Funnel Visualization */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Route className="w-5 h-5 text-[#6366F1]" /> Funnel Visualization
                </h3>
                {funnelList.length > 0 && (
                  <select value={selectedFunnel} onChange={e => setSelectedFunnel(e.target.value)}
                    className="rounded-xl px-3 py-2 text-sm border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}>
                    {funnelList.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                )}
              </div>
              {funnelSteps.length === 0 ? (
                <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No funnel data yet. Make sure your pages track funnel steps.</p>
              ) : (
                <div className="space-y-1">
                  {funnelSteps.map((step, i) => {
                    const maxVisitors = funnelSteps[0]?.visitors || 1;
                    const widthPct = Math.max(20, (step.visitors / maxVisitors) * 100);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{step.name}</span>
                          <div className="flex items-center gap-3 text-sm">
                            <span style={{ color: "var(--text-primary)" }}>{step.visitors} visitors</span>
                            {i > 0 && <span className="text-red-500">{step.dropoffRate}% drop</span>}
                          </div>
                        </div>
                        <div className="relative h-10 rounded-lg overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                          <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center transition-all duration-700"
                            style={{ width: `${widthPct}%` }}>
                            <span className="text-white text-xs font-bold">
                              {i === 0 ? "100%" : `${step.conversionFromPrevious}%`}
                            </span>
                          </div>
                        </div>
                        {i < funnelSteps.length - 1 && (
                          <div className="flex justify-center py-1">
                            <ArrowDown className="w-4 h-4 text-red-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scroll Depth Map */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <ArrowDown className="w-5 h-5 text-purple-500" /> Scroll Depth Map
              </h3>
              {scrollData.length === 0 ? (
                <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No scroll data collected yet.</p>
              ) : (
                <div className="space-y-2">
                  {scrollData.map((band, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-16 text-right text-xs font-mono" style={{ color: "var(--text-muted)" }}>{band.range}</div>
                      <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                        <div className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                          style={{
                            width: `${band.percentage}%`,
                            background: `linear-gradient(90deg, #10b981 0%, ${band.percentage < 50 ? "#6366F1" : "#06B6D4"} 100%)`,
                          }}>
                          <span className="text-xs text-white font-medium whitespace-nowrap">
                            {band.usersReached} users ({band.percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Touchpoint Timeline */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Clock className="w-5 h-5 text-blue-500" /> User Touchpoint Journey
              </h3>
              {!selectedUserId ? (
                <div className="text-center py-8">
                  <p style={{ color: "var(--text-muted)" }}>Select a user from the Users tab to see their journey</p>
                  <button onClick={() => setSelectedTab("users")}
                    className="mt-3 px-4 py-2 bg-[#6366F1] text-white rounded-xl text-sm font-medium hover:bg-[#4F46E5] transition-colors">
                    Go to Users
                  </button>
                </div>
              ) : touchpoints.length === 0 ? (
                <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No touchpoints found for this user.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ backgroundColor: "var(--border-primary)" }} />
                  <div className="space-y-4">
                    {touchpoints.map((tp, i) => (
                      <div key={i} className="relative flex items-start gap-4 pl-12">
                        <div className={`absolute left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${tp.is_conversion ? "bg-green-500 border-green-500" : "border-[#6366F1]"}`}
                          style={{ backgroundColor: tp.is_conversion ? undefined : "var(--bg-card)" }}>
                          {tp.is_conversion && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getEventIcon(tp.touchpoint_type)}
                              <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{tp.touchpoint_type}</span>
                              {tp.is_conversion && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Conversion</span>}
                            </div>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatTimestamp(tp.timestamp)}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                            <span>{tp.source}/{tp.medium}</span>
                            {tp.page_title && <span>{tp.page_title}</span>}
                            {tp.funnel_step_name && <span className="text-indigo-500">Step: {tp.funnel_step_name}</span>}
                            {tp.is_conversion && tp.conversion_value > 0 && <span className="text-green-600 font-semibold">{formatCurrency(tp.conversion_value)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ AI INTELLIGENCE TAB ═══ */}
        {selectedTab === "ai" && (
          <div className="space-y-6">
            {/* AI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Total Analyses</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{aiData?.totalAnalyses || 0}</p>
              </div>
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Avg Engagement</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{aiData?.avgEngagement || 0}<span className="text-lg text-gray-400">/100</span></p>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all" style={{ width: `${aiData?.avgEngagement || 0}%` }} />
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Avg Confidence</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{aiData?.avgConfidence || 0}%</p>
              </div>
            </div>

            {/* Intent + Segment Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Eye className="w-5 h-5 text-blue-500" /> Detected Intents
                </h3>
                {!aiData?.intents?.length ? (
                  <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No AI analysis data yet. Enable AI in the tracking script.</p>
                ) : (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie data={aiData.intents} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                          {aiData.intents.map((entry, i) => (
                            <Cell key={i} fill={INTENT_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {aiData.intents.map((intent, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: INTENT_COLORS[intent.name] || PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span style={{ color: "var(--text-primary)" }}>{intent.name}</span>
                          <span className="ml-auto font-medium" style={{ color: "var(--text-muted)" }}>{intent.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Users className="w-5 h-5 text-purple-500" /> Behavioral Segments
                </h3>
                {!aiData?.segments?.length ? (
                  <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No segment data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={aiData.segments} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                      <YAxis type="category" dataKey="name" width={120} stroke="var(--text-muted)" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {aiData.segments.map((entry, i) => (
                          <Cell key={i} fill={SEGMENT_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Predictions + Interventions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <TrendingUp className="w-5 h-5 text-green-500" /> Predicted Actions
                </h3>
                {!aiData?.predictions?.length ? (
                  <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No prediction data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {aiData.predictions.map((pred, i) => {
                      const total = aiData.predictions.reduce((s, p) => s + p.value, 0);
                      const pct = total > 0 ? Math.round((pred.value / total) * 100) : 0;
                      const color = pred.name === "will_convert" ? "#10b981" : pred.name === "will_bounce" ? "#f43f5e" : pred.name === "needs_nudge" ? "#6366F1" : "#94a3b8";
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{pred.name.replace(/_/g, " ")}</span>
                            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{pred.value} ({pct}%)</span>
                          </div>
                          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Zap className="w-5 h-5 text-amber-500" /> AI Interventions
                </h3>
                {!aiData?.interventions?.length ? (
                  <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No interventions triggered yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {["Intervention", "Recommended", "Executed", "Converted"].map(h => (
                            <th key={h} className={`${h === "Intervention" ? "text-left" : "text-right"} py-2 px-3 text-xs font-semibold uppercase`} style={{ color: "var(--text-muted)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aiData.interventions.map((iv, i) => (
                          <tr key={i} className="border-t" style={{ borderColor: "var(--border-primary)" }}>
                            <td className="py-2 px-3 font-medium" style={{ color: "var(--text-primary)" }}>{iv.name.replace(/_/g, " ")}</td>
                            <td className="py-2 px-3 text-right" style={{ color: "var(--text-muted)" }}>{iv.total}</td>
                            <td className="py-2 px-3 text-right text-blue-500 font-medium">{iv.executed}</td>
                            <td className="py-2 px-3 text-right text-green-500 font-medium">{iv.converted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SETUP TAB ═══ */}
        {selectedTab === "setup" && (
          <div className="space-y-6">
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Code className="w-5 h-5 text-[#6366F1]" /> AI Tracking Script
                </h3>
                <button onClick={copyTrackingScript}
                  className="flex items-center gap-2 px-4 py-2 bg-[#6366F1] text-white rounded-xl font-medium hover:bg-[#4F46E5] transition-colors">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Script"}
                </button>
              </div>
              <p className="mb-4" style={{ color: "var(--text-muted)" }}>
                Add this script to your website for tracking, attribution, and AI-powered behavioral analysis.
              </p>
              <pre className="text-[#06B6D4] p-4 rounded-xl overflow-x-auto text-sm" style={{ backgroundColor: "var(--bg-tertiary)" }}>
{`<!-- CRO AI Tracking + Attribution Script -->
<script>
  window.funnelId = "YOUR_FUNNEL_ID";
  window.funnelStep = "YOUR_STEP_NAME";
  window.croSupabaseUrl = "${process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL"}";
  window.croSupabaseKey = "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY"}";
</script>
<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://cro-agent.vercel.app"}/cro-tracking-ai.js" defer></script>`}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Users, title: "Persistent User ID", description: "Track users across sessions with first-party cookies and localStorage" },
                { icon: Share2, title: "Multi-Touch Attribution", description: "First-touch, last-touch, linear, and AI-powered dynamic attribution" },
                { icon: Target, title: "Conversion Tracking", description: "Track purchases, leads, and custom conversions with revenue" },
                { icon: Brain, title: "AI Intent Detection", description: "Real-time behavioral analysis: intent, segment, engagement score" },
                { icon: Zap, title: "Smart Interventions", description: "AI-triggered popups, CTA highlights, exit offers, and social proof" },
                { icon: Sparkles, title: "AI Attribution", description: "Dynamic credit assignment based on actual user behavior, not rules" },
                { icon: Route, title: "Funnel Visualization", description: "Visual funnel with drop-off rates at each step" },
                { icon: Activity, title: "Scroll & Heatmap", description: "Scroll depth map and click heatmap data collection" },
                { icon: Globe, title: "UTM & Referrer Parsing", description: "Automatic detection of traffic sources with 12+ platforms" },
              ].map((feature, idx) => (
                <div key={idx} className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1]/10 to-[#06B6D4]/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-[#6366F1]" />
                  </div>
                  <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{feature.title}</h4>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <ArrowRight className="w-5 h-5 text-[#6366F1]" /> Setup Steps
              </h3>
              <ol className="space-y-3" style={{ color: "var(--text-muted)" }}>
                {[
                  "Run migration: migrations/add_attribution_tracking.sql",
                  "Run migration: migrations/add_ai_behavioral_intelligence.sql",
                  "Deploy Edge Functions: track-event, ai-analyze-behavior, ai-attribution, ai-recommend",
                  "Set GEMINI_API_KEY in Supabase Edge Function secrets",
                  "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local",
                  "Install the tracking script on your website",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#6366F1] text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
