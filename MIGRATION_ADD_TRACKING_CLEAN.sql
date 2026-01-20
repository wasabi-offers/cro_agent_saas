-- ============================================
-- MIGRATION: ADD ADVANCED TRACKING TABLES (CLEAN VERSION)
-- ============================================
-- This script safely removes old tables/views/triggers and creates new ones

-- ============================================
-- STEP 1: DROP OLD VIEWS (if they exist)
-- ============================================
DROP VIEW IF EXISTS session_analytics CASCADE;
DROP VIEW IF EXISTS page_analytics CASCADE;
DROP VIEW IF EXISTS cta_performance CASCADE;
DROP VIEW IF EXISTS funnel_analytics_view CASCADE;

-- ============================================
-- STEP 2: DROP OLD TRIGGERS (if they exist)
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_session_activity ON tracking_events;
DROP TRIGGER IF EXISTS trigger_aggregate_heatmap ON tracking_events;
DROP TRIGGER IF EXISTS trigger_update_session_stats ON tracking_events;

-- ============================================
-- STEP 3: DROP OLD FUNCTIONS (if they exist)
-- ============================================
DROP FUNCTION IF EXISTS update_session_activity() CASCADE;
DROP FUNCTION IF EXISTS aggregate_heatmap() CASCADE;
DROP FUNCTION IF EXISTS update_session_stats() CASCADE;

-- ============================================
-- STEP 4: DROP OLD TABLES (if they exist)
-- ============================================
-- Drop new tracking tables
DROP TABLE IF EXISTS funnel_progressions CASCADE;
DROP TABLE IF EXISTS conversion_events CASCADE;
DROP TABLE IF EXISTS heatmap_data CASCADE;
DROP TABLE IF EXISTS tracking_events CASCADE;
DROP TABLE IF EXISTS tracking_sessions CASCADE;

-- Drop old funnel tracking tables (from previous implementation)
DROP TABLE IF EXISTS funnel_tracking_events CASCADE;
DROP TABLE IF EXISTS funnel_tracking_sessions CASCADE;
DROP TABLE IF EXISTS landing_tracking_sessions CASCADE;
DROP TABLE IF EXISTS landing_tracking_events CASCADE;

-- ============================================
-- STEP 5: CREATE TRACKING SESSIONS TABLE
-- ============================================
CREATE TABLE tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL UNIQUE,

  -- First seen
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),

  -- Device info
  device_type VARCHAR(20), -- mobile, tablet, desktop
  browser VARCHAR(50),
  os VARCHAR(50),
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  language VARCHAR(10),

  -- Entry
  entry_url TEXT,
  entry_path VARCHAR(500),
  entry_title TEXT,
  referrer TEXT,

  -- UTM parameters
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_term VARCHAR(100),
  utm_content VARCHAR(100),

  -- Engagement
  total_pageviews INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  engaged BOOLEAN DEFAULT FALSE,
  converted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 6: CREATE TRACKING EVENTS TABLE
-- ============================================
CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL REFERENCES tracking_sessions(session_id) ON DELETE CASCADE,

  -- Event type
  event_type VARCHAR(30) NOT NULL, -- pageview, click, scroll, mousemove, form_interaction, etc.
  timestamp BIGINT NOT NULL,

  -- Page context
  url TEXT,
  path VARCHAR(500),
  title TEXT,

  -- Click data (if applicable)
  click_x INTEGER,
  click_y INTEGER,
  click_element VARCHAR(50),
  click_element_id VARCHAR(100),
  click_element_class VARCHAR(200),
  click_element_text VARCHAR(200),
  is_cta_click BOOLEAN,

  -- Scroll data (if applicable)
  scroll_depth INTEGER,
  scroll_percentage INTEGER,
  max_scroll_depth INTEGER,

  -- Mouse data (if applicable)
  mouse_x INTEGER,
  mouse_y INTEGER,
  mouse_speed INTEGER,

  -- Form data (if applicable)
  form_id VARCHAR(100),
  form_name VARCHAR(100),
  form_field_name VARCHAR(100),
  form_field_type VARCHAR(50),
  form_action VARCHAR(20), -- focus, blur, change, submit, error

  -- Funnel data (if applicable)
  funnel_id TEXT,
  funnel_step_name VARCHAR(200),
  funnel_step_order INTEGER,

  -- Time data (if applicable)
  time_on_page INTEGER,
  user_engaged BOOLEAN,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 7: CREATE HEATMAP DATA TABLE
-- ============================================
CREATE TABLE heatmap_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path VARCHAR(500) NOT NULL,
  event_type VARCHAR(20) NOT NULL, -- click, mousemove

  -- Position (rounded to 10px grid)
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,

  -- Aggregated data
  intensity INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (page_path, event_type, x_position, y_position, date)
);

-- ============================================
-- STEP 8: CREATE CONVERSION EVENTS TABLE
-- ============================================
CREATE TABLE conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL REFERENCES tracking_sessions(session_id) ON DELETE CASCADE,

  event_name VARCHAR(100) NOT NULL,
  event_value NUMERIC,
  event_metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 9: CREATE FUNNEL PROGRESSIONS TABLE
-- ============================================
CREATE TABLE funnel_progressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL REFERENCES tracking_sessions(session_id) ON DELETE CASCADE,
  funnel_id TEXT NOT NULL,

  -- Steps visited
  steps_visited JSONB, -- [{step: 'Landing', timestamp: 123, timeSpent: 45}, ...]
  completed BOOLEAN DEFAULT FALSE,

  -- Journey time
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_time_seconds INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 10: CREATE INDEXES
-- ============================================

-- Sessions
CREATE INDEX idx_sessions_session_id ON tracking_sessions(session_id);
CREATE INDEX idx_sessions_first_seen ON tracking_sessions(first_seen_at);
CREATE INDEX idx_sessions_device ON tracking_sessions(device_type);
CREATE INDEX idx_sessions_utm_source ON tracking_sessions(utm_source);
CREATE INDEX idx_sessions_converted ON tracking_sessions(converted);

-- Events
CREATE INDEX idx_events_session_id ON tracking_events(session_id);
CREATE INDEX idx_events_type ON tracking_events(event_type);
CREATE INDEX idx_events_timestamp ON tracking_events(timestamp);
CREATE INDEX idx_events_path ON tracking_events(path);
CREATE INDEX idx_events_funnel ON tracking_events(funnel_id);
CREATE INDEX idx_events_created ON tracking_events(created_at);

-- Heatmap
CREATE INDEX idx_heatmap_path_type ON heatmap_data(page_path, event_type, date);
CREATE INDEX idx_heatmap_date ON heatmap_data(date);

-- Conversions
CREATE INDEX idx_conversions_session ON conversion_events(session_id);
CREATE INDEX idx_conversions_name ON conversion_events(event_name);

-- Funnel progressions
CREATE INDEX idx_progressions_session ON funnel_progressions(session_id);
CREATE INDEX idx_progressions_funnel ON funnel_progressions(funnel_id);
CREATE INDEX idx_progressions_completed ON funnel_progressions(completed);

-- ============================================
-- STEP 11: CREATE FUNCTIONS
-- ============================================

-- Update session activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tracking_sessions
  SET last_activity_at = NOW()
  WHERE session_id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aggregate heatmap data
CREATE OR REPLACE FUNCTION aggregate_heatmap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type IN ('click', 'mousemove') AND NEW.click_x IS NOT NULL AND NEW.click_y IS NOT NULL THEN
    INSERT INTO heatmap_data (page_path, event_type, x_position, y_position, intensity, date)
    VALUES (
      NEW.path,
      NEW.event_type,
      (NEW.click_x / 10) * 10,
      (NEW.click_y / 10) * 10,
      1,
      CURRENT_DATE
    )
    ON CONFLICT (page_path, event_type, x_position, y_position, date)
    DO UPDATE SET
      intensity = heatmap_data.intensity + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update session stats
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'pageview' THEN
    UPDATE tracking_sessions
    SET total_pageviews = total_pageviews + 1
    WHERE session_id = NEW.session_id;
  ELSIF NEW.event_type IN ('click', 'cta_click') THEN
    UPDATE tracking_sessions
    SET total_clicks = total_clicks + 1
    WHERE session_id = NEW.session_id;
  ELSIF NEW.event_type = 'time_on_page' AND NEW.time_on_page IS NOT NULL THEN
    UPDATE tracking_sessions
    SET
      total_time_seconds = NEW.time_on_page,
      engaged = NEW.user_engaged
    WHERE session_id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 12: CREATE TRIGGERS
-- ============================================

CREATE TRIGGER trigger_update_session_activity
AFTER INSERT ON tracking_events
FOR EACH ROW
EXECUTE FUNCTION update_session_activity();

CREATE TRIGGER trigger_aggregate_heatmap
AFTER INSERT ON tracking_events
FOR EACH ROW
EXECUTE FUNCTION aggregate_heatmap();

CREATE TRIGGER trigger_update_session_stats
AFTER INSERT ON tracking_events
FOR EACH ROW
EXECUTE FUNCTION update_session_stats();

-- ============================================
-- STEP 13: CREATE VIEWS
-- ============================================

-- Session analytics
CREATE VIEW session_analytics AS
SELECT
  DATE(first_seen_at) as date,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT session_id) FILTER (WHERE engaged = TRUE) as engaged_sessions,
  COUNT(DISTINCT session_id) FILTER (WHERE converted = TRUE) as converted_sessions,
  AVG(total_pageviews) as avg_pageviews,
  AVG(total_clicks) as avg_clicks,
  AVG(total_time_seconds) as avg_time_seconds,
  device_type,
  browser
FROM tracking_sessions
GROUP BY DATE(first_seen_at), device_type, browser
ORDER BY date DESC;

-- Page analytics
CREATE VIEW page_analytics AS
SELECT
  path,
  COUNT(*) as total_views,
  COUNT(DISTINCT session_id) as unique_visitors,
  COUNT(*) FILTER (WHERE event_type = 'click') as total_clicks,
  COUNT(*) FILTER (WHERE event_type = 'cta_click') as cta_clicks,
  AVG(CASE WHEN event_type = 'scroll' THEN scroll_percentage END) as avg_scroll_depth,
  DATE(created_at) as date
FROM tracking_events
WHERE event_type IN ('pageview', 'click', 'cta_click', 'scroll')
GROUP BY path, DATE(created_at)
ORDER BY total_views DESC;

-- CTA performance
CREATE VIEW cta_performance AS
SELECT
  click_element_text,
  click_element_class,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT session_id) as unique_clickers,
  path
FROM tracking_events
WHERE event_type = 'cta_click'
  AND click_element_text IS NOT NULL
GROUP BY click_element_text, click_element_class, path
ORDER BY total_clicks DESC;

-- Funnel analytics
CREATE VIEW funnel_analytics_view AS
SELECT
  funnel_id,
  funnel_step_name,
  funnel_step_order,
  COUNT(DISTINCT session_id) as unique_visitors,
  COUNT(*) as total_visits,
  DATE(created_at) as date
FROM tracking_events
WHERE event_type = 'funnel_step'
  AND funnel_id IS NOT NULL
GROUP BY funnel_id, funnel_step_name, funnel_step_order, DATE(created_at)
ORDER BY funnel_id, funnel_step_order;

-- ============================================
-- STEP 14: ADD COMMENTS
-- ============================================
COMMENT ON TABLE tracking_sessions IS 'User sessions with complete device and UTM data';
COMMENT ON TABLE tracking_events IS 'All tracking events (clicks, scrolls, forms, funnels, etc.)';
COMMENT ON TABLE heatmap_data IS 'Aggregated heatmap data for visualization';
COMMENT ON TABLE conversion_events IS 'Conversion tracking';
COMMENT ON TABLE funnel_progressions IS 'User journey through funnels';

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- All tracking tables, indexes, triggers, functions and views have been created.
