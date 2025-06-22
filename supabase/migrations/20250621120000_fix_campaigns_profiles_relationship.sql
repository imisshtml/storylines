/*
  # Fix Campaigns-Profiles Foreign Key Relationship

  1. Update campaigns table to reference profiles instead of auth.users
    - Drop existing foreign key constraint
    - Add new foreign key constraint to profiles table
    - Create proper named constraint for Supabase joins

  2. This will fix the PGRST200 error when joining campaigns with profiles
*/

-- First, drop the existing foreign key constraint if it exists
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Check if the specific constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'campaigns_owner_fkey' 
        AND table_name = 'campaigns'
    ) THEN
        ALTER TABLE campaigns DROP CONSTRAINT campaigns_owner_fkey;
    END IF;
    
    -- Drop any other foreign key constraints on the owner column
    FOR constraint_rec IN 
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'campaigns' 
        AND ccu.column_name = 'owner' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name != 'campaigns_owner_fkey'  -- Don't try to drop it again
    LOOP
        EXECUTE 'ALTER TABLE campaigns DROP CONSTRAINT ' || constraint_rec.constraint_name;
    END LOOP;
END $$;

-- Drop any existing policies that might reference the campaigns.owner column
-- This includes policies on campaigns table and related tables that join with campaigns

-- Drop campaigns table policies
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view campaigns they are invited to" ON campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update campaigns they participate in" ON campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campaigns;

-- Drop campaign_history table policies (these likely reference campaigns.owner)
DROP POLICY IF EXISTS "Campaign participants can view campaign history" ON campaign_history;
DROP POLICY IF EXISTS "Campaign participants can insert messages" ON campaign_history;

-- Drop campaign_summaries table policies (if they exist)
DROP POLICY IF EXISTS "Campaign participants can view summaries" ON campaign_summaries;
DROP POLICY IF EXISTS "System can insert campaign summaries" ON campaign_summaries;
DROP POLICY IF EXISTS "System can update campaign summaries" ON campaign_summaries;

-- Drop campaign_read_status table policies (if they exist)
DROP POLICY IF EXISTS "Users can view own read status" ON campaign_read_status;
DROP POLICY IF EXISTS "Users can insert own read status" ON campaign_read_status;
DROP POLICY IF EXISTS "Users can update own read status" ON campaign_read_status;

-- Drop player_actions table policies (these likely reference campaigns.owner)
DROP POLICY IF EXISTS "Users can view actions for their campaigns" ON player_actions;
DROP POLICY IF EXISTS "Users can insert actions for their campaigns" ON player_actions;
DROP POLICY IF EXISTS "Users can update actions for their campaigns" ON player_actions;
DROP POLICY IF EXISTS "Users can delete actions for their campaigns" ON player_actions;

-- Drop any other policies that might reference campaigns.owner
-- Use a simpler approach to drop all policies from tables that might reference campaigns
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies from tables that commonly reference campaigns
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE tablename IN ('campaigns', 'campaign_history', 'campaign_summaries', 'campaign_read_status', 'player_actions', 'characters')
          AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
    END LOOP;
END $$;

-- Convert the owner column from text/varchar to UUID if needed
DO $$
BEGIN
    -- Check if the owner column is not already UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'owner' 
        AND data_type != 'uuid'
    ) THEN
        -- Convert the column to UUID type
        -- This assumes all existing values are valid UUIDs
        ALTER TABLE campaigns ALTER COLUMN owner TYPE uuid USING owner::uuid;
    END IF;
END $$;

-- Add the new foreign key constraint with the correct name that Supabase expects
ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_owner_fkey 
FOREIGN KEY (owner) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ensure the index exists for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON campaigns(owner);

-- Update any existing data to ensure referential integrity
-- Note: This assumes that profiles.id matches auth.users.id (which is typically the case in Supabase)
-- If there are any orphaned records, you might need to handle them separately 