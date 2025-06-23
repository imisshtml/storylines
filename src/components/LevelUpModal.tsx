import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAtom } from 'jotai';
import { 
  currentLevelUpCharacterAtom, 
  isLevelUpModalVisibleAtom,
  dismissLevelUpModalAtom,
  completeLevelUpProcessAtom,
  levelUpStepAtom,
  nextLevelUpStepAtom,
  prevLevelUpStepAtom
} from '../atoms/levelUpAtoms';
import { Character, fetchCharactersAtom } from '../atoms/characterAtoms';
import { X, ArrowRight, ArrowLeft, Star, Sparkles, Shield, Heart, Zap, Scroll } from 'lucide-react-native';
import { supabase } from '../config/supabase';
import { useCustomAlert } from './CustomAlert';

export default function LevelUpModal() {
  const [currentCharacter] = useAtom(currentLevelUpCharacterAtom);
  const [isVisible] = useAtom(isLevelUpModalVisibleAtom);
  const [, dismissModal] = useAtom(dismissLevelUpModalAtom);
  const [, completeLevelUp] = useAtom(completeLevelUpProcessAtom);
  const [currentStep] = useAtom(levelUpStepAtom);
  const [, nextStep] = useAtom(nextLevelUpStepAtom);
  const [, prevStep] = useAtom(prevLevelUpStepAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const { showAlert } = useCustomAlert();

  const [fullCharacter, setFullCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newFeatures, setNewFeatures] = useState<any[]>([]);
  const [newSpells, setNewSpells] = useState<any[]>([]);
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);
  const [hitPointsGained, setHitPointsGained] = useState(0);

  useEffect(() => {
    if (currentCharacter && isVisible) {
      loadCharacterData();
    }
  }, [currentCharacter, isVisible]);

  const loadCharacterData = async () => {
    if (!currentCharacter) return;
    
    setIsLoading(true);
    try {
      // Fetch full character data
      const { data: character, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', currentCharacter.id)
        .single();

      if (error) throw error;
      setFullCharacter(character);

      // Fetch class features for the new level
      const { data: features, error: featuresError } = await supabase
        .from('features')
        .select('*')
        .eq('class_index', character.class.toLowerCase())
        .eq('level', currentCharacter.newLevel);

      if (featuresError) throw featuresError;
      setNewFeatures(features || []);

      // Calculate hit points gained based on class hit die
      calculateHitPointsGained(character);

      // If character is a spellcaster, fetch available spells
      if (isSpellcaster(character.class)) {
        await fetchAvailableSpells(character);
      }
    } catch (error) {
      console.error('Error loading character data for level up:', error);
      showAlert(
        'Error Loading Data',
        'Failed to load character data for level up. Please try again.',
        [{ text: 'OK' }],
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHitPointsGained = (character: Character) => {
    // Get hit die based on class
    const hitDieMap: Record<string, number> = {
      'Barbarian': 12,
      'Fighter': 10,
      'Paladin': 10,
      'Ranger': 10,
      'Monk': 8,
      'Rogue': 8,
      'Bard': 8,
      'Cleric': 8,
      'Druid': 8,
      'Warlock': 8,
      'Wizard': 6,
      'Sorcerer': 6
    };

    const hitDie = hitDieMap[character.class] || 8;
    
    // Calculate Constitution modifier
    const conModifier = Math.floor((character.abilities.constitution - 10) / 2);
    
    // For level up, we'll give max hit points (hit die + con modifier)
    const gained = hitDie + conModifier;
    setHitPointsGained(gained);
  };

  const isSpellcaster = (className: string): boolean => {
    const spellcasters = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
    return spellcasters.includes(className);
  };

  const fetchAvailableSpells = async (character: Character) => {
    try {
      // Get spells available at the new level for this class
      const { data: spells, error } = await supabase
        .from('spells')
        .select('*')
        .eq('level', Math.min(currentCharacter!.newLevel, 9))
        .contains('classes', [character.class]);

      if (error) throw error;
      
      // Filter out spells the character already knows
      const existingSpellIds = (character.spells || []).map(spell => spell.index);
      const newAvailableSpells = (spells || []).filter(spell => !existingSpellIds.includes(spell.index));
      
      setNewSpells(newAvailableSpells);
    } catch (error) {
      console.error('Error fetching available spells:', error);
    }
  };

  const handleSpellSelect = (spellIndex: string) => {
    setSelectedSpells(prev => {
      // If already selected, remove it
      if (prev.includes(spellIndex)) {
        return prev.filter(index => index !== spellIndex);
      }
      
      // Otherwise add it, but check if we've reached the limit
      // The limit depends on the class and level, but for simplicity we'll use 2
      if (prev.length >= 2) {
        return [...prev.slice(1), spellIndex]; // Remove oldest, add new
      }
      
      return [...prev, spellIndex];
    });
  };

  const handleComplete = async () => {
    if (!currentCharacter || !fullCharacter) return;
    
    setIsLoading(true);
    try {
      // Calculate new max hit points
      const newMaxHp = (fullCharacter.max_hitpoints || 0) + hitPointsGained;
      
      // Get the selected spells as full objects
      const selectedSpellObjects = newSpells.filter(spell => 
        selectedSpells.includes(spell.index)
      );
      
      // Update character with new data
      const updates = {
        max_hitpoints: newMaxHp,
        current_hitpoints: newMaxHp, // Also heal to full on level up
        previous_level: currentCharacter.newLevel, // Set previous_level to current level
        spells: [...(fullCharacter.spells || []), ...selectedSpellObjects]
      };
      
      const { error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', currentCharacter.id);

      if (error) throw error;
      
      // Complete the level up process
      await completeLevelUp(currentCharacter.id);
      
      // Refresh characters list
      await fetchCharacters();
      
      showAlert(
        'Level Up Complete!',
        `${currentCharacter.name} is now level ${currentCharacter.newLevel}!`,
        [{ text: 'Awesome!' }],
        'success'
      );
    } catch (error) {
      console.error('Error completing level up:', error);
      showAlert(
        'Error',
        'Failed to complete level up. Please try again.',
        [{ text: 'OK' }],
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    if (!currentCharacter || !fullCharacter) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading character data...</Text>
        </View>
      );
    }

    switch (currentStep) {
      case 0: // Welcome/Overview
        return (
          <View style={styles.stepContent}>
            <View style={styles.levelUpHeader}>
              <Sparkles size={24} color="#FFD700" />
              <Text style={styles.levelUpTitle}>Level Up!</Text>
            </View>
            
            <Text style={styles.characterName}>{currentCharacter.name}</Text>
            <Text style={styles.levelInfo}>
              Level {currentCharacter.previousLevel} → {currentCharacter.newLevel}
            </Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>What's New at Level {currentCharacter.newLevel}</Text>
            
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Heart size={20} color="#E91E63" />
                <Text style={styles.benefitText}>
                  +{hitPointsGained} Hit Points
                </Text>
              </View>
              
              {newFeatures.length > 0 && (
                <View style={styles.benefitItem}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.benefitText}>
                    {newFeatures.length} New Class Feature{newFeatures.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              
              {isSpellcaster(currentCharacter.class) && (
                <View style={styles.benefitItem}>
                  <Zap size={20} color="#9C27B0" />
                  <Text style={styles.benefitText}>
                    New Spell Slots & Spells
                  </Text>
                </View>
              )}
              
              <View style={styles.benefitItem}>
                <Shield size={20} color="#2196F3" />
                <Text style={styles.benefitText}>
                  Improved Proficiency Bonus
                </Text>
              </View>
            </View>
          </View>
        );
        
      case 1: // Class Features
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>
              New Class Features
            </Text>
            
            {newFeatures.length === 0 ? (
              <Text style={styles.noFeaturesText}>
                No new class features at level {currentCharacter.newLevel} for {currentCharacter.class}.
              </Text>
            ) : (
              <ScrollView style={styles.featuresList}>
                {newFeatures.map((feature, index) => (
                  <View key={feature.index} style={styles.featureCard}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    <Text style={styles.featureDescription}>
                      {Array.isArray(feature.description) 
                        ? feature.description.join('\n\n')
                        : feature.description}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        );
        
      case 2: // Spell Selection (if applicable)
        if (!isSpellcaster(currentCharacter.class)) {
          // Skip this step for non-spellcasters
          nextStep();
          return null;
        }
        
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>
              Select New Spells
            </Text>
            
            <Text style={styles.spellsIntro}>
              As a level {currentCharacter.newLevel} {currentCharacter.class}, 
              you can learn new spells. Select up to 2 spells to add to your spellbook.
            </Text>
            
            <Text style={styles.selectionCounter}>
              Selected: {selectedSpells.length}/2
            </Text>
            
            {newSpells.length === 0 ? (
              <Text style={styles.noSpellsText}>
                No new spells available at this level.
              </Text>
            ) : (
              <ScrollView style={styles.spellsList}>
                {newSpells.map(spell => (
                  <TouchableOpacity
                    key={spell.index}
                    style={[
                      styles.spellCard,
                      selectedSpells.includes(spell.index) && styles.selectedSpellCard
                    ]}
                    onPress={() => handleSpellSelect(spell.index)}
                  >
                    <View style={styles.spellHeader}>
                      <Text style={styles.spellName}>{spell.name}</Text>
                      <View style={styles.spellLevel}>
                        <Text style={styles.spellLevelText}>
                          Level {spell.level}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.spellSchool}>
                      {spell.school} • {spell.casting_time}
                    </Text>
                    
                    <Text style={styles.spellDescription}>
                      {Array.isArray(spell.description) 
                        ? spell.description.join('\n\n')
                        : spell.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        );
        
      case 3: // Summary & Confirmation
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>
              Level Up Summary
            </Text>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryHeader}>
                {currentCharacter.name} is now level {currentCharacter.newLevel}!
              </Text>
              
              <View style={styles.summaryItem}>
                <Heart size={20} color="#E91E63" />
                <Text style={styles.summaryText}>
                  Hit Points: {fullCharacter.max_hitpoints} → {(fullCharacter.max_hitpoints || 0) + hitPointsGained}
                </Text>
              </View>
              
              {newFeatures.length > 0 && (
                <View style={styles.summaryItem}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.summaryText}>
                    New Features: {newFeatures.map(f => f.name).join(', ')}
                  </Text>
                </View>
              )}
              
              {selectedSpells.length > 0 && (
                <View style={styles.summaryItem}>
                  <Scroll size={20} color="#9C27B0" />
                  <Text style={styles.summaryText}>
                    New Spells: {selectedSpells.length} selected
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.confirmText}>
              Click "Complete" to finalize your level up and apply these changes to your character.
            </Text>
          </View>
        );
        
      default:
        return null;
    }
  };

  const getStepCount = () => {
    // Non-spellcasters skip the spell selection step
    if (fullCharacter && !isSpellcaster(fullCharacter.class)) {
      return 3; // Welcome, Features, Summary
    }
    return 4; // Welcome, Features, Spells, Summary
  };

  const isLastStep = () => currentStep === getStepCount() - 1;

  if (!isVisible || !currentCharacter) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={dismissModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={dismissModal} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              Level Up
            </Text>
            
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>
                {currentStep + 1}/{getStepCount()}
              </Text>
            </View>
          </View>
          
          <View style={styles.modalBody}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              renderStepContent()
            )}
          </View>
          
          <View style={styles.modalFooter}>
            {currentStep > 0 && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={prevStep}
                disabled={isLoading}
              >
                <ArrowLeft size={20} color="#fff" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.nextButton,
                isLastStep() && styles.completeButton,
                isLoading && styles.disabledButton
              ]}
              onPress={isLastStep() ? handleComplete : nextStep}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {isLastStep() ? 'Complete' : 'Next'}
                  </Text>
                  {!isLastStep() && <ArrowRight size={20} color="#fff" />}
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  stepIndicator: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  completeButton: {
    backgroundColor: '#FF9800',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    marginTop: 16,
  },
  stepContent: {
    minHeight: 300,
  },
  levelUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  levelUpTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
  },
  characterName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  levelInfo: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  featuresList: {
    maxHeight: 300,
  },
  featureCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  featureName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    lineHeight: 20,
  },
  noFeaturesText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  spellsIntro: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    marginBottom: 16,
  },
  selectionCounter: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  spellsList: {
    maxHeight: 300,
  },
  spellCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedSpellCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  spellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spellName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#9C27B0',
    flex: 1,
  },
  spellLevel: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  spellLevelText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ccc',
  },
  spellSchool: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginBottom: 8,
  },
  spellDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    lineHeight: 20,
  },
  noSpellsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  summaryCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryHeader: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    flex: 1,
  },
  confirmText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
});