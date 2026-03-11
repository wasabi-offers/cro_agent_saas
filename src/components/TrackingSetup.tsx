"use client";

import { useState } from "react";
import { Copy, CheckCircle2, Code, Download, ExternalLink, Zap } from "lucide-react";
import { getTrackingScriptTag } from "@/lib/advanced-tracking-script";

interface TrackingSetupProps {
  funnelId: string;
  funnelName: string;
  steps: { name: string; page: string; url?: string }[];
}

export default function TrackingSetup({ funnelId, funnelName, steps }: TrackingSetupProps) {
  const [copied, setCopied] = useState<string | null>(null);

  // Generate tracking scripts for each step
  const trackingScripts = steps.map((step, index) => ({
    stepName: step.name,
    url: step.url,
    script: getTrackingScriptTag({
      funnelId,
      funnelStepName: step.name,
      funnelStepOrder: index,
      enableHeatmap: true
    })
  }));

  const handleCopy = (script: string, stepName: string) => {
    navigator.clipboard.writeText(script);
    setCopied(stepName);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadAll = () => {
    const content = trackingScripts.map((item, i) => {
      const header = `\n${"=".repeat(60)}\nStep ${i + 1}: ${item.stepName}${item.url ? `\nURL: ${item.url}` : ""}\n${"=".repeat(60)}\n`;
      return header + item.script;
    }).join("\n");

    const fullContent = `CRO Agent - Tracking Scripts for "${funnelName}"\nGenerated: ${new Date().toISOString()}\n\nPaste each script before </body> on the corresponding page.\n${content}`;

    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cro-tracking-${funnelName.replace(/[^a-z0-9]/gi, "-")}-${funnelId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#6366F1]/10 to-[#06B6D4]/10 border border-[#6366F1]/20 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[20px] font-semibold text-[#F8FAFC] mb-2">
              Tracking Avanzato CRO - "{funnelName}"
            </h3>
            <p className="text-[14px] text-[#94A3B8]">
              Tracking completo: click, scroll, mouse, form, CTA, rage click, dead click, time on page, exit intent
            </p>
          </div>
        </div>
      </div>

      {/* Tracking Scripts for Each Step */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[16px] font-semibold text-[#F8FAFC]">Script di Tracking per Step</h4>
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-2 px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-[13px] font-medium rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Download All Scripts
          </button>
        </div>

        {trackingScripts.map((item, index) => (
          <div key={index} className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-[#6366F1]/20 rounded-lg flex items-center justify-center">
                    <span className="text-[13px] font-bold text-[#6366F1]">{index + 1}</span>
                  </div>
                  <h5 className="text-[16px] font-semibold text-[#F8FAFC]">{item.stepName}</h5>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-[#06B6D4] hover:text-[#0891B2] flex items-center gap-1 ml-11"
                  >
                    {item.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <button
                onClick={() => handleCopy(item.script, item.stepName)}
                className="flex items-center gap-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[13px] font-medium rounded-lg transition-all"
              >
                {copied === item.stepName ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copia Script
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
              <pre className="text-[11px] text-[#94A3B8] font-mono overflow-x-auto whitespace-pre-wrap break-words">
                {item.script}
              </pre>
            </div>

            <div className="mt-3 p-3 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg">
              <p className="text-[12px] text-[#94A3B8]">
                💡 Paste this script before the <code className="text-[#6366F1]">&lt;/body&gt;</code> tag of your page
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Live Stats Info */}
      <div className="bg-gradient-to-br from-[#06B6D4]/10 to-[#6366F1]/10 border border-[#06B6D4]/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#06B6D4] rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-[16px] font-semibold text-[#F8FAFC] mb-2">
              📊 Statistiche in Tempo Reale
            </h4>
            <p className="text-[13px] text-[#94A3B8]">
              Funnel statistics update automatically in real time. No need to sync manually!
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-6">
        <h4 className="text-[16px] font-semibold text-[#F8FAFC] mb-4">
          <Code className="w-5 h-5 inline mr-2" />
          Cosa Tracciamo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">Page views e sessioni</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">Click (posizione, elemento, testo)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">CTA clicks (bottoni, link)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">Scroll depth e percentuale</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">Mouse movement (heatmap)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">Form interactions</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">Rage clicks (user frustration)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">Dead clicks (non-clickable elements)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">Time on page and engagement</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">Exit intent</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">Device, browser, OS</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8]">UTM parameters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
