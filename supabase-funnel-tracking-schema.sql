-- ============================================
-- FUNNEL TRACKING SCHEMA
-- ============================================
-- Schema per tracciare gli eventi di navigazione nei funnel
-- Questo permette di calcolare conversion rate reali basati sul comportamento utente

-- ============================================
-- 1. FUNNEL TRACKING SESSIONS
-- ============================================
-- Traccia ogni sessione utente che attraversa un funnel
CREATE TABLE IF NOT EXISTS funnel_tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  session_id VARCHAR NOT NULL UNIQUE, -- Session ID univoco dal frontend
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  referrer TEXT,
  language VARCHAR(10),
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE -- TRUE se l'utente ha completato l'intero funnel
);

-- ============================================
-- 2. FUNNEL TRACKING EVENTS
-- ============================================
-- Traccia ogni step visitato dall'utente
CREATE TABLE IF NOT EXISTS funnel_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  session_id VARCHAR NOT NULL REFERENCES funnel_tracking_sessions(session_id) ON DELETE CASCADE,
  step_id TEXT NOT NULL REFERENCES funnel_steps(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL, -- Ordine dello step nel funnel
  url TEXT, -- URL della pagina visitata
  timestamp BIGINT NOT NULL, -- Timestamp millisecondi del client
  time_on_step INTEGER, -- Tempo trascorso su questo step (secondi) - NULL se è l'ultimo
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. FUNNEL STEP STATS (Aggregati per performance)
-- ============================================
-- Statistiche pre-calcolate per ogni step del funnel
CREATE TABLE IF NOT EXISTS funnel_step_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL REFERENCES funnel_steps(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,

  -- Metriche
  total_visitors INTEGER DEFAULT 0, -- Visitatori unici su questo step
  total_sessions INTEGER DEFAULT 0, -- Totale sessioni che hanno visitato questo step
  total_completions INTEGER DEFAULT 0, -- Quanti hanno completato il funnel partendo da qui
  avg_time_on_step INTEGER DEFAULT 0, -- Tempo medio in secondi

  -- Conversioni
  conversions_to_next_step INTEGER DEFAULT 0, -- Quanti sono passati allo step successivo
  conversion_rate_to_next NUMERIC DEFAULT 0, -- Percentuale conversione allo step successivo

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (funnel_id, step_id, date)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for funnel_tracking_sessions
CREATE INDEX IF NOT EXISTS idx_fts_funnel_session ON funnel_tracking_sessions(funnel_id, session_id);
CREATE INDEX IF NOT EXISTS idx_fts_session_id ON funnel_tracking_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_fts_started_at ON funnel_tracking_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_fts_funnel_id ON funnel_tracking_sessions(funnel_id);

-- Indexes for funnel_tracking_events
CREATE INDEX IF NOT EXISTS idx_fte_funnel_events ON funnel_tracking_events(funnel_id, session_id);
CREATE INDEX IF NOT EXISTS idx_fte_step_id ON funnel_tracking_events(step_id);
CREATE INDEX IF NOT EXISTS idx_fte_created_at ON funnel_tracking_events(created_at);
CREATE INDEX IF NOT EXISTS idx_fte_timestamp ON funnel_tracking_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_fte_funnel_id ON funnel_tracking_events(funnel_id);
CREATE INDEX IF NOT EXISTS idx_fte_session_id ON funnel_tracking_events(session_id);

-- Indexes for funnel_step_stats
CREATE INDEX IF NOT EXISTS idx_fss_funnel_step_date ON funnel_step_stats(funnel_id, step_id, date);
CREATE INDEX IF NOT EXISTS idx_fss_funnel_id ON funnel_step_stats(funnel_id);
CREATE INDEX IF NOT EXISTS idx_fss_date ON funnel_step_stats(date);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Funzione per aggiornare last_activity_at della sessione
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE funnel_tracking_sessions
  SET last_activity_at = NOW()
  WHERE session_id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funzione per marcare sessione come completata
CREATE OR REPLACE FUNCTION check_funnel_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_steps INTEGER;
  completed_steps INTEGER;
BEGIN
  -- Conta totale step nel funnel
  SELECT COUNT(*) INTO total_steps
  FROM funnel_steps
  WHERE funnel_id = NEW.funnel_id;

  -- Conta step completati dalla sessione
  SELECT COUNT(DISTINCT step_id) INTO completed_steps
  FROM funnel_tracking_events
  WHERE session_id = NEW.session_id
    AND funnel_id = NEW.funnel_id;

  -- Se ha completato tutti gli step, marca la sessione come completata
  IF completed_steps >= total_steps THEN
    UPDATE funnel_tracking_sessions
    SET completed = TRUE
    WHERE session_id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Aggiorna activity quando arriva un nuovo evento
CREATE TRIGGER trigger_update_session_activity
AFTER INSERT ON funnel_tracking_events
FOR EACH ROW
EXECUTE FUNCTION update_session_activity();

-- Controlla se il funnel è stato completato
CREATE TRIGGER trigger_check_completion
AFTER INSERT ON funnel_tracking_events
FOR EACH ROW
EXECUTE FUNCTION check_funnel_completion();

-- ============================================
-- VIEWS
-- ============================================

-- Vista per statistiche rapide dei funnel
CREATE OR REPLACE VIEW funnel_analytics AS
SELECT
  f.id as funnel_id,
  f.name as funnel_name,
  COUNT(DISTINCT fts.session_id) as total_sessions,
  COUNT(DISTINCT fts.session_id) FILTER (WHERE fts.completed = TRUE) as completed_sessions,
  ROUND(
    (COUNT(DISTINCT fts.session_id) FILTER (WHERE fts.completed = TRUE)::NUMERIC /
     NULLIF(COUNT(DISTINCT fts.session_id), 0)) * 100,
    2
  ) as conversion_rate,
  DATE(fts.started_at) as date
FROM funnels f
LEFT JOIN funnel_tracking_sessions fts ON f.id = fts.funnel_id
GROUP BY f.id, f.name, DATE(fts.started_at);

-- Vista per step-by-step analytics
CREATE OR REPLACE VIEW funnel_step_analytics AS
SELECT
  f.id as funnel_id,
  f.name as funnel_name,
  fs.id as step_id,
  fs.name as step_name,
  fs.step_order,
  COUNT(DISTINCT fte.session_id) as unique_visitors,
  AVG(fte.time_on_step) as avg_time_on_step,
  DATE(fte.created_at) as date
FROM funnels f
JOIN funnel_steps fs ON f.id = fs.funnel_id
LEFT JOIN funnel_tracking_events fte ON fs.id = fte.step_id
GROUP BY f.id, f.name, fs.id, fs.name, fs.step_order, DATE(fte.created_at)
ORDER BY f.id, fs.step_order;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE funnel_tracking_sessions IS 'Sessioni utente che navigano attraverso i funnel';
COMMENT ON TABLE funnel_tracking_events IS 'Eventi di navigazione step-by-step nei funnel';
COMMENT ON TABLE funnel_step_stats IS 'Statistiche aggregate per step (ottimizzato per queries rapide)';
COMMENT ON VIEW funnel_analytics IS 'Vista analytics per conversion rate complessivo dei funnel';
COMMENT ON VIEW funnel_step_analytics IS 'Vista analytics per performance di ogni singolo step';
