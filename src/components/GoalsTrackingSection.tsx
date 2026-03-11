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
          <Target className="w-5 h-5 text-[#6366F1]" />
          <h3 className="text-[18px] font-semibold text-[#F8FAFC]">Goals & Targets</h3>
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
              className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-[#6366F1]/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#6366F1]" />
                </div>
                <span className="text-[11px] text-[#64748B]">{goal.period}</span>
              </div>

              {/* Metric */}
              <h4 className="text-[14px] font-medium text-[#94A3B8] mb-2">
                {goal.metric}
              </h4>

              {/* Values */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-[28px] font-bold text-[#F8FAFC]">
                  {goal.current.toLocaleString()}
                </span>
                <span className="text-[14px] text-[#64748B]">
                  / {goal.target.toLocaleString()}{goal.unit}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAhead
                        ? 'bg-gradient-to-r from-[#06B6D4] to-[#06B6D4]'
                        : isOnTrack
                        ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]'
                        : 'bg-gradient-to-r from-[#EF4444] to-[#f59e0b]'
                    }`}
                    style={{ width: `${progressCapped}%` }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold" style={{
                  color: isAhead ? '#06B6D4' : isOnTrack ? '#6366F1' : '#f59e0b'
                }}>
                  {progressCapped.toFixed(0)}% Complete
                </span>
                <span className="text-[12px] text-[#64748B]">
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
