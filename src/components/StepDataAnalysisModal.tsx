"use client";

import { useState, useEffect } from "react";
import { X, Users, TrendingDown, MousePointerClick, Send, BarChart3 } from "lucide-react";

interface StepDataAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  stepName: string;
  stepUrl?: string;
  funnelId: string;
  stepVisitors: number;
  stepDropoff: number;
  stepConversionRate: number;
}

export default function StepDataAnalysisModal({
  isOpen,
  onClose,
  stepName,
  stepUrl,
  funnelId,
  stepVisitors,
  stepDropoff,
  stepConversionRate,
}: StepDataAnalysisModalProps) {
  const [stats, setStats] = useState<{
    visitors: number;
    clicks: number;
    submits: number;
    ctr: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !funnelId || !stepName) return;
    setLoading(true);
    setStats(null);
    setAnalysis("");

    fetch(`/api/funnel-step-stats?funnelId=${encodeURIComponent(funnelId)}&stepName=${encodeURIComponent(stepName)}`)
      .then((r) => r.json())
      .then((data) => {
        setStats({
          visitors: data.visitors ?? stepVisitors,
          clicks: data.clicks ?? 0,
          submits: data.submits ?? 0,
          ctr: data.ctr ?? 0,
        });
      })
      .catch(() => setStats({ visitors: stepVisitors, clicks: 0, submits: 0, ctr: 0 }))
      .finally(() => setLoading(false));
  }, [isOpen, funnelId, stepName, stepVisitors]);

  useEffect(() => {
    if (!isOpen || !stats) return;
    const v = stats.visitors || stepVisitors;
    const c = stats.clicks || 0;
    const s = stats.submits || 0;
    const ctr = stats.ctr || 0;
    let text = "";
    if (v > 0) {
      text = `${stepName} received ${v.toLocaleString()} visitors. `;
      if (c > 0) text += `CTR: ${ctr.toFixed(1)}% (${c} clicks). `;
      if (s > 0) text += `${s} form submission(s). `;
      if (stepDropoff > 0) text += `Drop-off at this step: ${stepDropoff.toFixed(1)}%. `;
      if (stepDropoff > 30) text += "High drop-off suggests friction or unclear value proposition.";
      else if (ctr < 2 && c > 0) text += "Low CTR may indicate weak CTA visibility or copy.";
    } else {
      text = "No tracking data yet. Install the tracking script on this page to see metrics.";
    }
    setAnalysis(text);
  }, [isOpen, stats, stepName, stepDropoff, stepVisitors]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-[#7c5cff]" />
            <h2 className="text-[18px] font-semibold text-[#fafafa]">Data Analysis - {stepName}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] text-[#888888]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#7c5cff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111111] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-[#7c5cff]" />
                    <span className="text-[11px] text-[#888888]">Visitors</span>
                  </div>
                  <p className="text-[20px] font-bold text-[#fafafa]">{(stats?.visitors ?? stepVisitors).toLocaleString()}</p>
                </div>
                <div className="bg-[#111111] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-[#ff6b6b]" />
                    <span className="text-[11px] text-[#888888]">Drop-off</span>
                  </div>
                  <p className="text-[20px] font-bold text-[#fafafa]">{stepDropoff.toFixed(1)}%</p>
                </div>
                <div className="bg-[#111111] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointerClick className="w-4 h-4 text-[#00d4aa]" />
                    <span className="text-[11px] text-[#888888]">CTR</span>
                  </div>
                  <p className="text-[20px] font-bold text-[#fafafa]">{(stats?.ctr ?? 0).toFixed(1)}%</p>
                </div>
                <div className="bg-[#111111] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointerClick className="w-4 h-4 text-[#f59e0b]" />
                    <span className="text-[11px] text-[#888888]">Hits (clicks)</span>
                  </div>
                  <p className="text-[20px] font-bold text-[#fafafa]">{(stats?.clicks ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-[#111111] rounded-xl p-4 col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Send className="w-4 h-4 text-[#7c5cff]" />
                    <span className="text-[11px] text-[#888888]">Form Submits</span>
                  </div>
                  <p className="text-[20px] font-bold text-[#fafafa]">{(stats?.submits ?? 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
                <h4 className="text-[13px] font-semibold text-[#fafafa] mb-2">Brief Analysis</h4>
                <p className="text-[13px] text-[#888888] leading-relaxed">{analysis || "Loading..."}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
