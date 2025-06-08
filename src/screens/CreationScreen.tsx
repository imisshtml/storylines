import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAtom } from 'jotai';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Dice6,
  User,
  Shield,
  Book,
  Zap,
  Sword,
  Package,
} from 'lucide-react-native';
import {
  characterCreationStepAtom,
  characterNameAtom,
  selectedRaceAtom,
  selectedClassAtom,
  selectedBackgroundAtom,
  characterAbilitiesAtom,
  selectedSkillsAtom,
  selectedSpellsAtom,
  characterEquipmentAtom,
  racesAtom,
  classesAtom,
  backgroundsAtom,
  spellsAtom,
  fetchRacesAtom,
  fetchClassesAtom,
  fetchBackgroundsAtom,
  fetchSpellsAtom,
  saveCharacterAtom,
  resetCharacterCreationAtom,
  type Race,
  type Class,
  type Background,
  type DnDSpell,
  type DnDAbilities,
} from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';

// Feature flags
const ENABLE_BACKGROUNDS = false; // Set to true to enable backgrounds step

const CREATION_STEPS = [
  { title: 'Name & Race', icon: User },
  { title: 'Class', icon: Shield },
  //...(ENABLE_BACKGROUNDS ? [{ title: 'Background', icon: Book }] : []),
  { title: 'Abilities', icon: Dice6 },
  { title: 'Skills', icon: Zap },
  { title: 'Spells', icon: Sword },
  { title: 'Equipment', icon: Package },
  { title: 'Review', icon: Save },
];

export default function CreationScreen() {
  const [user] = useAtom(userAtom);
  const [currentStep, setCurrentStep] = useAtom(characterCreationStepAtom);
  const [characterName, setCharacterName] = useAtom(characterNameAtom);
  const [selectedRace, setSelectedRace] = useAtom(selectedRaceAtom);
  const [selectedClass, setSelectedClass] = useAtom(selectedClassAtom);
  const [selectedBackground, setSelectedBackground] = useAtom(selectedBackgroundAtom);
  const [abilities, setAbilities] = useAtom(characterAbilitiesAtom);
  const [selectedSkills, setSelectedSkills] = useAtom(selectedSkillsAtom);
  const [selectedSpells, setSelectedSpells] = useAtom(selectedSpellsAtom);
  const [equipment, setEquipment] = useAtom(characterEquipmentAtom);

  const [races] = useAtom(racesAtom);
  const [classes] = useAtom(classesAtom);
  const [backgrounds] = useAtom(backgroundsAtom);
  const [spells] = useAtom(spellsAtom);

  const [, fetchRaces] = useAtom(fetchRacesAtom);
  const [, fetchClasses] = useAtom(fetchClassesAtom);
  const [, fetchBackgrounds] = useAtom(fetchBackgroundsAtom);
  const [, fetchSpells] = useAtom(fetchSpellsAtom);
  const [, saveCharacter] = useAtom(saveCharacterAtom);
  const [, resetCreation] = useAtom(resetCharacterCreationAtom);

  const [loading, setLoading] = useState(false);
  const [selectedRaceForDetails, setSelectedRaceForDetails] = useState<Race | null>(null);

  // Bottom sheet ref and snap points
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = ['50%', '90%'];

  useEffect(() => {
    // Fetch all D&D data when component mounts
    const loadData = async () => {
      setLoading(true);
      try {
        const promises = [
          fetchRaces(),
          fetchClasses(),
          fetchSpells(),
        ];
        
        // Only fetch backgrounds if enabled
        if (ENABLE_BACKGROUNDS) {
          promises.push(fetchBackgrounds());
        }
        
        await Promise.all(promises);
      } catch (error) {
        console.error('Error loading D&D data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Check if current class has spellcasting
  const hasSpellcasting = selectedClass?.spellcasting !== undefined;

  // Get the actual step index, skipping disabled steps
  const getActualStepIndex = (step: number) => {
    let actualStep = step;
    
    // Skip backgrounds if disabled
    if (!ENABLE_BACKGROUNDS && step >= 2) {
      actualStep += 1;
    }
    
    // Skip spells if not a spellcaster
    if (!hasSpellcasting && actualStep >= (ENABLE_BACKGROUNDS ? 5 : 4)) {
      actualStep += 1;
    }
    
    return actualStep;
  };

  // Get the display step index for progress
  const getDisplayStepIndex = (step: number) => {
    let displayStep = step;
    
    // Adjust for skipped spells step
    if (!hasSpellcasting && step > (ENABLE_BACKGROUNDS ? 5 : 4)) {
      displayStep -= 1;
    }
    
    return displayStep;
  };

  // Get total steps (adjusting for disabled features)
  const getTotalSteps = () => {
    let total = CREATION_STEPS.length;
    
    // Subtract 1 if spells are disabled for this class
    if (!hasSpellcasting) {
      total -= 1;
    }
    
    return total;
  };

  const handleBack = () => {
    if (currentStep > 0) {
      let newStep = currentStep - 1;
      
      // Skip backgrounds step when going back if disabled
      if (!ENABLE_BACKGROUNDS && newStep === 2) {
        newStep = 1;
      }
      
      // Skip spells step when going back if not a spellcaster
      const spellsStepIndex = ENABLE_BACKGROUNDS ? 5 : 4;
      if (!hasSpellcasting && newStep === spellsStepIndex) {
        newStep = spellsStepIndex - 1;
      }
      
      setCurrentStep(newStep);
    } else {
      resetCreation();
      router.back();
    }
  };

  const handleNext = () => {
    let newStep = currentStep + 1;
    
    // Skip backgrounds step if disabled
    if (!ENABLE_BACKGROUNDS && newStep === 2) {
      newStep = 3;
    }
    
    // Skip spells step if not a spellcaster
    const spellsStepIndex = ENABLE_BACKGROUNDS ? 5 : 4;
    if (!hasSpellcasting && newStep === spellsStepIndex) {
      newStep = spellsStepIndex + 1;
    }
    
    if (newStep < CREATION_STEPS.length) {
      setCurrentStep(newStep);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return characterName.length >= 2 && selectedRace;
      case 1: return selectedClass;
      case 2: return ENABLE_BACKGROUNDS ? selectedBackground : true; // Skip if disabled
      case 3: return true; // Abilities always valid
      case 4: return true; // Skills can be empty
      case 5: return true; // Spells can be empty
      case 6: return true; // Equipment can be empty
      case 7: return true; // Review step
      default: return false;
    }
  };

  const rollAbilityScore = () => {
    // Roll 4d6, drop lowest
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => b - a);
    return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
  };

  const rollAllAbilities = () => {
    setAbilities({
      strength: rollAbilityScore(),
      dexterity: rollAbilityScore(),
      constitution: rollAbilityScore(),
      intelligence: rollAbilityScore(),
      wisdom: rollAbilityScore(),
      charisma: rollAbilityScore(),
    });
  };

  const getModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  // Helper function to format ability bonuses
  const formatAbilityBonuses = (race: Race) => {
    if (!race.ability_bonuses || race.ability_bonuses.length === 0) {
      return 'No ability bonuses';
    }

    return race.ability_bonuses
      .map(increase => {
        const abilityName = increase.ability_score.name;
        const bonus = increase.bonus;
        return `+${bonus} ${abilityName}`;
      })
      .join(', ');
  };

  // Handle race details bottom sheet
  const handleRaceDetailsPress = useCallback((race: Race) => {
    setSelectedRaceForDetails(race);
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleSaveCharacter = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const characterData = {
        user_id: user.id,
        name: characterName,
        race: selectedRace!.name,
        class: selectedClass!.name,
        background: ENABLE_BACKGROUNDS && selectedBackground ? selectedBackground.name : 'None',
        level: 1,
        abilities,
        skills: selectedSkills.map(skill => ({ name: skill, proficient: true })),
        spells: selectedSpells,
        equipment,
        character_data: {
          race: selectedRace,
          class: selectedClass,
          background: ENABLE_BACKGROUNDS ? selectedBackground : null,
        },
      };

      await saveCharacter(characterData);
      
      Alert.alert(
        'Character Created!',
        `${characterName} has been successfully created.`,
        [
          {
            text: 'OK',
            onPress: () => {
              resetCreation();
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save character. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Name & Race
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Character Name & Race</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Character Name</Text>
              <TextInput
                style={styles.input}
                value={characterName}
                onChangeText={setCharacterName}
                placeholder="Enter character name"
                placeholderTextColor="#666"
              />
            </View>

            <Text style={styles.label}>Choose Race</Text>
            <ScrollView style={styles.optionsList}>
              {races.map((race) => (
                <View key={race.index} style={styles.raceCardContainer}>
                  <TouchableOpacity
                    style={[
                      styles.optionCard,
                      selectedRace?.index === race.index && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedRace(race)}
                  >
                    <View style={styles.raceCardContent}>
                      <View style={styles.raceInfo}>
                        <Text style={styles.optionTitle}>{race.name}</Text>
                        <Text style={styles.optionDescription}>
                          Size: {race.size} • Speed: {race.speed}ft
                        </Text>
                        <Text style={styles.optionBonus}>
                          {formatAbilityBonuses(race)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.bookIcon}
                        onPress={() => handleRaceDetailsPress(race)}
                      >
                        <Book size={20} color="#4CAF50" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case 1: // Class
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Class</Text>
            <ScrollView style={styles.optionsList}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.index}
                  style={[
                    styles.optionCard,
                    selectedClass?.index === cls.index && styles.selectedOption,
                  ]}
                  onPress={() => setSelectedClass(cls)}
                >
                  <Text style={styles.optionTitle}>{cls.name}</Text>
                  <Text style={styles.optionDescription}>
                    Hit Die: d{cls.hit_die}
                  </Text>
                  {cls.spellcasting && (
                    <Text style={styles.optionBonus}>
                      Spellcaster (Level {cls.spellcasting.level})
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2: // Background (only if enabled)
        if (!ENABLE_BACKGROUNDS) {
          return null; // This step should be skipped
        }
        
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Background</Text>
            <ScrollView style={styles.optionsList}>
              {backgrounds.map((bg) => (
                <TouchableOpacity
                  key={bg.index}
                  style={[
                    styles.optionCard,
                    selectedBackground?.index === bg.index && styles.selectedOption,
                  ]}
                  onPress={() => setSelectedBackground(bg)}
                >
                  <Text style={styles.optionTitle}>{bg.name}</Text>
                  <Text style={styles.optionDescription}>
                    {bg.feature.name}
                  </Text>
                  {bg.skill_proficiencies?.length > 0 && (
                    <Text style={styles.optionBonus}>
                      Skills: {bg.skill_proficiencies?.map(s => s.name).join(', ')}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 3: // Abilities
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Ability Scores</Text>
            
            <TouchableOpacity style={styles.rollButton} onPress={rollAllAbilities}>
              <Dice6 size={20} color="#fff" />
              <Text style={styles.rollButtonText}>Roll All Abilities</Text>
            </TouchableOpacity>

            <View style={styles.abilitiesGrid}>
              {Object.entries(abilities).map(([ability, score]) => (
                <View key={ability} style={styles.abilityCard}>
                  <Text style={styles.abilityName}>
                    {ability.charAt(0).toUpperCase() + ability.slice(1, 3).toUpperCase()}
                  </Text>
                  <Text style={styles.abilityScore}>{score}</Text>
                  <Text style={styles.abilityModifier}>
                    {getModifier(score) >= 0 ? '+' : ''}{getModifier(score)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 4: // Skills
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Skills</Text>
            <Text style={styles.stepDescription}>
              Select skills based on your class proficiencies
            </Text>
            
            <ScrollView style={styles.optionsList}>
              {selectedClass?.proficiency_choices?.[0]?.from?.options?.map((prof) => (
                <TouchableOpacity
                  key={prof.item.index}
                  style={[
                    styles.skillCard,
                    selectedSkills.includes(prof.item.name) && styles.selectedSkill,
                  ]}
                  onPress={() => {
                    if (selectedSkills.includes(prof.item.name)) {
                      setSelectedSkills(selectedSkills.filter(s => s !== prof.item.name));
                    } else {
                      setSelectedSkills([...selectedSkills, prof.item.name]);
                    }
                  }}
                >
                  <Text style={styles.skillName}>{prof.item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 5: // Spells (only shown for spellcasters)
        if (!hasSpellcasting) {
          return null; // This step should be skipped
        }
        
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Spells</Text>
            <Text style={styles.stepDescription}>
              Select cantrips and 1st level spells for your spellcaster
            </Text>
            
            <ScrollView style={styles.optionsList}>
              {spells.filter(spell => spell.level <= 1).map((spell) => (
                <TouchableOpacity
                  key={spell.index}
                  style={[
                    styles.spellCard,
                    selectedSpells.some(s => s.index === spell.index) && styles.selectedSpell,
                  ]}
                  onPress={() => {
                    if (selectedSpells.some(s => s.index === spell.index)) {
                      setSelectedSpells(selectedSpells.filter(s => s.index !== spell.index));
                    } else {
                      setSelectedSpells([...selectedSpells, spell]);
                    }
                  }}
                >
                  <Text style={styles.spellName}>{spell.name}</Text>
                  <Text style={styles.spellLevel}>
                    {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                  </Text>
                  <Text style={styles.spellSchool}>{spell.school}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 6: // Equipment
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Starting Equipment</Text>
            <Text style={styles.stepDescription}>
              Your starting equipment is determined by your class{ENABLE_BACKGROUNDS ? ' and background' : ''}
            </Text>
            
            <View style={styles.equipmentSummary}>
              <Text style={styles.equipmentTitle}>Class Equipment:</Text>
              {selectedClass?.starting_equipment?.map((item, index) => (
                <Text key={index} style={styles.equipmentItem}>
                  • {item.equipment.name} x{item.quantity}
                </Text>
              ))}
              
              {ENABLE_BACKGROUNDS && selectedBackground && (
                <>
                  <Text style={styles.equipmentTitle}>Background Equipment:</Text>
                  {selectedBackground.equipment?.map((item, index) => (
                    <Text key={index} style={styles.equipmentItem}>
                      • {item.equipment.name} x{item.quantity}
                    </Text>
                  ))}
                </>
              )}
            </View>
          </View>
        );

      case 7: // Review
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Character Review</Text>
            
            <ScrollView style={styles.reviewContainer}>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Name:</Text>
                <Text style={styles.reviewValue}>{characterName}</Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Race:</Text>
                <Text style={styles.reviewValue}>{selectedRace?.name}</Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Class:</Text>
                <Text style={styles.reviewValue}>{selectedClass?.name}</Text>
                {hasSpellcasting && (
                  <Text style={styles.reviewSubtext}>Spellcaster</Text>
                )}
              </View>
              
              {ENABLE_BACKGROUNDS && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Background:</Text>
                  <Text style={styles.reviewValue}>{selectedBackground?.name || 'None'}</Text>
                </View>
              )}
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Abilities:</Text>
                <View style={styles.reviewAbilities}>
                  {Object.entries(abilities).map(([ability, score]) => (
                    <Text key={ability} style={styles.reviewAbility}>
                      {ability.charAt(0).toUpperCase() + ability.slice(1, 3).toUpperCase()}: {score} ({getModifier(score) >= 0 ? '+' : ''}{getModifier(score)})
                    </Text>
                  ))}
                </View>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Skills:</Text>
                <Text style={styles.reviewValue}>
                  {selectedSkills.length > 0 ? selectedSkills.join(', ') : 'None selected'}
                </Text>
              </View>
              
              {hasSpellcasting && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Spells:</Text>
                  <Text style={styles.reviewValue}>
                    {selectedSpells.length > 0 ? selectedSpells.map(s => s.name).join(', ') : 'None selected'}
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveCharacter}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Create Character</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading && races.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading D&D data...</Text>
      </View>
    );
  }

  const displayStep = getDisplayStepIndex(currentStep);
  const totalSteps = getTotalSteps();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Character Creation</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((displayStep + 1) / totalSteps) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Step {displayStep + 1} of {totalSteps}: {CREATION_STEPS[currentStep].title}
        </Text>
      </View>

      {renderStepContent()}

      {currentStep < CREATION_STEPS.length - 1 && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Race Details Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {selectedRaceForDetails && (
            <>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>{selectedRaceForDetails.name}</Text>
                <TouchableOpacity onPress={handleCloseBottomSheet} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <BottomSheetScrollView style={styles.bottomSheetScroll}>
                <View style={styles.raceDetailSection}>
                  <Text style={styles.raceDetailLabel}>Basic Information</Text>
                  <Text style={styles.raceDetailText}>Size: {selectedRaceForDetails.size}</Text>
                  <Text style={styles.raceDetailText}>Speed: {selectedRaceForDetails.speed} feet</Text>
                </View>

                {selectedRaceForDetails.ability_bonuses && selectedRaceForDetails.ability_bonuses.length > 0 && (
                  <View style={styles.raceDetailSection}>
                    <Text style={styles.raceDetailLabel}>Ability Score Increases</Text>
                    {selectedRaceForDetails.ability_bonuses.map((bonus, index) => (
                      <Text key={index} style={styles.raceDetailText}>
                        +{bonus.bonus} {bonus.ability_score.name}
                      </Text>
                    ))}
                  </View>
                )}

                {selectedRaceForDetails.languages && selectedRaceForDetails.languages.length > 0 && (
                  <View style={styles.raceDetailSection}>
                    <Text style={styles.raceDetailLabel}>Languages</Text>
                    {selectedRaceForDetails.languages.map((language, index) => (
                      <Text key={index} style={styles.raceDetailText}>• {language.name}</Text>
                    ))}
                  </View>
                )}

                {selectedRaceForDetails.traits && selectedRaceForDetails.traits.length > 0 && (
                  <View style={styles.raceDetailSection}>
                    <Text style={styles.raceDetailLabel}>Racial Traits</Text>
                    {selectedRaceForDetails.traits.map((trait, index) => (
                      <Text key={index} style={styles.raceDetailText}>• {trait.name}</Text>
                    ))}
                  </View>
                )}

                {selectedRaceForDetails.subraces && selectedRaceForDetails.subraces.length > 0 && (
                  <View style={styles.raceDetailSection}>
                    <Text style={styles.raceDetailLabel}>Subraces</Text>
                    {selectedRaceForDetails.subraces.map((subrace, index) => (
                      <Text key={index} style={styles.raceDetailText}>• {subrace.name}</Text>
                    ))}
                  </View>
                )}
              </BottomSheetScrollView>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  optionsList: {
    flex: 1,
  },
  raceCardContainer: {
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a3a1a',
  },
  raceCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  raceInfo: {
    flex: 1,
  },
  bookIcon: {
    padding: 8,
    marginLeft: 8,
  },
  optionTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  optionBonus: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
  },
  rollButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  rollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
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
  },
  abilityName: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  abilityScore: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  abilityModifier: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
  },
  skillCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSkill: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a3a1a',
  },
  skillName: {
    fontSize: 16,
    color: '#fff',
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
    backgroundColor: '#1a3a1a',
  },
  spellName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  spellLevel: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  spellSchool: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  equipmentSummary: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  equipmentTitle: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  equipmentItem: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  reviewContainer: {
    flex: 1,
  },
  reviewSection: {
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
  },
  reviewSubtext: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  reviewAbilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewAbility: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    backgroundColor: '#2a2a2a',
    padding: 8,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
  navigationContainer: {
    padding: 20,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#666',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: '#1a1a1a',
  },
  bottomSheetIndicator: {
    backgroundColor: '#666',
  },
  bottomSheetContent: {
    flex: 1,
    padding: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bottomSheetTitle: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  bottomSheetScroll: {
    flex: 1,
  },
  raceDetailSection: {
    marginBottom: 20,
  },
  raceDetailLabel: {
    fontSize: 18,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  raceDetailText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
    lineHeight: 22,
  },
});