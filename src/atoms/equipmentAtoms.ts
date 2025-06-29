import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Equipment interface (matches the database structure)
export interface EquipmentReference {
  id: string;
  name: string;
  equipment_category: string;
  equipment_category_range?: string;
  cost?: {
    quantity: number;
    unit: string;
  };
  weight?: number;
  description?: string[];
  armor_category?: string;
  armor_class?: {
    base: number;
    dex_bonus?: boolean;
    max_bonus?: number;
  };
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  damage?: {
    damage_dice: string;
    damage_type: {
      name: string;
    };
  };
  range?: {
    normal: number;
    long?: number;
  };
  properties?: {
    name: string;
  }[];
  weapon_category?: string;
  weapon_range?: string;
  throw_range?: {
    normal: number;
    long: number;
  };
  quantity?: number;
}

// Atom to store the master equipment list (persisted to storage)
export const equipmentReferenceAtom = atomWithStorage<EquipmentReference[]>('equipment-reference', []);

// Atom to track if equipment reference has been loaded
export const equipmentReferenceLoadedAtom = atom<boolean>(false);

// Atom to get equipment by category
export const equipmentByCategoryAtom = atom((get) => {
  const equipment = get(equipmentReferenceAtom);
  const categories: Record<string, EquipmentReference[]> = {};
  
  equipment.forEach(item => {
    if (!categories[item.equipment_category]) {
      categories[item.equipment_category] = [];
    }
    categories[item.equipment_category].push(item);
  });
  
  return categories;
});

// Atom to search equipment by name (fuzzy matching)
export const searchEquipmentAtom = atom(null, (get, set, searchTerm: string) => {
  const equipment = get(equipmentReferenceAtom);
  
  if (!searchTerm || searchTerm.length < 2) {
    return equipment;
  }
  
  const normalizeText = (text: string) => 
    text.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  
  const searchNormalized = normalizeText(searchTerm);
  
  return equipment.filter(item => {
    const itemNameNormalized = normalizeText(item.name);
    
    // Exact substring match
    if (itemNameNormalized.includes(searchNormalized)) {
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
});

// Atom to validate if an item exists in the equipment reference
export const validateEquipmentAtom = atom(null, (get, set, itemName: string) => {
  const equipment = get(equipmentReferenceAtom);
  
  const normalizeText = (text: string) => 
    text.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  
  const searchNormalized = normalizeText(itemName);
  
  const found = equipment.find(item => {
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
}); 