/*
  # Add Character Level Tracking

  1. New Columns
    - `previous_level` (integer) - Tracks the previous level for level-up detection
    - Add function to get character level

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add previous_level column to characters table
ALTER TABLE characters ADD COLUMN IF NOT EXISTS previous_level INTEGER;

-- Update existing characters to set previous_level equal to level
-- This prevents existing characters from triggering level-up notifications
UPDATE characters SET previous_level = level WHERE previous_level IS NULL;

-- Create function to get character level
CREATE OR REPLACE FUNCTION get_character_level(character_id UUID)
RETURNS INTEGER AS $$
DECLARE
    char_level INTEGER;
BEGIN
    SELECT level INTO char_level FROM characters WHERE id = character_id;
    RETURN char_level;
END;
$$ LANGUAGE plpgsql;

-- Create function to perform level up
CREATE OR REPLACE FUNCTION level_up_character(character_id UUID, new_level INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Store the current level as previous_level
    UPDATE characters 
    SET 
        previous_level = level,
        level = new_level
    WHERE id = character_id;
END;
$$ LANGUAGE plpgsql;