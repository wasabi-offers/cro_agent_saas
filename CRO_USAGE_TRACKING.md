# CRO Product Usage Tracking

Sistema che traccia l’utilizzo del prodotto CRO: quali analisi vengono fatte, quali landing vengono salvate, utilizzo chat, funnels, ecc.

## Tabella Supabase: `cro_usage_events`

| Colonna      | Tipo        | Descrizione                          |
|-------------|-------------|--------------------------------------|
| id          | uuid        | Chiave primaria                      |
| event_type  | text        | Tipo evento (vedi sotto)             |
| payload     | jsonb       | Dati contestuali (filtri, source…)   |
| user_id     | text        | Opzionale, utente                    |
| session_id  | text        | Opzionale, sessione                  |
| created_at  | timestamptz | Data/ora evento                      |

## Tipi evento (`event_type`)

| Tipo                 | Dove viene tracciato        | Payload tipico                                      |
|----------------------|-----------------------------|-----------------------------------------------------|
| `landing_analyzed`   | API analyze-landing         | has_url, has_screenshot, filters, source, categories_count |
| `landing_saved`      | Pagina Landing Analysis (Save) | name, category_id, has_cro_table                   |
| `chat_message`       | API chat                    | source (rag-cro \| claude)                          |
| `cro_analysis`       | API cro-analysis            | analysis_type, source                               |
| `cro_table_generated`| API generate-cro-table      | type (landing \| funnel), rows_count                |
| `ab_tests_generated` | API generate-ab-tests       | tests_count                                         |
| `rag_query`          | (opzionale, da integrare)   | -                                                   |
| `page_view`          | Client (opzionale)          | path, title                                         |
| `funnel_created`     | (opzionale)                 | -                                                   |
| `funnel_updated`     | (opzionale)                 | -                                                   |
| `heatmap_viewed`     | (opzionale)                 | -                                                   |
| `explore_ai_query`   | (opzionale)                 | -                                                   |

## Setup

1. **Migration**  
   Esegui su Supabase la migration:
   ```bash
   # Da Supabase SQL Editor o CLI
   migrations/add_cro_usage_tracking.sql
   ```

2. **Variabili**  
   Il tracking usa le stesse variabili Supabase dell’app:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Invio eventi

- **Server (API routes):**  
  `import { trackCroUsage } from "@/lib/cro-usage";`  
  `trackCroUsage("landing_analyzed", { ... });`  
  Non lancia eccezioni (fire-and-forget).

- **Client (es. dopo Save):**  
  `POST /api/usage` con body:
  ```json
  {
    "event_type": "landing_saved",
    "payload": { "name": "...", "category_id": "...", "has_cro_table": true },
    "session_id": "opzionale"
  }
  ```

## Query utili (Supabase SQL)

- **Conteggio per tipo evento (ultimi 30 giorni):**
  ```sql
  SELECT event_type, COUNT(*) AS count
  FROM cro_usage_events
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY event_type
  ORDER BY count DESC;
  ```

- **Ultime analisi landing:**
  ```sql
  SELECT created_at, payload->>'source' AS source, payload->>'filters' AS filters
  FROM cro_usage_events
  WHERE event_type = 'landing_analyzed'
  ORDER BY created_at DESC
  LIMIT 50;
  ```

- **Landing salvate:**
  ```sql
  SELECT created_at, payload->>'name' AS name, payload->>'category_id' AS category
  FROM cro_usage_events
  WHERE event_type = 'landing_saved'
  ORDER BY created_at DESC;
  ```

## Estendere il tracking

- **Nuovo tipo evento:**  
  Aggiungilo in `src/lib/cro-usage.ts` in `CroUsageEventType` e nella allowlist in `src/app/api/usage/route.ts`, poi chiama `trackCroUsage(...)` o `POST /api/usage` con quel `event_type`.
- **Page view / funnel / heatmap:**  
  Da client, alla navigazione o all’azione rilevante:  
  `fetch("/api/usage", { method: "POST", body: JSON.stringify({ event_type: "page_view", payload: { path: pathname } }) });`
