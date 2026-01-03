-- Fix global_product_mappings with English category keys to Swedish canonical keys
-- This migration standardizes categories to match categoryConstants.ts

-- ============================================================
-- STEP 1: Fix English → Swedish category key mappings
-- ============================================================

-- dairy → mejeri
UPDATE public.global_product_mappings 
SET category = 'mejeri' 
WHERE category = 'dairy';

-- beverages → drycker
UPDATE public.global_product_mappings 
SET category = 'drycker' 
WHERE category = 'beverages';

-- fruits_vegetables → frukt_och_gront
UPDATE public.global_product_mappings 
SET category = 'frukt_och_gront' 
WHERE category = 'fruits_vegetables';

-- bread_bakery → brod_bageri
UPDATE public.global_product_mappings 
SET category = 'brod_bageri' 
WHERE category = 'bread_bakery';

-- frozen → frysvaror
UPDATE public.global_product_mappings 
SET category = 'frysvaror' 
WHERE category = 'frozen';

-- pantry → skafferi
UPDATE public.global_product_mappings 
SET category = 'skafferi' 
WHERE category = 'pantry';

-- snacks_candy → sotsaker_snacks
UPDATE public.global_product_mappings 
SET category = 'sotsaker_snacks' 
WHERE category = 'snacks_candy';

-- household → hushall_hygien
UPDATE public.global_product_mappings 
SET category = 'hushall_hygien' 
WHERE category = 'household';

-- ============================================================
-- STEP 2: Fix meat_fish - split into kott_fagel_chark and fisk_skaldjur
-- Based on product names: Lax/Laxfilé → fisk_skaldjur, all others → kott_fagel_chark
-- ============================================================

-- Fish products → fisk_skaldjur
UPDATE public.global_product_mappings 
SET category = 'fisk_skaldjur' 
WHERE category = 'meat_fish' 
  AND (original_name ILIKE '%lax%' 
    OR original_name ILIKE '%fisk%' 
    OR original_name ILIKE '%skaldjur%'
    OR original_name ILIKE '%räk%'
    OR original_name ILIKE '%torsk%'
    OR original_name ILIKE '%sill%');

-- Remaining meat products → kott_fagel_chark
UPDATE public.global_product_mappings 
SET category = 'kott_fagel_chark' 
WHERE category = 'meat_fish';

-- ============================================================
-- STEP 3: Fix inconsistent Swedish variant
-- ============================================================

-- frukt_gront → frukt_och_gront (in case any exist)
UPDATE public.global_product_mappings 
SET category = 'frukt_och_gront' 
WHERE category = 'frukt_gront';

-- ============================================================
-- Also update user mappings with the same fixes
-- ============================================================

-- English → Swedish fixes for user mappings
UPDATE public.product_mappings SET category = 'mejeri' WHERE category = 'dairy';
UPDATE public.product_mappings SET category = 'drycker' WHERE category = 'beverages';
UPDATE public.product_mappings SET category = 'frukt_och_gront' WHERE category = 'fruits_vegetables';
UPDATE public.product_mappings SET category = 'brod_bageri' WHERE category = 'bread_bakery';
UPDATE public.product_mappings SET category = 'frysvaror' WHERE category = 'frozen';
UPDATE public.product_mappings SET category = 'skafferi' WHERE category = 'pantry';
UPDATE public.product_mappings SET category = 'sotsaker_snacks' WHERE category = 'snacks_candy';
UPDATE public.product_mappings SET category = 'hushall_hygien' WHERE category = 'household';

-- Split meat_fish for user mappings
UPDATE public.product_mappings 
SET category = 'fisk_skaldjur' 
WHERE category = 'meat_fish' 
  AND (original_name ILIKE '%lax%' 
    OR original_name ILIKE '%fisk%' 
    OR original_name ILIKE '%skaldjur%'
    OR original_name ILIKE '%räk%'
    OR original_name ILIKE '%torsk%'
    OR original_name ILIKE '%sill%');

UPDATE public.product_mappings 
SET category = 'kott_fagel_chark' 
WHERE category = 'meat_fish';

-- Fix Swedish variant
UPDATE public.product_mappings 
SET category = 'frukt_och_gront' 
WHERE category = 'frukt_gront';
