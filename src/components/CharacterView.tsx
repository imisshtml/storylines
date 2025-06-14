import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Shield, Swords, Brain, Heart, Footprints, Star, Package, BookOpen, Medal, Scroll, Sword, Sparkles, Zap } from 'lucide-react-native';
import { Character } from '../atoms/characterAtoms';

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
}

export default function CharacterView({ character }: CharacterViewProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'features' | 'inventory' | 'spells' | 'equipment'>('stats');
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);

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
  const getFinalAbilityScore = (ability: string) => {
    const baseScore = character.abilities?.[ability] || 10;
    
    // Add racial bonuses if available
    const raceData = character.character_data?.race;
    if (raceData?.ability_bonuses) {
      const bonus = raceData.ability_bonuses.find(
        (bonus: any) => bonus.ability_score.index === ability.substring(0, 3)
      );
      if (bonus) {
        return baseScore + bonus.bonus;
      }
    }
    
    return baseScore;
  };

  // Build combat stats from character data
  const combatStats: CombatStat[] = [
    { name: 'Initiative', value: getAbilityModifier(getFinalAbilityScore('dexterity')), icon: <Zap size={20} color="#ffc107" /> },
    { name: 'HP', value: character.current_hitpoints || 0, icon: <Heart size={20} color="#e91e63" /> },
    { name: 'AC', value: character.armor_class || 10, icon: <Shield size={20} color="#1976d2" /> },
    { name: 'Proficiency', value: Math.ceil(character.level / 4) + 1, icon: <Medal size={20} color="#9c27b0" /> },
  ];

  // Build core stats from character data
  const coreStats: CoreStat[] = [
    'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'
  ].map(ability => {
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
  const purchasedEquipment = character.character_data?.purchasedEquipment || [];
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
      {features.map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <View style={styles.featureHeader}>
            <Text style={styles.featureName}>{feature.name}</Text>
            <Text style={styles.featureSource}>{feature.source}</Text>
          </View>
          <Text style={styles.featureDescription}>{feature.description}</Text>
        </View>
      ))}
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

  const renderEquipment = () => (
    <View style={styles.equipmentList}>
      {equipment.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>No equipment</Text>
        </View>
      ) : (
        equipment.map((item, index) => (
          <View key={index} style={styles.equipmentItem}>
            <View style={styles.equipmentHeader}>
              <Text style={styles.equipmentName}>{item.name}</Text>
              {item.equipped && <Text style={styles.equippedBadge}>Equipped</Text>}
            </View>
            <View style={styles.equipmentStats}>
              {Object.entries(item.stats).map(([key, value]) => (
                <Text key={key} style={styles.equipmentStat}>
                  {key}: {value}
                </Text>
              ))}
            </View>
            <Text style={styles.equipmentDescription}>{item.description}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderSpells = () => (
    <View style={styles.spellsList}>
      {spells.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>No spells known</Text>
        </View>
      ) : (
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
      )}
    </View>
  );

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
          style={[styles.tab, activeTab === 'equipment' && styles.activeTab]}
          onPress={() => setActiveTab('equipment')}
          activeOpacity={0.7}
        >
          <Sword size={24} color={activeTab === 'equipment' ? '#4CAF50' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'spells' && styles.activeTab]}
          onPress={() => setActiveTab('spells')}
          activeOpacity={0.7}
        >
          <Scroll size={24} color={activeTab === 'spells' ? '#4CAF50' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'features' && styles.activeTab]}
          onPress={() => setActiveTab('features')}
          activeOpacity={0.7}
        >
          <BookOpen size={24} color={activeTab === 'features' ? '#4CAF50' : '#666'} />
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
    color: '#666',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  combatStatValue: {
    fontSize: 20,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '30%',
    backgroundColor: 'white',
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
    color: '#666',
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  statValue: {
    fontSize: 24,
    color: '#1a1a1a',
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
    color: '#4CAF50',
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
  featureItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  featureSource: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
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
    alignItems: 'flex-end',
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
  equipmentItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipmentName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  equippedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  equipmentStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  equipmentStat: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter-Regular',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: 'capitalize',
  },
  equipmentDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
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
});