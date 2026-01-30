"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check, Zap, Target, Lightbulb } from "lucide-react";

interface ParsedInsight {
  problem?: string;
  action?: string;
  principle?: string;
  impact?: string;
  effort?: "low" | "medium" | "high";
  raw: string;
}

function parseInsight(text: string): ParsedInsight {
  const result: ParsedInsight = { raw: text };
  const lower = text.toLowerCase();

  // Extract ACTION - multiple patterns (ACTION:, Action:, Change to, Replace with, Move to, Add)
  const actionPatterns = [
    /(?:ACTION|Action):\s*(.+?)(?=Psychology|Principle|Expected|Impact|Effort|Confidence|\.\s+[A-Z]|$)/is,
    /(?:Change to|Replace with|Move to|Add)\s+(?:button to|headline to|text to)?\s*['"]?(.+?)(?:['"]?\s*\.|Psychology|Expected|$)/is,
  ];
  for (const p of actionPatterns) {
    const m = text.match(p);
    if (m && m[1].trim().length > 10) {
      result.action = m[1].trim();
      break;
    }
  }

  // Extract Psychology/Principle - flexible
  const psychMatch = text.match(/(?:Psychology|Principle|Why it works):\s*(.+?)(?=Expected|Impact|Effort|Confidence|\.\s+[A-Z]|$)/is);
  if (psychMatch) result.principle = psychMatch[1].trim();

  // Extract Expected impact - catch +X-Y% patterns anywhere
  const impactMatch = text.match(/(?:\+\d+[-–]\d+%[^.]*|Expected[:\s]+[^.]*\+\d+[^.]*)/i);
  if (impactMatch) {
    result.impact = impactMatch[0].replace(/^(Expected|Impact):\s*/i, "").trim();
  }

  // Extract Effort
  if (/\beffort:\s*low\b/i.test(lower) || /\blow\s*effort\b/i.test(lower)) result.effort = "low";
  else if (/\beffort:\s*medium\b/i.test(lower) || /\bmedium\s*effort\b/i.test(lower)) result.effort = "medium";
  else if (/\beffort:\s*high\b/i.test(lower) || /\bhigh\s*effort\b/i.test(lower)) result.effort = "high";

  // Problem = text before ACTION (or first 1-2 sentences)
  if (result.action) {
    const actionIdx = text.toLowerCase().indexOf("action:");
    if (actionIdx > 0) result.problem = text.substring(0, actionIdx).trim();
    else {
      const sentences = text.split(/(?<=[.!?])\s+/);
      if (sentences[0] && sentences[0].length > 15) result.problem = sentences[0].trim();
    }
  } else {
    const sentences = text.split(/(?<=[.!?])\s+/);
    if (sentences[0] && sentences[0].length > 20) result.problem = sentences[0].trim() + (sentences[0].match(/[.!?]$/) ? "" : ".");
  }

  return result;
}

interface CROInsightCardProps {
  insight: string;
  category: string;
  index?: number;
  compact?: boolean;
}

export default function CROInsightCard({ insight, category, index, compact }: CROInsightCardProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [copied, setCopied] = useState(false);
  const parsed = parseInsight(insight);

  const hasStructure = parsed.action || parsed.principle || parsed.impact || parsed.problem;
  // Fallback: split first sentence as problem, rest as recommendation
  if (!parsed.problem && insight.length > 60) {
    const firstSentence = insight.match(/^[^.!?]+[.!?]?/)?.[0]?.trim();
    if (firstSentence && firstSentence.length > 20) {
      parsed.problem = firstSentence;
      parsed.action = insight.slice(firstSentence.length).trim();
    }
  }
  const showStructured = hasStructure || parsed.problem;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const toCopy = parsed.action || parsed.raw;
    navigator.clipboard.writeText(toCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEffortBadge = () => {
    if (!parsed.effort) return null;
    const colors = {
      low: "bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/40",
      medium: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40",
      high: "bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/40",
    };
    return (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${colors[parsed.effort]}`}>
        {parsed.effort} effort
      </span>
    );
  };

  return (
    <div
      className={`bg-[#111111] rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-[#7c5cff]/30 transition-all ${
        compact ? "" : "p-4"
      }`}
    >
      <div
        className={`flex items-start gap-3 ${compact ? "cursor-pointer p-3" : ""}`}
        onClick={compact ? () => setExpanded(!expanded) : undefined}
      >
        <div className="w-1.5 h-1.5 bg-[#7c5cff] rounded-full mt-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {showStructured && expanded ? (
            <div className="space-y-3">
              {parsed.problem && (
                <div>
                  <span className="text-[10px] font-bold text-[#ff6b6b] uppercase">Problem</span>
                  <p className="text-[13px] text-[#fafafa] mt-0.5 leading-relaxed">{parsed.problem}</p>
                </div>
              )}
              {parsed.action && (
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-[#00d4aa] uppercase">Action</span>
                    <p className="text-[13px] text-[#fafafa] mt-0.5 leading-relaxed">{parsed.action}</p>
                    {!compact && (
                      <button
                        onClick={handleCopy}
                        className="mt-2 flex items-center gap-1.5 text-[11px] text-[#7c5cff] hover:text-[#00d4aa] transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied!" : "Copy to clipboard"}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {parsed.principle && (
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-[#7c5cff] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-[#7c5cff] uppercase">Principle</span>
                    <p className="text-[12px] text-[#888888] mt-0.5 leading-relaxed">{parsed.principle}</p>
                  </div>
                </div>
              )}
              {(parsed.impact || parsed.effort) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {parsed.impact && (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#00d4aa]">
                      <Zap className="w-3.5 h-3.5" />
                      {parsed.impact}
                    </span>
                  )}
                  {getEffortBadge()}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[14px] text-[#888888] leading-relaxed">{insight}</p>
          )}
        </div>
        {compact && (
          <button className="flex-shrink-0 text-[#666] hover:text-[#fafafa] p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
