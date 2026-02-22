-- Create competitor_snapshots table for storing daily screenshots and CRO analysis
CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id TEXT PRIMARY KEY,
  competitor_id TEXT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  screenshot_base64 TEXT,
  page_title TEXT,
  page_meta_description TEXT,
  viewport_width INTEGER DEFAULT 1280,
  viewport_height INTEGER DEFAULT 900,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_result JSONB,
  changes_detected BOOLEAN DEFAULT FALSE,
  change_severity TEXT DEFAULT 'none' CHECK (change_severity IN ('none', 'minor', 'moderate', 'major')),
  change_summary TEXT,
  cro_score INTEGER,
  previous_snapshot_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_competitor_id ON competitor_snapshots(competitor_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at ON competitor_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_competitor_captured ON competitor_snapshots(competitor_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_changes ON competitor_snapshots(changes_detected) WHERE changes_detected = TRUE;

-- Add last_analyzed_at column to competitors table
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS last_cro_score INTEGER;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS total_changes_detected INTEGER DEFAULT 0;
