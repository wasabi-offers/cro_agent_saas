-- Create competitors table for competitor monitoring
CREATE TABLE IF NOT EXISTS competitors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  logo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_competitors_status ON competitors(status);
CREATE INDEX IF NOT EXISTS idx_competitors_created_at ON competitors(created_at DESC);
