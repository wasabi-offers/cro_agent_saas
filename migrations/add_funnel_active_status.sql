-- ============================================
-- ADD ACTIVE STATUS TO FUNNELS
-- ============================================
-- This migration adds is_active field to funnels table

-- Add is_active column (defaults to true for existing funnels)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'funnels' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE funnels ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
  END IF;
END $$;

-- Create index for filtering active funnels
CREATE INDEX IF NOT EXISTS idx_funnels_active ON funnels(is_active);
