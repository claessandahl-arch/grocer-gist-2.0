-- Migration: Enhanced Price Comparison View with Category-Aware Units
-- Description: Updates view_price_comparison to use category-based comparison units
-- and join with product_unit_info for overrides. Conservative approach: only normalize
-- when we have high-confidence unit data.

-- Drop existing view first
DROP VIEW IF EXISTS public.view_price_comparison;

-- Create enhanced view
CREATE OR REPLACE VIEW public.view_price_comparison AS
WITH exploded_items AS (
    -- Extract individual items from receipts JSONB
    SELECT 
        r.id as receipt_id,
        r.user_id,
        r.store_name,
        r.receipt_date,
        item->>'name' as original_name,
        (item->>'price')::DECIMAL as price,
        COALESCE((item->>'quantity')::DECIMAL, 1) as quantity,
        -- Extract unit fields from receipt
        item->>'quantity_unit' as receipt_quantity_unit,
        (item->>'content_amount')::DECIMAL as receipt_content_amount,
        item->>'content_unit' as receipt_content_unit,
        -- Check for ignored flag
        COALESCE((item->>'ignored')::BOOLEAN, false) as is_ignored
    FROM 
        public.receipts r,
        jsonb_array_elements(r.items) as item
    WHERE 
        r.user_id = auth.uid()
        -- Filter out Pant/Deposit items
        AND LOWER(item->>'name') NOT LIKE '%pant%' 
        AND LOWER(item->>'name') NOT LIKE '%deposit%'
        -- Filter out very low price items (outliers/adjustments)
        AND (item->>'price')::DECIMAL > 5.00
),
mapped_items AS (
    -- Join with product_mappings to get mapped_name and category
    SELECT 
        ei.*,
        COALESCE(pm.mapped_name, ei.original_name) as mapped_name,
        COALESCE(pm.category, 'other') as category,
        
        -- Original content info from receipt/mapping
        COALESCE(ei.receipt_content_amount, pm.quantity_amount) as raw_content_amount,
        COALESCE(ei.receipt_content_unit, ei.receipt_quantity_unit, pm.quantity_unit) as raw_content_unit
    FROM 
        exploded_items ei
    LEFT JOIN 
        public.product_mappings pm ON ei.original_name = pm.original_name AND pm.user_id = auth.uid()
    WHERE
        ei.is_ignored = false
),
normalized_items AS (
    -- Normalize content to base units and determine comparison unit
    SELECT 
        mi.*,
        
        -- Determine the expected comparison unit based on category
        CASE mi.category
            -- Weight-based (kr/kg)
            WHEN 'frukt_och_gront' THEN 'kg'
            WHEN 'kott_fagel_chark' THEN 'kg'
            WHEN 'fisk_skaldjur' THEN 'kg'
            WHEN 'delikatess' THEN 'kg'
            WHEN 'skafferi' THEN 'kg'
            WHEN 'sotsaker_snacks' THEN 'kg'
            WHEN 'frysvaror' THEN 'kg'
            -- Volume-based (kr/L)
            WHEN 'drycker' THEN 'L'
            -- Unit-based (kr/st)
            ELSE 'st'
        END as expected_comparison_unit,
        
        -- Normalize content amount to base units (kg or L)
        CASE 
            -- Weight conversions to kg
            WHEN LOWER(mi.raw_content_unit) IN ('kg', 'kilo') THEN mi.raw_content_amount
            WHEN LOWER(mi.raw_content_unit) IN ('g', 'gr', 'gram') THEN mi.raw_content_amount / 1000.0
            -- Volume conversions to L
            WHEN LOWER(mi.raw_content_unit) IN ('l', 'liter', 'litre') THEN mi.raw_content_amount
            WHEN LOWER(mi.raw_content_unit) = 'dl' THEN mi.raw_content_amount / 10.0
            WHEN LOWER(mi.raw_content_unit) = 'cl' THEN mi.raw_content_amount / 100.0
            WHEN LOWER(mi.raw_content_unit) IN ('ml', 'milliliter') THEN mi.raw_content_amount / 1000.0
            ELSE NULL
        END as normalized_amount,
        
        -- Determine the normalized unit type
        CASE 
            WHEN LOWER(mi.raw_content_unit) IN ('kg', 'kilo', 'g', 'gr', 'gram') THEN 'kg'
            WHEN LOWER(mi.raw_content_unit) IN ('l', 'liter', 'litre', 'dl', 'cl', 'ml', 'milliliter') THEN 'L'
            WHEN mi.raw_content_unit IS NOT NULL THEN 'st'
            ELSE NULL
        END as normalized_unit
    FROM mapped_items mi
),
final_calculation AS (
    SELECT 
        ni.*,
        
        -- Check if unit override exists in product_unit_info
        pui.comparison_unit as override_unit,
        pui.base_amount as override_amount,
        pui.confidence as override_confidence,
        
        -- Determine actual comparison unit to use
        -- Priority: 1) override, 2) normalized data matches expected, 3) fallback to 'st'
        COALESCE(
            pui.comparison_unit,
            CASE 
                -- Only use normalized unit if it matches what we expect for the category
                -- This is the "conservative" approach
                WHEN ni.normalized_unit = ni.expected_comparison_unit AND ni.normalized_amount IS NOT NULL 
                THEN ni.normalized_unit
                ELSE 'st'
            END
        ) as actual_comparison_unit,
        
        -- Determine if we have high-confidence unit data
        CASE
            WHEN pui.confidence >= 0.8 THEN true
            WHEN ni.normalized_unit IS NOT NULL AND ni.normalized_amount IS NOT NULL THEN true
            ELSE false
        END as has_unit_data,
        
        -- Flag: should this product be compared differently but we lack data?
        CASE
            WHEN ni.expected_comparison_unit != 'st' 
                 AND ni.normalized_unit IS NULL 
                 AND pui.comparison_unit IS NULL
            THEN true
            ELSE false
        END as missing_expected_unit_data
        
    FROM normalized_items ni
    LEFT JOIN public.product_unit_info pui 
        ON ni.mapped_name = pui.mapped_name 
        AND (pui.user_id = auth.uid() OR pui.user_id IS NULL)
)
SELECT 
    mapped_name,
    category,
    actual_comparison_unit as quantity_unit,
    expected_comparison_unit,
    missing_expected_unit_data,
    
    -- Calculate price per comparison unit
    -- For 'st': price / quantity
    -- For 'kg' or 'L': price / (quantity * normalized_amount) - only if we have the data
    CASE actual_comparison_unit
        WHEN 'st' THEN MIN(price / quantity)
        ELSE MIN(
            CASE 
                WHEN normalized_amount IS NOT NULL AND normalized_amount > 0 
                THEN price / (quantity * normalized_amount)
                ELSE price / quantity  -- fallback
            END
        )
    END as min_price_per_unit,
    
    CASE actual_comparison_unit
        WHEN 'st' THEN AVG(price / quantity)
        ELSE AVG(
            CASE 
                WHEN normalized_amount IS NOT NULL AND normalized_amount > 0 
                THEN price / (quantity * normalized_amount)
                ELSE price / quantity
            END
        )
    END as avg_price_per_unit,
    
    CASE actual_comparison_unit
        WHEN 'st' THEN MAX(price / quantity)
        ELSE MAX(
            CASE 
                WHEN normalized_amount IS NOT NULL AND normalized_amount > 0 
                THEN price / (quantity * normalized_amount)
                ELSE price / quantity
            END
        )
    END as max_price_per_unit,
    
    -- Find best store
    (SELECT store_name FROM final_calculation sub 
     WHERE sub.mapped_name = main.mapped_name 
       AND sub.actual_comparison_unit = main.actual_comparison_unit
       AND CASE sub.actual_comparison_unit
             WHEN 'st' THEN sub.price / sub.quantity
             ELSE COALESCE(sub.price / NULLIF(sub.quantity * sub.normalized_amount, 0), sub.price / sub.quantity)
           END = MIN(main.price / CASE main.actual_comparison_unit
                                    WHEN 'st' THEN main.quantity
                                    ELSE COALESCE(NULLIF(main.quantity * main.normalized_amount, 0), main.quantity)
                                  END)
     LIMIT 1) as best_store_name,
     
    COUNT(*) as data_points,
    
    -- Additional metadata for UI
    BOOL_OR(has_unit_data) as has_reliable_unit_data
FROM 
    final_calculation main
GROUP BY 
    mapped_name, 
    category,
    actual_comparison_unit, 
    expected_comparison_unit,
    missing_expected_unit_data;

-- Grant access to the view
GRANT SELECT ON public.view_price_comparison TO authenticated;
GRANT SELECT ON public.view_price_comparison TO service_role;

-- Add comment
COMMENT ON VIEW public.view_price_comparison IS 
  'Price comparison view with category-aware unit normalization.
   Products are compared per kg, per L, or per unit based on category.
   missing_expected_unit_data=true indicates product should show warning indicator.';
