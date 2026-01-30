# Setup RAG CRO

Guida per integrare il sistema RAG (Retrieval-Augmented Generation) nel CRO Agent.

## Requisiti

1. **RunPod** – Endpoint con worker RAG deployato
2. **Knowledge base** – Documenti CRO indicizzati nel RAG (PDF, markdown, ecc.)

## Variabili d'ambiente

Aggiungi al `.env` o alle variabili Vercel:

```
RUNPOD_ENDPOINT_ID=il_tuo_endpoint_id
RUNPOD_API_KEY=la_tua_api_key
```

## API disponibili

### POST /api/rag-cro
Chiamata diretta al RAG.

```json
{
  "question": "Come ridurre il drop-off nel checkout?",
  "user_id": "default",
  "top_k": 10,
  "similarity_threshold": 0.1,
  "use_context": true
}
```

### POST /api/cro-insights
Stesso endpoint, alias per insights CRO.

### POST /api/chat
Il chat assistant prova prima il RAG, poi Claude come fallback.

## Integrazioni

- **Chat assistant** – RAG come sorgente principale, Claude come fallback
- **cro-analysis** – Domande custom: RAG prima, poi Claude
- **analyze-landing** – RAG per best practices, Claude per analisi HTML
- **RAGInsightsPanel** – Pannello UI su Dashboard, Funnel, Heatmaps, Analytics

## Flusso

1. **RAG configurato** → Risposta dal knowledge base CRO
2. **RAG non configurato o errore** → Fallback su Claude (se ANTHROPIC_API_KEY presente)
