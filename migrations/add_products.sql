-- ============================================
-- ADD PRODUCTS/FOLDERS STRUCTURE
-- ============================================
-- This migration adds product/folder organization for funnels

-- ============================================
-- 1. CREATE PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#7c5cff', -- Default purple color
  icon TEXT, -- Optional icon name (lucide icon)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id TEXT -- Optional: for multi-user support
);

-- ============================================
-- 2. ADD PRODUCT_ID TO FUNNELS TABLE
-- ============================================
-- Add column (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'funnels' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE funnels ADD COLUMN product_id TEXT REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 3. CREATE DEFAULT PRODUCT FOR EXISTING FUNNELS
-- ============================================
-- Insert a default "Uncategorized" product if there are funnels without products
INSERT INTO products (id, name, description, color, icon)
VALUES (
  'product_default',
  'Uncategorized',
  'Default folder for funnels without a product',
  '#666666',
  'Folder'
)
ON CONFLICT (id) DO NOTHING;

-- Assign existing funnels to default product (only if product_id is NULL)
UPDATE funnels
SET product_id = 'product_default'
WHERE product_id IS NULL;

-- ============================================
-- 4. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_funnels_product_id ON funnels(product_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- ============================================
-- 5. CREATE TRIGGER FOR AUTO-UPDATE
-- ============================================
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ADD RLS POLICIES (Optional - commented out)
-- ============================================
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for products" ON products FOR ALL USING (true);
