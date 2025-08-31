-- Add notification preference columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_notifications_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS turn_notifications_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT false;

-- Backfill existing rows explicitly (in case defaults don't apply retroactively)
UPDATE profiles SET push_notifications_enabled = true WHERE push_notifications_enabled IS NULL;
UPDATE profiles SET turn_notifications_enabled = true WHERE turn_notifications_enabled IS NULL;
UPDATE profiles SET email_notifications_enabled = false WHERE email_notifications_enabled IS NULL; 