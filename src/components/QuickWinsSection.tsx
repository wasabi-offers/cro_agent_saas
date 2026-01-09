"use client";

import { Zap, Clock, TrendingUp, ArrowRight } from "lucide-react";

interface QuickWin {
  id: string;
  title: string;
  description: string;
  effort: "1 hour" | "1 day" | "3 days" | "1 week";
  impact: "low" | "medium" | "high";
  expectedIncrease: string;
  page: string;
}

export default function QuickWinsSection() {
  const quickWins: QuickWin[] = [
    {
      id: "1",
      title: "Fix Mobile Form Field Size",
      description: "Increase mobile form input fields to 44px minimum (WCAG standard)",
      effort: "1 hour",
      impact: "high",
      expectedIncrease: "+12% mobile CR",
      page: "Checkout"
    },
    {
      id: "2",
      title: "Add Trust Badges to Cart",
      description: "Display security badges and payment icons above checkout button",
      effort: "1 day",
      impact: "high",
      expectedIncrease: "+8% cart conversion",
      page: "Cart"
    },
    {
      id: "3",
      title: "Reduce Form Fields",
      description: "Remove optional 'Company' and 'Phone' fields from signup",
      effort: "1 hour",
      impact: "medium",
      expectedIncrease: "+15% form completion",
      page: "Signup"
    }
  ];

  const getImpactColor = (impact: QuickWin["impact"]) => {
    switch (impact) {
      case "high":
        return { bg: "bg-[#00d4aa]/20", text: "text-[#00d4aa]", border: "border-[#00d4aa]/30" };
      case "medium":
        return { bg: "bg-[#f59e0b]/20", text: "text-[#f59e0b]", border: "border-[#f59e0b]/30" };
      case "low":
        return { bg: "bg-[#7c5cff]/20", text: "text-[#7c5cff]", border: "border-[#7c5cff]/30" };
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-[#f59e0b]" />
          <h3 className="text-[18px] font-semibold text-[#fafafa]">Quick Wins</h3>
        </div>
        <span className="text-[13px] text-[#888888]">
          Fastest ROI · Low effort, high impact
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickWins.map((win, index) => {
          const impactConfig = getImpactColor(win.impact);

          return (
            <div
              key={win.id}
              className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#7c5cff]/50 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] flex items-center justify-center">
                    <span className="text-[12px] font-bold text-white">{index + 1}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md border ${impactConfig.bg} ${impactConfig.border}`}>
                    <span className={`text-[10px] font-bold uppercase ${impactConfig.text}`}>
                      {win.impact} impact
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <h4 className="text-[15px] font-semibold text-[#fafafa] mb-2">
                {win.title}
              </h4>
              <p className="text-[13px] text-[#888888] mb-4 line-clamp-2">
                {win.description}
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#111111] rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#7c5cff]" />
                    <span className="text-[11px] text-[#888888]">Effort</span>
                  </div>
                  <span className="text-[13px] font-semibold text-[#fafafa]">{win.effort}</span>
                </div>
                <div className="bg-[#111111] rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00d4aa]" />
                    <span className="text-[11px] text-[#888888]">Expected</span>
                  </div>
                  <span className="text-[13px] font-semibold text-[#00d4aa]">{win.expectedIncrease}</span>
                </div>
              </div>

              {/* Action */}
              <button className="w-full bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white px-4 py-2.5 rounded-lg text-[13px] font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 group-hover:gap-3">
                Start Implementation
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Page tag */}
              <div className="mt-3 text-center">
                <span className="text-[11px] text-[#666666]">
                  Page: <span className="text-[#888888]">{win.page}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
