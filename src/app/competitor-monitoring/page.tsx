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
  Monitor,
  Smartphone,
  Brain,
  FolderPlus,
  Folder,
  Link,
  Upload,
  Check,
  AlertCircle,
  SkipForward,
} from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  website_url: string;
  description?: string;
  category?: string;
  folder?: string;
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
  device_type?: "desktop" | "mobile";
  viewport_width?: number;
  viewport_height?: number;
}

type DeviceFilter = "all" | "desktop" | "mobile";

const statusConfig = {
  active: {
    label: "Active",
    icon: CheckCircle,
    color: "#06B6D4",
    bg: "from-[#06B6D4]/20 to-[#06B6D4]/5",
    border: "#06B6D4",
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
    color: "#94A3B8",
    bg: "from-[#94A3B8]/20 to-[#94A3B8]/5",
    border: "#94A3B8",
  },
};

const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
  none: { color: "#94A3B8", bg: "bg-[#94A3B8]/10", label: "No Changes" },
  minor: { color: "#06B6D4", bg: "bg-[#06B6D4]/10", label: "Minor" },
  moderate: { color: "#f59e0b", bg: "bg-[#f59e0b]/10", label: "Moderate" },
  major: { color: "#ef4444", bg: "bg-[#ef4444]/10", label: "Major" },
};

const impactConfig: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
  positive: { icon: TrendingUp, color: "#06B6D4", label: "Positive" },
  negative: { icon: TrendingDown, color: "#ef4444", label: "Negative" },
  neutral: { icon: Minus, color: "#94A3B8", label: "Neutral" },
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

  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all");
  const [modalDeviceFilter, setModalDeviceFilter] = useState<DeviceFilter>("all");

  const [feedbackState, setFeedbackState] = useState<Record<string, { score?: number; comment: string; submitted: boolean; showComment: boolean }>>({});

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkFolder, setBulkFolder] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    summary: { created: number; duplicates: number; invalid: number; total: number };
    results: { url: string; status: "created" | "duplicate" | "invalid" }[];
  } | null>(null);
  const [filterFolder, setFilterFolder] = useState<string>("all");

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
    folder: "",
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
      const params = new URLSearchParams({ limit: "40", include_screenshot: "false" });
      const response = await fetch(`/api/competitors/snapshots?${params}`);
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
    setFormData({ name: "", website_url: "", description: "", category: "", notes: "", folder: "" });
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
      folder: competitor.folder || "",
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

  const handleBulkImport = async () => {
    const lines = bulkUrls
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setBulkImporting(true);
    setBulkResult(null);
    try {
      const response = await fetch("/api/competitors/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: lines,
          folder: bulkFolder.trim() || null,
          category: bulkCategory || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setBulkResult({ summary: data.summary, results: data.results });
        loadCompetitors();
      } else {
        alert(`Import failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Error bulk importing:", error);
      alert("Failed to import competitors");
    } finally {
      setBulkImporting(false);
    }
  };

  const resetBulkImport = () => {
    setBulkUrls("");
    setBulkFolder("");
    setBulkCategory("");
    setBulkResult(null);
    setShowBulkImport(false);
  };

  const folders = Array.from(
    new Set(competitors.map((c) => c.folder).filter((f): f is string => !!f))
  ).sort();

  const filteredCompetitors = competitors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.website_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.folder?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || c.status === filterStatus;
    const matchesFolder = filterFolder === "all" || (filterFolder === "none" ? !c.folder : c.folder === filterFolder);
    return matchesSearch && matchesFilter && matchesFolder;
  });

  const activeCount = competitors.filter((c) => c.status === "active").length;
  const pausedCount = competitors.filter((c) => c.status === "paused").length;
  const changesCount = recentChanges.filter((s) => s.changes_detected).length;

  const filteredChanges = deviceFilter === "all"
    ? recentChanges
    : recentChanges.filter((s) => (s.device_type || "desktop") === deviceFilter);

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
            <div className="w-10 h-10 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#64748B] text-[14px]">Loading competitors...</p>
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
            <h1 className="text-[24px] font-bold text-[#0F172A] mb-2">Competitor Monitoring</h1>
            <p className="text-[15px] text-[#94A3B8]">Track competitors &amp; detect CRO changes with AI</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
                <span className="text-[13px] text-[#0F172A] font-semibold">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
            <button
              onClick={handleRunCronManually}
              disabled={runningCron}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 text-[#0F172A] text-[14px] font-medium rounded-xl hover:border-[#f59e0b]/50 transition-all disabled:opacity-50"
            >
              {runningCron ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {runningCron ? "Analyzing..." : "Run All Analysis"}
            </button>
            <button
              onClick={loadCompetitors}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 text-[#0F172A] text-[14px] font-medium rounded-xl hover:border-[#6366F1]/50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Competitor
            </button>
            <button
              onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/5 border border-[#06B6D4]/30 text-[#0F172A] text-[14px] font-medium rounded-xl hover:border-[#06B6D4]/50 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              Bulk Import
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-gradient-to-br from-[#6366F1]/10 to-[#6366F1]/5 border border-[#6366F1]/20 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("competitors")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-[14px] font-medium transition-all ${
              activeTab === "competitors"
                ? "bg-white text-[#0F172A] shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Globe className="w-4 h-4" />
            Competitors ({competitors.length})
          </button>
          <button
            onClick={() => setActiveTab("cro-analysis")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-[14px] font-medium transition-all ${
              activeTab === "cro-analysis"
                ? "bg-white text-[#0F172A] shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
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
          <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#6366F1]/20 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#6366F1]" />
              </div>
              <span className="text-[13px] text-[#0F172A] font-bold">Total Competitors</span>
            </div>
            <p className="text-[24px] font-bold text-[#0F172A]">{competitors.length}</p>
          </div>

          <div className="bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#06B6D4]/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#06B6D4]" />
              </div>
              <span className="text-[13px] text-[#0F172A] font-bold">Actively Monitored</span>
            </div>
            <p className="text-[24px] font-bold text-[#0F172A]">{activeCount}</p>
          </div>

          <div className="bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[13px] text-[#0F172A] font-bold">Paused</span>
            </div>
            <p className="text-[24px] font-bold text-[#0F172A]">{pausedCount}</p>
          </div>

          <div className="bg-gradient-to-br from-[#ef4444]/20 to-[#ef4444]/5 border border-[#ef4444]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#ef4444]/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
              </div>
              <span className="text-[13px] text-[#0F172A] font-bold">Recent Changes</span>
            </div>
            <p className="text-[24px] font-bold text-[#0F172A]">{changesCount}</p>
          </div>
        </div>

        {/* TAB: Competitors List */}
        {activeTab === "competitors" && (
          <>
            {/* Search & Filter */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search competitors by name, URL, category, or folder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] text-[14px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#6366F1] transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                {["all", "active", "paused", "archived"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-3 rounded-xl text-[13px] font-medium transition-all ${
                      filterStatus === status
                        ? "bg-[#6366F1] text-white"
                        : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#6366F1]/40"
                    }`}
                  >
                    {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Folder Filter */}
            {folders.length > 0 && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <Folder className="w-4 h-4 text-[#94A3B8]" />
                <span className="text-[12px] text-[#94A3B8] font-semibold uppercase tracking-wider mr-1">Folders:</span>
                <button
                  onClick={() => setFilterFolder("all")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    filterFolder === "all"
                      ? "bg-[#06B6D4] text-white"
                      : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#06B6D4]/40"
                  }`}
                >
                  All
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setFilterFolder(folder)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                      filterFolder === folder
                        ? "bg-[#06B6D4] text-white"
                        : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#06B6D4]/40"
                    }`}
                  >
                    <Folder className="w-3 h-3" />
                    {folder}
                    <span className="text-[10px] opacity-70">
                      ({competitors.filter((c) => c.folder === folder).length})
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setFilterFolder("none")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    filterFolder === "none"
                      ? "bg-[#94A3B8] text-white"
                      : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8] hover:text-[#0F172A]"
                  }`}
                >
                  No Folder
                </button>
              </div>
            )}

            {/* Competitors Table */}
            {filteredCompetitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Globe className="w-16 h-16 text-[#64748B] mb-4" />
                <p className="text-[16px] text-[#94A3B8] mb-2">No competitors found</p>
                <p className="text-[14px] text-[#64748B]">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first competitor to start monitoring"}
                </p>
              </div>
            ) : (
              <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <th className="text-left px-6 py-4 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Brand</th>
                        <th className="text-left px-4 py-4 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Folder</th>
                        <th className="text-left px-4 py-4 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-4 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Created</th>
                        <th className="text-left px-4 py-4 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Last Update</th>
                        <th className="text-center px-4 py-4 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Days Running</th>
                        <th className="text-center px-4 py-4 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">CRO Score</th>
                        <th className="text-center px-4 py-4 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">N. of Updates</th>
                        <th className="text-center px-4 py-4 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredCompetitors.map((competitor) => {
                        const sc = statusConfig[competitor.status];
                        const StatusIcon = sc.icon;
                        const isAnalyzing = analyzingId === competitor.id;
                        const createdDate = new Date(competitor.created_at);
                        const daysRunningRaw = competitor.created_at ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
                        const daysRunning = daysRunningRaw !== null && !isNaN(daysRunningRaw) ? Math.max(0, daysRunningRaw) : null;
                        const lastUpdateDate = competitor.last_analyzed_at ? new Date(competitor.last_analyzed_at) : null;

                        return (
                          <tr
                            key={competitor.id}
                            className="hover:bg-[#fafaff] transition-colors group"
                          >
                            {/* Brand */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#F8FAFC] flex items-center justify-center border border-[#E2E8F0] shrink-0 overflow-hidden">
                                  <img
                                    src={getFaviconUrl(competitor.website_url)}
                                    alt={competitor.name}
                                    className="w-5 h-5"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                                        '<div class="w-5 h-5 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded flex items-center justify-center text-white font-bold text-[10px]">' +
                                        competitor.name.charAt(0).toUpperCase() +
                                        "</div>";
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[14px] font-semibold text-[#0F172A] truncate">{competitor.name}</p>
                                  <a
                                    href={competitor.website_url.startsWith("http") ? competitor.website_url : `https://${competitor.website_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[12px] text-[#6366F1] hover:underline inline-flex items-center gap-1"
                                  >
                                    {getDomain(competitor.website_url)}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4">
                              {competitor.folder ? (
                                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-[#06B6D4]/10 text-[#06B6D4]">
                                  <Folder className="w-3 h-3" />
                                  {competitor.folder}
                                </span>
                              ) : (
                                <span className="text-[12px] text-[#CBD5E1] italic">—</span>
                              )}
                            </td>

                            {/* Status Toggle */}
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
                                <p className="text-[13px] text-[#0F172A]">{createdDate.toLocaleDateString()}</p>
                                <p className="text-[11px] text-[#aaaaaa]">{createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </td>

                            {/* Last Update */}
                            <td className="px-4 py-4">
                              {lastUpdateDate ? (
                                <div>
                                  <p className="text-[13px] text-[#0F172A]">{lastUpdateDate.toLocaleDateString()}</p>
                                  <p className="text-[11px] text-[#aaaaaa]">{lastUpdateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              ) : (
                                <span className="text-[12px] text-[#CBD5E1] italic">Never</span>
                              )}
                            </td>

                            {/* Days Running */}
                            <td className="px-4 py-4 text-center">
                              {daysRunning !== null ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[13px] font-semibold text-[#0F172A]">
                                  <Clock className="w-3 h-3 text-[#6366F1]" />
                                  {daysRunning === 0 ? "Today" : `${daysRunning}d`}
                                </span>
                              ) : (
                                <span className="text-[12px] text-[#CBD5E1]">—</span>
                              )}
                            </td>

                            {/* CRO Score */}
                            <td className="px-4 py-4 text-center">
                              {competitor.last_cro_score ? (
                                <span
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-bold"
                                  style={{
                                    backgroundColor: competitor.last_cro_score >= 70 ? '#06B6D415' : competitor.last_cro_score >= 40 ? '#f59e0b15' : '#ef444415',
                                    color: competitor.last_cro_score >= 70 ? '#06B6D4' : competitor.last_cro_score >= 40 ? '#f59e0b' : '#ef4444',
                                  }}
                                >
                                  {competitor.last_cro_score}/100
                                </span>
                              ) : (
                                <span className="text-[12px] text-[#CBD5E1]">—</span>
                              )}
                            </td>

                            {/* Number of Updates */}
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6366F1]/10 rounded-lg text-[13px] font-bold text-[#6366F1]">
                                <Activity className="w-3 h-3" />
                                {competitor.total_changes_detected || 0}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleViewAnalysis(competitor)}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[12px] font-semibold rounded-lg hover:opacity-90 transition-all"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Details
                                </button>
                                <button
                                  onClick={() => handleAnalyzeSingle(competitor)}
                                  disabled={isAnalyzing}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#6366F1]/10 text-[#6366F1] transition-colors disabled:opacity-50"
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
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#6366F1]/10 text-[#64748B] hover:text-[#6366F1] transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(competitor.id, competitor.name)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748B] hover:text-[#EF4444] transition-colors"
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
                <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
                  <p className="text-[12px] text-[#94A3B8]">
                    {filteredCompetitors.length} competitor{filteredCompetitors.length !== 1 ? "s" : ""} shown
                  </p>
                  <p className="text-[12px] text-[#94A3B8]">
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
                  <Loader2 className="w-10 h-10 text-[#6366F1] animate-spin" />
                  <p className="text-[#64748B] text-[14px]">Loading CRO analysis data...</p>
                </div>
              </div>
            ) : recentChanges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Camera className="w-16 h-16 text-[#64748B] mb-4" />
                <p className="text-[16px] text-[#94A3B8] mb-2">No analysis data yet</p>
                <p className="text-[14px] text-[#64748B] mb-6">
                  Run your first CRO analysis to start tracking competitor changes
                </p>
                <button
                  onClick={handleRunCronManually}
                  disabled={runningCron}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {runningCron ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {runningCron ? "Running Analysis..." : "Run First Analysis"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Device Filter Toggle */}
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-[#94A3B8]">
                    {filteredChanges.length} snapshot{filteredChanges.length !== 1 ? "s" : ""}
                    {deviceFilter !== "all" && ` (${deviceFilter})`}
                  </p>
                  <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1">
                    {([
                      { id: "all" as DeviceFilter, label: "All", icon: null },
                      { id: "desktop" as DeviceFilter, label: "Desktop", icon: Monitor },
                      { id: "mobile" as DeviceFilter, label: "Mobile", icon: Smartphone },
                    ]).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setDeviceFilter(id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                          deviceFilter === id
                            ? "bg-white text-[#0F172A] shadow-sm"
                            : "text-[#94A3B8] hover:text-[#0F172A]"
                        }`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredChanges.map((snapshot) => {
                  const analysis = snapshot.analysis_result;
                  const severity = severityConfig[snapshot.change_severity] || severityConfig.none;
                  const impact = analysis ? impactConfig[analysis.overall_impact] || impactConfig.neutral : impactConfig.neutral;
                  const ImpactIcon = impact.icon;
                  const isExpanded = expandedSnapshot === snapshot.id;
                  const competitorUrl = getCompetitorUrl(snapshot.competitor_id);

                  return (
                    <div
                      key={snapshot.id}
                      className="bg-gradient-to-br from-white to-[#f8f8ff] border border-[#E2E8F0] rounded-2xl overflow-hidden transition-all hover:shadow-md"
                    >
                      {/* Snapshot Header */}
                      <div
                        className="p-6 cursor-pointer"
                        onClick={() => setExpandedSnapshot(isExpanded ? null : snapshot.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Favicon */}
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-[#E2E8F0] shrink-0 overflow-hidden">
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
                              <Globe className="w-5 h-5 text-[#94A3B8]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-[16px] font-semibold text-[#0F172A]">
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
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-bold">
                                  CRO Score: {snapshot.cro_score}/100
                                </div>
                              )}
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-semibold text-[#64748B]">
                                {(snapshot.device_type || "desktop") === "mobile" ? (
                                  <><Smartphone className="w-3 h-3" /> Mobile</>
                                ) : (
                                  <><Monitor className="w-3 h-3" /> Desktop</>
                                )}
                              </div>
                            </div>
                            <p className="text-[13px] text-[#64748B] line-clamp-1">
                              {snapshot.change_summary || "No changes detected"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-[12px] text-[#94A3B8]">
                                <Calendar className="w-3 h-3" />
                                {new Date(snapshot.captured_at).toLocaleDateString()}
                              </div>
                              <p className="text-[11px] text-[#aaaaaa]">
                                {new Date(snapshot.captured_at).toLocaleTimeString()}
                              </p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-[#94A3B8]" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-[#94A3B8]" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Analysis */}
                      {isExpanded && analysis && (
                        <div className="border-t border-[#E2E8F0] bg-gradient-to-br from-[#f8f8ff] to-white">
                          {/* Summary Section */}
                          <div className="p-6 border-b border-[#E2E8F0]/50">
                            <h4 className="text-[15px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-[#6366F1]" />
                              {analysis.is_baseline ? "Baseline CRO Audit" : "CRO Change Analysis"}
                            </h4>
                            <p className="text-[14px] text-[#334155] leading-relaxed">{analysis.summary}</p>

                            {analysis.cro_score_previous !== undefined && analysis.cro_score_previous !== null && (
                              <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-[#94A3B8]/10 rounded-lg">
                                  <span className="text-[12px] text-[#94A3B8] font-medium">Before:</span>
                                  <span className="text-[16px] font-bold text-[#94A3B8]">{analysis.cro_score_previous}</span>
                                </div>
                                <ArrowLeftRight className="w-4 h-4 text-[#94A3B8]" />
                                <div className="flex items-center gap-2 px-4 py-2 bg-[#6366F1]/10 rounded-lg">
                                  <span className="text-[12px] text-[#6366F1] font-medium">After:</span>
                                  <span className="text-[16px] font-bold text-[#6366F1]">{analysis.cro_score}</span>
                                </div>
                                <div
                                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-bold"
                                  style={{
                                    backgroundColor: analysis.cro_score > analysis.cro_score_previous ? "#06B6D420" : analysis.cro_score < analysis.cro_score_previous ? "#ef444420" : "#94A3B820",
                                    color: analysis.cro_score > analysis.cro_score_previous ? "#06B6D4" : analysis.cro_score < analysis.cro_score_previous ? "#ef4444" : "#94A3B8",
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
                            <div className="p-6 border-b border-[#E2E8F0]/50">
                              <div className="bg-gradient-to-br from-[#f59e0b]/15 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-[#f59e0b]" />
                                  </div>
                                  <div>
                                    <h4 className="text-[15px] font-bold text-[#0F172A]">Why Did They Make This Change?</h4>
                                    <p className="text-[11px] text-[#94A3B8] font-medium">AI Strategic Assumption — powered by Claude</p>
                                  </div>
                                </div>
                                <p className="text-[14px] text-[#334155] leading-relaxed pl-[52px] mb-4">
                                  {analysis.strategic_assumption}
                                </p>

                                {/* Feedback */}
                                {snapshot.braintrust_span_id && (
                                  <div className="pl-[52px]">
                                    {feedbackState[snapshot.id]?.submitted ? (
                                      <p className="text-[12px] text-[#06B6D4] font-medium flex items-center gap-1.5">
                                        <CheckCircle className="w-3.5 h-3.5" /> Feedback submitted — thank you!
                                      </p>
                                    ) : (
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                          <span className="text-[12px] text-[#94A3B8] font-medium">Was this assumption accurate?</span>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleFeedback(snapshot.id, snapshot.braintrust_span_id!, 1); }}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                              feedbackState[snapshot.id]?.score === 1
                                                ? "bg-[#06B6D4] text-white"
                                                : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#06B6D4] hover:text-[#06B6D4]"
                                            }`}
                                          >
                                            <ThumbsUp className="w-3.5 h-3.5" /> Yes
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleFeedback(snapshot.id, snapshot.braintrust_span_id!, 0); }}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                              feedbackState[snapshot.id]?.score === 0
                                                ? "bg-[#ef4444] text-white"
                                                : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#ef4444] hover:text-[#ef4444]"
                                            }`}
                                          >
                                            <ThumbsDown className="w-3.5 h-3.5" /> No
                                          </button>
                                        </div>
                                        {feedbackState[snapshot.id]?.showComment && (
                                          <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                                              <input
                                                type="text"
                                                placeholder="Add a comment (optional)..."
                                                value={feedbackState[snapshot.id]?.comment || ""}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setFeedbackState((prev) => ({
                                                  ...prev, [snapshot.id]: { ...prev[snapshot.id], comment: e.target.value }
                                                }))}
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[12px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#6366F1] transition-all"
                                              />
                                            </div>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); submitFeedback(snapshot.id, snapshot.braintrust_span_id!); }}
                                              className="flex items-center gap-1.5 px-4 py-2 bg-[#6366F1] text-white text-[12px] font-medium rounded-lg hover:opacity-90 transition-all"
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
                            <div className="p-6 border-b border-[#E2E8F0]/50">
                              <h4 className="text-[15px] font-bold text-[#0F172A] mb-4">Detailed Changes</h4>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {Object.entries(analysis.categories).map(([key, items]) => {
                                  const typedItems = items as CROChangeItem[];
                                  if (!typedItems || typedItems.length === 0) return null;
                                  const Icon = categoryIcons[key] || FileText;
                                  const label = categoryLabels[key] || key;

                                  return (
                                    <div
                                      key={key}
                                      className="bg-white border border-[#E2E8F0] rounded-xl p-4"
                                    >
                                      <div className="flex items-center gap-2 mb-3">
                                        <Icon className="w-4 h-4 text-[#6366F1]" />
                                        <span className="text-[13px] font-bold text-[#0F172A]">{label}</span>
                                        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] font-semibold">
                                          {typedItems.length} {typedItems.length === 1 ? "change" : "changes"}
                                        </span>
                                      </div>
                                      <div className="space-y-3">
                                        {typedItems.map((item, idx) => {
                                          const itemImpact = impactConfig[item.impact] || impactConfig.neutral;
                                          return (
                                            <div key={idx} className="text-[13px]">
                                              <p className="text-[#334155] mb-1">{item.description}</p>
                                              {(item.before || item.after) && (
                                                <div className="flex items-start gap-2 mt-1">
                                                  {item.before && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ef4444]/10 text-[#ef4444] rounded text-[11px] line-through">
                                                      {item.before}
                                                    </span>
                                                  )}
                                                  {item.before && item.after && (
                                                    <span className="text-[#94A3B8] text-[11px] mt-0.5">&rarr;</span>
                                                  )}
                                                  {item.after && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#06B6D4]/10 text-[#06B6D4] rounded text-[11px]">
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
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#94A3B8] font-semibold">
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
                            <div className="p-6 border-b border-[#E2E8F0]/50">
                              <h4 className="text-[15px] font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#6366F1]" />
                                Full Page Element Map
                              </h4>
                              <p className="text-[12px] text-[#94A3B8] mb-4">
                                {analysis.page_structure.total_sections} sections mapped — Est. height: {analysis.page_structure.page_height_estimate}
                              </p>

                              <div className="space-y-3">
                                {analysis.page_structure.sections.map((section, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="border border-[#E2E8F0] rounded-xl overflow-hidden"
                                  >
                                    <div className="px-4 py-3 bg-gradient-to-r from-[#6366F1]/5 to-transparent flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Box className="w-4 h-4 text-[#6366F1]" />
                                        <span className="text-[13px] font-bold text-[#0F172A]">
                                          {section.section_name}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-[#94A3B8] font-mono flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {section.position}
                                      </span>
                                    </div>
                                    <div className="px-4 py-2">
                                      <div className="divide-y divide-[#F1F5F9]">
                                        {section.elements.map((el, elIdx) => (
                                          <div key={elIdx} className="py-2 grid grid-cols-12 gap-2 text-[12px]">
                                            <div className="col-span-2">
                                              <span className="inline-block px-2 py-0.5 rounded bg-[#6366F1]/10 text-[#6366F1] font-semibold text-[10px]">
                                                {el.element_type}
                                              </span>
                                            </div>
                                            <div className="col-span-4 text-[#0F172A]">
                                              {el.content}
                                            </div>
                                            <div className="col-span-3 text-[#94A3B8]">
                                              {el.styling}
                                            </div>
                                            <div className="col-span-3">
                                              <span className="inline-block px-2 py-0.5 rounded bg-[#06B6D4]/10 text-[#06B6D4] font-semibold text-[10px]">
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
                                <h4 className="text-[14px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                                  <Eye className="w-4 h-4 text-[#f59e0b]" />
                                  Key Observations
                                </h4>
                                <ul className="space-y-2">
                                  {analysis.key_observations.map((obs, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-[13px] text-[#334155]">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] mt-1.5 shrink-0" />
                                      {obs}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {analysis.recommendations && analysis.recommendations.length > 0 && (
                              <div>
                                <h4 className="text-[14px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-[#06B6D4]" />
                                  Recommendations
                                </h4>
                                <ul className="space-y-2">
                                  {analysis.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-[13px] text-[#334155]">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] mt-1.5 shrink-0" />
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
          <div className="bg-white rounded-2xl max-w-[1400px] w-full my-4 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] px-8 py-5 z-10">
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
                  {/* Device Toggle in Modal */}
                  <div className="flex items-center gap-1 bg-white/20 rounded-lg p-0.5">
                    {([
                      { id: "all" as DeviceFilter, label: "All" },
                      { id: "desktop" as DeviceFilter, label: "Desktop", icon: Monitor },
                      { id: "mobile" as DeviceFilter, label: "Mobile", icon: Smartphone },
                    ]).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setModalDeviceFilter(id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                          modalDeviceFilter === id
                            ? "bg-white text-[#6366F1]"
                            : "text-white/70 hover:text-white"
                        }`}
                      >
                        {Icon && <Icon className="w-3 h-3" />}
                        {label}
                      </button>
                    ))}
                  </div>
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
                    <Loader2 className="w-10 h-10 text-[#6366F1] animate-spin" />
                    <p className="text-[#64748B] text-[14px]">Loading timeline...</p>
                  </div>
                </div>
              ) : analysisView.snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Camera className="w-16 h-16 text-[#CBD5E1] mb-4" />
                  <p className="text-[16px] text-[#94A3B8] mb-2">No snapshots yet</p>
                  <p className="text-[14px] text-[#aaaaaa] mb-6">
                    Run the first CRO analysis to start tracking changes
                  </p>
                  <button
                    onClick={() => { handleAnalyzeSingle(analysisView.competitor); setAnalysisView(null); }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    Analyze Now
                  </button>
                </div>
              ) : (
                <div className="space-y-0">
                  {/* Chronological Timeline Table */}
                  {(() => {
                    const filtered = modalDeviceFilter === "all"
                      ? analysisView.snapshots
                      : analysisView.snapshots.filter((s) => (s.device_type || "desktop") === modalDeviceFilter);
                    return [...filtered].reverse();
                  })().map((snapshot, idx, arr) => {
                    const analysis = snapshot.analysis_result;
                    const severity = severityConfig[snapshot.change_severity] || severityConfig.none;
                    const impact = analysis ? impactConfig[analysis.overall_impact] || impactConfig.neutral : impactConfig.neutral;
                    const ImpactIcon = impact.icon;
                    const capturedDate = new Date(snapshot.captured_at);
                    const totalChanges = analysis?.categories
                      ? Object.values(analysis.categories).reduce((sum, a) => sum + ((a as CROChangeItem[])?.length || 0), 0)
                      : 0;
                    const isExpanded = expandedSnapshot === snapshot.id;
                    const isFirst = idx === 0;
                    const isLast = idx === arr.length - 1;
                    const userNote = feedbackState[`note_${snapshot.id}`]?.comment || "";

                    return (
                      <div key={snapshot.id}>
                        {/* Timeline Row */}
                        <div
                          className={`flex items-stretch gap-0 border-x border-[#E2E8F0] ${isFirst ? "border-t rounded-t-2xl" : ""} ${isLast && !isExpanded ? "border-b rounded-b-2xl" : "border-b"} ${isExpanded ? "bg-[#fafaff]" : "bg-white hover:bg-[#fafaff]"} transition-colors cursor-pointer`}
                          onClick={() => setExpandedSnapshot(isExpanded ? null : snapshot.id)}
                        >
                          {/* Timeline Line */}
                          <div className="w-16 flex flex-col items-center py-4 shrink-0">
                            <div className="w-3 h-3 rounded-full border-2 shrink-0" style={{ borderColor: severity.color, backgroundColor: snapshot.changes_detected ? severity.color : "white" }} />
                            {!isLast && <div className="flex-1 w-px bg-[#E2E8F0] mt-1" />}
                          </div>

                          {/* Screenshot Thumbnail */}
                          <div className="w-[120px] py-3 shrink-0">
                            {(snapshot.device_type || "desktop") === "mobile" ? (
                              <div className="w-[50px] h-[80px] mx-auto rounded-lg overflow-hidden bg-[#f0f0f5] border-2 border-[#CBD5E1] relative">
                                {snapshot.screenshot_base64 ? (
                                  <img src={`data:image/jpeg;base64,${snapshot.screenshot_base64}`} alt="" className="w-full h-full object-cover object-top" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Smartphone className="w-4 h-4 text-[#CBD5E1]" /></div>
                                )}
                              </div>
                            ) : (
                              <div className="w-[100px] h-[62px] rounded-lg overflow-hidden bg-[#f0f0f5] border border-[#E2E8F0]">
                                {snapshot.screenshot_base64 ? (
                                  <img src={`data:image/jpeg;base64,${snapshot.screenshot_base64}`} alt="" className="w-full h-full object-cover object-top" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Camera className="w-5 h-5 text-[#CBD5E1]" /></div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 py-4 pr-4 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[14px] font-bold text-[#0F172A]">
                                {capturedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                              <span className="text-[12px] text-[#aaaaaa]">
                                {capturedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${severity.color}15`, color: severity.color }}>
                                {snapshot.changes_detected ? <AlertTriangle className="w-2.5 h-2.5" /> : <CheckCircle className="w-2.5 h-2.5" />}
                                {severity.label}
                              </div>
                              {snapshot.cro_score > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6366F1]/10 text-[#6366F1]">
                                  {snapshot.cro_score}/100
                                </span>
                              )}
                              {analysis?.is_baseline && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6366F1] text-white">BASELINE</span>
                              )}
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8]">
                                {(snapshot.device_type || "desktop") === "mobile" ? (
                                  <><Smartphone className="w-2.5 h-2.5" /> Mobile</>
                                ) : (
                                  <><Monitor className="w-2.5 h-2.5" /> Desktop</>
                                )}
                              </span>
                              {totalChanges > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#6366F1]/10 text-[#6366F1] rounded-full text-[10px] font-bold">
                                  <Activity className="w-2.5 h-2.5" />{totalChanges}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${impact.color}10`, color: impact.color }}>
                                <ImpactIcon className="w-2.5 h-2.5" />{impact.label}
                              </span>
                            </div>
                            <p className="text-[13px] text-[#555555] leading-snug line-clamp-2">
                              {snapshot.change_summary || analysis?.summary || "No changes detected"}
                            </p>
                            {analysis?.strategic_assumption && (
                              <div className="flex items-start gap-1.5 mt-2">
                                <Brain className="w-3 h-3 text-[#f59e0b] mt-0.5 shrink-0" />
                                <p className="text-[11px] text-[#94A3B8] line-clamp-1">{analysis.strategic_assumption}</p>
                              </div>
                            )}
                          </div>

                          {/* Arrow */}
                          <div className="w-10 flex items-center justify-center shrink-0">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-[#6366F1]" /> : <ChevronDown className="w-5 h-5 text-[#CBD5E1]" />}
                          </div>
                        </div>

                        {/* Expanded Detail */}
                        {isExpanded && analysis && (
                          <div className={`border-x border-b border-[#E2E8F0] ${isLast ? "rounded-b-2xl" : ""} bg-gradient-to-br from-[#fafaff] to-white`}>
                            {/* Summary + Score */}
                            <div className="px-8 py-5 border-b border-[#E2E8F0]/50">
                              <p className="text-[14px] text-[#334155] leading-relaxed">{analysis.summary}</p>
                              {analysis.cro_score_previous !== undefined && analysis.cro_score_previous !== null && (
                                <div className="flex items-center gap-3 mt-3">
                                  <span className="text-[13px] text-[#94A3B8]">Score:</span>
                                  <span className="text-[14px] font-semibold text-[#94A3B8]">{analysis.cro_score_previous}</span>
                                  <ArrowLeftRight className="w-4 h-4 text-[#CBD5E1]" />
                                  <span className="text-[14px] font-bold text-[#6366F1]">{analysis.cro_score}</span>
                                  <span className="text-[13px] font-bold" style={{ color: analysis.cro_score > analysis.cro_score_previous ? "#06B6D4" : analysis.cro_score < analysis.cro_score_previous ? "#ef4444" : "#94A3B8" }}>
                                    ({analysis.cro_score > analysis.cro_score_previous ? "+" : ""}{analysis.cro_score - analysis.cro_score_previous})
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Strategic Assumption */}
                            {analysis.strategic_assumption && (
                              <div className="px-8 py-5 border-b border-[#E2E8F0]/50">
                                <div className="bg-gradient-to-br from-[#f59e0b]/15 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-2xl p-5">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-9 h-9 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                                      <Brain className="w-4 h-4 text-[#f59e0b]" />
                                    </div>
                                    <div>
                                      <h4 className="text-[14px] font-bold text-[#0F172A]">Why Did They Make This Change?</h4>
                                      <p className="text-[10px] text-[#94A3B8]">AI Strategic Assumption — Claude</p>
                                    </div>
                                  </div>
                                  <p className="text-[13px] text-[#334155] leading-relaxed pl-[48px] mb-3">{analysis.strategic_assumption}</p>

                                  {snapshot.braintrust_span_id && (
                                    <div className="pl-[48px]">
                                      {feedbackState[snapshot.id]?.submitted ? (
                                        <p className="text-[12px] text-[#06B6D4] font-medium flex items-center gap-1.5">
                                          <CheckCircle className="w-3.5 h-3.5" /> Feedback submitted
                                        </p>
                                      ) : (
                                        <div className="flex items-center gap-3">
                                          <span className="text-[11px] text-[#94A3B8]">Accurate?</span>
                                          <button onClick={(e) => { e.stopPropagation(); handleFeedback(snapshot.id, snapshot.braintrust_span_id!, 1); submitFeedback(snapshot.id, snapshot.braintrust_span_id!); }}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all">
                                            <ThumbsUp className="w-3 h-3" /> Yes
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleFeedback(snapshot.id, snapshot.braintrust_span_id!, 0); submitFeedback(snapshot.id, snapshot.braintrust_span_id!); }}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#ef4444] hover:text-[#ef4444] transition-all">
                                            <ThumbsDown className="w-3 h-3" /> No
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Screenshot Full */}
                            {snapshot.screenshot_base64 && (
                              <div className="px-8 py-4 border-b border-[#E2E8F0]/50">
                                <div className="flex items-center gap-2 mb-3">
                                  {(snapshot.device_type || "desktop") === "mobile" ? (
                                    <><Smartphone className="w-4 h-4 text-[#6366F1]" /><span className="text-[13px] font-bold text-[#0F172A]">Mobile Screenshot</span><span className="text-[11px] text-[#94A3B8]">390 x 844px</span></>
                                  ) : (
                                    <><Monitor className="w-4 h-4 text-[#6366F1]" /><span className="text-[13px] font-bold text-[#0F172A]">Desktop Screenshot</span><span className="text-[11px] text-[#94A3B8]">1280 x 900px</span></>
                                  )}
                                </div>
                                {(snapshot.device_type || "desktop") === "mobile" ? (
                                  <div className="flex justify-center">
                                    <div className="w-[320px] border-[3px] border-[#0F172A] rounded-[2rem] p-2 bg-[#0F172A] shadow-xl">
                                      <div className="w-12 h-1 bg-[#334155] rounded-full mx-auto mb-2" />
                                      <div className="rounded-[1.5rem] overflow-hidden max-h-[500px] overflow-y-auto bg-white">
                                        <img src={`data:image/jpeg;base64,${snapshot.screenshot_base64}`} alt="Mobile screenshot" className="w-full" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                                    <img src={`data:image/jpeg;base64,${snapshot.screenshot_base64}`} alt="Desktop screenshot" className="w-full" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* User Note */}
                            <div className="px-8 py-4 border-b border-[#E2E8F0]/50">
                              <div className="flex items-center gap-2 mb-2">
                                <Edit2 className="w-3.5 h-3.5 text-[#6366F1]" />
                                <span className="text-[13px] font-bold text-[#0F172A]">Your Notes</span>
                              </div>
                              <textarea
                                placeholder="Leave your considerations about this change..."
                                value={userNote}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setFeedbackState((prev) => ({
                                  ...prev, [`note_${snapshot.id}`]: { ...prev[`note_${snapshot.id}`], comment: e.target.value, submitted: false, showComment: false }
                                }))}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#6366F1] transition-all resize-none"
                                rows={2}
                              />
                            </div>

                            {/* Change Categories (compact) */}
                            {analysis.categories && Object.entries(analysis.categories).some(([, items]) => (items as CROChangeItem[])?.length > 0) && (
                              <div className="px-8 py-4 border-b border-[#E2E8F0]/50">
                                <h4 className="text-[13px] font-bold text-[#0F172A] mb-3">Detailed Changes</h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  {Object.entries(analysis.categories).map(([key, items]) => {
                                    const typedItems = items as CROChangeItem[];
                                    if (!typedItems || typedItems.length === 0) return null;
                                    const Icon = categoryIcons[key] || FileText;
                                    const label = categoryLabels[key] || key;
                                    return (
                                      <div key={key} className="bg-white border border-[#E2E8F0] rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Icon className="w-3.5 h-3.5 text-[#6366F1]" />
                                          <span className="text-[12px] font-bold text-[#0F172A]">{label}</span>
                                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] font-semibold">{typedItems.length}</span>
                                        </div>
                                        <div className="space-y-1.5">
                                          {typedItems.map((item, i) => (
                                            <div key={i} className="text-[11px] text-[#555555]">
                                              <p>{item.description}</p>
                                              {(item.before || item.after) && (
                                                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                                  {item.before && <span className="px-1 py-0.5 bg-[#ef4444]/10 text-[#ef4444] rounded text-[10px] line-through">{item.before}</span>}
                                                  {item.before && item.after && <span className="text-[#CBD5E1] text-[10px]">&rarr;</span>}
                                                  {item.after && <span className="px-1 py-0.5 bg-[#06B6D4]/10 text-[#06B6D4] rounded text-[10px]">{item.after}</span>}
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
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-[#0F172A]">Add Competitor</h2>
              <button
                onClick={() => { setShowCreateDialog(false); resetForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Competitor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Amazon, Shopify, Zalando..."
                  className="w-full px-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Website URL *</label>
                <input
                  type="text"
                  required
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://www.example.com"
                  className="w-full px-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] focus:outline-none focus:border-[#6366F1] transition-all"
                >
                  <option value="">Select category...</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Folder</label>
                <div className="relative">
                  <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={formData.folder}
                    onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                    placeholder="e.g. Direct Competitors, Industry Leaders..."
                    list="folder-suggestions"
                    className="w-full pl-11 pr-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                  <datalist id="folder-suggestions">
                    {folders.map((f) => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this competitor..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes about this competitor..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateDialog(false); resetForm(); }}
                  className="flex-1 px-5 py-3 bg-white/80 border border-[#6366F1]/30 text-[#0F172A] text-[14px] font-medium rounded-xl hover:border-[#6366F1]/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-3 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
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
          <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-[#0F172A]">Edit Competitor</h2>
              <button
                onClick={() => { setShowEditDialog(false); setEditingCompetitor(null); resetForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Competitor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Website URL *</label>
                <input
                  type="text"
                  required
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] focus:outline-none focus:border-[#6366F1] transition-all"
                >
                  <option value="">Select category...</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Folder</label>
                <div className="relative">
                  <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={formData.folder}
                    onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                    placeholder="e.g. Direct Competitors, Industry Leaders..."
                    list="folder-suggestions-edit"
                    className="w-full pl-11 pr-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                  <datalist id="folder-suggestions-edit">
                    {folders.map((f) => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/80 border border-[#6366F1]/30 rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditDialog(false); setEditingCompetitor(null); resetForm(); }}
                  className="flex-1 px-5 py-3 bg-white/80 border border-[#6366F1]/30 text-[#0F172A] text-[14px] font-medium rounded-xl hover:border-[#6366F1]/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-3 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Dialog */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-4 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#06B6D4] to-[#6366F1] px-8 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-white">Bulk Import Competitors</h2>
                    <p className="text-[13px] text-white/70">Paste multiple URLs to monitor at once</p>
                  </div>
                </div>
                <button
                  onClick={resetBulkImport}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8">
              {!bulkResult ? (
                <div className="space-y-5">
                  {/* Folder Name */}
                  <div>
                    <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-[#06B6D4]" />
                      Folder Name *
                    </label>
                    <div className="relative">
                      <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        type="text"
                        value={bulkFolder}
                        onChange={(e) => setBulkFolder(e.target.value)}
                        placeholder="e.g. Direct Competitors, Industry Leaders, Q1 2026 Watch..."
                        list="bulk-folder-suggestions"
                        className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] text-[15px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#06B6D4] transition-all"
                      />
                      <datalist id="bulk-folder-suggestions">
                        {folders.map((f) => (
                          <option key={f} value={f} />
                        ))}
                      </datalist>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] mt-1.5">
                      Group these competitors under a folder for easy filtering
                    </p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#06B6D4]" />
                      Category
                    </label>
                    <select
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] text-[15px] focus:outline-none focus:border-[#06B6D4] transition-all"
                    >
                      <option value="">Select category (optional)...</option>
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* URLs */}
                  <div>
                    <label className="block text-[13px] text-[#0F172A] mb-2 font-semibold flex items-center gap-2">
                      <Link className="w-4 h-4 text-[#06B6D4]" />
                      URLs to Monitor *
                    </label>
                    <textarea
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                      placeholder={"https://www.competitor1.com\nhttps://www.competitor2.com\nhttps://www.competitor3.com\nhttps://www.competitor4.com/landing-page"}
                      rows={8}
                      className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] text-[14px] font-mono placeholder:text-[#94A3B8] focus:outline-none focus:border-[#06B6D4] transition-all resize-none"
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[11px] text-[#94A3B8]">
                        One URL per line, or separated by commas
                      </p>
                      {bulkUrls.trim() && (
                        <p className="text-[11px] text-[#06B6D4] font-semibold">
                          {bulkUrls.split(/[\n,;]+/).map((l) => l.trim()).filter((l) => l.length > 0).length} URL{bulkUrls.split(/[\n,;]+/).map((l) => l.trim()).filter((l) => l.length > 0).length !== 1 ? "s" : ""} detected
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetBulkImport}
                      className="flex-1 px-5 py-3 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[14px] font-medium rounded-xl hover:border-[#94A3B8] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkImport}
                      disabled={bulkImporting || !bulkUrls.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br from-[#06B6D4] to-[#6366F1] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {bulkImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Import All
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Result Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-[#06B6D4]/15 to-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-[#06B6D4]/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Check className="w-4 h-4 text-[#06B6D4]" />
                      </div>
                      <p className="text-[24px] font-bold text-[#06B6D4]">{bulkResult.summary.created}</p>
                      <p className="text-[11px] text-[#94A3B8] font-medium">Created</p>
                    </div>
                    <div className="bg-gradient-to-br from-[#f59e0b]/15 to-[#f59e0b]/5 border border-[#f59e0b]/30 rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <SkipForward className="w-4 h-4 text-[#f59e0b]" />
                      </div>
                      <p className="text-[24px] font-bold text-[#f59e0b]">{bulkResult.summary.duplicates}</p>
                      <p className="text-[11px] text-[#94A3B8] font-medium">Duplicates</p>
                    </div>
                    <div className="bg-gradient-to-br from-[#ef4444]/15 to-[#ef4444]/5 border border-[#ef4444]/30 rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-[#ef4444]/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <AlertCircle className="w-4 h-4 text-[#ef4444]" />
                      </div>
                      <p className="text-[24px] font-bold text-[#ef4444]">{bulkResult.summary.invalid}</p>
                      <p className="text-[11px] text-[#94A3B8] font-medium">Invalid</p>
                    </div>
                  </div>

                  {/* Detail Results */}
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {bulkResult.results.map((r, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 px-4 py-3 ${idx !== bulkResult.results.length - 1 ? "border-b border-[#F1F5F9]" : ""}`}
                      >
                        {r.status === "created" ? (
                          <div className="w-6 h-6 rounded-full bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-[#06B6D4]" />
                          </div>
                        ) : r.status === "duplicate" ? (
                          <div className="w-6 h-6 rounded-full bg-[#f59e0b]/10 flex items-center justify-center shrink-0">
                            <SkipForward className="w-3.5 h-3.5 text-[#f59e0b]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#ef4444]/10 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-3.5 h-3.5 text-[#ef4444]" />
                          </div>
                        )}
                        <span className="text-[13px] text-[#0F172A] font-mono truncate flex-1">{r.url}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          r.status === "created" ? "bg-[#06B6D4]/10 text-[#06B6D4]" :
                          r.status === "duplicate" ? "bg-[#f59e0b]/10 text-[#f59e0b]" :
                          "bg-[#ef4444]/10 text-[#ef4444]"
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Done */}
                  <button
                    onClick={resetBulkImport}
                    className="w-full px-5 py-3 bg-gradient-to-br from-[#06B6D4] to-[#6366F1] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
