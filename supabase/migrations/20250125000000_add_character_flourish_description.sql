/*
  # Add Flourish and Description to Characters Table

  1. Add new columns to characters table
    - `flourish` (text, nullable) - Optional roleplay enhancement details
    - `description` (text, nullable) - Optional character appearance description

  2. These fields are optional and will be used to enhance storytelling
*/

-- Add flourish and description columns to characters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'flourish'
  ) THEN
    ALTER TABLE characters ADD COLUMN flourish text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'description'
  ) THEN
    ALTER TABLE characters ADD COLUMN description text;
  END IF;
END $$; 