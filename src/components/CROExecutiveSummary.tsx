"use client";

import { AlertTriangle, Zap, TrendingUp } from "lucide-react";

interface AnalysisResult {
  category: string;
  insights: string[];
  score: number;
  icon?: string;
}

interface CROExecutiveSummaryProps {
  results: AnalysisResult[];
  source?: string | null;
}

export default function CROExecutiveSummary({ results, source }: CROExecutiveSummaryProps) {
  if (results.length === 0) return null;

  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  );
  const scoreColor = avgScore >= 80 ? "text-[#00d4aa]" : avgScore >= 60 ? "text-[#f59e0b]" : "text-[#ff6b6b]";
  const scoreBg = avgScore >= 80 ? "bg-[#00d4aa]/10 border-[#00d4aa]/20" : avgScore >= 60 ? "bg-[#f59e0b]/10 border-[#f59e0b]/20" : "bg-[#ff6b6b]/10 border-[#ff6b6b]/20";

  // Top 3 critical = from lowest scoring category
  const sortedByScore = [...results].sort((a, b) => a.score - b.score);
  const criticalInsights = sortedByScore[0]?.insights?.slice(0, 3) || [];

  // Quick wins = insights with "low" or "LOW" effort
  const quickWins: string[] = [];
  results.forEach((r) => {
    (r.insights || []).forEach((i) => {
      if (/\beffort:\s*low\b/i.test(i) || /\blow\s*effort\b/i.test(i)) {
        quickWins.push(i.length > 120 ? i.substring(0, 120) + "…" : i);
      }
    });
  });
  const topQuickWins = quickWins.slice(0, 2);

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold text-[#fafafa]">Executive Summary</h3>
        {source && (
          <span className="text-[10px] px-2 py-1 rounded bg-[#2a2a2a] text-[#888888]">
            Source: {source}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Score */}
        <div className={`rounded-xl border p-4 ${scoreBg}`}>
          <div className="text-[12px] text-[#888888] mb-1">Overall Health</div>
          <div className={`text-[28px] font-bold ${scoreColor}`}>{avgScore}/100</div>
        </div>

        {/* Top 3 Critical */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#ff6b6b]">
            <AlertTriangle className="w-4 h-4" />
            Top Critical Issues
          </div>
          <ul className="space-y-1.5">
            {criticalInsights.map((insight, i) => (
              <li key={i} className="text-[12px] text-[#888888] line-clamp-2">
                • {insight.length > 100 ? insight.substring(0, 100) + "…" : insight}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick Wins */}
      {topQuickWins.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#00d4aa] mb-2">
            <Zap className="w-4 h-4" />
            Quick Wins (Low Effort)
          </div>
          <ul className="space-y-1.5">
            {topQuickWins.map((insight, i) => (
              <li key={i} className="text-[12px] text-[#fafafa] line-clamp-2">
                • {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
