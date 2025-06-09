/*
  # Create Campaign History Table

  1. New Tables
    - `campaign_history`
      - `id` (serial, primary key) - auto-incrementing message ID
      - `campaign_id` (uuid, foreign key to campaigns)
      - `message` (text) - the actual message content
      - `author` (text) - name of the player or "DM"
      - `message_type` (text) - 'player', 'dm', or 'system'
      - `timestamp` (timestamptz) - auto-populated timestamp
      - `created_at` (timestamptz) - creation timestamp

  2. Security
    - Enable RLS on `campaign_history` table
    - Add policies for campaign participants to read messages
    - Add policies for authenticated users to insert messages
*/

CREATE TABLE IF NOT EXISTS campaign_history (
  id serial PRIMARY KEY,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  author text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('player', 'dm', 'system')) DEFAULT 'player',
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaign_history ENABLE ROW LEVEL SECURITY;

-- Create policies for reading messages
CREATE POLICY "Campaign participants can view campaign history"
  ON campaign_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_id
      AND (
        c.owner = auth.uid()
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(c.players) player
          WHERE (auth.uid())::text = (player->>'id')::text
        )
      )
    )
  );

-- Create policies for inserting messages
CREATE POLICY "Campaign participants can insert messages"
  ON campaign_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_id
      AND (
        c.owner = auth.uid()
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(c.players) player
          WHERE (auth.uid())::text = (player->>'id')::text
        )
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_history_campaign_id ON campaign_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_history_timestamp ON campaign_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_campaign_history_campaign_timestamp ON campaign_history(campaign_id, timestamp);