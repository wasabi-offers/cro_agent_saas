"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Calendar, Target, CheckCircle } from "lucide-react";

interface ScoreHistory {
  date: string;
  overallScore: number;
  categoryScores: {
    cro: number;
    copy: number;
    colors: number;
    experience: number;
  };
  changes?: string[];
}

interface BeforeAfterTrackingProps {
  pageUrl: string;
  history: ScoreHistory[];
}

export default function BeforeAfterTracking({
  pageUrl,
  history,
}: BeforeAfterTrackingProps) {
  const [selectedCategory, setSelectedCategory] = useState<"overall" | "cro" | "copy" | "colors" | "experience">("overall");

  if (history.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-8 text-center">
        <Calendar className="w-12 h-12 text-[#333333] mx-auto mb-4" />
        <p className="text-[14px] text-[#666666]">
          No historical data available yet. Run multiple analyses to see improvement over time.
        </p>
      </div>
    );
  }

  const categories = [
    { id: "overall", label: "Overall Score", key: null },
    { id: "cro", label: "CRO", key: "cro" },
    { id: "copy", label: "Copywriting", key: "copy" },
    { id: "colors", label: "Colors", key: "colors" },
    { id: "experience", label: "User Experience", key: "experience" },
  ];

  const getScoreForCategory = (item: ScoreHistory) => {
    if (selectedCategory === "overall") {
      return item.overallScore;
    }
    return item.categoryScores[selectedCategory as keyof typeof item.categoryScores];
  };

  const latestScore = getScoreForCategory(history[history.length - 1]);
  const previousScore = history.length > 1 ? getScoreForCategory(history[history.length - 2]) : latestScore;
  const change = latestScore - previousScore;
  const changePercent = previousScore > 0 ? ((change / previousScore) * 100).toFixed(1) : "0";

  // Calculate min/max for chart scaling
  const scores = history.map(getScoreForCategory);
  const minScore = Math.min(...scores, 0);
  const maxScore = Math.max(...scores, 100);
  const scoreRange = maxScore - minScore;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#00d4aa";
    if (score >= 60) return "#7c5cff";
    if (score >= 40) return "#f59e0b";
    return "#ff6b6b";
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">
              Before/After Score Tracking
            </h3>
            <p className="text-[13px] text-[#888888]">
              Track improvements over time
            </p>
          </div>
          <div className="text-right">
            <div className="text-[32px] font-bold" style={{ color: getScoreColor(latestScore) }}>
              {latestScore}
            </div>
            <div className={`flex items-center gap-1.5 text-[13px] justify-end ${change >= 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'}`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(parseFloat(changePercent))}% {change >= 0 ? 'improvement' : 'decrease'}
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                selectedCategory === category.id
                  ? "bg-[#7c5cff] text-white"
                  : "bg-[#111111] text-[#888888] border border-[#2a2a2a] hover:border-[#7c5cff]/50"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="relative" style={{ height: '300px' }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-[11px] text-[#666666] pr-2">
            <span>{maxScore}</span>
            <span>{Math.round((maxScore + minScore) / 2)}</span>
            <span>{minScore}</span>
          </div>

          {/* Chart area */}
          <div className="absolute left-12 right-0 top-0 bottom-8">
            {/* Grid lines */}
            <div className="absolute inset-0">
              {[0, 25, 50, 75, 100].map((line) => (
                <div
                  key={line}
                  className="absolute left-0 right-0 border-t border-[#1a1a1a]"
                  style={{ bottom: `${line}%` }}
                />
              ))}
            </div>

            {/* Line chart */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Area fill */}
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={getScoreColor(latestScore)} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={getScoreColor(latestScore)} stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {history.length > 1 && (
                <>
                  {/* Area */}
                  <path
                    d={`
                      M 0,100%
                      ${history.map((item, index) => {
                        const x = (index / (history.length - 1)) * 100;
                        const score = getScoreForCategory(item);
                        const y = 100 - ((score - minScore) / scoreRange) * 100;
                        return `L ${x}%,${y}%`;
                      }).join(' ')}
                      L 100%,100%
                      Z
                    `}
                    fill="url(#scoreGradient)"
                  />

                  {/* Line */}
                  <polyline
                    points={history.map((item, index) => {
                      const x = (index / (history.length - 1)) * 100;
                      const score = getScoreForCategory(item);
                      const y = 100 - ((score - minScore) / scoreRange) * 100;
                      return `${x}%,${y}%`;
                    }).join(' ')}
                    fill="none"
                    stroke={getScoreColor(latestScore)}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Data points */}
              {history.map((item, index) => {
                const x = history.length > 1 ? (index / (history.length - 1)) * 100 : 50;
                const score = getScoreForCategory(item);
                const y = 100 - ((score - minScore) / scoreRange) * 100;

                return (
                  <g key={index}>
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill={getScoreColor(score)}
                      stroke="#0a0a0a"
                      strokeWidth="2"
                    />
                    {item.changes && item.changes.length > 0 && (
                      <circle
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="8"
                        fill="none"
                        stroke="#00d4aa"
                        strokeWidth="2"
                        strokeDasharray="2,2"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-12 right-0 bottom-0 h-8 flex justify-between items-end text-[11px] text-[#666666]">
            {history.map((item, index) => (
              <span key={index} className="text-center" style={{
                position: 'absolute',
                left: history.length > 1 ? `${(index / (history.length - 1)) * 100}%` : '50%',
                transform: 'translateX(-50%)'
              }}>
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6 border-t border-[#2a2a2a] space-y-4">
        <h4 className="text-[14px] font-semibold text-[#fafafa] mb-4">Timeline & Changes</h4>

        {history.slice().reverse().map((item, index) => {
          const score = getScoreForCategory(item);
          const previousItem = history[history.length - 1 - index - 1];
          const previousItemScore = previousItem ? getScoreForCategory(previousItem) : null;
          const itemChange = previousItemScore !== null ? score - previousItemScore : 0;

          return (
            <div key={index} className="flex items-start gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: getScoreColor(score),
                    backgroundColor: item.changes && item.changes.length > 0 ? getScoreColor(score) + '20' : 'transparent'
                  }}
                >
                  {item.changes && item.changes.length > 0 && (
                    <CheckCircle className="w-4 h-4" style={{ color: getScoreColor(score) }} />
                  )}
                </div>
                {index < history.length - 1 && (
                  <div className="w-0.5 h-full bg-[#2a2a2a] mt-2" style={{ minHeight: '40px' }}></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-[#888888]">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <div className="flex items-center gap-3">
                    {itemChange !== 0 && (
                      <span className={`text-[12px] font-medium ${itemChange > 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'}`}>
                        {itemChange > 0 ? '+' : ''}{itemChange}
                      </span>
                    )}
                    <span className="text-[16px] font-bold" style={{ color: getScoreColor(score) }}>
                      {score}
                    </span>
                  </div>
                </div>

                {item.changes && item.changes.length > 0 && (
                  <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-3.5 h-3.5 text-[#00d4aa]" />
                      <span className="text-[12px] font-semibold text-[#00d4aa]">
                        Changes Implemented
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {item.changes.map((change, idx) => (
                        <li key={idx} className="text-[12px] text-[#888888] flex items-start gap-2">
                          <span className="text-[#7c5cff] mt-1">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
