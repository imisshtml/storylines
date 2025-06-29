import { useAtom } from 'jotai';
import { useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { equipmentReferenceAtom, equipmentReferenceLoadedAtom, EquipmentReference } from '../atoms/equipmentAtoms';

export const useEquipmentReference = () => {
  const [equipmentReference, setEquipmentReference] = useAtom(equipmentReferenceAtom);
  const [isLoaded, setIsLoaded] = useAtom(equipmentReferenceLoadedAtom);

  const loadEquipmentReference = useCallback(async () => {
    try {
      console.log('🛡️ Loading equipment reference...');
      
      const { data: equipment, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Failed to load equipment reference:', error);
        return false;
      }

      console.log(`✅ Loaded ${equipment.length} equipment items`);
      setEquipmentReference(equipment as EquipmentReference[]);
      setIsLoaded(true);
      return true;
    } catch (error) {
      console.error('❌ Error loading equipment reference:', error);
      setIsLoaded(false);
      return false;
    }
  }, [setEquipmentReference, setIsLoaded]);

  const refreshEquipmentReference = useCallback(async () => {
    setIsLoaded(false);
    return await loadEquipmentReference();
  }, [loadEquipmentReference, setIsLoaded]);

  const validateItem = useCallback((itemName: string) => {
    if (!isLoaded || equipmentReference.length === 0) {
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
  }, [equipmentReference, isLoaded]);

  const searchEquipment = useCallback((searchTerm: string) => {
    if (!isLoaded || equipmentReference.length === 0) {
      return [];
    }

    if (!searchTerm || searchTerm.length < 2) {
      return equipmentReference;
    }
    
    const normalizeText = (text: string) => 
      text.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    
    const searchNormalized = normalizeText(searchTerm);
    
    return equipmentReference.filter(item => {
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
  }, [equipmentReference, isLoaded]);

  const getEquipmentByCategory = useCallback(() => {
    const categories: Record<string, EquipmentReference[]> = {};
    
    equipmentReference.forEach(item => {
      if (!categories[item.equipment_category]) {
        categories[item.equipment_category] = [];
      }
      categories[item.equipment_category].push(item);
    });
    
    return categories;
  }, [equipmentReference]);

  // Auto-load on mount if not already loaded
  useEffect(() => {
    if (!isLoaded && equipmentReference.length === 0) {
      loadEquipmentReference();
    }
  }, [isLoaded, equipmentReference.length, loadEquipmentReference]);

  return {
    equipmentReference,
    isLoaded,
    loadEquipmentReference,
    refreshEquipmentReference,
    validateItem,
    searchEquipment,
    getEquipmentByCategory
  };
}; 