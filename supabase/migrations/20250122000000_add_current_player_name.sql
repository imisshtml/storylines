/*
  # Add current_player_name to campaigns table

  1. Changes
    - Add `current_player_name` column to campaigns table
    - This will store the character name for display purposes
    - Keeps the current_player UUID for lookups but adds name for performance

  2. Performance
    - Index on current_player_name for faster queries
*/

-- Add current_player_name column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS current_player_name text;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_current_player_name ON campaigns(current_player_name);

-- Update existing campaigns to populate current_player_name from characters table
UPDATE campaigns 
SET current_player_name = characters.name
FROM characters 
WHERE campaigns.current_player = characters.id 
AND campaigns.current_player_name IS NULL; 