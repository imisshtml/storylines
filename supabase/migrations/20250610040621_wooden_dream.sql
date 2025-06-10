/*
  # Create Equipment System

  1. New Tables
    - `equipment`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text) - weapon, armor, adventuring gear, tool, etc.
      - `category` (text) - specific category within type
      - `cost_gold` (integer) - cost in gold pieces
      - `cost_silver` (integer) - cost in silver pieces  
      - `cost_copper` (integer) - cost in copper pieces
      - `weight` (decimal) - weight in pounds
      - `description` (text)
      - `properties` (jsonb) - damage, AC, special properties, etc.
      - `rarity` (text) - common, uncommon, rare, etc.
      - `created_at` (timestamp)

  2. Update Characters Table
    - Add hitpoint and currency fields
    - Add armor class field
    - Add conditions field

  3. Security
    - Enable RLS on `equipment` table
    - Add policies for read access to equipment
*/

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  category text,
  cost_gold integer DEFAULT 0,
  cost_silver integer DEFAULT 0,
  cost_copper integer DEFAULT 0,
  weight decimal DEFAULT 0,
  description text,
  properties jsonb DEFAULT '{}',
  rarity text DEFAULT 'common',
  created_at timestamptz DEFAULT now()
);

-- Add new columns to characters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'current_hitpoints'
  ) THEN
    ALTER TABLE characters ADD COLUMN current_hitpoints integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'max_hitpoints'
  ) THEN
    ALTER TABLE characters ADD COLUMN max_hitpoints integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'temp_hitpoints'
  ) THEN
    ALTER TABLE characters ADD COLUMN temp_hitpoints integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'armor_class'
  ) THEN
    ALTER TABLE characters ADD COLUMN armor_class integer DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'conditions'
  ) THEN
    ALTER TABLE characters ADD COLUMN conditions jsonb DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'gold'
  ) THEN
    ALTER TABLE characters ADD COLUMN gold integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'silver'
  ) THEN
    ALTER TABLE characters ADD COLUMN silver integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'copper'
  ) THEN
    ALTER TABLE characters ADD COLUMN copper integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on equipment table
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Create policies for equipment (read-only for all authenticated users)
CREATE POLICY "All users can view equipment"
  ON equipment
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_rarity ON equipment(rarity);

-- Insert basic starting equipment
INSERT INTO equipment (name, type, category, cost_gold, cost_silver, cost_copper, weight, description, properties) VALUES
-- Weapons
('Dagger', 'weapon', 'simple melee', 2, 0, 0, 1, 'A simple blade weapon', '{"damage": "1d4 piercing", "properties": ["finesse", "light", "thrown"], "range": "20/60"}'),
('Club', 'weapon', 'simple melee', 0, 1, 0, 2, 'A simple bludgeoning weapon', '{"damage": "1d4 bludgeoning", "properties": ["light"]}'),
('Handaxe', 'weapon', 'simple melee', 5, 0, 0, 2, 'A light throwing axe', '{"damage": "1d6 slashing", "properties": ["light", "thrown"], "range": "20/60"}'),
('Javelin', 'weapon', 'simple melee', 0, 5, 0, 2, 'A throwing spear', '{"damage": "1d6 piercing", "properties": ["thrown"], "range": "30/120"}'),
('Light Hammer', 'weapon', 'simple melee', 2, 0, 0, 2, 'A small hammer', '{"damage": "1d4 bludgeoning", "properties": ["light", "thrown"], "range": "20/60"}'),
('Mace', 'weapon', 'simple melee', 5, 0, 0, 4, 'A heavy club with a weighted head', '{"damage": "1d6 bludgeoning", "properties": []}'),
('Quarterstaff', 'weapon', 'simple melee', 0, 2, 0, 4, 'A long wooden staff', '{"damage": "1d6 bludgeoning", "properties": ["versatile"], "versatile_damage": "1d8"}'),
('Sickle', 'weapon', 'simple melee', 1, 0, 0, 2, 'A curved blade on a handle', '{"damage": "1d4 slashing", "properties": ["light"]}'),
('Spear', 'weapon', 'simple melee', 1, 0, 0, 3, 'A long thrusting weapon', '{"damage": "1d6 piercing", "properties": ["thrown", "versatile"], "range": "20/60", "versatile_damage": "1d8"}'),
('Crossbow, light', 'weapon', 'simple ranged', 25, 0, 0, 5, 'A light crossbow', '{"damage": "1d8 piercing", "properties": ["ammunition", "loading", "two-handed"], "range": "80/320"}'),
('Dart', 'weapon', 'simple ranged', 0, 0, 5, 0.25, 'A small throwing weapon', '{"damage": "1d4 piercing", "properties": ["finesse", "thrown"], "range": "20/60"}'),
('Shortbow', 'weapon', 'simple ranged', 25, 0, 0, 2, 'A small bow', '{"damage": "1d6 piercing", "properties": ["ammunition", "two-handed"], "range": "80/320"}'),
('Sling', 'weapon', 'simple ranged', 0, 1, 0, 0, 'A leather strap for hurling stones', '{"damage": "1d4 bludgeoning", "properties": ["ammunition"], "range": "30/120"}'),

-- Martial Weapons
('Battleaxe', 'weapon', 'martial melee', 10, 0, 0, 4, 'A large axe', '{"damage": "1d8 slashing", "properties": ["versatile"], "versatile_damage": "1d10"}'),
('Flail', 'weapon', 'martial melee', 10, 0, 0, 2, 'A spiked ball on a chain', '{"damage": "1d8 bludgeoning", "properties": []}'),
('Glaive', 'weapon', 'martial melee', 20, 0, 0, 6, 'A blade on a long pole', '{"damage": "1d10 slashing", "properties": ["heavy", "reach", "two-handed"]}'),
('Greataxe', 'weapon', 'martial melee', 30, 0, 0, 7, 'A massive two-handed axe', '{"damage": "1d12 slashing", "properties": ["heavy", "two-handed"]}'),
('Greatsword', 'weapon', 'martial melee', 50, 0, 0, 6, 'A large two-handed sword', '{"damage": "2d6 slashing", "properties": ["heavy", "two-handed"]}'),
('Halberd', 'weapon', 'martial melee', 20, 0, 0, 6, 'An axe blade topped with a spike', '{"damage": "1d10 slashing", "properties": ["heavy", "reach", "two-handed"]}'),
('Lance', 'weapon', 'martial melee', 10, 0, 0, 6, 'A long cavalry weapon', '{"damage": "1d12 piercing", "properties": ["reach", "special"]}'),
('Longsword', 'weapon', 'martial melee', 15, 0, 0, 3, 'A versatile sword', '{"damage": "1d8 slashing", "properties": ["versatile"], "versatile_damage": "1d10"}'),
('Maul', 'weapon', 'martial melee', 10, 0, 0, 10, 'A heavy two-handed hammer', '{"damage": "2d6 bludgeoning", "properties": ["heavy", "two-handed"]}'),
('Morningstar', 'weapon', 'martial melee', 15, 0, 0, 4, 'A spiked mace', '{"damage": "1d8 piercing", "properties": []}'),
('Pike', 'weapon', 'martial melee', 5, 0, 0, 18, 'A very long spear', '{"damage": "1d10 piercing", "properties": ["heavy", "reach", "two-handed"]}'),
('Rapier', 'weapon', 'martial melee', 25, 0, 0, 2, 'A thin, sharp sword', '{"damage": "1d8 piercing", "properties": ["finesse"]}'),
('Scimitar', 'weapon', 'martial melee', 25, 0, 0, 3, 'A curved sword', '{"damage": "1d6 slashing", "properties": ["finesse", "light"]}'),
('Shortsword', 'weapon', 'martial melee', 10, 0, 0, 2, 'A short blade', '{"damage": "1d6 piercing", "properties": ["finesse", "light"]}'),
('Trident', 'weapon', 'martial melee', 5, 0, 0, 4, 'A three-pronged spear', '{"damage": "1d6 piercing", "properties": ["thrown", "versatile"], "range": "20/60", "versatile_damage": "1d8"}'),
('War pick', 'weapon', 'martial melee', 5, 0, 0, 2, 'A pick designed for war', '{"damage": "1d8 piercing", "properties": []}'),
('Warhammer', 'weapon', 'martial melee', 15, 0, 0, 2, 'A hammer designed for combat', '{"damage": "1d8 bludgeoning", "properties": ["versatile"], "versatile_damage": "1d10"}'),
('Whip', 'weapon', 'martial melee', 2, 0, 0, 3, 'A flexible weapon', '{"damage": "1d4 slashing", "properties": ["finesse", "reach"]}'),

-- Ranged Martial Weapons
('Blowgun', 'weapon', 'martial ranged', 10, 0, 0, 1, 'A tube for shooting darts', '{"damage": "1 piercing", "properties": ["ammunition", "loading"], "range": "25/100"}'),
('Crossbow, hand', 'weapon', 'martial ranged', 75, 0, 0, 3, 'A small crossbow', '{"damage": "1d6 piercing", "properties": ["ammunition", "light", "loading"], "range": "30/120"}'),
('Crossbow, heavy', 'weapon', 'martial ranged', 50, 0, 0, 18, 'A large crossbow', '{"damage": "1d10 piercing", "properties": ["ammunition", "heavy", "loading", "two-handed"], "range": "100/400"}'),
('Longbow', 'weapon', 'martial ranged', 50, 0, 0, 2, 'A tall bow', '{"damage": "1d8 piercing", "properties": ["ammunition", "heavy", "two-handed"], "range": "150/600"}'),
('Net', 'weapon', 'martial ranged', 1, 0, 0, 3, 'A weighted net', '{"damage": "0", "properties": ["special", "thrown"], "range": "5/15"}'),

-- Armor
('Padded', 'armor', 'light', 5, 0, 0, 8, 'Quilted layers of cloth and batting', '{"ac": 11, "dex_bonus": "full", "stealth": "disadvantage"}'),
('Leather', 'armor', 'light', 10, 0, 0, 10, 'Soft and flexible leather', '{"ac": 11, "dex_bonus": "full"}'),
('Studded leather', 'armor', 'light', 45, 0, 0, 13, 'Leather reinforced with studs', '{"ac": 12, "dex_bonus": "full"}'),
('Hide', 'armor', 'medium', 10, 0, 0, 12, 'Crude armor of thick furs and pelts', '{"ac": 12, "dex_bonus": "max_2"}'),
('Chain shirt', 'armor', 'medium', 50, 0, 0, 20, 'A shirt of interlocked rings', '{"ac": 13, "dex_bonus": "max_2"}'),
('Scale mail', 'armor', 'medium', 50, 0, 0, 45, 'A coat of leather covered with overlapping pieces of metal', '{"ac": 14, "dex_bonus": "max_2", "stealth": "disadvantage"}'),
('Breastplate', 'armor', 'medium', 400, 0, 0, 20, 'A fitted metal chest piece', '{"ac": 14, "dex_bonus": "max_2"}'),
('Half plate', 'armor', 'medium', 750, 0, 0, 40, 'Partial plate armor', '{"ac": 15, "dex_bonus": "max_2", "stealth": "disadvantage"}'),
('Ring mail', 'armor', 'heavy', 30, 0, 0, 40, 'Leather armor with heavy rings sewn into it', '{"ac": 14, "stealth": "disadvantage"}'),
('Chain mail', 'armor', 'heavy', 75, 0, 0, 55, 'Interlocked metal rings', '{"ac": 16, "str_requirement": 13, "stealth": "disadvantage"}'),
('Splint', 'armor', 'heavy', 200, 0, 0, 60, 'Narrow vertical strips of metal', '{"ac": 17, "str_requirement": 15, "stealth": "disadvantage"}'),
('Plate', 'armor', 'heavy', 1500, 0, 0, 65, 'Interlocking metal plates', '{"ac": 18, "str_requirement": 15, "stealth": "disadvantage"}'),
('Shield', 'armor', 'shield', 10, 0, 0, 6, 'A protective barrier', '{"ac": 2}'),

-- Adventuring Gear
('Backpack', 'adventuring gear', 'container', 2, 0, 0, 5, 'A leather pack with straps', '{}'),
('Bedroll', 'adventuring gear', 'rest', 0, 1, 0, 7, 'A sleeping roll', '{}'),
('Blanket', 'adventuring gear', 'rest', 0, 5, 0, 3, 'A warm covering', '{}'),
('Candle', 'adventuring gear', 'light', 0, 0, 1, 0, 'A wax candle', '{"light_radius": 5, "duration": "1 hour"}'),
('Chain (10 feet)', 'adventuring gear', 'utility', 5, 0, 0, 10, 'Heavy metal links', '{}'),
('Crowbar', 'adventuring gear', 'tool', 2, 0, 0, 5, 'A metal prying bar', '{}'),
('Hammer', 'adventuring gear', 'tool', 1, 0, 0, 3, 'A basic hammer', '{}'),
('Lantern, bullseye', 'adventuring gear', 'light', 10, 0, 0, 2, 'A focused lantern', '{"light_radius": 60, "duration": "6 hours per flask"}'),
('Lantern, hooded', 'adventuring gear', 'light', 5, 0, 0, 2, 'A shielded lantern', '{"light_radius": 30, "duration": "6 hours per flask"}'),
('Oil (flask)', 'adventuring gear', 'consumable', 0, 1, 0, 1, 'A flask of oil', '{}'),
('Rations (1 day)', 'adventuring gear', 'consumable', 0, 2, 0, 2, 'Dried foods for one day', '{}'),
('Rope, hempen (50 feet)', 'adventuring gear', 'utility', 2, 0, 0, 10, 'Strong hemp rope', '{}'),
('Rope, silk (50 feet)', 'adventuring gear', 'utility', 10, 0, 0, 5, 'Fine silk rope', '{}'),
('Tinderbox', 'adventuring gear', 'utility', 0, 5, 0, 1, 'Flint, fire steel, and tinder', '{}'),
('Torch', 'adventuring gear', 'light', 0, 0, 1, 1, 'A burning brand', '{"light_radius": 20, "duration": "1 hour"}'),
('Waterskin', 'adventuring gear', 'consumable', 2, 0, 0, 5, 'A leather water container', '{}'),

-- Tools
('Thieves'' tools', 'tool', 'artisan', 25, 0, 0, 1, 'Tools for picking locks and disarming traps', '{}'),
('Herbalism kit', 'tool', 'artisan', 5, 0, 0, 3, 'Tools for identifying and using herbs', '{}'),
('Healer''s kit', 'tool', 'utility', 5, 0, 0, 3, 'Bandages and healing supplies', '{"uses": 10}'),

-- Ammunition
('Arrows (20)', 'ammunition', 'arrow', 1, 0, 0, 1, 'A quiver of arrows', '{}'),
('Crossbow bolts (20)', 'ammunition', 'bolt', 1, 0, 0, 1.5, 'A case of crossbow bolts', '{}'),
('Sling bullets (20)', 'ammunition', 'bullet', 0, 0, 4, 1.5, 'A pouch of sling bullets', '{}'),
('Blowgun needles (50)', 'ammunition', 'needle', 1, 0, 0, 1, 'A case of blowgun needles', '{}')

ON CONFLICT (name) DO NOTHING;