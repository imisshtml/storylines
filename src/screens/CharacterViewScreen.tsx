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
  Alert,
  Platform,
} from 'react-native';
import { ArrowLeft, Camera, Upload, LocationEdit as Edit3, Scroll, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import * as ImagePicker from 'expo-image-picker';
import {
  charactersAtom,
  fetchCharactersAtom,
  type Character,
  type DnDSpell,
} from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import { supabase } from '../config/supabase';

interface CharacterViewScreenProps {
  characterId: string;
}

export default function CharacterViewScreen() {
  const [user] = useAtom(userAtom);
  const [characters] = useAtom(charactersAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [character, setCharacter] = useState<Character | null>(null);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingSpells, setIsEditingSpells] = useState(false);
  const [selectedSpells, setSelectedSpells] = useState<DnDSpell[]>([]);
  const [availableSpells, setAvailableSpells] = useState<DnDSpell[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get character ID from route params (for now, we'll use the first character)
  useEffect(() => {
    if (characters.length > 0) {
      setCharacter(characters[0]);
      setSelectedSpells(characters[0].spells || []);
    }
  }, [characters]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  useEffect(() => {
    if (isEditingSpells) {
      loadAvailableSpells();
    }
  }, [isEditingSpells]);

  const loadAvailableSpells = async () => {
    try {
      const { data: spells, error } = await supabase
        .from('spells')
        .select('*')
        .lte('level', 1)
        .order('level')
        .order('name');

      if (error) throw error;
      setAvailableSpells(spells || []);
    } catch (error) {
      console.error('Error loading spells:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Avatar Selection',
        'Choose an avatar option:',
        [
          {
            text: 'Random Fantasy Portrait',
            onPress: () => {
              const portraits = [
                'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
                'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
                'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=400',
                'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
                'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=400',
              ];
              const randomPortrait = portraits[Math.floor(Math.random() * portraits.length)];
              updateCharacterAvatar(randomPortrait);
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select an avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateCharacterAvatar(result.assets[0].uri);
      }
    }
  };

  const updateCharacterAvatar = async (avatarUri: string) => {
    if (!character) return;

    setIsLoading(true);
    try {
      const updatedCharacterData = {
        ...character.character_data,
        avatar: avatarUri,
      };

      const { error } = await supabase
        .from('characters')
        .update({ character_data: updatedCharacterData })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        character_data: updatedCharacterData,
      });

      // Refresh characters list
      await fetchCharacters();
      setIsEditingAvatar(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update avatar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCharacterSpells = async () => {
    if (!character) return;

    setIsLoading(true);
    try {
      const updatedCharacterData = {
        ...character.character_data,
        spells: selectedSpells,
      };

      const { error } = await supabase
        .from('characters')
        .update({ 
          spells: selectedSpells,
          character_data: updatedCharacterData 
        })
        .eq('id', character.id);

      if (error) throw error;

      // Update local state
      setCharacter({
        ...character,
        spells: selectedSpells,
        character_data: updatedCharacterData,
      });

      // Refresh characters list
      await fetchCharacters();
      setIsEditingSpells(false);
    } catch (error) {
      console.error('Error updating spells:', error);
      Alert.alert('Error', 'Failed to update spells. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCharacterAvatar = () => {
    const avatar = character?.character_data?.avatar;
    if (avatar) return avatar;
    
    // Default avatars based on class
    const classAvatars: { [key: string]: string } = {
      'Fighter': 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Wizard': 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Rogue': 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Cleric': 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Ranger': 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=400',
    };
    
    return classAvatars[character?.class || 'Fighter'] || classAvatars['Fighter'];
  };

  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const getFinalAbilityScore = (ability: string) => {
    const baseScore = character?.abilities?.[ability] || 10;
    
    // Add racial bonuses if available
    const raceData = character?.character_data?.race;
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

  const getCampaignName = () => {
    // For now, return a placeholder since we don't have campaign assignment implemented
    return character?.campaign_id ? 'Adventure Campaign' : 'No Campaign Set';
  };

  const hasSpellcasting = () => {
    // Check if the character's class supports spellcasting
    const classData = character?.character_data?.class;
    return classData?.spellcasting || false;
  };

  if (!character) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Character View</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No character found</Text>
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
        {/* Character Portrait Section */}
        <View style={styles.portraitSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: getCharacterAvatar() }} style={styles.avatar} />
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => setIsEditingAvatar(true)}
            >
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.characterName}>{character.name}</Text>
          <Text style={styles.characterClass}>
            Level {character.level} {character.race} {character.class}
          </Text>
          <Text style={styles.campaignName}>{getCampaignName()}</Text>
        </View>

        {/* Ability Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ability Scores</Text>
          <View style={styles.abilitiesGrid}>
            {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((ability) => {
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

        {/* Spells - Only show if class supports spellcasting */}
        {hasSpellcasting() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Spells</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditingSpells(true)}
              >
                <Edit3 size={16} color="#4CAF50" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {character.spells && character.spells.length > 0 ? (
              <View style={styles.spellsList}>
                {character.spells.map((spell, index) => (
                  <View key={index} style={styles.spellItem}>
                    <Text style={styles.spellName}>
                      {spell.name} ({spell.level === 0 ? 'c' : spell.level})
                    </Text>
                    <Text style={styles.spellSchool}>{spell.school?.name || 'Unknown'}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noSpellsContainer}>
                <Text style={styles.noSpellsText}>No spells selected</Text>
                <TouchableOpacity
                  style={styles.addSpellsButton}
                  onPress={() => setIsEditingSpells(true)}
                >
                  <Scroll size={16} color="#4CAF50" />
                  <Text style={styles.addSpellsButtonText}>Add Spells</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment</Text>
          <View style={styles.equipmentList}>
            <Text style={styles.equipmentItem}>• Leather Armor (AC 11 + Dex modifier)</Text>
            <Text style={styles.equipmentItem}>• Simple Weapon (1d6 damage)</Text>
            <Text style={styles.equipmentItem}>• Adventuring Pack</Text>
            <Text style={styles.equipmentItem}>• 50 Gold Pieces</Text>
            {hasSpellcasting() && (
              <Text style={styles.equipmentItem}>• Spellcasting Focus</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Avatar Edit Modal */}
      <Modal
        visible={isEditingAvatar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingAvatar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Avatar</Text>
              <TouchableOpacity onPress={() => setIsEditingAvatar(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.currentAvatarContainer}>
                <Image source={{ uri: getCharacterAvatar() }} style={styles.currentAvatar} />
              </View>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Upload size={20} color="#4CAF50" />
                <Text style={styles.uploadButtonText}>Choose New Portrait</Text>
              </TouchableOpacity>
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
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>
                  Selected: {selectedSpells.length} spells
                </Text>
                {availableSpells.map((spell) => (
                  <TouchableOpacity
                    key={spell.index}
                    style={[
                      styles.spellOptionItem,
                      selectedSpells.some(s => s.index === spell.index) && styles.spellOptionSelected,
                    ]}
                    onPress={() => {
                      if (selectedSpells.some(s => s.index === spell.index)) {
                        setSelectedSpells(prev => prev.filter(s => s.index !== spell.index));
                      } else {
                        setSelectedSpells(prev => [...prev, spell]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.spellOptionName,
                      selectedSpells.some(s => s.index === spell.index) && styles.spellOptionNameSelected,
                    ]}>
                      {spell.name}
                    </Text>
                    <Text style={[
                      styles.spellOptionDetails,
                      selectedSpells.some(s => s.index === spell.index) && styles.spellOptionDetailsSelected,
                    ]}>
                      {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.school}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
    marginRight: 40,
  },
  content: {
    flex: 1,
    padding: 20,
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
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
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
    maxHeight: '80%',
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
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  currentAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  uploadButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
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
});