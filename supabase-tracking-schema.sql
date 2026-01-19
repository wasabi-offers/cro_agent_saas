-- Schema Supabase per tracking eventi landing pages

-- Tabella sessioni utenti
CREATE TABLE IF NOT EXISTS tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id VARCHAR NOT NULL,
  session_id VARCHAR NOT NULL UNIQUE,
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  referrer TEXT,
  language VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_landing_id (landing_id),
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at)
);

-- Tabella eventi (click, scroll, movement)
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id VARCHAR NOT NULL,
  session_id VARCHAR NOT NULL REFERENCES tracking_sessions(session_id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL, -- 'click', 'scroll', 'movement'
  x_position INTEGER,
  y_position INTEGER,
  scroll_percentage INTEGER,
  page_width INTEGER,
  page_height INTEGER,
  viewport_height INTEGER,
  target_element VARCHAR(50),
  target_id VARCHAR(100),
  target_class VARCHAR(100),
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_landing_session (landing_id, session_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  INDEX idx_timestamp (timestamp)
);

-- Tabella aggregata per heatmap (pre-calcolata per performance)
CREATE TABLE IF NOT EXISTS tracking_heatmap_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id VARCHAR NOT NULL,
  event_type VARCHAR(20) NOT NULL,
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,
  intensity INTEGER DEFAULT 1, -- Conta degli eventi in questa posizione
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (landing_id, event_type, x_position, y_position, date),
  INDEX idx_landing_type_date (landing_id, event_type, date)
);

-- Funzione per aggregare eventi in heatmap data
CREATE OR REPLACE FUNCTION aggregate_heatmap_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Arrotonda posizioni a griglia 10x10 per ridurre granularità
  INSERT INTO tracking_heatmap_data (
    landing_id,
    event_type,
    x_position,
    y_position,
    intensity,
    date
  )
  VALUES (
    NEW.landing_id,
    NEW.event_type,
    (NEW.x_position / 10) * 10, -- Arrotonda a multipli di 10
    (NEW.y_position / 10) * 10,
    1,
    CURRENT_DATE
  )
  ON CONFLICT (landing_id, event_type, x_position, y_position, date)
  DO UPDATE SET
    intensity = tracking_heatmap_data.intensity + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggregazione automatica
CREATE TRIGGER trigger_aggregate_heatmap
AFTER INSERT ON tracking_events
FOR EACH ROW
WHEN (NEW.event_type IN ('click', 'movement'))
EXECUTE FUNCTION aggregate_heatmap_data();

-- View per statistiche rapide
CREATE OR REPLACE VIEW tracking_stats AS
SELECT
  landing_id,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) FILTER (WHERE event_type = 'click') as total_clicks,
  COUNT(*) FILTER (WHERE event_type = 'scroll') as total_scrolls,
  COUNT(*) FILTER (WHERE event_type = 'movement') as total_movements,
  DATE(created_at) as date
FROM tracking_events
GROUP BY landing_id, DATE(created_at);

-- Commenti
COMMENT ON TABLE tracking_sessions IS 'Sessioni utenti con info device e browser';
COMMENT ON TABLE tracking_events IS 'Eventi raw (click, scroll, movement) catturati in real-time';
COMMENT ON TABLE tracking_heatmap_data IS 'Dati aggregati per heatmap visualization (performance)';
