/*
  # Add intro_generated flag to campaigns table

  1. Changes
    - Add `intro_generated` boolean column to campaigns table
    - Default to false for existing campaigns
    - This prevents multiple intro generation attempts

  2. Purpose
    - Track whether initial intro story has been generated for a campaign
    - Prevent race conditions when multiple users join a campaign simultaneously
    - Move intro generation from frontend to backend for better control
*/

-- Add intro_generated column to campaigns table
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS intro_generated boolean NOT NULL DEFAULT false;

-- Add comment to document the purpose
COMMENT ON COLUMN campaigns.intro_generated IS 'Flag to track whether initial intro story has been generated to prevent duplicates';

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS campaigns_intro_generated_idx ON campaigns(intro_generated) WHERE intro_generated = false; 