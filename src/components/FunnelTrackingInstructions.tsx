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
        setUpdateMessage('✅ Statistiche aggiornate con successo!');
        // Refresh page dopo 1 secondo per mostrare i nuovi dati
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setUpdateMessage('⚠️ Nessun dato da aggiornare');
      }
    } catch (error) {
      console.error("Failed to update stats:", error);
      setUpdateMessage('❌ Errore durante l\'aggiornamento');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Code className="w-5 h-5 text-[#7c5cff]" />
        </div>
        <div className="flex-1">
          <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">
            Tracking Setup
          </h3>
          <p className="text-[14px] text-[#888888]">
            Installa questo codice sulla pagina per tracciare le visite
          </p>
        </div>
      </div>

      {/* Step Info */}
      <div className="bg-[#111111] border border-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-[#00d4aa]" />
          <span className="text-[13px] font-medium text-[#00d4aa]">Step da tracciare</span>
        </div>
        <p className="text-[15px] text-[#fafafa] font-medium mb-1">{stepName}</p>
        {stepUrl && (
          <p className="text-[13px] text-[#666666] break-all">{stepUrl}</p>
        )}
      </div>

      {/* Script Code */}
      <div className="relative">
        <pre className="bg-[#111111] border border-white/5 rounded-xl p-4 overflow-x-auto text-[13px] text-[#888888] font-mono mb-4">
          <code>{scriptTag}</code>
        </pre>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 flex items-center gap-2 px-3 py-2 bg-[#7c5cff] hover:bg-[#6b4de8] text-white text-[13px] font-medium rounded-lg transition-all"
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
      <div className="bg-[#111111] border border-white/5 rounded-xl p-4 mb-4">
        <h4 className="text-[14px] font-medium text-[#fafafa] mb-3">
          📝 Istruzioni
        </h4>
        <ol className="space-y-2 text-[13px] text-[#888888]">
          <li className="flex items-start gap-2">
            <span className="text-[#7c5cff] font-bold">1.</span>
            <span>Copia il codice sopra</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#7c5cff] font-bold">2.</span>
            <span>Incollalo nella tua pagina, subito prima del tag <code className="text-[#00d4aa]">&lt;/body&gt;</code></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#7c5cff] font-bold">3.</span>
            <span>Pubblica la pagina e aspetta che gli utenti la visitino</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#7c5cff] font-bold">4.</span>
            <span>Clicca su "Aggiorna Statistiche" per vedere i dati nel dashboard</span>
          </li>
        </ol>
      </div>

      {/* Update Stats Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleUpdateStats}
          disabled={isUpdating}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#00d4aa] to-[#00a884] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Aggiornamento...' : 'Aggiorna Statistiche'}
        </button>

        {updateMessage && (
          <span className="text-[14px] text-[#fafafa]">{updateMessage}</span>
        )}
      </div>

      {/* Verification */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <h4 className="text-[13px] font-medium text-[#fafafa] mb-2">
          ✅ Verifica installazione
        </h4>
        <p className="text-[12px] text-[#666666] mb-2">
          Dopo aver installato lo script, visita la pagina e apri la Console del browser (F12).
          Dovresti vedere:
        </p>
        <code className="block bg-[#111111] border border-white/5 rounded-lg px-3 py-2 text-[11px] text-[#00d4aa] font-mono">
          🔍 CRO Funnel Tracking attivo - Funnel: {funnelId} Step: {stepName}
        </code>
      </div>
    </div>
  );
}
