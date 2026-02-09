# 🎯 Attribution System - First-Party Data Tracking

## Panoramica

Sistema di tracciamento first-party data proprietario che permette di:
- ✅ Tracciare utenti con ID persistente (2+ anni)
- ✅ Attribution multi-touch (First Touch, Last Touch, Linear)
- ✅ Tracciamento cross-session del customer journey
- ✅ Lifecycle stages automatici (visitor → lead → customer → returning_customer)
- ✅ Integrazione completa con funnel tracking

---

## 🗄️ Setup Database

### 1. Esegui la Migration

```bash
# Opzione 1: Copia e incolla in Supabase SQL Editor
migrations/add_attribution_tracking.sql

# Opzione 2: Via CLI Supabase
supabase db push
```

### Tabelle Create

| Tabella | Descrizione |
|---------|-------------|
| `tracking_users` | Utenti univoci con first-party ID persistente |
| `attribution_touchpoints` | Ogni interazione nel customer journey |
| `attribution_conversions` | Conversioni con attribution multi-touch |
| `attribution_channels` | Performance aggregata per canale |

---

## 📝 Installazione Script di Tracking

### Script Base

Aggiungi questo codice prima della chiusura `</body>` su ogni pagina:

```html
<!-- CRO Attribution Tracking Script -->
<script>
  // Opzionale: per funnel tracking
  window.funnelId = "YOUR_FUNNEL_ID";
  window.funnelStep = "Landing Page";
</script>
<script src="https://your-domain.com/cro-tracker-attribution.js" defer></script>
```

### Con Configurazione Custom

```html
<script>
  // Funnel tracking (opzionale)
  window.funnelId = "funnel_abc123";
  window.funnelStep = "Checkout";
  
  // User ID custom (opzionale - per utenti loggati)
  window.croUserId = "customer_12345";
</script>
<script src="https://your-domain.com/cro-tracker-attribution.js" defer></script>
```

---

## 🔄 Come Funziona

### 1. Generazione User ID

```
Prima Visita:
┌─────────────────────────────────────────┐
│ 1. Genera user_id univoco (UUID)        │
│ 2. Salva in localStorage                │
│ 3. Salva in cookie first-party (2 anni) │
│ 4. Invia al server                      │
└─────────────────────────────────────────┘

Visite Successive:
┌─────────────────────────────────────────┐
│ 1. Recupera user_id da localStorage     │
│ 2. Se non trovato, recupera da cookie   │
│ 3. Collega nuova session al user_id     │
│ 4. Aggiorna last-touch attribution      │
└─────────────────────────────────────────┘
```

### 2. Attribution Tracking

```
┌────────────────────────────────────────────────────────┐
│                    FIRST TOUCH                          │
│  La prima sorgente che porta l'utente                  │
│  Esempio: google/organic                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│                   TOUCHPOINTS                           │
│  Ogni interazione significativa:                        │
│  - Pageviews                                           │
│  - CTA Clicks                                          │
│  - Form Submits                                        │
│  - Funnel Steps                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│                    LAST TOUCH                           │
│  L'ultima sorgente prima della conversione             │
│  Esempio: facebook/cpc                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Tracking Conversioni

### JavaScript API

```javascript
// Traccia acquisto
window.croTrackConversion('purchase', 'Order #123', 99.99);

// Traccia lead
window.croTrackConversion('lead', 'Newsletter Signup', 0);

// Traccia custom conversion
window.croTrackConversion('custom', 'Demo Request', 50);
```

### Eventi Custom

```javascript
// Traccia evento custom
window.croTrackEvent('video_watched', {
  videoId: 'video_123',
  duration: 120,
  percentage: 75
});

// Identifica utente (per utenti loggati)
window.croIdentify('customer_123', {
  email: 'user@example.com',
  plan: 'premium'
});
```

---

## 📊 API Endpoints

### GET /api/attribution

Overview completa dell'attribution.

```javascript
// Query params
?days=30  // Periodo (default: 30)

// Response
{
  "metrics": {
    "totalUsers": 1234,
    "newUsers": 890,
    "returningUsers": 344,
    "totalSessions": 3456,
    "totalConversions": 123,
    "totalRevenue": 9876.54,
    "conversionRate": 9.97
  },
  "channelAttribution": [...],
  "lifecycleStages": {...},
  "deviceBreakdown": [...],
  "recentUsers": [...]
}
```

### GET /api/attribution/users

Lista utenti con journey completo.

```javascript
// Query params
?user_id=usr_xxx  // Dettaglio singolo utente
?page=1           // Paginazione
?limit=50

// Response per singolo utente
{
  "user": {...},
  "touchpoints": [...],
  "conversions": [...],
  "sessions": [...],
  "journey": {
    "totalTouchpoints": 45,
    "totalConversions": 2,
    "customerLifetimeDays": 30
  }
}
```

### GET /api/attribution/channels

Performance canali con modelli attribution.

```javascript
// Query params
?days=30
?model=first_touch  // first_touch, last_touch, linear

// Response
{
  "channels": [
    {
      "source": "google",
      "medium": "organic",
      "users": 500,
      "sessions": 1200,
      "conversions": 50,
      "revenue": 4500.00,
      "conversionRate": "10.00"
    }
  ],
  "totals": {...},
  "topChannels": {...}
}
```

---

## 🔍 Query SQL Utili

### Utenti che Ritornano

```sql
SELECT 
  user_id,
  total_sessions,
  first_seen_at,
  last_seen_at,
  (last_seen_at - first_seen_at) as customer_lifetime
FROM tracking_users
WHERE total_sessions > 1
ORDER BY total_sessions DESC;
```

### Customer Journey Completo

```sql
SELECT 
  t.user_id,
  t.touchpoint_type,
  t.source,
  t.medium,
  t.page_path,
  t.is_conversion,
  t.conversion_value,
  t.timestamp
FROM attribution_touchpoints t
WHERE t.user_id = 'usr_xxx'
ORDER BY t.timestamp;
```

### Attribution per Canale (First Touch)

```sql
SELECT 
  first_touch_source as channel,
  first_touch_medium as medium,
  COUNT(*) as users,
  SUM(total_conversions) as conversions,
  SUM(total_revenue) as revenue,
  ROUND(SUM(total_conversions)::NUMERIC / COUNT(*) * 100, 2) as conv_rate
FROM tracking_users
WHERE first_seen_at >= NOW() - INTERVAL '30 days'
GROUP BY first_touch_source, first_touch_medium
ORDER BY revenue DESC;
```

### Conversione Media per Lifecycle Stage

```sql
SELECT 
  lifecycle_stage,
  COUNT(*) as users,
  AVG(total_sessions) as avg_sessions,
  AVG(total_revenue) as avg_revenue
FROM tracking_users
GROUP BY lifecycle_stage
ORDER BY avg_revenue DESC;
```

---

## 🏷️ Modelli di Attribution

### First Touch (Default)

100% del credito alla prima interazione.

**Uso**: Capire quali canali generano awareness.

### Last Touch

100% del credito all'ultima interazione prima della conversione.

**Uso**: Capire quali canali chiudono le vendite.

### Linear

Credito diviso equamente tra tutti i touchpoint.

**Uso**: Valorizzare l'intero customer journey.

---

## 🔒 Privacy & Compliance

Il sistema è **first-party compliant** perché:

1. **Dati First-Party**: Cookie e localStorage sul tuo dominio
2. **Nessuna Terza Parte**: I dati non escono dal tuo database
3. **Opt-Out Facile**: Basta cancellare localStorage/cookie
4. **GDPR Ready**: Puoi implementare consent management

### Implementare Opt-Out

```javascript
// Disabilita tracking
localStorage.removeItem('cro_user_id');
document.cookie = 'cro_uid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
```

---

## 🚀 Best Practices

1. **Installa su Tutte le Pagine**: Per journey completo
2. **Configura Funnel Steps**: Per conversion tracking accurato
3. **Traccia Conversioni**: Usa `croTrackConversion()` per ogni vendita
4. **Analizza Regolarmente**: Controlla la dashboard Attribution
5. **Confronta Modelli**: Usa first-touch E last-touch per insights completi

---

## 📂 File del Sistema

| File | Descrizione |
|------|-------------|
| `migrations/add_attribution_tracking.sql` | Migration database |
| `public/cro-tracker-attribution.js` | Script tracking client-side |
| `supabase/functions/track-event/index.ts` | Edge Function per eventi |
| `src/app/attribution/page.tsx` | Dashboard Attribution |
| `src/app/api/attribution/route.ts` | API overview |
| `src/app/api/attribution/users/route.ts` | API users |
| `src/app/api/attribution/channels/route.ts` | API channels |

---

## 🎉 Conclusione

Il sistema Attribution ti permette di:
- Tracciare il **customer journey completo**
- Capire **quali canali funzionano**
- Ottimizzare il **budget marketing**
- Aumentare il **ROI delle campagne**

**Buon Tracking! 🎯**
