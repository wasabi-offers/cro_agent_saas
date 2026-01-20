"use client";

import { useState } from "react";
import { Code, Copy, CheckCircle2, ExternalLink, Zap, AlertCircle, Link as LinkIcon, RefreshCw, Key } from "lucide-react";

interface TrackingSetupProps {
  funnelId: string;
  funnelName: string;
  steps: { name: string; page: string; url?: string }[];
}

export default function TrackingSetup({ funnelId, funnelName, steps }: TrackingSetupProps) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [clarityApiKey, setClarityApiKey] = useState("");
  const [numOfDays, setNumOfDays] = useState(7);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncClarity = async () => {
    if (!clarityApiKey.trim()) {
      setUpdateMessage('❌ Inserisci la Clarity API Key');
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
        setUpdateMessage(`✅ Sincronizzato con successo! Conversion rate: ${data.funnel.conversionRate}%`);
        // Refresh page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setUpdateMessage(`❌ ${data.error || 'Errore durante la sincronizzazione'}`);
      }
    } catch (error) {
      console.error('Failed to sync with Clarity:', error);
      setUpdateMessage('❌ Errore durante la sincronizzazione. Riprova più tardi.');
    } finally {
      setIsUpdating(false);
    }
  };

  const clarityScript = `<!-- Microsoft Clarity Script -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "YOUR_PROJECT_ID");
</script>`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#7c5cff]/10 to-[#00d4aa]/10 border border-[#7c5cff]/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-2">
              Microsoft Clarity Integration - "{funnelName}"
            </h3>
            <p className="text-[14px] text-[#888888] leading-relaxed">
              Sincronizza i dati del funnel da Microsoft Clarity. Assicurati che Clarity sia installato sul tuo sito e che gli URL degli step siano configurati correttamente.
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Install Clarity */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-[#7c5cff]" />
          <h4 className="text-[16px] font-semibold text-[#fafafa]">Step 1: Install Microsoft Clarity</h4>
        </div>

        <p className="text-[13px] text-[#888888] mb-4">
          Se non l'hai già fatto, installa Microsoft Clarity sul tuo sito:
        </p>

        <ol className="space-y-3 mb-4">
          <li className="flex items-start gap-3 text-[13px] text-[#888888]">
            <span className="flex-shrink-0 w-6 h-6 bg-[#7c5cff]/20 rounded-full flex items-center justify-center text-[#7c5cff] text-[11px] font-bold">
              1
            </span>
            <span>
              Vai su{' '}
              <a
                href="https://clarity.microsoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7c5cff] hover:text-[#00d4aa] underline"
              >
                clarity.microsoft.com
              </a>
            </span>
          </li>
          <li className="flex items-start gap-3 text-[13px] text-[#888888]">
            <span className="flex-shrink-0 w-6 h-6 bg-[#7c5cff]/20 rounded-full flex items-center justify-center text-[#7c5cff] text-[11px] font-bold">
              2
            </span>
            <span>Crea un progetto e copia lo script di installazione</span>
          </li>
          <li className="flex items-start gap-3 text-[13px] text-[#888888]">
            <span className="flex-shrink-0 w-6 h-6 bg-[#7c5cff]/20 rounded-full flex items-center justify-center text-[#7c5cff] text-[11px] font-bold">
              3
            </span>
            <span>
              Incolla lo script nel <code className="px-2 py-1 bg-[#111111] border border-[#2a2a2a] rounded text-[#7c5cff]">&lt;head&gt;</code> del tuo sito
            </span>
          </li>
        </ol>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 relative">
          <button
            onClick={() => copyToClipboard(clarityScript)}
            className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 bg-[#7c5cff] hover:bg-[#6b4de8] text-white text-[11px] font-medium rounded-lg transition-all"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
          <pre className="text-[11px] text-[#888888] font-mono leading-relaxed pr-20">
            <code>{clarityScript}</code>
          </pre>
        </div>
      </div>

      {/* Step 2: Configure URLs */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon className="w-5 h-5 text-[#00d4aa]" />
          <h4 className="text-[16px] font-semibold text-[#fafafa]">Step 2: Verifica URL degli Step</h4>
        </div>

        <p className="text-[13px] text-[#888888] mb-4">
          Clarity traccerà automaticamente queste pagine. Assicurati che gli URL siano corretti:
        </p>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-[#7c5cff]">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#fafafa] mb-1">{step.name}</p>
                  {step.url ? (
                    <div className="flex items-center gap-2">
                      <code className="text-[12px] text-[#00d4aa] truncate">{step.url}</code>
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-[#7c5cff] hover:text-[#00d4aa]"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#ff6b6b]">⚠️ URL non configurato - modifica il funnel per aggiungere l'URL</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg">
          <p className="text-[12px] text-[#f59e0b]">
            💡 Se mancano gli URL, vai alla pagina del funnel e modificalo per aggiungere gli URL di ogni step.
          </p>
        </div>
      </div>

      {/* Step 3: Get Clarity API Key */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-[#f59e0b]" />
          <h4 className="text-[16px] font-semibold text-[#fafafa]">Step 3: Ottieni la Clarity API Key</h4>
        </div>

        <ol className="space-y-3 mb-4">
          <li className="flex items-start gap-3 text-[13px] text-[#888888]">
            <span className="flex-shrink-0 w-6 h-6 bg-[#f59e0b]/20 rounded-full flex items-center justify-center text-[#f59e0b] text-[11px] font-bold">
              1
            </span>
            <span>
              Vai su Clarity:{' '}
              <a
                href="https://clarity.microsoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7c5cff] hover:text-[#00d4aa] underline"
              >
                Settings → API
              </a>
            </span>
          </li>
          <li className="flex items-start gap-3 text-[13px] text-[#888888]">
            <span className="flex-shrink-0 w-6 h-6 bg-[#f59e0b]/20 rounded-full flex items-center justify-center text-[#f59e0b] text-[11px] font-bold">
              2
            </span>
            <span>Genera una nuova API Key</span>
          </li>
          <li className="flex items-start gap-3 text-[13px] text-[#888888]">
            <span className="flex-shrink-0 w-6 h-6 bg-[#f59e0b]/20 rounded-full flex items-center justify-center text-[#f59e0b] text-[11px] font-bold">
              3
            </span>
            <span>Incolla la key qui sotto per sincronizzare i dati</span>
          </li>
        </ol>

        <div className="p-3 bg-[#7c5cff]/10 border border-[#7c5cff]/20 rounded-lg">
          <p className="text-[12px] text-[#888888]">
            🔒 La tua API Key non viene salvata e viene usata solo per questa sincronizzazione.
          </p>
        </div>
      </div>

      {/* Step 4: Sync Data */}
      <div className="bg-gradient-to-br from-[#7c5cff]/10 to-[#00d4aa]/10 border border-[#7c5cff]/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] rounded-xl flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-[16px] font-semibold text-[#fafafa] mb-2">Step 4: Sincronizza Dati da Clarity</h4>
            <p className="text-[13px] text-[#888888] leading-relaxed mb-4">
              Inserisci la tua Clarity API Key e sincronizza i dati del funnel:
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[12px] text-[#888888] mb-2">Clarity API Key</label>
                <input
                  type="password"
                  placeholder="Incolla qui la tua API Key"
                  value={clarityApiKey}
                  onChange={(e) => setClarityApiKey(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-[#fafafa] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#888888] mb-2">Periodo di sincronizzazione</label>
                <select
                  value={numOfDays}
                  onChange={(e) => setNumOfDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-[#fafafa] focus:outline-none focus:border-[#7c5cff] transition-all"
                >
                  <option value={1}>Ultimo giorno</option>
                  <option value={7}>Ultimi 7 giorni</option>
                  <option value={14}>Ultimi 14 giorni</option>
                  <option value={30}>Ultimi 30 giorni</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncClarity}
                disabled={isUpdating || !clarityApiKey.trim()}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Sincronizzazione...' : 'Sincronizza con Clarity'}
              </button>
            </div>

            {updateMessage && (
              <div className="mt-3 p-3 bg-[#111111] border border-[#2a2a2a] rounded-lg">
                <p className="text-[13px] text-[#fafafa]">{updateMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#00d4aa] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[16px] font-semibold text-[#fafafa] mb-2">
              Come Funziona
            </h4>
            <ul className="space-y-2 text-[13px] text-[#888888]">
              <li>• Clarity traccia automaticamente tutte le visite alle pagine del tuo sito</li>
              <li>• L'API di Clarity filtra il traffico per URL specifici</li>
              <li>• Contiamo i visitatori per ogni URL che corrisponde agli step del funnel</li>
              <li>• Calcoliamo automaticamente dropoff e conversion rate</li>
              <li>• I dati vengono aggiornati nel database e mostrati nel dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
