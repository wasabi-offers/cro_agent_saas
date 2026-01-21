-- Controlla se ci sono dati reali per il funnel codiceamazon26
SELECT 
  event_type,
  COUNT(*) as count,
  MIN(timestamp) as first_event,
  MAX(timestamp) as last_event
FROM tracking_events 
WHERE funnel_id = 'codiceamazon26'
GROUP BY event_type
ORDER BY count DESC;

-- Se non esistono eventi, mostra tutti i funnel_id disponibili
SELECT DISTINCT funnel_id, COUNT(*) as events
FROM tracking_events
GROUP BY funnel_id
LIMIT 10;
