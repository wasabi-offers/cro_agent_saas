-- Add group/folder field to competitors table
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS folder TEXT;

-- Index for group-based filtering
CREATE INDEX IF NOT EXISTS idx_competitors_folder ON competitors(folder);
