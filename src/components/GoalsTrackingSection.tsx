"use client";

import { Target, TrendingUp, Calendar } from "lucide-react";

interface Goal {
  id: string;
  metric: string;
  current: number;
  target: number;
  unit: string;
  period: string;
  icon: React.ElementType;
}

export default function GoalsTrackingSection() {
  const goals: Goal[] = [
    {
      id: "1",
      metric: "Monthly Conversions",
      current: 1847,
      target: 2500,
      unit: "",
      period: "February 2026",
      icon: Target
    },
    {
      id: "2",
      metric: "Conversion Rate",
      current: 6.2,
      target: 8.0,
      unit: "%",
      period: "Q1 2026",
      icon: TrendingUp
    },
    {
      id: "3",
      metric: "A/B Tests Completed",
      current: 4,
      target: 8,
      unit: " tests",
      period: "This Month",
      icon: Calendar
    }
  ];

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-[#7c5cff]" />
          <h3 className="text-[18px] font-semibold text-[#fafafa]">Goals & Targets</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const progress = (goal.current / goal.target) * 100;
          const progressCapped = Math.min(progress, 100);
          const isOnTrack = progress >= 70;
          const isAhead = progress >= 100;

          return (
            <div
              key={goal.id}
              className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#7c5cff]" />
                </div>
                <span className="text-[11px] text-[#666666]">{goal.period}</span>
              </div>

              {/* Metric */}
              <h4 className="text-[14px] font-medium text-[#888888] mb-2">
                {goal.metric}
              </h4>

              {/* Values */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-[28px] font-bold text-[#fafafa]">
                  {goal.current.toLocaleString()}
                </span>
                <span className="text-[14px] text-[#666666]">
                  / {goal.target.toLocaleString()}{goal.unit}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAhead
                        ? 'bg-gradient-to-r from-[#00d4aa] to-[#00d4aa]'
                        : isOnTrack
                        ? 'bg-gradient-to-r from-[#7c5cff] to-[#00d4aa]'
                        : 'bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b]'
                    }`}
                    style={{ width: `${progressCapped}%` }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold" style={{
                  color: isAhead ? '#00d4aa' : isOnTrack ? '#7c5cff' : '#f59e0b'
                }}>
                  {progressCapped.toFixed(0)}% Complete
                </span>
                <span className="text-[12px] text-[#666666]">
                  {isAhead ? '🎉 Target exceeded!' : isOnTrack ? '✓ On track' : '⚠ Behind'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
