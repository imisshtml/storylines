/*
  # Add content reports table for Google Play Store AI compliance

  1. New Table
    - `content_reports`
      - `id` (uuid, primary key)
      - `reporter_user_id` (uuid, foreign key to profiles)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `message_id` (integer, foreign key to campaign_history)
      - `message_content` (text) - snapshot of reported content
      - `offense_type` (text) - type of violation
      - `comments` (text) - reporter's additional comments
      - `status` (text) - pending, reviewed, resolved
      - `created_at` (timestamp)
      - `reviewed_at` (timestamp, nullable)
      - `reviewed_by` (uuid, nullable, foreign key to profiles)

  2. Security
    - Enable RLS on `content_reports` table
    - Add policies for reporting content
*/

-- Create content reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  message_id INTEGER NOT NULL REFERENCES campaign_history(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  offense_type TEXT NOT NULL CHECK (offense_type IN (
    'inappropriate_content',
    'harassment',
    'violence',
    'adult_content',
    'hate_speech',
    'misinformation',
    'spam',
    'other'
  )),
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create content reports"
  ON content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users can view their own reports"
  ON content_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_user_id);

-- Admins can view all reports (you can add admin role logic later)
CREATE POLICY "Admins can view all reports"
  ON content_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.admin = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_reports_campaign_id ON content_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_message_id ON content_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at); 