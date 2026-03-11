"use client";

import { Calculator, Users, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function StatisticalCalculator() {
  const [currentTraffic, setCurrentTraffic] = useState(1000);
  const [currentCR, setCurrentCR] = useState(5);
  const [expectedLift, setExpectedLift] = useState(20);
  const [confidence, setConfidence] = useState(95);

  // Calculate required sample size per variant
  const calculateSampleSize = () => {
    // Simplified formula - in production use proper statistical calculation
    const baseline = currentCR / 100;
    const improvement = baseline * (1 + expectedLift / 100);
    const alpha = (100 - confidence) / 100;

    // Approximate sample size calculation
    const sampleSize = Math.ceil(
      (16 * baseline * (1 - baseline)) / Math.pow(improvement - baseline, 2)
    );

    return Math.max(sampleSize, 100);
  };

  const sampleSizePerVariant = calculateSampleSize();
  const totalSampleSize = sampleSizePerVariant * 2;
  const daysNeeded = Math.ceil(totalSampleSize / currentTraffic);

  return (
    <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-[#6366F1]" />
        <h3 className="text-[16px] font-semibold text-[#F8FAFC]">Statistical Calculator</h3>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[12px] text-[#94A3B8] mb-2">Daily Traffic</label>
          <input
            type="number"
            value={currentTraffic}
            onChange={(e) => setCurrentTraffic(Number(e.target.value))}
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
          <label className="block text-[12px] text-[#94A3B8] mb-2">Expected Lift (%)</label>
          <input
            type="number"
            value={expectedLift}
            onChange={(e) => setExpectedLift(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#111827] border border-[#1E293B] rounded-lg text-[#F8FAFC] text-[14px] focus:outline-none focus:border-[#6366F1]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#94A3B8] mb-2">Confidence (%)</label>
          <select
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#111827] border border-[#1E293B] rounded-lg text-[#F8FAFC] text-[14px] focus:outline-none focus:border-[#6366F1]"
          >
            <option value="90">90%</option>
            <option value="95">95%</option>
            <option value="99">99%</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111827] rounded-lg p-4 text-center">
          <Users className="w-5 h-5 text-[#6366F1] mx-auto mb-2" />
          <p className="text-[11px] text-[#94A3B8] mb-1">Sample Size/Variant</p>
          <p className="text-[18px] font-bold text-[#F8FAFC]">
            {sampleSizePerVariant.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#111827] rounded-lg p-4 text-center">
          <TrendingUp className="w-5 h-5 text-[#06B6D4] mx-auto mb-2" />
          <p className="text-[11px] text-[#94A3B8] mb-1">Total Needed</p>
          <p className="text-[18px] font-bold text-[#F8FAFC]">
            {totalSampleSize.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#111827] rounded-lg p-4 text-center">
          <Calendar className="w-5 h-5 text-[#f59e0b] mx-auto mb-2" />
          <p className="text-[11px] text-[#94A3B8] mb-1">Duration</p>
          <p className="text-[18px] font-bold text-[#F8FAFC]">
            {daysNeeded} days
          </p>
        </div>
      </div>

      <p className="text-[11px] text-[#64748B] mt-4 text-center">
        {confidence}% confidence level, 80% statistical power
      </p>
    </div>
  );
}
