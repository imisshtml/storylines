import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Shield, Swords, Brain, Heart, Footprints, Star, Package, BookOpen, Medal, Scroll, Sword, Sparkles, Zap, ChevronUp, ChevronDown, Moon, LogOut } from 'lucide-react-native';
import { Character, type DnDAbilities, isTwoHandedWeapon } from '../atoms/characterAtoms';
import { supabase } from '../config/supabase';
import SpellSlotTracker from './SpellSlotTracker';
import AbilityUsageTracker from './AbilityUsageTracker';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/authAtoms';
import { useCustomAlert } from './CustomAlert';
import { router } from 'expo-router';

type CoreStat = {
  name: string;
  value: number;
  modifier: number;
  savingThrow: number;
  isProficient: boolean;
  icon: React.ReactNode;
};

type CombatStat = {
  name: string;
  value: number;
  icon: React.ReactNode;
};

type Feature = {
  name: string;
  description: string;
  source: string;
};

type InventoryItem = {
  name: string;
  quantity: number;
  weight: number;
  description?: string;
  type: 'weapon' | 'armor' | 'adventuring gear' | 'tool' | 'consumable';
};

type Equipment = {
  name: string;
  type: 'weapon' | 'armor';
  stats: {
    [key: string]: string | number;
  };
  description: string;
  equipped: boolean;
};

type Spell = {
  index: string;
  name: string;
  level: number;
  school: { name: string };
  casting_time: string;
  range: string;
  components: string[];
  duration: string;
  description: string[];
};

interface CharacterViewProps {
  character?: Character | null;
  onRefresh?: () => void;
}

export default function CharacterView({ character, onRefresh }: CharacterViewProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'features' | 'inventory' | 'spells' | 'equipment'>('stats');
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [characterFeatures, setCharacterFeatures] = useState<any[]>([]);
  const [characterTraits, setCharacterTraits] = useState<any[]>([]);
  const [user] = useAtom(userAtom);
  const { showAlert } = useCustomAlert();

  // Load character features when character changes
  useEffect(() => {
    if (character) {
      loadCharacterFeatures();
      loadCharacterTraits();
    }
  }, [character]);

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

  const toggleTraitExpanded = (traitKey: string) => {
    const newExpandedTraits = new Set(expandedTraits);
    if (newExpandedTraits.has(traitKey)) {
      newExpandedTraits.delete(traitKey);
    } else {
      newExpandedTraits.add(traitKey);
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

  const handleLeaveCampaign = async () => {
    if (!character || !character.campaign_id || !user) return;
    
    showAlert(
      'Leave Campaign',
      'Are you sure you want to leave this campaign? Your character will be removed from the campaign.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave Campaign', 
          style: 'destructive',
          onPress: async () => {
            try {
              // First, get the campaign to check if user is owner
              const { data: campaign, error: campaignError } = await supabase
                .from('campaigns')
                .select('*')
                .eq('uid', character.campaign_id)
                .single();
                
              if (campaignError) throw campaignError;
              
              if (campaign.owner === user.id) {
                // User is the owner, append "quit" to owner field
                const { error: updateError } = await supabase
                  .from('campaigns')
                  .update({ owner: `${user.id}_quit` })
                  .eq('uid', character.campaign_id);
                  
                if (updateError) throw updateError;
              } else {
                // User is a player, remove from players array
                const updatedPlayers = campaign.players.filter((player: any) => player.id !== user.id);
                
                const { error: updateError } = await supabase
                  .from('campaigns')
                  .update({ players: updatedPlayers })
                  .eq('uid', character.campaign_id);
                  
                if (updateError) throw updateError;
              }
              
              // Remove character from campaign
              const { error: characterError } = await supabase
                .from('characters')
                .update({ campaign_id: null })
                .eq('id', character.id);
                
              if (characterError) throw characterError;
              
              showAlert(
                'Success',
                'You have left the campaign successfully.',
                [
                  { 
                    text: 'OK',
                    onPress: () => {
                      // Refresh character data
                      if (onRefresh) {
                        onRefresh();
                      }
                      
                      // Navigate back to home
                      router.replace('/home');
                    }
                  }
                ],
                'success'
              );
            } catch (error) {
              console.error('Error leaving campaign:', error);
              showAlert(
                'Error',
                'Failed to leave campaign. Please try again.',
                undefined,
                'error'
              );
            }
          }
        }
      ],
      'warning'
    );
  };

  // If no character is provided, show placeholder message
  if (!character) {
    return (
      <View style={styles.noCharacterContainer}>
        <Text style={styles.noCharacterText}>No character data available</Text>
      </View>
    );
  }

  // Helper function to calculate ability modifier
  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  // Helper function to get final ability score (including racial bonuses)
  const getFinalAbilityScore = (ability: keyof DnDAbilities) => {
    // Abilities are now stored with racial bonuses already applied
    return character.abilities?.[ability] || 10;
  };

  // Get equipped items from character
  const getEquippedItems = () => {
    if (!character?.equipped_items) return [];
    
    const equipped = character.equipped_items;
    const items = [];
    
    // Add equipped items from all slots
    if (equipped.armor) items.push({ ...equipped.armor, slot: 'Armor' });
    
    // Handle hand slots - check for two-handed weapons
    if (equipped.rightHand && isTwoHandedWeapon(equipped.rightHand)) {
      // Two-handed weapon - show as "Two-Handed Weapon"
      items.push({ ...equipped.rightHand, slot: 'Two-Handed Weapon' });
    } else {
      // Separate hand slots
      if (equipped.leftHand) items.push({ ...equipped.leftHand, slot: 'Left Hand' });
      if (equipped.rightHand) items.push({ ...equipped.rightHand, slot: 'Right Hand' });
    }
    
    if (equipped.head) items.push({ ...equipped.head, slot: 'Head' });
    if (equipped.necklace) items.push({ ...equipped.necklace, slot: 'Necklace' });
    if (equipped.boots) items.push({ ...equipped.boots, slot: 'Boots' });
    if (equipped.gloves) items.push({ ...equipped.gloves, slot: 'Gloves' });
    if (equipped.rings && equipped.rings.length > 0) {
      equipped.rings.forEach((ring, index) => {
        if (ring) items.push({ ...ring, slot: `Ring ${index + 1}` });
      });
    }
    
    return items;
  };

  // Get attack actions from equipped weapons
  const getAttackActions = () => {
    if (!character?.equipped_items) return [];
    
    const attacks = [];
    const equipped = character.equipped_items;
    const strModifier = getAbilityModifier(getFinalAbilityScore('strength'));
    const dexModifier = getAbilityModifier(getFinalAbilityScore('dexterity'));
    const proficiencyBonus = Math.ceil(character.level / 4) + 1;
    
    // Check for two-handed weapon first
    if (equipped.rightHand && equipped.rightHand.weapon_category && isTwoHandedWeapon(equipped.rightHand)) {
      const weapon = equipped.rightHand;
      const isFinesse = weapon.properties?.some((prop: any) => 
        typeof prop === 'string' ? prop.toLowerCase() === 'finesse' : prop.name?.toLowerCase() === 'finesse'
      );
      const modifier = isFinesse ? Math.max(strModifier, dexModifier) : strModifier;
      
      attacks.push({
        name: weapon.name,
        damage: weapon.damage_dice || '1d4',
        damageType: weapon.damage_type || 'bludgeoning',
        attackBonus: modifier + proficiencyBonus,
        damageBonus: modifier,
        range: weapon.range_normal ? `${weapon.range_normal}/${weapon.range_long || weapon.range_normal} ft` : 'Melee',
        properties: weapon.properties || []
      });
    } else {
      // Check individual hand weapons only if no two-handed weapon
      if (equipped.leftHand && equipped.leftHand.weapon_category) {
        const weapon = equipped.leftHand;
        const isFinesse = weapon.properties?.some((prop: any) => 
          typeof prop === 'string' ? prop.toLowerCase() === 'finesse' : prop.name?.toLowerCase() === 'finesse'
        );
        const modifier = isFinesse ? Math.max(strModifier, dexModifier) : strModifier;
        
        attacks.push({
          name: weapon.name,
          damage: weapon.damage_dice || '1d4',
          damageType: weapon.damage_type || 'bludgeoning',
          attackBonus: modifier + proficiencyBonus,
          damageBonus: modifier,
          range: weapon.range_normal ? `${weapon.range_normal}/${weapon.range_long || weapon.range_normal} ft` : 'Melee',
          properties: weapon.properties || []
        });
      }
      
      if (equipped.rightHand && equipped.rightHand.weapon_category) {
        const weapon = equipped.rightHand;
        const isFinesse = weapon.properties?.some((prop: any) => 
          typeof prop === 'string' ? prop.toLowerCase() === 'finesse' : prop.name?.toLowerCase() === 'finesse'
        );
        const modifier = isFinesse ? Math.max(strModifier, dexModifier) : strModifier;
        
        attacks.push({
          name: weapon.name,
          damage: weapon.damage_dice || '1d4',
          damageType: weapon.damage_type || 'bludgeoning',
          attackBonus: modifier + proficiencyBonus,
          damageBonus: modifier,
          range: weapon.range_normal ? `${weapon.range_normal}/${weapon.range_long || weapon.range_normal} ft` : 'Melee',
          properties: weapon.properties || []
        });
      }
    }
    
    return attacks;
  };

  // Build combat stats from character data
  const combatStats: CombatStat[] = [
    { name: 'Initiative', value: getAbilityModifier(getFinalAbilityScore('dexterity')), icon: <Zap size={20} color="#ffc107" /> },
    { name: 'HP', value: character.current_hitpoints || 0, icon: <Heart size={20} color="#e91e63" /> },
    { name: 'AC', value: character.armor_class || 10, icon: <Shield size={20} color="#1976d2" /> },
    { name: 'Modifier', value: Math.ceil(character.level / 4) + 1, icon: <Medal size={20} color="#9c27b0" /> },
  ];

  // Build core stats from character data
  const coreStats: CoreStat[] = ([
    'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'
  ] as const).map(ability => {
    const finalScore = getFinalAbilityScore(ability);
    const modifier = getAbilityModifier(finalScore);
    const proficiencyBonus = Math.ceil(character.level / 4) + 1;
    
    // Check if this is a saving throw proficiency (simplified - would need class data for accuracy)
    const isProficient = false; // This would need to be determined from class data
    const savingThrow = modifier + (isProficient ? proficiencyBonus : 0);

    const icons = {
      strength: <Swords size={20} color="#d32f2f" />,
      dexterity: <Footprints size={20} color="#4caf50" />,
      constitution: <Heart size={20} color="#e91e63" />,
      intelligence: <Brain size={20} color="#9c27b0" />,
      wisdom: <Star size={20} color="#ffc107" />,
      charisma: <Sparkles size={20} color="#2196f3" />,
    };

    return {
      name: ability.substring(0, 3).toUpperCase(),
      value: finalScore,
      modifier,
      savingThrow,
      isProficient,
      icon: icons[ability as keyof typeof icons],
    };
  });

  // Get features from character data (simplified)
  const features: Feature[] = [
    {
      name: `${character.class} Features`,
      description: `Class features for a level ${character.level} ${character.class}.`,
      source: `${character.class} ${character.level}`,
    },
    {
      name: `${character.race} Traits`,
      description: `Racial traits from ${character.race} heritage.`,
      source: character.race,
    },
  ];

  // Get inventory from character data
  const inventory: InventoryItem[] = [];
  
  // Add purchased equipment to inventory
  const purchasedEquipment = character.equipment || [];
  purchasedEquipment.forEach((item: any) => {
    inventory.push({
      name: item.name,
      quantity: item.quantity || 1,
      weight: item.weight || 0,
      type: item.equipment_category || 'adventuring gear',
    });
  });

  // Get equipment from character data
  const equipment: Equipment[] = [];
  
  // Add purchased equipment as equipped items
  purchasedEquipment.forEach((item: any) => {
    if (item.equipment_category === 'weapon' || item.equipment_category === 'armor') {
      equipment.push({
        name: item.name,
        type: item.equipment_category,
        stats: {
          weight: item.weight || 0,
          cost: `${item.cost_quantity || 0} ${item.cost_unit || 'gp'}`,
        },
        description: item.description || 'No description available',
        equipped: true,
      });
    }
  });

  // Get spells from character data
  const spells: Spell[] = character.spells || [];

  // Usage tracking handlers
  const handleUseSpellSlot = async (level: number) => {
    if (!character) return;
    
    try {
      const currentUsed = character.spell_slots_used?.[level.toString()] || 0;
      const maxSlots = character.spell_slots_max?.[level.toString()] || 0;
      
      if (currentUsed >= maxSlots) return; // Already at max
      
      const newUsed = { ...character.spell_slots_used, [level.toString()]: currentUsed + 1 };
      
      const { error } = await supabase
        .from('characters')
        .update({ spell_slots_used: newUsed })
        .eq('id', character.id);
        
      if (error) throw error;
      
      // Update local state would need to be handled by parent component
      console.log(`Used level ${level} spell slot`);
    } catch (error) {
      console.error('Error using spell slot:', error);
    }
  };

  const handleRestoreSpellSlot = async (level: number) => {
    if (!character) return;
    
    try {
      const currentUsed = character.spell_slots_used?.[level.toString()] || 0;
      
      if (currentUsed <= 0) return; // Already at min
      
      const newUsed = { ...character.spell_slots_used, [level.toString()]: Math.max(0, currentUsed - 1) };
      
      const { error } = await supabase
        .from('characters')
        .update({ spell_slots_used: newUsed })
        .eq('id', character.id);
        
      if (error) throw error;
      
      console.log(`Restored level ${level} spell slot`);
    } catch (error) {
      console.error('Error restoring spell slot:', error);
    }
  };

  const handleUseAbility = async (abilityKey: string, type: 'feature' | 'trait') => {
    if (!character) return;
    
    try {
      const usesField = type === 'feature' ? 'feature_uses' : 'trait_uses';
      const currentUses = character[usesField] || {};
      const abilityUse = currentUses[abilityKey];
      
      if (!abilityUse || abilityUse.used >= abilityUse.max) return;
      
      const newUses = {
        ...currentUses,
        [abilityKey]: { ...abilityUse, used: abilityUse.used + 1 }
      };
      
      const { error } = await supabase
        .from('characters')
        .update({ [usesField]: newUses })
        .eq('id', character.id);
        
      if (error) throw error;
      
      console.log(`Used ${type} ability: ${abilityKey}`);
    } catch (error) {
      console.error('Error using ability:', error);
    }
  };

  const handleRestoreAbility = async (abilityKey: string, type: 'feature' | 'trait') => {
    if (!character) return;
    
    try {
      const usesField = type === 'feature' ? 'feature_uses' : 'trait_uses';
      const currentUses = character[usesField] || {};
      const abilityUse = currentUses[abilityKey];
      
      if (!abilityUse || abilityUse.used <= 0) return;
      
      const newUses = {
        ...currentUses,
        [abilityKey]: { ...abilityUse, used: Math.max(0, abilityUse.used - 1) }
      };
      
      const { error } = await supabase
        .from('characters')
        .update({ [usesField]: newUses })
        .eq('id', character.id);
        
      if (error) throw error;
      
      console.log(`Restored ${type} ability: ${abilityKey}`);
    } catch (error) {
      console.error('Error restoring ability:', error);
    }
  };

  const renderCombatStats = () => (
    <View style={styles.combatStatsGrid}>
      {combatStats.map((stat, index) => (
        <View key={index} style={styles.combatStatItem}>
          {stat.icon}
          <Text style={styles.combatStatName}>{stat.name}</Text>
          <Text style={styles.combatStatValue}>
            {stat.name === 'HP' ? `${character.current_hitpoints}/${character.max_hitpoints}` : stat.value}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderCoreStats = () => (
    <View style={styles.statsGrid}>
      {coreStats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          {stat.icon}
          <Text style={styles.statName}>{stat.name}</Text>
          <Text style={styles.statValue}>{stat.value}</Text>
          <View style={styles.statDetails}>
            <Text style={styles.modifier}>{stat.modifier >= 0 ? `+${stat.modifier}` : stat.modifier}</Text>
            <View style={styles.saveContainer}>
              <View style={[styles.saveDot, stat.isProficient && styles.saveDotFilled]} />
              <Text style={styles.saveValue}>
                {stat.savingThrow >= 0 ? `+${stat.savingThrow}` : stat.savingThrow}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.featuresList}>
      {/* Features with Usage Tracking */}
      <AbilityUsageTracker
        character={character}
        abilities={characterFeatures
          .filter(feature => feature.level <= character.level && feature.uses_per_rest)
          .map(feature => ({
            key: feature.index || feature.name.toLowerCase().replace(/\s+/g, '-'),
            name: feature.name,
            type: 'feature' as const,
            description: feature.usage_description || feature.description
          }))}
        onUseAbility={handleUseAbility}
        onRestoreAbility={handleRestoreAbility}
      />

      {/* Features List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Class Features</Text>
        <View style={styles.traitsList}>
          {characterFeatures
            .filter(feature => feature.level <= character.level)
            .map((feature, index) => (
              <View key={index} style={styles.traitItem}>
                <TouchableOpacity
                  style={styles.traitHeader}
                  onPress={() => toggleFeatureExpanded(`${feature.index}-${index}`)}
                >
                  <View style={styles.traitInfo}>
                    <Text style={styles.traitName}>{feature.name}</Text>
                    <Text style={styles.traitSource}>Level {feature.level}</Text>
                  </View>
                  {expandedFeatures.has(`${feature.index}-${index}`) ? (
                    <ChevronUp size={20} color="#4CAF50" />
                  ) : (
                    <ChevronDown size={20} color="#666" />
                  )}
                </TouchableOpacity>
                {expandedFeatures.has(`${feature.index}-${index}`) && (
                  <Text style={styles.traitDescription}>{feature.description}</Text>
                )}
              </View>
            ))}
        </View>
      </View>

      {/* Traits with Usage Tracking */}
      <AbilityUsageTracker
        character={character}
        abilities={characterTraits
          .filter(trait => trait.uses_per_rest)
          .map(trait => ({
            key: trait.index || trait.name.toLowerCase().replace(/\s+/g, '-'),
            name: trait.name,
            type: 'trait' as const,
            description: trait.usage_description || trait.description
          }))}
        onUseAbility={handleUseAbility}
        onRestoreAbility={handleRestoreAbility}
      />

      {/* Traits List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Racial Traits</Text>
        <View style={styles.traitsList}>
          {characterTraits.map((trait, index) => (
            <View key={index} style={styles.traitItem}>
              <TouchableOpacity
                style={styles.traitHeader}
                onPress={() => toggleTraitExpanded(`${trait.index}-${index}`)}
              >
                <View style={styles.traitInfo}>
                  <Text style={styles.traitName}>{trait.name}</Text>
                  <Text style={styles.traitSource}>{character.race}</Text>
                </View>
                {expandedTraits.has(`${trait.index}-${index}`) ? (
                  <ChevronUp size={20} color="#4CAF50" />
                ) : (
                  <ChevronDown size={20} color="#666" />
                )}
              </TouchableOpacity>
              {expandedTraits.has(`${trait.index}-${index}`) && (
                <Text style={styles.traitDescription}>{trait.description}</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderInventory = () => (
    <View style={styles.inventoryList}>
      {inventory.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>No items in inventory</Text>
        </View>
      ) : (
        inventory.map((item, index) => (
          <View key={index} style={styles.inventoryItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemType}>{item.type}</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemWeight}>{item.weight} lb</Text>
              <Text style={styles.itemQuantity}>×{item.quantity}</Text>
            </View>
          </View>
        ))
      )}
      
      {/* Currency */}
      {(character.gold > 0 || character.silver > 0 || character.copper > 0) && (
        <View style={styles.currencySection}>
          <Text style={styles.currencyTitle}>Currency</Text>
          <View style={styles.currencyContainer}>
            {character.gold > 0 && (
              <Text style={styles.currencyItem}>{character.gold} gp</Text>
            )}
            {character.silver > 0 && (
              <Text style={styles.currencyItem}>{character.silver} sp</Text>
            )}
            {character.copper > 0 && (
              <Text style={styles.currencyItem}>{character.copper} cp</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderEquipment = () => {
    const equippedItems = getEquippedItems();
    const attackActions = getAttackActions();

    return (
      <View style={styles.equipmentList}>
        {/* Attack Actions */}
        {attackActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attack Actions</Text>
            <View style={styles.attacksList}>
              {attackActions.map((attack, index) => (
                <View key={index} style={styles.attackItem}>
                  <Text style={styles.attackName}>{attack.name}</Text>
                  <View style={styles.attackStats}>
                    <Text style={styles.attackBonus}>
                      Attack: +{attack.attackBonus}
                    </Text>
                    <Text style={styles.attackDamage}>
                      Damage: {attack.damage}{attack.damageBonus > 0 ? ` + ${attack.damageBonus}` : ''} {attack.damageType}
                    </Text>
                  </View>
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

        {/* Equipped Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipped Items</Text>
          {equippedItems.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No items equipped</Text>
            </View>
          ) : (
            <View style={styles.equippedItemsList}>
              {equippedItems.map((item, index) => (
                <View key={index} style={styles.equippedItemCard}>
                  <View style={styles.equippedItemHeader}>
                    <Text style={styles.equippedItemName}>{item.name}</Text>
                    <Text style={styles.equippedItemSlot}>{item.slot}</Text>
                  </View>
                  
                  {/* Show armor details */}
                  {item.armor_class_base && (
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemProperty}>
                        AC: {item.armor_class_base}{item.armor_class_dex_bonus ? ' + Dex' : ''}
                      </Text>
                      {item.armor_category && (
                        <Text style={styles.itemProperty}>Type: {item.armor_category}</Text>
                      )}
                      {item.str_minimum && (
                        <Text style={styles.itemProperty}>Str Req: {item.str_minimum}</Text>
                      )}
                      {item.stealth_disadvantage && (
                        <Text style={styles.itemProperty}>Stealth Disadvantage</Text>
                      )}
                    </View>
                  )}
                  
                  {/* Show weapon details */}
                  {item.weapon_category && (
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemProperty}>
                        Damage: {item.damage_dice || '1d4'} {item.damage_type || 'bludgeoning'}
                      </Text>
                      <Text style={styles.itemProperty}>Type: {item.weapon_category}</Text>
                      {item.range_normal && (
                        <Text style={styles.itemProperty}>
                          Range: {item.range_normal}/{item.range_long || item.range_normal} ft
                        </Text>
                      )}
                      {item.properties && item.properties.length > 0 && (
                        <Text style={styles.itemProperty}>
                          Properties: {item.properties.map(prop => 
                            typeof prop === 'string' ? prop : prop.name || 'Unknown'
                          ).join(', ')}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {/* Show other item details */}
                  {!item.armor_class_base && !item.weapon_category && (
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemProperty}>
                        {item.equipment_category || 'Accessory'}
                      </Text>
                      {item.weight && (
                        <Text style={styles.itemProperty}>Weight: {item.weight} lb</Text>
                      )}
                    </View>
                  )}
                  
                  {item.description && item.description.length > 0 && (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {Array.isArray(item.description) ? item.description[0] : item.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSpells = () => {
    // Check if this is a half-caster at level 1
    const isHalfCaster = character.class === 'Paladin' || character.class === 'Ranger';
    const isLevel1 = character.level === 1;
    const hasSpellSlots = character.spell_slots_max && Object.values(character.spell_slots_max).some(slots => slots > 0);
    
    // Debug info - remove this after fixing
    console.log('Spells debug:', {
      class: character.class,
      level: character.level,
      isHalfCaster,
      isLevel1,
      hasSpellSlots,
      spell_slots_max: character.spell_slots_max,
      spellsLength: spells.length
    });
    
    return (
      <View style={styles.spellsList}>
        {/* Debug info - remove this after fixing */}
        <View style={styles.halfCasterNotice}>
          <Text style={styles.halfCasterTitle}>Debug Info</Text>
          <Text style={styles.halfCasterDescription}>
            Class: {character.class} | Level: {character.level}
            {'\n'}Half-caster: {isHalfCaster ? 'Yes' : 'No'}
            {'\n'}Level 1: {isLevel1 ? 'Yes' : 'No'}
            {'\n'}Has spell slots: {hasSpellSlots ? 'Yes' : 'No'}
            {'\n'}Spells count: {spells.length}
          </Text>
        </View>
        
        {/* Show informative message for half-casters at level 1 */}
        {isHalfCaster && isLevel1 && !hasSpellSlots && (
          <View style={styles.halfCasterNotice}>
            <Text style={styles.halfCasterTitle}>Spellcasting Unlocks at Level 2</Text>
            <Text style={styles.halfCasterDescription}>
              {character.class}s are half-casters who begin their magical journey at 2nd level. 
              You will gain spell slots and the ability to cast spells when you reach level 2.
            </Text>
            <Text style={styles.halfCasterDetails}>
              At level 2, you will gain:
              {'\n'}• 2 first-level spell slots
              {'\n'}• Access to {character.class.toLowerCase()} spells
              {character.class === 'Paladin' 
                ? '\n• Divine magic focused on protection and smiting'
                : '\n• Nature magic for tracking and survival'
              }
            </Text>
          </View>
        )}

        {/* Spell Slot Tracker - only show if character has spell slots */}
        {hasSpellSlots && (
          <SpellSlotTracker
            character={character}
            onUseSpellSlot={handleUseSpellSlot}
            onRestoreSpellSlot={handleRestoreSpellSlot}
          />
        )}
        
        {/* Spells List */}
        {spells.length === 0 && !isHalfCaster ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No spells known</Text>
          </View>
        ) : spells.length > 0 ? (
          spells.map((spell, index) => (
            <TouchableOpacity
              key={index}
              style={styles.spellItem}
              onPress={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
            >
              <View style={styles.spellHeader}>
                <Text style={styles.spellName}>
                  {spell.name} ({spell.level === 0 ? 'c' : spell.level})
                </Text>
              </View>
              {expandedSpell === spell.name ? (
                <View style={styles.spellDetails}>
                  <Text style={styles.spellSchool}>{spell.school?.name || 'Unknown School'}</Text>
                  <Text style={styles.spellProperty}>Casting Time: {spell.casting_time}</Text>
                  <Text style={styles.spellProperty}>Range: {spell.range}</Text>
                  <Text style={styles.spellProperty}>Components: {spell.components?.join(', ') || 'None'}</Text>
                  <Text style={styles.spellProperty}>Duration: {spell.duration}</Text>
                  {spell.description && spell.description.map((desc, i) => (
                    <Text key={i} style={styles.spellDescription}>{desc}</Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.spellPreview} numberOfLines={1}>
                  {spell.description?.[0] || 'No description available'}
                </Text>
              )}
            </TouchableOpacity>
          ))
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
          activeOpacity={0.7}
        >
          <Medal size={24} color={activeTab === 'stats' ? '#4CAF50' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'features' && styles.activeTab]}
          onPress={() => setActiveTab('features')}
          activeOpacity={0.7}
        >
          <BookOpen size={24} color={activeTab === 'features' ? '#4CAF50' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'spells' && styles.activeTab]}
          onPress={() => setActiveTab('spells')}
          activeOpacity={0.7}
        >
          <Scroll size={24} color={activeTab === 'spells' ? '#4CAF50' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'equipment' && styles.activeTab]}
          onPress={() => setActiveTab('equipment')}
          activeOpacity={0.7}
        >
          <Sword size={24} color={activeTab === 'equipment' ? '#4CAF50' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
          onPress={() => setActiveTab('inventory')}
          activeOpacity={0.7}
        >
          <Package size={24} color={activeTab === 'inventory' ? '#4CAF50' : '#666'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'stats' && (
          <>
            {renderCombatStats()}
            {renderCoreStats()}
          </>
        )}
        {activeTab === 'features' && renderFeatures()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'equipment' && renderEquipment()}
        {activeTab === 'spells' && renderSpells()}
        
        {/* Leave Campaign Button */}
        {character.campaign_id && (
          <TouchableOpacity 
            style={styles.leaveCampaignButton}
            onPress={handleLeaveCampaign}
          >
            <LogOut size={20} color="#fff" />
            <Text style={styles.leaveCampaignText}>Leave Campaign</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  noCharacterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noCharacterText: {
    fontSize: 18,
    color: '#666',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgb(26, 26, 26)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    height: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 48,
    height: 36,
    zIndex: 1,
  },
  activeTab: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  combatStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  combatStatItem: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  combatStatName: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  combatStatValue: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '30%',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  statValue: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  statDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  modifier: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  saveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
  },
  saveDotFilled: {
    backgroundColor: '#4CAF50',
  },
  saveValue: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  featuresList: {
    gap: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  traitsList: {
    gap: 12,
  },
  traitItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  traitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  traitName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  traitSource: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  traitDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    lineHeight: 20,
  },
  inventoryList: {
    gap: 8,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  itemType: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter-Regular',
    textTransform: 'capitalize',
  },
  itemDetails: {
    marginTop: 8,
    gap: 4,
  },
  itemWeight: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  itemQuantity: {
    fontSize: 15,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
  },
  currencySection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currencyTitle: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  currencyItem: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
  },
  equipmentList: {
    gap: 12,
  },
  attacksList: {
    gap: 12,
  },
  attackItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attackName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  attackStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attackBonus: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
  },
  attackDamage: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  attackRange: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  attackProperties: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  equippedItemsList: {
    gap: 12,
  },
  equippedItemCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  equippedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  equippedItemName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  equippedItemSlot: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  itemProperty: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    lineHeight: 20,
  },
  spellsList: {
    gap: 12,
  },
  spellItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  spellHeader: {
    marginBottom: 4,
  },
  spellName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  spellPreview: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  spellDetails: {
    marginTop: 8,
  },
  spellSchool: {
    fontSize: 14,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  spellProperty: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  spellDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    lineHeight: 20,
  },
  emptySection: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptySectionText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  halfCasterNotice: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  halfCasterTitle: {
    fontSize: 18,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  halfCasterDescription: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
    lineHeight: 22,
    textAlign: 'center',
  },
  halfCasterDetails: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  leaveCampaignButton: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  leaveCampaignText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});