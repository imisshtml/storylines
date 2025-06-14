/*
  # Create Player Actions System

  1. New Tables
    - `player_actions`
      - `id` (uuid, primary key)
      - `campaign_uid` (uuid, foreign key to campaigns.uid)
      - `character_id` (uuid, foreign key to characters.id)
      - `user_id` (uuid, foreign key to auth.users)
      - `action_type` (text) - 'base', 'llm_generated', 'contextual'
      - `action_data` (jsonb) - { title, description, requirements, etc. }
      - `game_mode` (text) - 'exploration', 'combat', 'social', 'rest'
      - `scene_id` (text) - For LLM-generated actions tied to specific scenes
      - `priority` (integer) - For ordering actions
      - `expires_at` (timestamptz) - For temporary LLM actions
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `player_actions` table
    - Add policies for campaign participants to read/write their actions

  3. Performance
    - Add indexes for efficient querying
    - Enable real-time updates
*/

-- Create player_actions table
CREATE TABLE IF NOT EXISTS player_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_uid uuid REFERENCES campaigns(uid) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('base', 'llm_generated', 'contextual')) DEFAULT 'base',
  action_data jsonb NOT NULL DEFAULT '{}',
  game_mode text NOT NULL CHECK (game_mode IN ('exploration', 'combat', 'social', 'rest')) DEFAULT 'exploration',
  scene_id text,
  priority integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE player_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for player actions
CREATE POLICY "Users can view actions for their campaigns"
  ON player_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.uid = campaign_uid
      AND (
        (c.owner)::text = (auth.uid())::text
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(c.players::jsonb) player
          WHERE (auth.uid())::text = (player->>'id')::text
        )
      )
    )
  );

CREATE POLICY "Users can insert actions for their characters"
  ON player_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_id AND c.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM campaigns camp
      WHERE camp.uid = campaign_uid
      AND (
        (camp.owner)::text = (auth.uid())::text
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(camp.players::jsonb) player
          WHERE (auth.uid())::text = (player->>'id')::text
        )
      )
    )
  );

CREATE POLICY "Users can update their own actions"
  ON player_actions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own actions"
  ON player_actions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_actions_campaign_user ON player_actions(campaign_uid, user_id);
CREATE INDEX IF NOT EXISTS idx_player_actions_character ON player_actions(character_id);
CREATE INDEX IF NOT EXISTS idx_player_actions_mode_type ON player_actions(game_mode, action_type);
CREATE INDEX IF NOT EXISTS idx_player_actions_scene ON player_actions(scene_id) WHERE scene_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_player_actions_expires ON player_actions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_player_actions_priority ON player_actions(campaign_uid, user_id, priority);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_player_actions_updated_at
  BEFORE UPDATE ON player_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_player_actions_updated_at();

-- Function to clean up expired actions
CREATE OR REPLACE FUNCTION cleanup_expired_actions()
RETURNS void AS $$
BEGIN
  DELETE FROM player_actions 
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Enable real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE player_actions; 