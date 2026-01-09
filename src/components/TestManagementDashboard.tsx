"use client";

import { useState } from "react";
import { Play, CheckCircle, Clock, TrendingUp, Users, Calendar, Target, BarChart3, XCircle } from "lucide-react";

type TestStatus = "running" | "completed" | "scheduled";

interface ABTest {
  id: string;
  name: string;
  funnel: string;
  page: string;
  status: TestStatus;
  startDate: string;
  endDate?: string;
  duration: number; // days
  progress: number; // 0-100
  variants: {
    name: string;
    traffic: number;
    visitors: number;
    conversions: number;
    conversionRate: number;
  }[];
  winner?: string;
  confidence?: number;
  expectedLift?: number;
  actualLift?: number;
}

export default function TestManagementDashboard() {
  const [activeTab, setActiveTab] = useState<TestStatus>("running");

  const tests: ABTest[] = [
    // Running Tests
    {
      id: "1",
      name: "Checkout Button Color Test",
      funnel: "E-commerce Checkout",
      page: "Payment Page",
      status: "running",
      startDate: "2026-01-02",
      duration: 14,
      progress: 43,
      variants: [
        { name: "Control (Green)", traffic: 50, visitors: 2340, conversions: 187, conversionRate: 7.99 },
        { name: "Variant (Purple)", traffic: 50, visitors: 2298, conversions: 204, conversionRate: 8.88 }
      ],
      confidence: 78,
      expectedLift: 10
    },
    {
      id: "2",
      name: "Headline Copy Test",
      funnel: "SaaS Free Trial",
      page: "Landing Page",
      status: "running",
      startDate: "2025-12-28",
      duration: 21,
      progress: 57,
      variants: [
        { name: "Control", traffic: 50, visitors: 4521, conversions: 316, conversionRate: 6.99 },
        { name: "Variant A", traffic: 50, visitors: 4489, conversions: 305, conversionRate: 6.79 }
      ],
      confidence: 45,
      expectedLift: 15
    },
    {
      id: "3",
      name: "Form Field Reduction",
      funnel: "Lead Generation",
      page: "Contact Form",
      status: "running",
      startDate: "2026-01-05",
      duration: 10,
      progress: 30,
      variants: [
        { name: "Control (8 fields)", traffic: 50, visitors: 1240, conversions: 89, conversionRate: 7.18 },
        { name: "Variant (5 fields)", traffic: 50, visitors: 1218, conversions: 104, conversionRate: 8.54 }
      ],
      confidence: 62,
      expectedLift: 20
    },
    // Completed Tests
    {
      id: "4",
      name: "Trust Badge Placement",
      funnel: "E-commerce Checkout",
      page: "Cart Page",
      status: "completed",
      startDate: "2025-12-01",
      endDate: "2025-12-15",
      duration: 14,
      progress: 100,
      variants: [
        { name: "Control (Footer)", traffic: 50, visitors: 5240, conversions: 419, conversionRate: 7.99 },
        { name: "Variant (Header)", traffic: 50, visitors: 5198, conversions: 483, conversionRate: 9.29 }
      ],
      winner: "Variant (Header)",
      confidence: 98,
      actualLift: 16.3
    },
    {
      id: "5",
      name: "Social Proof Test",
      funnel: "SaaS Free Trial",
      page: "Pricing Page",
      status: "completed",
      startDate: "2025-11-15",
      endDate: "2025-11-29",
      duration: 14,
      progress: 100,
      variants: [
        { name: "Control (No testimonials)", traffic: 50, visitors: 3890, conversions: 234, conversionRate: 6.02 },
        { name: "Variant (Testimonials)", traffic: 50, visitors: 3912, conversions: 305, conversionRate: 7.80 }
      ],
      winner: "Variant (Testimonials)",
      confidence: 99,
      actualLift: 29.6
    },
    // Scheduled Tests
    {
      id: "6",
      name: "Mobile Navigation Redesign",
      funnel: "E-commerce Checkout",
      page: "All Pages",
      status: "scheduled",
      startDate: "2026-01-15",
      duration: 21,
      progress: 0,
      variants: [
        { name: "Control (Hamburger)", traffic: 50, visitors: 0, conversions: 0, conversionRate: 0 },
        { name: "Variant (Bottom Nav)", traffic: 50, visitors: 0, conversions: 0, conversionRate: 0 }
      ],
      expectedLift: 25
    },
    {
      id: "7",
      name: "Free Shipping Threshold",
      funnel: "E-commerce Checkout",
      page: "Cart Page",
      status: "scheduled",
      startDate: "2026-01-20",
      duration: 14,
      progress: 0,
      variants: [
        { name: "Control (€50)", traffic: 50, visitors: 0, conversions: 0, conversionRate: 0 },
        { name: "Variant (€35)", traffic: 50, visitors: 0, conversions: 0, conversionRate: 0 }
      ],
      expectedLift: 12
    }
  ];

  const filteredTests = tests.filter(test => test.status === activeTab);

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case "running":
        return { bg: "bg-[#00d4aa]/20", text: "text-[#00d4aa]", border: "border-[#00d4aa]/30" };
      case "completed":
        return { bg: "bg-[#7c5cff]/20", text: "text-[#7c5cff]", border: "border-[#7c5cff]/30" };
      case "scheduled":
        return { bg: "bg-[#f59e0b]/20", text: "text-[#f59e0b]", border: "border-[#f59e0b]/30" };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return "text-[#00d4aa]";
    if (confidence >= 80) return "text-[#7c5cff]";
    if (confidence >= 60) return "text-[#f59e0b]";
    return "text-[#888888]";
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-[#7c5cff]" />
          <h3 className="text-[18px] font-semibold text-[#fafafa]">Test Management</h3>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[#888888]">
          <span>{tests.filter(t => t.status === 'running').length} Running</span>
          <span>·</span>
          <span>{tests.filter(t => t.status === 'completed').length} Completed</span>
          <span>·</span>
          <span>{tests.filter(t => t.status === 'scheduled').length} Scheduled</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-1">
        <button
          onClick={() => setActiveTab("running")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
            activeTab === "running"
              ? "bg-[#00d4aa] text-black"
              : "text-[#888888] hover:text-[#fafafa]"
          }`}
        >
          <Play className="w-4 h-4" />
          Running ({tests.filter(t => t.status === 'running').length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
            activeTab === "completed"
              ? "bg-[#7c5cff] text-white"
              : "text-[#888888] hover:text-[#fafafa]"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Completed ({tests.filter(t => t.status === 'completed').length})
        </button>
        <button
          onClick={() => setActiveTab("scheduled")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
            activeTab === "scheduled"
              ? "bg-[#f59e0b] text-black"
              : "text-[#888888] hover:text-[#fafafa]"
          }`}
        >
          <Clock className="w-4 h-4" />
          Scheduled ({tests.filter(t => t.status === 'scheduled').length})
        </button>
      </div>

      {/* Test Cards */}
      <div className="space-y-4">
        {filteredTests.map((test) => {
          const statusConfig = getStatusColor(test.status);
          const controlVariant = test.variants[0];
          const testVariant = test.variants[1];
          const currentLift = testVariant.conversionRate > 0
            ? ((testVariant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate * 100)
            : 0;

          return (
            <div
              key={test.id}
              className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#7c5cff]/50 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-[16px] font-semibold text-[#fafafa]">{test.name}</h4>
                    <div className={`px-2 py-1 rounded-md border ${statusConfig.bg} ${statusConfig.border}`}>
                      <span className={`text-[10px] font-bold uppercase ${statusConfig.text}`}>
                        {test.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-[#888888]">
                    <span>Funnel: {test.funnel}</span>
                    <span>·</span>
                    <span>Page: {test.page}</span>
                  </div>
                </div>
                {test.status === "completed" && test.winner && (
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-[#00d4aa] mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-[12px] font-semibold">Winner: {test.winner}</span>
                    </div>
                    <span className="text-[13px] font-bold text-[#00d4aa]">
                      +{test.actualLift}% Lift
                    </span>
                  </div>
                )}
              </div>

              {/* Timeline */}
              {test.status !== "scheduled" && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[#888888]">
                      {test.status === "running" ? "Progress" : "Completed"}
                    </span>
                    <span className="text-[11px] text-[#888888]">
                      {test.status === "running" ? `${test.progress}% · ${Math.ceil((100 - test.progress) / (100 / test.duration))} days left` : test.endDate}
                    </span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] rounded-full transition-all duration-500"
                      style={{ width: `${test.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {test.status === "scheduled" && (
                <div className="mb-4 p-3 bg-[#111111] rounded-lg border border-[#f59e0b]/20">
                  <div className="flex items-center gap-2 text-[13px]">
                    <Calendar className="w-4 h-4 text-[#f59e0b]" />
                    <span className="text-[#888888]">Scheduled to start:</span>
                    <span className="text-[#fafafa] font-medium">{test.startDate}</span>
                    <span className="text-[#888888]">·</span>
                    <span className="text-[#888888]">{test.duration} days duration</span>
                  </div>
                </div>
              )}

              {/* Variants Comparison */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {test.variants.map((variant, idx) => (
                  <div
                    key={idx}
                    className={`bg-[#111111] border rounded-lg p-4 ${
                      test.winner === variant.name
                        ? "border-[#00d4aa]"
                        : "border-[#2a2a2a]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] font-semibold text-[#fafafa]">{variant.name}</span>
                      <span className="text-[11px] text-[#888888]">{variant.traffic}% traffic</span>
                    </div>

                    {test.status !== "scheduled" && (
                      <>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Users className="w-3 h-3 text-[#7c5cff]" />
                              <span className="text-[10px] text-[#888888]">Visitors</span>
                            </div>
                            <span className="text-[14px] font-bold text-[#fafafa]">
                              {variant.visitors.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Target className="w-3 h-3 text-[#00d4aa]" />
                              <span className="text-[10px] text-[#888888]">Conv.</span>
                            </div>
                            <span className="text-[14px] font-bold text-[#fafafa]">
                              {variant.conversions}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#2a2a2a]">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#888888]">Conv. Rate</span>
                            <span className="text-[16px] font-bold text-[#00d4aa]">
                              {variant.conversionRate.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {test.status === "scheduled" && (
                      <div className="text-center py-3">
                        <span className="text-[12px] text-[#666666]">Not started yet</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#888888]" />
                    <span className="text-[12px] text-[#888888]">
                      {test.status === "scheduled" ? "Starts" : "Started"}: {test.startDate}
                    </span>
                  </div>

                  {test.status !== "scheduled" && test.confidence && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#888888]" />
                      <span className={`text-[12px] font-semibold ${getConfidenceColor(test.confidence)}`}>
                        {test.confidence}% Confidence
                      </span>
                    </div>
                  )}

                  {test.status === "running" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#888888]">Current Lift:</span>
                      <span className={`text-[12px] font-semibold ${currentLift > 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'}`}>
                        {currentLift > 0 ? '+' : ''}{currentLift.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {test.status === "running" && (
                    <>
                      <button className="px-3 py-1.5 bg-[#111111] border border-[#ff6b6b]/30 text-[#ff6b6b] rounded-lg text-[11px] font-medium hover:bg-[#ff6b6b]/10 transition-all flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        Stop Test
                      </button>
                      <button className="px-3 py-1.5 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white rounded-lg text-[11px] font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                        View Details
                      </button>
                    </>
                  )}

                  {test.status === "completed" && (
                    <>
                      <button className="px-3 py-1.5 bg-[#111111] border border-[#00d4aa]/30 text-[#00d4aa] rounded-lg text-[11px] font-medium hover:bg-[#00d4aa]/10 transition-all">
                        Implement Winner
                      </button>
                      <button className="px-3 py-1.5 bg-[#111111] border border-[#7c5cff]/30 text-[#7c5cff] rounded-lg text-[11px] font-medium hover:bg-[#7c5cff]/10 transition-all">
                        View Report
                      </button>
                    </>
                  )}

                  {test.status === "scheduled" && (
                    <>
                      <button className="px-3 py-1.5 bg-[#111111] border border-[#888888]/30 text-[#888888] rounded-lg text-[11px] font-medium hover:bg-[#888888]/10 transition-all">
                        Edit Test
                      </button>
                      <button className="px-3 py-1.5 bg-gradient-to-r from-[#f59e0b] to-[#ff6b6b] text-white rounded-lg text-[11px] font-medium hover:shadow-lg hover:shadow-orange-500/20 transition-all">
                        Start Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
