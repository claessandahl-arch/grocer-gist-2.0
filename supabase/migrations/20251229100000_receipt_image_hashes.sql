-- Create table to store image hashes for duplicate detection
CREATE TABLE receipt_image_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_hash TEXT NOT NULL,
  receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Each user can only have one receipt with a given hash
  UNIQUE(user_id, image_hash)
);

-- Enable RLS
ALTER TABLE receipt_image_hashes ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see/manage their own hashes
CREATE POLICY "Users can view their own hashes"
  ON receipt_image_hashes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hashes"
  ON receipt_image_hashes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hashes"
  ON receipt_image_hashes FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast hash lookups
CREATE INDEX idx_receipt_image_hashes_lookup 
  ON receipt_image_hashes(user_id, image_hash);

-- Add comment for documentation
COMMENT ON TABLE receipt_image_hashes IS 'Stores perceptual hashes of receipt images for duplicate detection before AI parsing';
