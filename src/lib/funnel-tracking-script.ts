// Script di tracking per funnel
// Traccia quando un utente visita uno step del funnel

export interface FunnelTrackingConfig {
  funnelId: string;
  stepName: string;
  apiEndpoint: string;
}

/**
 * Genera lo script di tracking da iniettare nelle pagine del funnel
 * @param config - Configurazione del tracking (funnelId, stepName, apiEndpoint)
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
 * Genera il tag <script> completo da inserire nell'HTML
 * @param funnelId - ID del funnel
 * @param stepName - Nome dello step
 * @returns Tag script HTML
 */
export function getFunnelTrackingScriptTag(funnelId: string, stepName: string): string {
  const apiEndpoint = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/track`;

  const script = generateFunnelTrackingScript({
    funnelId,
    stepName,
    apiEndpoint,
  });

  return `<script>${script}</script>`;
}

/**
 * Genera istruzioni per l'utente su come installare il tracking
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

1. Aggiungi lo script alla tua pagina
2. Visita la pagina nel browser
3. Apri la Console del browser (F12)
4. Dovresti vedere: \`🔍 CRO Funnel Tracking attivo - Funnel: ${funnelId} Step: ${stepName}\`
5. Controlla che appaia anche: \`✅ Funnel step tracked: ${stepName}\`

### 🔄 Aggiornamento Dati

Dopo aver installato il tracking e ricevuto visite reali, aggiorna le statistiche del funnel:

**Metodo 1: Automatico (raccomandato)**
Visita: \`/api/funnel-stats/update?funnelId=${funnelId}\`

**Metodo 2: Manuale**
Usa l'API POST: \`/api/funnel-stats/update\`

\`\`\`bash
curl -X POST http://localhost:3000/api/funnel-stats/update \\
  -H "Content-Type: application/json" \\
  -d '{"funnelId": "${funnelId}"}'
\`\`\`

### 📝 Note

- Il tracking usa \`sessionStorage\` per identificare utenti unici
- Ogni utente viene tracciato una sola volta per step (no duplicati)
- I dati vengono salvati in tempo reale nel database
- Ricordati di aggiornare le statistiche regolarmente per vedere i dati nel dashboard
`;
}
