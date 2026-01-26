-- ============================================
-- CRO AGENT SAAS - SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor to create all tables

-- ============================================
-- 1. PRODUCTS TABLE (Folders for organizing funnels)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#7c5cff', -- Default purple color for folder
  icon TEXT, -- Optional icon name (lucide icon)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id TEXT -- Optional: for multi-user support
);

-- ============================================
-- 2. FUNNELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS funnels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  conversion_rate NUMERIC NOT NULL DEFAULT 0,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL, -- Link to product/folder
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id TEXT, -- Optional: for multi-user support
  description TEXT
);

-- ============================================
-- 2. FUNNEL STEPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS funnel_steps (
  id TEXT PRIMARY KEY,
  funnel_id TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  visitors INTEGER NOT NULL DEFAULT 0,
  dropoff NUMERIC NOT NULL DEFAULT 0,
  step_order INTEGER NOT NULL, -- Order of step in funnel
  position_x NUMERIC, -- For visual builder position
  position_y NUMERIC, -- For visual builder position
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 3. FUNNEL CONNECTIONS TABLE (for non-linear funnels)
-- ============================================
CREATE TABLE IF NOT EXISTS funnel_connections (
  id TEXT PRIMARY KEY,
  funnel_id TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  source_step_id TEXT NOT NULL REFERENCES funnel_steps(id) ON DELETE CASCADE,
  target_step_id TEXT NOT NULL REFERENCES funnel_steps(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(funnel_id, source_step_id, target_step_id)
);

-- ============================================
-- 4. LANDING PAGES ANALYZED
-- ============================================
CREATE TABLE IF NOT EXISTS landing_pages_analyzed (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  analysis_results JSONB NOT NULL, -- Stores the full analysis results
  cro_table JSONB, -- Stores CRO comparison table
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id TEXT,
  page_title TEXT,
  screenshot_url TEXT
);

-- ============================================
-- 5. A/B TEST SUGGESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS ab_test_suggestions (
  id TEXT PRIMARY KEY,
  funnel_id TEXT REFERENCES funnels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  expected_impact TEXT,
  effort TEXT,
  type TEXT, -- e.g., "Copy", "Design", "CTA", "Layout"
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id TEXT
);

-- ============================================
-- 6. CRO ANALYSES (for funnels)
-- ============================================
CREATE TABLE IF NOT EXISTS cro_analyses (
  id TEXT PRIMARY KEY,
  funnel_id TEXT REFERENCES funnels(id) ON DELETE CASCADE,
  landing_page_id TEXT REFERENCES landing_pages_analyzed(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('funnel', 'landing_page')),
  insights JSONB NOT NULL, -- Array of insights
  cro_table JSONB, -- CRO decision table
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id TEXT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_funnels_product_id ON funnels(product_id);
CREATE INDEX IF NOT EXISTS idx_funnel_steps_funnel_id ON funnel_steps(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_steps_order ON funnel_steps(funnel_id, step_order);
CREATE INDEX IF NOT EXISTS idx_funnel_connections_funnel ON funnel_connections(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_connections_source ON funnel_connections(source_step_id);
CREATE INDEX IF NOT EXISTS idx_funnel_connections_target ON funnel_connections(target_step_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_url ON landing_pages_analyzed(url);
CREATE INDEX IF NOT EXISTS idx_ab_tests_funnel ON ab_test_suggestions(funnel_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_priority ON ab_test_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_test_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_cro_analyses_funnel ON cro_analyses(funnel_id);
CREATE INDEX IF NOT EXISTS idx_cro_analyses_landing ON cro_analyses(landing_page_id);

-- ============================================
-- FUNCTIONS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON funnels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_test_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- ============================================
-- Enable RLS on all tables if you want user-level security
-- ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE funnel_steps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE funnel_connections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE landing_pages_analyzed ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ab_test_suggestions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cro_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies (example for public access - modify based on your auth needs)
-- CREATE POLICY "Allow all for funnels" ON funnels FOR ALL USING (true);
-- CREATE POLICY "Allow all for funnel_steps" ON funnel_steps FOR ALL USING (true);
-- CREATE POLICY "Allow all for funnel_connections" ON funnel_connections FOR ALL USING (true);
-- CREATE POLICY "Allow all for landing_pages_analyzed" ON landing_pages_analyzed FOR ALL USING (true);
-- CREATE POLICY "Allow all for ab_test_suggestions" ON ab_test_suggestions FOR ALL USING (true);
-- CREATE POLICY "Allow all for cro_analyses" ON cro_analyses FOR ALL USING (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert sample data:
/*
INSERT INTO funnels (id, name, conversion_rate) VALUES
  ('funnel_1', 'E-commerce Checkout', 24.5),
  ('funnel_2', 'SaaS Free Trial', 18.3);

INSERT INTO funnel_steps (id, funnel_id, name, url, visitors, dropoff, step_order) VALUES
  ('step_1', 'funnel_1', 'Landing Page', 'https://example.com', 10000, 0, 1),
  ('step_2', 'funnel_1', 'Product Page', 'https://example.com/product', 7500, 25, 2),
  ('step_3', 'funnel_1', 'Cart', 'https://example.com/cart', 5000, 33.3, 3),
  ('step_4', 'funnel_1', 'Checkout', 'https://example.com/checkout', 3000, 40, 4),
  ('step_5', 'funnel_1', 'Thank You', 'https://example.com/thanks', 2450, 18.3, 5);
*/
