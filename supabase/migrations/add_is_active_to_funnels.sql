-- Add is_active column to funnels table
-- This column determines whether a funnel is included in the macro analysis

ALTER TABLE funnels
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN funnels.is_active IS 'Whether the funnel is active and included in macro analysis calculations';
