-- Add receipt_date to receipt_image_hashes to prevent false positive collisions
-- Option A from HASH_COLLISION_FIX_PLAN.md

-- 1. Add the column
ALTER TABLE receipt_image_hashes ADD COLUMN receipt_date DATE;

-- 2. Drop the old unique constraint (it was likely an auto-named constraint like receipt_image_hashes_user_id_image_hash_key)
-- We need to find the name or use a safe method to drop it.
-- In standard Supabase it usually follows the pattern: table_name_column1_column2_key
ALTER TABLE receipt_image_hashes DROP CONSTRAINT IF EXISTS receipt_image_hashes_user_id_image_hash_key;

-- 3. Add the new composite unique constraint including the date
-- This allows the same visual hash if the dates are different
ALTER TABLE receipt_image_hashes ADD UNIQUE (user_id, image_hash, receipt_date);

-- 4. Update the index for performance
DROP INDEX IF EXISTS idx_receipt_image_hashes_lookup;
CREATE INDEX idx_receipt_image_hashes_lookup ON receipt_image_hashes(user_id, image_hash, receipt_date);

COMMENT ON COLUMN receipt_image_hashes.receipt_date IS 'The parsed date of the receipt, used to allow similar visual layouts on different days';
