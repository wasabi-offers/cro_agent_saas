# 🔧 Fix Rapido - Linee Mancanti nel Funnel Visualizer

## Problema
Le linee di connessione tra gli step del funnel non si vedono.

## Possibili Cause

### 1. **Dati Non Caricati Correttamente**
Gli step vengono caricati ma mancano dati necessari.

**Fix**: Controlla nella console browser (F12) i log:
```javascript
🔍 FunnelVisualizer - Steps ricevuti: [...]
🔍 FunnelVisualizer - Edges creati: [...]
```

Se `Edges creati` è vuoto `[]`, significa che `steps` non ha abbastanza elementi.

### 2. **ReactFlow Non Renderizza Edges**
Le edges sono create ma ReactFlow non le mostra.

**Fix Manuale**: Aggiungi forza visualizzazione edges.

### 3. **CSS/Style Sovrascrive Linee**
Le linee ci sono ma non si vedono per problema CSS.

**Fix**: Ispeziona elemento e verifica se `path.react-flow__edge-path` ha stili corretti.

## 🚀 Fix Veloce da Testare

Nella console del browser, esegui:

```javascript
// Verifica se ci sono edges nella pagina
document.querySelectorAll('.react-flow__edge').length

// Dovrebbe ritornare il numero di connessioni (4 per un funnel con 5 step)
// Se ritorna 0, le edges non sono state create
// Se ritorna > 0, le edges ci sono ma non si vedono (problema CSS)
```

## 📊 Verifica Database

Su Supabase → SQL Editor, esegui:

```sql
-- Verifica steps del funnel "test"
SELECT * FROM funnel_steps WHERE funnel_id = (
  SELECT id FROM funnels WHERE name = 'test'
) ORDER BY step_order;

-- Verifica connessioni (potrebbero essere vuote)
SELECT * FROM funnel_connections WHERE funnel_id = (
  SELECT id FROM funnels WHERE name = 'test'
);
```

## 🛠️ Soluzione Definitiva

Se il problema persiste, probabilmente è che:
1. Gli step non sono ordinati correttamente
2. Mancano dati di visitors/dropoff
3. ReactFlow ha problemi di rendering

**Prossimi step**:
1. Controlla console browser
2. Verifica database
3. Testa query SQL sopra
4. Fammi sapere risultati → Ti do fix specifico
