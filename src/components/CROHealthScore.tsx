"use client";

import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface CROHealthScoreProps {
  score: number; // 0-100
  previousScore: number;
  breakdown: {
    conversionRate: number;
    bounceRate: number;
    funnelHealth: number;
    testVelocity: number;
  };
}

export default function CROHealthScore({ score, previousScore, breakdown }: CROHealthScoreProps) {
  const change = score - previousScore;
  const changePercent = ((change / previousScore) * 100).toFixed(1);

  const getScoreColor = (score: number) => {
    if (score >= 80) return { color: "#00d4aa", label: "Excellent" };
    if (score >= 60) return { color: "#7c5cff", label: "Good" };
    if (score >= 40) return { color: "#f59e0b", label: "Fair" };
    return { color: "#ff6b6b", label: "Needs Attention" };
  };

  const scoreConfig = getScoreColor(score);

  // Calculate the stroke-dasharray for the circular progress
  const circumference = 2 * Math.PI * 70; // radius = 70
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111111] border border-[#2a2a2a] rounded-2xl p-8">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-[#7c5cff]" />
        <h3 className="text-[18px] font-semibold text-[#fafafa]">CRO Health Score</h3>
      </div>

      <div className="flex items-center gap-8">
        {/* Circular Gauge */}
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#1a1a1a"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={scoreConfig.color}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[36px] font-bold text-[#fafafa]">{score}</span>
            <span className="text-[12px] text-[#888888]">/ 100</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[16px] font-semibold`} style={{ color: scoreConfig.color }}>
              {scoreConfig.label}
            </span>
            <div className={`flex items-center gap-1 text-[13px] ${change >= 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'}`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(parseFloat(changePercent))}%
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(breakdown).map(([key, value]) => {
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase());

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[#888888]">{label}</span>
                    <span className="text-[12px] font-medium text-[#fafafa]">{value}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${value}%`,
                        background: `linear-gradient(to right, ${scoreConfig.color}, ${scoreConfig.color}90)`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
