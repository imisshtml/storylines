/*
  # Add players_online field to campaigns table

  1. Changes
    - Add `players_online` JSONB column to campaigns table
    - This will store online players as user_id -> character_name mapping
    - Add GIN index for efficient JSON queries

  2. Performance
    - Index on players_online for faster queries
*/

-- Add players_online column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS players_online JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_campaigns_players_online ON campaigns USING GIN (players_online); 