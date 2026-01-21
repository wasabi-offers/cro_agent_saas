"use client";

import { useState } from "react";
import { Copy, CheckCircle2, Code, ExternalLink, Zap } from "lucide-react";
import { generateAdvancedTrackingScript } from "@/lib/advanced-tracking-script";

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
    script: generateAdvancedTrackingScript({
      funnelId,
      funnelStepName: step.name,
      enableHeatmap: true
    })
  }));

  const handleCopy = (script: string, stepName: string) => {
    navigator.clipboard.writeText(script);
    setCopied(stepName);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#7c5cff]/10 to-[#00d4aa]/10 border border-[#7c5cff]/20 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[20px] font-semibold text-[#fafafa] mb-2">
              Tracking Avanzato CRO - "{funnelName}"
            </h3>
            <p className="text-[14px] text-[#888888]">
              Tracking completo: click, scroll, mouse, form, CTA, rage click, dead click, time on page, exit intent
            </p>
          </div>
        </div>
      </div>

      {/* Tracking Scripts for Each Step */}
      <div className="space-y-4">
        <h4 className="text-[16px] font-semibold text-[#fafafa]">Script di Tracking per Step</h4>

        {trackingScripts.map((item, index) => (
          <div key={index} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center">
                    <span className="text-[13px] font-bold text-[#7c5cff]">{index + 1}</span>
                  </div>
                  <h5 className="text-[16px] font-semibold text-[#fafafa]">{item.stepName}</h5>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-[#00d4aa] hover:text-[#00b894] flex items-center gap-1 ml-11"
                  >
                    {item.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <button
                onClick={() => handleCopy(item.script, item.stepName)}
                className="flex items-center gap-2 px-4 py-2 bg-[#7c5cff] hover:bg-[#6b4de8] text-white text-[13px] font-medium rounded-lg transition-all"
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

            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
              <pre className="text-[11px] text-[#888888] font-mono overflow-x-auto whitespace-pre-wrap break-words">
                {item.script}
              </pre>
            </div>

            <div className="mt-3 p-3 bg-[#7c5cff]/10 border border-[#7c5cff]/20 rounded-lg">
              <p className="text-[12px] text-[#888888]">
                💡 Incolla questo script prima del tag <code className="text-[#7c5cff]">&lt;/body&gt;</code> della pagina
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Live Stats Info */}
      <div className="bg-gradient-to-br from-[#00d4aa]/10 to-[#7c5cff]/10 border border-[#00d4aa]/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#00d4aa] rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-[16px] font-semibold text-[#fafafa] mb-2">
              📊 Statistiche in Tempo Reale
            </h4>
            <p className="text-[13px] text-[#888888]">
              Le statistiche del funnel si aggiornano automaticamente in tempo reale. Nessun bisogno di sincronizzare manualmente!
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
        <h4 className="text-[16px] font-semibold text-[#fafafa] mb-4">
          <Code className="w-5 h-5 inline mr-2" />
          Cosa Tracciamo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">Page views e sessioni</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">Click (posizione, elemento, testo)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">CTA clicks (bottoni, link)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">Scroll depth e percentuale</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">Mouse movement (heatmap)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">Form interactions</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">Rage clicks (frustrazione utente)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">Dead clicks (elementi non cliccabili)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">Time on page e engagement</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">Exit intent</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">Device, browser, OS</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#888888]">UTM parameters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
