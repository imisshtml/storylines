import { atom } from 'jotai';
import { supabase } from '../config/supabase';

export type DnDAbilities = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export type DnDSkill = {
  name: string;
  ability: string;
  proficient: boolean;
};

export type DnDSpell = {
  index: string;
  name: string;
  level: number;
  school: { name: string };
  casting_time: string;
  range: string;
  components: string[];
  duration: string;
  description: string[];
  concentration: boolean;
};

export type DnDEquipment = {
  weapons: any[];
  armor: any[];
  tools: any[];
  other: any[];
};

export type Equipment = {
  id: string;
  index: string;
  name: string;
  equipment_category: string;
  weight: number;
  cost_quantity: number;
  cost_unit: string;
  description: string[];
  special: string[];
  contents: any[];
  properties: any[];
  armor_category?: string;
  armor_class_base?: number;
  armor_class_dex_bonus?: boolean;
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  weapon_category?: string;
  weapon_range?: string;
  category_range?: string;
  damage_dice?: string;
  damage_type?: string;
  range_normal?: number;
  range_long?: number;
  throw_range_normal?: number;
  throw_range_long?: number;
  gear_category?: string;
  quantity?: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Character = {
  id: string;
  user_id: string;
  campaign_id?: string;
  name: string;
  race: string;
  class: string;
  background: string;
  level: number;
  abilities: DnDAbilities;
  skills: DnDSkill[];
  spells: DnDSpell[];
  equipment: DnDEquipment;
  character_data: any;
  current_hitpoints: number;
  max_hitpoints: number;
  temp_hitpoints: number;
  armor_class: number;
  conditions: any[];
  gold: number;
  silver: number;
  copper: number;
  created_at?: string;
  updated_at?: string;
};

export type Race = {
  index: string;
  name: string;
  ability_bonuses: {
    ability_score: { index: string; name: string };
    bonus: number;
  }[];
  size: string;
  speed: number;
  languages: { index: string; name: string }[];
  traits: { index: string; name: string }[];
  subraces?: { index: string; name: string }[];
};

export type Class = {
  index: string;
  name: string;
  hit_die: number;
  proficiencies: { index: string; name: string }[];
  proficiency_choices: {
    choose: number;
    type: string;
    from: {
      options: {
        item: { index: string; name: string };
      }[];
    };
  }[];
  saving_throws: { index: string; name: string }[];
  starting_equipment: {
    equipment: { index: string; name: string };
    quantity: number;
  }[];
  starting_equipment_options: {
    choose: number;
    type: string;
    from: {
      equipment: { index: string; name: string };
      quantity: number;
    }[];
  }[];
  spellcasting?: {
    level: number;
    spellcasting_ability: { index: string; name: string };
  };
};

// D&D 5e Starting Wealth by Class (max roll in gold pieces)
export const STARTING_WEALTH_BY_CLASS: { [key: string]: { dice: string; multiplier: number; maxRoll: number } } = {
  'Barbarian': { dice: '2d4', multiplier: 10, maxRoll: 80 },
  'Bard': { dice: '5d4', multiplier: 10, maxRoll: 200 },
  'Cleric': { dice: '5d4', multiplier: 10, maxRoll: 200 },
  'Druid': { dice: '2d4', multiplier: 10, maxRoll: 80 },
  'Fighter': { dice: '5d4', multiplier: 10, maxRoll: 200 },
  'Monk': { dice: '5d4', multiplier: 1, maxRoll: 20 },
  'Paladin': { dice: '5d4', multiplier: 10, maxRoll: 200 },
  'Ranger': { dice: '5d4', multiplier: 10, maxRoll: 200 },
  'Rogue': { dice: '4d4', multiplier: 10, maxRoll: 160 },
  'Sorcerer': { dice: '3d4', multiplier: 10, maxRoll: 120 },
  'Warlock': { dice: '4d4', multiplier: 10, maxRoll: 160 },
  'Wizard': { dice: '4d4', multiplier: 10, maxRoll: 160 },
};

// Character creation state atoms
export const characterCreationStepAtom = atom(0);
export const characterNameAtom = atom('');
export const selectedRaceAtom = atom<Race | null>(null);
export const selectedClassAtom = atom<Class | null>(null);
export const characterAbilitiesAtom = atom<DnDAbilities>({
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
});
export const selectedSkillsAtom = atom<string[]>([]);
export const selectedSpellsAtom = atom<DnDSpell[]>([]);
export const characterEquipmentAtom = atom<DnDEquipment>({
  weapons: [],
  armor: [],
  tools: [],
  other: [],
});

// Currency atoms for character creation
export const characterGoldAtom = atom(0);
export const characterSilverAtom = atom(0);
export const characterCopperAtom = atom(0);

// Purchased equipment atom
export const purchasedEquipmentAtom = atom<Equipment[]>([]);

// API data atoms
export const racesAtom = atom<Race[]>([]);
export const classesAtom = atom<Class[]>([]);
export const spellsAtom = atom<DnDSpell[]>([]);
export const equipmentAtom = atom<Equipment[]>([]);

// Characters storage
export const charactersAtom = atom<Character[]>([]);
export const charactersLoadingAtom = atom(false);
export const charactersErrorAtom = atom<string | null>(null);

// Helper function for retrying failed requests
const fetchWithRetry = async (url: string, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to get starting gold for a class (max roll)
export const getStartingGold = (className: string): number => {
  const wealthData = STARTING_WEALTH_BY_CLASS[className];
  if (!wealthData) {
    return 50; // Default fallback
  }
  return wealthData.maxRoll;
};

// Atom to set starting wealth based on selected class
export const setStartingWealthAtom = atom(
  null,
  (get, set) => {
    const selectedClass = get(selectedClassAtom);
    
    if (selectedClass) {
      const startingGold = getStartingGold(selectedClass.name);
      set(characterGoldAtom, startingGold);
      set(characterSilverAtom, 0);
      set(characterCopperAtom, 0);
    }
  }
);

// Fetch races from D&D API
export const fetchRacesAtom = atom(
  null,
  async (get, set) => {
    try {
      const data = await fetchWithRetry('https://www.dnd5eapi.co/api/races');
      
      const detailedRaces = await Promise.all(
        data.results.map(async (race: any) => {
          try {
            return await fetchWithRetry(`https://www.dnd5eapi.co${race.url}`);
          } catch (error) {
            console.error(`Error fetching race ${race.index}:`, error);
            return null;
          }
        })
      );
      
      // Filter out failed fetches
      const validRaces = detailedRaces.filter((race): race is NonNullable<typeof race> => 
        race !== null && typeof race === 'object'
      );
      
      set(racesAtom, validRaces);
    } catch (error) {
      console.error('Error fetching races:', error);
      set(racesAtom, []); // Set empty array on error
    }
  }
);

// Fetch classes from D&D API
export const fetchClassesAtom = atom(
  null,
  async (get, set) => {
    try {
      const data = await fetchWithRetry('https://www.dnd5eapi.co/api/classes');
      
      const detailedClasses = await Promise.all(
        data.results.map(async (cls: any) => {
          try {
            return await fetchWithRetry(`https://www.dnd5eapi.co${cls.url}`);
          } catch (error) {
            console.error(`Error fetching class ${cls.index}:`, error);
            return null;
          }
        })
      );
      
      // Filter out failed fetches
      const validClasses = detailedClasses.filter((cls): cls is NonNullable<typeof cls> => 
        cls !== null && typeof cls === 'object'
      );
      
      set(classesAtom, validClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      set(classesAtom, []); // Set empty array on error
    }
  }
);

// Fetch spells from Supabase
export const fetchSpellsAtom = atom(
  null,
  async (get, set) => {
    try {
      const { data: spells, error } = await supabase
        .from('spells')
        .select('*')
        .lte('level', 1)
        .order('level')
        .order('name');

      if (error) {
        throw error;
      }

      set(spellsAtom, spells);
    } catch (error) {
      console.error('Error fetching spells:', error);
      set(spellsAtom, []); // Set empty array on error
    }
  }
);

// Fetch equipment from Supabase
export const fetchEquipmentAtom = atom(
  null,
  async (get, set) => {
    try {
      const { data: equipment, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('enabled', true)
        .order('equipment_category')
        .order('name');

      if (error) {
        throw error;
      }

      set(equipmentAtom, equipment || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      set(equipmentAtom, []); // Set empty array on error
    }
  }
);

// Save character to Supabase
export const saveCharacterAtom = atom(
  null,
  async (get, set, character: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      set(charactersLoadingAtom, true);
      set(charactersErrorAtom, null);

      const { data, error } = await supabase
        .from('characters')
        .insert(character)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const currentCharacters = get(charactersAtom);
      set(charactersAtom, [...currentCharacters, data]);

      return data;
    } catch (error) {
      set(charactersErrorAtom, (error as Error).message);
      throw error;
    } finally {
      set(charactersLoadingAtom, false);
    }
  }
);

// Fetch user's characters
export const fetchCharactersAtom = atom(
  null,
  async (get, set) => {
    try {
      set(charactersLoadingAtom, true);
      set(charactersErrorAtom, null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set(charactersAtom, data || []);
    } catch (error) {
      set(charactersErrorAtom, (error as Error).message);
      console.error('Error fetching characters:', error);
    } finally {
      set(charactersLoadingAtom, false);
    }
  }
);

// Reset character creation state
export const resetCharacterCreationAtom = atom(
  null,
  (get, set) => {
    set(characterCreationStepAtom, 0);
    set(characterNameAtom, '');
    set(selectedRaceAtom, null);
    set(selectedClassAtom, null);
    set(characterAbilitiesAtom, {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    });
    set(selectedSkillsAtom, []);
    set(selectedSpellsAtom, []);
    set(characterEquipmentAtom, {
      weapons: [],
      armor: [],
      tools: [],
      other: [],
    });
    set(characterGoldAtom, 0);
    set(characterSilverAtom, 0);
    set(characterCopperAtom, 0);
    set(purchasedEquipmentAtom, []);
  }
);

// Helper functions for currency conversion
export const convertToCopper = (gold: number, silver: number, copper: number): number => {
  return (gold * 100) + (silver * 10) + copper;
};

export const convertFromCopper = (totalCopper: number): { gold: number; silver: number; copper: number } => {
  const gold = Math.floor(totalCopper / 100);
  const remaining = totalCopper % 100;
  const silver = Math.floor(remaining / 10);
  const copper = remaining % 10;
  
  return { gold, silver, copper };
};

// Calculate equipment cost in copper based on cost_quantity and cost_unit
export const getEquipmentCostInCopper = (equipment: Equipment): number => {
  const { cost_quantity, cost_unit } = equipment;
  
  switch (cost_unit) {
    case 'cp':
      return cost_quantity;
    case 'sp':
      return cost_quantity * 10;
    case 'gp':
      return cost_quantity * 100;
    case 'pp':
      return cost_quantity * 1000;
    default:
      return cost_quantity * 100; // Default to gold
  }
};

// Check if player can afford equipment
export const canAffordEquipment = (equipment: Equipment, gold: number, silver: number, copper: number): boolean => {
  const totalPlayerCopper = convertToCopper(gold, silver, copper);
  const equipmentCost = getEquipmentCostInCopper(equipment);
  return totalPlayerCopper >= equipmentCost;
};

// Purchase equipment atom
export const purchaseEquipmentAtom = atom(
  null,
  (get, set, equipment: Equipment) => {
    const currentGold = get(characterGoldAtom);
    const currentSilver = get(characterSilverAtom);
    const currentCopper = get(characterCopperAtom);
    const purchasedEquipment = get(purchasedEquipmentAtom);

    if (!canAffordEquipment(equipment, currentGold, currentSilver, currentCopper)) {
      throw new Error('Cannot afford this equipment');
    }

    // Calculate new currency amounts
    const totalPlayerCopper = convertToCopper(currentGold, currentSilver, currentCopper);
    const equipmentCost = getEquipmentCostInCopper(equipment);
    const remainingCopper = totalPlayerCopper - equipmentCost;
    const newCurrency = convertFromCopper(remainingCopper);

    // Update currency
    set(characterGoldAtom, newCurrency.gold);
    set(characterSilverAtom, newCurrency.silver);
    set(characterCopperAtom, newCurrency.copper);

    // Add equipment to purchased list
    set(purchasedEquipmentAtom, [...purchasedEquipment, equipment]);
  }
);

// Remove equipment atom
export const removeEquipmentAtom = atom(
  null,
  (get, set, equipment: Equipment) => {
    const currentGold = get(characterGoldAtom);
    const currentSilver = get(characterSilverAtom);
    const currentCopper = get(characterCopperAtom);
    const purchasedEquipment = get(purchasedEquipmentAtom);

    // Calculate refund (full price back)
    const totalPlayerCopper = convertToCopper(currentGold, currentSilver, currentCopper);
    const equipmentCost = getEquipmentCostInCopper(equipment);
    const newTotalCopper = totalPlayerCopper + equipmentCost;
    const newCurrency = convertFromCopper(newTotalCopper);

    // Update currency
    set(characterGoldAtom, newCurrency.gold);
    set(characterSilverAtom, newCurrency.silver);
    set(characterCopperAtom, newCurrency.copper);

    // Remove equipment from purchased list
    set(purchasedEquipmentAtom, purchasedEquipment.filter(item => item.id !== equipment.id));
  }
);