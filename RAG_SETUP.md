# Guida all’uso del RAG System nel SaaS

Documentazione per integrare il RAG deployato su **https://rag-system-cro-production.up.railway.app** nel CRO Agent SaaS.

## Base URL

```
https://rag-system-cro-production.up.railway.app
```

L’API supporta CORS (`allow_origins=["*"]`), quindi è utilizzabile da qualsiasi frontend web.

---

## Endpoints disponibili

| Metodo   | Endpoint              | Descrizione                    |
|----------|------------------------|---------------------------------|
| GET      | `/health`              | Health check e conteggio documenti |
| POST     | `/query`               | Domanda RAG → risposta con fonti   |
| POST     | `/ingest`              | Inserimento documento (testo)      |
| POST     | `/ingest/file`         | Upload file .txt o .md             |
| GET      | `/documents`           | Lista documenti nel knowledge base |
| DELETE   | `/documents/{doc_id}`  | Elimina un documento               |
| GET      | `/docs`                 | Swagger UI (documentazione interattiva) |

---

## Query RAG (uso principale)

**URL:** `POST https://rag-system-cro-production.up.railway.app/query`

### Request

```json
{
  "question": "La domanda dell'utente",
  "top_k": 5,
  "system_prompt": "Sei un assistente esperto..."
}
```

- **question**: obbligatorio
- **top_k**: opzionale, numero di chunk usati (default **5**)
- **system_prompt**: opzionale, personalizza il comportamento del modello

### Response (200)

```json
{
  "answer": "La risposta generata da Claude...",
  "sources": [
    {
      "chunk_index": 1,
      "source": "nome-sorgente",
      "relevance_score": 0.892,
      "doc_id": "a1b2c3d4e5f6",
      "preview": "Anteprima del chunk..."
    }
  ],
  "chunks_used": 5
}
```

### Errori (400 / 404 / 500)

```json
{
  "detail": "Messaggio di errore"
}
```

---

## Integrazione nel progetto

### Variabile d’ambiente (opzionale)

Di default l’app usa l’URL Railway sopra. Per sovrascrivere:

```env
RAG_API_URL=https://rag-system-cro-production.up.railway.app
```

Per disabilitare il RAG (solo fallback Claude), imposta `RAG_API_URL=` (vuoto).

### Client (backend Next.js)

Il client condiviso è in **`src/lib/rag-client.ts`**:

- `queryRAG({ question, top_k?, system_prompt? })` → `Promise<RAGResponse | null>`
- Timeout **60 secondi** (le query possono richiedere 5–30s)
- Risposta mappata su `{ answer, sources, chunks_used }`

### API esposte dall’SaaS

| Route              | Uso                          |
|--------------------|------------------------------|
| `POST /api/rag-cro` | Chiamata diretta al RAG       |
| `POST /api/cro-insights` | Insights CRO (pannelli UI) |
| `POST /api/chat`   | Chat: prima RAG, poi fallback Claude |
| `cro-analysis`     | Domande custom: RAG poi Claude |
| `analyze-landing`  | Best practices RAG + Claude per analisi HTML |

---

## Esempi di chiamata

### JavaScript / fetch (con gestione errori)

```javascript
async function queryRAG(question, systemPrompt = null) {
  const res = await fetch('https://rag-system-cro-production.up.railway.app/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, system_prompt: systemPrompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Errore ${res.status}`);
  return { answer: data.answer, sources: data.sources };
}

// Uso
const { answer, sources } = await queryRAG('Cosa dice Alan sulla copy logic?');
```

### cURL

```bash
curl -X POST https://rag-system-cro-production.up.railway.app/query \
  -H "Content-Type: application/json" \
  -d '{"question":"Cosa dice Alan sulla copy?"}'
```

---

## Inserimento documenti (admin / setup)

### Testo

```javascript
await fetch('https://rag-system-cro-production.up.railway.app/ingest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Contenuto del documento...",
    source: "manuale-prodotto",
    metadata: { category: "docs" }
  }),
});
```

### Upload file

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('source', 'upload');
await fetch('https://rag-system-cro-production.up.railway.app/ingest/file', {
  method: 'POST',
  body: formData,
});
```

---

## Health check (monitoring)

```javascript
const res = await fetch('https://rag-system-cro-production.up.railway.app/health');
const { status, documents_in_collection, model } = await res.json();
// status: "ok", documents_in_collection: N
```

---

## Cose da considerare

- **Nessuna autenticazione**: l’API è pubblica. Per proteggerla puoi usare un gateway/backend che chiama il RAG.
- **Nessun rate limit esplicito**: valuta di limitare le richieste dal tuo backend.
- **Timeout**: le query possono richiedere 5–30 secondi; nel client è impostato 60s e si consiglia feedback UX (loading).
- **Costi Anthropic**: ogni query usa Claude; monitora l’uso se il traffico cresce.
- **Knowledge base condivisa**: tutti gli utenti vedono gli stessi documenti; per dati per-utente servirebbe un’istanza separata o multi-tenancy.

---

## Documentazione interattiva

Swagger UI:

**https://rag-system-cro-production.up.railway.app/docs**
