# A/B Testing System Setup

## Overview

Sistema di analisi A/B automatica per i funnels con le seguenti caratteristiche:

- ✅ **Analisi iniziale** al caricamento del funnel
- ✅ **Analisi ricorrente ogni 7 giorni** (solo se ci sono state proposte)
- ✅ **Badge visivi** nella lista funnels per test pending/attivi
- 🔄 **Sistema automatico** con cron job o Supabase Edge Function

## Database Setup

### 1. Esegui la migration SQL su Supabase

```bash
# File: supabase/migrations/create_ab_testing_tables.sql
```

Vai su Supabase Dashboard:
- https://supabase.com/dashboard/project/dohrkonencbwvvmklzuo/editor
- Apri SQL Editor
- Copia e incolla il contenuto del file `create_ab_testing_tables.sql`
- Clicca "Run"

Questo crea:
- **Tabella `funnel_ab_analyses`**: traccia le analisi fatte
- **Tabella `funnel_ab_proposals`**: proposte di test A/B

## Come Funziona

### Workflow Automatico

1. **Creazione Funnel**
   - Viene creato il funnel nel database
   - Trigger automatico crea la prima analisi (status: pending)
   - API AI genera proposte A/B basate su best practices

2. **Prima Analisi (Immediata)**
   - Analizza struttura del funnel, copy, CTA
   - Genera 3-5 proposte di test A/B
   - Salva in `funnel_ab_proposals` con status "pending"
   - Imposta `next_analysis_date` a +7 giorni

3. **Analisi Ricorrenti (Ogni 7 giorni)**
   - Cron job controlla funnels con `next_analysis_date` <= oggi
   - Analizza dati tracking_events (performance reale)
   - Se trova opportunità → genera nuove proposte → riparte countdown 7 giorni
   - Se NON trova opportunità → NON riparte countdown

4. **Visualizzazione**
   - Badge arancione: "X Tests to Review" (proposte pending)
   - Badge verde: "X Active Tests" (test in corso)

## Implementazione Scheduler

### Opzione 1: Supabase Edge Function + pg_cron (Consigliato)

Crea Edge Function che esegue analisi:

```typescript
// supabase/functions/analyze-funnels/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // 1. Trova funnels con next_analysis_date <= NOW()
  const { data: funnels } = await supabase
    .from('funnel_ab_analyses')
    .select('funnel_id, funnel:funnels(*)')
    .lte('next_analysis_date', new Date().toISOString())
    .eq('status', 'completed')

  for (const analysis of funnels) {
    // 2. Analizza tracking data
    const insights = await analyzeTrackingData(analysis.funnel_id)

    // 3. Genera proposte se necessario
    if (insights.hasOpportunities) {
      const proposals = await generateABProposals(analysis.funnel, insights)

      // 4. Salva proposte
      await supabase.from('funnel_ab_proposals').insert(proposals)

      // 5. Aggiorna next_analysis_date (+7 giorni)
      await supabase
        .from('funnel_ab_analyses')
        .insert({
          funnel_id: analysis.funnel_id,
          next_analysis_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          has_proposals: true
        })
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

Configura pg_cron in Supabase:

```sql
-- Esegui ogni giorno alle 2:00 AM
SELECT cron.schedule(
  'analyze-funnels-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://dohrkonencbwvvmklzuo.supabase.co/functions/v1/analyze-funnels',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

### Opzione 2: Vercel Cron Jobs

In `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/analyze-funnels",
    "schedule": "0 2 * * *"
  }]
}
```

Crea API route:

```typescript
// src/app/api/analyze-funnels/route.ts
export async function GET() {
  // Stessa logica dell'Edge Function
}
```

## Funzionalità Implementate

✅ **Database Tables**: `funnel_ab_analyses`, `funnel_ab_proposals`
✅ **Funzione Load Data**: `enrichFunnelsWithABTestData()`
✅ **UI Badges**: Pending/Active tests su funnel cards
✅ **Type System**: `ConversionFunnel.abTests`

## Prossimi Passi

1. **Esegui migration SQL** su Supabase
2. **Implementa analisi AI**: logica per generare proposte A/B
3. **Setup scheduler**: scegli Opzione 1 o 2
4. **Test manuale**: inserisci dati di test in `funnel_ab_proposals`

## Test Manuale

Per testare subito la visualizzazione:

```sql
-- Inserisci analisi di test
INSERT INTO funnel_ab_analyses (funnel_id, next_analysis_date, has_proposals)
VALUES ('YOUR_FUNNEL_ID', NOW() + INTERVAL '7 days', true);

-- Inserisci proposte di test
INSERT INTO funnel_ab_proposals (funnel_id, category, element, current_value, proposed_value, expected_impact, reasoning, status)
VALUES
  ('YOUR_FUNNEL_ID', 'headline', 'Hero Title', 'Old Title', 'New Title', '+15% engagement', 'Test A/B per migliorare chiarezza', 'pending'),
  ('YOUR_FUNNEL_ID', 'cta', 'Primary Button', 'Buy Now', 'Get Started Free', '+20% clicks', 'CTA meno aggressivo converte meglio', 'pending');
```

Ricarica la pagina funnels e dovresti vedere i badge arancioni!
