import { Character, Equipment } from '../atoms/characterAtoms';
import { supabase } from '../config/supabase';

// D&D 5e ability modifier calculation
export const getAbilityModifier = (abilityScore: number): number => {
  return Math.floor((abilityScore - 10) / 2);
};

// Calculate proficiency bonus based on character level
export const getProficiencyBonus = (level: number): number => {
  let bonus = 2;
  if (level < 5) {
    bonus = 3;
  } else if (level < 9) {
    bonus = 4;
  } else if (level < 13) {
    bonus = 5;
  } else if (level < 17) {
    bonus = 6;
  }
  return bonus;
};

// Check if character is proficient in Stealth skill
export const isStealthProficient = (character: Character): boolean => {
  return character.skills?.includes('Stealth') || false;
};

// Check if character is proficient in Sleight of Hand skill
export const isSleightOfHandProficient = (character: Character): boolean => {
  return character.skills?.includes('Sleight of Hand') || false;
};

// Calculate stealth modifiers from armor and equipment
export const getStealthModifiers = (character: Character): number => {
  let modifier = 0;
  
  // Check equipped armor for stealth disadvantage
  if (character.equipped_items?.armor) {
    const armor = character.equipped_items.armor;
    if (armor.stealth_disadvantage) {
      // In D&D 5e, disadvantage on stealth typically means -5 to passive checks
      // For active rolls, we'll apply a -2 penalty to represent the difficulty
      modifier -= 2;
    }
  }
  
  // Check other equipped items for stealth modifiers
  // This could be expanded to include magical items that affect stealth
  
  return modifier;
};

// Roll for stealth (d20 + dex modifier + proficiency bonus + equipment modifiers)
export const rollStealth = (character: Character): number => {
  const d20Roll = Math.floor(Math.random() * 20) + 1;
  const dexModifier = getAbilityModifier(character.abilities.dexterity);
  const proficiencyBonus = isStealthProficient(character) ? getProficiencyBonus(character.level) : 0;
  const equipmentModifier = getStealthModifiers(character);
  
  const totalRoll = d20Roll + dexModifier + proficiencyBonus + equipmentModifier;
  
  console.log(`🎲 Stealth Roll for ${character.name}:`, {
    d20Roll,
    dexModifier,
    proficiencyBonus,
    equipmentModifier,
    totalRoll
  });
  
  return Math.max(1, totalRoll); // Minimum roll of 1
};

// Check if an action breaks stealth
export const doesActionBreakStealth = (actionDescription: string): boolean => {
  const stealthBreakingKeywords = [
    'attack', 'cast', 'spell', 'shout', 'yell', 'scream',
    'run', 'charge', 'jump', 'climb loudly', 'knock',
    'break', 'smash', 'destroy', 'fight', 'combat',
    'loud', 'noise', 'bang', 'crash', 'slam'
  ];
  
  const stealthMaintainingKeywords = [
    'sneak', 'stealth', 'hide', 'quietly', 'silently',
    'carefully', 'stealthily', 'whisper', 'tiptoe',
    'creep', 'lurk', 'slink', 'skulk'
  ];
  
  const description = actionDescription.toLowerCase();
  
  // If explicitly maintaining stealth, don't break it
  if (stealthMaintainingKeywords.some(keyword => description.includes(keyword))) {
    return false;
  }
  
  // Check for stealth-breaking actions
  return stealthBreakingKeywords.some(keyword => description.includes(keyword));
};

// Update character's stealth roll in database
export const updateCharacterStealth = async (characterId: string, stealthRoll: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('characters')
      .update({ stealth_roll: stealthRoll })
      .eq('id', characterId);
    
    if (error) {
      console.error('Error updating character stealth:', error);
      throw error;
    }
    
    console.log(`✅ Updated stealth for character ${characterId}: ${stealthRoll}`);
  } catch (error) {
    console.error('Failed to update character stealth:', error);
    throw error;
  }
};

// Enter stealth - roll and update database
export const enterStealth = async (character: Character): Promise<number> => {
  const stealthRoll = rollStealth(character);
  await updateCharacterStealth(character.id, stealthRoll);
  return stealthRoll;
};

// Break stealth - set roll to 0
export const breakStealth = async (characterId: string): Promise<void> => {
  await updateCharacterStealth(characterId, 0);
};

// Check if character is currently in stealth
export const isInStealth = (character: Character): boolean => {
  return (character.stealth_roll ?? 0) > 0;
};

// Get stealth roll value
export const getStealthRoll = (character: Character): number => {
  return character.stealth_roll ?? 0;
};

// Roll for Sleight of Hand (used for stealing)
export const rollSleightOfHand = (character: Character): number => {
  const d20Roll = Math.floor(Math.random() * 20) + 1;
  const dexModifier = getAbilityModifier(character.abilities.dexterity);
  const proficiencyBonus = isSleightOfHandProficient(character) ? getProficiencyBonus(character.level) : 0;
  const equipmentModifier = getStealthModifiers(character); // Same modifiers apply
  
  const totalRoll = d20Roll + dexModifier + proficiencyBonus + equipmentModifier;
  
  console.log(`🤏 Sleight of Hand Roll for ${character.name}:`, {
    d20Roll,
    dexModifier,
    proficiencyBonus,
    equipmentModifier,
    totalRoll
  });
  
  return Math.max(1, totalRoll); // Minimum roll of 1
};

// Calculate target's passive perception
export const calculatePassivePerception = (target: any): number => {
  // For NPCs, use a standard passive perception based on type
  if (target.type === 'npc') {
    const npcPerceptionMap: { [key: string]: number } = {
      'merchant': 12,
      'guard': 14,
      'innkeeper': 11,
      'noble': 13,
      'commoner': 10,
      'bandit': 12,
      'traveler': 11
    };
    return npcPerceptionMap[target.id] || 12; // Default 12
  }
  
  // For player characters, calculate based on their stats
  if (target.character) {
    const wisModifier = getAbilityModifier(target.character.abilities.wisdom);
    const proficiencyBonus = target.character.skills?.includes('Perception') ? 
      getProficiencyBonus(target.character.level) : 0;
    return 10 + wisModifier + proficiencyBonus;
  }
  
  return 12; // Default passive perception
};

// Perform steal attempt with D&D 5e mechanics
export const performStealAttempt = async (
  stealerCharacter: Character, 
  target: any, 
  description: string
): Promise<{
  success: boolean;
  stealthBroken: boolean;
  sleightOfHandRoll: number;
  targetPerception: number;
  message: string;
}> => {
  const sleightOfHandRoll = rollSleightOfHand(stealerCharacter);
  const targetPerception = calculatePassivePerception(target);
  
  // Determine if steal was successful
  const stealSuccess = sleightOfHandRoll >= (targetPerception + 5); // DC is passive perception + 5
  
  // Determine if stealth was broken (even if steal succeeds, might be noticed)
  let stealthBroken = sleightOfHandRoll < targetPerception;
  
  let message = '';
  
  if (stealSuccess) {
    if (stealthBroken) {
      message = `${stealerCharacter.name} successfully steals ${description} from ${target.name}, but is noticed in the process! (Sleight of Hand: ${sleightOfHandRoll} vs Perception: ${targetPerception})`;
    } else {
      message = `${stealerCharacter.name} successfully and stealthily steals ${description} from ${target.name}. (Sleight of Hand: ${sleightOfHandRoll} vs Perception: ${targetPerception})`;
    }
  } else {
    message = `${stealerCharacter.name} fails to steal ${description} from ${target.name} and is noticed! (Sleight of Hand: ${sleightOfHandRoll} vs Perception: ${targetPerception})`;
    // Always break stealth on failed steal
    stealthBroken = true;
  }
  
  // Break stealth if detected
  if (stealthBroken) {
    console.log(`💥 Steal attempt broke stealth for ${stealerCharacter.name}`);
    await breakStealth(stealerCharacter.id);
  }
  
  return {
    success: stealSuccess,
    stealthBroken,
    sleightOfHandRoll,
    targetPerception,
    message
  };
};

// Check if an action should automatically break stealth and handle it
export const handleStealthCheck = async (character: Character, actionDescription: string): Promise<boolean> => {
  if (!isInStealth(character)) {
    return false; // Not in stealth, nothing to break
  }
  
  if (doesActionBreakStealth(actionDescription)) {
    console.log(`💥 Action breaks stealth for ${character.name}: ${actionDescription}`);
    await breakStealth(character.id);
    return true; // Stealth was broken
  }
  
  return false; // Stealth maintained
}; 