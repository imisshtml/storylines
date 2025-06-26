/*
  # Fix Campaign RLS Policies

  The combined RLS policy is blocking access. Split it back into separate policies
  for better clarity and to ensure both owner and player access work correctly.

  1. Drop the problematic combined policy
  2. Recreate separate policies for:
     - Owners can view their campaigns
     - Players can view campaigns they're part of
  3. Fix the JSONB query logic
*/

-- Drop the problematic combined policy
DROP POLICY IF EXISTS "Users can view campaigns they are invited to" ON campaigns;
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns;

-- Recreate separate policies with correct logic
CREATE POLICY "Users can view their own campaigns"
  ON campaigns
  FOR SELECT
  USING (owner = auth.uid());

CREATE POLICY "Users can view campaigns they are players in"
  ON campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(players) AS player
      WHERE (player->>'id')::uuid = auth.uid()
    )
  );

-- Also fix the update policy
DROP POLICY IF EXISTS "Users can update campaigns they participate in" ON campaigns;

CREATE POLICY "Users can update their own campaigns"
  ON campaigns
  FOR UPDATE
  USING (owner = auth.uid());

CREATE POLICY "Users can update campaigns they are players in"
  ON campaigns
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(players) AS player
      WHERE (player->>'id')::uuid = auth.uid()
    )
  ); 