"use client";

import { useState } from "react";
import { Code, Copy, Check, Info, RefreshCw } from "lucide-react";
import { getFunnelTrackingScriptTag } from "@/lib/funnel-tracking-script";

interface FunnelTrackingInstructionsProps {
  funnelId: string;
  stepName: string;
  stepUrl?: string;
}

export default function FunnelTrackingInstructions({
  funnelId,
  stepName,
  stepUrl,
}: FunnelTrackingInstructionsProps) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const scriptTag = getFunnelTrackingScriptTag(funnelId, stepName);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptTag);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleUpdateStats = async () => {
    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      const response = await fetch(`/api/funnel-stats/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId }),
      });

      const data = await response.json();

      if (data.success) {
        setUpdateMessage('✅ Statistics updated successfully!');
        // Refresh page after 1 second to show new data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setUpdateMessage('⚠️ No data to update');
      }
    } catch (error) {
      console.error("Failed to update stats:", error);
      setUpdateMessage('❌ Error during update');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-[#6366F1]/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Code className="w-5 h-5 text-[#6366F1]" />
        </div>
        <div className="flex-1">
          <h3 className="text-[18px] font-semibold text-[#F8FAFC] mb-1">
            Tracking Setup
          </h3>
          <p className="text-[14px] text-[#94A3B8]">
            Installa questo codice sulla pagina per tracciare le visite
          </p>
        </div>
      </div>

      {/* Step Info */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-[#06B6D4]" />
          <span className="text-[13px] font-medium text-[#06B6D4]">Step da tracciare</span>
        </div>
        <p className="text-[15px] text-[#F8FAFC] font-medium mb-1">{stepName}</p>
        {stepUrl && (
          <p className="text-[13px] text-[#64748B] break-all">{stepUrl}</p>
        )}
      </div>

      {/* Script Code */}
      <div className="relative">
        <pre className="bg-[#111827] border border-white/5 rounded-xl p-4 overflow-x-auto text-[13px] text-[#94A3B8] font-mono mb-4">
          <code>{scriptTag}</code>
        </pre>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 flex items-center gap-2 px-3 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-[13px] font-medium rounded-lg transition-all"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copiato!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copia
            </>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4 mb-4">
        <h4 className="text-[14px] font-medium text-[#F8FAFC] mb-3">
          📝 Instructions
        </h4>
        <ol className="space-y-2 text-[13px] text-[#94A3B8]">
          <li className="flex items-start gap-2">
            <span className="text-[#6366F1] font-bold">1.</span>
            <span>Copy the code above</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#6366F1] font-bold">2.</span>
            <span>Paste it in your page, just before the <code className="text-[#06B6D4]">&lt;/body&gt;</code> tag</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#6366F1] font-bold">3.</span>
            <span>Publish the page and wait for users to visit it</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#6366F1] font-bold">4.</span>
            <span>Click "Update Statistics" to see data in the dashboard</span>
          </li>
        </ol>
      </div>

      {/* Update Stats Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleUpdateStats}
          disabled={isUpdating}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#06B6D4] to-[#00a884] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Updating...' : 'Update Statistics'}
        </button>

        {updateMessage && (
          <span className="text-[14px] text-[#F8FAFC]">{updateMessage}</span>
        )}
      </div>

      {/* Verification */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <h4 className="text-[13px] font-medium text-[#F8FAFC] mb-2">
          ✅ Verifica installazione
        </h4>
        <p className="text-[12px] text-[#64748B] mb-2">
          Dopo aver installato lo script, visita la pagina e apri la Console del browser (F12).
          Dovresti vedere:
        </p>
        <code className="block bg-[#111827] border border-white/5 rounded-lg px-3 py-2 text-[11px] text-[#06B6D4] font-mono">
          🔍 CRO Funnel Tracking attivo - Funnel: {funnelId} Step: {stepName}
        </code>
      </div>
    </div>
  );
}
