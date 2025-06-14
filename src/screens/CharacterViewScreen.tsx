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
} from 'react-native';
import { ArrowLeft, Camera, LocationEdit as Edit3, Scroll, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAtom } from 'jotai';
import {
  charactersAtom,
  fetchCharactersAtom,
  type Character,
  type DnDSpell,
} from '../atoms/characterAtoms';
import { campaignsAtom } from '../atoms/campaignAtoms';
import { userAtom } from '../atoms/authAtoms';
import { supabase } from '../config/supabase';
import { getCharacterAvatarUrl } from '../utils/avatarStorage';
import AvatarSelector from '../components/AvatarSelector';
import { useCustomAlert } from '../components/CustomAlert';

export default function CharacterViewScreen() {
  const { characterId } = useLocalSearchParams<{ characterId: string }>();
  const [user] = useAtom(userAtom);
  const [characters] = useAtom(charactersAtom);
  const [campaigns] = useAtom(campaignsAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
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

  useEffect(() => {
    if (characters.length > 0 && characterId) {
      const selectedCharacter = characters.find(c => c.id === characterId);
      if (selectedCharacter) {
        setCharacter(selectedCharacter);
        setSelectedSpells(selectedCharacter.spells || []);
      }
    }
  }, [characters, characterId]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  useEffect(() => {
    if (isEditingSpells && character) {
      loadAvailableSpells();
      // Load character's current spells
      setSelectedSpells(character.spells || []);
    }
  }, [isEditingSpells, character]);

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

  const handleBack = () => {
    router.back();
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!character) return;

    setIsLoading(true);
    try {
      const updatedCharacterData = {
        ...character.character_data,
        avatar: avatarUrl,
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
      showAlert('Error', 'Failed to update spells. Please try again.', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
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
    if (character?.campaign_id) {
      // Find the campaign by campaign_id (which should match campaign.uid)
      const campaign = campaigns.find(c => c.uid === character.campaign_id);
      return campaign ? campaign.name : 'Unknown Campaign';
    }
    return 'No Campaign Set';
  };

  const hasSpellcasting = () => {
    // Check if the character's class supports spellcasting
    const classData = character?.character_data?.class;
    return classData?.spellcasting || false;
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

  // Get maximum spell level available for character
  const getMaxSpellLevel = () => {
    if (!character) return 1;
    const characterLevel = character.level || 1;
    
    // Maximum spell level based on character level (simplified D&D 5e progression)
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
    const classData = character?.character_data?.class;
    if (!classData?.spellcasting) return null;
    
    // Basic spellcasting info for level 1 characters (can be enhanced for higher levels)
    const spellcastingInfo = {
      cantripsKnown: 0,
      spellsKnown: 0,
    };

    // Set cantrips and spells known based on class
    switch (classData.index) {
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
        <TouchableOpacity 
          onPress={() => setShowDeleteConfirmation(true)} 
          style={styles.deleteButton}
        >
          <Trash2 color="#ff4444" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Character Portrait Section */}
        <View style={styles.portraitSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={getCharacterAvatarUrl(character)} 
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => setIsEditingAvatar(true)}
            >
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
            {isLoading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#4CAF50" />
              </View>
            )}
          </View>
          <Text style={styles.characterName}>{character.name}</Text>
          <Text style={styles.characterClass}>
            Level {character.level} {character.race} {character.class}
          </Text>
          <Text style={styles.campaignName}>{getCampaignName()}</Text>
        </View>

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
          </View>
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
                    <Text style={styles.spellSchool}>Casting Time: {spell.casting_time} {spell.concentration && ' (c)'}</Text>
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
            {(() => {
              // Get equipment from character_data.purchasedEquipment or character.equipment
              const purchasedEquipment = character.character_data?.purchasedEquipment || [];
              
              if (purchasedEquipment.length === 0) {
                return (
                  <Text style={styles.equipmentItem}>• No equipment</Text>
                );
              }

              // Group equipment by ID and count quantities
              const groupedEquipment = purchasedEquipment.reduce((acc: any[], item: any) => {
                const existingGroup = acc.find(group => group.item.id === item.id);
                if (existingGroup) {
                  existingGroup.quantity += 1;
                } else {
                  acc.push({ item, quantity: 1 });
                }
                return acc;
              }, []);

              return groupedEquipment.map((group, index) => {
                const baseQuantity = group.item.quantity || 1;
                const totalQuantity = group.quantity * baseQuantity;
                const displayName = totalQuantity > 1 
                  ? `${group.item.name} ×${totalQuantity}`
                  : group.item.name;
                
                return (
                  <Text key={index} style={styles.equipmentItem}>
                    • {displayName}
                  </Text>
                );
              });
            })()}
            
            {/* Currency */}
            {(character.gold > 0 || character.silver > 0 || character.copper > 0) && (
              <Text style={styles.equipmentItem}>
                • Currency: {character.gold > 0 && `${character.gold} gp`}{character.silver > 0 && ` ${character.silver} sp`}{character.copper > 0 && ` ${character.copper} cp`}
              </Text>
            )}
          </View>
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
                                  <Text style={styles.spellProperty}>School: {spell.school || ''}</Text>
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
});