-- ============================================
-- ATTRIBUTION & FIRST-PARTY USER TRACKING
-- Sistema di tracciamento first-party data
-- ============================================

-- ============================================
-- 1. TABELLA UTENTI UNIVOCI (First-Party)
-- ============================================
CREATE TABLE IF NOT EXISTS tracking_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificatore persistente univoco
  user_id VARCHAR NOT NULL UNIQUE,
  
  -- Fingerprint per identificazione cross-session
  device_fingerprint VARCHAR,
  
  -- Timestamps
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  
  -- Contatori aggregati
  total_sessions INTEGER DEFAULT 1,
  total_pageviews INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Device info principale (più frequente)
  primary_device_type VARCHAR(20),
  primary_browser VARCHAR(50),
  primary_os VARCHAR(50),
  primary_language VARCHAR(10),
  
  -- First-touch attribution (prima interazione)
  first_touch_source VARCHAR(100),
  first_touch_medium VARCHAR(100),
  first_touch_campaign VARCHAR(100),
  first_touch_content VARCHAR(100),
  first_touch_term VARCHAR(100),
  first_touch_referrer TEXT,
  first_touch_landing_page TEXT,
  
  -- Last-touch attribution (ultima interazione)
  last_touch_source VARCHAR(100),
  last_touch_medium VARCHAR(100),
  last_touch_campaign VARCHAR(100),
  last_touch_content VARCHAR(100),
  last_touch_term VARCHAR(100),
  last_touch_referrer TEXT,
  last_touch_landing_page TEXT,
  
  -- Customer journey stage
  lifecycle_stage VARCHAR(50) DEFAULT 'visitor', -- visitor, lead, customer, returning_customer
  
  -- Tags e segmenti
  tags JSONB DEFAULT '[]'::jsonb,
  custom_attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. TABELLA TOUCHPOINTS (ogni interazione)
-- ============================================
CREATE TABLE IF NOT EXISTS attribution_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link all'utente
  user_id VARCHAR NOT NULL REFERENCES tracking_users(user_id) ON DELETE CASCADE,
  session_id VARCHAR NOT NULL,
  
  -- Touchpoint data
  touchpoint_type VARCHAR(50) NOT NULL, -- 'pageview', 'click', 'form_submit', 'purchase', 'custom'
  touchpoint_order INTEGER DEFAULT 0,
  
  -- Attribution source
  source VARCHAR(100),
  medium VARCHAR(100),
  campaign VARCHAR(100),
  content VARCHAR(100),
  term VARCHAR(100),
  referrer TEXT,
  
  -- Page info
  page_url TEXT,
  page_path VARCHAR(500),
  page_title VARCHAR(500),
  
  -- Conversion info
  is_conversion BOOLEAN DEFAULT FALSE,
  conversion_type VARCHAR(50),
  conversion_value DECIMAL(10,2) DEFAULT 0,
  
  -- Funnel tracking
  funnel_id VARCHAR,
  funnel_step_name VARCHAR(200),
  funnel_step_order INTEGER,
  
  -- Device at this touchpoint
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  
  -- Timestamps
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. TABELLA CONVERSIONI
-- ============================================
CREATE TABLE IF NOT EXISTS attribution_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link all'utente
  user_id VARCHAR NOT NULL REFERENCES tracking_users(user_id) ON DELETE CASCADE,
  session_id VARCHAR NOT NULL,
  
  -- Conversion details
  conversion_type VARCHAR(50) NOT NULL, -- 'purchase', 'lead', 'signup', 'custom'
  conversion_name VARCHAR(200),
  conversion_value DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Attribution model credits
  first_touch_credit DECIMAL(5,2) DEFAULT 0,
  last_touch_credit DECIMAL(5,2) DEFAULT 0,
  linear_credit DECIMAL(5,2) DEFAULT 0,
  
  -- Touchpoints in conversion path
  touchpoints_count INTEGER DEFAULT 0,
  touchpoints_path JSONB DEFAULT '[]'::jsonb,
  
  -- Time to conversion
  days_to_conversion INTEGER DEFAULT 0,
  sessions_to_conversion INTEGER DEFAULT 0,
  
  -- Timestamps
  converted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. TABELLA CHANNEL PERFORMANCE
-- ============================================
CREATE TABLE IF NOT EXISTS attribution_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Channel identification
  channel_name VARCHAR(100) NOT NULL,
  source VARCHAR(100),
  medium VARCHAR(100),
  
  -- Date for daily aggregation
  date DATE DEFAULT CURRENT_DATE,
  
  -- Metrics
  impressions INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  
  -- Engagement
  avg_session_duration INTEGER DEFAULT 0, -- seconds
  avg_pages_per_session DECIMAL(5,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Conversions
  conversions INTEGER DEFAULT 0,
  conversion_value DECIMAL(10,2) DEFAULT 0,
  
  -- Attribution credits
  first_touch_conversions INTEGER DEFAULT 0,
  last_touch_conversions INTEGER DEFAULT 0,
  assisted_conversions INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(channel_name, source, medium, date)
);

-- ============================================
-- 5. AGGIUNGI user_id A TRACKING_SESSIONS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tracking_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tracking_sessions ADD COLUMN user_id VARCHAR;
  END IF;
END $$;

-- ============================================
-- 6. INDICI PER PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tracking_users_user_id ON tracking_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_users_first_seen ON tracking_users(first_seen_at);
CREATE INDEX IF NOT EXISTS idx_tracking_users_last_seen ON tracking_users(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_tracking_users_lifecycle ON tracking_users(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_tracking_users_first_source ON tracking_users(first_touch_source);

CREATE INDEX IF NOT EXISTS idx_touchpoints_user_id ON attribution_touchpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_touchpoints_session_id ON attribution_touchpoints(session_id);
CREATE INDEX IF NOT EXISTS idx_touchpoints_type ON attribution_touchpoints(touchpoint_type);
CREATE INDEX IF NOT EXISTS idx_touchpoints_timestamp ON attribution_touchpoints(timestamp);
CREATE INDEX IF NOT EXISTS idx_touchpoints_conversion ON attribution_touchpoints(is_conversion) WHERE is_conversion = TRUE;
CREATE INDEX IF NOT EXISTS idx_touchpoints_funnel ON attribution_touchpoints(funnel_id) WHERE funnel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON attribution_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_type ON attribution_conversions(conversion_type);
CREATE INDEX IF NOT EXISTS idx_conversions_date ON attribution_conversions(converted_at);

CREATE INDEX IF NOT EXISTS idx_channels_name ON attribution_channels(channel_name);
CREATE INDEX IF NOT EXISTS idx_channels_date ON attribution_channels(date);
CREATE INDEX IF NOT EXISTS idx_channels_source_medium ON attribution_channels(source, medium);

-- ============================================
-- 7. FUNZIONE: Incrementa sessioni utente
-- ============================================
CREATE OR REPLACE FUNCTION increment_user_sessions(p_user_id VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE tracking_users 
  SET 
    total_sessions = total_sessions + 1,
    last_seen_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. FUNZIONE: Aggiorna last-touch attribution
-- ============================================
CREATE OR REPLACE FUNCTION update_last_touch_attribution(
  p_user_id VARCHAR,
  p_source VARCHAR,
  p_medium VARCHAR,
  p_campaign VARCHAR,
  p_content VARCHAR,
  p_term VARCHAR,
  p_referrer TEXT,
  p_landing_page TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE tracking_users 
  SET 
    last_touch_source = COALESCE(p_source, last_touch_source),
    last_touch_medium = COALESCE(p_medium, last_touch_medium),
    last_touch_campaign = COALESCE(p_campaign, last_touch_campaign),
    last_touch_content = COALESCE(p_content, last_touch_content),
    last_touch_term = COALESCE(p_term, last_touch_term),
    last_touch_referrer = COALESCE(p_referrer, last_touch_referrer),
    last_touch_landing_page = COALESCE(p_landing_page, last_touch_landing_page),
    last_seen_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. FUNZIONE: Registra conversione
-- ============================================
CREATE OR REPLACE FUNCTION record_conversion(
  p_user_id VARCHAR,
  p_session_id VARCHAR,
  p_conversion_type VARCHAR,
  p_conversion_name VARCHAR,
  p_conversion_value DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_conversion_id UUID;
  v_touchpoints_count INTEGER;
  v_first_touchpoint TIMESTAMP;
  v_days_to_conversion INTEGER;
  v_sessions_count INTEGER;
BEGIN
  -- Conta touchpoints
  SELECT COUNT(*), MIN(created_at)
  INTO v_touchpoints_count, v_first_touchpoint
  FROM attribution_touchpoints
  WHERE user_id = p_user_id;
  
  -- Calcola giorni alla conversione
  v_days_to_conversion := EXTRACT(DAY FROM NOW() - v_first_touchpoint);
  
  -- Conta sessioni uniche
  SELECT COUNT(DISTINCT session_id)
  INTO v_sessions_count
  FROM attribution_touchpoints
  WHERE user_id = p_user_id;
  
  -- Inserisci conversione
  INSERT INTO attribution_conversions (
    user_id,
    session_id,
    conversion_type,
    conversion_name,
    conversion_value,
    touchpoints_count,
    days_to_conversion,
    sessions_to_conversion,
    first_touch_credit,
    last_touch_credit,
    linear_credit
  ) VALUES (
    p_user_id,
    p_session_id,
    p_conversion_type,
    p_conversion_name,
    p_conversion_value,
    v_touchpoints_count,
    v_days_to_conversion,
    v_sessions_count,
    p_conversion_value, -- First touch gets 100%
    p_conversion_value, -- Last touch gets 100%
    p_conversion_value / GREATEST(v_touchpoints_count, 1) -- Linear divides equally
  ) RETURNING id INTO v_conversion_id;
  
  -- Aggiorna utente
  UPDATE tracking_users
  SET 
    total_conversions = total_conversions + 1,
    total_revenue = total_revenue + p_conversion_value,
    lifecycle_stage = CASE 
      WHEN lifecycle_stage = 'visitor' THEN 'customer'
      WHEN lifecycle_stage = 'lead' THEN 'customer'
      WHEN lifecycle_stage = 'customer' THEN 'returning_customer'
      ELSE lifecycle_stage
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN v_conversion_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. VIEW: Attribution Overview
-- ============================================
CREATE OR REPLACE VIEW attribution_overview AS
SELECT 
  DATE(first_seen_at) as date,
  COUNT(*) as new_users,
  COUNT(*) FILTER (WHERE total_sessions > 1) as returning_users,
  SUM(total_sessions) as total_sessions,
  SUM(total_pageviews) as total_pageviews,
  SUM(total_conversions) as total_conversions,
  SUM(total_revenue) as total_revenue,
  ROUND(AVG(total_sessions), 2) as avg_sessions_per_user,
  COUNT(*) FILTER (WHERE lifecycle_stage = 'customer') as customers,
  COUNT(*) FILTER (WHERE lifecycle_stage = 'returning_customer') as returning_customers
FROM tracking_users
GROUP BY DATE(first_seen_at)
ORDER BY date DESC;

-- ============================================
-- 11. VIEW: Channel Attribution
-- ============================================
CREATE OR REPLACE VIEW channel_attribution_view AS
SELECT 
  COALESCE(first_touch_source, 'direct') as channel,
  COALESCE(first_touch_medium, 'none') as medium,
  COUNT(*) as users,
  SUM(total_sessions) as sessions,
  SUM(total_conversions) as conversions,
  SUM(total_revenue) as revenue,
  ROUND(
    SUM(total_conversions)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 
    2
  ) as conversion_rate,
  ROUND(
    SUM(total_revenue) / NULLIF(SUM(total_conversions), 0), 
    2
  ) as avg_order_value
FROM tracking_users
GROUP BY first_touch_source, first_touch_medium
ORDER BY users DESC;

-- ============================================
-- 12. VIEW: User Journey Analysis
-- ============================================
CREATE OR REPLACE VIEW user_journey_analysis AS
SELECT 
  u.user_id,
  u.first_seen_at,
  u.last_seen_at,
  u.total_sessions,
  u.total_conversions,
  u.total_revenue,
  u.lifecycle_stage,
  u.first_touch_source,
  u.first_touch_medium,
  u.first_touch_campaign,
  u.last_touch_source,
  u.last_touch_medium,
  COUNT(t.id) as touchpoints_count,
  EXTRACT(DAY FROM u.last_seen_at - u.first_seen_at) as customer_lifetime_days
FROM tracking_users u
LEFT JOIN attribution_touchpoints t ON u.user_id = t.user_id
GROUP BY u.user_id, u.first_seen_at, u.last_seen_at, u.total_sessions, 
         u.total_conversions, u.total_revenue, u.lifecycle_stage,
         u.first_touch_source, u.first_touch_medium, u.first_touch_campaign,
         u.last_touch_source, u.last_touch_medium
ORDER BY u.last_seen_at DESC;

-- ============================================
-- COMMENTI
-- ============================================
COMMENT ON TABLE tracking_users IS 'Utenti univoci con first-party ID persistente per attribution';
COMMENT ON TABLE attribution_touchpoints IS 'Ogni interazione utente nel customer journey';
COMMENT ON TABLE attribution_conversions IS 'Conversioni con attribution multi-touch';
COMMENT ON TABLE attribution_channels IS 'Performance aggregata per canale/sorgente';
COMMENT ON COLUMN tracking_users.user_id IS 'ID persistente first-party (localStorage + cookie)';
COMMENT ON COLUMN tracking_users.lifecycle_stage IS 'visitor → lead → customer → returning_customer';
