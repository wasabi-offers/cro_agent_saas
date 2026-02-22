"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import {
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Globe,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  X,
  Tag,
  FileText,
  CheckCircle,
  PauseCircle,
  Archive,
  Camera,
  BarChart3,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowLeftRight,
  Loader2,
  Shield,
  Type,
  Layout,
  Palette,
  MousePointer,
  Navigation,
  DollarSign,
  Calendar,
  Activity,
  Layers,
  MapPin,
  Box,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
} from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  website_url: string;
  description?: string;
  category?: string;
  status: "active" | "paused" | "archived";
  logo_url?: string;
  notes?: string;
  last_analyzed_at?: string;
  last_cro_score?: number;
  total_changes_detected?: number;
  created_at: string;
  updated_at: string;
}

interface CROChangeItem {
  description: string;
  before?: string;
  after?: string;
  impact: "positive" | "negative" | "neutral";
  importance: "low" | "medium" | "high" | "critical";
}

interface PageElement {
  element_type: string;
  position: string;
  content: string;
  styling: string;
  cro_role: string;
}

interface PageSection {
  section_name: string;
  position: string;
  elements: PageElement[];
}

interface CROAnalysis {
  summary: string;
  is_baseline: boolean;
  changes_detected: boolean;
  severity: "none" | "minor" | "moderate" | "major";
  overall_impact: "positive" | "negative" | "neutral" | "mixed";
  cro_score: number;
  cro_score_previous?: number;
  page_structure?: {
    total_sections: number;
    page_height_estimate: string;
    sections: PageSection[];
  };
  categories: {
    text_changes: CROChangeItem[];
    layout_ux_changes: CROChangeItem[];
    visual_ui_changes: CROChangeItem[];
    cta_changes: CROChangeItem[];
    navigation_changes: CROChangeItem[];
    trust_signals: CROChangeItem[];
    pricing_offers: CROChangeItem[];
  };
  key_observations: string[];
  recommendations: string[];
  strategic_assumption?: string;
}

interface Snapshot {
  id: string;
  competitor_id: string;
  screenshot_base64?: string;
  captured_at: string;
  analysis_result: CROAnalysis;
  changes_detected: boolean;
  change_severity: string;
  change_summary: string;
  cro_score: number;
  previous_snapshot_id?: string;
  braintrust_span_id?: string;
}

const statusConfig = {
  active: {
    label: "Active",
    icon: CheckCircle,
    color: "#00d4aa",
    bg: "from-[#00d4aa]/20 to-[#00d4aa]/5",
    border: "#00d4aa",
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    color: "#f59e0b",
    bg: "from-[#f59e0b]/20 to-[#f59e0b]/5",
    border: "#f59e0b",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    color: "#888888",
    bg: "from-[#888888]/20 to-[#888888]/5",
    border: "#888888",
  },
};

const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
  none: { color: "#888888", bg: "bg-[#888888]/10", label: "No Changes" },
  minor: { color: "#3b82f6", bg: "bg-[#3b82f6]/10", label: "Minor" },
  moderate: { color: "#f59e0b", bg: "bg-[#f59e0b]/10", label: "Moderate" },
  major: { color: "#ef4444", bg: "bg-[#ef4444]/10", label: "Major" },
};

const impactConfig: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
  positive: { icon: TrendingUp, color: "#00d4aa", label: "Positive" },
  negative: { icon: TrendingDown, color: "#ef4444", label: "Negative" },
  neutral: { icon: Minus, color: "#888888", label: "Neutral" },
  mixed: { icon: Activity, color: "#f59e0b", label: "Mixed" },
};

const categoryOptions = [
  "E-commerce", "SaaS", "Marketplace", "Media", "Finance",
  "Health", "Education", "Travel", "Food & Beverage", "Other",
];

const categoryIcons: Record<string, typeof Type> = {
  text_changes: Type,
  layout_ux_changes: Layout,
  visual_ui_changes: Palette,
  cta_changes: MousePointer,
  navigation_changes: Navigation,
  trust_signals: Shield,
  pricing_offers: DollarSign,
};

const categoryLabels: Record<string, string> = {
  text_changes: "Text Changes",
  layout_ux_changes: "Layout & UX",
  visual_ui_changes: "Visual & UI",
  cta_changes: "CTA Changes",
  navigation_changes: "Navigation",
  trust_signals: "Trust Signals",
  pricing_offers: "Pricing & Offers",
};

export default function CompetitorMonitoringPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"competitors" | "cro-analysis">("competitors");

  const [analysisView, setAnalysisView] = useState<{
    competitor: Competitor;
    snapshots: Snapshot[];
    loading: boolean;
  } | null>(null);

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [recentChanges, setRecentChanges] = useState<Snapshot[]>([]);
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null);
  const [runningCron, setRunningCron] = useState(false);

  const [feedbackState, setFeedbackState] = useState<Record<string, { score?: number; comment: string; submitted: boolean; showComment: boolean }>>({});

  const handleFeedback = async (snapshotId: string, spanId: string, score: number) => {
    const current = feedbackState[snapshotId] || { comment: "", submitted: false, showComment: false };
    setFeedbackState((prev) => ({ ...prev, [snapshotId]: { ...current, score, showComment: true } }));
  };

  const submitFeedback = async (snapshotId: string, spanId: string) => {
    const state = feedbackState[snapshotId];
    if (!state || state.score === undefined) return;

    try {
      await fetch("/api/competitors/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spanId,
          score: state.score,
          comment: state.comment || undefined,
          snapshotId,
        }),
      });
      setFeedbackState((prev) => ({ ...prev, [snapshotId]: { ...state, submitted: true, showComment: false } }));
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    website_url: "",
    description: "",
    category: "",
    notes: "",
  });

  const loadCompetitors = async () => {
    try {
      const response = await fetch("/api/competitors", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompetitors(data.competitors || []);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error("Error loading competitors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentChanges = useCallback(async () => {
    setLoadingChanges(true);
    try {
      const response = await fetch(
        "/api/competitors/snapshots?limit=20&include_screenshot=false"
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecentChanges(data.snapshots || []);
        }
      }
    } catch (error) {
      console.error("Error loading changes:", error);
    } finally {
      setLoadingChanges(false);
    }
  }, []);

  useEffect(() => {
    loadCompetitors();
  }, []);

  useEffect(() => {
    if (activeTab === "cro-analysis") {
      loadRecentChanges();
    }
  }, [activeTab, loadRecentChanges]);

  const resetForm = () => {
    setFormData({ name: "", website_url: "", description: "", category: "", notes: "" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompetitors([data.competitor, ...competitors]);
          setShowCreateDialog(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error creating competitor:", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompetitor) return;
    try {
      const response = await fetch("/api/competitors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCompetitor.id, ...formData }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompetitors(competitors.map((c) => (c.id === editingCompetitor.id ? data.competitor : c)));
          setShowEditDialog(false);
          setEditingCompetitor(null);
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error updating competitor:", error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const response = await fetch(`/api/competitors?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (response.ok && data.success) {
        setCompetitors(competitors.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Error deleting competitor:", error);
    }
  };

  const handleToggleStatus = async (competitor: Competitor) => {
    const nextStatus = competitor.status === "active" ? "paused" : "active";
    try {
      const response = await fetch("/api/competitors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: competitor.id, status: nextStatus }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompetitors(competitors.map((c) => (c.id === competitor.id ? data.competitor : c)));
        }
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleOpenEdit = (competitor: Competitor) => {
    setEditingCompetitor(competitor);
    setFormData({
      name: competitor.name,
      website_url: competitor.website_url,
      description: competitor.description || "",
      category: competitor.category || "",
      notes: competitor.notes || "",
    });
    setShowEditDialog(true);
  };

  const handleAnalyzeSingle = async (competitor: Competitor) => {
    setAnalyzingId(competitor.id);
    try {
      const response = await fetch("/api/competitors/analyze-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitor_id: competitor.id }),
      });
      const data = await response.json();
      if (data.success) {
        loadCompetitors();
        if (activeTab === "cro-analysis") loadRecentChanges();
      } else {
        alert(`Analysis failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Error analyzing competitor:", error);
      alert("Failed to analyze competitor");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleRunCronManually = async () => {
    if (!confirm("Run CRO analysis for ALL active competitors? This may take a few minutes.")) return;
    setRunningCron(true);
    try {
      const response = await fetch("/api/competitors/cron-analyze");
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        loadCompetitors();
        if (activeTab === "cro-analysis") loadRecentChanges();
      } else {
        alert(`Cron failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Error running cron:", error);
      alert("Failed to run analysis");
    } finally {
      setRunningCron(false);
    }
  };

  const handleViewAnalysis = async (competitor: Competitor) => {
    setAnalysisView({ competitor, snapshots: [], loading: true });
    try {
      const response = await fetch(
        `/api/competitors/snapshots?competitor_id=${competitor.id}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysisView({ competitor, snapshots: data.snapshots || [], loading: false });
        }
      }
    } catch (error) {
      console.error("Error loading snapshots:", error);
      setAnalysisView((prev) => prev ? { ...prev, loading: false } : null);
    }
  };

  const filteredCompetitors = competitors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.website_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const activeCount = competitors.filter((c) => c.status === "active").length;
  const pausedCount = competitors.filter((c) => c.status === "paused").length;
  const changesCount = recentChanges.filter((s) => s.changes_detected).length;

  const getDomain = (url: string) => {
    try {
      return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  const getFaviconUrl = (url: string) => {
    const domain = getDomain(url);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  };

  const getCompetitorName = (competitorId: string) => {
    return competitors.find((c) => c.id === competitorId)?.name || "Unknown";
  };

  const getCompetitorUrl = (competitorId: string) => {
    return competitors.find((c) => c.id === competitorId)?.website_url || "";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="Competitor Monitoring" breadcrumb={["Dashboard", "Competitor Monitoring"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading competitors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header title="Competitor Monitoring" breadcrumb={["Dashboard", "Competitor Monitoring"]} />

      <div className="p-10 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-[#1a1a1a] mb-2">Competitor Monitoring</h1>
            <p className="text-[15px] text-[#888888]">Track competitors &amp; detect CRO changes with AI</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#00d4aa]/20 to-[#00d4aa]/5 border border-[#00d4aa]/30 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
                <span className="text-[13px] text-[#1a1a1a] font-semibold">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
            <button
              onClick={handleRunCronManually}
              disabled={runningCron}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 text-[#1a1a1a] text-[14px] font-medium rounded-xl hover:border-[#f59e0b]/50 transition-all disabled:opacity-50"
            >
              {runningCron ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {runningCron ? "Analyzing..." : "Run All Analysis"}
            </button>
            <button
              onClick={loadCompetitors}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 text-[#1a1a1a] text-[14px] font-medium rounded-xl hover:border-[#7c5cff]/50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Competitor
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-gradient-to-br from-[#7c5cff]/10 to-[#7c5cff]/5 border border-[#7c5cff]/20 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("competitors")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-[14px] font-medium transition-all ${
              activeTab === "competitors"
                ? "bg-white text-[#1a1a1a] shadow-sm"
                : "text-[#666666] hover:text-[#1a1a1a]"
            }`}
          >
            <Globe className="w-4 h-4" />
            Competitors ({competitors.length})
          </button>
          <button
            onClick={() => setActiveTab("cro-analysis")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-[14px] font-medium transition-all ${
              activeTab === "cro-analysis"
                ? "bg-white text-[#1a1a1a] shadow-sm"
                : "text-[#666666] hover:text-[#1a1a1a]"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            CRO Changes
            {changesCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-[#ef4444] text-white text-[11px] font-bold rounded-full">
                {changesCount}
              </span>
            )}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <span className="text-[13px] text-[#1a1a1a] font-bold">Total Competitors</span>
            </div>
            <p className="text-[28px] font-bold text-[#1a1a1a]">{competitors.length}</p>
          </div>

          <div className="bg-gradient-to-br from-[#00d4aa]/20 to-[#00d4aa]/5 border border-[#00d4aa]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#00d4aa]" />
              </div>
              <span className="text-[13px] text-[#1a1a1a] font-bold">Actively Monitored</span>
            </div>
            <p className="text-[28px] font-bold text-[#1a1a1a]">{activeCount}</p>
          </div>

          <div className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[13px] text-[#1a1a1a] font-bold">Paused</span>
            </div>
            <p className="text-[28px] font-bold text-[#1a1a1a]">{pausedCount}</p>
          </div>

          <div className="bg-gradient-to-br from-[#ef4444]/20 to-[#ef4444]/5 border border-[#ef4444]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#ef4444]/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
              </div>
              <span className="text-[13px] text-[#1a1a1a] font-bold">Recent Changes</span>
            </div>
            <p className="text-[28px] font-bold text-[#1a1a1a]">{changesCount}</p>
          </div>
        </div>

        {/* TAB: Competitors List */}
        {activeTab === "competitors" && (
          <>
            {/* Search & Filter */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                <input
                  type="text"
                  placeholder="Search competitors by name, URL, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#f8f9fa] border border-[#e0e0e0] rounded-xl text-[#1a1a1a] text-[14px] placeholder:text-[#999999] focus:outline-none focus:border-[#7c5cff] transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                {["all", "active", "paused", "archived"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-3 rounded-xl text-[13px] font-medium transition-all ${
                      filterStatus === status
                        ? "bg-[#7c5cff] text-white"
                        : "bg-[#f8f9fa] border border-[#e0e0e0] text-[#666666] hover:text-[#1a1a1a] hover:border-[#7c5cff]/40"
                    }`}
                  >
                    {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Competitors Table */}
            {filteredCompetitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Globe className="w-16 h-16 text-[#666666] mb-4" />
                <p className="text-[16px] text-[#888888] mb-2">No competitors found</p>
                <p className="text-[14px] text-[#666666]">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first competitor to start monitoring"}
                </p>
              </div>
            ) : (
              <div className="border border-[#e0e0e0] rounded-2xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-[#e0e0e0]">
                        <th className="text-left px-6 py-4 text-[12px] font-bold text-[#888888] uppercase tracking-wider">Brand</th>
                        <th className="text-left px-4 py-4 text-[12px] font-bold text-[#888888] uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-4 text-[12px] font-bold text-[#888888] uppercase tracking-wider">Created</th>
                        <th className="text-left px-4 py-4 text-[12px] font-bold text-[#888888] uppercase tracking-wider">Last Update</th>
                        <th className="text-center px-4 py-4 text-[12px] font-bold text-[#888888] uppercase tracking-wider">Days Running</th>
                        <th className="text-center px-4 py-4 text-[12px] font-bold text-[#888888] uppercase tracking-wider">CRO Score</th>
                        <th className="text-center px-4 py-4 text-[12px] font-bold text-[#888888] uppercase tracking-wider">N. of Updates</th>
                        <th className="text-center px-4 py-4 text-[12px] font-bold text-[#888888] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f0]">
                      {filteredCompetitors.map((competitor) => {
                        const sc = statusConfig[competitor.status];
                        const StatusIcon = sc.icon;
                        const isAnalyzing = analyzingId === competitor.id;
                        const createdDate = new Date(competitor.created_at);
                        const daysRunning = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                        const lastUpdateDate = competitor.last_analyzed_at ? new Date(competitor.last_analyzed_at) : null;

                        return (
                          <tr
                            key={competitor.id}
                            className="hover:bg-[#fafaff] transition-colors group"
                          >
                            {/* Brand */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#f8f9fa] flex items-center justify-center border border-[#e0e0e0] shrink-0 overflow-hidden">
                                  <img
                                    src={getFaviconUrl(competitor.website_url)}
                                    alt={competitor.name}
                                    className="w-5 h-5"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                                        '<div class="w-5 h-5 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded flex items-center justify-center text-white font-bold text-[10px]">' +
                                        competitor.name.charAt(0).toUpperCase() +
                                        "</div>";
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[14px] font-semibold text-[#1a1a1a] truncate">{competitor.name}</p>
                                  <a
                                    href={competitor.website_url.startsWith("http") ? competitor.website_url : `https://${competitor.website_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[12px] text-[#7c5cff] hover:underline inline-flex items-center gap-1"
                                  >
                                    {getDomain(competitor.website_url)}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4">
                              <button
                                onClick={() => handleToggleStatus(competitor)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-opacity hover:opacity-80"
                                style={{ backgroundColor: `${sc.color}15`, color: sc.color }}
                                title={competitor.status === "active" ? "Click to pause" : "Click to activate"}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {sc.label}
                              </button>
                            </td>

                            {/* Created */}
                            <td className="px-4 py-4">
                              <div>
                                <p className="text-[13px] text-[#1a1a1a]">{createdDate.toLocaleDateString()}</p>
                                <p className="text-[11px] text-[#aaaaaa]">{createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </td>

                            {/* Last Update */}
                            <td className="px-4 py-4">
                              {lastUpdateDate ? (
                                <div>
                                  <p className="text-[13px] text-[#1a1a1a]">{lastUpdateDate.toLocaleDateString()}</p>
                                  <p className="text-[11px] text-[#aaaaaa]">{lastUpdateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              ) : (
                                <span className="text-[12px] text-[#cccccc] italic">Never</span>
                              )}
                            </td>

                            {/* Days Running */}
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] border border-[#e0e0e0] rounded-lg text-[13px] font-semibold text-[#1a1a1a]">
                                <Clock className="w-3 h-3 text-[#7c5cff]" />
                                {daysRunning}d
                              </span>
                            </td>

                            {/* CRO Score */}
                            <td className="px-4 py-4 text-center">
                              {competitor.last_cro_score ? (
                                <span
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-bold"
                                  style={{
                                    backgroundColor: competitor.last_cro_score >= 70 ? '#00d4aa15' : competitor.last_cro_score >= 40 ? '#f59e0b15' : '#ef444415',
                                    color: competitor.last_cro_score >= 70 ? '#00d4aa' : competitor.last_cro_score >= 40 ? '#f59e0b' : '#ef4444',
                                  }}
                                >
                                  {competitor.last_cro_score}/100
                                </span>
                              ) : (
                                <span className="text-[12px] text-[#cccccc]">—</span>
                              )}
                            </td>

                            {/* Number of Updates */}
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7c5cff]/10 rounded-lg text-[13px] font-bold text-[#7c5cff]">
                                <Activity className="w-3 h-3" />
                                {competitor.total_changes_detected || 0}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleViewAnalysis(competitor)}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white text-[12px] font-semibold rounded-lg hover:opacity-90 transition-all"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Details
                                </button>
                                <button
                                  onClick={() => handleAnalyzeSingle(competitor)}
                                  disabled={isAnalyzing}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#7c5cff]/10 text-[#7c5cff] transition-colors disabled:opacity-50"
                                  title="Run CRO Analysis"
                                >
                                  {isAnalyzing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Camera className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(competitor)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#7c5cff]/10 text-[#666666] hover:text-[#7c5cff] transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(competitor.id, competitor.name)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#666666] hover:text-[#ff6b6b] transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#e0e0e0] flex items-center justify-between">
                  <p className="text-[12px] text-[#888888]">
                    {filteredCompetitors.length} competitor{filteredCompetitors.length !== 1 ? "s" : ""} shown
                  </p>
                  <p className="text-[12px] text-[#888888]">
                    {activeCount} active &middot; {pausedCount} paused
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB: CRO Analysis Dashboard */}
        {activeTab === "cro-analysis" && (
          <div>
            {loadingChanges ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-[#7c5cff] animate-spin" />
                  <p className="text-[#666666] text-[14px]">Loading CRO analysis data...</p>
                </div>
              </div>
            ) : recentChanges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Camera className="w-16 h-16 text-[#666666] mb-4" />
                <p className="text-[16px] text-[#888888] mb-2">No analysis data yet</p>
                <p className="text-[14px] text-[#666666] mb-6">
                  Run your first CRO analysis to start tracking competitor changes
                </p>
                <button
                  onClick={handleRunCronManually}
                  disabled={runningCron}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {runningCron ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {runningCron ? "Running Analysis..." : "Run First Analysis"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentChanges.map((snapshot) => {
                  const analysis = snapshot.analysis_result;
                  const severity = severityConfig[snapshot.change_severity] || severityConfig.none;
                  const impact = analysis ? impactConfig[analysis.overall_impact] || impactConfig.neutral : impactConfig.neutral;
                  const ImpactIcon = impact.icon;
                  const isExpanded = expandedSnapshot === snapshot.id;
                  const competitorUrl = getCompetitorUrl(snapshot.competitor_id);

                  return (
                    <div
                      key={snapshot.id}
                      className="bg-gradient-to-br from-white to-[#f8f8ff] border border-[#e0e0e0] rounded-2xl overflow-hidden transition-all hover:shadow-md"
                    >
                      {/* Snapshot Header */}
                      <div
                        className="p-6 cursor-pointer"
                        onClick={() => setExpandedSnapshot(isExpanded ? null : snapshot.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Favicon */}
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-[#e0e0e0] shrink-0 overflow-hidden">
                            {competitorUrl ? (
                              <img
                                src={getFaviconUrl(competitorUrl)}
                                alt=""
                                className="w-6 h-6"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <Globe className="w-5 h-5 text-[#888888]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-[16px] font-semibold text-[#1a1a1a]">
                                {getCompetitorName(snapshot.competitor_id)}
                              </h3>
                              <div
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${severity.bg}`}
                                style={{ color: severity.color }}
                              >
                                {snapshot.changes_detected ? (
                                  <AlertTriangle className="w-3 h-3" />
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                {severity.label}
                              </div>
                              <div
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                style={{ backgroundColor: `${impact.color}15`, color: impact.color }}
                              >
                                <ImpactIcon className="w-3 h-3" />
                                {impact.label} Impact
                              </div>
                              {snapshot.cro_score && (
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#7c5cff]/10 text-[#7c5cff] text-[11px] font-bold">
                                  CRO Score: {snapshot.cro_score}/100
                                </div>
                              )}
                            </div>
                            <p className="text-[13px] text-[#666666] line-clamp-1">
                              {snapshot.change_summary || "No changes detected"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-[12px] text-[#888888]">
                                <Calendar className="w-3 h-3" />
                                {new Date(snapshot.captured_at).toLocaleDateString()}
                              </div>
                              <p className="text-[11px] text-[#aaaaaa]">
                                {new Date(snapshot.captured_at).toLocaleTimeString()}
                              </p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-[#888888]" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-[#888888]" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Analysis */}
                      {isExpanded && analysis && (
                        <div className="border-t border-[#e0e0e0] bg-gradient-to-br from-[#f8f8ff] to-white">
                          {/* Summary Section */}
                          <div className="p-6 border-b border-[#e0e0e0]/50">
                            <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-[#7c5cff]" />
                              {analysis.is_baseline ? "Baseline CRO Audit" : "CRO Change Analysis"}
                            </h4>
                            <p className="text-[14px] text-[#444444] leading-relaxed">{analysis.summary}</p>

                            {analysis.cro_score_previous !== undefined && analysis.cro_score_previous !== null && (
                              <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-[#888888]/10 rounded-lg">
                                  <span className="text-[12px] text-[#888888] font-medium">Before:</span>
                                  <span className="text-[16px] font-bold text-[#888888]">{analysis.cro_score_previous}</span>
                                </div>
                                <ArrowLeftRight className="w-4 h-4 text-[#888888]" />
                                <div className="flex items-center gap-2 px-4 py-2 bg-[#7c5cff]/10 rounded-lg">
                                  <span className="text-[12px] text-[#7c5cff] font-medium">After:</span>
                                  <span className="text-[16px] font-bold text-[#7c5cff]">{analysis.cro_score}</span>
                                </div>
                                <div
                                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-bold"
                                  style={{
                                    backgroundColor: analysis.cro_score > analysis.cro_score_previous ? "#00d4aa20" : analysis.cro_score < analysis.cro_score_previous ? "#ef444420" : "#88888820",
                                    color: analysis.cro_score > analysis.cro_score_previous ? "#00d4aa" : analysis.cro_score < analysis.cro_score_previous ? "#ef4444" : "#888888",
                                  }}
                                >
                                  {analysis.cro_score > analysis.cro_score_previous ? (
                                    <><TrendingUp className="w-4 h-4" /> +{analysis.cro_score - analysis.cro_score_previous}</>
                                  ) : analysis.cro_score < analysis.cro_score_previous ? (
                                    <><TrendingDown className="w-4 h-4" /> {analysis.cro_score - analysis.cro_score_previous}</>
                                  ) : (
                                    <><Minus className="w-4 h-4" /> No change</>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Strategic Assumption */}
                          {analysis.strategic_assumption && (
                            <div className="p-6 border-b border-[#e0e0e0]/50">
                              <div className="bg-gradient-to-br from-[#f59e0b]/15 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-[#f59e0b]" />
                                  </div>
                                  <div>
                                    <h4 className="text-[15px] font-bold text-[#1a1a1a]">Why Did They Make This Change?</h4>
                                    <p className="text-[11px] text-[#888888] font-medium">AI Strategic Assumption — powered by Claude</p>
                                  </div>
                                </div>
                                <p className="text-[14px] text-[#333333] leading-relaxed pl-[52px] mb-4">
                                  {analysis.strategic_assumption}
                                </p>

                                {/* Feedback */}
                                {snapshot.braintrust_span_id && (
                                  <div className="pl-[52px]">
                                    {feedbackState[snapshot.id]?.submitted ? (
                                      <p className="text-[12px] text-[#00d4aa] font-medium flex items-center gap-1.5">
                                        <CheckCircle className="w-3.5 h-3.5" /> Feedback submitted — thank you!
                                      </p>
                                    ) : (
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                          <span className="text-[12px] text-[#888888] font-medium">Was this assumption accurate?</span>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleFeedback(snapshot.id, snapshot.braintrust_span_id!, 1); }}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                              feedbackState[snapshot.id]?.score === 1
                                                ? "bg-[#00d4aa] text-white"
                                                : "bg-white border border-[#e0e0e0] text-[#666666] hover:border-[#00d4aa] hover:text-[#00d4aa]"
                                            }`}
                                          >
                                            <ThumbsUp className="w-3.5 h-3.5" /> Yes
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleFeedback(snapshot.id, snapshot.braintrust_span_id!, 0); }}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                              feedbackState[snapshot.id]?.score === 0
                                                ? "bg-[#ef4444] text-white"
                                                : "bg-white border border-[#e0e0e0] text-[#666666] hover:border-[#ef4444] hover:text-[#ef4444]"
                                            }`}
                                          >
                                            <ThumbsDown className="w-3.5 h-3.5" /> No
                                          </button>
                                        </div>
                                        {feedbackState[snapshot.id]?.showComment && (
                                          <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999999]" />
                                              <input
                                                type="text"
                                                placeholder="Add a comment (optional)..."
                                                value={feedbackState[snapshot.id]?.comment || ""}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setFeedbackState((prev) => ({
                                                  ...prev, [snapshot.id]: { ...prev[snapshot.id], comment: e.target.value }
                                                }))}
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#bbbbbb] focus:outline-none focus:border-[#7c5cff] transition-all"
                                              />
                                            </div>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); submitFeedback(snapshot.id, snapshot.braintrust_span_id!); }}
                                              className="flex items-center gap-1.5 px-4 py-2 bg-[#7c5cff] text-white text-[12px] font-medium rounded-lg hover:opacity-90 transition-all"
                                            >
                                              <Send className="w-3 h-3" /> Send
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Change Categories */}
                          {analysis.categories && (
                            <div className="p-6 border-b border-[#e0e0e0]/50">
                              <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-4">Detailed Changes</h4>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {Object.entries(analysis.categories).map(([key, items]) => {
                                  const typedItems = items as CROChangeItem[];
                                  if (!typedItems || typedItems.length === 0) return null;
                                  const Icon = categoryIcons[key] || FileText;
                                  const label = categoryLabels[key] || key;

                                  return (
                                    <div
                                      key={key}
                                      className="bg-white border border-[#e0e0e0] rounded-xl p-4"
                                    >
                                      <div className="flex items-center gap-2 mb-3">
                                        <Icon className="w-4 h-4 text-[#7c5cff]" />
                                        <span className="text-[13px] font-bold text-[#1a1a1a]">{label}</span>
                                        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-[#7c5cff]/10 text-[#7c5cff] font-semibold">
                                          {typedItems.length} {typedItems.length === 1 ? "change" : "changes"}
                                        </span>
                                      </div>
                                      <div className="space-y-3">
                                        {typedItems.map((item, idx) => {
                                          const itemImpact = impactConfig[item.impact] || impactConfig.neutral;
                                          return (
                                            <div key={idx} className="text-[13px]">
                                              <p className="text-[#444444] mb-1">{item.description}</p>
                                              {(item.before || item.after) && (
                                                <div className="flex items-start gap-2 mt-1">
                                                  {item.before && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ef4444]/10 text-[#ef4444] rounded text-[11px] line-through">
                                                      {item.before}
                                                    </span>
                                                  )}
                                                  {item.before && item.after && (
                                                    <span className="text-[#888888] text-[11px] mt-0.5">&rarr;</span>
                                                  )}
                                                  {item.after && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00d4aa]/10 text-[#00d4aa] rounded text-[11px]">
                                                      {item.after}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                              <div className="flex items-center gap-2 mt-1">
                                                <span
                                                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                                  style={{ backgroundColor: `${itemImpact.color}15`, color: itemImpact.color }}
                                                >
                                                  {item.impact}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f0f0f0] text-[#888888] font-semibold">
                                                  {item.importance}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Page Structure Map */}
                          {analysis.page_structure && analysis.page_structure.sections && analysis.page_structure.sections.length > 0 && (
                            <div className="p-6 border-b border-[#e0e0e0]/50">
                              <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-2 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#7c5cff]" />
                                Full Page Element Map
                              </h4>
                              <p className="text-[12px] text-[#888888] mb-4">
                                {analysis.page_structure.total_sections} sections mapped — Est. height: {analysis.page_structure.page_height_estimate}
                              </p>

                              <div className="space-y-3">
                                {analysis.page_structure.sections.map((section, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="border border-[#e0e0e0] rounded-xl overflow-hidden"
                                  >
                                    <div className="px-4 py-3 bg-gradient-to-r from-[#7c5cff]/5 to-transparent flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Box className="w-4 h-4 text-[#7c5cff]" />
                                        <span className="text-[13px] font-bold text-[#1a1a1a]">
                                          {section.section_name}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-[#888888] font-mono flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {section.position}
                                      </span>
                                    </div>
                                    <div className="px-4 py-2">
                                      <div className="divide-y divide-[#f0f0f0]">
                                        {section.elements.map((el, elIdx) => (
                                          <div key={elIdx} className="py-2 grid grid-cols-12 gap-2 text-[12px]">
                                            <div className="col-span-2">
                                              <span className="inline-block px-2 py-0.5 rounded bg-[#7c5cff]/10 text-[#7c5cff] font-semibold text-[10px]">
                                                {el.element_type}
                                              </span>
                                            </div>
                                            <div className="col-span-4 text-[#1a1a1a]">
                                              {el.content}
                                            </div>
                                            <div className="col-span-3 text-[#888888]">
                                              {el.styling}
                                            </div>
                                            <div className="col-span-3">
                                              <span className="inline-block px-2 py-0.5 rounded bg-[#00d4aa]/10 text-[#00d4aa] font-semibold text-[10px]">
                                                {el.cro_role}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Key Observations & Recommendations */}
                          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {analysis.key_observations && analysis.key_observations.length > 0 && (
                              <div>
                                <h4 className="text-[14px] font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
                                  <Eye className="w-4 h-4 text-[#f59e0b]" />
                                  Key Observations
                                </h4>
                                <ul className="space-y-2">
                                  {analysis.key_observations.map((obs, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-[13px] text-[#444444]">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] mt-1.5 shrink-0" />
                                      {obs}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {analysis.recommendations && analysis.recommendations.length > 0 && (
                              <div>
                                <h4 className="text-[14px] font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-[#00d4aa]" />
                                  Recommendations
                                </h4>
                                <ul className="space-y-2">
                                  {analysis.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-[13px] text-[#444444]">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] mt-1.5 shrink-0" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analysis Detail Modal — Chronological Grid */}
      {analysisView && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-[1200px] w-full my-8 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] px-8 py-5 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                    <img
                      src={getFaviconUrl(analysisView.competitor.website_url)}
                      alt=""
                      className="w-6 h-6"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-white">
                      {analysisView.competitor.name}
                    </h2>
                    <p className="text-[13px] text-white/70">
                      {getDomain(analysisView.competitor.website_url)} — CRO Change Timeline
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!analysisView.loading && analysisView.snapshots.length > 0 && (
                    <span className="text-[13px] text-white/60">
                      {analysisView.snapshots.length} snapshot{analysisView.snapshots.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  <button
                    onClick={() => setAnalysisView(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {analysisView.loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#7c5cff] animate-spin" />
                    <p className="text-[#666666] text-[14px]">Loading timeline...</p>
                  </div>
                </div>
              ) : analysisView.snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Camera className="w-16 h-16 text-[#cccccc] mb-4" />
                  <p className="text-[16px] text-[#888888] mb-2">No snapshots yet</p>
                  <p className="text-[14px] text-[#aaaaaa] mb-6">
                    Run the first CRO analysis to start tracking changes
                  </p>
                  <button
                    onClick={() => { handleAnalyzeSingle(analysisView.competitor); setAnalysisView(null); }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    Analyze Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {analysisView.snapshots.map((snapshot) => {
                    const analysis = snapshot.analysis_result;
                    const severity = severityConfig[snapshot.change_severity] || severityConfig.none;
                    const impact = analysis ? impactConfig[analysis.overall_impact] || impactConfig.neutral : impactConfig.neutral;
                    const capturedDate = new Date(snapshot.captured_at);
                    const totalChanges = analysis?.categories
                      ? Object.values(analysis.categories).reduce((sum, arr) => sum + ((arr as CROChangeItem[])?.length || 0), 0)
                      : 0;

                    return (
                      <div
                        key={snapshot.id}
                        className="group border border-[#e0e0e0] rounded-2xl overflow-hidden bg-white hover:shadow-lg hover:border-[#7c5cff]/30 transition-all cursor-pointer"
                        onClick={() => setExpandedSnapshot(expandedSnapshot === snapshot.id ? null : snapshot.id)}
                      >
                        {/* Date Header */}
                        <div className="px-4 py-3 bg-[#f8f9fa] border-b border-[#e0e0e0] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#7c5cff]" />
                            <span className="text-[13px] font-bold text-[#1a1a1a]">
                              {capturedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#aaaaaa]">
                            {capturedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {/* Screenshot Thumbnail */}
                        <div className="relative aspect-[16/10] bg-[#f0f0f5] overflow-hidden">
                          {snapshot.screenshot_base64 ? (
                            <img
                              src={`data:image/jpeg;base64,${snapshot.screenshot_base64}`}
                              alt={`Snapshot ${capturedDate.toLocaleDateString()}`}
                              className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="w-8 h-8 text-[#cccccc]" />
                            </div>
                          )}
                          {/* Overlay badges */}
                          <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <div
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm"
                              style={{ backgroundColor: `${severity.color}20`, color: severity.color, border: `1px solid ${severity.color}40` }}
                            >
                              {snapshot.changes_detected ? <AlertTriangle className="w-2.5 h-2.5" /> : <CheckCircle className="w-2.5 h-2.5" />}
                              {severity.label}
                            </div>
                          </div>
                          {snapshot.cro_score > 0 && (
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[11px] font-bold bg-white/90 backdrop-blur-sm text-[#7c5cff] border border-[#7c5cff]/20">
                              {snapshot.cro_score}/100
                            </div>
                          )}
                          {analysis?.is_baseline && (
                            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#7c5cff] text-white">
                              BASELINE
                            </div>
                          )}
                        </div>

                        {/* Change Description */}
                        <div className="px-4 py-3">
                          <p className="text-[13px] text-[#1a1a1a] leading-snug line-clamp-2 mb-2">
                            {snapshot.change_summary || analysis?.summary || "No changes detected"}
                          </p>

                          {analysis?.strategic_assumption && (
                            <div className="flex items-start gap-2 p-2.5 bg-gradient-to-r from-[#f59e0b]/10 to-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-lg mb-2">
                              <Brain className="w-3.5 h-3.5 text-[#f59e0b] mt-0.5 shrink-0" />
                              <p className="text-[11px] text-[#666666] leading-snug line-clamp-2">
                                {analysis.strategic_assumption}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            {totalChanges > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#7c5cff]/10 text-[#7c5cff] rounded text-[11px] font-semibold">
                                <Activity className="w-2.5 h-2.5" />
                                {totalChanges} change{totalChanges !== 1 ? "s" : ""}
                              </span>
                            )}
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
                              style={{ backgroundColor: `${impact.color}10`, color: impact.color }}
                            >
                              {impact.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Expanded Snapshot Detail (inline below grid) */}
              {expandedSnapshot && analysisView.snapshots.find(s => s.id === expandedSnapshot) && (() => {
                const snap = analysisView.snapshots.find(s => s.id === expandedSnapshot)!;
                const snapAnalysis = snap.analysis_result;
                if (!snapAnalysis) return null;
                const snapSeverity = severityConfig[snap.change_severity] || severityConfig.none;

                return (
                  <div className="mt-8 border border-[#7c5cff]/30 rounded-2xl overflow-hidden bg-gradient-to-br from-[#fafaff] to-white">
                    {/* Detail Header */}
                    <div className="px-6 py-4 bg-gradient-to-r from-[#7c5cff]/10 to-transparent border-b border-[#7c5cff]/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-[#7c5cff]" />
                        <span className="text-[15px] font-bold text-[#1a1a1a]">
                          {new Date(snap.captured_at).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </span>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${snapSeverity.bg}`} style={{ color: snapSeverity.color }}>
                          {snapSeverity.label}
                        </div>
                        {snap.cro_score > 0 && (
                          <span className="text-[13px] font-bold text-[#7c5cff]">Score: {snap.cro_score}/100</span>
                        )}
                      </div>
                      <button onClick={() => setExpandedSnapshot(null)} className="text-[13px] text-[#888888] hover:text-[#1a1a1a] font-medium transition-colors">
                        Close
                      </button>
                    </div>

                    {/* Summary */}
                    <div className="px-6 py-4 border-b border-[#e0e0e0]/50">
                      <p className="text-[14px] text-[#444444] leading-relaxed">{snapAnalysis.summary}</p>

                      {snapAnalysis.cro_score_previous !== undefined && snapAnalysis.cro_score_previous !== null && (
                        <div className="flex items-center gap-3 mt-4">
                          <span className="text-[13px] text-[#888888]">Score:</span>
                          <span className="text-[14px] font-semibold text-[#888888]">{snapAnalysis.cro_score_previous}</span>
                          <ArrowLeftRight className="w-4 h-4 text-[#cccccc]" />
                          <span className="text-[14px] font-bold text-[#7c5cff]">{snapAnalysis.cro_score}</span>
                          <span
                            className="text-[13px] font-bold"
                            style={{ color: snapAnalysis.cro_score > snapAnalysis.cro_score_previous ? "#00d4aa" : snapAnalysis.cro_score < snapAnalysis.cro_score_previous ? "#ef4444" : "#888888" }}
                          >
                            ({snapAnalysis.cro_score > snapAnalysis.cro_score_previous ? "+" : ""}{snapAnalysis.cro_score - snapAnalysis.cro_score_previous})
                          </span>
                        </div>
                      )}

                    </div>

                    {/* Strategic Assumption */}
                    {snapAnalysis.strategic_assumption && (
                      <div className="px-6 py-5 border-b border-[#e0e0e0]/50">
                        <div className="bg-gradient-to-br from-[#f59e0b]/15 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center">
                              <Brain className="w-5 h-5 text-[#f59e0b]" />
                            </div>
                            <div>
                              <h4 className="text-[15px] font-bold text-[#1a1a1a]">Why Did They Make This Change?</h4>
                              <p className="text-[11px] text-[#888888] font-medium">AI Strategic Assumption — powered by Claude</p>
                            </div>
                          </div>
                          <p className="text-[14px] text-[#333333] leading-relaxed pl-[52px] mb-4">
                            {snapAnalysis.strategic_assumption}
                          </p>

                          {/* Feedback */}
                          {snap.braintrust_span_id && (
                            <div className="pl-[52px]">
                              {feedbackState[snap.id]?.submitted ? (
                                <p className="text-[12px] text-[#00d4aa] font-medium flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5" /> Feedback submitted — thank you!
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-[12px] text-[#888888] font-medium">Was this assumption accurate?</span>
                                    <button
                                      onClick={() => handleFeedback(snap.id, snap.braintrust_span_id!, 1)}
                                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                        feedbackState[snap.id]?.score === 1
                                          ? "bg-[#00d4aa] text-white"
                                          : "bg-white border border-[#e0e0e0] text-[#666666] hover:border-[#00d4aa] hover:text-[#00d4aa]"
                                      }`}
                                    >
                                      <ThumbsUp className="w-3.5 h-3.5" /> Yes
                                    </button>
                                    <button
                                      onClick={() => handleFeedback(snap.id, snap.braintrust_span_id!, 0)}
                                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                        feedbackState[snap.id]?.score === 0
                                          ? "bg-[#ef4444] text-white"
                                          : "bg-white border border-[#e0e0e0] text-[#666666] hover:border-[#ef4444] hover:text-[#ef4444]"
                                      }`}
                                    >
                                      <ThumbsDown className="w-3.5 h-3.5" /> No
                                    </button>
                                  </div>
                                  {feedbackState[snap.id]?.showComment && (
                                    <div className="flex items-center gap-2">
                                      <div className="relative flex-1">
                                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999999]" />
                                        <input
                                          type="text"
                                          placeholder="Add a comment (optional)..."
                                          value={feedbackState[snap.id]?.comment || ""}
                                          onChange={(e) => setFeedbackState((prev) => ({
                                            ...prev, [snap.id]: { ...prev[snap.id], comment: e.target.value }
                                          }))}
                                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#bbbbbb] focus:outline-none focus:border-[#7c5cff] transition-all"
                                        />
                                      </div>
                                      <button
                                        onClick={() => submitFeedback(snap.id, snap.braintrust_span_id!)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#7c5cff] text-white text-[12px] font-medium rounded-lg hover:opacity-90 transition-all"
                                      >
                                        <Send className="w-3 h-3" /> Send
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Change Categories */}
                    {snapAnalysis.categories && (
                      <div className="px-6 py-4 border-b border-[#e0e0e0]/50">
                        <h4 className="text-[14px] font-bold text-[#1a1a1a] mb-4">Detailed Changes</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {Object.entries(snapAnalysis.categories).map(([key, items]) => {
                            const typedItems = items as CROChangeItem[];
                            if (!typedItems || typedItems.length === 0) return null;
                            const Icon = categoryIcons[key] || FileText;
                            const label = categoryLabels[key] || key;
                            return (
                              <div key={key} className="bg-white border border-[#e0e0e0] rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Icon className="w-4 h-4 text-[#7c5cff]" />
                                  <span className="text-[13px] font-bold text-[#1a1a1a]">{label}</span>
                                  <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-[#7c5cff]/10 text-[#7c5cff] font-semibold">
                                    {typedItems.length}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {typedItems.map((item, idx) => (
                                    <div key={idx} className="text-[12px] text-[#444444]">
                                      <p>{item.description}</p>
                                      {(item.before || item.after) && (
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                          {item.before && <span className="px-1.5 py-0.5 bg-[#ef4444]/10 text-[#ef4444] rounded text-[11px] line-through">{item.before}</span>}
                                          {item.before && item.after && <span className="text-[#cccccc]">&rarr;</span>}
                                          {item.after && <span className="px-1.5 py-0.5 bg-[#00d4aa]/10 text-[#00d4aa] rounded text-[11px]">{item.after}</span>}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Observations & Recommendations */}
                    <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {snapAnalysis.key_observations && snapAnalysis.key_observations.length > 0 && (
                        <div>
                          <h4 className="text-[13px] font-bold text-[#1a1a1a] mb-2 flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-[#f59e0b]" /> Key Observations
                          </h4>
                          <ul className="space-y-1.5">
                            {snapAnalysis.key_observations.map((obs, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[12px] text-[#555555]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] mt-1.5 shrink-0" />{obs}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {snapAnalysis.recommendations && snapAnalysis.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-[13px] font-bold text-[#1a1a1a] mb-2 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-[#00d4aa]" /> Recommendations
                          </h4>
                          <ul className="space-y-1.5">
                            {snapAnalysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[12px] text-[#555555]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] mt-1.5 shrink-0" />{rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[22px] font-bold text-[#1a1a1a]">Add Competitor</h2>
              <button
                onClick={() => { setShowCreateDialog(false); resetForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 text-[#666666] hover:text-[#1a1a1a] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Competitor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Amazon, Shopify, Zalando..."
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Website URL *</label>
                <input
                  type="text"
                  required
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://www.example.com"
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] focus:outline-none focus:border-[#7c5cff] transition-all"
                >
                  <option value="">Select category...</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this competitor..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes about this competitor..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateDialog(false); resetForm(); }}
                  className="flex-1 px-5 py-3 bg-white/80 border border-[#7c5cff]/30 text-[#1a1a1a] text-[14px] font-medium rounded-xl hover:border-[#7c5cff]/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  Add Competitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && editingCompetitor && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[22px] font-bold text-[#1a1a1a]">Edit Competitor</h2>
              <button
                onClick={() => { setShowEditDialog(false); setEditingCompetitor(null); resetForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 text-[#666666] hover:text-[#1a1a1a] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Competitor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Website URL *</label>
                <input
                  type="text"
                  required
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] focus:outline-none focus:border-[#7c5cff] transition-all"
                >
                  <option value="">Select category...</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#1a1a1a] mb-2 font-semibold">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/80 border border-[#7c5cff]/30 rounded-xl text-[#1a1a1a] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditDialog(false); setEditingCompetitor(null); resetForm(); }}
                  className="flex-1 px-5 py-3 bg-white/80 border border-[#7c5cff]/30 text-[#1a1a1a] text-[14px] font-medium rounded-xl hover:border-[#7c5cff]/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
