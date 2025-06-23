import { atom } from 'jotai';
import { supabase } from '../config/supabase';
import { Character, fetchCharactersAtom } from './characterAtoms';
import { userAtom } from './authAtoms';

// Types
export interface LevelUpCharacter {
  id: string;
  name: string;
  previousLevel: number;
  newLevel: number;
  class: string;
  race: string;
}

// State atoms
export const charactersToLevelUpAtom = atom<LevelUpCharacter[]>([]);
export const currentLevelUpCharacterAtom = atom<LevelUpCharacter | null>(null);
export const isLevelUpModalVisibleAtom = atom(false);
export const levelUpStepAtom = atom(0);

// Derived atom to check if any characters need leveling up
export const hasCharactersToLevelUpAtom = atom(
  (get) => get(charactersToLevelUpAtom).length > 0
);

// Action to check for characters that need to level up
export const checkForLevelUpCharactersAtom = atom(
  null,
  async (get, set) => {
    const user = get(userAtom);
    if (!user) return;

    try {
      // Get current characters from state
      const { data: characters, error } = await supabase
        .from('characters')
        .select('id, name, level, class, race, previous_level')
        .eq('user_id', user.id);

      if (error) throw error;

      // Find characters that have leveled up (level > previous_level)
      const leveledUpCharacters = characters
        .filter(char => 
          char.level > (char.previous_level || 1) && 
          char.previous_level !== null
        )
        .map(char => ({
          id: char.id,
          name: char.name,
          previousLevel: char.previous_level || 1,
          newLevel: char.level,
          class: char.class,
          race: char.race
        }));

      set(charactersToLevelUpAtom, leveledUpCharacters);
      
      // If there are characters to level up, set the first one as current
      if (leveledUpCharacters.length > 0) {
        set(currentLevelUpCharacterAtom, leveledUpCharacters[0]);
      }
    } catch (error) {
      console.error('Error checking for level up characters:', error);
    }
  }
);

// Action to start the level up process for a character
export const startLevelUpProcessAtom = atom(
  null,
  (get, set, characterId: string) => {
    const charactersToLevelUp = get(charactersToLevelUpAtom);
    const character = charactersToLevelUp.find(c => c.id === characterId);
    
    if (character) {
      set(currentLevelUpCharacterAtom, character);
      set(levelUpStepAtom, 0);
      set(isLevelUpModalVisibleAtom, true);
    }
  }
);

// Action to complete the level up process for a character
export const completeLevelUpProcessAtom = atom(
  null,
  async (get, set, characterId: string) => {
    try {
      // Update the character's previous_level to match current level
      const { error } = await supabase
        .from('characters')
        .update({ 
          previous_level: supabase.rpc('get_character_level', { character_id: characterId })
        })
        .eq('id', characterId);

      if (error) throw error;

      // Remove the character from the list of characters to level up
      const charactersToLevelUp = get(charactersToLevelUpAtom);
      const updatedCharacters = charactersToLevelUp.filter(c => c.id !== characterId);
      set(charactersToLevelUpAtom, updatedCharacters);
      
      // If there are more characters to level up, set the next one as current
      if (updatedCharacters.length > 0) {
        set(currentLevelUpCharacterAtom, updatedCharacters[0]);
        set(levelUpStepAtom, 0);
      } else {
        set(currentLevelUpCharacterAtom, null);
        set(isLevelUpModalVisibleAtom, false);
      }
      
      // Refresh characters list
      const [, fetchCharacters] = get(fetchCharactersAtom);
      await fetchCharacters();
    } catch (error) {
      console.error('Error completing level up process:', error);
    }
  }
);

// Action to dismiss the level up modal
export const dismissLevelUpModalAtom = atom(
  null,
  (get, set) => {
    set(isLevelUpModalVisibleAtom, false);
  }
);

// Action to go to the next level up step
export const nextLevelUpStepAtom = atom(
  null,
  (get, set) => {
    const currentStep = get(levelUpStepAtom);
    set(levelUpStepAtom, currentStep + 1);
  }
);

// Action to go to the previous level up step
export const prevLevelUpStepAtom = atom(
  null,
  (get, set) => {
    const currentStep = get(levelUpStepAtom);
    if (currentStep > 0) {
      set(levelUpStepAtom, currentStep - 1);
    }
  }
);

// Initialize real-time subscription for character level changes
export const initializeCharacterLevelRealtimeAtom = atom(
  null,
  async (get, set) => {
    const user = get(userAtom);
    if (!user) return;

    const subscription = supabase
      .channel('character-level-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Check if level has changed
          if (payload.new.level !== payload.old.level) {
            console.log('Character level changed:', payload.new.name, payload.old.level, '->', payload.new.level);
            // Trigger check for level up characters
            set(checkForLevelUpCharactersAtom);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
);