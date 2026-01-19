# 🔍 Sistema di Tracking Heatmap - Guida Completa

## 📋 Cosa Hai Ora

Ho implementato un **sistema completo di tracking** per catturare dati reali degli utenti:
- ✅ Click tracking (dove cliccano)
- ✅ Scroll tracking (quanto scrollano)
- ✅ Mouse movement tracking (dove guardano)
- ✅ Session tracking (device, browser, referrer)

## 🗄️ Step 1: Crea le Tabelle in Supabase

1. **Apri il tuo progetto Supabase**
2. Vai su **SQL Editor**
3. **Copia e incolla tutto il contenuto** di `supabase-tracking-schema.sql`
4. **Esegui lo script** (pulsante "Run")

Questo creerà:
- `tracking_sessions` - Sessioni utenti
- `tracking_events` - Eventi raw (click, scroll, movement)
- `tracking_heatmap_data` - Dati aggregati per performance
- Trigger automatico per aggregazione

## 🔧 Step 2: Configura Environment Variables

Nel tuo `.env.local` assicurati di avere:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App URL (per lo script di tracking)
NEXT_PUBLIC_APP_URL=https://tuo-dominio.vercel.app
# Oppure per locale:
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📝 Step 3: Aggiungi lo Script alle Tue Landing Pages

### Opzione A: Script Manuale

Aggiungi questo script nell'`<head>` della tua landing page:

```html
<!-- CRO Tracking Script -->
<script>
(function() {
  const LANDING_ID = "landing_123"; // ID univoco per questa landing
  const API_ENDPOINT = "https://tuo-dominio.vercel.app/api/track";
  const BATCH_SIZE = 10;
  const FLUSH_INTERVAL = 5000;

  let eventQueue = [];
  let sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  function trackEvent(type, data) {
    eventQueue.push({
      type,
      timestamp: Date.now(),
      ...data,
    });

    if (eventQueue.length >= BATCH_SIZE) {
      flushEvents();
    }
  }

  async function flushEvents() {
    if (eventQueue.length === 0) return;

    const eventsToSend = [...eventQueue];
    eventQueue = [];

    try {
      await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingId: LANDING_ID,
          sessionId: sessionId,
          events: eventsToSend,
        }),
      });
    } catch (error) {
      console.error('Tracking error:', error);
      eventQueue = [...eventsToSend, ...eventQueue];
    }
  }

  // Track CLICKS
  document.addEventListener('click', function(e) {
    const rect = document.body.getBoundingClientRect();
    trackEvent('click', {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY + window.scrollY),
      target: e.target.tagName,
      targetId: e.target.id || null,
      targetClass: e.target.className || null,
      pageWidth: document.body.scrollWidth,
      pageHeight: document.body.scrollHeight,
    });
  });

  // Track SCROLL
  let lastScrollY = 0;
  let scrollTimeout = null;

  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      const scrollY = window.scrollY;
      const scrollPercentage = Math.round((scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);

      if (Math.abs(scrollY - lastScrollY) > window.innerHeight * 0.05) {
        trackEvent('scroll', {
          y: Math.round(scrollY),
          percentage: Math.min(100, scrollPercentage),
          pageHeight: document.body.scrollHeight,
          viewportHeight: window.innerHeight,
        });
        lastScrollY = scrollY;
      }
    }, 100);
  });

  // Track MOUSE MOVEMENT
  let lastMouseTrack = 0;
  document.addEventListener('mousemove', function(e) {
    const now = Date.now();
    if (now - lastMouseTrack < 500) return;
    lastMouseTrack = now;

    const rect = document.body.getBoundingClientRect();
    trackEvent('movement', {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY + window.scrollY),
      pageWidth: document.body.scrollWidth,
      pageHeight: document.body.scrollHeight,
    });
  });

  // Track SESSION
  trackEvent('session_start', {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    referrer: document.referrer || 'direct',
    language: navigator.language,
  });

  // Flush periodico
  setInterval(flushEvents, FLUSH_INTERVAL);

  // Flush prima di uscire
  window.addEventListener('beforeunload', function() {
    if (eventQueue.length > 0) {
      navigator.sendBeacon(API_ENDPOINT, JSON.stringify({
        landingId: LANDING_ID,
        sessionId: sessionId,
        events: eventQueue,
      }));
    }
  });

  console.log('🔍 CRO Tracking attivo');
})();
</script>
```

### Opzione B: Usa la Funzione Helper (Consigliato)

Nel tuo codice Next.js:

```typescript
import { getTrackingScriptTag } from "@/lib/tracking-script";

// Genera lo script per la landing
const trackingScript = getTrackingScriptTag("landing_homepage");

// Inseriscilo nella tua pagina
<Head>
  <div dangerouslySetInnerHTML={{ __html: trackingScript }} />
</Head>
```

## 📊 Step 4: Visualizza i Dati

### Nel tuo CRO Agent Tool:

1. Vai su **Landing Analysis**
2. Inserisci l'URL della landing page
3. Clicca su "Start Analysis"
4. Seleziona il tab **"Heatmap"** 🔥
5. Scegli il tipo:
   - **Click Map** - Dove cliccano gli utenti
   - **Scroll Map** - Quanto scrollano
   - **Move Map** - Movimento del mouse

### L'API caricherà automaticamente:
- ✅ **Dati reali** se hai sessioni trackate in Supabase
- 🎨 **Dati demo** se non ci sono ancora dati (per testing)

## 🔍 Come Verificare che Funziona

### 1. Testa localmente:
```bash
# Avvia il server
npm run dev

# Vai su http://localhost:3000
# Apri Console Browser (F12)
```

### 2. Visita una landing page con lo script
Dovresti vedere:
```
🔍 CRO Tracking attivo - Landing ID: landing_xxx
```

### 3. Clicca, scrolla, muovi il mouse
Gli eventi vengono inviati ogni 5 secondi o dopo 10 eventi

### 4. Controlla i log del server
Vedrai:
```
📊 Landing Tracking: 5 events for landing landing_xxx
✅ Session recorded: sess_xxx
✅ Tracked 4 events
```

### 5. Verifica in Supabase
Vai su **Table Editor**:
- `tracking_sessions` → Dovresti vedere la sessione
- `tracking_events` → Dovresti vedere gli eventi
- `tracking_heatmap_data` → Dovresti vedere i dati aggregati

## 🚀 Deploy su Vercel

1. **Push del codice**:
```bash
git add .
git commit -m "Add tracking system"
git push origin main
```

2. **Vercel auto-deploya**

3. **Aggiorna le environment variables in Vercel**:
   - Settings → Environment Variables
   - Aggiungi `SUPABASE_SERVICE_ROLE_KEY`

4. **Redeploy** se necessario

## 📈 Come Usare i Dati Reali

Una volta che hai dati trackati:

```typescript
// Nell'API /api/heatmap-data
// Aggiungi filtri per data
const dateFrom = "2025-01-01";
const dateTo = "2025-01-31";

// L'API caricherà automaticamente i dati da Supabase
const response = await fetch(
  `/api/heatmap-data?landingId=landing_123&dateFrom=${dateFrom}&dateTo=${dateTo}`
);
```

## 🎯 Cosa Ottieni

Con questo sistema puoi:
- ✅ Vedere dove gli utenti cliccano REALMENTE
- ✅ Identificare zone "morte" (no interazioni)
- ✅ Scoprire dove abbandonano lo scroll
- ✅ Capire dove concentrano l'attenzione (mouse)
- ✅ Confrontare desktop vs mobile
- ✅ Filtrare per periodo temporale
- ✅ Generare AI insights dai pattern

## 🔧 Troubleshooting

### Non vedo dati in Supabase?
- Controlla che lo script sia caricato (Console browser)
- Verifica le credenziali Supabase in `.env.local`
- Controlla i log del server Next.js
- Verifica che le tabelle esistano in Supabase

### L'heatmap mostra solo dati demo?
- Normale se non ci sono sessioni trackate ancora
- Aggiungi `landingId` corretto alla chiamata API
- Verifica che ci siano dati in `tracking_heatmap_data`

### Errori CORS?
- L'endpoint `/api/track` ha già CORS configurato
- Verifica che `NEXT_PUBLIC_APP_URL` sia corretto

## 📚 File Importanti

- `src/lib/tracking-script.ts` - Genera lo script di tracking
- `src/app/api/track/route.ts` - Riceve gli eventi e li salva
- `src/app/api/heatmap-data/route.ts` - Ritorna i dati per la visualizzazione
- `src/components/HeatmapVisualization.tsx` - Visualizza la heatmap
- `supabase-tracking-schema.sql` - Schema del database

## 🎉 Pronto!

Ora hai un sistema di tracking completo. I dati reali sostituiranno automaticamente i dati demo quando inizierai a tracciare le tue landing pages!

---

**Domande?** Testa il sistema e dimmi se hai bisogno di aiuto! 🚀
