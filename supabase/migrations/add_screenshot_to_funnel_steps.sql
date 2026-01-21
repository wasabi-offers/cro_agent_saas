-- Add screenshot_url column to funnel_steps table
ALTER TABLE funnel_steps ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Add screenshot_captured_at timestamp
ALTER TABLE funnel_steps ADD COLUMN IF NOT EXISTS screenshot_captured_at TIMESTAMPTZ;
