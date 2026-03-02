-- ============================================
-- AI BEHAVIORAL INTELLIGENCE SYSTEM
-- Tabelle per analisi AI del comportamento utente
-- ============================================

-- ============================================
-- 1. AI BEHAVIORAL INSIGHTS (per-session)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_behavioral_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL,
  user_id VARCHAR,

  detected_intent VARCHAR(50),
  behavioral_segment VARCHAR(50),
  engagement_score INTEGER CHECK (engagement_score BETWEEN 0 AND 100),
  predicted_action VARCHAR(50),
  prediction_confidence DECIMAL(3,2) CHECK (prediction_confidence BETWEEN 0 AND 1),

  friction_points JSONB DEFAULT '[]'::jsonb,
  attention_zones JSONB DEFAULT '[]'::jsonb,
  content_interaction JSONB DEFAULT '{}'::jsonb,

  recommended_intervention VARCHAR(100),
  intervention_params JSONB DEFAULT '{}'::jsonb,
  intervention_executed BOOLEAN DEFAULT FALSE,
  intervention_result VARCHAR(50),

  ai_attribution_weights JSONB DEFAULT '{}'::jsonb,

  events_analyzed INTEGER DEFAULT 0,
  session_context JSONB DEFAULT '{}'::jsonb,

  ai_model VARCHAR(50),
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,

  analyzed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. AI DYNAMIC ATTRIBUTION
-- ============================================
CREATE TABLE IF NOT EXISTS ai_dynamic_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_id UUID,
  user_id VARCHAR NOT NULL,

  touchpoint_id UUID,
  channel_source VARCHAR(100),
  channel_medium VARCHAR(100),

  ai_credit DECIMAL(5,4) CHECK (ai_credit BETWEEN 0 AND 1),
  ai_reasoning TEXT,

  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. AI INTERVENTION LOG
-- ============================================
CREATE TABLE IF NOT EXISTS ai_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL,
  user_id VARCHAR,
  insight_id UUID REFERENCES ai_behavioral_insights(id) ON DELETE SET NULL,

  intervention_type VARCHAR(100) NOT NULL,
  intervention_params JSONB DEFAULT '{}'::jsonb,
  triggered_at TIMESTAMP DEFAULT NOW(),

  user_response VARCHAR(50),
  response_time_ms INTEGER,
  led_to_conversion BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. AI MODEL PERFORMANCE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS ai_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  model_name VARCHAR(50) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  
  predictions_total INTEGER DEFAULT 0,
  predictions_correct INTEGER DEFAULT 0,
  avg_confidence DECIMAL(3,2) DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,

  interventions_total INTEGER DEFAULT 0,
  interventions_accepted INTEGER DEFAULT 0,
  interventions_led_to_conversion INTEGER DEFAULT 0,

  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(model_name, task_type, date)
);

-- ============================================
-- 5. INDICI
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_insights_session ON ai_behavioral_insights(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_behavioral_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_intent ON ai_behavioral_insights(detected_intent);
CREATE INDEX IF NOT EXISTS idx_ai_insights_segment ON ai_behavioral_insights(behavioral_segment);
CREATE INDEX IF NOT EXISTS idx_ai_insights_analyzed ON ai_behavioral_insights(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_score ON ai_behavioral_insights(engagement_score);

CREATE INDEX IF NOT EXISTS idx_ai_attribution_user ON ai_dynamic_attribution(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_attribution_conversion ON ai_dynamic_attribution(conversion_id);

CREATE INDEX IF NOT EXISTS idx_ai_interventions_session ON ai_interventions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_interventions_type ON ai_interventions(intervention_type);
CREATE INDEX IF NOT EXISTS idx_ai_interventions_conversion ON ai_interventions(led_to_conversion) WHERE led_to_conversion = TRUE;

CREATE INDEX IF NOT EXISTS idx_ai_metrics_model ON ai_model_metrics(model_name, task_type);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_date ON ai_model_metrics(date);

-- ============================================
-- 6. RPC: Salva insight AI e restituisce ID
-- ============================================
CREATE OR REPLACE FUNCTION save_ai_insight(
  p_session_id VARCHAR,
  p_user_id VARCHAR,
  p_intent VARCHAR,
  p_segment VARCHAR,
  p_score INTEGER,
  p_predicted_action VARCHAR,
  p_confidence DECIMAL,
  p_friction JSONB,
  p_attention JSONB,
  p_intervention VARCHAR,
  p_intervention_params JSONB,
  p_events_analyzed INTEGER,
  p_model VARCHAR,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_latency_ms INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO ai_behavioral_insights (
    session_id, user_id, detected_intent, behavioral_segment,
    engagement_score, predicted_action, prediction_confidence,
    friction_points, attention_zones,
    recommended_intervention, intervention_params,
    events_analyzed, ai_model, prompt_tokens, completion_tokens, latency_ms
  ) VALUES (
    p_session_id, p_user_id, p_intent, p_segment,
    p_score, p_predicted_action, p_confidence,
    p_friction, p_attention,
    p_intervention, p_intervention_params,
    p_events_analyzed, p_model, p_prompt_tokens, p_completion_tokens, p_latency_ms
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. RPC: Salva attribution AI per conversione
-- ============================================
CREATE OR REPLACE FUNCTION save_ai_attribution(
  p_conversion_id UUID,
  p_user_id VARCHAR,
  p_touchpoints JSONB,
  p_model_version VARCHAR
)
RETURNS void AS $$
DECLARE
  tp JSONB;
BEGIN
  FOR tp IN SELECT * FROM jsonb_array_elements(p_touchpoints)
  LOOP
    INSERT INTO ai_dynamic_attribution (
      conversion_id, user_id, touchpoint_id,
      channel_source, channel_medium,
      ai_credit, ai_reasoning, model_version
    ) VALUES (
      p_conversion_id,
      p_user_id,
      (tp->>'touchpoint_id')::UUID,
      tp->>'source',
      tp->>'medium',
      (tp->>'credit')::DECIMAL,
      tp->>'reasoning',
      p_model_version
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. RPC: Log intervento AI
-- ============================================
CREATE OR REPLACE FUNCTION log_ai_intervention(
  p_session_id VARCHAR,
  p_user_id VARCHAR,
  p_insight_id UUID,
  p_type VARCHAR,
  p_params JSONB
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO ai_interventions (
    session_id, user_id, insight_id,
    intervention_type, intervention_params
  ) VALUES (
    p_session_id, p_user_id, p_insight_id,
    p_type, p_params
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. RPC: Recupera ultimo insight per sessione
-- ============================================
CREATE OR REPLACE FUNCTION get_latest_ai_insight(p_session_id VARCHAR)
RETURNS SETOF ai_behavioral_insights AS $$
BEGIN
  RETURN QUERY
    SELECT *
    FROM ai_behavioral_insights
    WHERE session_id = p_session_id
    ORDER BY analyzed_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. VIEW: AI Performance Dashboard
-- ============================================
CREATE OR REPLACE VIEW ai_performance_overview AS
SELECT
  DATE(analyzed_at) as date,
  detected_intent,
  behavioral_segment,
  COUNT(*) as analyses,
  ROUND(AVG(engagement_score), 1) as avg_engagement,
  ROUND(AVG(prediction_confidence), 3) as avg_confidence,
  COUNT(*) FILTER (WHERE intervention_executed) as interventions_executed,
  COUNT(*) FILTER (WHERE intervention_result = 'converted') as interventions_converted,
  ROUND(AVG(latency_ms), 0) as avg_latency_ms,
  SUM(prompt_tokens + completion_tokens) as total_tokens
FROM ai_behavioral_insights
GROUP BY DATE(analyzed_at), detected_intent, behavioral_segment
ORDER BY date DESC, analyses DESC;

-- ============================================
-- 11. VIEW: AI Attribution vs Static
-- ============================================
CREATE OR REPLACE VIEW ai_attribution_comparison AS
SELECT
  da.user_id,
  da.conversion_id,
  da.channel_source,
  da.channel_medium,
  da.ai_credit as ai_weight,
  c.first_touch_credit / NULLIF(c.conversion_value, 0) as first_touch_weight,
  c.last_touch_credit / NULLIF(c.conversion_value, 0) as last_touch_weight,
  c.linear_credit / NULLIF(c.conversion_value, 0) as linear_weight,
  da.ai_reasoning,
  c.conversion_value,
  c.conversion_type
FROM ai_dynamic_attribution da
JOIN attribution_conversions c ON da.conversion_id = c.id
ORDER BY da.created_at DESC;

-- ============================================
-- COMMENTI
-- ============================================
COMMENT ON TABLE ai_behavioral_insights IS 'Analisi AI real-time del comportamento utente per sessione';
COMMENT ON TABLE ai_dynamic_attribution IS 'Pesi di attribuzione calcolati da AI per ogni touchpoint';
COMMENT ON TABLE ai_interventions IS 'Log delle azioni AI eseguite sul client (popup, highlight, etc)';
COMMENT ON TABLE ai_model_metrics IS 'Metriche di performance dei modelli AI per data';
