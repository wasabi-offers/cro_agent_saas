"use client";

import { useState } from "react";
import { Copy, CheckCircle2, Code, Download, ExternalLink, Zap, HelpCircle, Brain, MousePointerClick, Timer, ArrowLeftRight } from "lucide-react";
import { getQuizTrackingScriptTag, type QuizTrackingOptions } from "@/lib/quiz-tracking-script";

interface QuizTrackingSetupProps {
  funnelSlug: string;
  funnelName: string;
  steps?: Array<{ name: string; answers?: Array<{ id: string; text: string }> }>;
}

export default function QuizTrackingSetup({ funnelSlug, funnelName, steps }: QuizTrackingSetupProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDomGuide, setShowDomGuide] = useState(false);

  const scriptOptions: QuizTrackingOptions = {
    funnelSlug,
  };

  const trackingScript = getQuizTrackingScriptTag(scriptOptions);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    const content = `CRO Quiz Funnel Tracker - Setup for "${funnelName}"
Generated: ${new Date().toISOString()}
Funnel Slug: ${funnelSlug}

${"=".repeat(60)}
TRACKING SCRIPT
${"=".repeat(60)}
Paste this before </body> on your quiz page:

${trackingScript}

${"=".repeat(60)}
DOM ATTRIBUTES REFERENCE
${"=".repeat(60)}
Steps:     <div data-quiz-step="1">...</div>
Answers:   <button data-quiz-answer="answer_id">Text</button>
Question:  <h2 data-quiz-question>Your question?</h2>
Next:      <button data-quiz-next="2">Next</button>
Back:      <button data-quiz-back="1">Back</button>
Skip:      <button data-quiz-skip="3">Skip</button>
Complete:  <button data-quiz-complete data-quiz-score="85">Results</button>

${"=".repeat(60)}
MANUAL API REFERENCE
${"=".repeat(60)}
QuizTracker.start("${funnelSlug}")
QuizTracker.stepView(stepOrder, stepName)
QuizTracker.answerClick(stepOrder, answerId, answerText, answerValue)
QuizTracker.complete(score, resultLabel)
QuizTracker.abandon(reason)
QuizTracker.getState()
QuizTracker.getStats()
QuizTracker.flush()
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-tracker-setup-${funnelSlug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const domExample = steps && steps.length > 0
    ? steps.map((step, i) => {
        const stepNum = i + 1;
        const display = i === 0 ? '' : ' style="display:none"';
        const answersHtml = step.answers
          ? step.answers.map(a => `  <button data-quiz-answer="${a.id}">${a.text}</button>`).join('\n')
          : `  <button data-quiz-answer="a">Option A</button>\n  <button data-quiz-answer="b">Option B</button>`;
        return `<div data-quiz-step="${stepNum}"${display}>
  <h2 data-quiz-question>${step.name}</h2>
${answersHtml}
${i > 0 ? `  <button data-quiz-back="${stepNum - 1}">Back</button>\n` : ''}${i < (steps.length - 1) ? `  <button data-quiz-next="${stepNum + 1}">Next</button>` : `  <button data-quiz-complete data-quiz-score="0">Get Results</button>`}
</div>`;
      }).join('\n\n')
    : `<div data-quiz-step="1">
  <h2 data-quiz-question>What is your main goal?</h2>
  <button data-quiz-answer="weight-loss">Lose Weight</button>
  <button data-quiz-answer="muscle-gain">Build Muscle</button>
  <button data-quiz-answer="energy">More Energy</button>
  <button data-quiz-next="2">Next</button>
</div>

<div data-quiz-step="2" style="display:none">
  <h2 data-quiz-question>How often do you exercise?</h2>
  <button data-quiz-answer="never">Never</button>
  <button data-quiz-answer="sometimes">1-2 times/week</button>
  <button data-quiz-answer="often">3+ times/week</button>
  <button data-quiz-back="1">Back</button>
  <button data-quiz-complete data-quiz-score="0">Get My Plan</button>
</div>`;

  const manualApiExample = `// Start quiz manually
QuizTracker.start("${funnelSlug}");

// Track step views
QuizTracker.stepView(1, "Goal Question");
QuizTracker.stepView(2, "Frequency Question");

// Track answers
QuizTracker.answerClick(1, "weight-loss", "Lose Weight", "weight-loss");
QuizTracker.answerClick(2, "often", "3+ times/week", "often");

// Complete quiz
QuizTracker.complete(85, "Premium Plan");

// Get current state
console.log(QuizTracker.getStats());`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#06B6D4]/10 border border-[#8B5CF6]/20 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] rounded-xl flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[20px] font-semibold text-[#F8FAFC] mb-2">
              Quiz Funnel Tracker - &ldquo;{funnelName}&rdquo;
            </h3>
            <p className="text-[14px] text-[#94A3B8]">
              Tracciamento completo per quiz funnel: step views, risposte, esitazione, dropoff, tab switch, exit intent
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="px-2 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] text-[11px] font-mono rounded">
                slug: {funnelSlug}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Script */}
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[16px] font-semibold text-[#F8FAFC]">
            <Code className="w-5 h-5 inline mr-2" />
            Script di Tracking
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] text-[12px] font-medium rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={() => handleCopy(trackingScript, 'script')}
              className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[13px] font-medium rounded-lg transition-all"
            >
              {copied === 'script' ? (
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
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
          <pre className="text-[11px] text-[#94A3B8] font-mono overflow-x-auto whitespace-pre-wrap break-words">
            {trackingScript}
          </pre>
        </div>

        <div className="mt-3 p-3 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg">
          <p className="text-[12px] text-[#94A3B8]">
            Incolla questo script prima del tag <code className="text-[#8B5CF6]">&lt;/body&gt;</code> nella pagina del quiz
          </p>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-6">
        <h4 className="text-[16px] font-semibold text-[#F8FAFC] mb-4">
          Installazione in 3 Step
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[#8B5CF6]/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[12px] font-bold text-[#8B5CF6]">1</span>
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#F8FAFC]">Aggiungi attributi data al DOM</p>
              <p className="text-[12px] text-[#64748B]">
                Aggiungi <code className="text-[#06B6D4]">data-quiz-step</code>, <code className="text-[#06B6D4]">data-quiz-answer</code> ai tuoi elementi
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[#8B5CF6]/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[12px] font-bold text-[#8B5CF6]">2</span>
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#F8FAFC]">Incolla lo script</p>
              <p className="text-[12px] text-[#64748B]">
                Copia lo script sopra e incollalo prima di <code className="text-[#06B6D4]">&lt;/body&gt;</code>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[#8B5CF6]/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[12px] font-bold text-[#8B5CF6]">3</span>
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#F8FAFC]">Verifica nella Console</p>
              <p className="text-[12px] text-[#64748B]">
                Apri la console del browser (F12) e cerca: <code className="text-[#06B6D4]">[QuizTracker] v2 Initialized</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DOM Guide */}
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowDomGuide(!showDomGuide)}
          className="w-full flex items-center justify-between p-6 hover:bg-[#111827] transition-all"
        >
          <h4 className="text-[16px] font-semibold text-[#F8FAFC]">
            <Code className="w-5 h-5 inline mr-2" />
            Guida Attributi DOM
          </h4>
          <span className="text-[#64748B] text-[12px]">{showDomGuide ? 'Chiudi' : 'Mostra'}</span>
        </button>

        {showDomGuide && (
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
              <pre className="text-[11px] text-[#94A3B8] font-mono overflow-x-auto whitespace-pre-wrap break-words">
                {domExample}
              </pre>
            </div>
            <button
              onClick={() => handleCopy(domExample, 'dom')}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] text-[12px] font-medium rounded-lg transition-all"
            >
              {copied === 'dom' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Copiato!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copia Esempio DOM
                </>
              )}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-[#1E293B]/50 rounded-lg">
                <code className="text-[11px] text-[#06B6D4] font-mono">data-quiz-step=&quot;N&quot;</code>
                <p className="text-[11px] text-[#64748B] mt-1">Container dello step (N = numero)</p>
              </div>
              <div className="p-3 bg-[#1E293B]/50 rounded-lg">
                <code className="text-[11px] text-[#06B6D4] font-mono">data-quiz-answer=&quot;id&quot;</code>
                <p className="text-[11px] text-[#64748B] mt-1">Opzione di risposta cliccabile</p>
              </div>
              <div className="p-3 bg-[#1E293B]/50 rounded-lg">
                <code className="text-[11px] text-[#06B6D4] font-mono">data-quiz-question</code>
                <p className="text-[11px] text-[#64748B] mt-1">Testo della domanda</p>
              </div>
              <div className="p-3 bg-[#1E293B]/50 rounded-lg">
                <code className="text-[11px] text-[#06B6D4] font-mono">data-quiz-next=&quot;N&quot;</code>
                <p className="text-[11px] text-[#64748B] mt-1">Bottone avanti (N = step target)</p>
              </div>
              <div className="p-3 bg-[#1E293B]/50 rounded-lg">
                <code className="text-[11px] text-[#06B6D4] font-mono">data-quiz-back=&quot;N&quot;</code>
                <p className="text-[11px] text-[#64748B] mt-1">Bottone indietro</p>
              </div>
              <div className="p-3 bg-[#1E293B]/50 rounded-lg">
                <code className="text-[11px] text-[#06B6D4] font-mono">data-quiz-complete</code>
                <p className="text-[11px] text-[#64748B] mt-1">Bottone completamento quiz</p>
              </div>
              <div className="p-3 bg-[#1E293B]/50 rounded-lg">
                <code className="text-[11px] text-[#06B6D4] font-mono">data-quiz-skip=&quot;N&quot;</code>
                <p className="text-[11px] text-[#64748B] mt-1">Salta allo step N</p>
              </div>
              <div className="p-3 bg-[#1E293B]/50 rounded-lg">
                <code className="text-[11px] text-[#06B6D4] font-mono">data-quiz-score=&quot;85&quot;</code>
                <p className="text-[11px] text-[#64748B] mt-1">Score da inviare al completamento</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual API */}
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-6 hover:bg-[#111827] transition-all"
        >
          <h4 className="text-[16px] font-semibold text-[#F8FAFC]">
            <Zap className="w-5 h-5 inline mr-2" />
            API JavaScript Manuale
          </h4>
          <span className="text-[#64748B] text-[12px]">{showAdvanced ? 'Chiudi' : 'Mostra'}</span>
        </button>

        {showAdvanced && (
          <div className="px-6 pb-6 space-y-4">
            <p className="text-[12px] text-[#64748B]">
              Se il tuo quiz non usa attributi data (es. React, Vue, quiz SPA custom), puoi usare l&apos;API JavaScript:
            </p>
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
              <pre className="text-[11px] text-[#94A3B8] font-mono overflow-x-auto whitespace-pre-wrap break-words">
                {manualApiExample}
              </pre>
            </div>
            <button
              onClick={() => handleCopy(manualApiExample, 'api')}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] text-[12px] font-medium rounded-lg transition-all"
            >
              {copied === 'api' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Copiato!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copia Esempio API
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* What We Track */}
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-6">
        <h4 className="text-[16px] font-semibold text-[#F8FAFC] mb-4">
          <Brain className="w-5 h-5 inline mr-2" />
          Cosa Tracciamo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: MousePointerClick, text: "Step views e transizioni" },
            { icon: MousePointerClick, text: "Click su risposte (ID, testo, valore)" },
            { icon: Timer, text: "Tempo per step (media, distribuzione)" },
            { icon: Brain, text: "Esitazione (>8s senza rispondere)" },
            { icon: ArrowLeftRight, text: "Cambio risposta (indecisione)" },
            { icon: ExternalLink, text: "Dropoff (abbandono, tab switch, navigazione)" },
            { icon: ExternalLink, text: "Exit intent (mouse fuori dal viewport)" },
            { icon: MousePointerClick, text: "Hover sulle opzioni (interesse)" },
            { icon: ArrowLeftRight, text: "Navigazione indietro (back)" },
            { icon: Timer, text: "Tempo totale di completamento" },
            { icon: CheckCircle2, text: "UTM, referrer, device, browser" },
            { icon: CheckCircle2, text: "First-touch / last-touch attribution" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <item.icon className="w-4 h-4 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#94A3B8]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
