"use client";

import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Target } from "lucide-react";

interface HeatmapInsight {
  id: string;
  type: "opportunity" | "issue" | "success" | "recommendation";
  title: string;
  description: string;
  metric?: string;
  impact: "high" | "medium" | "low";
  confidence: number;
  action: string;
}

interface HeatmapAIInsightsProps {
  page: string;
  heatmapType: "click" | "scroll" | "move";
  insights?: HeatmapInsight[];
}

export default function HeatmapAIInsights({
  page,
  heatmapType,
  insights,
}: HeatmapAIInsightsProps) {
  // Mock insights based on heatmap patterns
  const defaultInsights: Record<string, HeatmapInsight[]> = {
    click: [
      {
        id: "1",
        type: "issue",
        title: "Dead Click Zone Detected",
        description: "Users are clicking on the pricing comparison table headers (42 clicks in the last 24h) expecting them to be sortable, but they're static elements.",
        metric: "42 dead clicks",
        impact: "high",
        confidence: 94,
        action: "Add sortable functionality to table headers or use clearer static design",
      },
      {
        id: "2",
        type: "opportunity",
        title: "Underutilized CTA Button",
        description: "The primary CTA 'Get Started' receives only 12% of total clicks despite prominent positioning. Heat patterns show users focus on feature descriptions instead.",
        metric: "12% click-through",
        impact: "high",
        confidence: 88,
        action: "Test larger button size, contrasting color, or repositioning near most-viewed features",
      },
      {
        id: "3",
        type: "success",
        title: "Effective Navigation Pattern",
        description: "Top navigation receives concentrated clicks (68% of header interactions), indicating clear hierarchy and intuitive labeling.",
        metric: "68% nav engagement",
        impact: "low",
        confidence: 92,
        action: "Maintain current navigation structure as best practice for other pages",
      },
      {
        id: "4",
        type: "recommendation",
        title: "Optimize Footer Links",
        description: "Footer elements show scattered click patterns with no clear hotspots. Users may be searching for specific information.",
        metric: "23 scattered clicks",
        impact: "medium",
        confidence: 76,
        action: "Reorganize footer into clear categories (Company, Product, Resources) with visual hierarchy",
      },
    ],
    scroll: [
      {
        id: "1",
        type: "issue",
        title: "Content Drop-off at 45%",
        description: "Sharp decline in scroll depth at 45% of page. 73% of users never see bottom half of content including testimonials and CTA.",
        metric: "73% abandonment",
        impact: "high",
        confidence: 96,
        action: "Move critical content above fold. Add scroll indicators or break content into tabs",
      },
      {
        id: "2",
        type: "opportunity",
        title: "High Engagement Zone",
        description: "Users spend average 12 seconds in the 20-30% scroll zone (feature comparison). This is 3x longer than other sections.",
        metric: "12s dwell time",
        impact: "high",
        confidence: 89,
        action: "Place conversion-focused CTAs within this engagement zone",
      },
      {
        id: "3",
        type: "recommendation",
        title: "Mobile Scroll Pattern Differs",
        description: "Mobile users scroll 34% deeper on average. Desktop and mobile experiences may need separate optimization strategies.",
        metric: "34% deeper mobile",
        impact: "medium",
        confidence: 82,
        action: "Implement device-specific content ordering based on scroll behavior",
      },
    ],
    move: [
      {
        id: "1",
        type: "opportunity",
        title: "Attention Hotspot Identified",
        description: "Mouse movement patterns show users hover extensively over pricing cards (avg 8.4 seconds) but have low click-through (18%).",
        metric: "8.4s hover, 18% CTR",
        impact: "high",
        confidence: 91,
        action: "Add interactive tooltips or expand cards on hover to reduce friction",
      },
      {
        id: "2",
        type: "issue",
        title: "Confusing UI Element",
        description: "Erratic mouse movements detected around the 'Compare Plans' button, suggesting users are uncertain about its function.",
        metric: "43% erratic movement",
        impact: "medium",
        confidence: 78,
        action: "Clarify button label or add subtitle explaining what comparison shows",
      },
      {
        id: "3",
        type: "success",
        title: "Smooth Navigation Flow",
        description: "Mouse tracking shows linear, confident movements through the main feature list, indicating clear visual hierarchy.",
        metric: "86% linear paths",
        impact: "low",
        confidence: 85,
        action: "Apply this visual design pattern to other product pages",
      },
    ],
  };

  const displayInsights = insights || defaultInsights[heatmapType] || [];

  const getTypeIcon = (type: HeatmapInsight["type"]) => {
    switch (type) {
      case "opportunity":
        return <TrendingUp className="w-5 h-5 text-[#06B6D4]" />;
      case "issue":
        return <AlertTriangle className="w-5 h-5 text-[#EF4444]" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-[#6366F1]" />;
      case "recommendation":
        return <Target className="w-5 h-5 text-[#f59e0b]" />;
    }
  };

  const getTypeColor = (type: HeatmapInsight["type"]) => {
    switch (type) {
      case "opportunity":
        return {
          bg: "bg-[#06B6D4]/10",
          border: "border-[#06B6D4]/30",
          text: "text-[#06B6D4]",
        };
      case "issue":
        return {
          bg: "bg-[#EF4444]/10",
          border: "border-[#EF4444]/30",
          text: "text-[#EF4444]",
        };
      case "success":
        return {
          bg: "bg-[#6366F1]/10",
          border: "border-[#6366F1]/30",
          text: "text-[#6366F1]",
        };
      case "recommendation":
        return {
          bg: "bg-[#f59e0b]/10",
          border: "border-[#f59e0b]/30",
          text: "text-[#f59e0b]",
        };
    }
  };

  const getImpactBadge = (impact: HeatmapInsight["impact"]) => {
    const colors = {
      high: "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30",
      medium: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
      low: "bg-[#94A3B8]/20 text-[#94A3B8] border-[#94A3B8]/30",
    };
    return colors[impact];
  };

  return (
    <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#1E293B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#6366F1]" />
            <div>
              <h3 className="text-[18px] font-semibold text-[#F8FAFC]">
                AI Insights
              </h3>
              <p className="text-[13px] text-[#94A3B8]">
                Pattern analysis for {heatmapType} heatmap on {page}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-[#111827] rounded-lg">
              <span className="text-[11px] text-[#94A3B8]">
                {displayInsights.length} insights found
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="p-6 space-y-4">
        {displayInsights.map((insight) => {
          const colors = getTypeColor(insight.type);

          return (
            <div
              key={insight.id}
              className={`border rounded-xl p-5 ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 bg-[#0B0F19] rounded-lg flex items-center justify-center flex-shrink-0">
                  {getTypeIcon(insight.type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-[16px] font-semibold text-[#F8FAFC]">
                          {insight.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getImpactBadge(insight.impact)}`}>
                          {insight.impact} impact
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-[14px] text-[#94A3B8] leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>

                  {insight.metric && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0B0F19] rounded-lg mb-3">
                      <span className="text-[11px] text-[#64748B]">Metric:</span>
                      <span className={`text-[12px] font-semibold ${colors.text}`}>
                        {insight.metric}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-3 mt-3 pt-3 border-t border-white/10">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-md flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[11px] font-bold">→</span>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#64748B] uppercase tracking-wide mb-1">
                        Recommended Action
                      </p>
                      <p className="text-[14px] text-[#F8FAFC]">
                        {insight.action}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[#1E293B] bg-[#111827]/50">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#64748B]">
            Insights updated in real-time based on user behavior patterns
          </p>
          <button className="px-4 py-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white rounded-lg text-[13px] font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
            Create A/B Tests from Insights
          </button>
        </div>
      </div>
    </div>
  );
}
