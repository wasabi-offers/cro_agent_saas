"use client";

import { useState } from "react";
import { Code, Copy, CheckCircle2, ExternalLink, Zap, AlertCircle, Link as LinkIcon } from "lucide-react";

interface TrackingSetupProps {
  funnelId: string;
  funnelName: string;
  steps: { name: string; page: string }[];
}

export default function TrackingSetup({ funnelId, funnelName, steps }: TrackingSetupProps) {
  const [copied, setCopied] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [stepUrls, setStepUrls] = useState<Record<number, string>>({});

  // Generate tracking script
  const trackingScript = `<!-- CRO Agent Tracking Script -->
<script>
(function() {
  window.croAgent = window.croAgent || {};
  window.croAgent.funnelId = "${funnelId}";
  window.croAgent.apiUrl = "${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.vercel.app'}/api/track";

  // Track funnel step
  window.croAgent.trackStep = function(stepName) {
    fetch(window.croAgent.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funnelId: window.croAgent.funnelId,
        stepName: stepName,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        sessionId: window.croAgent.getSessionId()
      })
    }).catch(err => console.error('CRO tracking error:', err));
  };

  // Get or create session ID
  window.croAgent.getSessionId = function() {
    let sessionId = sessionStorage.getItem('cro_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('cro_session_id', sessionId);
    }
    return sessionId;
  };

  // Auto-track page views
  window.croAgent.autoTrack = function() {
    const currentPath = window.location.pathname;
    const stepMap = ${JSON.stringify(
      steps.reduce((acc, step, index) => {
        acc[step.page] = step.name;
        return acc;
      }, {} as Record<string, string>)
    )};

    if (stepMap[currentPath]) {
      window.croAgent.trackStep(stepMap[currentPath]);
    }
  };

  // Initialize tracking
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.croAgent.autoTrack);
  } else {
    window.croAgent.autoTrack();
  }
})();
</script>
<!-- End CRO Agent Tracking -->`;

  const copyToClipboard = (text: string, isStep: boolean = false, stepIndex?: number) => {
    navigator.clipboard.writeText(text);
    if (isStep && stepIndex !== undefined) {
      setCopiedStep(stepIndex);
      setTimeout(() => setCopiedStep(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
              Setup Tracking for "{funnelName}"
            </h3>
            <p className="text-[14px] text-[#888888] leading-relaxed">
              Add this tracking script to your website to start collecting funnel data. Once installed, we'll automatically track user progression through each step.
            </p>
          </div>
        </div>
      </div>

      {/* Installation Instructions */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-[#7c5cff]" />
            <h4 className="text-[16px] font-semibold text-[#fafafa]">Installation Code</h4>
          </div>
          <button
            onClick={() => copyToClipboard(trackingScript)}
            className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg transition-all text-[13px] text-[#fafafa]"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#00d4aa]" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Code
              </>
            )}
          </button>
        </div>

        {/* Code Block */}
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 overflow-x-auto">
          <pre className="text-[12px] text-[#888888] font-mono leading-relaxed">
            <code>{trackingScript}</code>
          </pre>
        </div>

        {/* Installation Steps */}
        <div className="mt-6 space-y-3">
          <p className="text-[14px] font-medium text-[#fafafa]">Installation Steps:</p>
          <ol className="space-y-2">
            <li className="flex items-start gap-3 text-[13px] text-[#888888]">
              <span className="flex-shrink-0 w-6 h-6 bg-[#7c5cff]/20 rounded-full flex items-center justify-center text-[#7c5cff] text-[11px] font-bold">
                1
              </span>
              <span>Copy the tracking script above</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#888888]">
              <span className="flex-shrink-0 w-6 h-6 bg-[#7c5cff]/20 rounded-full flex items-center justify-center text-[#7c5cff] text-[11px] font-bold">
                2
              </span>
              <span>
                Paste it in the <code className="px-2 py-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-[#7c5cff]">&lt;head&gt;</code> section of your website
              </span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#888888]">
              <span className="flex-shrink-0 w-6 h-6 bg-[#7c5cff]/20 rounded-full flex items-center justify-center text-[#7c5cff] text-[11px] font-bold">
                3
              </span>
              <span>The script will automatically track users as they navigate through your funnel</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[#888888]">
              <span className="flex-shrink-0 w-6 h-6 bg-[#7c5cff]/20 rounded-full flex items-center justify-center text-[#7c5cff] text-[11px] font-bold">
                4
              </span>
              <span>Data will start appearing in your dashboard within minutes</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Funnel Steps Configuration */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[16px] font-semibold text-[#fafafa]">Tracked Steps & URLs</h4>
          <p className="text-[12px] text-[#888888]">Inserisci gli URL reali di ogni step</p>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-8 h-8 bg-[#7c5cff]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-[#7c5cff]">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#fafafa] mb-1">{step.name}</p>
                  <p className="text-[12px] text-[#666666] mb-3 truncate">
                    Page: <code className="text-[#00d4aa]">{step.page}</code>
                  </p>

                  {/* URL Input */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                      <input
                        type="url"
                        placeholder="https://tuosito.com/landing-page"
                        value={stepUrls[index] || ''}
                        onChange={(e) => setStepUrls({ ...stepUrls, [index]: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-[#fafafa] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                      />
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(`window.croAgent.trackStep("${step.name}");`, true, index)
                      }
                      className="flex items-center gap-2 px-3 py-2.5 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg transition-all text-[12px] text-[#888888]"
                    >
                      {copiedStep === index ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-[#00d4aa]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Event
                        </>
                      )}
                    </button>
                  </div>

                  {stepUrls[index] && (
                    <a
                      href={stepUrls[index]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[11px] text-[#7c5cff] hover:text-[#00d4aa] transition-colors max-w-full"
                      title={stepUrls[index]}
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Apri in una nuova tab</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Tracking (Optional) */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[16px] font-semibold text-[#fafafa] mb-2">
              Manual Tracking (Optional)
            </h4>
            <p className="text-[13px] text-[#888888] leading-relaxed mb-4">
              If you need more control, you can manually trigger tracking events. For example, track button clicks or form submissions:
            </p>
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-3">
              <code className="text-[12px] text-[#7c5cff] font-mono">
                {`// Track a custom event\nwindow.croAgent.trackStep("${steps[0]?.name || 'Step Name'}");`}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Test Tracking */}
      <div className="bg-gradient-to-br from-[#00d4aa]/10 to-[#7c5cff]/10 border border-[#00d4aa]/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#00d4aa] rounded-xl flex items-center justify-center flex-shrink-0">
            <ExternalLink className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-[16px] font-semibold text-[#fafafa] mb-2">Test Your Tracking</h4>
            <p className="text-[13px] text-[#888888] leading-relaxed mb-3">
              After installing the script, visit your website and navigate through the funnel steps. Check back here in a few minutes to see the data appearing.
            </p>
            <p className="text-[12px] text-[#666666]">
              💡 Tip: Open your browser's developer console (F12) to see tracking events being sent in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
