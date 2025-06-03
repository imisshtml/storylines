import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Shield, Swords, Brain, Heart, Footprints, Star, Package, BookOpen, Medal } from 'lucide-react-native';

type Stat = {
  name: string;
  value: number;
  icon: React.ReactNode;
};

type Skill = {
  name: string;
  level: number;
  description: string;
};

type InventoryItem = {
  name: string;
  quantity: number;
  type: 'weapon' | 'armor' | 'potion' | 'misc';
};

export default function CharacterView() {
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'inventory'>('stats');

  const stats: Stat[] = [
    { name: 'Strength', value: 16, icon: <Swords size={20} color="#d32f2f" /> },
    { name: 'Defense', value: 14, icon: <Shield size={20} color="#1976d2" /> },
    { name: 'Intelligence', value: 12, icon: <Brain size={20} color="#9c27b0" /> },
    { name: 'Vitality', value: 15, icon: <Heart size={20} color="#e91e63" /> },
    { name: 'Agility', value: 13, icon: <Footprints size={20} color="#4caf50" /> },
    { name: 'Luck', value: 10, icon: <Star size={20} color="#ffc107" /> },
  ];

  const skills: Skill[] = [
    { name: 'Swordsmanship', level: 3, description: 'Mastery of blade combat' },
    { name: 'Arcane Magic', level: 2, description: 'Knowledge of mystical arts' },
    { name: 'Survival', level: 4, description: 'Wilderness adaptation skills' },
  ];

  const inventory: InventoryItem[] = [
    { name: 'Steel Sword', quantity: 1, type: 'weapon' },
    { name: 'Leather Armor', quantity: 1, type: 'armor' },
    { name: 'Health Potion', quantity: 5, type: 'potion' },
    { name: 'Magic Scroll', quantity: 2, type: 'misc' },
  ];

  const renderStats = () => (
    <View style={styles.statsGrid}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          {stat.icon}
          <Text style={styles.statName}>{stat.name}</Text>
          <Text style={styles.statValue}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );

  const renderSkills = () => (
    <View style={styles.skillsList}>
      {skills.map((skill, index) => (
        <View key={index} style={styles.skillItem}>
          <View style={styles.skillHeader}>
            <Text style={styles.skillName}>{skill.name}</Text>
            <View style={styles.levelContainer}>
              {[...Array(5)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.levelDot,
                    i < skill.level ? styles.levelDotFilled : null,
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={styles.skillDescription}>{skill.description}</Text>
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
          <Text style={styles.itemQuantity}>x{item.quantity}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/images/paper_background.jpg')}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Medal size={20} color={activeTab === 'stats' ? '#4CAF50' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
              Stats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'skills' && styles.activeTab]}
            onPress={() => setActiveTab('skills')}
          >
            <BookOpen size={20} color={activeTab === 'skills' ? '#4CAF50' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'skills' && styles.activeTabText]}>
              Skills
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
            onPress={() => setActiveTab('inventory')}
          >
            <Package size={20} color={activeTab === 'inventory' ? '#4CAF50' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>
              Inventory
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'stats' && renderStats()}
          {activeTab === 'skills' && renderSkills()}
          {activeTab === 'inventory' && renderInventory()}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: 'rgb(26, 26, 26)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgb(26, 26, 26)',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  tabText: {
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  activeTabText: {
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    width: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statName: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  statValue: {
    fontSize: 24,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  skillsList: {
    gap: 16,
  },
  skillItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 18,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  levelContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  levelDotFilled: {
    backgroundColor: '#4CAF50',
  },
  skillDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  inventoryList: {
    gap: 12,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
  },
  itemType: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  itemQuantity: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
  },
});