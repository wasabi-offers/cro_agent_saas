# 🎯 Funnel Tracking Setup

## Problema Risolto

Hai notato che i dati del funnel in Clarity non arrivano nel sistema? Questo è normale perché **il tracking dei funnel non era implementato nel database**!

Ho implementato un sistema completo di tracking dei funnel che:
- ✅ Traccia ogni visita agli step del funnel
- ✅ Calcola conversion rate reali basati sui dati
- ✅ Aggiorna automaticamente i contatori
- ✅ Funziona con sessionStorage per identificare utenti unici

## 📦 Cosa è stato implementato

### 1. Schema Database
- `funnel_tracking_sessions` - Traccia le sessioni degli utenti
- `funnel_tracking_events` - Traccia ogni step visitato
- `funnel_step_stats` - Statistiche aggregate per performance
- Views SQL per analytics rapido

### 2. API Endpoints
- **POST `/api/track`** - Endpoint aggiornato per salvare eventi funnel nel database
- **POST/GET `/api/funnel-stats/update`** - Aggiorna i contatori dei funnel dai dati reali

### 3. Script di Tracking JavaScript
- Script automatico che si installa sulle pagine del funnel
- Tracking automatico con sessionStorage
- Nessun duplicato garantito

### 4. UI Components
- Componente `TrackingSetup` aggiornato con pulsante "Aggiorna Statistiche"
- Istruzioni di installazione chiare
- Verifica installazione integrata

## 🚀 Installazione

### Step 1: Aggiorna il Database

**Vai su Supabase → SQL Editor → Crea una nuova query**

Copia e incolla il contenuto del file `supabase-funnel-tracking-schema.sql`:

```sql
-- Il file completo è: supabase-funnel-tracking-schema.sql
-- Esegui tutto il contenuto di quel file nel SQL Editor di Supabase
```

Oppure esegui manualmente:

```bash
# Se hai Supabase CLI installato
supabase db push
```

### Step 2: Verifica Installazione Database

Nel SQL Editor di Supabase, esegui questa query per verificare:

```sql
-- Verifica che le tabelle esistano
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'funnel_tracking%';

-- Dovresti vedere:
-- funnel_tracking_sessions
-- funnel_tracking_events
-- funnel_step_stats
```

### Step 3: Installa lo Script di Tracking

1. Vai alla pagina del funnel nel dashboard (`/funnels/[id]`)
2. Clicca sul tab **"Setup"**
3. Copia lo script di tracking generato
4. Incolla lo script nel `<head>` del tuo sito web
5. Lo script traccia automaticamente ogni visita agli step

### Step 4: Aggiorna le Statistiche

Dopo aver ricevuto visite reali:

**Opzione A: Tramite UI (Raccomandato)**
1. Vai al tab "Setup" del funnel
2. Clicca su "Aggiorna Statistiche"
3. I dati verranno aggiornati e la pagina si ricaricherà

**Opzione B: Tramite API Diretta**
```bash
# Aggiorna tutti i funnel
curl -X POST http://localhost:3000/api/funnel-stats/update

# Aggiorna un funnel specifico
curl -X POST http://localhost:3000/api/funnel-stats/update \
  -H "Content-Type: application/json" \
  -d '{"funnelId": "funnel_123"}'
```

**Opzione C: Tramite Browser**
Visita direttamente: `/api/funnel-stats/update?funnelId=funnel_123`

## 🔍 Come Funziona

### Flusso di Tracking

1. **Utente visita una pagina del funnel**
   - Lo script JavaScript si attiva
   - Genera/recupera session ID da sessionStorage
   - Invia evento a `/api/track`

2. **Server salva l'evento**
   - Crea/aggiorna la sessione in `funnel_tracking_sessions`
   - Salva l'evento in `funnel_tracking_events`
   - Trigger SQL automatici verificano completamento funnel

3. **Aggiornamento Statistiche**
   - API `/api/funnel-stats/update` conta visitatori unici
   - Calcola dropoff tra step consecutivi
   - Aggiorna `funnel_steps.visitors` e `funnel_steps.dropoff`
   - Calcola conversion rate complessivo del funnel

### Schema del Database

```
funnel_tracking_sessions
├── session_id (UNIQUE)
├── funnel_id (FK → funnels)
├── user_agent
├── started_at
└── completed (boolean)

funnel_tracking_events
├── session_id (FK → sessions)
├── funnel_id (FK → funnels)
├── step_id (FK → funnel_steps)
├── step_name
├── step_order
└── timestamp

funnel_steps (updated)
├── visitors ← Aggiornato da eventi reali
└── dropoff ← Calcolato automaticamente
```

## 📊 Verifica che Funzioni

### 1. Console del Browser

Dopo aver installato lo script, visita una pagina del funnel e apri la console (F12):

```
✅ Dovresti vedere:
🔍 CRO Funnel Tracking attivo - Funnel: funnel_xxx Step: Landing Page
✅ Funnel step tracked: Landing Page
```

### 2. Database Supabase

Controlla che gli eventi siano salvati:

```sql
-- Vedi le sessioni attive
SELECT * FROM funnel_tracking_sessions
ORDER BY started_at DESC
LIMIT 10;

-- Vedi gli eventi tracciati
SELECT
  fte.step_name,
  fte.session_id,
  fte.created_at
FROM funnel_tracking_events fte
ORDER BY fte.created_at DESC
LIMIT 20;

-- Conta visitatori per step
SELECT
  fs.name as step_name,
  COUNT(DISTINCT fte.session_id) as unique_visitors
FROM funnel_steps fs
LEFT JOIN funnel_tracking_events fte ON fs.id = fte.step_id
WHERE fs.funnel_id = 'funnel_xxx'
GROUP BY fs.id, fs.name, fs.step_order
ORDER BY fs.step_order;
```

### 3. Dashboard

1. Vai a `/funnels/[id]`
2. Tab "Setup" → Clicca "Aggiorna Statistiche"
3. La pagina si ricarica
4. Tab "Overview" → Vedi i contatori aggiornati!

## 🔄 Aggiornamento Automatico (Opzionale)

Per aggiornare automaticamente le statistiche ogni ora, puoi usare:

### Vercel Cron (se usi Vercel)

Crea `/api/cron/update-funnel-stats/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Verifica che la richiesta venga da Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Chiama l'API di update
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/funnel-stats/update`, {
    method: 'POST',
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

Poi aggiungi in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/update-funnel-stats",
    "schedule": "0 * * * *"
  }]
}
```

## 🐛 Troubleshooting

### Il tracking non funziona

1. **Verifica script installato**
   - Apri console browser (F12)
   - Cerca errori di rete

2. **Verifica endpoint API**
   ```bash
   curl -X POST http://localhost:3000/api/track \
     -H "Content-Type: application/json" \
     -d '{
       "funnelId": "test_funnel",
       "stepName": "Test Step",
       "sessionId": "test_123",
       "timestamp": "2024-01-01T00:00:00Z",
       "userAgent": "Test",
       "referrer": "direct"
     }'
   ```

3. **Verifica database**
   - Controlla che le tabelle esistano
   - Verifica permessi Supabase

### Le statistiche non si aggiornano

1. **Verifica che ci siano eventi**
   ```sql
   SELECT COUNT(*) FROM funnel_tracking_events;
   ```

2. **Esegui update manualmente**
   ```bash
   curl -X POST http://localhost:3000/api/funnel-stats/update
   ```

3. **Controlla i log**
   - Console del server
   - Supabase Logs

## 📝 Note Importanti

- ⚠️ **Session ID usa sessionStorage**: Se l'utente chiude il browser, viene generato un nuovo session ID
- ⚠️ **No duplicati**: Ogni step viene tracciato una sola volta per sessione
- ⚠️ **Aggiornamento manuale**: Le statistiche NON si aggiornano automaticamente, devi cliccare "Aggiorna" o chiamare l'API
- ✅ **Privacy**: Nessun dato personale viene salvato, solo eventi anonimi

## 🎉 Risultato

Ora hai un sistema completo di tracking dei funnel che:
- Traccia visite reali
- Calcola conversion rate precisi
- Mostra dati affidabili nel dashboard
- Si integra perfettamente con Clarity (che puoi continuare a usare per heatmaps e recordings)

## 🆘 Supporto

Se hai problemi:
1. Verifica i log della console browser
2. Controlla i log del server Next.js
3. Verifica le tabelle in Supabase
4. Controlla che le credenziali Supabase siano configurate correttamente in `.env.local`
