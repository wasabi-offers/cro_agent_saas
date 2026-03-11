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
        { name: "Control (Blue)", traffic: 50, visitors: 2340, conversions: 187, conversionRate: 7.99 },
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
        return { bg: "bg-[#06B6D4]/20", text: "text-[#06B6D4]", border: "border-[#06B6D4]/30" };
      case "completed":
        return { bg: "bg-[#6366F1]/20", text: "text-[#6366F1]", border: "border-[#6366F1]/30" };
      case "scheduled":
        return { bg: "bg-[#f59e0b]/20", text: "text-[#f59e0b]", border: "border-[#f59e0b]/30" };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return "text-[#06B6D4]";
    if (confidence >= 80) return "text-[#6366F1]";
    if (confidence >= 60) return "text-[#f59e0b]";
    return "text-[#94A3B8]";
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-[#6366F1]" />
          <h3 className="text-[18px] font-semibold text-[#F8FAFC]">Test Management</h3>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[#94A3B8]">
          <span>{tests.filter(t => t.status === 'running').length} Running</span>
          <span>·</span>
          <span>{tests.filter(t => t.status === 'completed').length} Completed</span>
          <span>·</span>
          <span>{tests.filter(t => t.status === 'scheduled').length} Scheduled</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-[#0B0F19] border border-[#1E293B] rounded-xl p-1">
        <button
          onClick={() => setActiveTab("running")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
            activeTab === "running"
              ? "bg-[#06B6D4] text-black"
              : "text-[#94A3B8] hover:text-[#F8FAFC]"
          }`}
        >
          <Play className="w-4 h-4" />
          Running ({tests.filter(t => t.status === 'running').length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
            activeTab === "completed"
              ? "bg-[#6366F1] text-white"
              : "text-[#94A3B8] hover:text-[#F8FAFC]"
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
              : "text-[#94A3B8] hover:text-[#F8FAFC]"
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
              className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-6 hover:border-[#6366F1]/50 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-[16px] font-semibold text-[#F8FAFC]">{test.name}</h4>
                    <div className={`px-2 py-1 rounded-md border ${statusConfig.bg} ${statusConfig.border}`}>
                      <span className={`text-[10px] font-bold uppercase ${statusConfig.text}`}>
                        {test.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-[#94A3B8]">
                    <span>Funnel: {test.funnel}</span>
                    <span>·</span>
                    <span>Page: {test.page}</span>
                  </div>
                </div>
                {test.status === "completed" && test.winner && (
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-[#06B6D4] mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-[12px] font-semibold">Winner: {test.winner}</span>
                    </div>
                    <span className="text-[13px] font-bold text-[#06B6D4]">
                      +{test.actualLift}% Lift
                    </span>
                  </div>
                )}
              </div>

              {/* Timeline */}
              {test.status !== "scheduled" && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[#94A3B8]">
                      {test.status === "running" ? "Progress" : "Completed"}
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">
                      {test.status === "running" ? `${test.progress}% · ${Math.ceil((100 - test.progress) / (100 / test.duration))} days left` : test.endDate}
                    </span>
                  </div>
                  <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full transition-all duration-500"
                      style={{ width: `${test.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {test.status === "scheduled" && (
                <div className="mb-4 p-3 bg-[#111827] rounded-lg border border-[#f59e0b]/20">
                  <div className="flex items-center gap-2 text-[13px]">
                    <Calendar className="w-4 h-4 text-[#f59e0b]" />
                    <span className="text-[#94A3B8]">Scheduled to start:</span>
                    <span className="text-[#F8FAFC] font-medium">{test.startDate}</span>
                    <span className="text-[#94A3B8]">·</span>
                    <span className="text-[#94A3B8]">{test.duration} days duration</span>
                  </div>
                </div>
              )}

              {/* Variants Comparison */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {test.variants.map((variant, idx) => (
                  <div
                    key={idx}
                    className={`bg-[#111827] border rounded-lg p-4 ${
                      test.winner === variant.name
                        ? "border-[#06B6D4]"
                        : "border-[#1E293B]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] font-semibold text-[#F8FAFC]">{variant.name}</span>
                      <span className="text-[11px] text-[#94A3B8]">{variant.traffic}% traffic</span>
                    </div>

                    {test.status !== "scheduled" && (
                      <>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Users className="w-3 h-3 text-[#6366F1]" />
                              <span className="text-[10px] text-[#94A3B8]">Visitors</span>
                            </div>
                            <span className="text-[14px] font-bold text-[#F8FAFC]">
                              {variant.visitors.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Target className="w-3 h-3 text-[#06B6D4]" />
                              <span className="text-[10px] text-[#94A3B8]">Conv.</span>
                            </div>
                            <span className="text-[14px] font-bold text-[#F8FAFC]">
                              {variant.conversions}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#1E293B]">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#94A3B8]">Conv. Rate</span>
                            <span className="text-[16px] font-bold text-[#06B6D4]">
                              {variant.conversionRate.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {test.status === "scheduled" && (
                      <div className="text-center py-3">
                        <span className="text-[12px] text-[#64748B]">Not started yet</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-[#1E293B]">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#94A3B8]" />
                    <span className="text-[12px] text-[#94A3B8]">
                      {test.status === "scheduled" ? "Starts" : "Started"}: {test.startDate}
                    </span>
                  </div>

                  {test.status !== "scheduled" && test.confidence && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#94A3B8]" />
                      <span className={`text-[12px] font-semibold ${getConfidenceColor(test.confidence)}`}>
                        {test.confidence}% Confidence
                      </span>
                    </div>
                  )}

                  {test.status === "running" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#94A3B8]">Current Lift:</span>
                      <span className={`text-[12px] font-semibold ${currentLift > 0 ? 'text-[#06B6D4]' : 'text-[#EF4444]'}`}>
                        {currentLift > 0 ? '+' : ''}{currentLift.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {test.status === "running" && (
                    <>
                      <button className="px-3 py-1.5 bg-[#111827] border border-[#EF4444]/30 text-[#EF4444] rounded-lg text-[11px] font-medium hover:bg-[#EF4444]/10 transition-all flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        Stop Test
                      </button>
                      <button className="px-3 py-1.5 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white rounded-lg text-[11px] font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
                        View Details
                      </button>
                    </>
                  )}

                  {test.status === "completed" && (
                    <>
                      <button className="px-3 py-1.5 bg-[#111827] border border-[#06B6D4]/30 text-[#06B6D4] rounded-lg text-[11px] font-medium hover:bg-[#06B6D4]/10 transition-all">
                        Implement Winner
                      </button>
                      <button className="px-3 py-1.5 bg-[#111827] border border-[#6366F1]/30 text-[#6366F1] rounded-lg text-[11px] font-medium hover:bg-[#6366F1]/10 transition-all">
                        View Report
                      </button>
                    </>
                  )}

                  {test.status === "scheduled" && (
                    <>
                      <button className="px-3 py-1.5 bg-[#111827] border border-[#94A3B8]/30 text-[#94A3B8] rounded-lg text-[11px] font-medium hover:bg-[#94A3B8]/10 transition-all">
                        Edit Test
                      </button>
                      <button className="px-3 py-1.5 bg-gradient-to-r from-[#f59e0b] to-[#EF4444] text-white rounded-lg text-[11px] font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
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
