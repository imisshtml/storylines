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
  school: string;
  casting_time: string;
  range: string;
  components: string[];
  duration: string;
  description: string[];
};

export type DnDEquipment = {
  weapons: any[];
  armor: any[];
  tools: any[];
  other: any[];
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
  created_at?: string;
  updated_at?: string;
};

export type Race = {
  index: string;
  name: string;
  ability_score_increases: Array<{
    ability_score: { index: string; name: string };
    bonus: number;
  }>;
  size: string;
  speed: number;
  languages: Array<{ index: string; name: string }>;
  traits: Array<{ index: string; name: string }>;
  subraces?: Array<{ index: string; name: string }>;
};

export type Class = {
  index: string;
  name: string;
  hit_die: number;
  proficiencies: Array<{ index: string; name: string }>;
  proficiency_choices: Array<{
    choose: number;
    type: string;
    from: Array<{ index: string; name: string }>;
  }>;
  saving_throws: Array<{ index: string; name: string }>;
  starting_equipment: Array<{
    equipment: { index: string; name: string };
    quantity: number;
  }>;
  starting_equipment_options: Array<{
    choose: number;
    type: string;
    from: Array<{
      equipment: { index: string; name: string };
      quantity: number;
    }>;
  }>;
  spellcasting?: {
    level: number;
    spellcasting_ability: { index: string; name: string };
  };
};

export type Background = {
  index: string;
  name: string;
  skill_proficiencies: Array<{ index: string; name: string }>;
  languages: Array<{ index: string; name: string }>;
  equipment: Array<{
    equipment: { index: string; name: string };
    quantity: number;
  }>;
  feature: {
    name: string;
    desc: string[];
  };
};

// Character creation state atoms
export const characterCreationStepAtom = atom(0);
export const characterNameAtom = atom('');
export const selectedRaceAtom = atom<Race | null>(null);
export const selectedClassAtom = atom<Class | null>(null);
export const selectedBackgroundAtom = atom<Background | null>(null);
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

// API data atoms
export const racesAtom = atom<Race[]>([]);
export const classesAtom = atom<Class[]>([]);
export const backgroundsAtom = atom<Background[]>([]);
export const spellsAtom = atom<DnDSpell[]>([]);

// Characters storage
export const charactersAtom = atom<Character[]>([]);
export const charactersLoadingAtom = atom(false);
export const charactersErrorAtom = atom<string | null>(null);

// Fetch races from D&D API
export const fetchRacesAtom = atom(
  null,
  async (get, set) => {
    try {
      const response = await fetch('https://www.dnd5eapi.co/api/races');
      const data = await response.json();
      
      const detailedRaces = await Promise.all(
        data.results.map(async (race: any) => {
          const raceResponse = await fetch(`https://www.dnd5eapi.co${race.url}`);
          return await raceResponse.json();
        })
      );
      
      set(racesAtom, detailedRaces);
    } catch (error) {
      console.error('Error fetching races:', error);
    }
  }
);

// Fetch classes from D&D API
export const fetchClassesAtom = atom(
  null,
  async (get, set) => {
    try {
      const response = await fetch('https://www.dnd5eapi.co/api/classes');
      const data = await response.json();
      
      const detailedClasses = await Promise.all(
        data.results.map(async (cls: any) => {
          const classResponse = await fetch(`https://www.dnd5eapi.co${cls.url}`);
          return await classResponse.json();
        })
      );
      
      set(classesAtom, detailedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }
);

// Fetch backgrounds from D&D API
export const fetchBackgroundsAtom = atom(
  null,
  async (get, set) => {
    try {
      const response = await fetch('https://www.dnd5eapi.co/api/backgrounds');
      const data = await response.json();
      
      const detailedBackgrounds = await Promise.all(
        data.results.map(async (bg: any) => {
          const bgResponse = await fetch(`https://www.dnd5eapi.co${bg.url}`);
          return await bgResponse.json();
        })
      );
      
      set(backgroundsAtom, detailedBackgrounds);
    } catch (error) {
      console.error('Error fetching backgrounds:', error);
    }
  }
);

// Fetch spells from D&D API (level 0-1 for character creation)
export const fetchSpellsAtom = atom(
  null,
  async (get, set) => {
    try {
      const response = await fetch('https://www.dnd5eapi.co/api/spells');
      const data = await response.json();
      console.log('::: spells', data)
      const level0or1Spells = data.results.filter(spell =>
        spell.level === 0 || spell.level === 1
      );
      const detailedSpells = await Promise.all(
        level0or1Spells.slice(0, 50).map(async (spell: any) => { // Limit to first 50 spells
          console.log('::: spell... ', spell.index)
          const spellResponse = await fetch(`https://www.dnd5eapi.co${spell.url}`);
          return await spellResponse.json();
        })
      );
      
      set(spellsAtom, detailedSpells);
    } catch (error) {
      console.error('Error fetching spells:', error);
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

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set(charactersAtom, data || []);
    } catch (error) {
      set(charactersErrorAtom, (error as Error).message);
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
    set(selectedBackgroundAtom, null);
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
  }
);