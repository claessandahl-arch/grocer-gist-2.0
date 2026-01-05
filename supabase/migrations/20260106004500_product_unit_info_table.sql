-- Migration: Product Unit Info Table
-- Description: Creates table to store normalized unit information per product
-- for intelligent price comparison. Supports category-based defaults with
-- future admin override capability.

-- 1. Create product_unit_info table
CREATE TABLE IF NOT EXISTS public.product_unit_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product identification (keyed by mapped_name for consistency)
  mapped_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Category (cached for performance, can differ from product_mappings)
  category TEXT,
  
  -- Normalized content info (base units: kg, L, st)
  -- Example: Coca-Cola 1.5L → base_amount: 1.5, base_unit: 'L'
  base_amount DECIMAL,
  base_unit TEXT CHECK (base_unit IN ('kg', 'L', 'st')),
  
  -- Preferred comparison unit for this product
  -- If NULL, use category default from CATEGORY_COMPARISON_UNITS
  comparison_unit TEXT CHECK (comparison_unit IN ('kg', 'L', 'st')),
  
  -- Data source and confidence
  -- source: 'ai_extracted', 'name_pattern', 'category_default', 'admin_override'
  source TEXT NOT NULL DEFAULT 'category_default',
  confidence DECIMAL CHECK (confidence >= 0 AND confidence <= 1) DEFAULT 0.5,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one entry per product per user (NULL user_id = global default)
  UNIQUE (mapped_name, user_id)
);

-- 2. Create indexes for performance
CREATE INDEX idx_product_unit_info_mapped_name 
  ON public.product_unit_info(mapped_name);

CREATE INDEX idx_product_unit_info_user_id 
  ON public.product_unit_info(user_id);

CREATE INDEX idx_product_unit_info_category 
  ON public.product_unit_info(category);

CREATE INDEX idx_product_unit_info_lookup 
  ON public.product_unit_info(user_id, mapped_name);

-- 3. Enable RLS
ALTER TABLE public.product_unit_info ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can read their own entries + global entries (user_id IS NULL)
CREATE POLICY "Users can read own and global unit info"
  ON public.product_unit_info FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can insert their own entries
CREATE POLICY "Users can insert own unit info"
  ON public.product_unit_info FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own entries
CREATE POLICY "Users can update own unit info"
  ON public.product_unit_info FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own entries
CREATE POLICY "Users can delete own unit info"
  ON public.product_unit_info FOR DELETE
  USING (user_id = auth.uid());

-- 5. Grant permissions
GRANT SELECT ON public.product_unit_info TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_unit_info TO authenticated;
GRANT SELECT ON public.product_unit_info TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.product_unit_info TO service_role;

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION update_product_unit_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_unit_info_updated_at
  BEFORE UPDATE ON public.product_unit_info
  FOR EACH ROW
  EXECUTE FUNCTION update_product_unit_info_updated_at();

-- 7. Comment for documentation
COMMENT ON TABLE public.product_unit_info IS 
  'Stores normalized unit information for intelligent price comparison. 
   Products can be compared per kg, per L, or per unit based on category defaults 
   or admin overrides. NULL user_id indicates global default.';
