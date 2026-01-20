# 🔍 Sistema di Tracking Avanzato CRO - Setup Completo

## 📋 Panoramica

Sistema proprietario di tracking completo per CRO analytics:
- ✅ **Page views** e sessioni
- ✅ **Click tracking** (posizione, elemento, testo, CTA)
- ✅ **Scroll tracking** (depth, percentuale)
- ✅ **Mouse movement** (per heatmap)
- ✅ **Form interactions** (focus, blur, change, submit)
- ✅ **Rage clicks** (frustrazione utente - 3+ click rapidi)
- ✅ **Dead clicks** (click su elementi non interattivi)
- ✅ **Exit intent** (quando utente esce dalla pagina)
- ✅ **Time on page** e engagement
- ✅ **Device detection** (mobile/tablet/desktop, browser, OS)
- ✅ **UTM parameters** (sorgente traffico)
- ✅ **Funnel progression** tracking

---

## 🗄️ STEP 1: Setup Database

### Esegui la Migration SQL

1. **Apri il tuo progetto Supabase**
2. Vai su **SQL Editor**
3. **Copia TUTTO il contenuto** del file `MIGRATION_ADD_TRACKING.sql`
4. **Incolla** nell'editor e clicca **"Run"**

✅ Questo creerà tutte le tabelle necessarie:
- `tracking_sessions` - Sessioni utenti complete
- `tracking_events` - Tutti gli eventi tracciati
- `heatmap_data` - Dati aggregati per heatmap
- `conversion_events` - Eventi di conversione
- `funnel_progressions` - Journey nei funnel

---

## 🔧 STEP 2: Environment Variables

Verifica che `.env.local` contenga:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App URL (per lo script di tracking)
NEXT_PUBLIC_APP_URL=https://tuo-dominio.com
# Oppure per locale:
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📝 STEP 3: Genera e Installa Script di Tracking

### 3.1 Vai nel Funnel

1. Dashboard → Seleziona un funnel
2. Vai nel tab **"Tracking"**
3. Vedrai gli script generati automaticamente per ogni step

### 3.2 Installa lo Script su Ogni Pagina

Per ogni step del funnel:

**1. Copia lo script** (pulsante "Copia Script")

**2. Incollalo nella pagina** prima del tag `</body>`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>La Tua Pagina</title>
</head>
<body>

  <!-- Il tuo contenuto -->
  <h1>Landing Page</h1>
  <button>CTA Button</button>

  <!-- ⬇️ INCOLLA LO SCRIPT QUI ⬇️ -->
  <script>
    (function() {
      'use strict';
      // Script di tracking CRO Agent
      // ... (codice completo copiato)
    })();
  </script>

</body>
</html>
```

**3. Ripeti per ogni step** del funnel (es. Landing → Product → Cart → Checkout → Thanks)

---

## 📊 STEP 4: Raccogli Dati Reali

### Aspetta che Arrivino Visite

Lo script inizia automaticamente a tracciare quando un utente visita la pagina:

**Cosa viene tracciato:**
- Prima visita (pageview + session init)
- Ogni click (posizione, elemento, se è CTA)
- Scroll depth ogni 5% di pagina
- Mouse movement ogni 500ms (per heatmap)
- Form interactions (focus, blur, change, submit)
- Rage clicks (3+ click rapidi stesso elemento)
- Dead clicks (click su elementi non interattivi)
- Exit intent (mouse esce dalla pagina in alto)
- Time on page ogni 30 secondi
- Funnel step visit (per calcolare conversioni)

**Batch Processing:**
- Eventi inviati ogni 20 eventi O ogni 5 secondi
- Usa `sendBeacon` su page unload per non perdere dati
- Gestione errori con retry automatico

---

## 🔢 STEP 5: Calcola le Statistiche

### Dopo Aver Raccolto Visite

1. Torna nel tab **"Tracking"** del funnel
2. Clicca **"Calcola Statistiche"** (pulsante in basso)

Il sistema:
- Conta visitatori unici per step
- Calcola dropoff % tra step consecutivi
- Calcola conversion rate complessivo
- Aggiorna `funnel_steps` con i dati reali

**Risultato:**
```
✅ Aggiornato!
Landing Page: 1,234 visite
Product Page: 856 visite (30.6% dropoff)
Cart: 542 visite (36.7% dropoff)
Checkout: 234 visite (56.8% dropoff)
Thank You: 189 visite (19.2% dropoff)

Conversion Rate: 15.3%
```

---

## 🔍 Verifica che Funzioni

### Test Locale

**1. Avvia il server:**
```bash
npm run dev
```

**2. Apri una pagina con lo script** (o crea una test page)

**3. Apri Console Browser** (F12 → Console)

**4. Dovresti vedere:**
```
[CRO Tracking] Initialized - Session: sess_1234567890_abc123def
```

**5. Interagisci con la pagina:**
- Clicca bottoni
- Scrolla
- Muovi il mouse
- Compila form

**6. Controlla i log del server** (terminal Next.js):
```
📊 Tracking 15 events
✅ Tracked 15 events for 1 session(s)
```

### Verifica in Supabase

**Table Editor → `tracking_sessions`:**
- Dovresti vedere la tua sessione con device info

**Table Editor → `tracking_events`:**
- Dovresti vedere tutti gli eventi (pageview, click, scroll, ecc.)

**Table Editor → `heatmap_data`:**
- Dati aggregati per heatmap (dopo alcuni eventi)

---

## 📈 Dati e Analytics

### View SQL Preconfigurate

Il sistema include view SQL per analytics:

**`session_analytics`**
```sql
SELECT * FROM session_analytics
WHERE date >= '2025-01-01'
ORDER BY date DESC;
```
Metriche: total_sessions, engaged_sessions, converted_sessions, avg_pageviews, avg_clicks, device_type, browser

**`page_analytics`**
```sql
SELECT * FROM page_analytics
WHERE path = '/landing-page'
ORDER BY total_views DESC;
```
Metriche: total_views, unique_visitors, total_clicks, cta_clicks, avg_scroll_depth

**`cta_performance`**
```sql
SELECT * FROM cta_performance
WHERE path = '/landing-page'
ORDER BY total_clicks DESC;
```
Vedi quali CTA performano meglio

**`funnel_analytics_view`**
```sql
SELECT * FROM funnel_analytics_view
WHERE funnel_id = 'funnel_123'
ORDER BY funnel_step_order;
```
Statistiche complete per funnel

---

## 🚀 Deploy Production

### Vercel Deploy

**1. Push del codice:**
```bash
git add .
git commit -m "Add advanced tracking system"
git push origin main
```

**2. Vercel auto-deploya**

**3. Aggiorna environment variables in Vercel:**
- Settings → Environment Variables
- Aggiungi `SUPABASE_SERVICE_ROLE_KEY`
- Aggiorna `NEXT_PUBLIC_APP_URL` con dominio production

**4. Redeploy** se necessario

### Update Script sui Siti

Dopo il deploy, aggiorna `NEXT_PUBLIC_APP_URL` e rigenera gli script:
1. Vai nel funnel → tab Tracking
2. Gli script useranno automaticamente il nuovo URL
3. Ricopia e reincolla gli script aggiornati

---

## 🎯 Vantaggi del Sistema Proprietario

✅ **Nessun Limite**: Tracking illimitato, nessun piano a pagamento
✅ **Privacy**: Dati tuoi al 100%, nessuna terza parte (no Clarity, no GA)
✅ **Personalizzabile**: Puoi aggiungere eventi custom
✅ **Performance**: Batch processing, minimo impatto (< 5KB script)
✅ **Real-time**: Dati disponibili immediatamente
✅ **Completo**: Cattura TUTTO quello che serve per CRO
✅ **Heatmap Ready**: Dati aggregati per visualizzazione
✅ **Funnel Native**: Tracking funnel integrato

---

## 🔧 Troubleshooting

### ❌ Errore: "column first_seen_at does not exist"
**Causa:** Migration non eseguita
**Fix:** Esegui `MIGRATION_ADD_TRACKING.sql` in Supabase SQL Editor

### ❌ I dati non arrivano?
- Verifica di aver eseguito la migration SQL
- Controlla Console browser per errori (F12)
- Verifica che `NEXT_PUBLIC_APP_URL` sia corretto
- Controlla CORS se sito su dominio diverso

### ❌ Le statistiche non si aggiornano?
- Assicurati di aver installato script su TUTTE le pagine
- Verifica che ci siano visite reali (non solo test)
- Clicca "Calcola Statistiche" per forzare update
- Controlla che `funnel_id` sia corretto nello script

### ❌ Errore "session_id not found"
- Lo script crea automaticamente sessioni
- Verifica che sessionStorage sia abilitato
- Potrebbe essere blocco cookie/privacy (normale per alcuni utenti)

### ❌ Script non viene eseguito
- Verifica che lo script sia dentro `<script>` tags
- Controlla errori JavaScript in console
- Assicurati che sia prima di `</body>`

---

## 📂 File Importanti

- `MIGRATION_ADD_TRACKING.sql` - Migration database (eseguire in Supabase)
- `src/lib/advanced-tracking-script.ts` - Generatore script tracking
- `src/app/api/track/route.ts` - Endpoint per ricevere eventi
- `src/app/api/funnel-stats/calculate/route.ts` - Calcolo statistiche funnel
- `src/components/TrackingSetup.tsx` - UI per setup tracking
- `supabase-advanced-tracking-schema.sql` - Schema completo (reference)

---

## 🎉 Prossimi Sviluppi

- [ ] Dashboard analytics visuale completa
- [ ] Heatmap overlay su screenshot pagine
- [ ] Report rage clicks e dead clicks
- [ ] Esportazione dati CSV/Excel
- [ ] Alert automatici per anomalie funnel
- [ ] A/B test integration
- [ ] Cohort analysis
- [ ] Session replay

---

## 💡 Best Practices

1. **Installa lo script il prima possibile** nella pagina (prima interazioni utente)
2. **Testa sempre in locale** prima di installare in production
3. **Monitora i log** per i primi giorni
4. **Calcola statistiche regolarmente** (una volta al giorno minimo)
5. **Analizza i dati** per ottimizzare il funnel
6. **Privacy**: Informa gli utenti nel privacy policy

---

**Pronto! 🚀** Il tuo sistema di tracking avanzato è operativo. Buon CRO! 📈
