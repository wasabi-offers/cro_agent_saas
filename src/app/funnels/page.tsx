"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Users,
  Target,
  AlertTriangle,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import {
  generateMockFunnels,
  ConversionFunnel,
} from "@/lib/mock-data";

export default function FunnelsPage() {
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = generateMockFunnels();
      setFunnels(data);
      if (data.length > 0) {
        setSelectedFunnel(data[0].id);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  const activeFunnel = funnels.find((f) => f.id === selectedFunnel);

  // Calculate step-by-step conversion rates
  const getStepConversion = (currentVisitors: number, previousVisitors: number) => {
    if (previousVisitors === 0) return 100;
    return (currentVisitors / previousVisitors) * 100;
  };

  // Get color based on dropoff severity
  const getDropoffColor = (dropoff: number) => {
    if (dropoff >= 60) return 'text-[#ff6b6b]';
    if (dropoff >= 40) return 'text-[#f59e0b]';
    return 'text-[#00d4aa]';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="Funnels" breadcrumb={["Dashboard", "Funnels"]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666666] text-[14px]">Loading funnels...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title="Funnels" breadcrumb={["Dashboard", "Funnels"]} />

      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-[#fafafa] mb-2">Conversion Funnels</h1>
            <p className="text-[14px] text-[#666666]">
              Track user journeys and identify drop-off points
            </p>
          </div>
        </div>

        {/* Funnel Selector */}
        <div className="flex gap-4 mb-8">
          {funnels.map((funnel) => (
            <button
              key={funnel.id}
              onClick={() => setSelectedFunnel(funnel.id)}
              className={`px-6 py-4 rounded-xl transition-all ${
                selectedFunnel === funnel.id
                  ? 'bg-[#7c5cff]/20 border-2 border-[#7c5cff]'
                  : 'bg-[#0a0a0a] border-2 border-white/10 hover:border-white/20'
              }`}
            >
              <p className={`text-[14px] font-medium ${selectedFunnel === funnel.id ? 'text-[#fafafa]' : 'text-[#888888]'}`}>
                {funnel.name}
              </p>
              <p className={`text-[24px] font-bold mt-1 ${selectedFunnel === funnel.id ? 'text-[#00d4aa]' : 'text-[#666666]'}`}>
                {funnel.conversionRate.toFixed(1)}%
              </p>
              <p className="text-[11px] text-[#555555]">conversion rate</p>
            </button>
          ))}
        </div>

        {/* Main Funnel Visualization */}
        {activeFunnel && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Funnel Steps */}
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[18px] font-semibold text-[#fafafa]">{activeFunnel.name}</h2>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#00d4aa]" />
                  <span className="text-[16px] font-bold text-[#00d4aa]">
                    {activeFunnel.conversionRate.toFixed(1)}% overall
                  </span>
                </div>
              </div>

              {/* Funnel Visualization */}
              <div className="space-y-4">
                {activeFunnel.steps.map((step, index) => {
                  const isFirst = index === 0;
                  const isLast = index === activeFunnel.steps.length - 1;
                  const prevStep = index > 0 ? activeFunnel.steps[index - 1] : null;
                  const stepConversion = prevStep
                    ? getStepConversion(step.visitors, prevStep.visitors)
                    : 100;
                  const widthPercentage = (step.visitors / activeFunnel.steps[0].visitors) * 100;

                  return (
                    <div key={step.name}>
                      {/* Drop-off Arrow */}
                      {!isFirst && (
                        <div className="flex items-center gap-4 py-2 pl-8">
                          <ChevronDown className={`w-5 h-5 ${getDropoffColor(step.dropoff)}`} />
                          <span className={`text-[13px] font-medium ${getDropoffColor(step.dropoff)}`}>
                            {step.dropoff}% drop-off
                          </span>
                          <span className="text-[12px] text-[#555555]">
                            ({prevStep!.visitors - step.visitors} users lost)
                          </span>
                        </div>
                      )}

                      {/* Step Bar */}
                      <div className="relative">
                        <div
                          className={`h-20 rounded-xl flex items-center px-6 transition-all ${
                            isLast
                              ? 'bg-gradient-to-r from-[#00d4aa]/30 to-[#00d4aa]/10 border border-[#00d4aa]/30'
                              : 'bg-gradient-to-r from-[#7c5cff]/30 to-[#7c5cff]/10 border border-[#7c5cff]/30'
                          }`}
                          style={{ width: `${Math.max(widthPercentage, 20)}%` }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLast ? 'bg-[#00d4aa]/20' : 'bg-[#7c5cff]/20'}`}>
                                <span className={`text-[14px] font-bold ${isLast ? 'text-[#00d4aa]' : 'text-[#7c5cff]'}`}>
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="text-[14px] font-medium text-[#fafafa]">{step.name}</p>
                                <p className="text-[12px] text-[#666666]">
                                  {stepConversion.toFixed(1)}% of previous step
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-[20px] font-bold ${isLast ? 'text-[#00d4aa]' : 'text-[#fafafa]'}`}>
                                {step.visitors.toLocaleString()}
                              </p>
                              <p className="text-[11px] text-[#666666]">users</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insights Panel */}
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                <h3 className="text-[16px] font-semibold text-[#fafafa] mb-4">Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-[13px] text-[#888888]">Total Entered</span>
                    <span className="text-[14px] text-[#fafafa] font-medium">
                      {activeFunnel.steps[0].visitors.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-[13px] text-[#888888]">Converted</span>
                    <span className="text-[14px] text-[#00d4aa] font-medium">
                      {activeFunnel.steps[activeFunnel.steps.length - 1].visitors.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-[13px] text-[#888888]">Lost Users</span>
                    <span className="text-[14px] text-[#ff6b6b] font-medium">
                      {(activeFunnel.steps[0].visitors - activeFunnel.steps[activeFunnel.steps.length - 1].visitors).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-[#888888]">Steps</span>
                    <span className="text-[14px] text-[#fafafa] font-medium">
                      {activeFunnel.steps.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Biggest Drop-offs */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-[#ff6b6b]" />
                  <h3 className="text-[16px] font-semibold text-[#fafafa]">Biggest Drop-offs</h3>
                </div>
                
                <div className="space-y-3">
                  {[...activeFunnel.steps]
                    .filter((s) => s.dropoff > 0)
                    .sort((a, b) => b.dropoff - a.dropoff)
                    .slice(0, 3)
                    .map((step, index) => (
                      <div
                        key={step.name}
                        className="flex items-center justify-between p-3 bg-[#111111] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[#555555] font-bold">#{index + 1}</span>
                          <span className="text-[13px] text-[#fafafa]">{step.name}</span>
                        </div>
                        <span className={`text-[14px] font-bold ${getDropoffColor(step.dropoff)}`}>
                          -{step.dropoff}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-br from-[#7c5cff]/20 to-[#7c5cff]/5 border border-[#7c5cff]/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-[#f59e0b]" />
                  <h3 className="text-[16px] font-semibold text-[#fafafa]">AI Insights</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-[#0a0a0a]/50 rounded-lg">
                    <p className="text-[13px] text-[#cccccc] leading-relaxed">
                      The highest drop-off occurs at the <span className="text-[#7c5cff] font-medium">
                      {activeFunnel.steps.reduce((max, step) => step.dropoff > max.dropoff ? step : max, activeFunnel.steps[0]).name}
                      </span> step. Consider simplifying this stage or adding progress indicators.
                    </p>
                  </div>
                  <div className="p-3 bg-[#0a0a0a]/50 rounded-lg">
                    <p className="text-[13px] text-[#cccccc] leading-relaxed">
                      Your funnel has a <span className="text-[#00d4aa] font-medium">{activeFunnel.conversionRate.toFixed(1)}%</span> conversion rate. 
                      Industry average is 3-5% for e-commerce.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


