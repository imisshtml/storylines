import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Heart, Shield, Sword, Zap, Scroll, Star, ArrowUp } from 'lucide-react-native';
import { useAtom } from 'jotai';
import { charactersAtom, fetchCharactersAtom, Character } from '../atoms/characterAtoms';
import { getCharacterAvatarUrl } from '../utils/avatarStorage';
import { useCustomAlert } from '../components/CustomAlert';
import { startLevelUpProcessAtom, charactersToLevelUpAtom } from '../atoms/levelUpAtoms';

export default function CharacterViewScreen() {
  const { characterId } = useLocalSearchParams<{ characterId: string }>();
  const [characters] = useAtom(charactersAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [character, setCharacter] = useState<Character | null>(null);
  const { showAlert } = useCustomAlert();
  const [charactersToLevelUp] = useAtom(charactersToLevelUpAtom);
  const [, startLevelUpProcess] = useAtom(startLevelUpProcessAtom);

  useEffect(() => {
    if (characterId) {
      const foundCharacter = characters.find(c => c.id === characterId);
      if (foundCharacter) {
        setCharacter(foundCharacter);
      } else {
        // Character not found, fetch characters again
        fetchCharacters();
      }
    }
  }, [characterId, characters, fetchCharacters]);

  const handleBack = () => {
    router.back();
  };

  const calculateAbilityModifier = (score: number): string => {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const calculateProficiencyBonus = (level: number): number => {
    return Math.floor((level - 1) / 4) + 2;
  };

  const handleLevelUp = () => {
    if (!character) return;
    
    // Check if character is in the list of characters to level up
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

  // Check if character can level up
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
          <Text style={styles.loadingText}>Loading character...</Text>
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
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Character Header */}
        <View style={styles.characterHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={getCharacterAvatarUrl(character)}
              style={styles.avatar}
            />
          </View>
          <View style={styles.characterInfo}>
            <Text style={styles.characterName}>{character.name}</Text>
            <Text style={styles.characterClass}>
              Level {character.level} {character.race} {character.class}
            </Text>
            <Text style={styles.characterBackground}>{character.background}</Text>
            
            {/* Level Up Button */}
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

        {/* Character Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Heart size={20} color="#E91E63" />
              <Text style={styles.statValue}>{character.current_hitpoints}/{character.max_hitpoints}</Text>
              <Text style={styles.statLabel}>Hit Points</Text>
            </View>
            <View style={styles.statItem}>
              <Shield size={20} color="#2196F3" />
              <Text style={styles.statValue}>{character.armor_class}</Text>
              <Text style={styles.statLabel}>Armor Class</Text>
            </View>
            <View style={styles.statItem}>
              <Sword size={20} color="#FF9800" />
              <Text style={styles.statValue}>{calculateProficiencyBonus(character.level)}</Text>
              <Text style={styles.statLabel}>Proficiency</Text>
            </View>
          </View>
        </View>

        {/* Ability Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ability Scores</Text>
          <View style={styles.abilityScoresContainer}>
            {Object.entries(character.abilities).map(([ability, score]) => (
              <View key={ability} style={styles.abilityScore}>
                <Text style={styles.abilityName}>{ability.substring(0, 3).toUpperCase()}</Text>
                <Text style={styles.abilityValue}>{score}</Text>
                <Text style={styles.abilityModifier}>{calculateAbilityModifier(score)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {character.skills && character.skills.length > 0 ? (
              character.skills.map((skill, index) => (
                <View key={index} style={styles.skillItem}>
                  <Star size={16} color="#4CAF50" />
                  <Text style={styles.skillName}>{skill}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No skills added</Text>
            )}
          </View>
        </View>

        {/* Spells */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spells</Text>
          <View style={styles.spellsContainer}>
            {character.spells && character.spells.length > 0 ? (
              character.spells.map((spell, index) => (
                <View key={index} style={styles.spellItem}>
                  <Zap size={16} color="#9C27B0" />
                  <View style={styles.spellInfo}>
                    <Text style={styles.spellName}>{spell.name}</Text>
                    <Text style={styles.spellDetails}>
                      Level {spell.level} • {spell.school}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No spells known</Text>
            )}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment</Text>
          <View style={styles.equipmentContainer}>
            {character.equipment && character.equipment.length > 0 ? (
              character.equipment.map((item, index) => (
                <View key={index} style={styles.equipmentItem}>
                  <Scroll size={16} color="#FF9800" />
                  <View style={styles.equipmentInfo}>
                    <Text style={styles.equipmentName}>{item.name}</Text>
                    <Text style={styles.equipmentDetails}>
                      {item.equipment_category}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No equipment</Text>
            )}
          </View>
        </View>

        {/* Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <View style={styles.currencyContainer}>
            <View style={styles.currencyItem}>
              <Text style={styles.currencyValue}>{character.gold}</Text>
              <Text style={styles.currencyLabel}>Gold</Text>
            </View>
            <View style={styles.currencyItem}>
              <Text style={styles.currencyValue}>{character.silver}</Text>
              <Text style={styles.currencyLabel}>Silver</Text>
            </View>
            <View style={styles.currencyItem}>
              <Text style={styles.currencyValue}>{character.copper}</Text>
              <Text style={styles.currencyLabel}>Copper</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    marginRight: 40, // Compensate for back button
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#ccc',
    fontFamily: 'Inter-Regular',
  },
  characterHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  characterInfo: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  characterBackground: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'Inter-Regular',
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
  statsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    fontFamily: 'Inter-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  abilityScoresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  abilityScore: {
    width: '30%',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  abilityName: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  abilityValue: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  abilityModifier: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  skillName: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
  },
  spellsContainer: {
    gap: 8,
  },
  spellItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  spellInfo: {
    flex: 1,
  },
  spellName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  spellDetails: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'Inter-Regular',
  },
  equipmentContainer: {
    gap: 8,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  equipmentDetails: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'Inter-Regular',
  },
  currencyContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  currencyItem: {
    flex: 1,
    alignItems: 'center',
  },
  currencyValue: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  currencyLabel: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'Inter-Regular',
  },
  noDataText: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});