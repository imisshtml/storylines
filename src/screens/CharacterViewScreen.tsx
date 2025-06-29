import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
  StatusBar,
  TextInput,
} from 'react-native';
import { ArrowLeft, ArrowUp, Camera, LocationEdit as Edit3, Scroll, X, Trash2, ChevronUp, ChevronDown, ShoppingCart, Coins, Package, Dices, Star, Zap, Shield } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAtom } from 'jotai';
import {
  charactersAtom,
  fetchCharactersAtom,
  type Character,
  type DnDSpell,
  type DnDAbilities,
  type Equipment,
  type EquippedItems,
  type EquipmentSlot,
  type SpellSlots,
  type AbilityUses,
  equipmentAtom,
  fetchEquipmentAtom,
  canAffordEquipment,
  getEquipmentCostInCopper,
  convertFromCopper,
  calculateArmorClass,
  canEquipInSlot,
  getSlotDisplayName,
  isTwoHandedWeapon,
  canEquipInSlotWithTwoHanded,
  getItemsToUnequipForTwoHanded,
  getSpellSlotsUsed,
  getSpellSlotsMax,
  getSpellSlotsRemaining,
  canCastSpell,
  getAbilityUses,
  canUseAbility,
  getAbilityUsesRemaining,
  needsShortRest,
  needsLongRest,
} from '../atoms/characterAtoms';
import { campaignsAtom, fetchCampaignsAtom } from '../atoms/campaignAtoms';
import { userAtom } from '../atoms/authAtoms';
import { supabase } from '../config/supabase';
// import { withConnectionHandling } from '../utils/connectionUtils';
import { getCharacterAvatarUrl } from '../utils/avatarStorage';
import AvatarSelector from '../components/AvatarSelector';
import { useCustomAlert } from '../components/CustomAlert';
import { startLevelUpProcessAtom, charactersToLevelUpAtom } from '../atoms/levelUpAtoms';
import { getProficiencyBonus } from '../utils/stealthUtils';

export default function CharacterViewScreen() {
  const { characterId } = useLocalSearchParams<{ characterId: string }>();
  const [user] = useAtom(userAtom);
  const [characters] = useAtom(charactersAtom);
  const [campaigns] = useAtom(campaignsAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [, fetchCampaigns] = useAtom(fetchCampaignsAtom);
  const { showAlert, hideAlert } = useCustomAlert();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingSpells, setIsEditingSpells] = useState(false);
  const [selectedSpells, setSelectedSpells] = useState<DnDSpell[]>([]);
  const [availableSpells, setAvailableSpells] = useState<DnDSpell[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedSpells, setExpandedSpells] = useState<Set<string>>(new Set());
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number>(0);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [equipmentSearch, setEquipmentSearch] = useState<string>('');
  const [, fetchEquipment] = useAtom(fetchEquipmentAtom);
  const [isSelectingEquipment, setIsSelectingEquipment] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [selectedRingIndex, setSelectedRingIndex] = useState<number | null>(null);
  const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [characterFeatures, setCharacterFeatures] = useState<any[]>([]);
  const [characterTraits, setCharacterTraits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'traits' | 'spells' | 'equipment'>('stats');
  const [charactersToLevelUp] = useAtom(charactersToLevelUpAtom);
  const [, startLevelUpProcess] = useAtom(startLevelUpProcessAtom);
  const [isEditingFlourish, setIsEditingFlourish] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedFlourish, setEditedFlourish] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    if (characters.length > 0 && characterId) {
      const selectedCharacter = characters.find(c => c.id === characterId);
      if (selectedCharacter) {
        setCharacter(selectedCharacter);
        setSelectedSpells(selectedCharacter.spells || []);
        setEditedFlourish(selectedCharacter.flourish || '');
        setEditedDescription(selectedCharacter.description || '');
      }
    }
  }, [characters, characterId]);

  useEffect(() => {
    fetchCharacters();
    fetchCampaigns();
  }, [fetchCharacters, fetchCampaigns]);

  useEffect(() => {
    if (character) {
      loadCharacterFeatures();
      loadCharacterTraits();
    }
  }, [character]);

  useEffect(() => {
    if (isEditingSpells && character) {
      loadAvailableSpells();
      // Load character's current spells
      setSelectedSpells(character.spells || []);
    }
  }, [isEditingSpells, character]);

  useEffect(() => {
    if (isEditingEquipment) {
      loadAvailableEquipment();
    }
  }, [isEditingEquipment]);

  const handleLevelUp = () => {
    if (!character) return;
    const canLevelUp = charactersToLevelUp.some(c => c.id === character.id);

    if (canLevelUp) {
      startLevelUpProcess(character.id);
    } else {
      showAlert(
        'Level Up Not Available',
        'This character has not gained enough experience to level up yet.',
        [{ text: 'OK' }],
        'info'
      );
    }
  };

  const loadAvailableSpells = async () => {
    try {
      // Get maximum spell level available for character
      const maxSpellLevel = getMaxSpellLevel();

      const { data: spells, error } = await supabase
        .from('spells')
        .select('*')
        .lte('level', maxSpellLevel)
        .order('level')
        .order('name');

      if (error) throw error;
      setAvailableSpells(spells || []);
    } catch (error) {
      console.error('Error loading spells:', error);
    }
  };

  const loadAvailableEquipment = async () => {
    try {
      await fetchEquipment();
      const { data: equipment, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('enabled', true)
        .order('equipment_category')
        .order('name');

      if (error) throw error;
      setAvailableEquipment(equipment || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

  const loadCharacterFeatures = async () => {
    if (!character) return;

    try {
      // Load class features based on character's class and level
      const { data: features, error } = await supabase
        .from('features')
        .select('*')
        .eq('class_index', character.class.toLowerCase())
        .order('level')
        .order('name');

      if (error) throw error;
      setCharacterFeatures(features || []);
    } catch (error) {
      console.error('Error loading features:', error);
      setCharacterFeatures([]);
    }
  };

  const loadCharacterTraits = async () => {
    if (!character) return;

    try {
      // Load racial traits based on character's race
      const { data: traits, error } = await supabase
        .from('traits')
        .select('*')
        .eq('race_index', character.race.toLowerCase())
        .order('name');

      if (error) throw error;
      setCharacterTraits(traits || []);
    } catch (error) {
      console.error('Error loading traits:', error);
      // Fallback to character's stored traits if database fails
      setCharacterTraits(character.traits || []);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!character) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('characters')
        .update({ avatar: avatarUrl })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        avatar: avatarUrl,
      });

      // Refresh characters list
      await fetchCharacters();
    } catch (error) {
      console.error('Error updating avatar:', error);
      showAlert('Error', 'Failed to update avatar. Please try again.', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCharacterSpells = async () => {
    if (!character) return;

    setIsLoading(true);
    try {
      // Update spells in database
      const { error } = await supabase
        .from('characters')
        .update({
          spells: selectedSpells
        })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        spells: selectedSpells,
      });

      // Refresh characters list
      await fetchCharacters();
      setIsEditingSpells(false);
    } catch (error) {
      console.error('Error updating spells:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update spells. Please try again.';
      showAlert('Error', errorMessage, undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const getFinalAbilityScore = (ability: keyof DnDAbilities) => {
    // Abilities are now stored with racial bonuses already applied
    return character?.abilities?.[ability] || 10;
  };

  const getCampaignName = () => {
    if (character?.campaign_id) {
      // Find the campaign by campaign_id (which should match campaign.id)
      const campaign = campaigns.find(c => c.id === character.campaign_id);
      if (campaign) {
        // If character is retired or campaign is completed/failed, show "Available for Campaign"
        /*if (character.retired || campaign.status === 'completed' || campaign.status === 'failed') {
          return 'Available for Campaign';
        }*/
        return campaign.name;
      }
      return 'Unknown Campaign';
    }
    return 'Available for Campaign';
  };

  const hasSpellcasting = () => {
    // Check if the character's class supports spellcasting by looking at spells
    const spellClasses = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
    return spellClasses.includes(character?.class!) || false;
  };

  const no1stLvlSpells = (character?.class === 'Paladin' || character?.class === 'Ranger') && character?.level === 1;

  const getAvailableTabs = (): { id: 'stats' | 'traits' | 'spells' | 'equipment', label: string, icon: any }[] => {
    const tabs: { id: 'stats' | 'traits' | 'spells' | 'equipment', label: string, icon: any }[] = [
      { id: 'stats' as const, label: 'Stats', icon: Dices },
      { id: 'traits' as const, label: 'Traits', icon: Star },
      { id: 'equipment' as const, label: 'Equipment', icon: Package },
    ];

    // Only show spells tab if character has spellcasting
    if (hasSpellcasting()) {
      tabs.splice(2, 0, { id: 'spells' as const, label: 'Spells', icon: Zap });
    }

    return tabs;
  };

  // Get attack actions from equipped weapons
  const getAttackActions = () => {
    if (!character?.equipped_items) return [];

    const attacks = [];
    const equipped = character.equipped_items;

    // Check left hand weapon
    if (equipped.leftHand && equipped.leftHand.weapon_category) {
      attacks.push({
        name: equipped.leftHand.name,
        damage: equipped.leftHand.damage_dice || '1d4',
        damageType: equipped.leftHand.damage_type || 'bludgeoning',
        range: equipped.leftHand.range_normal ? `${equipped.leftHand.range_normal}/${equipped.leftHand.range_long || equipped.leftHand.range_normal} ft` : 'Melee',
        properties: equipped.leftHand.properties || []
      });
    }

    // Check right hand weapon
    if (equipped.rightHand && equipped.rightHand.weapon_category) {
      attacks.push({
        name: equipped.rightHand.name,
        damage: equipped.rightHand.damage_dice || '1d4',
        damageType: equipped.rightHand.damage_type || 'bludgeoning',
        range: equipped.rightHand.range_normal ? `${equipped.rightHand.range_normal}/${equipped.rightHand.range_long || equipped.rightHand.range_normal} ft` : 'Melee',
        properties: equipped.rightHand.properties || []
      });
    }

    return attacks;
  };

  const isCampaignStarted = () => {
    if (!character?.campaign_id) {
      console.log('Character has no campaign_id');
      return false;
    }

    const campaign = campaigns.find(c => c.id === character.campaign_id);

    const isStarted = campaign?.status !== 'creation';

    return isStarted;
  };

  const canEditCharacter = () => {
    return !isCampaignStarted();
  };

  const canEditSpells = () => {
    return !isCampaignStarted() && !no1stLvlSpells;
  };

  const canShopEquipment = () => {
    return !isCampaignStarted();
  };

  const canEquipItems = () => {
    return true; // Always allow equipping/unequipping items
  };

  const formatCurrency = (gold: number, silver: number, copper: number) => {
    const parts = [];
    if (gold > 0) parts.push(`${gold} gp`);
    if (silver > 0) parts.push(`${silver} sp`);
    if (copper > 0) parts.push(`${copper} cp`);
    return parts.length > 0 ? parts.join(', ') : '0 cp';
  };

  const getEquipmentCategories = () => {
    const categories = ['all', 'Armor', 'Weapon', 'Adventuring Gear', 'Tools', 'Mounts and Vehicles'];
    return categories.filter(Boolean);
  };

  const getFilteredEquipment = () => {
    let filtered = availableEquipment;

    // Apply category filter
    if (equipmentFilter !== 'all') {
      filtered = filtered.filter(item => item.equipment_category === equipmentFilter);
    }

    // Apply search filter
    if (equipmentSearch.trim()) {
      const searchTerm = equipmentSearch.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.some(desc =>
          desc.toLowerCase().includes(searchTerm)
        ))
      );
    }

    return filtered;
  };

  const handlePurchaseEquipment = async (item: Equipment) => {
    if (!character || !canAffordEquipment(item, character.gold, character.silver, character.copper)) {
      showAlert('Cannot Purchase', 'You cannot afford this item.', undefined, 'warning');
      return;
    }

    setIsLoading(true);
    try {
      // Calculate new currency amounts
      const equipmentCost = getEquipmentCostInCopper(item);
      const totalPlayerCopper = (character.gold * 100) + (character.silver * 10) + character.copper;
      const remainingCopper = totalPlayerCopper - equipmentCost;
      const newCurrency = convertFromCopper(remainingCopper);

      // Add equipment to character's equipment
      const newEquipment = [...(character.equipment || []), item];

      const { error } = await supabase
        .from('characters')
        .update({
          equipment: newEquipment,
          gold: newCurrency.gold,
          silver: newCurrency.silver,
          copper: newCurrency.copper,
        })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        equipment: newEquipment,
        gold: newCurrency.gold,
        silver: newCurrency.silver,
        copper: newCurrency.copper,
      });

      await fetchCharacters();
    } catch (error) {
      console.error('Error purchasing equipment:', error);
      showAlert('Error', 'Failed to purchase equipment. Please try again.', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEquipment = async (item: Equipment) => {
    if (!character) return;

    setIsLoading(true);
    try {
      // Calculate refund (full price back)
      const equipmentCost = getEquipmentCostInCopper(item);
      const totalPlayerCopper = (character.gold * 100) + (character.silver * 10) + character.copper;
      const newTotalCopper = totalPlayerCopper + equipmentCost;
      const newCurrency = convertFromCopper(newTotalCopper);

      // Remove equipment from character's equipment
      const newEquipment = character.equipment?.filter(eq => eq.id !== item.id) || [];

      const { error } = await supabase
        .from('characters')
        .update({
          equipment: newEquipment,
          gold: newCurrency.gold,
          silver: newCurrency.silver,
          copper: newCurrency.copper,
        })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        equipment: newEquipment,
        gold: newCurrency.gold,
        silver: newCurrency.silver,
        copper: newCurrency.copper,
      });

      await fetchCharacters();
    } catch (error) {
      console.error('Error removing equipment:', error);
      showAlert('Error', 'Failed to remove equipment. Please try again.', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatEquipmentCost = (item: Equipment) => {
    const { cost_quantity, cost_unit } = item;
    return `${cost_quantity} ${cost_unit}`;
  };

  // Equipment slot functions
  const handleEquipItem = async (item: Equipment, slot: EquipmentSlot) => {
    if (!character) return;

    try {
      const currentEquipped = character.equipped_items || {};

      // Check for two-handed weapon conflicts
      if (slot === 'leftHand' || slot === 'rightHand') {
        const { canEquip, conflictingItems } = canEquipInSlotWithTwoHanded(item, slot, currentEquipped);

        if (!canEquip) {
          showAlert('Cannot Equip', 'This item cannot be equipped in this slot.', undefined, 'warning');
          return;
        }

        if (conflictingItems.length > 0) {
          // Show confirmation dialog for conflicting items
          const conflictMessage = `Equipping this item will unequip: ${conflictingItems.join(', ')}. Continue?`;
          showAlert(
            'Equipment Conflict',
            conflictMessage,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Continue',
                onPress: () => proceedWithEquip(item, slot, currentEquipped),
                style: 'destructive'
              }
            ],
            'warning'
          );
          return;
        }
      }

      await proceedWithEquip(item, slot, currentEquipped);
    } catch (error) {
      console.error('Error equipping item:', error);
      showAlert('Error', 'Failed to equip item. Please try again.', undefined, 'error');
    }
  };

  const proceedWithEquip = async (item: Equipment, slot: EquipmentSlot, currentEquipped: EquippedItems) => {
    if (!character) return;

    try {
      let newEquipped = { ...currentEquipped };

      if (slot === 'rings') {
        // Rings can have multiple items (up to 2)
        const currentRings = currentEquipped.rings || [];
        if (currentRings.length >= 2) {
          showAlert('Ring Slots Full', 'You can only wear 2 rings at a time. Unequip a ring first.', undefined, 'warning');
          return;
        }
        newEquipped.rings = [...currentRings, item];
      } else if (slot === 'leftHand' || slot === 'rightHand') {
        // Handle two-handed weapons
        if (isTwoHandedWeapon(item)) {
          // Two-handed weapon goes in right hand and clears both hands
          newEquipped.leftHand = undefined;
          newEquipped.rightHand = item;
        } else {
          // One-handed item - check for conflicts and clear if needed
          const itemsToUnequip = getItemsToUnequipForTwoHanded(item, slot, currentEquipped);
          for (const unequipItem of itemsToUnequip) {
            if (currentEquipped.leftHand?.id === unequipItem.id) {
              newEquipped.leftHand = undefined;
            }
            if (currentEquipped.rightHand?.id === unequipItem.id) {
              newEquipped.rightHand = undefined;
            }
          }

          // Equip the item in the requested slot
          newEquipped[slot] = item;
        }
      } else {
        // Single item slots (armor, head, necklace, boots, gloves)
        newEquipped[slot] = item;
      }

      // Calculate new AC if armor was equipped
      let newAC = character.armor_class;
      if (slot === 'armor') {
        newAC = calculateArmorClass(newEquipped, character.abilities.dexterity);
      }

      // Update equipped items in database
      const { error } = await supabase
        .from('characters')
        .update({
          equipped_items: newEquipped,
          armor_class: newAC
        })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        equipped_items: newEquipped,
        armor_class: newAC,
      });

      await fetchCharacters();
    } catch (error) {
      console.error('Error equipping item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to equip item. Please try again.';
      showAlert('Error', errorMessage, undefined, 'error');
    }
  };

  const handleUnequipItem = async (slot: EquipmentSlot, ringIndex?: number) => {
    if (!character) return;

    try {
      const currentEquipped = character.equipped_items || {};
      let newEquipped = { ...currentEquipped };

      if (slot === 'rings' && typeof ringIndex === 'number') {
        // Remove specific ring
        const currentRings = currentEquipped.rings || [];
        newEquipped.rings = currentRings.filter((_, index) => index !== ringIndex);
        if (newEquipped.rings.length === 0) {
          delete newEquipped.rings;
        }
      } else {
        // Remove single item
        delete newEquipped[slot];
      }

      // Calculate new AC if armor was unequipped
      let newAC = character.armor_class;
      if (slot === 'armor') {
        newAC = calculateArmorClass(newEquipped, character.abilities.dexterity);
      }

      // Update equipped items in database
      const { error } = await supabase
        .from('characters')
        .update({
          equipped_items: newEquipped,
          armor_class: newAC
        })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        equipped_items: newEquipped,
        armor_class: newAC,
      });

      await fetchCharacters();
    } catch (error) {
      console.error('Error unequipping item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to unequip item. Please try again.';
      showAlert('Error', errorMessage, undefined, 'error');
    }
  };

  const getEquippableItems = (slot: EquipmentSlot): Equipment[] => {
    if (!character?.equipment) return [];

    return character.equipment.filter(item => {
      if (!canEquipInSlot(item, slot)) return false;

      // Check if item is already equipped and we only have one
      if (isItemEquipped(item)) {
        const itemCount = character.equipment.filter(eq => eq.id === item.id).length;
        return itemCount > 1; // Only show if we have more than one
      }

      return true;
    });
  };

  const isItemEquipped = (item: Equipment): boolean => {
    if (!character?.equipped_items) return false;

    const equipped = character.equipped_items;

    // Check all slots
    if (equipped.armor?.id === item.id) return true;
    if (equipped.leftHand?.id === item.id) return true;
    if (equipped.rightHand?.id === item.id) return true;
    if (equipped.head?.id === item.id) return true;
    if (equipped.necklace?.id === item.id) return true;
    if (equipped.boots?.id === item.id) return true;
    if (equipped.gloves?.id === item.id) return true;
    if (equipped.rings?.some(ring => ring.id === item.id)) return true;

    return false;
  };

  const openEquipmentSelection = (slot: EquipmentSlot, ringIndex?: number) => {
    setSelectedSlot(slot);
    setSelectedRingIndex(ringIndex ?? null);
    setIsSelectingEquipment(true);
  };

  const closeEquipmentSelection = () => {
    setIsSelectingEquipment(false);
    setSelectedSlot(null);
    setSelectedRingIndex(null);
  };

  const handleEquipFromSelection = async (item: Equipment) => {
    if (!selectedSlot) return;

    if (selectedSlot === 'rings' && selectedRingIndex !== null) {
      await handleEquipItem(item, 'rings');
    } else {
      await handleEquipItem(item, selectedSlot);
    }

    closeEquipmentSelection();
  };

  // Helper function to render a single equipment slot
  const renderEquipmentSlot = (slot: EquipmentSlot) => {
    if (!character) return null;
    const equipped = character.equipped_items?.[slot];
    const equippableItems = getEquippableItems(slot);

    return (
      <>
        {equipped ? (
          <View style={styles.equippedItem}>
            <Text style={styles.equippedItemName} numberOfLines={2}>
              {(equipped as Equipment).name}
            </Text>
            {canEquipItems() && (
              <TouchableOpacity
                style={styles.unequipButton}
                onPress={() => handleUnequipItem(slot)}
              >
                <X size={12} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptySlot}>
            <Text style={styles.emptySlotText}>Empty</Text>
            {canEquipItems() && equippableItems.length > 0 && (
              <TouchableOpacity
                style={styles.equipButton}
                onPress={() => openEquipmentSelection(slot)}
              >
                <Text style={styles.equipButtonText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    );
  };

  // Helper function to render ring slots
  const renderRingSlots = () => {
    if (!character) return null;
    const rings = character.equipped_items?.rings || [];
    const equippableItems = getEquippableItems('rings');

    return (
      <View style={styles.ringSlots}>
        {[0, 1].map((ringIndex) => {
          const ring = rings[ringIndex];
          return (
            <View key={ringIndex} style={styles.ringSlot}>
              {ring ? (
                <View style={styles.equippedItem}>
                  <Text style={styles.equippedItemName} numberOfLines={1}>
                    {ring.name}
                  </Text>
                  {canEquipItems() && (
                    <TouchableOpacity
                      style={styles.unequipButton}
                      onPress={() => handleUnequipItem('rings', ringIndex)}
                    >
                      <X size={12} color="#ff4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.emptySlot}>
                  <Text style={styles.emptySlotText}>Ring {ringIndex + 1}</Text>
                  {canEquipItems() && equippableItems.length > 0 && (
                    <TouchableOpacity
                      style={styles.equipButton}
                      onPress={() => openEquipmentSelection('rings', ringIndex)}
                    >
                      <Text style={styles.equipButtonText}>+</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const handleDeleteCharacter = async () => {
    if (!character || !user) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', character.id)
        .eq('user_id', user.id); // Extra safety check

      if (error) {
        throw error;
      }

      setShowDeleteConfirmation(false);

      // Refresh the characters list
      await fetchCharacters();

      showAlert(
        'Character Deleted',
        `${character.name} has been deleted successfully.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
        'success'
      );
    } catch (error) {
      console.error('Error deleting character:', error);
      showAlert('Error', 'Failed to delete character. Please try again.', undefined, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSpellExpanded = (spellIndex: string) => {
    const newExpandedSpells = new Set(expandedSpells);
    if (newExpandedSpells.has(spellIndex)) {
      newExpandedSpells.delete(spellIndex);
    } else {
      newExpandedSpells.add(spellIndex);
    }
    setExpandedSpells(newExpandedSpells);
  };

  const toggleTraitExpanded = (traitIndex: string) => {
    const newExpandedTraits = new Set(expandedTraits);
    if (newExpandedTraits.has(traitIndex)) {
      newExpandedTraits.delete(traitIndex);
    } else {
      newExpandedTraits.add(traitIndex);
    }
    setExpandedTraits(newExpandedTraits);
  };

  const toggleFeatureExpanded = (featureIndex: string) => {
    const newExpandedFeatures = new Set(expandedFeatures);
    if (newExpandedFeatures.has(featureIndex)) {
      newExpandedFeatures.delete(featureIndex);
    } else {
      newExpandedFeatures.add(featureIndex);
    }
    setExpandedFeatures(newExpandedFeatures);
  };

  // Get maximum spell level available for character
  const getMaxSpellLevel = () => {
    if (!character) return 1;
    const characterLevel = character.level || 1;

    // Maximum spell level based on character level (simplified 5e progression)
    if (characterLevel >= 17) return 9;
    if (characterLevel >= 15) return 8;
    if (characterLevel >= 13) return 7;
    if (characterLevel >= 11) return 6;
    if (characterLevel >= 9) return 5;
    if (characterLevel >= 7) return 4;
    if (characterLevel >= 5) return 3;
    if (characterLevel >= 3) return 2;
    return 1;
  };

  // Get available spell levels for dropdown
  const getAvailableSpellLevels = () => {
    const maxLevel = getMaxSpellLevel();
    const levels = [{ value: 0, label: 'Cantrips' }];

    for (let i = 1; i <= maxLevel; i++) {
      levels.push({ value: i, label: `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Level` });
    }

    return levels;
  };

  // Get spellcasting info for the character's class
  const getSpellcastingInfo = () => {
    // Simple spellcasting info based on character class name
    if (!character?.class) return null;

    // Basic spellcasting info for level 1 characters (can be enhanced for higher levels)
    const spellcastingInfo = {
      cantripsKnown: 0,
      spellsKnown: 0,
    };

    // Set cantrips and spells known based on class
    switch (character.class.toLowerCase()) {
      case 'bard':
        spellcastingInfo.cantripsKnown = 2;
        spellcastingInfo.spellsKnown = 4;
        break;
      case 'cleric':
      case 'druid':
        spellcastingInfo.cantripsKnown = 3;
        spellcastingInfo.spellsKnown = 2;
        break;
      case 'sorcerer':
      case 'warlock':
        spellcastingInfo.cantripsKnown = 4;
        spellcastingInfo.spellsKnown = 2;
        break;
      case 'wizard':
        spellcastingInfo.cantripsKnown = 3;
        spellcastingInfo.spellsKnown = 6;
        break;
      default:
        spellcastingInfo.cantripsKnown = 2;
        spellcastingInfo.spellsKnown = 2;
    }

    return spellcastingInfo;
  };

  const handleSaveFlourish = async () => {
    if (!character) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('characters')
        .update({ flourish: editedFlourish })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        flourish: editedFlourish,
      });

      await fetchCharacters();
      setIsEditingFlourish(false);
    } catch (error) {
      console.error('Error updating flourish:', error);
      showAlert('Error', 'Failed to update flourish. Please try again.', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!character) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('characters')
        .update({ description: editedDescription })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        description: editedDescription,
      });

      await fetchCharacters();
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
      showAlert('Error', 'Failed to update description. Please try again.', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const canLevelUp = character && charactersToLevelUp.some(c => c.id === character.id);

  if (!character) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Character</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Character...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{character.name}</Text>
        <TouchableOpacity
          onPress={() => setShowDeleteConfirmation(true)}
          style={styles.deleteButton}
        >
          <Trash2 color="#ff4444" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Character Portrait Section */}
        <View style={styles.portraitSection}>
          <View style={styles.characterHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={getCharacterAvatarUrl(character)}
                style={[
                  styles.avatar,
                  character.retired && styles.retiredAvatar
                ]}
              />
              {!character.retired && (
                <TouchableOpacity
                  style={styles.editAvatarButton}
                  onPress={() => setIsEditingAvatar(true)}
                >
                  <Camera size={16} color="#fff" />
                </TouchableOpacity>
              )}
              {isLoading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                </View>
              )}
            </View>
            
            <View style={styles.characterInfo}>
              <Text style={styles.characterName}>{character.name}</Text>
              <Text style={styles.characterClass}>
                Level {character.level} {character.race} {character.class}
              </Text>
              <Text style={styles.campaignName}>{getCampaignName()}</Text>
              {canLevelUp && (
                <TouchableOpacity 
                  style={styles.levelUpButton}
                  onPress={handleLevelUp}
                >
                  <ArrowUp size={16} color="#fff" />
                  <Text style={styles.levelUpButtonText}>Level Up Available!</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {getAvailableTabs().map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Icon size={20} color={isActive ? '#fff' : '#888'} />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <View>
              {/* Combat Stats */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Combat Stats</Text>
                <View style={styles.combatStatsGrid}>
                  <View style={styles.combatStatCard}>
                    <Text style={styles.combatStatLabel}>Hit Points</Text>
                    <Text style={styles.combatStatValue}>
                      {character.current_hitpoints}/{character.max_hitpoints}
                    </Text>
                    {character.temp_hitpoints > 0 && (
                      <Text style={styles.tempHpText}>+{character.temp_hitpoints} temp</Text>
                    )}
                  </View>
                  <View style={styles.combatStatCard}>
                    <Text style={styles.combatStatLabel}>Armor Class</Text>
                    <Text style={styles.combatStatValue}>{character.armor_class}</Text>
                  </View>
                  <View style={styles.combatStatCard}>
                    <Text style={styles.combatStatLabel}>Proficiency</Text>
                    <Text style={styles.combatStatValue}>{getProficiencyBonus(character.level)}</Text>
                  </View>
                </View>
              </View>

              {/* Attack Actions */}
              {getAttackActions().length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Attack Actions</Text>
                  <View style={styles.attacksList}>
                    {getAttackActions().map((attack, index) => (
                      <View key={index} style={styles.attackItem}>
                        <Text style={styles.attackName}>{attack.name}</Text>
                        <Text style={styles.attackDamage}>
                          {attack.damage} {attack.damageType}
                        </Text>
                        <Text style={styles.attackRange}>Range: {attack.range}</Text>
                        {attack.properties.length > 0 && (
                          <Text style={styles.attackProperties}>
                            Properties: {attack.properties.map(prop =>
                              typeof prop === 'string' ? prop : prop.name || 'Unknown'
                            ).join(', ')}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Ability Scores */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ability Scores</Text>
                <View style={styles.abilitiesGrid}>
                  {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((ability) => {
                    const finalScore = getFinalAbilityScore(ability);
                    const modifier = getAbilityModifier(finalScore);

                    return (
                      <View key={ability} style={styles.abilityCard}>
                        <Text style={styles.abilityName}>
                          {ability.substring(0, 3).toUpperCase()}
                        </Text>
                        <Text style={styles.abilityScore}>{finalScore}</Text>
                        <Text style={styles.abilityModifier}>
                          {modifier >= 0 ? '+' : ''}{modifier}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Skills */}
              {character.skills && character.skills.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Proficient Skills</Text>
                  <View style={styles.skillsList}>
                    {character.skills.map((skill, index) => (
                      <View key={index} style={styles.skillItem}>
                        <Text style={styles.skillName}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Flourish */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Flourish</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditingFlourish(true)}
                  >
                    <Edit3 size={16} color="#4CAF50" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.characterDetailContainer}>
                  <Text style={styles.characterDetailText}>
                    {character.flourish || 'No flourish set. Add one to enhance your character\'s actions in the story!'}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditingDescription(true)}
                  >
                    <Edit3 size={16} color="#4CAF50" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.characterDetailContainer}>
                  <Text style={styles.characterDetailText}>
                    {character.description || 'No description set. Add one so the Storyteller and companions know how you look!'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Traits Tab */}
          {activeTab === 'traits' && (
            <View>
              {/* Racial Traits */}
              {characterTraits.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Racial Traits</Text>
                  <View style={styles.traitsList}>
                    {characterTraits.map((trait, index) => {
                      const traitKey = trait.index || `trait-${index}`;
                      const isExpanded = expandedTraits.has(traitKey);

                      return (
                        <TouchableOpacity
                          key={traitKey}
                          style={styles.traitItem}
                          onPress={() => toggleTraitExpanded(traitKey)}
                        >
                          <View style={styles.traitHeader}>
                            <Text style={styles.traitName}>{trait.name}</Text>
                            {isExpanded ? (
                              <ChevronUp size={20} color="#4CAF50" />
                            ) : (
                              <ChevronDown size={20} color="#4CAF50" />
                            )}
                          </View>
                          {isExpanded && trait.description && (
                            <View style={styles.traitDetails}>
                              {Array.isArray(trait.description)
                                ? trait.description.map((desc: string, i: number) => (
                                  <Text key={i} style={styles.traitDescription}>{desc}</Text>
                                ))
                                : <Text style={styles.traitDescription}>{trait.description}</Text>
                              }
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Class Features */}
              {characterFeatures.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Class Features</Text>
                  <View style={styles.featuresList}>
                    {characterFeatures.map((feature, index) => {
                      const isExpanded = expandedFeatures.has(feature.index);
                      const isAvailable = feature.level <= character.level;

                      return (
                        <TouchableOpacity
                          key={feature.index}
                          style={[
                            styles.featureItem,
                            !isAvailable && styles.featureItemDisabled
                          ]}
                          onPress={() => toggleFeatureExpanded(feature.index)}
                        >
                          <View style={styles.featureHeader}>
                            <View style={styles.featureHeaderLeft}>
                              <Text style={[
                                styles.featureName,
                                !isAvailable && styles.featureNameDisabled
                              ]}>
                                {feature.name}
                              </Text>
                              <Text style={[
                                styles.featureLevel,
                                !isAvailable && styles.featureLevelDisabled
                              ]}>
                                Level {feature.level}{!isAvailable ? ' (Not Available)' : ''}
                              </Text>
                            </View>
                            {isExpanded ? (
                              <ChevronUp size={20} color={isAvailable ? "#4CAF50" : "#666"} />
                            ) : (
                              <ChevronDown size={20} color={isAvailable ? "#4CAF50" : "#666"} />
                            )}
                          </View>
                          {isExpanded && (
                            <View style={styles.featureDetails}>
                              {feature.prerequisites && feature.prerequisites.length > 0 && (
                                <View style={styles.featurePrerequisites}>
                                  <Text style={styles.featurePrerequisitesTitle}>Prerequisites:</Text>
                                  {feature.prerequisites.map((req: string, i: number) => (
                                    <Text key={i} style={styles.featurePrerequisite}>• {req}</Text>
                                  ))}
                                </View>
                              )}
                              {feature.description && feature.description.map((desc: string, i: number) => (
                                <Text key={i} style={[
                                  styles.featureDescription,
                                  !isAvailable && styles.featureDescriptionDisabled
                                ]}>
                                  {desc}
                                </Text>
                              ))}
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Spells Tab */}
          {activeTab === 'spells' && hasSpellcasting() && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Spells</Text>
                {canEditSpells() && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditingSpells(true)}
                  >
                    <Edit3 size={16} color="#4CAF50" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
              {character.spells && character.spells.length > 0 ? (
                <View style={styles.spellsList}>
                  {character.spells.map((spell, index) => (
                    <View key={index} style={styles.spellItem}>
                      <Text style={styles.spellName}>
                        {spell.name} ({spell.level === 0 ? 'c' : spell.level})
                      </Text>
                      <Text style={styles.spellSchool}>Casting Time: {spell.casting_time} {spell.concentration && ' (c)'}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noSpellsContainer}>
                  <Text style={styles.noSpellsText}>
                    {no1stLvlSpells ? 'You do not have 1st level spells' : 'No spells selected'}
                  </Text>
                  {canEditSpells() && (
                    <TouchableOpacity
                      style={styles.addSpellsButton}
                      onPress={() => setIsEditingSpells(true)}
                    >
                      <Scroll size={16} color="#4CAF50" />
                      <Text style={styles.addSpellsButtonText}>Add Spells</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <View>
              {/* Equipment */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Equipment</Text>
                  {canShopEquipment() && (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setIsEditingEquipment(true)}
                    >
                      <Package size={16} color="#4CAF50" />
                      <Text style={styles.editButtonText}>Shop</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Currency Display */}
                <View style={styles.currencyContainer}>
                  <View style={styles.currencyDisplay}>
                    <Coins size={20} color="#FFD700" />
                    <Text style={styles.currencyText}>
                      {formatCurrency(character.gold, character.silver, character.copper)}
                    </Text>
                  </View>
                </View>

                <View style={styles.equipmentList}>
                  {(() => {
                    // Get equipment from the equipment column
                    const equipment = character.equipment || [];

                    if (equipment.length === 0) {
                      return (
                        <Text style={styles.equipmentItem}>• No equipment</Text>
                      );
                    }

                    // Group equipment by ID and count quantities
                    const groupedEquipment = equipment.reduce((acc: { item: any; quantity: number }[], item: any) => {
                      const existingGroup = acc.find((group: { item: any; quantity: number }) => group.item.id === item.id);
                      if (existingGroup) {
                        existingGroup.quantity += 1;
                      } else {
                        acc.push({ item, quantity: 1 });
                      }
                      return acc;
                    }, []);

                    return groupedEquipment.map((group: { item: any; quantity: number }, index: number) => {
                      const baseQuantity = group.item.quantity || 1;
                      const totalQuantity = group.quantity * baseQuantity;
                      const displayName = totalQuantity > 1
                        ? `${group.item.name} ×${totalQuantity}`
                        : group.item.name;

                      return (
                        <View key={index} style={styles.equipmentItemContainer}>
                          <Text style={styles.equipmentItem}>• {displayName}</Text>
                          {canShopEquipment() && (
                            <TouchableOpacity
                              style={styles.removeEquipmentButton}
                              onPress={() => handleRemoveEquipment(group.item)}
                            >
                              <X size={16} color="#ff4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    });
                  })()}
                </View>

                {!canShopEquipment() && (
                  <Text style={styles.campaignStartedNote}>
                    Equipment shopping is disabled once the campaign has started. You can still equip/unequip items.
                  </Text>
                )}
              </View>

              {/* Equipment Slots */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Equipment Slots</Text>

                <View style={styles.equipmentSlotsGrid}>
                  {/* First row: Armor, Hand slots */}
                  <View style={styles.equipmentRow}>
                    {/* Armor slot */}
                    <View style={styles.equipmentSlot}>
                      <Text style={styles.equipmentSlotLabel}>Armor</Text>
                      {renderEquipmentSlot('armor')}
                    </View>

                    {/* Hand slots - check for two-handed weapons */}
                    {(() => {
                      const rightHandItem = character.equipped_items?.rightHand;
                      const leftHandItem = character.equipped_items?.leftHand;
                      const isTwoHandedEquipped = rightHandItem && isTwoHandedWeapon(rightHandItem);

                      if (isTwoHandedEquipped) {
                        // Show two-handed weapon spanning both slots
                        return (
                          <View style={styles.twoHandedSlot}>
                            <Text style={styles.equipmentSlotLabel}>Two-Handed Weapon</Text>
                            <View style={styles.equippedItem}>
                              <Text style={styles.equippedItemName} numberOfLines={2}>
                                {rightHandItem.name}
                              </Text>
                              {canEquipItems() && (
                                <TouchableOpacity
                                  style={styles.unequipButton}
                                  onPress={() => handleUnequipItem('rightHand')}
                                >
                                  <X size={12} color="#ff4444" />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        );
                      } else {
                        // Show separate left and right hand slots
                        return (
                          <>
                            <View style={styles.equipmentSlot}>
                              <Text style={styles.equipmentSlotLabel}>Left Hand</Text>
                              {renderEquipmentSlot('leftHand')}
                            </View>
                            <View style={styles.equipmentSlot}>
                              <Text style={styles.equipmentSlotLabel}>Right Hand</Text>
                              {renderEquipmentSlot('rightHand')}
                            </View>
                          </>
                        );
                      }
                    })()}
                  </View>

                  {/* Second row: Head, Necklace, Gloves */}
                  <View style={styles.equipmentRow}>
                    <View style={styles.equipmentSlot}>
                      <Text style={styles.equipmentSlotLabel}>Head</Text>
                      {renderEquipmentSlot('head')}
                    </View>
                    <View style={styles.equipmentSlot}>
                      <Text style={styles.equipmentSlotLabel}>Necklace</Text>
                      {renderEquipmentSlot('necklace')}
                    </View>
                    <View style={styles.equipmentSlot}>
                      <Text style={styles.equipmentSlotLabel}>Gloves</Text>
                      {renderEquipmentSlot('gloves')}
                    </View>
                  </View>

                  {/* Third row: Boots, Rings */}
                  <View style={styles.equipmentRow}>
                    <View style={styles.equipmentSlot}>
                      <Text style={styles.equipmentSlotLabel}>Boots</Text>
                      {renderEquipmentSlot('boots')}
                    </View>
                    <View style={styles.equipmentSlot}>
                      <Text style={styles.equipmentSlotLabel}>Rings</Text>
                      {renderRingSlots()}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isVisible={isEditingAvatar}
        onClose={() => setIsEditingAvatar(false)}
        onAvatarSelect={handleAvatarSelect}
        currentAvatar={getCharacterAvatarUrl(character)}
        userId={user?.id || ''}
        characterId={character.id}
      />

      {/* Equipment Shopping Modal */}
      <Modal
        visible={isEditingEquipment}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingEquipment(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Equipment Shop</Text>
              <TouchableOpacity onPress={() => setIsEditingEquipment(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {/* Currency Display */}
              <View style={styles.currencyContainer}>
                <View style={styles.currencyDisplay}>
                  <Coins size={20} color="#FFD700" />
                  <Text style={styles.currencyText}>
                    {formatCurrency(character?.gold || 0, character?.silver || 0, character?.copper || 0)}
                  </Text>
                </View>
              </View>

              {/* Search Equipment */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={equipmentSearch}
                  onChangeText={setEquipmentSearch}
                  placeholder="Search equipment..."
                  placeholderTextColor="#666"
                />
              </View>

              {/* Equipment Categories */}
              <View style={styles.filterTabsContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterTabs}
                  contentContainerStyle={styles.filterTabsContent}
                >
                  {getEquipmentCategories().map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterTab,
                        equipmentFilter === category && styles.filterTabActive,
                      ]}
                      onPress={() => setEquipmentFilter(category)}
                    >
                      <Text style={[
                        styles.filterTabText,
                        equipmentFilter === category && styles.filterTabTextActive,
                      ]}>
                        {category === 'all' ? 'All' : category.replace(/^\w/, (c: string) => c.toUpperCase())}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Equipment List */}
              <ScrollView style={styles.equipmentScrollView} showsVerticalScrollIndicator={false}>
                {getFilteredEquipment().map((item) => {
                  const canAfford = canAffordEquipment(item, character?.gold || 0, character?.silver || 0, character?.copper || 0);
                  const purchasedCount = character?.equipment?.filter(eq => eq.id === item.id).length || 0;

                  return (
                    <View key={item.id} style={[
                      styles.equipmentShopItem,
                      !canAfford && styles.equipmentShopItemDisabled,
                    ]}>
                      <View style={styles.equipmentInfo}>
                        <Text style={[
                          styles.equipmentName,
                          !canAfford && styles.equipmentNameDisabled,
                        ]}>
                          {item.name}{purchasedCount > 0 ? ` (Owned: ${purchasedCount})` : ''}
                        </Text>
                        <Text style={[
                          styles.equipmentDetails,
                          !canAfford && styles.equipmentDetailsDisabled,
                        ]}>
                          {item.equipment_category} • {item.weight} lb • {formatEquipmentCost(item)}
                        </Text>
                        {item.description && item.description.length > 0 && (
                          <Text style={[
                            styles.equipmentDescription,
                            !canAfford && styles.equipmentDescriptionDisabled,
                          ]} numberOfLines={2}>
                            {item.description[0]}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.purchaseButton,
                          !canAfford && styles.purchaseButtonDisabled,
                        ]}
                        onPress={() => handlePurchaseEquipment(item)}
                        disabled={!canAfford}
                      >
                        <ShoppingCart size={20} color={canAfford ? '#4CAF50' : '#666'} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Spells Edit Modal - Only show if class supports spellcasting */}
      {hasSpellcasting() && (
        <Modal
          visible={isEditingSpells}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsEditingSpells(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Spells</Text>
                <TouchableOpacity onPress={() => setIsEditingSpells(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>Choose your spells</Text>

                {/* Spell Level Dropdown */}
                {(() => {
                  const spellLevels = getAvailableSpellLevels();
                  const currentSpells = availableSpells.filter(spell => spell.level === selectedSpellLevel);
                  const selectedCurrentLevelSpells = selectedSpells.filter(spell => spell.level === selectedSpellLevel);

                  return (
                    <>
                      <View style={styles.dropdownContainer}>
                        <Text style={styles.dropdownLabel}>Spell Level:</Text>
                        <View style={styles.dropdown}>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.dropdownContent}
                          >
                            {spellLevels.map((level) => (
                              <TouchableOpacity
                                key={level.value}
                                style={[
                                  styles.dropdownItem,
                                  selectedSpellLevel === level.value && styles.dropdownItemActive,
                                ]}
                                onPress={() => setSelectedSpellLevel(level.value)}
                              >
                                <Text style={[
                                  styles.dropdownItemText,
                                  selectedSpellLevel === level.value && styles.dropdownItemTextActive,
                                ]}>
                                  {level.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>

                      {/* Spell List */}
                      <ScrollView style={styles.spellScrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.spellSection}>
                          <Text style={styles.spellSectionTitle}>
                            {selectedSpellLevel === 0 ? 'Cantrips' : `Level ${selectedSpellLevel} Spells`}
                            <Text style={styles.spellCount}>
                              {' '}({selectedCurrentLevelSpells.length}/{(() => {
                                const spellcastingInfo = getSpellcastingInfo();
                                return selectedSpellLevel === 0
                                  ? spellcastingInfo?.cantripsKnown || 0
                                  : spellcastingInfo?.spellsKnown || 0;
                              })()})
                            </Text>
                          </Text>
                          {currentSpells.length > 0 ? currentSpells.map((spell) => {
                            const isSelected = selectedSpells.some(s => s.index === spell.index);
                            const spellcastingInfo = getSpellcastingInfo();
                            const currentLevelSelected = selectedSpells.filter(s => s.level === spell.level);
                            const maxAllowed = spell.level === 0
                              ? spellcastingInfo?.cantripsKnown || 0
                              : spellcastingInfo?.spellsKnown || 0;
                            const isAtLimit = !isSelected && currentLevelSelected.length >= maxAllowed;

                            return (
                              <TouchableOpacity
                                key={spell.index}
                                style={[
                                  styles.spellCard,
                                  isSelected && styles.selectedSpell,
                                  isAtLimit && styles.disabledSpell,
                                ]}
                                onPress={() => {
                                  const isSelected = selectedSpells.some(s => s.index === spell.index);
                                  const spellcastingInfo = getSpellcastingInfo();

                                  if (isSelected) {
                                    // Always allow deselection
                                    setSelectedSpells(prev => prev.filter(s => s.index !== spell.index));
                                  } else {
                                    // Check limits before adding
                                    const currentLevelSelected = selectedSpells.filter(s => s.level === spell.level);
                                    const maxAllowed = spell.level === 0
                                      ? spellcastingInfo?.cantripsKnown || 0
                                      : spellcastingInfo?.spellsKnown || 0;

                                    if (currentLevelSelected.length < maxAllowed) {
                                      setSelectedSpells(prev => [...prev, spell]);
                                    } else {
                                      showAlert(
                                        'Spell Limit Reached',
                                        `You can only select ${maxAllowed} ${spell.level === 0 ? 'cantrips' : 'spells'} for this level.`,
                                        undefined,
                                        'warning'
                                      );
                                    }
                                  }
                                }}
                              >
                                <View style={styles.spellHeader}>
                                  <View style={styles.spellHeaderLeft}>
                                    <Text style={styles.spellCardName}>{spell.name}</Text>
                                    <Text style={styles.spellCardSchool}>Casting Time: {spell.casting_time} {spell.concentration && ' (c)'}</Text>
                                  </View>
                                  <TouchableOpacity
                                    style={styles.chevronButton}
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      toggleSpellExpanded(spell.index);
                                    }}
                                  >
                                    {expandedSpells.has(spell.index) ? (
                                      <ChevronUp size={20} color="#666666" />
                                    ) : (
                                      <ChevronDown size={20} color="#666666" />
                                    )}
                                  </TouchableOpacity>
                                </View>
                                {expandedSpells.has(spell.index) && (
                                  <View style={styles.spellDetails}>
                                    <Text style={styles.spellProperty}>School: {typeof spell.school === 'object' ? spell.school.name : spell.school || ''}</Text>
                                    <Text style={styles.spellProperty}>Range: {spell.range || 'Unknown'}</Text>
                                    <Text style={styles.spellProperty}>Duration: {spell.duration || 'Unknown'}</Text>
                                    {spell.concentration && (
                                      <Text style={styles.spellProperty}>Concentration</Text>
                                    )}
                                    {spell.description && spell.description.map((desc, i) => (
                                      <Text key={i} style={styles.spellDescription}>{desc}</Text>
                                    ))}
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          }) : (
                            <View style={styles.noSpellsContainer}>
                              <Text style={styles.noSpellsText}>
                                No spells available for this level
                              </Text>
                              <Text style={styles.noSpellsSubtext}>
                                Total spells loaded: {availableSpells.length}
                              </Text>
                            </View>
                          )}
                        </View>
                      </ScrollView>
                    </>
                  );
                })()}
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.saveSpellsButton}
                  onPress={updateCharacterSpells}
                  disabled={isLoading}
                >
                  <Text style={styles.saveSpellsButtonText}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Equipment Selection Modal */}
      <Modal
        visible={isSelectingEquipment}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEquipmentSelection}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectedSlot ? getSlotDisplayName(selectedSlot) : 'Equipment'}
              </Text>
              <TouchableOpacity onPress={closeEquipmentSelection}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <ScrollView style={styles.equipmentScrollView} showsVerticalScrollIndicator={false}>
                {selectedSlot && getEquippableItems(selectedSlot)
                  .map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.equipmentShopItem}
                      onPress={() => handleEquipFromSelection(item)}
                    >
                      <View style={styles.equipmentInfo}>
                        <Text style={styles.equipmentName}>{item.name}</Text>
                        <Text style={styles.equipmentDetails}>
                          {item.equipment_category} • {item.weight} lb
                          {/* Show AC for armor */}
                          {selectedSlot === 'armor' && item.armor_class_base && (
                            ` • AC ${item.armor_class_base}${item.armor_class_dex_bonus ? ' + Dex' : ''}`
                          )}
                          {/* Show damage for weapons */}
                          {(selectedSlot === 'leftHand' || selectedSlot === 'rightHand') && item.damage_dice && (
                            ` • ${item.damage_dice}${item.damage_type ? ` ${item.damage_type}` : ''}`
                          )}
                        </Text>
                        {/* Show additional armor details */}
                        {selectedSlot === 'armor' && (
                          <View style={styles.armorDetails}>
                            {item.armor_category && (
                              <Text style={styles.equipmentProperty}>
                                Type: {item.armor_category}
                              </Text>
                            )}
                            {item.str_minimum && (
                              <Text style={styles.equipmentProperty}>
                                Str Requirement: {item.str_minimum}
                              </Text>
                            )}
                            {item.stealth_disadvantage && (
                              <Text style={styles.equipmentProperty}>
                                Stealth Disadvantage
                              </Text>
                            )}
                          </View>
                        )}
                        {/* Show additional weapon details */}
                        {(selectedSlot === 'leftHand' || selectedSlot === 'rightHand') && (
                          <View style={styles.weaponDetails}>
                            {item.weapon_category && (
                              <Text style={styles.equipmentProperty}>
                                Type: {item.weapon_category}
                              </Text>
                            )}
                            {item.range_normal && (
                              <Text style={styles.equipmentProperty}>
                                Range: {item.range_normal}/{item.range_long || item.range_normal} ft
                              </Text>
                            )}
                            {item.properties && item.properties.length > 0 && (
                              <Text style={styles.equipmentProperty}>
                                Properties: {item.properties.map(prop =>
                                  typeof prop === 'string' ? prop : prop.name || 'Unknown'
                                ).join(', ')}
                              </Text>
                            )}
                          </View>
                        )}
                        {item.description && item.description.length > 0 && (
                          <Text style={styles.equipmentDescription} numberOfLines={2}>
                            {item.description[0]}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                {selectedSlot && getEquippableItems(selectedSlot).length === 0 && (
                  <View style={styles.noSpellsContainer}>
                    <Text style={styles.noSpellsText}>No available items for this slot</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Flourish Edit Modal */}
      <Modal
        visible={isEditingFlourish}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingFlourish(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Flourish</Text>
              <TouchableOpacity onPress={() => setIsEditingFlourish(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                                 Describe how you would like your character actions to be enhanced in the story
              </Text>
              <TextInput
                style={styles.characterDetailInput}
                value={editedFlourish}
                onChangeText={setEditedFlourish}
                placeholder="Ex: I always talk like a pirate"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveSpellsButton}
                onPress={handleSaveFlourish}
                disabled={isLoading}
              >
                <Text style={styles.saveSpellsButtonText}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Description Edit Modal */}
      <Modal
        visible={isEditingDescription}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingDescription(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Description</Text>
              <TouchableOpacity onPress={() => setIsEditingDescription(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Describe how your character looks so the Storyteller and companions know
              </Text>
              <TextInput
                style={styles.characterDetailInput}
                value={editedDescription}
                onChangeText={setEditedDescription}
                placeholder="Describe your character's appearance..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={6}
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveSpellsButton}
                onPress={handleSaveDescription}
                disabled={isLoading}
              >
                <Text style={styles.saveSpellsButtonText}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmation}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <Trash2 size={24} color="#ff4444" />
              <Text style={styles.deleteModalTitle}>Delete Character</Text>
            </View>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete <Text style={styles.characterNameHighlight}>{character?.name}</Text>?
              {'\n\n'}This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteConfirmation(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, isDeleting && styles.deleteConfirmButtonDisabled]}
                onPress={handleDeleteCharacter}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80, // Add extra padding to account for Android navigation bar
  },
  levelUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  levelUpButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  portraitSection: {
    marginBottom: 30,
  },
  characterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  characterInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  retiredAvatar: {
    opacity: 0.5,
    borderColor: '#666',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterName: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  characterClass: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  campaignName: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  combatStatsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  combatStatCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  combatStatLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  combatStatValue: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  tempHpText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  editButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  abilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between'
  },
  abilityCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    minWidth: 80,
  },
  abilityName: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  abilityScore: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  abilityModifier: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  spellsList: {
    gap: 8,
  },
  spellItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
  },
  spellName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  spellSchool: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  noSpellsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noSpellsText: {
    color: '#888',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  noSpellsSubtext: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  addSpellsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  addSpellsButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  equipmentList: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  equipmentItem: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  modalBody: {
    padding: 20,
    paddingBottom: 50,
    height: 500,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  spellOptionItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  spellOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  spellOptionName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  spellOptionNameSelected: {
    color: '#fff',
  },
  spellOptionDetails: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  spellOptionDetailsSelected: {
    color: '#fff',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  saveSpellsButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveSpellsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '85%',
    padding: 0,
    overflow: 'hidden',
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  deleteModalTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    padding: 20,
  },
  characterNameHighlight: {
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteConfirmButtonDisabled: {
    backgroundColor: '#cc3333',
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownLabel: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 4,
  },
  dropdownContent: {
    paddingHorizontal: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  dropdownItemActive: {
    backgroundColor: '#4CAF50',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  dropdownItemTextActive: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  spellScrollView: {
    height: 350,
  },
  spellSection: {
    marginBottom: 24,
  },
  spellSectionTitle: {
    fontSize: 18,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  spellCount: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  spellCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSpell: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  disabledSpell: {
    opacity: 0.5,
    backgroundColor: '#1a1a1a',
  },
  spellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spellHeaderLeft: {
    flex: 1,
  },
  spellCardName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  spellCardSchool: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  chevronButton: {
    padding: 4,
    marginLeft: 8,
  },
  spellDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  spellProperty: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginBottom: 6,
  },
  spellDescription: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    lineHeight: 20,
  },
  currencyContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  currencyText: {
    color: '#FFD700',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  equipmentItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  removeEquipmentButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  campaignStartedNote: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  filterTabsContainer: {
    marginBottom: 16,
  },
  filterTabs: {
    flexGrow: 0,
  },
  filterTabsContent: {
    paddingHorizontal: 4,
  },
  filterTab: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterTabText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  filterTabTextActive: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  equipmentScrollView: {
    height: 300,
    paddingBottom: 50
  },
  equipmentShopItem: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  equipmentShopItemDisabled: {
    opacity: 0.5,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  equipmentNameDisabled: {
    color: '#666',
  },
  equipmentDetails: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  equipmentDetailsDisabled: {
    color: '#555',
  },
  equipmentDescription: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  equipmentDescriptionDisabled: {
    color: '#555',
  },
  purchaseButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginLeft: 12,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#333',
    borderColor: '#666',
  },
  // Equipment Slots Styles
  equipmentSlotsGrid: {
    gap: 12,
  },
  equipmentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  equipmentSlot: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    minHeight: 80,
  },
  twoHandedSlot: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    flex: 2,
    minHeight: 80,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  equipmentSlotLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  ringSlots: {
    flexDirection: 'row',
    gap: 4,
  },
  ringSlot: {
    flex: 1,
  },
  equippedItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    position: 'relative',
  },
  equippedItemName: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingRight: 16,
  },
  unequipButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlot: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    position: 'relative',
  },
  emptySlotText: {
    color: '#666',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  equipButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  // Equipment Details Styles
  armorDetails: {
    marginTop: 4,
  },
  weaponDetails: {
    marginTop: 4,
  },
  equipmentProperty: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  // Traits styles
  traitsList: {
    gap: 8,
  },
  traitItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  traitName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  traitDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  traitDescription: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    lineHeight: 20,
  },
  // Features styles
  featuresList: {
    gap: 8,
  },
  featureItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  featureItemDisabled: {
    backgroundColor: '#1a1a1a',
    opacity: 0.7,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featureHeaderLeft: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  featureNameDisabled: {
    color: '#888',
  },
  featureLevel: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
  },
  featureLevelDisabled: {
    color: '#666',
  },
  featureDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  featurePrerequisites: {
    marginBottom: 12,
  },
  featurePrerequisitesTitle: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  featurePrerequisite: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    lineHeight: 20,
  },
  featureDescriptionDisabled: {
    color: '#888',
  },
  tabContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tabScrollContent: {
    paddingHorizontal: 4,
  },
  tab: {
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  tabTextActive: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  attacksList: {
    gap: 8,
  },
  attackItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  attackName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  attackDamage: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  attackRange: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  attackProperties: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  tabContent: {
    flex: 1,
  },
  characterDetailContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  characterDetailText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  characterDetailInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    minHeight: 100,
    textAlignVertical: 'top',
  },
});