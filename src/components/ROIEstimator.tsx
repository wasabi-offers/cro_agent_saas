"use client";

import { Euro, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function ROIEstimator() {
  const [monthlyVisitors, setMonthlyVisitors] = useState(30000);
  const [currentCR, setCurrentCR] = useState(5);
  const [expectedIncrease, setExpectedIncrease] = useState(20);
  const [avgOrderValue, setAvgOrderValue] = useState(50);

  // Calculations
  const currentConversions = (monthlyVisitors * currentCR) / 100;
  const newCR = currentCR * (1 + expectedIncrease / 100);
  const newConversions = (monthlyVisitors * newCR) / 100;
  const additionalConversions = newConversions - currentConversions;

  const currentRevenue = currentConversions * avgOrderValue;
  const newRevenue = newConversions * avgOrderValue;
  const additionalRevenue = newRevenue - currentRevenue;
  const annualAdditionalRevenue = additionalRevenue * 12;

  const roiPercentage = ((additionalRevenue / currentRevenue) * 100).toFixed(1);

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Euro className="w-5 h-5 text-[#00d4aa]" />
        <h3 className="text-[16px] font-semibold text-[#fafafa]">ROI Estimator</h3>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[12px] text-[#888888] mb-2">Monthly Visitors</label>
          <input
            type="number"
            value={monthlyVisitors}
            onChange={(e) => setMonthlyVisitors(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[#fafafa] text-[14px] focus:outline-none focus:border-[#7c5cff]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#888888] mb-2">Current CR (%)</label>
          <input
            type="number"
            step="0.1"
            value={currentCR}
            onChange={(e) => setCurrentCR(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[#fafafa] text-[14px] focus:outline-none focus:border-[#7c5cff]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#888888] mb-2">Expected CR Increase (%)</label>
          <input
            type="number"
            value={expectedIncrease}
            onChange={(e) => setExpectedIncrease(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[#fafafa] text-[14px] focus:outline-none focus:border-[#7c5cff]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#888888] mb-2">Avg Order Value (€)</label>
          <input
            type="number"
            value={avgOrderValue}
            onChange={(e) => setAvgOrderValue(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-[#fafafa] text-[14px] focus:outline-none focus:border-[#7c5cff]"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-gradient-to-br from-[#00d4aa]/10 to-[#00d4aa]/5 border border-[#00d4aa]/20 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#00d4aa]" />
            <span className="text-[14px] font-semibold text-[#fafafa]">Projected Impact</span>
          </div>
          <span className="text-[14px] font-bold text-[#00d4aa]">+{roiPercentage}% ROI</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-[11px] text-[#888888] mb-1">Current CR</p>
            <p className="text-[16px] font-bold text-[#fafafa]">{currentCR.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[11px] text-[#888888] mb-1">New CR</p>
            <p className="text-[16px] font-bold text-[#00d4aa]">{newCR.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[11px] text-[#888888] mb-1">Increase</p>
            <p className="text-[16px] font-bold text-[#00d4aa]">+{additionalConversions.toFixed(0)}</p>
          </div>
        </div>

        <div className="h-px bg-[#00d4aa]/20 mb-4" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#888888]">Monthly Additional Revenue</span>
            <span className="text-[16px] font-bold text-[#00d4aa]">
              +€{additionalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#fafafa] font-semibold">Annual Additional Revenue</span>
            <span className="text-[18px] font-bold text-[#00d4aa]">
              +€{annualAdditionalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-[#666666]">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <p>
          Assumes test wins and improvement is sustained. Actual results may vary based on traffic quality, seasonality, and implementation.
        </p>
      </div>
    </div>
  );
}
