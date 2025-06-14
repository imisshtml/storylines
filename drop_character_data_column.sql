-- Final migration: Drop character_data column after successful migration
-- Run this ONLY after confirming all data has been successfully migrated 
-- and the application is working with the new structure

-- Add safety check to ensure data migration was successful
DO $$
BEGIN
    -- Check if any characters still have null values in the new columns where they shouldn't
    IF EXISTS (
        SELECT 1 FROM characters 
        WHERE (avatar IS NULL OR avatar = '') 
        AND character_data->>'avatar' IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Some avatars were not migrated properly. Aborting drop operation.';
    END IF;

    -- Check if any characters have empty equipment when they should have data
    IF EXISTS (
        SELECT 1 FROM characters 
        WHERE (equipment IS NULL OR equipment = '[]'::jsonb) 
        AND (character_data->'purchasedEquipment' IS NOT NULL 
             OR character_data->'equipment' IS NOT NULL)
    ) THEN
        RAISE EXCEPTION 'Some equipment data was not migrated properly. Aborting drop operation.';
    END IF;

    -- If all checks pass, proceed with dropping the column
    RAISE NOTICE 'Data migration verification passed. Dropping character_data column...';
END $$;

-- Drop the character_data column
ALTER TABLE characters DROP COLUMN IF EXISTS character_data;

-- Verify the column was dropped successfully
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'characters' 
AND table_schema = 'public'
ORDER BY ordinal_position; 