# ⚠️ SETUP OBBLIGATORIO - Sistema di Tracking

## 🚨 PRIMA DI USARE IL SISTEMA - LEGGI QUESTO

Se vedi l'errore:
```
Error: Failed to run sql query: ERROR: 42703: column "first_seen_at" does not exist
```

Significa che **NON hai ancora eseguito la migration del database**.

---

## ✅ STEP 1: Esegui la Migration SQL (OBBLIGATORIO)

### Cosa Fare:

1. **Apri il tuo progetto Supabase**
   - Vai su https://supabase.com
   - Apri il tuo progetto CRO Agent

2. **Vai su SQL Editor**
   - Nel menu laterale sinistro, clicca "SQL Editor"

3. **Apri il file `MIGRATION_ADD_TRACKING.sql`**
   - È nella root del progetto
   - Contiene ~400 righe di SQL

4. **Copia TUTTO il contenuto**
   - Seleziona tutto (Ctrl+A / Cmd+A)
   - Copia (Ctrl+C / Cmd+C)

5. **Incolla in Supabase SQL Editor**
   - Incolla tutto il codice SQL
   - Clicca il pulsante **"Run"** in alto a destra

6. **Aspetta che finisca**
   - Vedrai "Success. No rows returned" (è normale)
   - O "Table created successfully"

### Verifica che sia Andato Bene:

**Table Editor** (menu laterale) → Dovresti vedere queste nuove tabelle:
- ✅ `tracking_sessions`
- ✅ `tracking_events`
- ✅ `heatmap_data`
- ✅ `conversion_events`
- ✅ `funnel_progressions`

**Se vedi queste tabelle = MIGRATION COMPLETATA CON SUCCESSO! 🎉**

---

## ✅ STEP 2: Usa il Sistema

Solo DOPO aver completato Step 1, puoi:

1. **Generare gli script di tracking**
   - Dashboard → Funnel → Tab "Tracking"
   - Vedrai gli script per ogni step

2. **Installare gli script sui tuoi siti**
   - Copia e incolla nella pagina HTML

3. **Raccogliere dati reali**
   - Gli utenti visitano le tue pagine
   - I dati vengono salvati in Supabase

4. **Calcolare le statistiche**
   - Clicca "Calcola Statistiche" nel tab Tracking

---

## 🔧 Troubleshooting

### ❌ "column first_seen_at does not exist"
**Causa:** Migration non eseguita
**Fix:** Esegui `MIGRATION_ADD_TRACKING.sql` in Supabase SQL Editor

### ❌ "relation tracking_sessions does not exist"
**Causa:** Migration non eseguita
**Fix:** Esegui `MIGRATION_ADD_TRACKING.sql` in Supabase SQL Editor

### ❌ "permission denied for table tracking_sessions"
**Causa:** RLS (Row Level Security) abilitato senza policy
**Fix:** Disabilita RLS o aggiungi policy:
```sql
ALTER TABLE tracking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_data DISABLE ROW LEVEL SECURITY;
```

### ✅ Migration eseguita ma errore persiste?
1. Ricarica la pagina (Ctrl+R / Cmd+R)
2. Controlla che il file `.env.local` abbia le credenziali corrette
3. Verifica che `SUPABASE_SERVICE_ROLE_KEY` sia impostato
4. Riavvia il server Next.js (`npm run dev`)

---

## 📚 Documentazione Completa

Dopo aver completato la migration, leggi la guida completa:
- **`TRACKING_SETUP.md`** - Guida completa al sistema di tracking

---

## 🚀 Quick Start (dopo migration)

```bash
# 1. Esegui migration in Supabase ✅ (fatto sopra)

# 2. Avvia il server
npm run dev

# 3. Vai su un funnel
# http://localhost:3000/funnels/[funnel-id]

# 4. Tab "Tracking" → Copia gli script

# 5. Incolla gli script nelle tue pagine

# 6. Testa: visita le pagine, clicca, scrolla

# 7. Torna sul funnel → "Calcola Statistiche"

# 8. 🎉 Vedi i dati reali!
```

---

## ⚡ Comandi Utili

### Verifica Tabelle in Supabase
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'tracking%';
```

Dovresti vedere:
- tracking_events
- tracking_sessions
- heatmap_data (chiamato tracking_heatmap_data in alcune versioni)

### Conta Eventi Tracciati
```sql
SELECT COUNT(*) as total_events FROM tracking_events;
SELECT COUNT(*) as total_sessions FROM tracking_sessions;
```

### Vedi Ultimi Eventi
```sql
SELECT
  event_type,
  session_id,
  path,
  created_at
FROM tracking_events
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📞 Hai Ancora Problemi?

1. Verifica che la migration sia REALMENTE eseguita (controlla Table Editor)
2. Controlla i log del server Next.js (terminale dove hai fatto `npm run dev`)
3. Apri Console Browser (F12) e cerca errori
4. Verifica environment variables in `.env.local`

---

**🎯 Remember: MIGRATION PRIMA DI TUTTO! Senza migration = errori!**
