/*
  # Create Campaigns Table

  1. New Tables
    - `campaigns`
      - `id` (uuid, primary key)
      - `name` (text)
      - `adventure` (text)
      - `level` (integer)
      - `tone` (text)
      - `exclude` (text[])
      - `status` (text)
      - `players` (jsonb)
      - `invite_code` (text)
      - `owner` (uuid, foreign key to profiles)
      - `content_level` (text) - 'kids', 'teens', or 'adults'
      - `rp_focus` (text) - balance between roleplay and combat
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `campaigns` table
    - Add policies for users to manage their own campaigns
    - Add policies for invited players to view campaigns
*/

-- Add new columns for content level and RP/combat focus
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS content_level text NOT NULL DEFAULT 'adults' CHECK (content_level IN ('kids', 'teens', 'adults')),
  ADD COLUMN IF NOT EXISTS rp_focus text NOT NULL DEFAULT 'balanced' CHECK (rp_focus IN ('heavy_rp', 'rp_focused', 'balanced', 'combat_focused', 'heavy_combat'));

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  adventure text NOT NULL,
  level integer DEFAULT 1,
  tone text NOT NULL,
  exclude text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'creation',
  players jsonb DEFAULT '[]'::jsonb,
  invite_code text NOT NULL,
  owner uuid REFERENCES auth.users(id) NOT NULL,
  content_level text NOT NULL CHECK (content_level IN ('kids', 'teens', 'adults')) DEFAULT 'adults',
  rp_focus text NOT NULL CHECK (rp_focus IN ('heavy_rp', 'rp_focused', 'balanced', 'combat_focused', 'heavy_combat')) DEFAULT 'balanced',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own campaigns"
  ON campaigns
  FOR SELECT
  USING ((owner)::text = (auth.uid())::text);

CREATE POLICY "Users can view campaigns they are invited to"
  ON campaigns
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM jsonb_array_elements(players::jsonb) player
    WHERE (auth.uid())::text = (player->>'id')::text
  ));

CREATE POLICY "Users can insert their own campaigns"
  ON campaigns
  FOR INSERT
  WITH CHECK ((owner)::text = (auth.uid())::text);

CREATE POLICY "Users can update their own campaigns"
  ON campaigns
  FOR UPDATE
  USING ((owner)::text = (auth.uid())::text);

CREATE POLICY "Users can delete their own campaigns"
  ON campaigns
  FOR DELETE
  USING ((owner)::text = (auth.uid())::text);

-- Create indexes
CREATE INDEX campaigns_owner_idx ON campaigns(owner);
CREATE INDEX campaigns_invite_code_idx ON campaigns(invite_code);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 