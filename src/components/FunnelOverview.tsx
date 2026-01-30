"use client";

import { useState } from "react";
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

interface FunnelOverviewProps {
  funnelName: string;
  steps: FunnelStep[];
  connections: FunnelConnection[];
  firstStep: FunnelStep;
  lastStep: FunnelStep;
  conversionRate: number;
  onNavigateToAnalysis: () => void;
  onNavigateToHeatmap: () => void;
  onNavigateToABTests: () => void;
}

export default function FunnelOverview({
  funnelName,
  steps,
  connections,
  firstStep,
  lastStep,
  conversionRate,
  onNavigateToAnalysis,
  onNavigateToHeatmap,
  onNavigateToABTests,
}: FunnelOverviewProps) {
  const [ragSummary, setRagSummary] = useState<string | null>(null);
  const [isLoadingRag, setIsLoadingRag] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);

  // Bottleneck: step con drop-off più alto
  const bottleneckStep = steps.length > 0
    ? steps.reduce((worst, step) =>
        (step.dropoff ?? 0) > (worst.dropoff ?? 0) ? step : worst
      )
    : null;

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
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#00d4aa]" />
            </div>
            <span className="text-[12px] text-[#888888]">Conversion Rate</span>
          </div>
          <p className="text-[24px] font-bold text-[#00d4aa]">
            {Number.isFinite(conversionRate) ? conversionRate.toFixed(1) : "0"}%
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#7c5cff]" />
            </div>
            <span className="text-[12px] text-[#888888]">Total Visitors</span>
          </div>
          <p className="text-[24px] font-bold text-[#fafafa]">
            {(firstStep?.visitors ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-[#00d4aa]" />
            </div>
            <span className="text-[12px] text-[#888888]">Conversions</span>
          </div>
          <p className="text-[24px] font-bold text-[#00d4aa]">
            {(lastStep?.visitors ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#ff6b6b]/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#ff6b6b]" />
            </div>
            <span className="text-[12px] text-[#888888]">Bottleneck</span>
          </div>
          <p className="text-[14px] font-bold text-[#fafafa] truncate" title={bottleneckStep?.name}>
            {bottleneckStep?.name || "-"}
          </p>
          {bottleneckStep?.dropoff ? (
            <p className="text-[12px] text-[#ff6b6b]">{bottleneckStep.dropoff}% drop-off</p>
          ) : null}
        </div>
      </div>

      {/* RAG Summary + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RAG Summary */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#7c5cff]/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#7c5cff]" />
              <h3 className="text-[16px] font-semibold text-[#fafafa]">RAG Insights</h3>
            </div>
            <button
              onClick={fetchRagSummary}
              disabled={isLoadingRag}
              className="px-4 py-2 bg-[#7c5cff] hover:bg-[#6b4ce6] disabled:opacity-50 rounded-lg text-[13px] font-medium text-white flex items-center gap-2 transition-colors"
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
            <p className="text-[13px] text-[#888888] italic">{ragError}</p>
          )}
          {ragSummary && (
            <>
              <p className="text-[14px] text-[#fafafa] leading-relaxed whitespace-pre-wrap">
                {ragSummary}
              </p>
              <p className="text-[11px] text-[#666666] mt-3">Source: RAG</p>
            </>
          )}
          {!ragSummary && !ragError && !isLoadingRag && (
            <p className="text-[13px] text-[#666666]">
              Click "Generate insights" to get a CRO summary based on funnel data.
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-[#888888] mb-3">Quick Actions</h3>
          <button
            onClick={onNavigateToAnalysis}
            className="w-full flex items-center justify-between p-4 bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#7c5cff]/50 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#7c5cff]" />
              </div>
              <span className="text-[14px] font-medium text-[#fafafa]">CRO Analysis</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#666666] group-hover:text-[#7c5cff]" />
          </button>
          <button
            onClick={onNavigateToHeatmap}
            className="w-full flex items-center justify-between p-4 bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#7c5cff]/50 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-[#00d4aa]" />
              </div>
              <span className="text-[14px] font-medium text-[#fafafa]">Heatmap</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#666666] group-hover:text-[#00d4aa]" />
          </button>
          <button
            onClick={onNavigateToABTests}
            className="w-full flex items-center justify-between p-4 bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#7c5cff]/50 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <span className="text-[14px] font-medium text-[#fafafa]">A/B Tests</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#666666] group-hover:text-[#f59e0b]" />
          </button>
        </div>
      </div>

    </div>
  );
}
