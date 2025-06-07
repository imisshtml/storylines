/*
  # Create Characters Table

  1. New Tables
    - `characters`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `campaign_id` (uuid, foreign key to campaigns, nullable)
      - `name` (text)
      - `race` (text)
      - `class` (text)
      - `background` (text)
      - `level` (integer, default 1)
      - `abilities` (jsonb)
      - `skills` (jsonb)
      - `spells` (jsonb)
      - `equipment` (jsonb)
      - `character_data` (jsonb) - full character data
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `characters` table
    - Add policies for users to manage their own characters
*/

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  name text NOT NULL,
  race text NOT NULL,
  class text NOT NULL,
  background text NOT NULL,
  level integer DEFAULT 1,
  abilities jsonb NOT NULL DEFAULT '{}',
  skills jsonb NOT NULL DEFAULT '{}',
  spells jsonb NOT NULL DEFAULT '[]',
  equipment jsonb NOT NULL DEFAULT '{}',
  character_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters"
  ON characters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own characters"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
  ON characters
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters"
  ON characters
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_campaign_id ON characters(campaign_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();