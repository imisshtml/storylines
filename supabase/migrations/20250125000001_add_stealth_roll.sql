-- Add stealth_roll column to characters table
ALTER TABLE characters ADD COLUMN stealth_roll INTEGER DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN characters.stealth_roll IS 'Stealth roll value: 0 means not in stealth, >0 is the active stealth roll for detection';

-- Create index for efficient querying of stealthed characters
CREATE INDEX idx_characters_stealth_roll ON characters(stealth_roll) WHERE stealth_roll > 0; 