-- Create features table for D&D 5e class features
CREATE TABLE IF NOT EXISTS features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  index VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  class_index VARCHAR(255) NOT NULL,
  class_name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  prerequisites TEXT[] DEFAULT '{}',
  description TEXT[] NOT NULL,
  url VARCHAR(255),
  api_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_features_index ON features(index);
CREATE INDEX IF NOT EXISTS idx_features_class_index ON features(class_index);
CREATE INDEX IF NOT EXISTS idx_features_level ON features(level);
CREATE INDEX IF NOT EXISTS idx_features_class_level ON features(class_index, level);

-- Enable RLS (Row Level Security)
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read features (public data)
CREATE POLICY "Features are publicly readable" ON features
  FOR SELECT USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_features_updated_at 
  BEFORE UPDATE ON features 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 