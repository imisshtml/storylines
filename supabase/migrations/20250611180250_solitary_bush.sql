/*
  # Add Campaign Read Status Tracking

  1. New Tables
    - `campaign_read_status`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `campaign_uid` (uuid, foreign key to campaigns.uid)
      - `last_read_message_id` (bigint, foreign key to campaign_history.id)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `campaign_read_status` table
    - Add policies for users to manage their own read status

  3. Performance
    - Add indexes for efficient querying
*/

-- Create campaign_read_status table
CREATE TABLE IF NOT EXISTS campaign_read_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_uid uuid REFERENCES campaigns(uid) ON DELETE CASCADE NOT NULL,
  last_read_message_id bigint REFERENCES campaign_history(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_uid)
);

-- Enable RLS
ALTER TABLE campaign_read_status ENABLE ROW LEVEL SECURITY;

-- Create policies for read status
CREATE POLICY "Users can view own read status"
  ON campaign_read_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own read status"
  ON campaign_read_status
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read status"
  ON campaign_read_status
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_read_status_user_campaign ON campaign_read_status(user_id, campaign_uid);
CREATE INDEX IF NOT EXISTS idx_campaign_read_status_user_id ON campaign_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_read_status_campaign_uid ON campaign_read_status(campaign_uid);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_read_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_campaign_read_status_updated_at
  BEFORE UPDATE ON campaign_read_status
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_read_status_updated_at();

-- Enable real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_read_status;