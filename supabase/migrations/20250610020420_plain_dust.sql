/*
  # Enable Real-time for Campaigns Table

  1. Real-time Configuration
    - Add campaigns table to Supabase real-time publication
    - This enables real-time updates for campaign changes including player additions

  2. Security
    - No changes to existing RLS policies
    - Real-time events will respect existing row-level security

  3. Performance
    - Real-time events will be sent for all campaign table changes
    - Clients can subscribe to specific campaigns using filters
*/

-- Enable real-time for the campaigns table
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;

-- Ensure the table has replica identity for real-time updates
-- This is needed for UPDATE and DELETE operations to work properly with real-time
ALTER TABLE campaigns REPLICA IDENTITY FULL;