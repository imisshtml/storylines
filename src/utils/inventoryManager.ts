import { Character, Equipment } from '../atoms/characterAtoms';
import { supabase } from '../config/supabase';
import { getDefaultStore } from 'jotai';
import { equipmentReferenceAtom } from '../atoms/equipmentAtoms';

// Types for inventory operations
export interface InventoryOperation {
  type: 'add' | 'remove' | 'currency_add' | 'currency_remove';
  itemName?: string;
  itemId?: string;
  quantity?: number;
  gold?: number;
  silver?: number;
  copper?: number;
  reason: string;
}

export interface InventoryValidation {
  valid: boolean;
  message: string;
  hasItem?: boolean;
  currentQuantity?: number;
  hasCurrency?: boolean;
  currentGold?: number;
  currentSilver?: number;
  currentCopper?: number;
  actualItemName?: string; // The actual item name from inventory (for loose matching)
}

// Validate if an item exists in the equipment reference
export const validateItemInEquipmentReference = (itemName: string): { isValid: boolean; matchedItem: any | null; suggestion: string | null } => {
  const store = getDefaultStore();
  const equipmentReference = store.get(equipmentReferenceAtom);
  
  if (!equipmentReference || equipmentReference.length === 0) {
    console.warn('🛡️ Equipment reference not loaded, cannot validate item');
    return { isValid: false, matchedItem: null, suggestion: null };
  }

  const normalizeText = (text: string) => 
    text.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  
  const searchNormalized = normalizeText(itemName);
  
  const found = equipmentReference.find(item => {
    const itemNameNormalized = normalizeText(item.name);
    
    // Exact match or substring match
    if (itemNameNormalized === searchNormalized || itemNameNormalized.includes(searchNormalized)) {
      return true;
    }
    
    // Word-based matching
    const searchWords = searchNormalized.split(' ').filter(w => w.length > 2);
    const itemWords = itemNameNormalized.split(' ').filter(w => w.length > 2);
    
    return searchWords.some(searchWord => 
      itemWords.some(itemWord => 
        itemWord.includes(searchWord) || searchWord.includes(itemWord)
      )
    );
  });
  
  return {
    isValid: !!found,
    matchedItem: found || null,
    suggestion: found ? found.name : null
  };
};

// Check if character has a specific item and return the actual item if found
export const findItem = (character: Character, itemName: string, quantity: number = 1): { found: boolean; item?: Equipment; hasQuantity: boolean } => {
  if (!character.equipment) {
    console.log(`🎒 DEBUG: Character ${character.name} has no equipment array`);
    return { found: false, hasQuantity: false };
  }
  
  // Very aggressive normalization for loose matching
  const normalizeItemName = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z\s]/g, '') // Remove all non-letter, non-space characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };
  
  const searchName = normalizeItemName(itemName);
  console.log(`🎒 DEBUG: Looking for item "${itemName}" (normalized: "${searchName}") in ${character.name}'s inventory`);
  console.log(`🎒 DEBUG: Equipment items:`, character.equipment.map(eq => `"${eq.name}" (normalized: "${normalizeItemName(eq.name)}", qty: ${eq.quantity || 1})`));
  
  // Try multiple matching strategies
  const item = character.equipment.find(eq => {
    const equipmentName = normalizeItemName(eq.name);
    
    // Strategy 1: Exact substring match (either direction)
    const substringMatch = equipmentName.includes(searchName) || searchName.includes(equipmentName);
    
    // Strategy 2: Word-based matching (any word in search matches any word in equipment)
    const searchWords = searchName.split(' ').filter(w => w.length > 2); // Only words longer than 2 chars
    const equipmentWords = equipmentName.split(' ').filter(w => w.length > 2);
    const wordMatch = searchWords.some(searchWord => 
      equipmentWords.some(equipWord => 
        equipWord.includes(searchWord) || searchWord.includes(equipWord)
      )
    );
    
    const matches = substringMatch || wordMatch;
    console.log(`🎒 DEBUG: Checking "${eq.name}" -> "${equipmentName}" vs "${searchName}"`);
    console.log(`🎒 DEBUG:   Substring match: ${substringMatch}, Word match: ${wordMatch}, Final: ${matches}`);
    return matches;
  });
  
  if (!item) {
    console.log(`🎒 DEBUG: No matching item found for "${itemName}"`);
    return { found: false, hasQuantity: false };
  }
  
  const itemQuantity = item.quantity || 1;
  const hasQuantity = itemQuantity >= quantity;
  console.log(`🎒 DEBUG: Found item "${item.name}" with quantity ${itemQuantity}, needed ${quantity}, sufficient: ${hasQuantity}`);
  return { found: true, item, hasQuantity };
};

// Check if character has a specific item (backward compatibility)
export const hasItem = (character: Character, itemName: string, quantity: number = 1): boolean => {
  const result = findItem(character, itemName, quantity);
  return result.found && result.hasQuantity;
};

// Check if character has enough currency
export const hasCurrency = (character: Character, gold: number = 0, silver: number = 0, copper: number = 0): boolean => {
  const totalRequiredCopper = (gold * 100) + (silver * 10) + copper;
  const totalAvailableCopper = (character.gold * 100) + (character.silver * 10) + character.copper;
  
  return totalAvailableCopper >= totalRequiredCopper;
};

// Validate if an action can be performed with current inventory
export const validateInventoryAction = (character: Character, actionDescription: string): InventoryValidation => {
  const action = actionDescription.toLowerCase();
  
  // Check for item usage patterns - MUST match the parsing patterns exactly
  const itemPatterns = [
    // Throwing weapons/items at targets/enemies (combat usage) - very flexible
    { pattern: /(?:throw|throws|hurl|hurls|fling|flings|toss|tosses)(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]+?)(?:\s+(?:at|towards|to)|$)/, consumable: true },
    // Giving/handing items to other players (transfer) - handle compound verbs
    { pattern: /(?:give|gives|hand\s+over|hands\s+over|hand|hands|pass|passes)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]+?)(?:\s+to|\s+away)/, consumable: true },
    // Drinking consumables - flexible matching
    { pattern: /(?:drink|drinks|sip|sips|gulp|gulps|consume|consumes)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]+?)(?:\s*$|,|\.|!|\?|;)/, consumable: true },
    // Eating consumables - flexible matching  
    { pattern: /(?:eat|eats|bite|bites|chew|chews|consume|consumes)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]+?)(?:\s*$|,|\.|!|\?|;)/, consumable: true },
    // Using consumable items - match common consumable types
    { pattern: /(?:use|uses|activate|activates|apply|applies)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]*(?:potion|vial|scroll|bomb|grenade|explosive|elixir|tonic|draught)[a-zA-Z\s]*)(?:\s*$|,|\.|!|\?|;)/, consumable: true },
    // Generic "use" pattern for any item
    { pattern: /(?:use|uses)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]+?)(?:\s*$|,|\.|!|\?|;)/, consumable: true },
    // Casting spells (non-consumable)
    { pattern: /(?:cast|casts)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s|$)/, consumable: false },
    // Attacking with weapons (non-consumable)
    { pattern: /(?:attack|attacks|strike|strikes|hit|hits)\s+(?:with\s+)?(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s|$)/, consumable: false },
  ];
  
  // Check for currency patterns
  const currencyPatterns = [
    /give(?:s?)\s+(\d+)\s+gold/,
    /pay(?:s?)\s+(\d+)\s+gold/,
    /spend(?:s?)\s+(\d+)\s+gold/,
    /give(?:s?)\s+(\d+)\s+silver/,
    /pay(?:s?)\s+(\d+)\s+silver/,
    /spend(?:s?)\s+(\d+)\s+silver/,
    /give(?:s?)\s+(\d+)\s+copper/,
    /pay(?:s?)\s+(\d+)\s+copper/,
    /spend(?:s?)\s+(\d+)\s+copper/,
  ];
  
  // Check currency first
  for (const pattern of currencyPatterns) {
    const match = action.match(pattern);
    if (match) {
      const amount = parseInt(match[1]);
      const currency = pattern.source.includes('gold') ? 'gold' : 
                     pattern.source.includes('silver') ? 'silver' : 'copper';
      
      const gold = currency === 'gold' ? amount : 0;
      const silver = currency === 'silver' ? amount : 0;
      const copper = currency === 'copper' ? amount : 0;
      
      if (!hasCurrency(character, gold, silver, copper)) {
        return {
          valid: false,
          message: `${character.name} doesn't have enough ${currency}. Has: ${character.gold}g ${character.silver}s ${character.copper}c`,
          hasCurrency: false,
          currentGold: character.gold,
          currentSilver: character.silver,
          currentCopper: character.copper
        };
      }
    }
  }
  
  // Check items
  for (const { pattern, consumable } of itemPatterns) {
    const match = action.match(pattern);
    if (match) {
      const searchTerm = match[1].trim();
      
      // Skip very generic words
      if (['it', 'this', 'that', 'something', 'anything'].includes(searchTerm)) {
        continue;
      }
      
      const itemResult = findItem(character, searchTerm);
      
      if (!itemResult.found) {
        return {
          valid: false,
          message: `${character.name} doesn't have "${searchTerm}" in their inventory.`,
          hasItem: false,
          currentQuantity: 0
        };
      }
      
      if (!itemResult.hasQuantity) {
        return {
          valid: false,
          message: `${character.name} doesn't have enough "${itemResult.item?.name}" (has ${itemResult.item?.quantity || 0}, needs 1).`,
          hasItem: true,
          currentQuantity: itemResult.item?.quantity || 0
        };
      }
      
      // If we found a valid item, validation passes - use the actual item name
      return {
        valid: true,
        message: `Action validated - ${character.name} has "${itemResult.item?.name}".`,
        hasItem: true,
        currentQuantity: itemResult.item?.quantity || 1,
        actualItemName: itemResult.item?.name // Add the actual item name for operations
      };
    }
  }
  
  // If no specific items or currency mentioned, action is valid
  return {
    valid: true,
    message: 'No inventory items detected in action.',
    hasItem: true
  };
};

// Parse action to determine inventory operations needed
export const parseInventoryOperations = (actionDescription: string, characterName: string, character?: Character): InventoryOperation[] => {
  const operations: InventoryOperation[] = [];
  const action = actionDescription.toLowerCase();
  
  // Consumable item patterns (items that should be removed) - MUST match validation patterns
  const consumablePatterns = [
    // Throwing weapons/items at targets/enemies (combat usage) - very flexible
    { pattern: /(?:throw|throws|hurl|hurls|fling|flings|toss|tosses)(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]+?)(?:\s+(?:at|towards|to)|$)/, reason: 'thrown' },
    // Giving/handing items to other players (transfer) - handle compound verbs
    { pattern: /(?:give|gives|hand\s+over|hands\s+over|hand|hands|pass|passes)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]+?)(?:\s+to|\s+away)/, reason: 'given away' },
    // Drinking consumables - flexible matching
    { pattern: /(?:drink|drinks|sip|sips|gulp|gulps|consume|consumes)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]+?)(?:\s*$|,|\.|!|\?|;)/, reason: 'consumed' },
    // Eating consumables - flexible matching  
    { pattern: /(?:eat|eats|bite|bites|chew|chews|consume|consumes)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]+?)(?:\s*$|,|\.|!|\?|;)/, reason: 'consumed' },
    // Using consumable items - match common consumable types
    { pattern: /(?:use|uses|activate|activates|apply|applies)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]*(?:potion|vial|scroll|bomb|grenade|explosive|elixir|tonic|draught)[a-zA-Z\s]*)(?:\s*$|,|\.|!|\?|;)/, reason: 'used' },
    // Generic "use" pattern for any item
    { pattern: /(?:use|uses)\s+(?:a\s+|an\s+|my\s+|the\s+|some\s+)?([a-zA-Z\s]+?)(?:\s*$|,|\.|!|\?|;)/, reason: 'used' },
  ];
  
  // Item acquisition patterns (items that should be added)
  const acquisitionPatterns = [
    { pattern: /find(?:s?)\s+(?:a\s+|an\s+|some\s+)?([a-zA-Z\s]+?)(?:\s|$)/, reason: 'found' },
    { pattern: /pick(?:s?)\s+up\s+(?:a\s+|an\s+|some\s+)?([a-zA-Z\s]+?)(?:\s|$)/, reason: 'picked up' },
    { pattern: /receive(?:s?)\s+(?:a\s+|an\s+|some\s+)?([a-zA-Z\s]+?)(?:\s|$)/, reason: 'received' },
    { pattern: /(?:is\s+|are\s+)?given\s+(?:a\s+|an\s+|some\s+)?([a-zA-Z\s]+?)(?:\s|$)/, reason: 'given' },
    { pattern: /take(?:s?)\s+(?:a\s+|an\s+|some\s+)?([a-zA-Z\s]+?)(?:\s|$)/, reason: 'taken' },
  ];
  
  // Currency patterns
  const currencyRemovalPatterns = [
    { pattern: /give(?:s?)\s+(\d+)\s+gold/, currency: 'gold', reason: 'given' },
    { pattern: /pay(?:s?)\s+(\d+)\s+gold/, currency: 'gold', reason: 'paid' },
    { pattern: /spend(?:s?)\s+(\d+)\s+gold/, currency: 'gold', reason: 'spent' },
    { pattern: /give(?:s?)\s+(\d+)\s+silver/, currency: 'silver', reason: 'given' },
    { pattern: /pay(?:s?)\s+(\d+)\s+silver/, currency: 'silver', reason: 'paid' },
    { pattern: /spend(?:s?)\s+(\d+)\s+silver/, currency: 'silver', reason: 'spent' },
    { pattern: /give(?:s?)\s+(\d+)\s+copper/, currency: 'copper', reason: 'given' },
    { pattern: /pay(?:s?)\s+(\d+)\s+copper/, currency: 'copper', reason: 'paid' },
    { pattern: /spend(?:s?)\s+(\d+)\s+copper/, currency: 'copper', reason: 'spent' },
  ];
  
  const currencyAcquisitionPatterns = [
    { pattern: /find(?:s?)\s+(\d+)\s+gold/, currency: 'gold', reason: 'found' },
    { pattern: /receive(?:s?)\s+(\d+)\s+gold/, currency: 'gold', reason: 'received' },
    { pattern: /(?:is\s+|are\s+)?given\s+(\d+)\s+gold/, currency: 'gold', reason: 'given' },
    { pattern: /find(?:s?)\s+(\d+)\s+silver/, currency: 'silver', reason: 'found' },
    { pattern: /receive(?:s?)\s+(\d+)\s+silver/, currency: 'silver', reason: 'received' },
    { pattern: /(?:is\s+|are\s+)?given\s+(\d+)\s+silver/, currency: 'silver', reason: 'given' },
    { pattern: /find(?:s?)\s+(\d+)\s+copper/, currency: 'copper', reason: 'found' },
    { pattern: /receive(?:s?)\s+(\d+)\s+copper/, currency: 'copper', reason: 'received' },
    { pattern: /(?:is\s+|are\s+)?given\s+(\d+)\s+copper/, currency: 'copper', reason: 'given' },
  ];
  
  // Parse consumable items
  for (const { pattern, reason } of consumablePatterns) {
    const match = action.match(pattern);
    if (match) {
      const searchTerm = match[1].trim();
      if (!['it', 'this', 'that', 'something', 'anything'].includes(searchTerm)) {
        // If character is provided, try to find the actual item name
        let actualItemName = searchTerm;
        if (character) {
          const itemResult = findItem(character, searchTerm);
          if (itemResult.found && itemResult.item) {
            actualItemName = itemResult.item.name;
            console.log(`🎒 DEBUG: Resolved "${searchTerm}" to actual item "${actualItemName}"`);
          }
        }
        
        operations.push({
          type: 'remove',
          itemName: actualItemName,
          quantity: 1,
          reason: `${reason} by ${characterName}`
        });
      }
    }
  }
  
  // Parse item acquisitions
  for (const { pattern, reason } of acquisitionPatterns) {
    const match = action.match(pattern);
    if (match) {
      const itemName = match[1].trim();
      if (!['it', 'this', 'that', 'something', 'anything'].includes(itemName)) {
        operations.push({
          type: 'add',
          itemName,
          quantity: 1,
          reason: `${reason} by ${characterName}`
        });
      }
    }
  }
  
  // Parse currency removal
  for (const { pattern, currency, reason } of currencyRemovalPatterns) {
    const match = action.match(pattern);
    if (match) {
      const amount = parseInt(match[1]);
      const operation: InventoryOperation = {
        type: 'currency_remove',
        reason: `${reason} by ${characterName}`
      };
      
      if (currency === 'gold') operation.gold = amount;
      else if (currency === 'silver') operation.silver = amount;
      else if (currency === 'copper') operation.copper = amount;
      
      operations.push(operation);
    }
  }
  
  // Parse currency acquisition
  for (const { pattern, currency, reason } of currencyAcquisitionPatterns) {
    const match = action.match(pattern);
    if (match) {
      const amount = parseInt(match[1]);
      const operation: InventoryOperation = {
        type: 'currency_add',
        reason: `${reason} by ${characterName}`
      };
      
      if (currency === 'gold') operation.gold = amount;
      else if (currency === 'silver') operation.silver = amount;
      else if (currency === 'copper') operation.copper = amount;
      
      operations.push(operation);
    }
  }
  
  return operations;
};

// Apply inventory operations to character
export const applyInventoryOperations = async (characterId: string, operations: InventoryOperation[]): Promise<void> => {
  if (operations.length === 0) return;
  
  try {
    // Get current character data
    const { data: character, error: fetchError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();
    
    if (fetchError || !character) {
      console.error('Failed to fetch character for inventory update:', fetchError);
      return;
    }
    
    let updatedEquipment = [...(character.equipment || [])];
    let updatedGold = character.gold || 0;
    let updatedSilver = character.silver || 0;
    let updatedCopper = character.copper || 0;
    
    for (const operation of operations) {
      console.log(`🎒 Applying inventory operation:`, operation);
      
      switch (operation.type) {
        case 'remove':
          if (operation.itemName) {
            // Use same normalization as hasItem function
            const normalizeItemName = (name: string) => {
              return name.toLowerCase()
                .replace(/[()]/g, '') // Remove parentheses
                .replace(/\s+/g, ' ') // Normalize spaces
                .trim();
            };
            
            const searchName = normalizeItemName(operation.itemName);
            
            const itemIndex = updatedEquipment.findIndex(eq => {
              const equipmentName = normalizeItemName(eq.name);
              return equipmentName.includes(searchName) || searchName.includes(equipmentName);
            });
            
            if (itemIndex !== -1) {
              const item = updatedEquipment[itemIndex];
              const currentQuantity = item.quantity || 1;
              const removeQuantity = operation.quantity || 1;
              
              if (currentQuantity <= removeQuantity) {
                // Remove item completely
                updatedEquipment.splice(itemIndex, 1);
                console.log(`🗑️ Removed ${item.name} completely`);
              } else {
                // Reduce quantity
                updatedEquipment[itemIndex] = {
                  ...item,
                  quantity: currentQuantity - removeQuantity
                };
                console.log(`📉 Reduced ${item.name} quantity by ${removeQuantity}`);
              }
            }
          }
          break;
          
        case 'add':
          if (operation.itemName) {
            // Validate item against equipment reference first
            const validation = validateItemInEquipmentReference(operation.itemName);
            
            if (!validation.isValid) {
              console.warn(`🚫 Rejecting invalid item "${operation.itemName}" - not found in equipment reference`);
              console.warn(`🛡️ Equipment reference validation failed for: ${operation.itemName}`);
              break; // Skip this operation
            }
            
            // Use the validated item name from the equipment reference
            const validatedItemName = validation.suggestion || operation.itemName;
            const referenceItem = validation.matchedItem;
            
            // Check if item already exists
            const existingItemIndex = updatedEquipment.findIndex(eq => 
              eq.name.toLowerCase() === validatedItemName.toLowerCase()
            );
            
            if (existingItemIndex !== -1) {
              // Increase quantity
              const currentQuantity = updatedEquipment[existingItemIndex].quantity || 1;
              updatedEquipment[existingItemIndex] = {
                ...updatedEquipment[existingItemIndex],
                quantity: currentQuantity + (operation.quantity || 1)
              };
              console.log(`📈 Increased ${validatedItemName} quantity by ${operation.quantity || 1}`);
            } else {
              // Add new item using equipment reference data
              const newItem: Equipment = {
                id: referenceItem?.id || `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                index: referenceItem?.id || validatedItemName.toLowerCase().replace(/\s+/g, '-'),
                name: validatedItemName,
                equipment_category: referenceItem?.equipment_category || 'Adventuring Gear',
                weight: referenceItem?.weight || 1,
                cost_quantity: referenceItem?.cost?.quantity || 1,
                cost_unit: referenceItem?.cost?.unit || 'gp',
                description: referenceItem?.description || [`A ${validatedItemName} ${operation.reason}.`],
                special: referenceItem?.special || [],
                contents: referenceItem?.contents || [],
                properties: referenceItem?.properties || [],
                quantity: operation.quantity || 1,
                enabled: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // Add D&D specific properties if available
                ...(referenceItem?.armor_class && { armor_class: referenceItem.armor_class }),
                ...(referenceItem?.damage && { damage: referenceItem.damage }),
                ...(referenceItem?.range && { range: referenceItem.range }),
                ...(referenceItem?.weapon_category && { weapon_category: referenceItem.weapon_category }),
                ...(referenceItem?.weapon_range && { weapon_range: referenceItem.weapon_range }),
                ...(referenceItem?.throw_range && { throw_range: referenceItem.throw_range })
              };
              updatedEquipment.push(newItem);
              console.log(`✅ Added validated item: ${validatedItemName} (from equipment reference)`);
            }
          }
          break;
          
        case 'currency_remove':
          if (operation.gold) updatedGold = Math.max(0, updatedGold - operation.gold);
          if (operation.silver) updatedSilver = Math.max(0, updatedSilver - operation.silver);
          if (operation.copper) updatedCopper = Math.max(0, updatedCopper - operation.copper);
          console.log(`💰 Removed currency: ${operation.gold || 0}g ${operation.silver || 0}s ${operation.copper || 0}c`);
          break;
          
        case 'currency_add':
          if (operation.gold) updatedGold += operation.gold;
          if (operation.silver) updatedSilver += operation.silver;
          if (operation.copper) updatedCopper += operation.copper;
          console.log(`💰 Added currency: ${operation.gold || 0}g ${operation.silver || 0}s ${operation.copper || 0}c`);
          break;
      }
    }
    
    // Update character in database
    const { error: updateError } = await supabase
      .from('characters')
      .update({
        equipment: updatedEquipment,
        gold: updatedGold,
        silver: updatedSilver,
        copper: updatedCopper,
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId);
    
    if (updateError) {
      console.error('Failed to update character inventory:', updateError);
    } else {
      console.log(`✅ Successfully applied ${operations.length} inventory operations`);
    }
    
  } catch (error) {
    console.error('Error applying inventory operations:', error);
  }
};

// Generate inventory summary for AI context
export const generateInventoryContext = (character: Character): string => {
  const equipment = character.equipment || [];
  const currency = `${character.gold || 0} gold, ${character.silver || 0} silver, ${character.copper || 0} copper`;
  
  if (equipment.length === 0) {
    return `${character.name} has no equipment and ${currency}.`;
  }
  
  const itemList = equipment
    .map(item => `${item.name}${item.quantity && item.quantity > 1 ? ` (x${item.quantity})` : ''}`)
    .join(', ');
  
  return `${character.name}'s inventory: ${itemList}. Currency: ${currency}.`;
};

// Clean up corrupted items from character inventory using equipment reference
export const cleanupCorruptedItems = async (characterId: string): Promise<void> => {
  try {
    console.log(`🧹 Starting cleanup of corrupted items for character ${characterId}`);
    
    // Get current character data
    const { data: character, error: fetchError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();
    
    if (fetchError || !character) {
      console.error('Failed to fetch character for cleanup:', fetchError);
      return;
    }
    
    const originalEquipment = character.equipment || [];
    console.log(`🔍 Found ${originalEquipment.length} items to check`);
    
    const cleanEquipment = originalEquipment.filter((item: Equipment) => {
      // Check against equipment reference
      const validation = validateItemInEquipmentReference(item.name);
      
      if (!validation.isValid) {
        console.log(`🗑️ Removing invalid item: "${item.name}" (not in equipment reference)`);
        return false;
      }
      
      // Remove items with invalid names (articles, etc.)
      const invalidNames = ['a', 'an', 'the', 'some', 'this', 'that', 'it', 'them', 'they', 'he', 'she', 'his', 'her', 'their', 'my', 'your', 'our'];
      if (invalidNames.includes(item.name.toLowerCase())) {
        console.log(`🗑️ Removing article/pronoun item: "${item.name}"`);
        return false;
      }
      
      // Remove items with names shorter than 3 characters
      if (item.name.length < 3) {
        console.log(`🗑️ Removing too-short item: "${item.name}"`);
        return false;
      }
      
      return true;
    });
    
    if (cleanEquipment.length !== originalEquipment.length) {
      const removedCount = originalEquipment.length - cleanEquipment.length;
      console.log(`🧹 Cleaned ${removedCount} corrupted items from character ${characterId}`);
      
      const { error: updateError } = await supabase
        .from('characters')
        .update({
          equipment: cleanEquipment,
          updated_at: new Date().toISOString()
        })
        .eq('id', characterId);
      
      if (updateError) {
        console.error('Failed to update character after cleanup:', updateError);
      } else {
        console.log(`✅ Successfully cleaned character ${characterId} inventory`);
      }
    } else {
      console.log(`✅ No corrupted items found for character ${characterId}`);
    }
    
  } catch (error) {
    console.error('Error during inventory cleanup:', error);
  }
}; 