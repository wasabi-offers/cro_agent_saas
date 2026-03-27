-- Marketing Campaign Organizer - Database Schema

-- Tabella Campaigns (campagne marketing)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  channel VARCHAR(50) NOT NULL, -- email, social, ads, sms, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, in_editing, in_review, approved, launched, analyzing, completed
  target_audience TEXT,
  objectives TEXT,
  kpis JSONB, -- {ctr: 5, conversions: 100, engagement: 80}
  launch_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB -- dati extra flessibili
);

-- Tabella Campaign Copy (versioni del copy)
CREATE TABLE IF NOT EXISTS campaign_copy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  copy_type VARCHAR(50) NOT NULL, -- headline, body, cta, subject_line, etc.
  content TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'it',
  tone_of_voice VARCHAR(50), -- professional, casual, friendly, urgent, etc.
  is_current BOOLEAN DEFAULT true,
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT, -- prompt usato per generare il copy
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Tabella Campaign Reviews (feedback e approvazioni)
CREATE TABLE IF NOT EXISTS campaign_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  copy_id UUID REFERENCES campaign_copy(id) ON DELETE SET NULL,
  reviewer_name VARCHAR(255) NOT NULL,
  reviewer_email VARCHAR(255),
  review_type VARCHAR(50) NOT NULL, -- feedback, approval, rejection
  status VARCHAR(50) NOT NULL, -- pending, approved, rejected, changes_requested
  comments TEXT,
  inline_comments JSONB, -- [{position: 10, text: "cambia questo", resolved: false}]
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella Campaign Analytics (metriche post-lancio)
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr DECIMAL(5,2), -- click-through rate
  conversion_rate DECIMAL(5,2),
  engagement_rate DECIMAL(5,2),
  revenue DECIMAL(10,2),
  cost DECIMAL(10,2),
  roi DECIMAL(10,2), -- return on investment
  custom_metrics JSONB, -- metriche personalizzate
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, metric_date)
);

-- Tabella Campaign Assets (file allegati)
CREATE TABLE IF NOT EXISTS campaign_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL, -- image, video, document, design, etc.
  asset_name VARCHAR(255) NOT NULL,
  asset_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(100),
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Tabella Campaign Comments (discussioni sul copy)
CREATE TABLE IF NOT EXISTS campaign_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  copy_id UUID REFERENCES campaign_copy(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES campaign_comments(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255),
  comment_text TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_channel ON campaigns(channel);
CREATE INDEX idx_campaigns_launch_date ON campaigns(launch_date);
CREATE INDEX idx_campaign_copy_campaign_id ON campaign_copy(campaign_id);
CREATE INDEX idx_campaign_copy_is_current ON campaign_copy(is_current);
CREATE INDEX idx_campaign_reviews_campaign_id ON campaign_reviews(campaign_id);
CREATE INDEX idx_campaign_reviews_status ON campaign_reviews(status);
CREATE INDEX idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX idx_campaign_analytics_date ON campaign_analytics(metric_date);
CREATE INDEX idx_campaign_comments_campaign_id ON campaign_comments(campaign_id);

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_copy_updated_at BEFORE UPDATE ON campaign_copy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_reviews_updated_at BEFORE UPDATE ON campaign_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_analytics_updated_at BEFORE UPDATE ON campaign_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_comments_updated_at BEFORE UPDATE ON campaign_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
