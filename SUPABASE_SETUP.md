# 🚀 Guida Configurazione Supabase per CRO Agent SaaS

Questa guida ti spiega come configurare Supabase per salvare tutti i dati del tuo CRO Agent SaaS (funnel, landing pages, A/B tests, ecc.) in modo permanente.

## 📋 Prerequisiti

- Account Supabase (gratuito su [supabase.com](https://supabase.com))
- Node.js e npm installati
- Progetto CRO Agent SaaS funzionante

## 🔧 Passo 1: Creare un Progetto Supabase

1. **Vai su [supabase.com](https://supabase.com)** e fai login
2. **Clicca su "New Project"**
3. **Compila i campi:**
   - **Name**: `cro-agent-saas` (o il nome che preferisci)
   - **Database Password**: Scegli una password sicura (salvala!)
   - **Region**: Scegli la regione più vicina a te (es. `Europe West`)
   - **Pricing Plan**: `Free` (va benissimo per iniziare)
4. **Clicca su "Create new project"**
5. ⏳ **Aspetta 1-2 minuti** che il progetto venga creato

## 🔑 Passo 2: Ottenere le Credenziali API

1. Una volta creato il progetto, vai su **Settings** (icona ingranaggio) nella sidebar
2. Vai su **API**
3. Troverai due valori importanti:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Una lunga stringa che inizia con `eyJh...`
4. **Copia questi valori** (li userai nel prossimo step)

## 📝 Passo 3: Configurare le Variabili d'Ambiente

1. **Apri il file `.env.local`** nella root del progetto
2. **Aggiungi queste righe** (sostituisci con i tuoi valori):

```bash
# Existing variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-api03-...

# NEW: Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```

3. **Salva il file**
4. ⚠️ **IMPORTANTE**: NON committare mai `.env.local` su Git! È già nel `.gitignore`.

## 🗄️ Passo 4: Creare le Tabelle del Database

1. **Vai su Supabase** → Il tuo progetto
2. **Clicca su "SQL Editor"** nella sidebar (icona `</>`)
3. **Clicca su "New query"**
4. **Copia TUTTO il contenuto** del file `supabase-schema.sql` dalla root del progetto
5. **Incolla nel SQL Editor**
6. **Clicca su "Run"** (o premi `Ctrl + Enter`)
7. ✅ Dovresti vedere il messaggio **"Success. No rows returned"**

### Cosa crea questo script?

Lo script crea 6 tabelle:
- `funnels` - I tuoi conversion funnel
- `funnel_steps` - Gli step di ogni funnel (con URL, visitors, dropoff)
- `funnel_connections` - Le connessioni tra step (per funnel non-lineari)
- `landing_pages_analyzed` - Le landing page analizzate
- `ab_test_suggestions` - I suggerimenti di A/B test
- `cro_analyses` - Le analisi CRO complete

## 🔄 Passo 5: Riavviare l'Applicazione

1. **Ferma il server** Next.js (premi `Ctrl + C` nel terminale)
2. **Riavvia il server**:
   ```bash
   npm run dev
   ```
3. ✅ L'app ora è connessa a Supabase!

## ✅ Passo 6: Verificare che Funzioni

### Test 1: Creare un Funnel

1. **Vai su** `http://localhost:3000/funnels`
2. **Clicca su "Create Funnel"**
3. **Crea un funnel**:
   - Aggiungi nome: "Test Funnel"
   - Aggiungi almeno 2 step
   - Collega gli step
   - Inserisci URL in ogni step
4. **Clicca "Crea Funnel"**
5. ✅ Dovresti vedere **"✅ Funnel creato con successo!"**

### Test 2: Verificare nel Database

1. **Vai su Supabase** → Il tuo progetto
2. **Clicca su "Table Editor"** nella sidebar
3. **Seleziona la tabella `funnels`**
4. ✅ Dovresti vedere il tuo funnel appena creato!

### Test 3: Ricaricare la Pagina

1. **Ricarica** la pagina `http://localhost:3000/funnels` (F5)
2. ✅ Il funnel è ancora lì! (non è più mock data)

## 🎨 (Opzionale) Inserire Dati di Esempio

Se vuoi dati di esempio già pronti:

1. **Vai su SQL Editor** in Supabase
2. **Incolla questo SQL**:

```sql
-- Inserisci funnel di esempio
INSERT INTO funnels (id, name, conversion_rate) VALUES
  ('funnel_example_1', 'E-commerce Checkout', 24.5),
  ('funnel_example_2', 'SaaS Free Trial', 18.3);

-- Inserisci step del primo funnel
INSERT INTO funnel_steps (id, funnel_id, name, url, visitors, dropoff, step_order) VALUES
  ('step_1_1', 'funnel_example_1', 'Landing Page', 'https://example.com', 10000, 0, 1),
  ('step_1_2', 'funnel_example_1', 'Product Page', 'https://example.com/product', 7500, 25, 2),
  ('step_1_3', 'funnel_example_1', 'Cart', 'https://example.com/cart', 5000, 33.3, 3),
  ('step_1_4', 'funnel_example_1', 'Checkout', 'https://example.com/checkout', 3000, 40, 4),
  ('step_1_5', 'funnel_example_1', 'Thank You', 'https://example.com/thanks', 2450, 18.3, 5);

-- Inserisci step del secondo funnel
INSERT INTO funnel_steps (id, funnel_id, name, url, visitors, dropoff, step_order) VALUES
  ('step_2_1', 'funnel_example_2', 'Homepage', 'https://saas.example.com', 8000, 0, 1),
  ('step_2_2', 'funnel_example_2', 'Pricing', 'https://saas.example.com/pricing', 5600, 30, 2),
  ('step_2_3', 'funnel_example_2', 'Sign Up', 'https://saas.example.com/signup', 3360, 40, 3),
  ('step_2_4', 'funnel_example_2', 'Onboarding', 'https://saas.example.com/onboarding', 2016, 40, 4),
  ('step_2_5', 'funnel_example_2', 'Trial Started', 'https://saas.example.com/trial', 1464, 27.4, 5);
```

3. **Clicca "Run"**
4. ✅ Ricarica `/funnels` e vedrai i 2 funnel di esempio!

## 🔒 Sicurezza: Row Level Security (RLS)

⚠️ **IMPORTANTE**: Attualmente le tabelle sono pubbliche. Per produzione, dovresti abilitare RLS:

### Setup RLS per Autenticazione

Se vuoi che ogni utente veda solo i suoi funnel:

```sql
-- 1. Abilita RLS su tutte le tabelle
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages_analyzed ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cro_analyses ENABLE ROW LEVEL SECURITY;

-- 2. Crea policy per accesso pubblico (per ora)
-- NOTA: Sostituisci con policy basate su auth.uid() quando aggiungi autenticazione

CREATE POLICY "Allow all for funnels" ON funnels FOR ALL USING (true);
CREATE POLICY "Allow all for funnel_steps" ON funnel_steps FOR ALL USING (true);
CREATE POLICY "Allow all for funnel_connections" ON funnel_connections FOR ALL USING (true);
CREATE POLICY "Allow all for landing_pages_analyzed" ON landing_pages_analyzed FOR ALL USING (true);
CREATE POLICY "Allow all for ab_test_suggestions" ON ab_test_suggestions FOR ALL USING (true);
CREATE POLICY "Allow all for cro_analyses" ON cro_analyses FOR ALL USING (true);
```

### Setup RLS con Auth (quando aggiungi login)

Quando implementi l'autenticazione:

```sql
-- Policy per vedere solo i propri funnel
CREATE POLICY "Users can view own funnels"
  ON funnels FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own funnels"
  ON funnels FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own funnels"
  ON funnels FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Ripeti per ogni tabella...
```

## 🐛 Troubleshooting

### Problema: "Supabase not configured"

**Soluzione**:
- Verifica che `.env.local` contenga le variabili corrette
- Riavvia il server Next.js dopo aver modificato `.env.local`
- Controlla che i valori non contengano spazi extra

### Problema: "Error fetching funnels"

**Soluzione**:
- Vai su Supabase → SQL Editor
- Esegui: `SELECT * FROM funnels;`
- Se da errore, verifica di aver eseguito `supabase-schema.sql`

### Problema: "Cannot create funnel"

**Soluzione**:
- Verifica le credenziali Supabase
- Controlla la Console del Browser (F12) per errori
- Verifica che la `anon` key abbia i permessi corretti

### Problema: Mock Data al posto di Dati Reali

**Causa**: Supabase non è configurato o le tabelle sono vuote.

**Soluzione**:
1. Verifica `.env.local`
2. Riavvia il server
3. Controlla la console: dovresti vedere "Fetching from Supabase" invece di "Using mock data"

## 📊 Monitoraggio

### Visualizzare i Log

Supabase → Logs → API Logs

Qui puoi vedere tutte le query eseguite dall'app.

### Visualizzare le Metriche

Supabase → Reports

Puoi vedere:
- Numero di richieste API
- Spazio disco usato
- Numero di righe nelle tabelle

## 🚀 Prossimi Passi

1. **Aggiungi autenticazione** con Supabase Auth
2. **Implementa backup automatici** (Supabase fa backup automatici sul piano Pro)
3. **Aggiungi validazione** lato server con Supabase Functions
4. **Ottimizza query** con indici custom se necessario

## 📚 Risorse Utili

- [Documentazione Supabase](https://supabase.com/docs)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 💬 Supporto

Se hai problemi:
1. Controlla la documentazione Supabase
2. Verifica la console del browser (F12)
3. Controlla i log su Supabase Dashboard

---

✅ **Setup completato!** Ora i tuoi funnel sono salvati permanentemente su Supabase! 🎉
