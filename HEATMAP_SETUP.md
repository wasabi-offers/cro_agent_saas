# Heatmap Setup - Clarity-Style Visualization

## Come Funziona

Il sistema cattura screenshot full-page delle tue landing e mostra la heatmap overlay sopra, proprio come Clarity.

**Vantaggi:**
- ✅ Vedi la pagina REALE scrollabile
- ✅ Puntini posizionati esattamente dove gli utenti cliccano
- ✅ Nessun problema CORS
- ✅ Screenshot salvati per confronti nel tempo

## Setup ScreenshotAPI

### Opzione 1: ScreenshotAPI (Consigliata - 100 screenshot/mese gratis)

1. **Registrati su ScreenshotAPI**
   - Vai su: https://screenshotapi.net/
   - Clicca "Sign Up" (gratuito)
   - Verifica email

2. **Ottieni il token**
   - Dashboard → API Keys
   - Copia il token

3. **Aggiungi al file `.env.local`**
   ```env
   SCREENSHOT_API_TOKEN=your_token_here
   ```

4. **Redeploy su Vercel**
   - Vai su Vercel Dashboard
   - Project Settings → Environment Variables
   - Aggiungi: `SCREENSHOT_API_TOKEN` = `your_token_here`
   - Redeploy

### Opzione 2: ApiFlash (500 screenshot/mese gratis)

Se preferisci ApiFlash:

1. Registrati su: https://apiflash.com/
2. Ottieni access key
3. Modifica `/src/app/api/capture-screenshot/route.ts`:

```typescript
const screenshotApiUrl = `https://api.apiflash.com/v1/urltoimage`;
const params = new URLSearchParams({
  access_key: process.env.APIFLASH_ACCESS_KEY || '',
  url: url,
  full_page: 'true',
  fresh: 'true',
  width: '1200',
  format: 'png',
});
```

### Opzione 3: Self-hosted Puppeteer (Illimitato ma più complesso)

Se vuoi screenshot illimitati, usa Puppeteer:

1. Installa dipendenze:
   ```bash
   npm install puppeteer
   ```

2. Modifica API route per usare Puppeteer:
   ```typescript
   import puppeteer from 'puppeteer';

   const browser = await puppeteer.launch({ headless: true });
   const page = await browser.newPage();
   await page.goto(url);
   await page.setViewport({ width: 1200, height: 800 });
   const screenshot = await page.screenshot({
     fullPage: true,
     type: 'png'
   });
   await browser.close();
   ```

3. **Nota:** Puppeteer richiede Chrome installato su Vercel
   - Aggiungi a `vercel.json`:
   ```json
   {
     "functions": {
       "api/capture-screenshot.ts": {
         "memory": 1024,
         "maxDuration": 30
       }
     }
   }
   ```

## Come Usare

1. **Vai al funnel** → Tab "Heatmap"
2. **Seleziona step** (es. Landing)
3. **Seleziona tipo** (Click Map / Scroll Map / Move Map)
4. **Lo screenshot viene catturato automaticamente** al primo caricamento
5. **Clicca "Refresh Page"** per ricatturare screenshot aggiornato

## Troubleshooting

### Screenshot non si carica
- Controlla che `SCREENSHOT_API_TOKEN` sia configurato
- Verifica il token su ScreenshotAPI dashboard
- Controlla i logs su Vercel: `vercel logs`

### "Failed to capture screenshot"
- La landing potrebbe bloccare screenshot (raro)
- Prova un'altra API (ApiFlash o Puppeteer)
- Verifica che l'URL sia accessibile pubblicamente

### Heatmap non si vede
- Controlla che ci siano eventi nel database:
  ```sql
  SELECT COUNT(*) FROM tracking_events
  WHERE funnel_id = 'YOUR_FUNNEL_ID'
  AND event_type = 'click';
  ```
- Verifica che `click_x` e `click_y` non siano NULL

### Screenshot troppo vecchio
- Clicca "Refresh Page" per ricatturare
- Gli screenshot vengono cachati per performance
- Usa parametro `fresh: 'true'` per forzare ricattura

## Performance

- **Screenshot vengono cachati** nel browser
- **Primo caricamento:** ~3-5 secondi (cattura screenshot)
- **Caricamenti successivi:** ~1 secondo (usa cache)
- **Refresh manuale:** bottone "Refresh Page"

## Costi

### ScreenshotAPI (Consigliata)
- **Free:** 100 screenshot/mese
- **Pro:** $19/mese = 10,000 screenshot
- **Business:** $49/mese = 50,000 screenshot

### ApiFlash
- **Free:** 500 screenshot/mese
- **Starter:** $9/mese = 5,000 screenshot

### Puppeteer (Self-hosted)
- **Gratis** ma richiede server potente
- Memory: 512MB-1GB per istanza
- Vercel: funziona con limiti

## Prossimi Step

✅ Screenshot full-page implementato
✅ Heatmap overlay funzionante
✅ Refresh manuale disponibile

🔄 Da implementare (opzionale):
- [ ] Cache screenshot su Supabase Storage (evita ri-capture)
- [ ] Screenshot scheduling (cattura automatica ogni 24h)
- [ ] Confronto screenshot nel tempo (A vs B)
