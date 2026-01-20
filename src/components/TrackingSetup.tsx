"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

interface TrackingSetupProps {
  funnelId: string;
  funnelName: string;
  steps: { name: string; page: string; url?: string }[];
}

export default function TrackingSetup({ funnelId, funnelName, steps }: TrackingSetupProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [clarityApiKey, setClarityApiKey] = useState("");
  const [numOfDays, setNumOfDays] = useState(7);

  // Load API key from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cro_api_keys');
      if (saved) {
        try {
          const keys = JSON.parse(saved);
          if (keys.clarity) {
            setClarityApiKey(keys.clarity);
          }
        } catch (e) {
          console.error('Failed to load API keys:', e);
        }
      }
    }
  }, []);

  const handleSyncClarity = async () => {
    if (!clarityApiKey.trim()) {
      setUpdateMessage('❌ Clarity non configurato. Vai su Data Sources per connettere Clarity.');
      return;
    }

    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      const response = await fetch('/api/clarity-sync-funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelId,
          clarityApiKey: clarityApiKey.trim(),
          numOfDays,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const stepsSummary = data.steps.map((s: any) => `${s.stepName}: ${s.visitors} visite`).join(', ');
        setUpdateMessage(`✅ Sincronizzato! Conversion: ${data.funnel.conversionRate}% | ${stepsSummary}`);

        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setUpdateMessage(`❌ ${data.error || 'Errore durante la sincronizzazione'}`);
      }
    } catch (error) {
      console.error('Failed to sync with Clarity:', error);
      setUpdateMessage('❌ Errore di rete. Riprova.');
    } finally {
      setIsUpdating(false);
    }
  };

  const missingUrls = steps.filter(s => !s.url);

  return (
    <div className="space-y-6">
      {/* Main Sync Card */}
      <div className="bg-gradient-to-br from-[#7c5cff]/10 to-[#00d4aa]/10 border border-[#7c5cff]/20 rounded-2xl p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[20px] font-semibold text-[#fafafa] mb-2">
              Sincronizza da Microsoft Clarity
            </h3>
            <p className="text-[14px] text-[#888888]">
              Importa i dati reali del funnel "{funnelName}" da Clarity
            </p>
          </div>
        </div>

        {!clarityApiKey ? (
          <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[14px] text-[#fafafa] font-medium mb-1">
                  Clarity non configurato
                </p>
                <p className="text-[13px] text-[#888888] mb-3">
                  Connetti prima Microsoft Clarity in Data Sources
                </p>
                <a
                  href="/data-sources"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#7c5cff] text-white text-[13px] font-medium rounded-lg hover:bg-[#6b4ee6] transition-all"
                >
                  Vai a Data Sources →
                </a>
              </div>
            </div>
          </div>
        ) : missingUrls.length > 0 ? (
          <div className="p-4 bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#ff6b6b] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[14px] text-[#fafafa] font-medium mb-2">
                  URL mancanti
                </p>
                <p className="text-[13px] text-[#888888] mb-2">
                  Questi step non hanno un URL configurato:
                </p>
                <ul className="text-[12px] text-[#ff6b6b] space-y-1 mb-3">
                  {missingUrls.map(s => <li key={s.name}>• {s.name}</li>)}
                </ul>
                <p className="text-[12px] text-[#888888]">
                  Modifica il funnel per aggiungere gli URL mancanti
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-[13px] text-[#888888] mb-2">Periodo</label>
                <select
                  value={numOfDays}
                  onChange={(e) => setNumOfDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[14px] text-[#fafafa] focus:outline-none focus:border-[#7c5cff] transition-all"
                >
                  <option value={1}>Ultimo giorno</option>
                  <option value={7}>Ultimi 7 giorni</option>
                  <option value={14}>Ultimi 14 giorni</option>
                  <option value={30}>Ultimi 30 giorni</option>
                </select>
              </div>
              <div className="pt-7">
                <button
                  onClick={handleSyncClarity}
                  disabled={isUpdating}
                  className="px-6 py-2.5 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                  {isUpdating ? 'Sincronizzazione...' : 'Sincronizza Ora'}
                </button>
              </div>
            </div>

            {updateMessage && (
              <div className={`p-4 rounded-lg ${updateMessage.startsWith('✅') ? 'bg-[#00d4aa]/10 border border-[#00d4aa]/20' : 'bg-[#ff6b6b]/10 border border-[#ff6b6b]/20'}`}>
                <p className="text-[13px] text-[#fafafa]">{updateMessage}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Steps Overview */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
        <h4 className="text-[16px] font-semibold text-[#fafafa] mb-4">Step del Funnel</h4>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-[#111111] rounded-lg">
              <div className="w-8 h-8 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[13px] font-bold text-[#7c5cff]">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-[#fafafa] font-medium">{step.name}</p>
                {step.url ? (
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-[11px] text-[#00d4aa] truncate">{step.url}</code>
                    <a href={step.url} target="_blank" rel="noopener noreferrer" className="text-[#7c5cff] hover:text-[#00d4aa]">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#ff6b6b] mt-1">URL mancante</p>
                )}
              </div>
              {step.url && <CheckCircle2 className="w-4 h-4 text-[#00d4aa]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#00d4aa] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[15px] font-semibold text-[#fafafa] mb-2">Come funziona</h4>
            <ul className="space-y-1.5 text-[13px] text-[#888888]">
              <li>• Clarity traccia automaticamente le visite sul tuo sito</li>
              <li>• La sincronizzazione legge i dati filtrati per URL</li>
              <li>• Calcola visitors, dropoff e conversion rate</li>
              <li>• I dati vengono aggiornati nel database</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
