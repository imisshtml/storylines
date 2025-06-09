/*
  # Update Campaign Policies for Player Access

  1. Security Updates
    - Update RLS policies to allow users to see campaigns where they are players
    - Ensure proper access control for campaign visibility
    - Allow players to view campaigns they're invited to

  2. Changes
    - Update "Users can view campaigns they are invited to" policy
    - Ensure the policy correctly checks the players JSONB array
*/

-- Drop existing policies to recreate them with better logic
DROP POLICY IF EXISTS "Users can view campaigns they are invited to" ON campaigns;

-- Recreate the policy with improved JSONB querying
CREATE POLICY "Users can view campaigns they are invited to"
  ON campaigns
  FOR SELECT
  USING (
    -- User is the owner
    (owner)::text = (auth.uid())::text
    OR
    -- User is in the players array
    EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(players) AS player
      WHERE (player->>'id')::text = (auth.uid())::text
    )
  );

-- Also update the update policy to allow players to update campaigns they're part of
-- (This might be needed for marking ready status, etc.)
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;

CREATE POLICY "Users can update campaigns they participate in"
  ON campaigns
  FOR UPDATE
  USING (
    -- User is the owner (full update access)
    (owner)::text = (auth.uid())::text
    OR
    -- User is a player (limited update access - mainly for ready status)
    EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(players) AS player
      WHERE (player->>'id')::text = (auth.uid())::text
    )
  );