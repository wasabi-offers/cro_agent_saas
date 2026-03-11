"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  Sparkles,
  MousePointerClick,
  FlaskConical,
  Brain,
  Loader2,
  ChevronRight,
  Filter,
  Zap,
  Lightbulb,
} from "lucide-react";
interface FunnelStep {
  name: string;
  visitors: number;
  dropoff: number;
  url?: string;
}

interface FunnelConnection {
  source: string;
  target: string;
}

type UrgencyLevel = "critical" | "high" | "medium" | "low";

interface UrgentTask {
  stepName: string;
  stepUrl?: string;
  dropoff: number;
  visitorsLost: number;
  visitors: number;
  urgency: UrgencyLevel;
  insight: string;
  interventions: string[];  // Mini-analysis: how to fix
}

interface FunnelOverviewProps {
  funnelName: string;
  funnelId?: string;
  steps: FunnelStep[];
  connections: FunnelConnection[];
  firstStep: FunnelStep;
  goalStep: FunnelStep;  // Step that counts as conversion (from Setup)
  totalVisitors?: number;  // Union of unique visitors across all entry steps (from live API)
  conversionRate: number;
  onNavigateToAnalysis: () => void;
  onNavigateToHeatmap: () => void;
  onNavigateToABTests: () => void;
}

export default function FunnelOverview({
  funnelName,
  funnelId,
  steps,
  connections,
  firstStep,
  goalStep,
  totalVisitors,
  conversionRate,
  onNavigateToAnalysis,
  onNavigateToHeatmap,
  onNavigateToABTests,
}: FunnelOverviewProps) {
  const [ragSummary, setRagSummary] = useState<string | null>(null);
  const [isLoadingRag, setIsLoadingRag] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const [urgentFilterStep, setUrgentFilterStep] = useState<string>("all");
  const [urgentFilterLevel, setUrgentFilterLevel] = useState<string>("all");

  // Bottleneck: step con drop-off più alto
  const bottleneckStep = steps.length > 0
    ? steps.reduce((worst, step) =>
        (step.dropoff ?? 0) > (worst.dropoff ?? 0) ? step : worst
      )
    : null;

  // Urgent tasks: derive from drop-off data (funnel) + heatmap insights
  const urgentTasks = useMemo((): UrgentTask[] => {
    const tasks: UrgentTask[] = [];
    steps.forEach((step) => {
      const dropoff = step.dropoff ?? 0;
      if (dropoff <= 0) return;
      const visitors = step.visitors ?? 0;
      const visitorsLost = Math.round(visitors * (dropoff / 100));
      let urgency: UrgencyLevel = "low";
      if (dropoff >= 80) urgency = "critical";
      else if (dropoff >= 50) urgency = "high";
      else if (dropoff >= 20) urgency = "medium";
      const insight =
        urgency === "critical"
          ? dropoff >= 99
            ? `100% drop-off – no visitors proceed. Fix immediately.`
            : `Critical drop-off – ${visitorsLost} visitors lost. Fix immediately.`
          : urgency === "high"
            ? `High drop-off – ${visitorsLost} visitors lost. Check CTA visibility and friction.`
            : urgency === "medium"
              ? `${visitorsLost} visitors lost. Review page flow and heatmap.`
              : `Minor drop-off. Optimize for incremental gains.`;

      // Mini-analysis: how to intervene based on step type and urgency
      const stepKey = (step.name + " " + (step.url || "")).toLowerCase();
      const interventions: string[] =
        /checkout|payment|cb|clickbank|stripe|pay|cassa/.test(stepKey)
          ? [
              "Verify payment gateway (no errors, correct redirect)",
              "Test on mobile and different browsers",
              "Simplify form fields – remove friction",
              "Check Heatmap for dead clicks on CTA",
            ]
          : /quiz|question|form/.test(stepKey)
            ? [
                "Reduce number of questions or steps",
                "Make CTA more visible (above fold, contrasting color)",
                "A/B test copy and layout",
                "Check Heatmap for rage clicks (frustration)",
              ]
            : /landing|bridge|optin|lp/.test(stepKey)
              ? [
                  "Strengthen headline and value proposition",
                  "Add social proof (testimonials, trust badges)",
                  "Simplify CTA – single clear action",
                  "Check Heatmap for scroll depth and CTA visibility",
                ]
              : [
                  "Identify friction points with Heatmap",
                  "Simplify page flow and reduce steps",
                  "A/B test CTA placement and copy",
                  "Run CRO Analysis for detailed recommendations",
                ];

      tasks.push({
        stepName: step.name,
        stepUrl: step.url,
        dropoff,
        visitorsLost,
        visitors,
        urgency,
        insight,
        interventions,
      });
    });
    return tasks.sort((a, b) => b.dropoff - a.dropoff);
  }, [steps]);

  const filteredUrgentTasks = useMemo(() => {
    return urgentTasks.filter((t) => {
      if (urgentFilterStep !== "all" && t.stepName !== urgentFilterStep) return false;
      if (urgentFilterLevel !== "all" && t.urgency !== urgentFilterLevel) return false;
      return true;
    });
  }, [urgentTasks, urgentFilterStep, urgentFilterLevel]);

  const fetchRagSummary = async () => {
    setIsLoadingRag(true);
    setRagError(null);
    try {
      const summary = steps
        .map((s, i) => `${s.name}: ${s.visitors} visitors${s.dropoff ? `, ${s.dropoff}% drop-off` : ""}`)
        .join(". ");
      const res = await fetch("/api/cro-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Funnel "${funnelName}" - ${summary}. Conversion rate: ${conversionRate}%. ${bottleneckStep?.dropoff ? `Bottleneck: ${bottleneckStep.name} with ${bottleneckStep.dropoff}% drop-off.` : ""} Provide a brief summary (2-3 sentences) with the main problem and a top priority recommendation.`,
          user_id: "overview",
          top_k: 5,
        }),
      });
      const data = await res.json();
      if (res.ok && data.answer) {
        setRagSummary(data.answer);
      } else {
        setRagError(data.error || "RAG not configured");
      }
    } catch {
      setRagError("Connection error");
    } finally {
      setIsLoadingRag(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#06B6D4]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <span className="text-[12px] text-[#64748B]">Conversion Rate</span>
          </div>
          <p className="text-[24px] font-bold text-[#06B6D4]">
            {Number.isFinite(conversionRate) ? conversionRate.toFixed(1) : "0"}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#6366F1]/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#6366F1]" />
            </div>
            <span className="text-[12px] text-[#64748B]">Total Visitors</span>
          </div>
          <p className="text-[24px] font-bold text-[#0F172A]">
            {(totalVisitors ?? firstStep?.visitors ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#06B6D4]/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <span className="text-[12px] text-[#64748B]">Conversions</span>
          </div>
          <p className="text-[24px] font-bold text-[#06B6D4]">
            {(goalStep?.visitors ?? 0).toLocaleString()}
          </p>
          {goalStep?.name && (
            <p className="text-[11px] text-[#64748B] mt-1">Goal: {goalStep.name}</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#EF4444]/20 to-[#EF4444]/5 border border-[#EF4444]/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#EF4444]/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
            </div>
            <span className="text-[12px] text-[#64748B]">Bottleneck</span>
          </div>
          <p className="text-[14px] font-bold text-[#0F172A] truncate" title={bottleneckStep?.name}>
            {bottleneckStep?.name || "-"}
          </p>
          {bottleneckStep?.dropoff ? (
            <p className="text-[12px] text-[#EF4444]">{bottleneckStep.dropoff}% drop-off</p>
          ) : null}
        </div>
      </div>

      {/* RAG Summary + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RAG Summary */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 border border-[#6366F1]/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#6366F1]" />
              <h3 className="text-[16px] font-semibold text-[#0F172A]">RAG Insights</h3>
            </div>
            <button
              onClick={fetchRagSummary}
              disabled={isLoadingRag}
              className="px-4 py-2 bg-[#6366F1] hover:bg-[#6366F1] disabled:opacity-50 rounded-lg text-[13px] font-medium text-white flex items-center gap-2 transition-colors"
            >
              {isLoadingRag ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isLoadingRag ? "Loading..." : "Generate insights"}
            </button>
          </div>
          {ragError && (
            <p className="text-[13px] text-[#94A3B8] italic">{ragError}</p>
          )}
          {ragSummary && (
            <>
              <p className="text-[14px] text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                {ragSummary}
              </p>
              <p className="text-[11px] text-[#64748B] mt-3">Source: RAG</p>
            </>
          )}
          {!ragSummary && !ragError && !isLoadingRag && (
            <p className="text-[13px] text-[#64748B]">
              Click "Generate insights" to get a CRO summary based on funnel data.
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-[#94A3B8] mb-3">Quick Actions</h3>
          <button
            onClick={onNavigateToAnalysis}
            className="w-full flex items-center justify-between p-4 bg-white/60 hover:bg-white/80 border border-[#6366F1]/30 hover:border-[#6366F1]/50 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6366F1]/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#6366F1]" />
              </div>
              <span className="text-[14px] font-medium text-[#0F172A]">CRO Analysis</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-[#6366F1]" />
          </button>
          <button
            onClick={onNavigateToHeatmap}
            className="w-full flex items-center justify-between p-4 bg-white/60 hover:bg-white/80 border border-[#6366F1]/30 hover:border-[#6366F1]/50 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#06B6D4]/20 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-[#06B6D4]" />
              </div>
              <span className="text-[14px] font-medium text-[#0F172A]">Heatmap</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-[#06B6D4]" />
          </button>
          <button
            onClick={onNavigateToABTests}
            className="w-full flex items-center justify-between p-4 bg-white/60 hover:bg-white/80 border border-[#6366F1]/30 hover:border-[#6366F1]/50 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[14px] font-medium text-[#0F172A]">A/B Tests</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-[#f59e0b]" />
          </button>
        </div>
      </div>

      {/* Urgent Tasks – analysis based on funnel data and heatmap */}
      <div className="bg-gradient-to-br from-[#EF4444]/20 to-[#EF4444]/5 border border-[#EF4444]/30 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#EF4444]" />
            <h3 className="text-[16px] font-semibold text-[#0F172A]">Urgent Tasks</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#64748B]" />
              <select
                value={urgentFilterStep}
                onChange={(e) => setUrgentFilterStep(e.target.value)}
                className="bg-white/60 border border-[#EF4444]/30 rounded-lg px-3 py-1.5 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#6366F1]"
              >
                <option value="all">All pages</option>
                {steps.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={urgentFilterLevel}
              onChange={(e) => setUrgentFilterLevel(e.target.value)}
              className="bg-[#F8FAFC] border border-[#1E293B] rounded-lg px-3 py-1.5 text-[12px] text-[#0F172A] focus:outline-none focus:border-[#6366F1]"
            >
              <option value="all">All urgency</option>
              <option value="critical">Critical (≥80%)</option>
              <option value="high">High (50–79%)</option>
              <option value="medium">Medium (20–49%)</option>
              <option value="low">Low (&lt;20%)</option>
            </select>
          </div>
        </div>
        <p className="text-[12px] text-[#64748B] mb-4">
          Based on funnel drop-off data. Each task includes a mini analysis with tips and action items. Check the Heatmap tab for click patterns and CTA visibility.
        </p>
        {filteredUrgentTasks.length === 0 ? (
          <p className="text-[13px] text-[#64748B] py-4">
            {urgentTasks.length === 0
              ? "No urgent tasks – all steps have low or no drop-off."
              : "No tasks match the current filters."}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredUrgentTasks.map((task, i) => (
              <div
                key={`${task.stepName}-${i}`}
                className={`flex items-start gap-4 p-4 rounded-xl border ${
                  task.urgency === "critical"
                    ? "bg-[#EF4444]/10 border-[#EF4444]/30"
                    : task.urgency === "high"
                      ? "bg-[#f59e0b]/10 border-[#f59e0b]/30"
                      : task.urgency === "medium"
                        ? "bg-[#f59e0b]/5 border-[#f59e0b]/20"
                        : "bg-white/60 border-[#6366F1]/20"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0F172A]">{task.stepName}</p>
                  <p className="text-[12px] text-[#94A3B8] mt-1">{task.insight}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[#64748B]">
                    <span>{task.dropoff}% drop-off</span>
                    <span>{task.visitorsLost.toLocaleString()} visitors lost</span>
                  </div>
                  {task.interventions.length > 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-[#06B6D4]/5 border border-[#06B6D4]/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-[#06B6D4]" />
                        <p className="text-[13px] font-semibold text-[#06B6D4]">
                          Mini Analysis – Tips & Action Items:
                        </p>
                      </div>
                      <ul className="space-y-2 text-[13px] text-[#64748B]">
                        {task.interventions.map((item, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="text-[#06B6D4] flex-shrink-0 mt-0.5">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={onNavigateToAnalysis}
                    className="px-3 py-1.5 bg-[#6366F1]/20 hover:bg-[#6366F1]/30 text-[#6366F1] rounded-lg text-[11px] font-medium"
                  >
                    CRO Analysis
                  </button>
                  <button
                    onClick={onNavigateToHeatmap}
                    className="px-3 py-1.5 bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30 text-[#06B6D4] rounded-lg text-[11px] font-medium"
                  >
                    Heatmap
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
