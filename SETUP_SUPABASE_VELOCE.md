# ⚡ Setup Supabase - Guida Veloce (10 minuti)

**Per il Programmatore**: Segui questi step nell'ordine esatto.

---

## ✅ STEP 1: Crea Account Supabase (2 minuti)

1. Vai su **https://supabase.com**
2. Clicca **"Start your project"**
3. Login con GitHub (o email)
4. ✅ Account creato!

---

## ✅ STEP 2: Crea Nuovo Progetto (2 minuti)

1. Nel dashboard Supabase, clicca **"New Project"**
2. Compila:
   - **Name**: `cro-agent-saas` (o quello che vuoi)
   - **Database Password**: Scegli password sicura e **SALVALA!**
   - **Region**: Scegli più vicino a te (es. `Europe West (Frankfurt)`)
   - **Pricing Plan**: Seleziona **Free** (gratis per sempre)
3. Clicca **"Create new project"**
4. ⏳ Aspetta 1-2 minuti che il progetto venga creato
5. ✅ Progetto pronto!

---

## ✅ STEP 3: Copia Credenziali API (1 minuto)

1. Nel tuo progetto Supabase, vai su **Settings** (icona ingranaggio in basso a sinistra)
2. Clicca su **API** nel menu laterale
3. Troverai:
   - **Project URL**: `https://xxxxxxxxxx.supabase.co`
   - **anon public key**: Una lunga stringa tipo `eyJhbGciOiJIUzI1NiIsInR5c...`
4. **COPIA ENTRAMBI** i valori (ti servono nel prossimo step)

---

## ✅ STEP 4: Aggiungi Credenziali al Progetto (1 minuto)

1. Apri il progetto nel tuo editor
2. Vai alla root del progetto
3. Apri (o crea) il file **`.env.local`**
4. Aggiungi queste righe (sostituisci con i tuoi valori):

```bash
# Existing
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-api03-...

# NEW - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. **Salva il file**
6. ⚠️ **IMPORTANTE**: NON committare `.env.local` su Git!

---

## ✅ STEP 5: Crea Tabelle Database (3 minuti)

1. Torna su Supabase Dashboard
2. Vai su **SQL Editor** (icona `</>` nella sidebar)
3. Clicca **"New query"**
4. Nel progetto, apri il file **`supabase-schema.sql`** (nella root)
5. **Copia TUTTO** il contenuto del file (Ctrl+A, Ctrl+C)
6. **Incolla** nell'editor SQL di Supabase
7. Clicca **"Run"** (o premi `Ctrl + Enter`)
8. ✅ Dovresti vedere: **"Success. No rows returned"**

### ✅ Verifica che le tabelle siano create:

1. Vai su **Table Editor** (icona tabella nella sidebar)
2. Dovresti vedere 6 tabelle:
   - ✅ `funnels`
   - ✅ `funnel_steps`
   - ✅ `funnel_connections`
   - ✅ `landing_pages_analyzed`
   - ✅ `ab_test_suggestions`
   - ✅ `cro_analyses`

---

## ✅ STEP 6: Riavvia l'App (1 minuto)

1. Apri terminale nella root del progetto
2. **Ferma** il server se è in esecuzione (Ctrl+C)
3. **Riavvia**:
   ```bash
   npm run dev
   ```
4. ✅ L'app è ora connessa a Supabase!

---

## 🧪 STEP 7: Testa che Funzioni

### Test 1: Crea un Funnel

1. Vai su **http://localhost:3000/funnels**
2. Clicca **"Create Funnel"**
3. Crea un funnel:
   - Nome: "Test Funnel"
   - Aggiungi 2-3 step
   - Collega gli step
   - Inserisci URL (opzionale)
4. Clicca **"Crea Funnel"**
5. ✅ Dovresti vedere: **"✅ Funnel creato con successo!"**

### Test 2: Verifica nel Database

1. Torna su Supabase
2. Vai su **Table Editor**
3. Seleziona tabella **`funnels`**
4. ✅ Dovresti vedere il tuo funnel!

### Test 3: Ricarica Pagina

1. Ricarica la pagina funnels (F5)
2. ✅ Il funnel è ancora lì! (salvato permanentemente)

---

## 🎉 FATTO! Setup Completato

L'app ora salva tutti i dati su Supabase!

---

## 🚨 Troubleshooting Rapido

### Problema: "Supabase not configured"
**Soluzione**:
```bash
# 1. Verifica .env.local contenga le variabili
cat .env.local

# 2. Riavvia server
npm run dev
```

### Problema: "Error fetching funnels"
**Soluzione**:
1. Vai su Supabase → SQL Editor
2. Esegui: `SELECT * FROM funnels;`
3. Se da errore, ri-esegui `supabase-schema.sql`

### Problema: Vedo ancora mock data
**Soluzione**: Significa che Supabase non è configurato. Ricontrolla STEP 4 (variabili ambiente).

---

## 📋 Checklist Rapida

Stampa e segna:

- [ ] Account Supabase creato
- [ ] Progetto creato (aspettato che sia pronto)
- [ ] Credenziali API copiate
- [ ] File `.env.local` aggiornato con credenziali
- [ ] File `supabase-schema.sql` eseguito nel SQL Editor
- [ ] Viste 6 tabelle nel Table Editor
- [ ] Server riavviato con `npm run dev`
- [ ] Testato creazione funnel
- [ ] Verificato funnel salvato nel database
- [ ] Testato che funnel persiste dopo reload

✅ **Tutto fatto? Sei pronto!**

---

## 🔄 Per Deploy Production (Vercel/Altri)

Quando fai deploy su production:

1. Crea un **nuovo progetto Supabase** per production (separato da development)
2. Esegui `supabase-schema.sql` sul progetto production
3. Aggiungi variabili ambiente su Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
   ```
4. Deploy! 🚀

---

## 📞 Hai Problemi?

1. **Documentazione completa**: Leggi `SUPABASE_SETUP.md`
2. **Supabase Docs**: https://supabase.com/docs
3. **Controlla console browser** (F12) per errori

---

## ⏱️ Recap Tempi

- ✅ STEP 1: 2 min (account)
- ✅ STEP 2: 2 min (progetto)
- ✅ STEP 3: 1 min (credenziali)
- ✅ STEP 4: 1 min (.env.local)
- ✅ STEP 5: 3 min (database)
- ✅ STEP 6: 1 min (riavvio)
- ✅ STEP 7: Test

**Totale: ~10 minuti** ⏱️

---

✅ **Setup completato! Ora tutti i funnel sono salvati permanentemente!** 🎉
