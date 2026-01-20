# 🎯 Clarity Funnel Sync - Setup Completo

## Problema Risolto

Hai Clarity installato sul tuo sito che traccia tutto, ma i dati non arrivavano nei funnel del dashboard. **Ora è risolto!**

## 🚀 Come Funziona

Clarity traccia automaticamente **tutte le visite** alle pagine del tuo sito. Noi usiamo l'API di Clarity per:
1. Filtrare il traffico per URL specifici (gli step del funnel)
2. Contare i visitatori per ogni URL
3. Calcolare dropoff e conversion rate
4. Aggiornare il funnel nel database

**Zero tracking script custom da installare!** Usi solo Clarity come già fai.

## 📋 Setup Passo-Passo

### Step 1: Installa Clarity (se non l'hai già)

1. Vai su [clarity.microsoft.com](https://clarity.microsoft.com)
2. Crea un progetto
3. Copia lo script di installazione
4. Incollalo nel `<head>` del tuo sito

**Script esempio:**
```html
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "TUO_PROJECT_ID");
</script>
```

✅ **Fatto!** Clarity sta già tracciando tutto.

### Step 2: Configura gli URL nel Funnel

Vai nel dashboard CRO Agent:
1. Apri il funnel che vuoi tracciare
2. Clicca su "Modifica" / "Edit"
3. Per ogni step, aggiungi l'**URL completo** della pagina
   - Esempio: `https://tuosito.com/landing-page`
   - Esempio: `https://tuosito.com/checkout`

**Importante:** Gli URL devono essere quelli reali che gli utenti visitano!

### Step 3: Ottieni la Clarity API Key

1. Vai su [clarity.microsoft.com](https://clarity.microsoft.com)
2. Seleziona il tuo progetto
3. Vai su **Settings → API**
4. Clicca **"Generate new API key"**
5. Copia la key (qualcosa tipo: `abc123def456xyz...`)

### Step 4: Sincronizza i Dati

Nel dashboard CRO Agent:
1. Vai alla pagina del funnel
2. Clicca sul tab **"Setup"**
3. Incolla la tua **Clarity API Key**
4. Scegli il periodo (es. ultimi 7 giorni)
5. Clicca **"Sincronizza con Clarity"**

🎉 **I dati vengono importati!**

## 🔄 Come Funziona Tecnicamente

```
┌─────────────────────────────────────────────────┐
│  Utente visita tuosito.com/landing-page        │
│  Clarity traccia automaticamente                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Nel Dashboard CRO Agent:                       │
│  Clicca "Sincronizza con Clarity"               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  POST /api/clarity-sync-funnel                  │
│  {                                               │
│    funnelId: "funnel_123",                      │
│    clarityApiKey: "...",                        │
│    numOfDays: 7                                 │
│  }                                               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Per ogni step del funnel:                      │
│  1. Estrae l'URL dallo step                     │
│  2. Chiama Clarity API filtrata per quell'URL   │
│  3. Conta le sessioni                           │
│  4. Aggiorna il database                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Calcola:                                        │
│  - Dropoff tra step consecutivi                 │
│  - Conversion rate complessivo                  │
│  - Aggiorna funnel_steps.visitors               │
│  - Aggiorna funnels.conversion_rate             │
└─────────────────────────────────────────────────┘
                    ↓
            ✅ Dati aggiornati!
```

## 📊 Esempio di Chiamata API

### Request

```bash
curl -X POST https://tuodominio.com/api/clarity-sync-funnel \
  -H "Content-Type: application/json" \
  -d '{
    "funnelId": "funnel_1234567890",
    "clarityApiKey": "abc123def456xyz789",
    "numOfDays": 7
  }'
```

### Response (Success)

```json
{
  "success": true,
  "funnel": {
    "id": "funnel_1234567890",
    "name": "E-commerce Checkout",
    "conversionRate": 12.5
  },
  "steps": [
    {
      "stepId": "step_1",
      "stepName": "Landing Page",
      "visitors": 1000
    },
    {
      "stepId": "step_2",
      "stepName": "Product Page",
      "visitors": 750,
      "dropoff": 25
    },
    {
      "stepId": "step_3",
      "stepName": "Checkout",
      "visitors": 125,
      "dropoff": 83.33
    }
  ],
  "syncedAt": "2024-01-20T10:30:00Z",
  "dataRange": "Last 7 days"
}
```

### Response (Error)

```json
{
  "error": "Invalid Clarity API key. Check your key at clarity.microsoft.com → Settings → API"
}
```

## 🛠️ Troubleshooting

### "Invalid API key"

✅ **Soluzione:**
1. Vai su clarity.microsoft.com → Settings → API
2. Verifica che la key sia corretta
3. Genera una nuova key se necessario

### "Some steps don't have URLs configured"

✅ **Soluzione:**
1. Vai alla pagina del funnel
2. Clicca "Modifica"
3. Aggiungi l'URL completo per ogni step
4. Salva e riprova

### "No steps found for this funnel"

✅ **Soluzione:**
- Il funnel è vuoto o non esiste
- Verifica di aver creato il funnel correttamente

### I dati sembrano sbagliati

Verifica che:
- ✅ Gli URL nel funnel corrispondano a quelli reali del sito
- ✅ Clarity sia installato correttamente sul sito
- ✅ Ci siano visite reali nel periodo selezionato

Controlla i dati su Clarity direttamente:
1. Vai su clarity.microsoft.com
2. Seleziona il progetto
3. Vai su "Dashboard"
4. Controlla che ci siano sessioni nel periodo selezionato

## 🎯 Vantaggi di Questo Approccio

✅ **Nessun tracking script custom** - Usi solo Clarity
✅ **Dati reali da produzione** - Non sono mock
✅ **Sincronizzazione on-demand** - Controlli quando aggiornare
✅ **Privacy-friendly** - Clarity gestisce già tutto
✅ **Facile da configurare** - Solo 4 step
✅ **Nessun costo aggiuntivo** - Clarity è gratis

## 🔒 Sicurezza

- La tua API Key **NON viene salvata** nel database
- Viene usata solo per la chiamata API
- È trasmessa via HTTPS
- Puoi rigenerare la key in qualsiasi momento su Clarity

## 📈 Metriche Calcolate

### Visitors (Visitatori Unici)

Numero di sessioni Clarity che hanno visitato quell'URL.

### Dropoff (Abbandono)

```
dropoff = ((step_precedente_visitors - step_corrente_visitors) / step_precedente_visitors) * 100
```

Esempio:
- Step 1: 1000 visitatori
- Step 2: 750 visitatori
- Dropoff Step 2: ((1000 - 750) / 1000) * 100 = 25%

### Conversion Rate (Tasso di Conversione)

```
conversion_rate = (ultimo_step_visitors / primo_step_visitors) * 100
```

Esempio:
- Primo step: 1000 visitatori
- Ultimo step: 125 visitatori
- Conversion rate: (125 / 1000) * 100 = 12.5%

## 🔄 Sincronizzazione Periodica

Puoi sincronizzare i dati ogni volta che vuoi:
- Manualmente dal dashboard
- Programmaticamente via API

**Esempio cron job giornaliero:**

```bash
#!/bin/bash
# sync-funnels.sh

FUNNEL_IDS=("funnel_123" "funnel_456" "funnel_789")
CLARITY_API_KEY="tua_api_key_qui"

for FUNNEL_ID in "${FUNNEL_IDS[@]}"; do
  echo "Syncing $FUNNEL_ID..."
  curl -X POST https://tuodominio.com/api/clarity-sync-funnel \
    -H "Content-Type: application/json" \
    -d "{
      \"funnelId\": \"$FUNNEL_ID\",
      \"clarityApiKey\": \"$CLARITY_API_KEY\",
      \"numOfDays\": 1
    }"
  echo "Done!"
done
```

Aggiungi a crontab:
```bash
0 2 * * * /path/to/sync-funnels.sh
```

## 🎉 Risultato Finale

Ora hai:
- ✅ Clarity installato una volta sul sito
- ✅ Tracking automatico di tutte le pagine
- ✅ Sincronizzazione dati nel dashboard CRO Agent
- ✅ Conversion rate e dropoff reali
- ✅ Nessun codice custom da mantenere

**Tutto funziona con Clarity come richiesto!** 🚀
