-- Add missing UPDATE policy for receipt_image_hashes table
-- This is needed so the frontend can link hash to receipt_id after receipt creation

CREATE POLICY "Users can update their own hashes"
  ON receipt_image_hashes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
