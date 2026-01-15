# 🚀 Deploy Production: GitHub → Supabase → Vercel

Guida completa per mettere il CRO Agent SaaS online in produzione.

**Tempo totale**: ~20 minuti

---

## 📋 Prerequisiti

- [ ] Account GitHub (gratuito)
- [ ] Account Supabase (gratuito)
- [ ] Account Vercel (gratuito)
- [ ] Codice pronto sul branch `claude/review-repository-5h35l`

---

## 🎯 PARTE 1: GitHub (5 minuti)

### Step 1.1: Merge del Branch

```bash
# Assicurati di essere aggiornato
git fetch origin

# Vai sul branch principale
git checkout main
git pull origin main

# Merge del branch con tutte le modifiche
git merge claude/review-repository-5h35l

# Push su GitHub
git push origin main
```

✅ **Verifica**: Vai su GitHub e controlla che tutti i file siano presenti.

---

## 🗄️ PARTE 2: Supabase Production (7 minuti)

### Step 2.1: Crea Progetto Production

1. Vai su **https://supabase.com**
2. Login con GitHub
3. Clicca **"New Project"**
4. Compila:
   - **Name**: `cro-agent-production` (importante: progetto SEPARATO per production)
   - **Database Password**: Password sicura → **SALVALA!**
   - **Region**: Regione più vicina ai tuoi utenti (es. `Europe West`)
   - **Pricing Plan**: `Free` (o Pro se preferisci)
5. Clicca **"Create new project"**
6. ⏳ Aspetta 1-2 minuti

### Step 2.2: Esegui Schema Production

1. Nel progetto Supabase, vai su **SQL Editor**
2. Clicca **"New query"**
3. Apri il file **`supabase-production.sql`** dal repository
4. **Copia TUTTO** il contenuto
5. **Incolla** nell'editor SQL
6. Clicca **"Run"** (Ctrl+Enter)
7. ✅ Verifica: Vedi **"Success. No rows returned"**

### Step 2.3: Verifica Tabelle

1. Vai su **Table Editor**
2. Dovresti vedere 6 tabelle:
   - ✅ `funnels`
   - ✅ `funnel_steps`
   - ✅ `funnel_connections`
   - ✅ `landing_pages_analyzed`
   - ✅ `ab_test_suggestions`
   - ✅ `cro_analyses`

### Step 2.4: Copia Credenziali Production

1. Vai su **Settings** → **API**
2. Copia questi valori (TI SERVONO PER VERCEL):
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Salvali in un file temporaneo** (li userai tra poco)

---

## 🚀 PARTE 3: Deploy su Vercel (8 minuti)

### Step 3.1: Connetti Repository

1. Vai su **https://vercel.com**
2. Login con GitHub
3. Clicca **"Add New..."** → **"Project"**
4. Seleziona il repository **`cro_agent_saas`**
5. Clicca **"Import"**

### Step 3.2: Configura Progetto

**Framework Preset**: Next.js (rilevato automaticamente)

**Root Directory**: `.` (lascia default)

**Build Command**:
```bash
npm run build
```

**Output Directory**: `.next` (lascia default)

**Install Command**:
```bash
npm install
```

### Step 3.3: Aggiungi Variabili Ambiente

⚠️ **IMPORTANTE**: Aggiungi TUTTE queste variabili!

Clicca su **"Environment Variables"** e aggiungi:

#### 1. Supabase URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxx.supabase.co
```
(Usa il valore copiato da Supabase)

#### 2. Supabase Anon Key
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
(Usa il valore copiato da Supabase)

#### 3. Anthropic API Key
```
Name: ANTHROPIC_API_KEY
Value: sk-ant-api03-...
```
(Usa la tua API key di Anthropic)

#### 4. App URL
```
Name: NEXT_PUBLIC_APP_URL
Value: https://your-project.vercel.app
```
(Verrà aggiornato dopo il primo deploy)

### Step 3.4: Deploy

1. Clicca **"Deploy"**
2. ⏳ Aspetta 2-3 minuti
3. ✅ Deploy completato!

### Step 3.5: Aggiorna App URL

1. Copia l'URL del tuo sito (es. `https://cro-agent-saas.vercel.app`)
2. Vai su **Settings** → **Environment Variables**
3. Modifica `NEXT_PUBLIC_APP_URL` con l'URL corretto
4. Clicca **"Save"**
5. Vai su **Deployments** → Clicca **"Redeploy"** sull'ultimo deploy

---

## ✅ PARTE 4: Verifica che Funzioni

### Test 1: Homepage

1. Apri il tuo sito: `https://your-project.vercel.app`
2. ✅ Si carica senza errori?

### Test 2: Crea Funnel

1. Vai su `/funnels`
2. Clicca **"Create Funnel"**
3. Crea un funnel di test:
   - Nome: "Production Test"
   - 2-3 step
   - Collega gli step
4. Clicca **"Crea Funnel"**
5. ✅ Vedi: "✅ Funnel creato con successo!"?

### Test 3: Verifica Database

1. Vai su Supabase → Table Editor → `funnels`
2. ✅ Vedi il funnel appena creato?

### Test 4: Persistenza

1. Ricarica la pagina `/funnels`
2. ✅ Il funnel è ancora lì?

### Test 5: Landing Analysis

1. Vai su `/landing-analysis`
2. Inserisci URL: `https://www.apple.com`
3. Clicca **"Analyze"**
4. ✅ Ricevi analisi CRO?

---

## 🎨 PARTE 5: Configurazioni Opzionali

### Custom Domain (Opzionale)

1. Su Vercel, vai su **Settings** → **Domains**
2. Aggiungi il tuo dominio (es. `cro-agent.com`)
3. Configura DNS seguendo le istruzioni

### Abilita Analytics

1. Su Vercel, vai su **Analytics**
2. Clicca **"Enable"**
3. Analisi traffico gratuita!

### Configurazione Supabase Auth (Futuro)

Per aggiungere login utenti:

1. Supabase → Authentication → Providers
2. Abilita Email/Password o OAuth
3. Aggiorna policy RLS nel database

---

## 📊 Monitoraggio Production

### Vercel Dashboard

- **Deployments**: Storia deploy
- **Analytics**: Traffico e performance
- **Logs**: Log runtime e build
- **Speed Insights**: Core Web Vitals

### Supabase Dashboard

- **Table Editor**: Visualizza dati
- **SQL Editor**: Query manuali
- **Logs**: Log API e database
- **API**: Monitora chiamate

---

## 🚨 Troubleshooting

### Errore: "Supabase not configured"

**Causa**: Variabili ambiente mancanti o errate

**Soluzione**:
1. Vercel → Settings → Environment Variables
2. Controlla che `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` siano corrette
3. Redeploy

### Errore: "Error fetching funnels"

**Causa**: Schema database non eseguito

**Soluzione**:
1. Supabase → SQL Editor
2. Ri-esegui `supabase-production.sql`

### Errore: Build failed

**Causa**: Dipendenze o errori TypeScript

**Soluzione**:
1. Vercel → Deployment → View Build Logs
2. Leggi l'errore e correggi localmente
3. Push su GitHub
4. Vercel rebuild automatico

### Errore: "Invalid API key" (Anthropic)

**Causa**: API key mancante o errata

**Soluzione**:
1. Vercel → Settings → Environment Variables
2. Verifica `ANTHROPIC_API_KEY`
3. Ottieni nuova key su https://console.anthropic.com
4. Redeploy

---

## 🔒 Sicurezza Production

### ✅ Cose Implementate

- [x] HTTPS automatico (Vercel)
- [x] Row Level Security (RLS) abilitato su Supabase
- [x] Variabili ambiente sicure
- [x] API keys non esposte nel client

### ⚠️ Da Implementare (Futuro)

- [ ] Autenticazione utenti (Supabase Auth)
- [ ] Policy RLS user-specific
- [ ] Rate limiting API
- [ ] CORS configuration
- [ ] Backup automatici database

---

## 📈 Metriche Post-Deploy

### Performance Target

- **Time to First Byte (TTFB)**: < 600ms
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

Verifica su: https://pagespeed.web.dev/

### Uptime Target

- **Vercel**: 99.99% uptime garantito
- **Supabase**: 99.9% uptime (Free tier)

Monitor su: https://vercel.com/dashboard/analytics

---

## 💰 Costi Stimati

### Free Tier (Sviluppo)

- **Vercel Free**: 100GB bandwidth/mese
- **Supabase Free**: 500MB database, 2GB storage
- **Anthropic API**: Pay-as-you-go

**Totale**: €0-10/mese (dipende da usage API)

### Produzione Consigliata

- **Vercel Pro**: €20/mese (custom domain, più bandwidth)
- **Supabase Pro**: €25/mese (backup, più storage)
- **Anthropic API**: Variabile (€0.25 per 1M token input)

**Totale stimato**: €50-100/mese

---

## 🎯 Checklist Completa Deploy

### Pre-Deploy
- [ ] Codice mergato su `main`
- [ ] Test locali passati
- [ ] File `.env.local` NON committato

### GitHub
- [ ] Repository pubblico o privato configurato
- [ ] Branch `main` aggiornato
- [ ] Tutti i commit pushati

### Supabase
- [ ] Progetto production creato
- [ ] Schema `supabase-production.sql` eseguito
- [ ] 6 tabelle create e verificate
- [ ] Credenziali API copiate

### Vercel
- [ ] Progetto importato da GitHub
- [ ] Variabili ambiente configurate (4 variabili)
- [ ] Primo deploy completato con successo
- [ ] Custom domain configurato (opzionale)

### Test Production
- [ ] Homepage si carica
- [ ] Funnel creato con successo
- [ ] Dati salvati su Supabase
- [ ] Landing analysis funziona
- [ ] Persistenza verificata

### Post-Deploy
- [ ] Analytics abilitato
- [ ] Monitoring configurato
- [ ] Team notificato
- [ ] Documentazione aggiornata

---

## 🎉 Congratulazioni!

Il tuo CRO Agent SaaS è online! 🚀

**URL Production**: https://your-project.vercel.app

**Prossimi Step**:
1. Condividi con utenti beta
2. Monitora metriche e feedback
3. Itera e migliora
4. Scale quando necessario

---

## 📞 Supporto

### Documentazione
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **Next.js**: https://nextjs.org/docs

### Community
- **Vercel Discord**: https://vercel.com/discord
- **Supabase Discord**: https://supabase.com/discord

### Status Pages
- **Vercel Status**: https://www.vercel-status.com/
- **Supabase Status**: https://status.supabase.com/

---

✅ **Deploy Completato! La tua app è LIVE!** 🎉
