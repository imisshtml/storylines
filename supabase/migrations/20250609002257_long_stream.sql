/*
  # Fix Campaign History Table Data Types

  1. Drop and recreate campaign_history table with correct data types
    - `id` as auto-incrementing bigint (for message ordering)
    - `campaign_id` as uuid (matching campaigns.id)
    - All other columns remain the same

  2. Security
    - Enable RLS on `campaign_history` table
    - Add policies for campaign participants to read/write messages

  3. Performance
    - Add indexes for efficient querying
*/

-- Drop the existing table if it exists (since it has the wrong schema)
DROP TABLE IF EXISTS campaign_history;

-- Create campaign_history table with correct data types
CREATE TABLE campaign_history (
  id bigserial PRIMARY KEY,
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
CREATE INDEX idx_campaign_history_campaign_id ON campaign_history(campaign_id);
CREATE INDEX idx_campaign_history_timestamp ON campaign_history(timestamp);
CREATE INDEX idx_campaign_history_campaign_timestamp ON campaign_history(campaign_id, timestamp);

-- Enable real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_history;