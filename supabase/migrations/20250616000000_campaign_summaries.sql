/*
  # Create Campaign Summaries Table

  1. New Tables
    - `campaign_summaries`
      - `id` (uuid, primary key)
      - `campaign_uid` (uuid, foreign key to campaigns.uid)
      - `action_summaries` (jsonb) - Array of brief action summaries
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `campaign_summaries` table
    - Add policies for campaign participants to read summaries
    - Add policies for the system to update summaries

  3. Performance
    - Add indexes for efficient querying
    - Enable real-time updates
*/

-- Create campaign_summaries table
CREATE TABLE IF NOT EXISTS campaign_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_uid uuid REFERENCES campaigns(uid) ON DELETE CASCADE NOT NULL UNIQUE,
  action_summaries jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaign_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign summaries
CREATE POLICY "Campaign participants can view summaries"
  ON campaign_summaries
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

CREATE POLICY "System can insert campaign summaries"
  ON campaign_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (
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

CREATE POLICY "System can update campaign summaries"
  ON campaign_summaries
  FOR UPDATE
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_summaries_campaign_uid ON campaign_summaries(campaign_uid);
CREATE INDEX IF NOT EXISTS idx_campaign_summaries_updated_at ON campaign_summaries(updated_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_campaign_summaries_updated_at
  BEFORE UPDATE ON campaign_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_summaries_updated_at();

-- Enable real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_summaries; 