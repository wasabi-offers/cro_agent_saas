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
    <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Euro className="w-5 h-5 text-[#06B6D4]" />
        <h3 className="text-[16px] font-semibold text-[#F8FAFC]">ROI Estimator</h3>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[12px] text-[#94A3B8] mb-2">Monthly Visitors</label>
          <input
            type="number"
            value={monthlyVisitors}
            onChange={(e) => setMonthlyVisitors(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#111827] border border-[#1E293B] rounded-lg text-[#F8FAFC] text-[14px] focus:outline-none focus:border-[#6366F1]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#94A3B8] mb-2">Current CR (%)</label>
          <input
            type="number"
            step="0.1"
            value={currentCR}
            onChange={(e) => setCurrentCR(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#111827] border border-[#1E293B] rounded-lg text-[#F8FAFC] text-[14px] focus:outline-none focus:border-[#6366F1]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#94A3B8] mb-2">Expected CR Increase (%)</label>
          <input
            type="number"
            value={expectedIncrease}
            onChange={(e) => setExpectedIncrease(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#111827] border border-[#1E293B] rounded-lg text-[#F8FAFC] text-[14px] focus:outline-none focus:border-[#6366F1]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#94A3B8] mb-2">Avg Order Value (€)</label>
          <input
            type="number"
            value={avgOrderValue}
            onChange={(e) => setAvgOrderValue(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#111827] border border-[#1E293B] rounded-lg text-[#F8FAFC] text-[14px] focus:outline-none focus:border-[#6366F1]"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-gradient-to-br from-[#06B6D4]/10 to-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#06B6D4]" />
            <span className="text-[14px] font-semibold text-[#F8FAFC]">Projected Impact</span>
          </div>
          <span className="text-[14px] font-bold text-[#06B6D4]">+{roiPercentage}% ROI</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-[11px] text-[#94A3B8] mb-1">Current CR</p>
            <p className="text-[16px] font-bold text-[#F8FAFC]">{currentCR.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[11px] text-[#94A3B8] mb-1">New CR</p>
            <p className="text-[16px] font-bold text-[#06B6D4]">{newCR.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[11px] text-[#94A3B8] mb-1">Increase</p>
            <p className="text-[16px] font-bold text-[#06B6D4]">+{additionalConversions.toFixed(0)}</p>
          </div>
        </div>

        <div className="h-px bg-[#06B6D4]/20 mb-4" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#94A3B8]">Monthly Additional Revenue</span>
            <span className="text-[16px] font-bold text-[#06B6D4]">
              +€{additionalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#F8FAFC] font-semibold">Annual Additional Revenue</span>
            <span className="text-[18px] font-bold text-[#06B6D4]">
              +€{annualAdditionalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-[#64748B]">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <p>
          Assumes test wins and improvement is sustained. Actual results may vary based on traffic quality, seasonality, and implementation.
        </p>
      </div>
    </div>
  );
}
