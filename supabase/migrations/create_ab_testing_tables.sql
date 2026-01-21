-- Table for tracking A/B test analyses
CREATE TABLE IF NOT EXISTS funnel_ab_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  analysis_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_analysis_date TIMESTAMPTZ,
  has_proposals BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending', -- pending, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for A/B test proposals
CREATE TABLE IF NOT EXISTS funnel_ab_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES funnel_ab_analyses(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'headline', 'cta', 'color', 'layout', etc.
  element TEXT NOT NULL,
  current_value TEXT,
  proposed_value TEXT,
  expected_impact TEXT,
  reasoning TEXT,
  status TEXT DEFAULT 'pending', -- pending, active, completed, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ab_analyses_funnel ON funnel_ab_analyses(funnel_id);
CREATE INDEX IF NOT EXISTS idx_ab_analyses_next_date ON funnel_ab_analyses(next_analysis_date);
CREATE INDEX IF NOT EXISTS idx_ab_proposals_funnel ON funnel_ab_proposals(funnel_id);
CREATE INDEX IF NOT EXISTS idx_ab_proposals_status ON funnel_ab_proposals(status);

-- Enable RLS
ALTER TABLE funnel_ab_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_ab_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all access to funnel_ab_analyses" ON funnel_ab_analyses FOR ALL USING (true);
CREATE POLICY "Allow all access to funnel_ab_proposals" ON funnel_ab_proposals FOR ALL USING (true);
