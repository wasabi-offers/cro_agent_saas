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
  const [installMethod, setInstallMethod] = useState<'gtm' | 'direct' | 'wordpress'>('gtm');

  // Single universal script - works everywhere automatically
  const singleScript = `<script src="https://cro-agent-saas.vercel.app/cro-tracker-single.js"></script>`;

  // Google Tag Manager version
  const gtmScript = `<!-- Install this in Google Tag Manager as Custom HTML Tag -->
${singleScript}`;

  // WordPress plugin version
  const wordpressInstructions = `1. Go to WordPress Dashboard → Appearance → Theme Editor
2. Edit header.php or functions.php
3. Add this code before </head>:

${singleScript}

OR install via plugin "Insert Headers and Footers"`;

  // Direct install version
  const directScript = `<!-- Add this to your site's <head> or before </body> -->
${singleScript}`;

  const handleCopy = (script: string, id: string) => {
    navigator.clipboard.writeText(script);
    setCopied(id);
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
              🚀 UN SOLO SCRIPT - Come Clarity
            </h3>
            <p className="text-[14px] text-[#00d4aa] mb-2">
              Installa UNA VOLTA e traccia automaticamente TUTTE le pagine
            </p>
            <p className="text-[13px] text-[#888888]">
              Tracking completo: click, scroll, mouse, heatmap, form, CTA, rage click, dead click, time on page, exit intent
            </p>
          </div>
        </div>
      </div>

      {/* Installation Method Tabs */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="flex border-b border-[#2a2a2a]">
          <button
            onClick={() => setInstallMethod('gtm')}
            className={`flex-1 px-6 py-4 text-[14px] font-medium transition-all ${
              installMethod === 'gtm'
                ? 'bg-[#7c5cff] text-white'
                : 'text-[#666666] hover:text-[#888888] hover:bg-[#111111]'
            }`}
          >
            Google Tag Manager
          </button>
          <button
            onClick={() => setInstallMethod('direct')}
            className={`flex-1 px-6 py-4 text-[14px] font-medium transition-all ${
              installMethod === 'direct'
                ? 'bg-[#7c5cff] text-white'
                : 'text-[#666666] hover:text-[#888888] hover:bg-[#111111]'
            }`}
          >
            Diretto (HTML)
          </button>
          <button
            onClick={() => setInstallMethod('wordpress')}
            className={`flex-1 px-6 py-4 text-[14px] font-medium transition-all ${
              installMethod === 'wordpress'
                ? 'bg-[#7c5cff] text-white'
                : 'text-[#666666] hover:text-[#888888] hover:bg-[#111111]'
            }`}
          >
            WordPress
          </button>
        </div>

        <div className="p-6">
          {/* GTM Instructions */}
          {installMethod === 'gtm' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-[#7c5cff]/10 border border-[#7c5cff]/20 rounded-xl">
                <Zap className="w-5 h-5 text-[#7c5cff] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-[#fafafa] mb-2">
                    Metodo Consigliato - Google Tag Manager
                  </p>
                  <ol className="text-[12px] text-[#888888] space-y-1 list-decimal list-inside">
                    <li>Accedi a Google Tag Manager</li>
                    <li>Crea un nuovo Tag → Tag HTML personalizzato</li>
                    <li>Incolla lo script qui sotto</li>
                    <li>Trigger: All Pages</li>
                    <li>Salva e Pubblica</li>
                  </ol>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h5 className="text-[14px] font-semibold text-[#fafafa]">Script da copiare</h5>
                <button
                  onClick={() => handleCopy(singleScript, 'gtm')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00d4aa] hover:bg-[#00b894] text-white text-[13px] font-medium rounded-lg transition-all"
                >
                  {copied === 'gtm' ? (
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
                <pre className="text-[12px] text-[#00d4aa] font-mono overflow-x-auto whitespace-pre-wrap">
                  {singleScript}
                </pre>
              </div>
            </div>
          )}

          {/* Direct Install */}
          {installMethod === 'direct' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-xl">
                <Code className="w-5 h-5 text-[#00d4aa] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-[#fafafa] mb-2">
                    Installazione Diretta
                  </p>
                  <p className="text-[12px] text-[#888888]">
                    Aggiungi questo script nel <code className="text-[#00d4aa]">&lt;head&gt;</code> o prima del <code className="text-[#00d4aa]">&lt;/body&gt;</code> di tutte le pagine del tuo sito
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h5 className="text-[14px] font-semibold text-[#fafafa]">Script da copiare</h5>
                <button
                  onClick={() => handleCopy(singleScript, 'direct')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00d4aa] hover:bg-[#00b894] text-white text-[13px] font-medium rounded-lg transition-all"
                >
                  {copied === 'direct' ? (
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
                <pre className="text-[12px] text-[#00d4aa] font-mono overflow-x-auto whitespace-pre-wrap">
                  {singleScript}
                </pre>
              </div>

              <div className="p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg">
                <p className="text-[12px] text-[#888888]">
                  💡 <strong>Tip:</strong> Se hai accesso al template del sito, aggiungilo nel header.php o footer.php per installarlo automaticamente in tutte le pagine
                </p>
              </div>
            </div>
          )}

          {/* WordPress */}
          {installMethod === 'wordpress' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-xl">
                <Code className="w-5 h-5 text-[#00d4aa] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-[#fafafa] mb-2">
                    Installazione WordPress
                  </p>
                  <div className="text-[12px] text-[#888888] space-y-2">
                    <p className="font-semibold">Metodo 1: Plugin (Consigliato)</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Installa il plugin "Insert Headers and Footers" o "WPCode"</li>
                      <li>Vai su Settings → Insert Headers and Footers</li>
                      <li>Incolla lo script nella sezione "Scripts in Footer"</li>
                      <li>Salva</li>
                    </ol>

                    <p className="font-semibold mt-4">Metodo 2: Theme Editor</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Vai su Appearance → Theme Editor</li>
                      <li>Seleziona footer.php o header.php</li>
                      <li>Incolla lo script prima di <code className="text-[#00d4aa]">&lt;/body&gt;</code></li>
                      <li>Aggiorna file</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h5 className="text-[14px] font-semibold text-[#fafafa]">Script da copiare</h5>
                <button
                  onClick={() => handleCopy(singleScript, 'wordpress')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00d4aa] hover:bg-[#00b894] text-white text-[13px] font-medium rounded-lg transition-all"
                >
                  {copied === 'wordpress' ? (
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
                <pre className="text-[12px] text-[#00d4aa] font-mono overflow-x-auto whitespace-pre-wrap">
                  {singleScript}
                </pre>
              </div>
            </div>
          )}
        </div>
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
