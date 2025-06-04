import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Shield, Swords, Brain, Heart, Footprints, Star, Package, BookOpen, Medal, Scroll, Sword, Sparkles, Zap } from 'lucide-react-native';

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
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
};

export default function CharacterView() {
  const [activeTab, setActiveTab] = useState<'stats' | 'features' | 'inventory' | 'spells' | 'equipment'>('stats');
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);

  const combatStats: CombatStat[] = [
    { name: 'Initiative', value: 2, icon: <Zap size={20} color="#ffc107" /> },
    { name: 'HP', value: 12, icon: <Heart size={20} color="#e91e63" /> },
    { name: 'AC', value: 16, icon: <Shield size={20} color="#1976d2" /> },
    { name: 'Proficiency', value: 2, icon: <Medal size={20} color="#9c27b0" /> },
  ];

  const coreStats: CoreStat[] = [
    { name: 'STR', value: 16, modifier: 3, savingThrow: 5, isProficient: true, icon: <Swords size={20} color="#d32f2f" /> },
    { name: 'DEX', value: 14, modifier: 2, savingThrow: 2, isProficient: false, icon: <Footprints size={20} color="#4caf50" /> },
    { name: 'CON', value: 15, modifier: 2, savingThrow: 4, isProficient: true, icon: <Heart size={20} color="#e91e63" /> },
    { name: 'INT', value: 10, modifier: 0, savingThrow: 0, isProficient: false, icon: <Brain size={20} color="#9c27b0" /> },
    { name: 'WIS', value: 12, modifier: 1, savingThrow: 1, isProficient: false, icon: <Star size={20} color="#ffc107" /> },
    { name: 'CHA', value: 8, modifier: -1, savingThrow: -1, isProficient: false, icon: <Sparkles size={20} color="#2196f3" /> },
  ];

  const features: Feature[] = [
    {
      name: 'Fighting Style: Defense',
      description: 'While wearing armor, you gain a +1 bonus to AC.',
      source: 'Warrior 1',
    },
    {
      name: 'Second Wind',
      description: 'Once per short rest, use a bonus action to regain 1d10 + fighter level HP.',
      source: 'Warrior 1',
    },
    {
      name: 'Martial Weapons',
      description: 'You are proficient with all martial weapons.',
      source: 'Warrior',
    },
  ];

  const inventory: InventoryItem[] = [
    { name: 'Arrows', quantity: 20, weight: 1, type: 'adventuring gear' },
    { name: 'Backpack', quantity: 1, weight: 5, type: 'adventuring gear' },
    { name: 'Bedroll', quantity: 1, weight: 7, type: 'adventuring gear' },
    { name: 'Rations (days)', quantity: 5, weight: 10, type: 'consumable' },
    { name: 'Rope, hempen (50 feet)', quantity: 1, weight: 10, type: 'adventuring gear' },
    { name: 'Tinderbox', quantity: 1, weight: 1, type: 'tool' },
    { name: 'Torch', quantity: 5, weight: 5, type: 'adventuring gear' },
    { name: 'Waterskin', quantity: 1, weight: 5, type: 'adventuring gear' },
  ];

  const equipment: Equipment[] = [
    {
      name: 'Longsword',
      type: 'weapon',
      stats: {
        damage: '1d8 slashing',
        properties: 'Versatile (1d10)',
        weight: 3,
      },
      description: 'Versatile melee weapon',
      equipped: true,
    },
    {
      name: 'Chain Mail',
      type: 'armor',
      stats: {
        ac: 16,
        weight: 55,
        'str-requirement': 13,
        'stealth': 'Disadvantage',
      },
      description: 'Heavy armor made of interlocking metal rings',
      equipped: true,
    },
    {
      name: 'Shield',
      type: 'armor',
      stats: {
        ac: 2,
        weight: 6,
      },
      description: 'A wooden or metal shield',
      equipped: true,
    },
  ];

  const spells: Spell[] = [
    {
      name: 'Fire Bolt',
      level: 0,
      school: 'Evocation',
      castingTime: '1 action',
      range: '120 feet',
      components: 'V, S',
      duration: 'Instantaneous',
      description: 'Ranged spell attack deals 1d10 fire damage. Ignites flammable objects.',
    },
    {
      name: 'Shield',
      level: 1,
      school: 'Abjuration',
      castingTime: '1 reaction',
      range: 'Self',
      components: 'V, S',
      duration: '1 round',
      description: '+5 to AC, including against triggering attack. Blocks Magic Missile.',
    },
  ];

  const renderCombatStats = () => (
    <View style={styles.combatStatsGrid}>
      {combatStats.map((stat, index) => (
        <View key={index} style={styles.combatStatItem}>
          {stat.icon}
          <Text style={styles.combatStatName}>{stat.name}</Text>
          <Text style={styles.combatStatValue}>{stat.value}</Text>
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
      {inventory.map((item, index) => (
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
      ))}
    </View>
  );

  const renderEquipment = () => (
    <View style={styles.equipmentList}>
      {equipment.map((item, index) => (
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
      ))}
    </View>
  );

  const renderSpells = () => (
    <View style={styles.spellsList}>
      {spells.map((spell, index) => (
        <TouchableOpacity
          key={index}
          style={styles.spellItem}
          onPress={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
        >
          <View style={styles.spellHeader}>
            <Text style={styles.spellName}>{spell.name}</Text>
            <Text style={styles.spellLevel}>
              {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
            </Text>
          </View>
          {expandedSpell === spell.name ? (
            <View style={styles.spellDetails}>
              <Text style={styles.spellSchool}>{spell.school}</Text>
              <Text style={styles.spellProperty}>Casting Time: {spell.castingTime}</Text>
              <Text style={styles.spellProperty}>Range: {spell.range}</Text>
              <Text style={styles.spellProperty}>Components: {spell.components}</Text>
              <Text style={styles.spellProperty}>Duration: {spell.duration}</Text>
              <Text style={styles.spellDescription}>{spell.description}</Text>
            </View>
          ) : (
            <Text style={styles.spellPreview} numberOfLines={1}>
              {spell.description}
            </Text>
          )}
        </TouchableOpacity>
      ))}
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
    backgroundColor: '#f5f5f5',
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
    backgroundColor: 'white',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spellName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  spellLevel: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
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
});