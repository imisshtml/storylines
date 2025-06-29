import { Character, Equipment } from '../atoms/characterAtoms';
import { supabase } from '../config/supabase';

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
}

// Check if character has a specific item
export const hasItem = (character: Character, itemName: string, quantity: number = 1): boolean => {
  if (!character.equipment) return false;
  
  // Normalize both names for comparison (remove parentheses, extra spaces, etc.)
  const normalizeItemName = (name: string) => {
    return name.toLowerCase()
      .replace(/[()]/g, '') // Remove parentheses
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };
  
  const searchName = normalizeItemName(itemName);
  
  const item = character.equipment.find(eq => {
    const equipmentName = normalizeItemName(eq.name);
    return equipmentName.includes(searchName) || searchName.includes(equipmentName);
  });
  
  if (!item) return false;
  
  const itemQuantity = item.quantity || 1;
  return itemQuantity >= quantity;
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
  
  // Check for item usage patterns
  const itemPatterns = [
    { pattern: /throw(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s+at|\s+to|\s+towards|$)/, consumable: true },
    { pattern: /use(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s+on|\s+to|$)/, consumable: true },
    { pattern: /drink(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s|$)/, consumable: true },
    { pattern: /eat(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s|$)/, consumable: true },
    { pattern: /give(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s+to|\s+away|$)/, consumable: true },
    { pattern: /cast(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s|$)/, consumable: false }, // Spells don't consume items usually
    { pattern: /attack(?:s?)\s+with\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s|$)/, consumable: false }, // Weapons aren't consumed
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
      const itemName = match[1].trim();
      
      // Skip very generic words
      if (['it', 'this', 'that', 'something', 'anything'].includes(itemName)) {
        continue;
      }
      
      if (!hasItem(character, itemName)) {
        return {
          valid: false,
          message: `${character.name} doesn't have "${itemName}" in their inventory.`,
          hasItem: false,
          currentQuantity: 0
        };
      }
      
      // If we found a valid item, validation passes
      return {
        valid: true,
        message: `Action validated - ${character.name} has "${itemName}".`,
        hasItem: true,
        currentQuantity: character.equipment?.find(eq => 
          eq.name.toLowerCase().includes(itemName.toLowerCase())
        )?.quantity || 1
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
export const parseInventoryOperations = (actionDescription: string, characterName: string): InventoryOperation[] => {
  const operations: InventoryOperation[] = [];
  const action = actionDescription.toLowerCase();
  
  // Consumable item patterns (items that should be removed)
  const consumablePatterns = [
    // Throwing weapons at targets/enemies (combat usage)
    { pattern: /(?:throw|throws|hurl|hurls|fling|flings)(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s+(?:at|towards)|$)/, reason: 'thrown' },
    // Giving/tossing items to other players (transfer)
    { pattern: /(?:give|gives|hand|hands|pass|passes|toss|tosses)(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s+to|\s+over\s+to|\s+away)/, reason: 'given away' },
    { pattern: /drink(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s*$|,|\.|!|\?)/, reason: 'consumed' },
    { pattern: /eat(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s*$|,|\.|!|\?)/, reason: 'consumed' },
    { pattern: /use(?:s?)\s+(?:a\s+|an\s+|my\s+|the\s+)?(potion|vial|scroll|bomb|grenade|explosive)/, reason: 'used' },
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
      const itemName = match[1].trim();
      if (!['it', 'this', 'that', 'something', 'anything'].includes(itemName)) {
        operations.push({
          type: 'remove',
          itemName,
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
            // Check if item already exists
            const existingItemIndex = updatedEquipment.findIndex(eq => 
              eq.name.toLowerCase() === operation.itemName!.toLowerCase()
            );
            
            if (existingItemIndex !== -1) {
              // Increase quantity
              const currentQuantity = updatedEquipment[existingItemIndex].quantity || 1;
              updatedEquipment[existingItemIndex] = {
                ...updatedEquipment[existingItemIndex],
                quantity: currentQuantity + (operation.quantity || 1)
              };
              console.log(`📈 Increased ${operation.itemName} quantity by ${operation.quantity || 1}`);
            } else {
              // Add new item (create basic equipment entry)
              const newItem: Equipment = {
                id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                index: operation.itemName.toLowerCase().replace(/\s+/g, '-'),
                name: operation.itemName,
                equipment_category: 'Adventuring Gear',
                weight: 1,
                cost_quantity: 1,
                cost_unit: 'gp',
                description: [`A ${operation.itemName} ${operation.reason}.`],
                special: [],
                contents: [],
                properties: [],
                quantity: operation.quantity || 1,
                enabled: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              updatedEquipment.push(newItem);
              console.log(`➕ Added new item: ${operation.itemName}`);
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