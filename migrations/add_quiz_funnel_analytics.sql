-- ============================================
-- QUIZ FUNNEL ANALYTICS & AI INTELLIGENCE
-- Sistema di tracciamento quiz funnel multi-step
-- con analisi AI dei punti di abbandono
-- ============================================

-- ============================================
-- 1. QUIZ FUNNELS (definizione dei quiz da monitorare)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  base_url TEXT,
  url_pattern TEXT,
  
  status VARCHAR(20) DEFAULT 'active', -- active, paused, archived
  
  total_starts INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  total_unique_users INTEGER DEFAULT 0,
  
  settings JSONB DEFAULT '{
    "track_answers": true,
    "track_time_per_step": true,
    "track_hesitation": true,
    "ai_analysis_enabled": true,
    "ai_analysis_interval_hours": 6,
    "dropoff_threshold_pct": 30
  }'::jsonb,
  
  tags JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. QUIZ FUNNEL STEPS (domande/step definiti)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_funnel_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  funnel_id UUID NOT NULL REFERENCES quiz_funnels(id) ON DELETE CASCADE,
  
  step_order INTEGER NOT NULL,
  step_name VARCHAR(200) NOT NULL,
  step_type VARCHAR(50) DEFAULT 'question', -- question, info, result, optin, upsell
  
  question_text TEXT,
  
  answers JSONB DEFAULT '[]'::jsonb,
  -- [{ "id": "a1", "text": "Option A", "value": "option_a", "score": 10 }, ...]
  
  is_required BOOLEAN DEFAULT TRUE,
  is_branching BOOLEAN DEFAULT FALSE,
  branching_rules JSONB DEFAULT '[]'::jsonb,
  -- [{ "answer_id": "a1", "go_to_step": 5 }, ...]
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(funnel_id, step_order)
);

-- ============================================
-- 3. QUIZ SESSIONS (sessioni utente nel quiz)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  funnel_id UUID NOT NULL REFERENCES quiz_funnels(id) ON DELETE CASCADE,
  
  user_id VARCHAR NOT NULL,
  session_id VARCHAR NOT NULL,
  
  status VARCHAR(30) DEFAULT 'in_progress',
  -- in_progress, completed, abandoned, timed_out
  
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  abandoned_at TIMESTAMP,
  
  last_step_reached INTEGER DEFAULT 0,
  total_steps_viewed INTEGER DEFAULT 0,
  total_steps_answered INTEGER DEFAULT 0,
  
  total_time_seconds INTEGER DEFAULT 0,
  avg_time_per_step_seconds DECIMAL(8,2) DEFAULT 0,
  
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  answers_given JSONB DEFAULT '[]'::jsonb,
  -- [{ "step_order": 1, "answer_id": "a1", "answer_text": "Option A", "time_seconds": 12 }, ...]
  
  quiz_score DECIMAL(10,2) DEFAULT 0,
  quiz_result VARCHAR(200),
  
  source VARCHAR(100),
  medium VARCHAR(100),
  campaign VARCHAR(100),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  
  dropoff_step INTEGER,
  dropoff_reason VARCHAR(100),
  -- timeout, navigation, exit_intent, tab_switch, manual_close
  
  is_conversion BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10,2) DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. QUIZ EVENTS (ogni interazione nel quiz)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  funnel_id UUID NOT NULL REFERENCES quiz_funnels(id) ON DELETE CASCADE,
  quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  
  user_id VARCHAR NOT NULL,
  session_id VARCHAR NOT NULL,
  
  event_type VARCHAR(50) NOT NULL,
  -- quiz_start, step_view, answer_click, answer_change, step_skip,
  -- step_back, quiz_complete, quiz_abandon, hesitation, 
  -- option_hover, option_focus, scroll_on_step, exit_intent_on_step
  
  step_order INTEGER,
  step_name VARCHAR(200),
  
  answer_id VARCHAR(100),
  answer_text VARCHAR(500),
  answer_value VARCHAR(200),
  
  previous_answer_id VARCHAR(100),
  
  time_on_step_seconds DECIMAL(8,2) DEFAULT 0,
  time_since_start_seconds DECIMAL(8,2) DEFAULT 0,
  
  hesitation_detected BOOLEAN DEFAULT FALSE,
  hesitation_duration_ms INTEGER DEFAULT 0,
  
  interaction_data JSONB DEFAULT '{}'::jsonb,
  -- { "click_x": 100, "click_y": 200, "element": "button", "scroll_depth": 50, ... }
  
  device_type VARCHAR(20),
  browser VARCHAR(50),
  
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. QUIZ ANSWER ANALYTICS (aggregati per risposta)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_answer_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  funnel_id UUID NOT NULL REFERENCES quiz_funnels(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  
  answer_id VARCHAR(100) NOT NULL,
  answer_text VARCHAR(500),
  
  total_clicks INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  
  avg_time_before_click_seconds DECIMAL(8,2) DEFAULT 0,
  
  led_to_completion INTEGER DEFAULT 0,
  led_to_dropoff INTEGER DEFAULT 0,
  
  completion_rate DECIMAL(5,2) DEFAULT 0,
  
  date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(funnel_id, step_order, answer_id, date)
);

-- ============================================
-- 6. QUIZ AI INSIGHTS (analisi AI del quiz)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  funnel_id UUID NOT NULL REFERENCES quiz_funnels(id) ON DELETE CASCADE,
  
  analysis_type VARCHAR(50) NOT NULL,
  -- dropoff_analysis, answer_pattern, completion_prediction,
  -- step_optimization, user_segment_analysis, ab_test_recommendation
  
  insight_title VARCHAR(300),
  insight_summary TEXT,
  
  severity VARCHAR(20) DEFAULT 'info', -- critical, warning, info, success
  
  affected_step INTEGER,
  affected_answer_id VARCHAR(100),
  
  metrics JSONB DEFAULT '{}'::jsonb,
  -- { "dropoff_rate": 45, "avg_time": 30, "sample_size": 150, ... }
  
  recommendations JSONB DEFAULT '[]'::jsonb,
  -- [{ "action": "reword_question", "details": "...", "priority": "high", "expected_impact": "+15% completion" }]
  
  data_points_analyzed INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2) DEFAULT 0,
  
  model_used VARCHAR(100),
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  
  is_actionable BOOLEAN DEFAULT TRUE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  
  analyzed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quiz_funnels_slug ON quiz_funnels(slug);
CREATE INDEX IF NOT EXISTS idx_quiz_funnels_status ON quiz_funnels(status);

CREATE INDEX IF NOT EXISTS idx_quiz_steps_funnel ON quiz_funnel_steps(funnel_id);
CREATE INDEX IF NOT EXISTS idx_quiz_steps_order ON quiz_funnel_steps(funnel_id, step_order);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_funnel ON quiz_sessions(funnel_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_started ON quiz_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_dropoff ON quiz_sessions(dropoff_step) WHERE dropoff_step IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_events_funnel ON quiz_events(funnel_id);
CREATE INDEX IF NOT EXISTS idx_quiz_events_session ON quiz_events(quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_events_type ON quiz_events(event_type);
CREATE INDEX IF NOT EXISTS idx_quiz_events_step ON quiz_events(funnel_id, step_order);
CREATE INDEX IF NOT EXISTS idx_quiz_events_timestamp ON quiz_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_quiz_events_user ON quiz_events(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_events_answer ON quiz_events(funnel_id, step_order, answer_id) WHERE answer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_answer_stats_funnel ON quiz_answer_stats(funnel_id, step_order);
CREATE INDEX IF NOT EXISTS idx_quiz_answer_stats_date ON quiz_answer_stats(date);

CREATE INDEX IF NOT EXISTS idx_quiz_ai_insights_funnel ON quiz_ai_insights(funnel_id);
CREATE INDEX IF NOT EXISTS idx_quiz_ai_insights_type ON quiz_ai_insights(analysis_type);
CREATE INDEX IF NOT EXISTS idx_quiz_ai_insights_severity ON quiz_ai_insights(severity);

-- ============================================
-- 8. VIEW: Quiz Funnel Overview
-- ============================================
CREATE OR REPLACE VIEW quiz_funnel_overview AS
SELECT 
  f.id AS funnel_id,
  f.name,
  f.slug,
  f.status,
  f.total_starts,
  f.total_completions,
  f.total_unique_users,
  CASE WHEN f.total_starts > 0 
    THEN ROUND((f.total_completions::NUMERIC / f.total_starts) * 100, 2)
    ELSE 0 
  END AS completion_rate,
  COUNT(DISTINCT qs.id) FILTER (WHERE qs.started_at >= NOW() - INTERVAL '7 days') AS sessions_last_7d,
  COUNT(DISTINCT qs.id) FILTER (WHERE qs.status = 'completed' AND qs.completed_at >= NOW() - INTERVAL '7 days') AS completions_last_7d,
  COUNT(DISTINCT qs.id) FILTER (WHERE qs.status = 'abandoned' AND qs.abandoned_at >= NOW() - INTERVAL '7 days') AS abandonments_last_7d,
  ROUND(AVG(qs.total_time_seconds) FILTER (WHERE qs.status = 'completed'), 1) AS avg_completion_time_s,
  ROUND(AVG(qs.completion_percentage), 1) AS avg_completion_pct,
  MODE() WITHIN GROUP (ORDER BY qs.dropoff_step) FILTER (WHERE qs.dropoff_step IS NOT NULL) AS most_common_dropoff_step,
  f.created_at,
  f.updated_at
FROM quiz_funnels f
LEFT JOIN quiz_sessions qs ON f.id = qs.funnel_id
GROUP BY f.id, f.name, f.slug, f.status, f.total_starts, f.total_completions, 
         f.total_unique_users, f.created_at, f.updated_at;

-- ============================================
-- 9. VIEW: Step-by-Step Dropoff Analysis
-- ============================================
CREATE OR REPLACE VIEW quiz_step_dropoff_view AS
SELECT 
  qfs.funnel_id,
  qfs.step_order,
  qfs.step_name,
  qfs.step_type,
  qfs.question_text,
  COUNT(DISTINCT qe.user_id) FILTER (WHERE qe.event_type = 'step_view') AS users_viewed,
  COUNT(DISTINCT qe.user_id) FILTER (WHERE qe.event_type = 'answer_click') AS users_answered,
  COUNT(DISTINCT qs.user_id) FILTER (WHERE qs.dropoff_step = qfs.step_order) AS users_dropped,
  ROUND(AVG(qe.time_on_step_seconds) FILTER (WHERE qe.event_type = 'answer_click'), 2) AS avg_time_on_step,
  ROUND(MAX(qe.time_on_step_seconds) FILTER (WHERE qe.event_type = 'answer_click'), 2) AS max_time_on_step,
  COUNT(*) FILTER (WHERE qe.hesitation_detected = TRUE) AS hesitation_count,
  ROUND(AVG(qe.hesitation_duration_ms) FILTER (WHERE qe.hesitation_detected = TRUE), 0) AS avg_hesitation_ms
FROM quiz_funnel_steps qfs
LEFT JOIN quiz_events qe ON qe.funnel_id = qfs.funnel_id AND qe.step_order = qfs.step_order
LEFT JOIN quiz_sessions qs ON qs.funnel_id = qfs.funnel_id
GROUP BY qfs.funnel_id, qfs.step_order, qfs.step_name, qfs.step_type, qfs.question_text
ORDER BY qfs.funnel_id, qfs.step_order;

-- ============================================
-- 10. VIEW: Answer Popularity Analysis
-- ============================================
CREATE OR REPLACE VIEW quiz_answer_popularity_view AS
SELECT 
  qe.funnel_id,
  qe.step_order,
  qe.step_name,
  qe.answer_id,
  qe.answer_text,
  COUNT(*) AS total_clicks,
  COUNT(DISTINCT qe.user_id) AS unique_users,
  ROUND(AVG(qe.time_on_step_seconds), 2) AS avg_time_before_click,
  COUNT(DISTINCT qs_completed.user_id) AS led_to_completion,
  COUNT(DISTINCT qs_dropped.user_id) AS led_to_dropoff,
  CASE WHEN COUNT(DISTINCT qe.user_id) > 0
    THEN ROUND(
      (COUNT(DISTINCT qs_completed.user_id)::NUMERIC / COUNT(DISTINCT qe.user_id)) * 100, 2
    )
    ELSE 0
  END AS completion_rate_after
FROM quiz_events qe
LEFT JOIN quiz_sessions qs_completed 
  ON qs_completed.funnel_id = qe.funnel_id 
  AND qs_completed.user_id = qe.user_id 
  AND qs_completed.status = 'completed'
LEFT JOIN quiz_sessions qs_dropped 
  ON qs_dropped.funnel_id = qe.funnel_id 
  AND qs_dropped.user_id = qe.user_id 
  AND qs_dropped.status = 'abandoned'
WHERE qe.event_type = 'answer_click' AND qe.answer_id IS NOT NULL
GROUP BY qe.funnel_id, qe.step_order, qe.step_name, qe.answer_id, qe.answer_text
ORDER BY qe.funnel_id, qe.step_order, total_clicks DESC;

-- ============================================
-- 11. FUNCTION: Start quiz session
-- ============================================
CREATE OR REPLACE FUNCTION start_quiz_session(
  p_funnel_id UUID,
  p_user_id VARCHAR,
  p_session_id VARCHAR,
  p_source VARCHAR DEFAULT NULL,
  p_medium VARCHAR DEFAULT NULL,
  p_campaign VARCHAR DEFAULT NULL,
  p_device_type VARCHAR DEFAULT 'unknown',
  p_browser VARCHAR DEFAULT 'unknown',
  p_os VARCHAR DEFAULT 'unknown'
)
RETURNS UUID AS $$
DECLARE
  v_quiz_session_id UUID;
BEGIN
  INSERT INTO quiz_sessions (
    funnel_id, user_id, session_id, status, started_at,
    source, medium, campaign, device_type, browser, os
  ) VALUES (
    p_funnel_id, p_user_id, p_session_id, 'in_progress', NOW(),
    p_source, p_medium, p_campaign, p_device_type, p_browser, p_os
  ) RETURNING id INTO v_quiz_session_id;
  
  UPDATE quiz_funnels
  SET total_starts = total_starts + 1,
      updated_at = NOW()
  WHERE id = p_funnel_id;
  
  PERFORM update_quiz_unique_users(p_funnel_id);
  
  RETURN v_quiz_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. FUNCTION: Complete quiz session
-- ============================================
CREATE OR REPLACE FUNCTION complete_quiz_session(
  p_quiz_session_id UUID,
  p_quiz_score DECIMAL DEFAULT 0,
  p_quiz_result VARCHAR DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_funnel_id UUID;
  v_started_at TIMESTAMP;
BEGIN
  SELECT funnel_id, started_at INTO v_funnel_id, v_started_at
  FROM quiz_sessions WHERE id = p_quiz_session_id;
  
  UPDATE quiz_sessions
  SET status = 'completed',
      completed_at = NOW(),
      total_time_seconds = EXTRACT(EPOCH FROM (NOW() - v_started_at)),
      completion_percentage = 100,
      quiz_score = p_quiz_score,
      quiz_result = p_quiz_result,
      updated_at = NOW()
  WHERE id = p_quiz_session_id;
  
  UPDATE quiz_sessions
  SET avg_time_per_step_seconds = 
    CASE WHEN total_steps_answered > 0 
      THEN total_time_seconds::DECIMAL / total_steps_answered 
      ELSE 0 
    END
  WHERE id = p_quiz_session_id;
  
  UPDATE quiz_funnels
  SET total_completions = total_completions + 1,
      updated_at = NOW()
  WHERE id = v_funnel_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. FUNCTION: Abandon quiz session
-- ============================================
CREATE OR REPLACE FUNCTION abandon_quiz_session(
  p_quiz_session_id UUID,
  p_dropoff_step INTEGER,
  p_dropoff_reason VARCHAR DEFAULT 'unknown'
)
RETURNS void AS $$
DECLARE
  v_started_at TIMESTAMP;
  v_total_steps INTEGER;
  v_funnel_id UUID;
BEGIN
  SELECT funnel_id, started_at INTO v_funnel_id, v_started_at
  FROM quiz_sessions WHERE id = p_quiz_session_id;
  
  SELECT COUNT(*) INTO v_total_steps
  FROM quiz_funnel_steps WHERE funnel_id = v_funnel_id;
  
  UPDATE quiz_sessions
  SET status = 'abandoned',
      abandoned_at = NOW(),
      dropoff_step = p_dropoff_step,
      dropoff_reason = p_dropoff_reason,
      total_time_seconds = EXTRACT(EPOCH FROM (NOW() - v_started_at)),
      completion_percentage = CASE WHEN v_total_steps > 0 
        THEN ROUND((p_dropoff_step::DECIMAL / v_total_steps) * 100, 2) 
        ELSE 0 
      END,
      updated_at = NOW()
  WHERE id = p_quiz_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 14. FUNCTION: Record quiz answer
-- ============================================
CREATE OR REPLACE FUNCTION record_quiz_answer(
  p_quiz_session_id UUID,
  p_step_order INTEGER,
  p_answer_id VARCHAR,
  p_answer_text VARCHAR,
  p_time_seconds DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE quiz_sessions
  SET 
    total_steps_answered = total_steps_answered + 1,
    last_step_reached = GREATEST(last_step_reached, p_step_order),
    answers_given = answers_given || jsonb_build_object(
      'step_order', p_step_order,
      'answer_id', p_answer_id,
      'answer_text', p_answer_text,
      'time_seconds', p_time_seconds
    ),
    updated_at = NOW()
  WHERE id = p_quiz_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 15. FUNCTION: Update unique users count
-- ============================================
CREATE OR REPLACE FUNCTION update_quiz_unique_users(p_funnel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE quiz_funnels
  SET total_unique_users = (
    SELECT COUNT(DISTINCT user_id) 
    FROM quiz_sessions 
    WHERE funnel_id = p_funnel_id
  ),
  updated_at = NOW()
  WHERE id = p_funnel_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 16. FUNCTION: Save quiz AI insight
-- ============================================
CREATE OR REPLACE FUNCTION save_quiz_ai_insight(
  p_funnel_id UUID,
  p_analysis_type VARCHAR,
  p_title VARCHAR,
  p_summary TEXT,
  p_severity VARCHAR,
  p_affected_step INTEGER,
  p_affected_answer VARCHAR,
  p_metrics JSONB,
  p_recommendations JSONB,
  p_data_points INTEGER,
  p_confidence DECIMAL,
  p_model VARCHAR,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_latency INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_insight_id UUID;
BEGIN
  INSERT INTO quiz_ai_insights (
    funnel_id, analysis_type, insight_title, insight_summary,
    severity, affected_step, affected_answer_id,
    metrics, recommendations, data_points_analyzed, confidence_score,
    model_used, prompt_tokens, completion_tokens, latency_ms,
    expires_at
  ) VALUES (
    p_funnel_id, p_analysis_type, p_title, p_summary,
    p_severity, p_affected_step, p_affected_answer,
    p_metrics, p_recommendations, p_data_points, p_confidence,
    p_model, p_prompt_tokens, p_completion_tokens, p_latency,
    NOW() + INTERVAL '7 days'
  ) RETURNING id INTO v_insight_id;
  
  RETURN v_insight_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 17. FUNCTION: Get quiz funnel stats
-- ============================================
CREATE OR REPLACE FUNCTION get_quiz_funnel_stats(
  p_funnel_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  step_order INTEGER,
  step_name VARCHAR,
  users_entered BIGINT,
  users_answered BIGINT,
  users_dropped BIGINT,
  dropoff_rate DECIMAL,
  avg_time_seconds DECIMAL,
  most_popular_answer VARCHAR,
  most_popular_answer_pct DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qfs.step_order,
    qfs.step_name,
    COUNT(DISTINCT qe_view.user_id) AS users_entered,
    COUNT(DISTINCT qe_answer.user_id) AS users_answered,
    COUNT(DISTINCT qs_drop.user_id) AS users_dropped,
    CASE WHEN COUNT(DISTINCT qe_view.user_id) > 0
      THEN ROUND(
        (COUNT(DISTINCT qs_drop.user_id)::NUMERIC / COUNT(DISTINCT qe_view.user_id)) * 100, 2
      )
      ELSE 0
    END AS dropoff_rate,
    ROUND(AVG(qe_answer.time_on_step_seconds), 2) AS avg_time_seconds,
    MODE() WITHIN GROUP (ORDER BY qe_answer.answer_text) AS most_popular_answer,
    CASE WHEN COUNT(DISTINCT qe_answer.user_id) > 0
      THEN ROUND(
        (COUNT(qe_answer.answer_text) FILTER (
          WHERE qe_answer.answer_text = MODE() WITHIN GROUP (ORDER BY qe_answer.answer_text)
        )::NUMERIC / COUNT(DISTINCT qe_answer.user_id)) * 100, 2
      )
      ELSE 0
    END AS most_popular_answer_pct
  FROM quiz_funnel_steps qfs
  LEFT JOIN quiz_events qe_view 
    ON qe_view.funnel_id = qfs.funnel_id 
    AND qe_view.step_order = qfs.step_order 
    AND qe_view.event_type = 'step_view'
    AND qe_view.created_at >= NOW() - (p_days || ' days')::INTERVAL
  LEFT JOIN quiz_events qe_answer 
    ON qe_answer.funnel_id = qfs.funnel_id 
    AND qe_answer.step_order = qfs.step_order 
    AND qe_answer.event_type = 'answer_click'
    AND qe_answer.created_at >= NOW() - (p_days || ' days')::INTERVAL
  LEFT JOIN quiz_sessions qs_drop 
    ON qs_drop.funnel_id = qfs.funnel_id 
    AND qs_drop.dropoff_step = qfs.step_order
    AND qs_drop.created_at >= NOW() - (p_days || ' days')::INTERVAL
  WHERE qfs.funnel_id = p_funnel_id
  GROUP BY qfs.step_order, qfs.step_name
  ORDER BY qfs.step_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTI
-- ============================================
COMMENT ON TABLE quiz_funnels IS 'Quiz funnel definitions - multiple quiz funnels to monitor';
COMMENT ON TABLE quiz_funnel_steps IS 'Steps/questions for each quiz funnel';
COMMENT ON TABLE quiz_sessions IS 'Individual user sessions through a quiz funnel';
COMMENT ON TABLE quiz_events IS 'Every user interaction within a quiz (clicks, views, hesitations)';
COMMENT ON TABLE quiz_answer_stats IS 'Aggregated answer statistics per step per day';
COMMENT ON TABLE quiz_ai_insights IS 'AI-generated insights about quiz performance and dropoffs';
