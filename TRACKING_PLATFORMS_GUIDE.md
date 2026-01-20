# 🚀 Guida Installazione Tracking per Piattaforme

## Compatibilità Garantita

✅ **GoHighLevel** (Funnel Builder, Website Builder, Forms)
✅ **Elementor** (WordPress)
✅ **HTML Statico** (qualsiasi hosting)
✅ **ClickFunnels** (Pages & Funnels)
✅ **Unbounce**
✅ **Leadpages**
✅ **Webflow**
✅ **Shopify**
✅ **Wix**

---

## 📋 STEP 1: Copia lo Script

1. Dashboard CRO Agent → Vai nel Funnel
2. Tab **"Setup"**
3. Copia lo script per ogni step (bottone "Copia Script")

Lo script è **auto-contenuto** - non richiede jQuery, librerie esterne, nulla!

---

## 🔧 INSTALLAZIONE PER PIATTAFORMA

### 🎯 **GoHighLevel**

#### Opzione A: Funnel Builder
1. Apri il **Funnel Builder**
2. Seleziona la pagina
3. Vai su **Settings → Tracking Code**
4. Incolla lo script nel campo **"Footer Code"** o **"Body Code"**
5. Salva

#### Opzione B: Website Builder
1. Apri la pagina nel **Website Builder**
2. Clicca **Settings** (icona ingranaggio)
3. **SEO & Meta → Custom Code**
4. Incolla nel campo **"Footer Code"**
5. Pubblica

#### Opzione C: Form Tracking
1. Apri il **Form Builder**
2. Settings → **Thank You Page**
3. Aggiungi **Custom HTML** element
4. Incolla lo script
5. Salva

---

### 🎨 **Elementor (WordPress)**

#### Metodo 1: HTML Widget (Consigliato)
1. Apri la pagina in **Elementor Editor**
2. Trascina il widget **HTML** nella footer section
3. Incolla lo script completo (incluso `<script>...</script>`)
4. **Update** la pagina

#### Metodo 2: Custom Code (Theme)
1. Dashboard WordPress → **Appearance → Theme Editor**
2. Apri `footer.php`
3. Incolla lo script **prima di** `</body>`
4. **Update File**

#### Metodo 3: Plugin (più pulito)
1. Installa plugin **"Insert Headers and Footers"**
2. Settings → Insert Headers and Footers
3. Incolla nel campo **"Scripts in Footer"**
4. Save

---

### 📄 **HTML Statico**

Semplicissimo - apri il file `.html` e incolla lo script prima di `</body>`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>La Tua Pagina</title>
</head>
<body>

  <!-- Il tuo contenuto -->
  <h1>Landing Page</h1>
  <button id="cta-button">Clicca Qui</button>

  <!-- ⬇️ INCOLLA QUI LO SCRIPT ⬇️ -->
  <script>
    (function() {
      'use strict';
      // ... codice di tracking ...
    })();
  </script>

</body>
</html>
```

Salva e carica via FTP.

---

### 🚀 **ClickFunnels**

#### ClickFunnels 2.0
1. Apri la pagina nel **Funnel Builder**
2. Clicca **Settings** (icona ingranaggio in alto)
3. **Tracking Code** tab
4. Incolla nel campo **"Footer Tracking Code"**
5. **Save**

#### ClickFunnels Classic
1. Apri la pagina
2. **Settings → Tracking Code**
3. Incolla nel campo **"Footer"**
4. **Save & Update Page**

---

### 🎨 **Unbounce**

1. Apri la landing page
2. **Javascripts** (menu laterale)
3. Click **"Add New Javascript"**
4. Seleziona **"Before Body End Tag"**
5. Incolla lo script
6. **Placement → All Pages** (o seleziona specifica)
7. **Done → Publish**

---

### 📱 **Leadpages**

1. Apri la landing page nel builder
2. **Settings** (icona ingranaggio)
3. **Tracking & Analytics**
4. Incolla nel campo **"After BODY tag"**
5. **Save & Publish**

---

### 🌊 **Webflow**

1. Apri il progetto
2. **Project Settings** (icona ingranaggio)
3. **Custom Code** tab
4. Incolla nel campo **"Footer Code"**
5. **Save Changes**
6. **Publish Site**

Nota: Per page-specific, usa **Page Settings → Custom Code**

---

### 🛒 **Shopify**

1. Dashboard Shopify → **Online Store → Themes**
2. Clicca **"..."** sul tema attivo → **Edit Code**
3. Apri `theme.liquid` (in Layout)
4. Trova il tag `</body>`
5. Incolla lo script **prima** di `</body>`
6. **Save**

Per tracking specifico su Thank You page:
1. **Settings → Checkout → Order status page**
2. Incolla nel campo **"Additional scripts"**

---

### 🎨 **Wix**

1. Dashboard Wix → **Settings**
2. **Custom Code** (menu laterale)
3. Click **"+ Add Custom Code"**
4. Incolla lo script
5. Scegli **"Body - end"**
6. **Apply**
7. **Publish** il sito

---

## 🔍 TEST - Verifica che Funzioni

### 1. Apri la Console Browser
- Chrome/Edge: `F12` → Console tab
- Firefox: `F12` → Console
- Safari: `Cmd+Opt+C`

### 2. Visita la Pagina
Dovresti vedere:
```
[CRO Tracking] Initialized - Session: sess_1234567890_abc123
```

### 3. Interagisci
- Clicca qualcosa
- Scrolla
- Aspetta 5 secondi

Dovresti vedere:
```
[CRO Tracking] Sent 3 events
```

### 4. Verifica in Supabase
- Table Editor → `tracking_events`
- Dovresti vedere gli eventi

---

## ⚠️ Troubleshooting per Piattaforma

### GoHighLevel - "Script non si carica"
**Causa:** Cache aggressiva
**Fix:**
1. Settings → Performance → Clear Cache
2. Apri in **Incognito Mode**
3. Verifica che "Footer Code" sia abilitato

### Elementor - "Script non funziona"
**Causa:** Widget HTML disabilitato
**Fix:**
1. Elementor → Settings → Features
2. Abilita **"Enable HTML Widget"**
3. Save Changes

### ClickFunnels - "Tracking Code non appare"
**Causa:** Draft mode
**Fix:**
1. Assicurati di fare **"Update Page"** dopo Save
2. Testa sulla **Live URL**, non preview

### Wix - "Custom Code non disponibile"
**Causa:** Piano Free
**Fix:**
- Serve almeno piano **Connect Domain** per Custom Code
- Alternativa: usa Wix **Tracking & Analytics** app

### Shopify - "Liquido errore"
**Causa:** Sintassi errata
**Fix:**
- NON modificare il codice Liquid esistente
- Incolla SOLO lo script JavaScript
- Verifica parentesi graffe `{{ }}` non siano nel tuo script

---

## 🚨 Problemi Comuni - TUTTE le Piattaforme

### Errore CORS
**Sintomo:** `Access-Control-Allow-Origin error` in console
**Fix:** Già risolto! Il nostro endpoint `/api/track` ha CORS abilitato.

### Script si carica 2 volte
**Sintomo:** Eventi duplicati
**Fix:**
1. Controlla di non averlo incollato in 2 posti
2. Verifica Header Code + Footer Code (scegli solo uno)

### "Session ID undefined"
**Sintomo:** Eventi senza session_id
**Fix:**
- Verifica che `sessionStorage` sia abilitato nel browser
- Alcune piattaforme bloccano storage in preview - testa su LIVE

### Eventi non arrivano a Supabase
**Sintomo:** Console dice "Sent" ma nulla in DB
**Fix:**
1. Verifica che tabelle tracking esistano (run migration SQL)
2. Controlla Supabase logs: Dashboard → Logs
3. Verifica `NEXT_PUBLIC_APP_URL` in environment variables

---

## 💡 Best Practices

### 1. **Posizionamento**
- ✅ Prima di `</body>` (migliore performance)
- ⚠️ In `<head>` (funziona ma più lento)
- ❌ NON inline in elementi HTML

### 2. **One Script Per Page**
- Ogni step del funnel = uno script diverso
- NON copiare lo stesso script su tutte le pagine
- Usa il nome step corretto per ogni pagina

### 3. **Testing**
- Testa sempre in **Incognito/Private Mode**
- Cache può nascondere cambiamenti
- Usa console browser per debug

### 4. **Performance**
- Lo script è **async** e non-blocking
- Batch processing (5s o 20 eventi)
- Minimo impatto su page load

---

## 📞 Supporto Specifico

Problemi con una piattaforma specifica?

1. Apri Console Browser (F12)
2. Copia TUTTI gli errori
3. Invia a supporto con:
   - Nome piattaforma
   - Screenshot console
   - URL pagina test

---

**🎉 Done!** Il tracking funziona su QUALSIASI piattaforma che accetta JavaScript custom.
