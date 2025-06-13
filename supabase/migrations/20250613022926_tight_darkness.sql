/*
  # Create Friends System

  1. New Tables
    - `friendships`
      - `id` (uuid, primary key)
      - `requester_id` (uuid, foreign key to auth.users)
      - `addressee_id` (uuid, foreign key to auth.users)
      - `status` (text) - 'pending', 'accepted', 'rejected', 'blocked'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `campaign_invitations`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `inviter_id` (uuid, foreign key to auth.users)
      - `invitee_id` (uuid, foreign key to auth.users)
      - `status` (text) - 'pending', 'accepted', 'rejected'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own friend relationships
    - Add policies for campaign invitations

  3. Performance
    - Add indexes for efficient querying
*/

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Create campaign_invitations table
CREATE TABLE IF NOT EXISTS campaign_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  inviter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, invitee_id)
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_invitations ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
  ON friendships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests"
  ON friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're involved in"
  ON friendships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own friendships"
  ON friendships
  FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Campaign invitations policies
CREATE POLICY "Users can view their campaign invitations"
  ON campaign_invitations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create campaign invitations for their campaigns"
  ON campaign_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE id = campaign_id AND owner = auth.uid()
    )
  );

CREATE POLICY "Users can update their campaign invitations"
  ON campaign_invitations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_invitee ON campaign_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_campaign ON campaign_invitations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_status ON campaign_invitations(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_friendships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_campaign_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friendships_updated_at();

CREATE TRIGGER update_campaign_invitations_updated_at
  BEFORE UPDATE ON campaign_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_invitations_updated_at();

-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_invitations;