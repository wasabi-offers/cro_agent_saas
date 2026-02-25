// Script di tracking per funnel
// Traccia quando un utente visita uno step del funnel

export interface FunnelTrackingConfig {
  funnelId: string;
  stepName: string;
  apiEndpoint: string;
}

/**
 * Generates the tracking script to inject into funnel pages
 * @param config - Tracking configuration (funnelId, stepName, apiEndpoint)
 * @returns Script JavaScript come stringa
 */
export function generateFunnelTrackingScript(config: FunnelTrackingConfig): string {
  return `
(function() {
  const FUNNEL_ID = "${config.funnelId}";
  const STEP_NAME = "${config.stepName}";
  const API_ENDPOINT = "${config.apiEndpoint}";
  const SESSION_STORAGE_KEY = 'cro_funnel_session_id';

  // Genera o recupera session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }

    return sessionId;
  }

  // Traccia la visita a questo step
  async function trackFunnelStep() {
    const sessionId = getSessionId();

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelId: FUNNEL_ID,
          stepName: STEP_NAME,
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer || 'direct',
        }),
      });

      if (response.ok) {
        console.log('✅ Funnel step tracked:', STEP_NAME);
      } else {
        console.error('❌ Failed to track funnel step:', await response.text());
      }
    } catch (error) {
      console.error('❌ Tracking error:', error);
    }
  }

  // Traccia immediatamente quando la pagina si carica
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackFunnelStep);
  } else {
    trackFunnelStep();
  }

  console.log('🔍 CRO Funnel Tracking attivo - Funnel:', FUNNEL_ID, 'Step:', STEP_NAME);
})();
`;
}

/**
 * Generates the complete <script> tag to insert in HTML
 * @param funnelId - ID del funnel
 * @param stepName - Nome dello step
 * @returns Tag script HTML
 */
export function getFunnelTrackingScriptTag(funnelId: string, stepName: string, stepOrder?: number): string {
  const order = stepOrder ?? 0;
  return `<!-- CRO Agent Tracking + Attribution -->
<script>
window.funnelId="${funnelId}";
window.funnelStep="${stepName}";
window.funnelStepOrder=${order};
</script>
<script src="https://dohrkonencbwvvmklzuo.supabase.co/storage/v1/object/public/scripts/cro-tracking-attribution.js"></script>`;
}

/**
 * Generates instructions for the user on how to install tracking
 * @param funnelId - ID del funnel
 * @param stepName - Nome dello step
 * @param stepUrl - URL della pagina dello step
 * @returns Istruzioni in formato markdown
 */
export function generateTrackingInstructions(funnelId: string, stepName: string, stepUrl?: string): string {
  const scriptTag = getFunnelTrackingScriptTag(funnelId, stepName);

  return `
## 📊 Tracking Setup per "${stepName}"

Per tracciare questo step del funnel, aggiungi il seguente codice **subito prima del tag \`</body>\`** nella pagina:
${stepUrl ? `\n**URL:** \`${stepUrl}\`\n` : ''}

\`\`\`html
${scriptTag}
\`\`\`

### ✅ Verifica

1. Add the script to your page
2. Visit the page in the browser
3. Open the browser Console (F12)
4. You should see: \`🔍 CRO Funnel Tracking active - Funnel: ${funnelId} Step: ${stepName}\`
5. Check that this also appears: \`✅ Funnel step tracked: ${stepName}\`

### 🔄 Data Update

After installing tracking and receiving real visits, update funnel statistics:

**Method 1: Automatic (recommended)**
Visit: \`/api/funnel-stats/update?funnelId=${funnelId}\`

**Method 2: Manual**
Use POST API: \`/api/funnel-stats/update\`

\`\`\`bash
curl -X POST http://localhost:3000/api/funnel-stats/update \\
  -H "Content-Type: application/json" \\
  -d '{"funnelId": "${funnelId}"}'
\`\`\`

### 📝 Note

- Il tracking usa \`sessionStorage\` per identificare utenti unici
- Ogni utente viene tracciato una sola volta per step (no duplicati)
- Data is saved in real time to the database
- Remember to update statistics regularly to see data in the dashboard
`;
}
