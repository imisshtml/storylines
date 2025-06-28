-- Database schema for IAP purchase tracking

-- Purchases table to log all purchases
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  revenue_cat_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User inventory table for consumable items
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type)
);

-- Add IAP-related columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS character_limit INTEGER DEFAULT 2;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS campaign_limit INTEGER DEFAULT 2;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS group_size INTEGER DEFAULT 3;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ads_removed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS all_adventures_unlocked BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dm_subscription_active BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS adventurers_pack_active BOOLEAN DEFAULT FALSE;

-- Add players_online field to campaigns table for online status tracking
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS players_online JSONB DEFAULT '{}'::jsonb;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_item_type ON user_inventory(item_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_players_online ON campaigns USING GIN (players_online);

-- RLS (Row Level Security) policies
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- Users can only see their own purchases
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own inventory
CREATE POLICY "Users can view own inventory" ON user_inventory
  FOR SELECT USING (auth.uid() = user_id);

-- Only authenticated users can insert purchases (usually done via webhook)
CREATE POLICY "Service can insert purchases" ON purchases
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can update inventory
CREATE POLICY "Service can manage inventory" ON user_inventory
  FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_inventory updated_at
CREATE TRIGGER update_user_inventory_updated_at
    BEFORE UPDATE ON user_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 