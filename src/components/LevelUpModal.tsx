import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
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
import { X, ArrowRight, ArrowLeft, Star, Sparkles, Shield, Heart, Zap, Scroll, ArrowUp, ArrowDown } from 'lucide-react-native';
import { supabase } from '../config/supabase';
import { useCustomAlert } from './CustomAlert';

const winHeight = Dimensions.get('window').height;

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
  const [selectedNewSpells, setSelectedNewSpells] = useState<any[]>([]);
  const [hitPointsGained, setHitPointsGained] = useState(0);
  const [expandedSpells, setExpandedSpells] = useState<Set<string>>(new Set());
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number>(0);

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

      // Fetch class features for ALL levels gained (not just the new level)
      const levelsToFetch = [];
      for (let level = currentCharacter.previousLevel + 1; level <= currentCharacter.newLevel; level++) {
        levelsToFetch.push(level);
      }
      
      const featurePromises = levelsToFetch.map(level => 
        supabase
          .from('features')
          .select('*')
          .eq('class_index', character.class.toLowerCase())
          .eq('level', level)
      );
      
      const featureResults = await Promise.all(featurePromises);
      const allFeatures = featureResults.flatMap(result => result.data || []);
      
      setNewFeatures(allFeatures);

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

  useEffect(() => {
    if (currentCharacter && isVisible) {
      loadCharacterData();
    }
  }, [currentCharacter, isVisible]);

  // Initialize selected spells with existing character spells when character data loads
  useEffect(() => {
    if (fullCharacter && fullCharacter.spells) {
      setSelectedNewSpells([...fullCharacter.spells]);
    }
  }, [fullCharacter]);

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
    
    // Calculate hit points for ALL levels gained (not just one level)
    const levelsGained = currentCharacter!.newLevel - currentCharacter!.previousLevel;
    const totalGained = levelsGained * (hitDie + conModifier);
    
    setHitPointsGained(totalGained);
  };

  const isSpellcaster = (className: string): boolean => {
    const spellcasters = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
    return spellcasters.includes(className);
  };

  // Helper function to get spell levels available to a class at a given level
  const getAvailableSpellLevels = (className: string, characterLevel: number): number[] => {
    const levels: number[] = [];
    
    if (isSpellcaster(className)) {
      const isHalfCaster = ['paladin', 'ranger'].includes(className.toLowerCase());
      
      if (isHalfCaster) {
        // Half casters start spells at level 2, no cantrips in most cases
        if (characterLevel >= 2) {
          levels.push(1); // Always have level 1 spells
          if (characterLevel >= 5) levels.push(2);
          if (characterLevel >= 9) levels.push(3);
          if (characterLevel >= 13) levels.push(4);
          if (characterLevel >= 17) levels.push(5);
        }
      } else {
        // Full casters - be more conservative with spell levels
        levels.push(0); // Cantrips
        levels.push(1); // Always have level 1 spells
        
        // Add higher spell levels based on D&D progression
        if (characterLevel >= 3) levels.push(2);
        if (characterLevel >= 5) levels.push(3);
        if (characterLevel >= 7) levels.push(4);
        if (characterLevel >= 9) levels.push(5);
        if (characterLevel >= 11) levels.push(6);
        if (characterLevel >= 13) levels.push(7);
        if (characterLevel >= 15) levels.push(8);
        if (characterLevel >= 17) levels.push(9);
      }
    }
    
    return levels;
  };

  // Helper function to get spells known for a class at a given level
  const getSpellsKnownForLevel = (className: string, characterLevel: number, spellLevel: number): number => {
    // More accurate D&D spell progression - this should represent TOTAL spells known at this level
    if (spellLevel === 0) {
      // Cantrips progression - total cantrips known at this level
      switch (className.toLowerCase()) {
        case 'bard':
        case 'sorcerer':
        case 'warlock':
          if (characterLevel >= 10) return 4;
          if (characterLevel >= 4) return 3;
          return 2;
        case 'cleric':
        case 'druid':
        case 'wizard':
          if (characterLevel >= 10) return 4;
          if (characterLevel >= 4) return 3;
          return 3; // Start with 3
        default:
          return 2;
      }
    }
    
    // Leveled spells - total spells known at this level (not just gained)
    switch (className.toLowerCase()) {
      case 'bard':
        if (spellLevel === 1) {
          if (characterLevel >= 5) return 8;
          if (characterLevel >= 4) return 7;
          if (characterLevel >= 3) return 6;
          if (characterLevel >= 2) return 5;
          return 4;
        }
        if (spellLevel === 2) {
          if (characterLevel >= 6) return 3;
          if (characterLevel >= 4) return 2;
          if (characterLevel >= 3) return 2;
          return 0;
        }
        if (spellLevel === 3) {
          if (characterLevel >= 8) return 2;
          if (characterLevel >= 6) return 1;
          return 0;
        }
        return characterLevel >= (spellLevel * 2 + 1) ? 1 : 0; // Simplified for higher levels
      case 'sorcerer':
        // Sorcerers know fewer spells
        if (spellLevel === 1) {
          if (characterLevel >= 4) return 4;
          if (characterLevel >= 3) return 4;
          return 2;
        }
        return characterLevel >= (spellLevel * 2 + 1) ? 1 : 0; // Simplified
      default:
        // Default progression for other classes
        if (spellLevel === 1) {
          if (characterLevel >= 3) return 6;
          return 4;
        }
        return 2; // Default for other spell levels
    }
  };

  const fetchAvailableSpells = async (character: Character) => {
    try {
      const availableLevels = getAvailableSpellLevels(character.class, currentCharacter!.newLevel);
      
      // Get all spells for available levels
      const allSpellsPromises = availableLevels.map(level => 
        supabase
          .from('spells')
          .select('*')
          .eq('level', level)
          .contains('classes', [character.class])
      );

      const spellResults = await Promise.all(allSpellsPromises);
      const allAvailableSpells = spellResults.flatMap(result => result.data || []);
      
      // Filter out spells the character already knows
      const existingSpellIds = (character.spells || []).map(spell => spell.index);
      const newAvailableSpells = allAvailableSpells.filter(spell => !existingSpellIds.includes(spell.index));
      
      console.log('Fetched new spells structure:', newAvailableSpells[0]); // Check structure of first new spell
      console.log('Existing spells IDs:', existingSpellIds);
      console.log('New available spells count:', newAvailableSpells.length);
      
      setNewSpells(newAvailableSpells);
      
      // Set initial spell level to first available non-cantrip level, or cantrips if that's all available
      const initialLevel = availableLevels.find(level => level > 0) || availableLevels[0] || 0;
      setSelectedSpellLevel(initialLevel);
    } catch (error) {
      console.error('Error fetching available spells:', error);
    }
  };

  const handleSpellSelect = (spell: any) => {
    setSelectedNewSpells(prev => {
      // If already selected, remove it
      if (prev.some(s => s.index === spell.index)) {
        return prev.filter(s => s.index !== spell.index);
      }
      
      // Check if we can add more spells of this level
      const currentLevelSpells = prev.filter(s => s.level === spell.level);
      const maxSpells = getSpellsKnownForLevel(fullCharacter?.class || '', currentCharacter?.newLevel || 1, spell.level);
      
      if (currentLevelSpells.length >= maxSpells) {
        return prev; // Can't add more spells of this level
      }
      
      return [...prev, spell];
    });
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

  const handleComplete = async () => {
    if (!currentCharacter || !fullCharacter) return;
    
    setIsLoading(true);
    try {
      // Calculate new max hit points
      const newMaxHp = (fullCharacter.max_hitpoints || 0) + hitPointsGained;
      
      // Get only the newly selected spells (not existing ones)
      const existingSpellIds = (fullCharacter.spells || []).map(spell => spell.index);
      const actualNewSpells = selectedNewSpells.filter(spell => !existingSpellIds.includes(spell.index));
      
      // Update character with new data
      const updates = {
        max_hitpoints: newMaxHp,
        current_hitpoints: newMaxHp, // Also heal to full on level up
        previous_level: currentCharacter.newLevel, // Set previous_level to current level
        spells: selectedNewSpells // Use the complete selected spell list (existing + new)
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

  const renderSummaryStep = () => (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.stepContent}>
      <Text style={styles.sectionTitle}>
        Level Up Summary
      </Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeader}>
          {currentCharacter!.name} is now level {currentCharacter!.newLevel}!
          {currentCharacter!.newLevel - currentCharacter!.previousLevel > 1 && (
            <Text style={styles.multiLevelText}>
              {'\n'}(Gained {currentCharacter!.newLevel - currentCharacter!.previousLevel} levels!)
            </Text>
          )}
        </Text>
        
        <View style={styles.summaryItem}>
          <Heart size={20} color="#E91E63" />
          <Text style={styles.summaryText}>
            Hit Points: {fullCharacter!.max_hitpoints} → {(fullCharacter!.max_hitpoints || 0) + hitPointsGained}
            {currentCharacter!.newLevel - currentCharacter!.previousLevel > 1 && (
              <Text style={styles.multiLevelGain}> (+{hitPointsGained} total)</Text>
            )}
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
        
        {/* Show spell slots gained if character is a spellcaster */}
        {isSpellcaster(fullCharacter!.class) && (() => {
          const slotsGained = getSpellSlotsGained(
            fullCharacter!.class, 
            currentCharacter!.newLevel, 
            currentCharacter!.previousLevel
          );
          
          if (Object.keys(slotsGained).length > 0) {
            const slotText = Object.entries(slotsGained)
              .map(([level, count]) => `+${count} Level ${level}`)
              .join(', ');
            
            return (
              <View style={styles.summaryItem}>
                <Zap size={20} color="#9C27B0" />
                <Text style={styles.summaryText}>
                  Spell Slots: {slotText}
                </Text>
              </View>
            );
          }
          return null;
        })()}
        
        {(() => {
          const existingSpellIds = (fullCharacter?.spells || []).map(spell => spell.index);
          const actualNewSpells = selectedNewSpells.filter(spell => !existingSpellIds.includes(spell.index));
          
          if (actualNewSpells.length > 0) {
            return (
              <View style={styles.summaryItem}>
                <Scroll size={20} color="#9C27B0" />
                <Text style={styles.summaryText}>
                  New Spells: {actualNewSpells.map(spell => 
                    `${spell.name}${spell.level === 0 ? '(c)' : `(${spell.level})`}`
                  ).join(', ')}
                </Text>
              </View>
            );
          }
          return null;
        })()}
      </View>
      
      <Text style={styles.confirmText}>
        Click &quot;Complete&quot; to finalize your level up and apply these changes to your character.
      </Text>
    </ScrollView>
  );

  const renderStepContent = () => {
    if (!currentCharacter || !fullCharacter) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading character data...</Text>
        </View>
      );
    }

    const proficiencyIncrease = 
    currentCharacter!.newLevel === 5 || 
    currentCharacter!.newLevel === 9 || 
    currentCharacter!.newLevel === 13 || 
    currentCharacter!.newLevel === 17;

    switch (currentStep) {
      case 0: // Welcome/Overview
        return (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.stepContent}>
            <View style={styles.levelUpHeader}>
              <Sparkles size={24} color="#FFD700" />
              <Text style={styles.levelUpTitle}>Level Up!</Text>
            </View>
            
            <Text style={styles.characterName}>{currentCharacter.name}</Text>
            <Text style={styles.levelInfo}>
              Level {currentCharacter.previousLevel} → {currentCharacter.newLevel}
            </Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>What&apos;s New at Level {currentCharacter.newLevel}</Text>
            
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
              {proficiencyIncrease && (
                <View style={styles.benefitItem}>
                  <Shield size={20} color="#2196F3" />
                  <Text style={styles.benefitText}>
                    Improved Proficiency Bonus
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        );
        
      case 1: // Class Features
        return (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.stepContent}>
            <Text style={styles.sectionTitle}>
              New Class Features
            </Text>
            
            {newFeatures.length === 0 ? (
              <Text style={styles.noFeaturesText}>
                No new class features at level {currentCharacter.newLevel} for {currentCharacter.class}.
              </Text>
            ) : (
              <View style={styles.featuresList}>
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
              </View>
            )}
          </ScrollView>
        );
        
      case 2: // Spell Selection (if applicable)
        if (!isSpellcaster(currentCharacter.class)) {
          // Skip this step and go directly to summary for non-spellcasters
          return renderSummaryStep();
        }

        if (!fullCharacter) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading spell data...</Text>
            </View>
          );
        }

        const availableSpellLevels = getAvailableSpellLevels(fullCharacter.class, currentCharacter.newLevel);
        console.log('Available spell levels for', fullCharacter.class, 'at level', currentCharacter.newLevel, ':', availableSpellLevels);
        console.log('New spells available:', newSpells.map(s => `${s.name} (level ${s.level})`));
        console.log('Selected spell level:', selectedSpellLevel);
        console.log('Available spell levels includes level 2?', availableSpellLevels.includes(2));
        
        // Initialize selectedSpellLevel to first available level if not set
        if (availableSpellLevels.length > 0 && !availableSpellLevels.includes(selectedSpellLevel)) {
          setSelectedSpellLevel(availableSpellLevels[0]);
        }

        if (availableSpellLevels.length === 0) {
          return (
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.stepContent}>
              <Text style={styles.sectionTitle}>Select New Spells</Text>
              <Text style={styles.subtitle}>No new spells available at level {currentCharacter.newLevel}.</Text>
              <View style={styles.noSpellsContainer}>
                <Text style={styles.noSpellsText}>
                  {currentCharacter.class}s don&apos;t gain new spells at level {currentCharacter.newLevel}.
                </Text>
              </View>
            </ScrollView>
          );
        }

        // Filter spells by current level and class - include both new spells AND existing spells for this level
        const newSpellsForCurrentLevel = newSpells.filter(spell => spell.level === selectedSpellLevel);
        const existingSpellsForCurrentLevel = (fullCharacter.spells || []).filter(spell => spell.level === selectedSpellLevel);
        
        // Combine existing and new spells for display
        const allSpellsForCurrentLevel = [...existingSpellsForCurrentLevel, ...newSpellsForCurrentLevel];
        
        const selectedSpellsForLevel = selectedNewSpells.filter(spell => spell.level === selectedSpellLevel);
        const maxSpellsForLevel = getSpellsKnownForLevel(fullCharacter.class, currentCharacter.newLevel, selectedSpellLevel);
        const remainingSpells = maxSpellsForLevel - selectedSpellsForLevel.length;

        return (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.stepContent, styles.scrollContent]}>
            <Text style={styles.sectionTitle}>Select New Spells</Text>
            <Text style={styles.subtitle}>Choose spells to learn at level {currentCharacter.newLevel}</Text>

            {/* Spell Level Tabs */}
            {availableSpellLevels.length > 1 && (
              <View style={styles.spellTabs}>
                {availableSpellLevels.map((level) => {
                  const levelName = level === 0 ? 'Cantrips' : `Level ${level}`;
                  const selectedForThisLevel = selectedNewSpells.filter(s => s.level === level);
                  const maxForThisLevel = getSpellsKnownForLevel(fullCharacter.class, currentCharacter.newLevel, level);
                  
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.spellTab,
                        selectedSpellLevel === level && styles.spellTabActive,
                      ]}
                      onPress={() => setSelectedSpellLevel(level)}
                    >
                      <Text style={[
                        styles.spellTabText,
                        selectedSpellLevel === level && styles.spellTabTextActive,
                      ]}>
                        {levelName} ({selectedForThisLevel.length}/{maxForThisLevel})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Single spell type display for classes that only get one type at this level */}
            {availableSpellLevels.length === 1 && (
              <View style={styles.singleSpellTypeHeader}>
                <Text style={styles.spellSectionTitle}>
                  {selectedSpellLevel === 0 ? 'Cantrips' : `Level ${selectedSpellLevel} Spells`}
                  {` (${selectedSpellsForLevel.length}/${maxSpellsForLevel})`}
                </Text>
              </View>
            )}

            {/* Spell List */}
            <View style={styles.spellSection}>
              {remainingSpells !== null && (
                <Text style={styles.spellSectionTitle}>
                  {selectedSpellLevel === 0 ? 'Cantrips' : `Level ${selectedSpellLevel} Spells`}
                  {` (${remainingSpells} remaining)`}
                </Text>
              )}
              
              {allSpellsForCurrentLevel.length === 0 ? (
                <Text style={styles.noSpellsText}>
                  No {selectedSpellLevel === 0 ? 'cantrips' : `level ${selectedSpellLevel} spells`} available.
                </Text>
              ) : (
                allSpellsForCurrentLevel.map((spell) => (
                  <TouchableOpacity
                    key={spell.index}
                    style={[
                      styles.spellCard,
                      selectedNewSpells.some(s => s.index === spell.index) && styles.selectedSpellCard,
                    ]}
                    onPress={() => handleSpellSelect(spell)}
                    disabled={!selectedNewSpells.some(s => s.index === spell.index) && remainingSpells <= 0}
                  >
                    <View style={styles.spellHeader}>
                      <View style={styles.spellHeaderLeft}>
                        <Text style={[
                          styles.spellName,
                          selectedNewSpells.some(s => s.index === spell.index) && { color: '#4CAF50' }
                        ]}>
                          {spell.name}
                          {selectedNewSpells.some(s => s.index === spell.index) && ' ✓'}
                        </Text>
                        <Text style={styles.spellSchool}>
                          Casting Time: {spell.casting_time} {spell.concentration && ' (c)'}
                          {(fullCharacter.spells || []).some(s => s.index === spell.index) && ' (Current)'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.chevronButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleSpellExpanded(spell.index);
                        }}
                      >
                        {expandedSpells.has(spell.index) ? (
                          <ArrowUp size={20} color="#666666" />
                        ) : (
                          <ArrowDown size={20} color="#666666" />
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
                        {spell.description && spell.description.map((desc: string, i: number) => (
                          <Text key={i} style={styles.spellDescription}>{desc}</Text>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        );
        
      case 3: // Summary & Confirmation
        return renderSummaryStep();
        
      default:
        return null;
    }
  };

  const isLastStep = () => {
    // Step 3 is always the summary/last step for both spellcasters and non-spellcasters
    // Non-spellcasters will see the summary at step 2, but we handle that in the render logic
    if (!fullCharacter) return false;
    
    if (isSpellcaster(fullCharacter.class)) {
      return currentStep === 3; // Welcome(0), Features(1), Spells(2), Summary(3)
    } else {
      return currentStep === 2; // Welcome(0), Features(1), Summary(2) - but shown as step 2
    }
  };

  // Helper function to get spell slots for a class at a given level
  const getSpellSlotsForLevel = (className: string, characterLevel: number): Record<number, number> => {
    const slots: Record<number, number> = {};
    
    switch (className.toLowerCase()) {
      case 'bard':
      case 'cleric':
      case 'druid':
      case 'sorcerer':
      case 'wizard':
        // Full casters
        if (characterLevel >= 1) slots[1] = characterLevel === 1 ? 2 : characterLevel === 2 ? 3 : 4;
        if (characterLevel >= 3) slots[2] = characterLevel === 3 ? 2 : 3;
        if (characterLevel >= 5) slots[3] = characterLevel === 5 ? 2 : 3;
        if (characterLevel >= 7) slots[4] = characterLevel === 7 ? 1 : characterLevel === 8 ? 2 : 3;
        if (characterLevel >= 9) slots[5] = characterLevel === 9 ? 1 : characterLevel === 10 ? 2 : characterLevel >= 18 ? 3 : 2;
        if (characterLevel >= 11) slots[6] = characterLevel === 11 ? 1 : characterLevel >= 19 ? 2 : 1;
        if (characterLevel >= 13) slots[7] = characterLevel === 13 ? 1 : characterLevel >= 20 ? 2 : 1;
        if (characterLevel >= 15) slots[8] = 1;
        if (characterLevel >= 17) slots[9] = 1;
        break;
      case 'warlock':
        // Warlock has unique progression
        const warlockSlots = characterLevel >= 17 ? 4 : characterLevel >= 11 ? 3 : characterLevel >= 2 ? 2 : 1;
        const warlockLevel = characterLevel >= 17 ? 5 : characterLevel >= 11 ? 5 : characterLevel >= 9 ? 5 : characterLevel >= 7 ? 4 : characterLevel >= 5 ? 3 : characterLevel >= 3 ? 2 : 1;
        slots[warlockLevel] = warlockSlots;
        break;
      case 'paladin':
      case 'ranger':
        // Half casters
        if (characterLevel >= 2) slots[1] = characterLevel === 2 ? 2 : characterLevel >= 5 ? 4 : 3;
        if (characterLevel >= 5) slots[2] = characterLevel === 5 ? 2 : 3;
        if (characterLevel >= 9) slots[3] = characterLevel === 9 ? 2 : 3;
        if (characterLevel >= 13) slots[4] = characterLevel === 13 ? 1 : characterLevel >= 17 ? 2 : 1;
        if (characterLevel >= 17) slots[5] = 1;
        break;
    }
    
    return slots;
  };

  // Helper function to get spell slots gained at this level
  const getSpellSlotsGained = (className: string, newLevel: number, previousLevel: number): Record<number, number> => {
    const newSlots = getSpellSlotsForLevel(className, newLevel);
    const oldSlots = getSpellSlotsForLevel(className, previousLevel);
    const gained: Record<number, number> = {};
    
    // Calculate the difference
    for (const level in newSlots) {
      const spellLevel = parseInt(level);
      const oldCount = oldSlots[spellLevel] || 0;
      const newCount = newSlots[spellLevel] || 0;
      if (newCount > oldCount) {
        gained[spellLevel] = newCount - oldCount;
      }
    }
    
    return gained;
  };

  if (!currentCharacter) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={dismissModal} style={styles.closeButton}>
            <X size={24} color="#666666" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.sheetTitle}>Level Up</Text>
          </View>
          
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              Step {currentStep + 1} of {isSpellcaster(fullCharacter?.class || '') ? 4 : 3}
            </Text>
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            renderStepContent()
          )}
        </View>
        
        <View style={styles.sheetFooter}>
          <View style={styles.footerButtons}>
            <View style={styles.leftButton}>
              {currentStep > 0 && (
                <TouchableOpacity onPress={prevStep} style={styles.backButton}>
                  <ArrowLeft size={20} color="#666666" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.rightButton}>
              <TouchableOpacity
                onPress={isLastStep() ? handleComplete : nextStep}
                style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 50, // For status bar
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  stepIndicator: {
    width: 80,
    alignItems: 'flex-end',
  },
  stepText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  contentContainer: {
    flex: 1,
  },
  sheetFooter: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftButton: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightButton: {
    flex: 1,
    alignItems: 'flex-end',
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  levelUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 10,
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
    marginTop: 10,
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
    gap: 12,
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
    gap: 12,
  },
  spellCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSpellCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  spellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spellName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
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
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  spellDescription: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    lineHeight: 20,
  },
  spellHeaderLeft: {
    flex: 1,
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
  subtitle: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  noSpellsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },

  spellTabs: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  spellTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  spellTabActive: {
    backgroundColor: '#4CAF50',
  },
  spellTabText: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  spellTabTextActive: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  singleSpellTypeHeader: {
    marginBottom: 20,
  },
  spellSectionTitle: {
    fontSize: 18,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  spellSection: {
  },
  selectedSpell: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  scrollContent: {
    paddingBottom: 60,
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
  nextButtonDisabled: {
    opacity: 0.5,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  multiLevelText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  multiLevelGain: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
  },
});