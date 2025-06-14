/*
  # Enhanced Equipment System

  1. Updates to Equipment Table
    - Add missing columns for comprehensive equipment data
    - Update existing equipment with proper D&D 5e data
    - Add equipment categories and subcategories

  2. New Equipment Data
    - Complete weapon and armor sets
    - Adventuring gear, tools, and consumables
    - Proper cost structure (gold/silver/copper)
    - Weight and properties for all items

  3. Security
    - Maintain existing RLS policies
    - Add indexes for performance
*/

-- Add missing columns to equipment table if they don't exist
DO $$
BEGIN
  -- Add index column for D&D API compatibility
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'index'
  ) THEN
    ALTER TABLE equipment ADD COLUMN index text UNIQUE;
  END IF;

  -- Add equipment_category for better organization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'equipment_category'
  ) THEN
    ALTER TABLE equipment ADD COLUMN equipment_category text;
  END IF;

  -- Add cost_quantity and cost_unit for flexible pricing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'cost_quantity'
  ) THEN
    ALTER TABLE equipment ADD COLUMN cost_quantity integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'cost_unit'
  ) THEN
    ALTER TABLE equipment ADD COLUMN cost_unit text DEFAULT 'gp';
  END IF;

  -- Add special properties array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'special'
  ) THEN
    ALTER TABLE equipment ADD COLUMN special text[] DEFAULT '{}';
  END IF;

  -- Add contents for containers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'contents'
  ) THEN
    ALTER TABLE equipment ADD COLUMN contents jsonb DEFAULT '[]';
  END IF;

  -- Add enabled flag for equipment availability
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'enabled'
  ) THEN
    ALTER TABLE equipment ADD COLUMN enabled boolean DEFAULT true;
  END IF;

  -- Add updated_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE equipment ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Add weapon-specific columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'weapon_category'
  ) THEN
    ALTER TABLE equipment ADD COLUMN weapon_category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'weapon_range'
  ) THEN
    ALTER TABLE equipment ADD COLUMN weapon_range text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'category_range'
  ) THEN
    ALTER TABLE equipment ADD COLUMN category_range text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'damage_dice'
  ) THEN
    ALTER TABLE equipment ADD COLUMN damage_dice text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'damage_type'
  ) THEN
    ALTER TABLE equipment ADD COLUMN damage_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'range_normal'
  ) THEN
    ALTER TABLE equipment ADD COLUMN range_normal integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'range_long'
  ) THEN
    ALTER TABLE equipment ADD COLUMN range_long integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'throw_range_normal'
  ) THEN
    ALTER TABLE equipment ADD COLUMN throw_range_normal integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'throw_range_long'
  ) THEN
    ALTER TABLE equipment ADD COLUMN throw_range_long integer;
  END IF;

  -- Add armor-specific columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'armor_category'
  ) THEN
    ALTER TABLE equipment ADD COLUMN armor_category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'armor_class_base'
  ) THEN
    ALTER TABLE equipment ADD COLUMN armor_class_base integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'armor_class_dex_bonus'
  ) THEN
    ALTER TABLE equipment ADD COLUMN armor_class_dex_bonus boolean;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'str_minimum'
  ) THEN
    ALTER TABLE equipment ADD COLUMN str_minimum integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'stealth_disadvantage'
  ) THEN
    ALTER TABLE equipment ADD COLUMN stealth_disadvantage boolean;
  END IF;

  -- Add gear-specific columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'gear_category'
  ) THEN
    ALTER TABLE equipment ADD COLUMN gear_category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE equipment ADD COLUMN quantity integer DEFAULT 1;
  END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_updated_at();

-- Clear existing equipment data to avoid conflicts
TRUNCATE TABLE equipment;

-- Insert comprehensive D&D 5e equipment data
INSERT INTO equipment (
  index, name, equipment_category, type, weapon_category, weapon_range, category_range,
  cost_quantity, cost_unit, weight, damage_dice, damage_type, range_normal, range_long,
  throw_range_normal, throw_range_long, description, properties, special, enabled
) VALUES
-- Simple Melee Weapons
('club', 'Club', 'Weapon', 'weapon', 'Simple', 'Melee', 'Simple Melee', 1, 'sp', 2, '1d4', 'bludgeoning', null, null, null, null, 'A simple wooden club.', '["light"]', '[]', true),
('dagger', 'Dagger', 'Weapon', 'weapon', 'Simple', 'Melee', 'Simple Melee', 2, 'gp', 1, '1d4', 'piercing', null, null, 20, 60, 'A sharp blade weapon.', '["finesse", "light", "thrown"]', '[]', true),
('dart', 'Dart', 'Weapon', 'weapon', 'Simple', 'Ranged', 'Simple Ranged', 5, 'cp', 0.25, '1d4', 'piercing', 20, 60, 20, 60, 'A small throwing weapon.', '["finesse", "thrown"]', '[]', true),
('handaxe', 'Handaxe', 'Weapon', 'weapon', 'Simple', 'Melee', 'Simple Melee', 5, 'gp', 2, '1d6', 'slashing', null, null, 20, 60, 'A light throwing axe.', '["light", "thrown"]', '[]', true),
('javelin', 'Javelin', 'Weapon', 'weapon', 'Simple', 'Melee', 'Simple Melee', 5, 'sp', 2, '1d6', 'piercing', null, null, 30, 120, 'A throwing spear.', '["thrown"]', '[]', true),
('light-hammer', 'Light hammer', 'Weapon', 'weapon', 'Simple', 'Melee', 'Simple Melee', 2, 'gp', 2, '1d4', 'bludgeoning', null, null, 20, 60, 'A small hammer.', '["light", "thrown"]', '[]', true),
('mace', 'Mace', 'Weapon', 'weapon', 'Simple', 'Melee', 'Simple Melee', 5, 'gp', 4, '1d6', 'bludgeoning', null, null, null, null, 'A heavy club with a weighted head.', '[]', '[]', true),
('quarterstaff', 'Quarterstaff', 'Weapon', 'weapon', 'Simple', 'Melee', 'Simple Melee', 2, 'sp', 4, '1d6', 'bludgeoning', null, null, null, null, 'A long wooden staff.', '["versatile"]', '["Versatile (1d8)"]', true),
('sickle', 'Sickle', 'Weapon', 'weapon', 'Simple', 'Melee', 'Simple Melee', 1, 'gp', 2, '1d4', 'slashing', null, null, null, null, 'A curved blade on a handle.', '["light"]', '[]', true),
('spear', 'Spear', 'Weapon', 'weapon', 'Simple', 'Melee', 'Simple Melee', 1, 'gp', 3, '1d6', 'piercing', null, null, 20, 60, 'A long thrusting weapon.', '["thrown", "versatile"]', '["Versatile (1d8)"]', true),

-- Simple Ranged Weapons
('crossbow-light', 'Crossbow, light', 'Weapon', 'weapon', 'Simple', 'Ranged', 'Simple Ranged', 25, 'gp', 5, '1d8', 'piercing', 80, 320, null, null, 'A light crossbow.', '["ammunition", "loading", "two-handed"]', '[]', true),
('shortbow', 'Shortbow', 'Weapon', 'weapon', 'Simple', 'Ranged', 'Simple Ranged', 25, 'gp', 2, '1d6', 'piercing', 80, 320, null, null, 'A small bow.', '["ammunition", "two-handed"]', '[]', true),
('sling', 'Sling', 'Weapon', 'weapon', 'Simple', 'Ranged', 'Simple Ranged', 1, 'sp', 0, '1d4', 'bludgeoning', 30, 120, null, null, 'A leather strap for hurling stones.', '["ammunition"]', '[]', true),

-- Martial Melee Weapons
('battleaxe', 'Battleaxe', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 10, 'gp', 4, '1d8', 'slashing', null, null, null, null, 'A large axe.', '["versatile"]', '["Versatile (1d10)"]', true),
('flail', 'Flail', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 10, 'gp', 2, '1d8', 'bludgeoning', null, null, null, null, 'A spiked ball on a chain.', '[]', '[]', true),
('glaive', 'Glaive', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 20, 'gp', 6, '1d10', 'slashing', null, null, null, null, 'A blade on a long pole.', '["heavy", "reach", "two-handed"]', '[]', true),
('greataxe', 'Greataxe', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 30, 'gp', 7, '1d12', 'slashing', null, null, null, null, 'A massive two-handed axe.', '["heavy", "two-handed"]', '[]', true),
('greatsword', 'Greatsword', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 50, 'gp', 6, '2d6', 'slashing', null, null, null, null, 'A large two-handed sword.', '["heavy", "two-handed"]', '[]', true),
('halberd', 'Halberd', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 20, 'gp', 6, '1d10', 'slashing', null, null, null, null, 'An axe blade topped with a spike.', '["heavy", "reach", "two-handed"]', '[]', true),
('lance', 'Lance', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 10, 'gp', 6, '1d12', 'piercing', null, null, null, null, 'A long cavalry weapon.', '["reach", "special"]', '["You have disadvantage when you use a lance to attack a target within 5 feet of you. Also, a lance requires two hands to wield when you aren''t mounted."]', true),
('longsword', 'Longsword', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 15, 'gp', 3, '1d8', 'slashing', null, null, null, null, 'A versatile sword.', '["versatile"]', '["Versatile (1d10)"]', true),
('maul', 'Maul', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 10, 'gp', 10, '2d6', 'bludgeoning', null, null, null, null, 'A heavy two-handed hammer.', '["heavy", "two-handed"]', '[]', true),
('morningstar', 'Morningstar', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 15, 'gp', 4, '1d8', 'piercing', null, null, null, null, 'A spiked mace.', '[]', '[]', true),
('pike', 'Pike', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 5, 'gp', 18, '1d10', 'piercing', null, null, null, null, 'A very long spear.', '["heavy", "reach", "two-handed"]', '[]', true),
('rapier', 'Rapier', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 25, 'gp', 2, '1d8', 'piercing', null, null, null, null, 'A thin, sharp sword.', '["finesse"]', '[]', true),
('scimitar', 'Scimitar', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 25, 'gp', 3, '1d6', 'slashing', null, null, null, null, 'A curved sword.', '["finesse", "light"]', '[]', true),
('shortsword', 'Shortsword', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 10, 'gp', 2, '1d6', 'piercing', null, null, null, null, 'A short blade.', '["finesse", "light"]', '[]', true),
('trident', 'Trident', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 5, 'gp', 4, '1d6', 'piercing', null, null, 20, 60, 'A three-pronged spear.', '["thrown", "versatile"]', '["Versatile (1d8)"]', true),
('war-pick', 'War pick', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 5, 'gp', 2, '1d8', 'piercing', null, null, null, null, 'A pick designed for war.', '[]', '[]', true),
('warhammer', 'Warhammer', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 15, 'gp', 2, '1d8', 'bludgeoning', null, null, null, null, 'A hammer designed for combat.', '["versatile"]', '["Versatile (1d10)"]', true),
('whip', 'Whip', 'Weapon', 'weapon', 'Martial', 'Melee', 'Martial Melee', 2, 'gp', 3, '1d4', 'slashing', null, null, null, null, 'A flexible weapon.', '["finesse", "reach"]', '[]', true),

-- Martial Ranged Weapons
('blowgun', 'Blowgun', 'Weapon', 'weapon', 'Martial', 'Ranged', 'Martial Ranged', 10, 'gp', 1, '1', 'piercing', 25, 100, null, null, 'A tube for shooting darts.', '["ammunition", "loading"]', '[]', true),
('crossbow-hand', 'Crossbow, hand', 'Weapon', 'weapon', 'Martial', 'Ranged', 'Martial Ranged', 75, 'gp', 3, '1d6', 'piercing', 30, 120, null, null, 'A small crossbow.', '["ammunition", "light", "loading"]', '[]', true),
('crossbow-heavy', 'Crossbow, heavy', 'Weapon', 'weapon', 'Martial', 'Ranged', 'Martial Ranged', 50, 'gp', 18, '1d10', 'piercing', 100, 400, null, null, 'A large crossbow.', '["ammunition", "heavy", "loading", "two-handed"]', '[]', true),
('longbow', 'Longbow', 'Weapon', 'weapon', 'Martial', 'Ranged', 'Martial Ranged', 50, 'gp', 2, '1d8', 'piercing', 150, 600, null, null, 'A tall bow.', '["ammunition", "heavy", "two-handed"]', '[]', true),
('net', 'Net', 'Weapon', 'weapon', 'Martial', 'Ranged', 'Martial Ranged', 1, 'gp', 3, '0', '', 5, 15, 5, 15, 'A weighted net.', '["special", "thrown"]', '["A Large or smaller creature hit by a net is restrained until it is freed. A net has no effect on creatures that are formless, or creatures that are Huge or larger. A creature can use its action to make a DC 10 Strength check, freeing itself or another creature within its reach on a success. Dealing 5 slashing damage to the net (AC 10) also frees the creature without harming it, ending the effect and destroying the net."]', true);

-- Insert armor data
INSERT INTO equipment (
  index, name, equipment_category, type, armor_category, cost_quantity, cost_unit, weight,
  armor_class_base, armor_class_dex_bonus, str_minimum, stealth_disadvantage, description, enabled
) VALUES
-- Light Armor
('padded', 'Padded', 'Armor', 'armor', 'Light', 5, 'gp', 8, 11, true, null, true, 'Quilted layers of cloth and batting.', true),
('leather', 'Leather', 'Armor', 'armor', 'Light', 10, 'gp', 10, 11, true, null, false, 'Soft and flexible leather.', true),
('studded-leather', 'Studded leather', 'Armor', 'armor', 'Light', 45, 'gp', 13, 12, true, null, false, 'Leather reinforced with studs.', true),

-- Medium Armor
('hide', 'Hide', 'Armor', 'armor', 'Medium', 10, 'gp', 12, 12, true, null, false, 'Crude armor of thick furs and pelts.', true),
('chain-shirt', 'Chain shirt', 'Armor', 'armor', 'Medium', 50, 'gp', 20, 13, true, null, false, 'A shirt of interlocked rings.', true),
('scale-mail', 'Scale mail', 'Armor', 'armor', 'Medium', 50, 'gp', 45, 14, true, null, true, 'A coat of leather covered with overlapping pieces of metal.', true),
('breastplate', 'Breastplate', 'Armor', 'armor', 'Medium', 400, 'gp', 20, 14, true, null, false, 'A fitted metal chest piece.', true),
('half-plate', 'Half plate', 'Armor', 'armor', 'Medium', 750, 'gp', 40, 15, true, null, true, 'Partial plate armor.', true),

-- Heavy Armor
('ring-mail', 'Ring mail', 'Armor', 'armor', 'Heavy', 30, 'gp', 40, 14, false, null, true, 'Leather armor with heavy rings sewn into it.', true),
('chain-mail', 'Chain mail', 'Armor', 'armor', 'Heavy', 75, 'gp', 55, 16, false, 13, true, 'Interlocked metal rings.', true),
('splint', 'Splint', 'Armor', 'armor', 'Heavy', 200, 'gp', 60, 17, false, 15, true, 'Narrow vertical strips of metal.', true),
('plate', 'Plate', 'Armor', 'armor', 'Heavy', 1500, 'gp', 65, 18, false, 15, true, 'Interlocking metal plates.', true),

-- Shield
('shield', 'Shield', 'Armor', 'armor', 'Shield', 10, 'gp', 6, 2, null, null, false, 'A protective barrier.', true);

-- Insert adventuring gear
INSERT INTO equipment (
  index, name, equipment_category, type, gear_category, cost_quantity, cost_unit, weight,
  description, quantity, enabled
) VALUES
-- Containers
('backpack', 'Backpack', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 5, 'A leather pack with straps.', 1, true),
('barrel', 'Barrel', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 70, 'A wooden barrel.', 1, true),
('basket', 'Basket', 'Adventuring Gear', 'adventuring gear', 'Equipment', 4, 'sp', 2, 'A woven basket.', 1, true),
('bedroll', 'Bedroll', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'sp', 7, 'A sleeping roll.', 1, true),
('blanket', 'Blanket', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'sp', 3, 'A warm covering.', 1, true),
('bottle-glass', 'Bottle, glass', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 2, 'A glass bottle.', 1, true),
('bucket', 'Bucket', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'cp', 2, 'A wooden bucket.', 1, true),
('caltrops', 'Caltrops', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'gp', 2, 'Spiked metal pieces.', 20, true),
('candle', 'Candle', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'cp', 0, 'A wax candle.', 1, true),
('case-crossbow-bolt', 'Case, crossbow bolt', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'gp', 1, 'A case for crossbow bolts.', 1, true),
('case-map-or-scroll', 'Case, map or scroll', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'gp', 1, 'A case for maps or scrolls.', 1, true),
('chain-10-feet', 'Chain (10 feet)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'gp', 10, 'Heavy metal links.', 1, true),
('chalk', 'Chalk', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'cp', 0, 'A piece of chalk.', 1, true),
('chest', 'Chest', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'gp', 25, 'A wooden chest.', 1, true),
('climbers-kit', 'Climber''s kit', 'Adventuring Gear', 'adventuring gear', 'Equipment', 25, 'gp', 12, 'Special pitons, boot tips, gloves, and a harness.', 1, true),
('clothes-common', 'Clothes, common', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'sp', 3, 'Common clothing.', 1, true),
('clothes-costume', 'Clothes, costume', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'gp', 4, 'Costume clothing.', 1, true),
('clothes-fine', 'Clothes, fine', 'Adventuring Gear', 'adventuring gear', 'Equipment', 15, 'gp', 6, 'Fine clothing.', 1, true),
('clothes-travelers', 'Clothes, traveler''s', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 4, 'Traveler''s clothing.', 1, true),
('component-pouch', 'Component pouch', 'Adventuring Gear', 'adventuring gear', 'Equipment', 25, 'gp', 2, 'A small, watertight leather belt pouch.', 1, true),
('crowbar', 'Crowbar', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 5, 'A metal prying bar.', 1, true),
('fishing-tackle', 'Fishing tackle', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'gp', 4, 'A wooden rod, silken line, corkwood bobbers, steel hooks, lead sinkers, velvet lures, and narrow netting.', 1, true),
('flask-or-tankard', 'Flask or tankard', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'cp', 1, 'A drinking vessel.', 1, true),
('grappling-hook', 'Grappling hook', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 4, 'A four-pronged hook.', 1, true),
('hammer', 'Hammer', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'gp', 3, 'A basic hammer.', 1, true),
('hammer-sledge', 'Hammer, sledge', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 10, 'A heavy hammer.', 1, true),
('hourglass', 'Hourglass', 'Adventuring Gear', 'adventuring gear', 'Equipment', 25, 'gp', 1, 'A time-keeping device.', 1, true),
('hunting-trap', 'Hunting trap', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'gp', 25, 'A steel trap.', 1, true),
('ink-1-ounce-bottle', 'Ink (1 ounce bottle)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 10, 'gp', 0, 'A bottle of ink.', 1, true),
('ink-pen', 'Ink pen', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'cp', 0, 'A writing implement.', 1, true),
('jug-or-pitcher', 'Jug or pitcher', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'cp', 4, 'A ceramic vessel.', 1, true),
('ladder-10-foot', 'Ladder (10-foot)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'sp', 25, 'A wooden ladder.', 1, true),
('lamp', 'Lamp', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'sp', 1, 'A simple lamp.', 1, true),
('lantern-bullseye', 'Lantern, bullseye', 'Adventuring Gear', 'adventuring gear', 'Equipment', 10, 'gp', 2, 'A focused lantern.', 1, true),
('lantern-hooded', 'Lantern, hooded', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'gp', 2, 'A shielded lantern.', 1, true),
('lock', 'Lock', 'Adventuring Gear', 'adventuring gear', 'Equipment', 10, 'gp', 1, 'A padlock with a key.', 1, true),
('magnifying-glass', 'Magnifying glass', 'Adventuring Gear', 'adventuring gear', 'Equipment', 100, 'gp', 0, 'A lens that magnifies.', 1, true),
('manacles', 'Manacles', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 6, 'Metal restraints.', 1, true),
('mess-kit', 'Mess kit', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'sp', 1, 'A tin box containing a cup and simple cutlery.', 1, true),
('mirror-steel', 'Mirror, steel', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'gp', 0.5, 'A polished steel mirror.', 1, true),
('oil-flask', 'Oil (flask)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'sp', 1, 'A flask of oil.', 1, true),
('paper-one-sheet', 'Paper (one sheet)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'sp', 0, 'A sheet of paper.', 1, true),
('parchment-one-sheet', 'Parchment (one sheet)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'sp', 0, 'A sheet of parchment.', 1, true),
('perfume-vial', 'Perfume (vial)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'gp', 0, 'A vial of perfume.', 1, true),
('pick-miners', 'Pick, miner''s', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 10, 'A mining pick.', 1, true),
('piton', 'Piton', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'cp', 0.25, 'A metal spike.', 1, true),
('pole-10-foot', 'Pole (10-foot)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'cp', 7, 'A long wooden pole.', 1, true),
('pot-iron', 'Pot, iron', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 10, 'An iron cooking pot.', 1, true),
('pouch', 'Pouch', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'sp', 1, 'A small belt pouch.', 1, true),
('quiver', 'Quiver', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'gp', 1, 'A container for arrows.', 1, true),
('ram-portable', 'Ram, portable', 'Adventuring Gear', 'adventuring gear', 'Equipment', 4, 'gp', 35, 'A portable battering ram.', 1, true),
('rations-1-day', 'Rations (1 day)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'sp', 2, 'Dried foods for one day.', 1, true),
('robes', 'Robes', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'gp', 4, 'Flowing robes.', 1, true),
('rope-hempen-50-feet', 'Rope, hempen (50 feet)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 10, 'Strong hemp rope.', 1, true),
('rope-silk-50-feet', 'Rope, silk (50 feet)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 10, 'gp', 5, 'Fine silk rope.', 1, true),
('sack', 'Sack', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'cp', 0.5, 'A cloth sack.', 1, true),
('scale-merchants', 'Scale, merchant''s', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'gp', 3, 'A small balance and weights.', 1, true),
('sealing-wax', 'Sealing wax', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'sp', 0, 'Wax for sealing documents.', 1, true),
('shovel', 'Shovel', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 5, 'A digging tool.', 1, true),
('signal-whistle', 'Signal whistle', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'cp', 0, 'A small whistle.', 1, true),
('signet-ring', 'Signet ring', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'gp', 0, 'A ring bearing a signet.', 1, true),
('soap', 'Soap', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'cp', 0, 'A bar of soap.', 1, true),
('spellbook', 'Spellbook', 'Adventuring Gear', 'adventuring gear', 'Equipment', 50, 'gp', 3, 'A leather-bound tome with 100 blank vellum pages.', 1, true),
('spikes-iron-10', 'Spikes, iron (10)', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'gp', 5, 'Iron spikes.', 10, true),
('spyglass', 'Spyglass', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1000, 'gp', 1, 'A telescoping device.', 1, true),
('tent-two-person', 'Tent, two-person', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 20, 'A simple shelter.', 1, true),
('tinderbox', 'Tinderbox', 'Adventuring Gear', 'adventuring gear', 'Equipment', 5, 'sp', 1, 'Flint, fire steel, and tinder.', 1, true),
('torch', 'Torch', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'cp', 1, 'A burning brand.', 1, true),
('vial', 'Vial', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'gp', 0, 'A small glass vial.', 1, true),
('waterskin', 'Waterskin', 'Adventuring Gear', 'adventuring gear', 'Equipment', 2, 'gp', 5, 'A leather water container.', 1, true),
('whetstone', 'Whetstone', 'Adventuring Gear', 'adventuring gear', 'Equipment', 1, 'cp', 1, 'A sharpening stone.', 1, true);

-- Insert tools
INSERT INTO equipment (
  index, name, equipment_category, type, gear_category, cost_quantity, cost_unit, weight,
  description, enabled
) VALUES
-- Artisan's Tools
('alchemists-supplies', 'Alchemist''s supplies', 'Tools', 'tool', 'Artisan''s Tools', 50, 'gp', 8, 'These special tools include the items needed to pursue a craft or trade.', true),
('brewers-supplies', 'Brewer''s supplies', 'Tools', 'tool', 'Artisan''s Tools', 20, 'gp', 9, 'These special tools include the items needed to pursue a craft or trade.', true),
('calligraphers-supplies', 'Calligrapher''s supplies', 'Tools', 'tool', 'Artisan''s Tools', 10, 'gp', 5, 'These special tools include the items needed to pursue a craft or trade.', true),
('carpenters-tools', 'Carpenter''s tools', 'Tools', 'tool', 'Artisan''s Tools', 8, 'gp', 6, 'These special tools include the items needed to pursue a craft or trade.', true),
('cartographers-tools', 'Cartographer''s tools', 'Tools', 'tool', 'Artisan''s Tools', 15, 'gp', 6, 'These special tools include the items needed to pursue a craft or trade.', true),
('cobblers-tools', 'Cobbler''s tools', 'Tools', 'tool', 'Artisan''s Tools', 5, 'gp', 5, 'These special tools include the items needed to pursue a craft or trade.', true),
('cooks-utensils', 'Cook''s utensils', 'Tools', 'tool', 'Artisan''s Tools', 1, 'gp', 8, 'These special tools include the items needed to pursue a craft or trade.', true),
('glassblowers-tools', 'Glassblower''s tools', 'Tools', 'tool', 'Artisan''s Tools', 30, 'gp', 5, 'These special tools include the items needed to pursue a craft or trade.', true),
('jewelers-tools', 'Jeweler''s tools', 'Tools', 'tool', 'Artisan''s Tools', 25, 'gp', 2, 'These special tools include the items needed to pursue a craft or trade.', true),
('leatherworkers-tools', 'Leatherworker''s tools', 'Tools', 'tool', 'Artisan''s Tools', 5, 'gp', 5, 'These special tools include the items needed to pursue a craft or trade.', true),
('masons-tools', 'Mason''s tools', 'Tools', 'tool', 'Artisan''s Tools', 10, 'gp', 8, 'These special tools include the items needed to pursue a craft or trade.', true),
('painters-supplies', 'Painter''s supplies', 'Tools', 'tool', 'Artisan''s Tools', 10, 'gp', 5, 'These special tools include the items needed to pursue a craft or trade.', true),
('potters-tools', 'Potter''s tools', 'Tools', 'tool', 'Artisan''s Tools', 10, 'gp', 3, 'These special tools include the items needed to pursue a craft or trade.', true),
('smiths-tools', 'Smith''s tools', 'Tools', 'tool', 'Artisan''s Tools', 20, 'gp', 8, 'These special tools include the items needed to pursue a craft or trade.', true),
('tinkers-tools', 'Tinker''s tools', 'Tools', 'tool', 'Artisan''s Tools', 50, 'gp', 10, 'These special tools include the items needed to pursue a craft or trade.', true),
('weavers-tools', 'Weaver''s tools', 'Tools', 'tool', 'Artisan''s Tools', 1, 'gp', 5, 'These special tools include the items needed to pursue a craft or trade.', true),
('woodcarvers-tools', 'Woodcarver''s tools', 'Tools', 'tool', 'Artisan''s Tools', 1, 'gp', 5, 'These special tools include the items needed to pursue a craft or trade.', true),

-- Gaming Sets
('dice-set', 'Dice set', 'Tools', 'tool', 'Gaming Set', 1, 'sp', 0, 'This item encompasses a wide range of game pieces, including dice and decks of cards.', true),
('playing-card-set', 'Playing card set', 'Tools', 'tool', 'Gaming Set', 5, 'sp', 0, 'This item encompasses a wide range of game pieces, including dice and decks of cards.', true),

-- Musical Instruments
('bagpipes', 'Bagpipes', 'Tools', 'tool', 'Musical Instrument', 30, 'gp', 6, 'Several of the most common types of musical instruments are shown on the table as examples.', true),
('drum', 'Drum', 'Tools', 'tool', 'Musical Instrument', 6, 'gp', 3, 'Several of the most common types of musical instruments are shown on the table as examples.', true),
('dulcimer', 'Dulcimer', 'Tools', 'tool', 'Musical Instrument', 25, 'gp', 10, 'Several of the most common types of musical instruments are shown on the table as examples.', true),
('flute', 'Flute', 'Tools', 'tool', 'Musical Instrument', 2, 'gp', 1, 'Several of the most common types of musical instruments are shown on the table as examples.', true),
('lute', 'Lute', 'Tools', 'tool', 'Musical Instrument', 35, 'gp', 2, 'Several of the most common types of musical instruments are shown on the table as examples.', true),
('lyre', 'Lyre', 'Tools', 'tool', 'Musical Instrument', 30, 'gp', 2, 'Several of the most common types of musical instruments are shown on the table as examples.', true),
('horn', 'Horn', 'Tools', 'tool', 'Musical Instrument', 3, 'gp', 2, 'Several of the most common types of musical instruments are shown on the table as examples.', true),
('pan-flute', 'Pan flute', 'Tools', 'tool', 'Musical Instrument', 12, 'gp', 2, 'Several of the most common types of musical instruments are shown on the table as examples.', true),
('shawm', 'Shawm', 'Tools', 'tool', 'Musical Instrument', 2, 'gp', 1, 'Several of the most common types of musical instruments are shown on the table as examples.', true),
('viol', 'Viol', 'Tools', 'tool', 'Musical Instrument', 30, 'gp', 1, 'Several of the most common types of musical instruments are shown on the table as examples.', true),

-- Other Tools
('disguise-kit', 'Disguise kit', 'Tools', 'tool', 'Kit', 25, 'gp', 3, 'This pouch of cosmetics, hair dye, and small props lets you create disguises that change your physical appearance.', true),
('forgery-kit', 'Forgery kit', 'Tools', 'tool', 'Kit', 15, 'gp', 5, 'This small box contains a variety of papers and parchments, pens and inks, seals and sealing wax, gold and silver leaf, and other supplies necessary to create convincing forgeries of physical documents.', true),
('herbalism-kit', 'Herbalism kit', 'Tools', 'tool', 'Kit', 5, 'gp', 3, 'This kit contains a variety of instruments such as clippers, mortar and pestle, and pouches and vials used by herbalists to create remedies and potions.', true),
('navigators-tools', 'Navigator''s tools', 'Tools', 'tool', 'Kit', 25, 'gp', 2, 'This set of instruments is used for navigation at sea.', true),
('poisoners-kit', 'Poisoner''s kit', 'Tools', 'tool', 'Kit', 50, 'gp', 2, 'A poisoner''s kit includes the vials, chemicals, and other equipment necessary for the creation of poisons.', true),
('thieves-tools', 'Thieves'' tools', 'Tools', 'tool', 'Kit', 25, 'gp', 1, 'This set of tools includes a small file, a set of lock picks, a small mirror mounted on a metal handle, a set of narrow-bladed scissors, and a pair of pliers.', true);

-- Insert ammunition
INSERT INTO equipment (
  index, name, equipment_category, type, cost_quantity, cost_unit, weight,
  description, quantity, enabled
) VALUES
('arrows-20', 'Arrows (20)', 'Ammunition', 'ammunition', 1, 'gp', 1, 'A quiver of arrows.', 20, true),
('blowgun-needles-50', 'Blowgun needles (50)', 'Ammunition', 'ammunition', 1, 'gp', 1, 'A case of blowgun needles.', 50, true),
('crossbow-bolts-20', 'Crossbow bolts (20)', 'Ammunition', 'ammunition', 1, 'gp', 1.5, 'A case of crossbow bolts.', 20, true),
('sling-bullets-20', 'Sling bullets (20)', 'Ammunition', 'ammunition', 4, 'cp', 1.5, 'A pouch of sling bullets.', 20, true);

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_index ON equipment(index);
CREATE INDEX IF NOT EXISTS idx_equipment_equipment_category ON equipment(equipment_category);
CREATE INDEX IF NOT EXISTS idx_equipment_weapon_category ON equipment(weapon_category);
CREATE INDEX IF NOT EXISTS idx_equipment_armor_category ON equipment(armor_category);
CREATE INDEX IF NOT EXISTS idx_equipment_gear_category ON equipment(gear_category);
CREATE INDEX IF NOT EXISTS idx_equipment_enabled ON equipment(enabled);
CREATE INDEX IF NOT EXISTS idx_equipment_cost ON equipment(cost_quantity, cost_unit);