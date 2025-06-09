/*
  # Remove updated_at trigger and column from campaigns

  1. Changes
    - Drop the trigger that updates updated_at field
    - Drop the updated_at column from campaigns table
    - Clean up any references to updated_at

  2. Security
    - No security changes needed
*/

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;

-- Drop the updated_at column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE campaigns DROP COLUMN updated_at;
  END IF;
END $$;

-- Drop the function if no other tables are using it
-- (We'll keep it for now in case other tables need it)
-- DROP FUNCTION IF EXISTS update_updated_at_column();