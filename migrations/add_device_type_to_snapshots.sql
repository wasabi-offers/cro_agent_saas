-- Add device_type column to competitor_snapshots for mobile/desktop tracking
ALTER TABLE competitor_snapshots
ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'desktop';

-- Update existing snapshots to be marked as desktop
UPDATE competitor_snapshots SET device_type = 'desktop' WHERE device_type IS NULL;

-- Create index for efficient filtering by device type
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_device_type
ON competitor_snapshots (competitor_id, device_type, captured_at DESC);
