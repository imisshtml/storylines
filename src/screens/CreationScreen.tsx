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
  Zap,
  Sword,
  Package,
  Book,
} from 'lucide-react-native';
import {
  characterCreationStepAtom,
  characterNameAtom,
  selectedRaceAtom,
  selectedClassAtom,
  characterAbilitiesAtom,
  selectedSkillsAtom,
  selectedSpellsAtom,
  characterEquipmentAtom,
  racesAtom,
  classesAtom,
  spellsAtom,
  fetchRacesAtom,
  fetchClassesAtom,
  fetchSpellsAtom,
  saveCharacterAtom,
  resetCharacterCreationAtom,
  type Race,
  type Class,
  type DnDSpell,
  type DnDAbilities,
} from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';

const CREATION_STEPS = [
  { title: 'Name & Race', icon: User },
  { title: 'Class', icon: Shield },
  { title: 'Abilities', icon: Dice6 },
  { title: 'Skills', icon: Zap },
  { title: 'Spells', icon: Sword },
  { title: 'Equipment', icon: Package },
  { title: 'Review', icon: Save },
];

const raceDesc = {
  dragonborn: 'Dragonborn are proud, honorable beings with draconic ancestry. They often possess strong physiques, a breath weapon tied to their lineage, and a natural sense of leadership and loyalty. Their appearance resembles upright dragons, with scales, tails, and a draconic snout.',
  
  dwarf: 'Dwarves are a stout and resilient people known for their craftsmanship, traditions, and strong sense of community. They typically live in mountainous or underground strongholds and have a natural affinity for stonework, mining, and forging.',
  
  elf: 'Elves are graceful and long-lived beings attuned to magic and nature. Known for their keen senses and agility, elves often live in forested or mystical regions and maintain deep cultural traditions rooted in beauty, artistry, and longevity.',
  
  gnome: 'Gnomes are clever and curious folk, often driven by a thirst for knowledge and invention. They are small in stature but energetic in personality, frequently engaging in magical experimentation or intricate mechanical designs.',
  
  'half-elf': 'Half-elves combine traits from both elves and humans, blending adaptability with grace. They often serve as bridges between cultures, showing a talent for diplomacy, creativity, and a deep personal drive.',
  
  'half-orc': 'Half-orcs inherit strength and resilience from their orcish ancestry and ambition from their human side. They are often formidable warriors or survivors, driven by personal purpose and inner strength.',
  
  halfling: 'Halflings are cheerful, nimble folk known for their optimism and quiet resourcefulness. They value home and community, often living in rural areas, and possess a knack for staying out of trouble—or escaping it quickly.',
  
  human: 'Humans are the most adaptable and ambitious of the common races. They thrive in diverse environments and cultures, often driven by a desire to explore, build, and lead. Their diversity makes them capable of great innovation.',
  
  tiefling: 'Tieflings are descended from ancient pacts with infernal powers, marked by their horns, tails, and other features. Despite their appearance, tieflings have the same capacity for good or evil as any other race and often live with a strong sense of self-determination.',
};

const classDesc = {
  barbarian: 'A fierce warrior of primitive background who can enter a battle rage. Barbarians excel in melee combat and can take tremendous amounts of damage while dealing devastating attacks.',
  
  bard: 'A master of song, speech, and the magic they contain. Bards are versatile spellcasters and skilled performers who can inspire allies, control the battlefield, and solve problems with creativity.',
  
  cleric: 'A priestly champion who wields divine magic in service of a higher power. Clerics are powerful healers and support characters who can also hold their own in combat.',
  
  druid: 'A priest of nature, wielding elemental forces and transforming into animals. Druids are versatile spellcasters with a deep connection to the natural world.',
  
  fighter: 'A master of martial combat, skilled with a variety of weapons and armor. Fighters are the most versatile combatants, capable of adapting to any fighting style.',
  
  monk: 'A master of martial arts, harnessing inner power through discipline and training. Monks are agile combatants who can perform supernatural feats through ki.',
  
  paladin: 'A holy warrior bound to a sacred oath. Paladins combine martial prowess with divine magic, serving as champions of justice and righteousness.',
  
  ranger: 'A warrior of the wilderness, skilled in tracking, survival, and combat. Rangers are versatile fighters who excel in natural environments.',
  
  rogue: 'A scoundrel who uses stealth and trickery to accomplish goals. Rogues are skilled in infiltration, trap detection, and dealing massive damage from the shadows.',
  
  sorcerer: 'A spellcaster who draws on inherent magic from a draconic or other exotic bloodline. Sorcerers have fewer spells than wizards but can modify them with metamagic.',
  
  warlock: 'A wielder of magic derived from a bargain with an extraplanar entity. Warlocks have unique spellcasting abilities and powerful supernatural invocations.',
  
  wizard: 'A scholarly magic-user capable of manipulating the structures of spellcasting. Wizards have the largest spell selection and can prepare different spells each day.',
};

export default function CreationScreen() {
  const [user] = useAtom(userAtom);
  const [currentStep, setCurrentStep] = useAtom(characterCreationStepAtom);
  const [characterName, setCharacterName] = useAtom(characterNameAtom);
  const [selectedRace, setSelectedRace] = useAtom(selectedRaceAtom);
  const [selectedClass, setSelectedClass] = useAtom(selectedClassAtom);
  const [abilities, setAbilities] = useAtom(characterAbilitiesAtom);
  const [selectedSkills, setSelectedSkills] = useAtom(selectedSkillsAtom);
  const [selectedSpells, setSelectedSpells] = useAtom(selectedSpellsAtom);
  const [equipment, setEquipment] = useAtom(characterEquipmentAtom);

  const [races] = useAtom(racesAtom);
  const [classes] = useAtom(classesAtom);
  const [spells] = useAtom(spellsAtom);

  const [, fetchRaces] = useAtom(fetchRacesAtom);
  const [, fetchClasses] = useAtom(fetchClassesAtom);
  const [, fetchSpells] = useAtom(fetchSpellsAtom);
  const [, saveCharacter] = useAtom(saveCharacterAtom);
  const [, resetCreation] = useAtom(resetCharacterCreationAtom);

  const [loading, setLoading] = useState(false);
  const [selectedRaceForDetails, setSelectedRaceForDetails] = useState<Race | null>(null);
  const [selectedClassForDetails, setSelectedClassForDetails] = useState<Class | null>(null);

  // Bottom sheet refs and snap points
  const raceBottomSheetRef = useRef<BottomSheet>(null);
  const classBottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = ['50%', '90%'];

  useEffect(() => {
    // Fetch all D&D data when component mounts
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchRaces(),
          fetchClasses(),
          fetchSpells(),
        ]);
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
    
    // Skip spells if not a spellcaster
    if (!hasSpellcasting && actualStep >= 4) {
      actualStep += 1;
    }
    
    return actualStep;
  };

  // Get the display step index for progress
  const getDisplayStepIndex = (step: number) => {
    let displayStep = step;
    
    // Adjust for skipped spells step
    if (!hasSpellcasting && step > 4) {
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

  // Get skill choice information
  const getSkillChoiceInfo = () => {
    if (!selectedClass?.proficiency_choices?.[0]) {
      return { maxChoices: 0, availableSkills: [] };
    }

    const choiceData = selectedClass.proficiency_choices[0];
    return {
      maxChoices: choiceData.choose,
      availableSkills: choiceData.from?.options || []
    };
  };

  const handleBack = () => {
    if (currentStep > 0) {
      let newStep = currentStep - 1;
      
      // Skip spells step when going back if not a spellcaster
      if (!hasSpellcasting && newStep === 4) {
        newStep = 3;
      }
      
      setCurrentStep(newStep);
    } else {
      resetCreation();
      router.back();
    }
  };

  const handleNext = () => {
    let newStep = currentStep + 1;
    
    // Skip spells step if not a spellcaster
    if (!hasSpellcasting && newStep === 4) {
      newStep = 5;
    }
    
    if (newStep < CREATION_STEPS.length) {
      setCurrentStep(newStep);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return characterName.length >= 2 && selectedRace;
      case 1: return selectedClass;
      case 2: return true; // Abilities always valid
      case 3: {
        // Skills - must select exactly the required number
        const { maxChoices } = getSkillChoiceInfo();
        return maxChoices === 0 || selectedSkills.length === maxChoices;
      }
      case 4: return true; // Spells can be empty
      case 5: return true; // Equipment can be empty
      case 6: return true; // Review step
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

  // Get racial bonus for a specific ability
  const getRacialBonus = (abilityName: string): number => {
    if (!selectedRace?.ability_bonuses) return 0;
    
    const bonus = selectedRace.ability_bonuses.find(
      bonus => bonus.ability_score.index === abilityName.substring(0, 3).toLowerCase()
    );
    
    return bonus ? bonus.bonus : 0;
  };

  // Get final ability score (base + racial bonus)
  const getFinalAbilityScore = (abilityName: keyof DnDAbilities): number => {
    const baseScore = abilities[abilityName];
    const racialBonus = getRacialBonus(abilityName);
    return baseScore + racialBonus;
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

  // Helper function to format class hit die
  const formatHitDie = (cls: Class) => {
    return `d${cls.hit_die}`;
  };

  // Helper function to format class proficiencies
  const formatProficiencies = (cls: Class) => {
    if (!cls.proficiencies || cls.proficiencies.length === 0) {
      return 'None';
    }
    return cls.proficiencies.map(prof => prof.name).join(', ');
  };

  // Helper function to format saving throws
  const formatSavingThrows = (cls: Class) => {
    if (!cls.saving_throws || cls.saving_throws.length === 0) {
      return 'None';
    }
    return cls.saving_throws.map(save => save.name).join(', ');
  };

  // Handle race details bottom sheet
  const handleRaceDetailsPress = useCallback((race: Race) => {
    setSelectedRaceForDetails(race);
    raceBottomSheetRef.current?.expand();
  }, []);

  const handleCloseRaceBottomSheet = useCallback(() => {
    raceBottomSheetRef.current?.close();
  }, []);

  // Handle class details bottom sheet
  const handleClassDetailsPress = useCallback((cls: Class) => {
    setSelectedClassForDetails(cls);
    classBottomSheetRef.current?.expand();
  }, []);

  const handleCloseClassBottomSheet = useCallback(() => {
    classBottomSheetRef.current?.close();
  }, []);

  const handleSaveCharacter = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Calculate final abilities with racial bonuses
      const finalAbilities = {
        strength: getFinalAbilityScore('strength'),
        dexterity: getFinalAbilityScore('dexterity'),
        constitution: getFinalAbilityScore('constitution'),
        intelligence: getFinalAbilityScore('intelligence'),
        wisdom: getFinalAbilityScore('wisdom'),
        charisma: getFinalAbilityScore('charisma'),
      };
      
      const characterData = {
        user_id: user.id,
        name: characterName,
        race: selectedRace!.name,
        class: selectedClass!.name,
        background: 'None', // No backgrounds used
        level: 1,
        abilities: finalAbilities, // Save final abilities with racial bonuses
        skills: selectedSkills.map(skill => ({ name: skill, proficient: true })),
        spells: selectedSpells,
        equipment,
        character_data: {
          race: selectedRace,
          class: selectedClass,
          background: null, // No backgrounds
          baseAbilities: abilities, // Also save base abilities for reference
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
                <View key={cls.index} style={styles.classCardContainer}>
                  <TouchableOpacity
                    style={[
                      styles.optionCard,
                      selectedClass?.index === cls.index && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedClass(cls)}
                  >
                    <View style={styles.classCardContent}>
                      <View style={styles.classInfo}>
                        <Text style={styles.optionTitle}>{cls.name}</Text>
                        <Text style={styles.optionDescription}>
                          Hit Die: {formatHitDie(cls)}
                        </Text>
                        {cls.spellcasting && (
                          <Text style={styles.optionBonus}>
                            Spellcaster (Level {cls.spellcasting.level})
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.bookIcon}
                        onPress={() => handleClassDetailsPress(cls)}
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

      case 2: // Abilities
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Ability Scores</Text>
            
            <TouchableOpacity style={styles.rollButton} onPress={rollAllAbilities}>
              <Dice6 size={20} color="#fff" />
              <Text style={styles.rollButtonText}>Roll All Abilities</Text>
            </TouchableOpacity>

            {selectedRace && (
              <View style={styles.racialBonusInfo}>
                <Text style={styles.racialBonusTitle}>
                  {selectedRace.name} Racial Bonuses:
                </Text>
                <Text style={styles.racialBonusText}>
                  {formatAbilityBonuses(selectedRace)}
                </Text>
              </View>
            )}

            <View style={styles.abilitiesGrid}>
              {Object.entries(abilities).map(([ability, score]) => {
                const racialBonus = getRacialBonus(ability);
                const finalScore = getFinalAbilityScore(ability as keyof DnDAbilities);
                
                return (
                  <View key={ability} style={styles.abilityCard}>
                    <Text style={styles.abilityName}>
                      {ability.charAt(0).toUpperCase() + ability.slice(1, 3).toUpperCase()}
                    </Text>
                    <View style={styles.abilityScoreContainer}>
                      <Text style={styles.abilityScore}>{score}</Text>
                      {racialBonus > 0 && (
                        <Text style={styles.racialBonusScore}>+{racialBonus}</Text>
                      )}
                    </View>
                    <Text style={styles.finalScore}>= {finalScore}</Text>
                    <Text style={styles.abilityModifier}>
                      {getModifier(finalScore) >= 0 ? '+' : ''}{getModifier(finalScore)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        );

      case 3: // Skills
        const { maxChoices, availableSkills } = getSkillChoiceInfo();
        
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Skills</Text>
            <View style={styles.skillsHeader}>
              <Text style={styles.stepDescription}>
                Select {maxChoices} skill{maxChoices !== 1 ? 's' : ''} for your proficiencies
              </Text>
              <View style={styles.skillCounter}>
                <Text style={styles.skillCounterText}>
                  {selectedSkills.length} / {maxChoices}
                </Text>
              </View>
            </View>
            
            {maxChoices === 0 ? (
              <View style={styles.noSkillsContainer}>
                <Text style={styles.noSkillsText}>
                  Your class doesn't provide skill proficiency choices.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.optionsList}>
                {availableSkills.map((skillOption) => {
                  const isSelected = selectedSkills.includes(skillOption.item.name);
                  const canSelect = selectedSkills.length < maxChoices || isSelected;
                  
                  return (
                    <TouchableOpacity
                      key={skillOption.item.index}
                      style={[
                        styles.skillCard,
                        isSelected && styles.selectedSkill,
                        !canSelect && styles.disabledSkill,
                      ]}
                      onPress={() => {
                        if (!canSelect) return;
                        
                        if (isSelected) {
                          setSelectedSkills(selectedSkills.filter(s => s !== skillOption.item.name));
                        } else {
                          setSelectedSkills([...selectedSkills, skillOption.item.name]);
                        }
                      }}
                      disabled={!canSelect}
                    >
                      <Text style={[
                        styles.skillName,
                        isSelected && styles.selectedSkillText,
                        !canSelect && styles.disabledSkillText,
                      ]}>
                        {skillOption.item.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.selectedIndicatorText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        );

      case 4: // Spells (only shown for spellcasters)
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

      case 5: // Equipment
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Starting Equipment</Text>
            <Text style={styles.stepDescription}>
              Your starting equipment is determined by your class
            </Text>
            
            <View style={styles.equipmentSummary}>
              <Text style={styles.equipmentTitle}>Class Equipment:</Text>
              {selectedClass?.starting_equipment?.map((item, index) => (
                <Text key={index} style={styles.equipmentItem}>
                  • {item.equipment.name} x{item.quantity}
                </Text>
              ))}
            </View>
          </View>
        );

      case 6: // Review
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
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Final Abilities (with racial bonuses):</Text>
                <View style={styles.reviewAbilities}>
                  {Object.entries(abilities).map(([ability, score]) => {
                    const finalScore = getFinalAbilityScore(ability as keyof DnDAbilities);
                    const racialBonus = getRacialBonus(ability);
                    
                    return (
                      <Text key={ability} style={styles.reviewAbility}>
                        {ability.charAt(0).toUpperCase() + ability.slice(1, 3).toUpperCase()}: {finalScore} 
                        {racialBonus > 0 && (
                          <Text style={styles.reviewRacialBonus}> ({score}+{racialBonus})</Text>
                        )}
                        {' '}({getModifier(finalScore) >= 0 ? '+' : ''}{getModifier(finalScore)})
                      </Text>
                    );
                  })}
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
                <ActivityIndicator size="small\" color="#fff" />
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
        ref={raceBottomSheetRef}
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
                <TouchableOpacity onPress={handleCloseRaceBottomSheet} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <BottomSheetScrollView style={styles.bottomSheetScroll}>
                <View style={styles.raceDetailSection}>
                  <Text style={styles.raceDetailText}>{raceDesc[selectedRaceForDetails?.index]}</Text>
                </View>
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
              </BottomSheetScrollView>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>

      {/* Class Details Bottom Sheet */}
      <BottomSheet
        ref={classBottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {selectedClassForDetails && (
            <>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>{selectedClassForDetails.name}</Text>
                <TouchableOpacity onPress={handleCloseClassBottomSheet} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <BottomSheetScrollView style={styles.bottomSheetScroll}>
                <View style={styles.classDetailSection}>
                  <Text style={styles.classDetailText}>{classDesc[selectedClassForDetails?.index]}</Text>
                </View>

                <View style={styles.classDetailSection}>
                  <Text style={styles.classDetailLabel}>Basic Information</Text>
                  <Text style={styles.classDetailText}>Hit Die: {formatHitDie(selectedClassForDetails)}</Text>
                  <Text style={styles.classDetailText}>Primary Ability: {formatSavingThrows(selectedClassForDetails)}</Text>
                </View>

                {selectedClassForDetails.proficiencies && selectedClassForDetails.proficiencies.length > 0 && (
                  <View style={styles.classDetailSection}>
                    <Text style={styles.classDetailLabel}>Proficiencies</Text>
                    <Text style={styles.classDetailText}>{formatProficiencies(selectedClassForDetails)}</Text>
                  </View>
                )}

                {selectedClassForDetails.saving_throws && selectedClassForDetails.saving_throws.length > 0 && (
                  <View style={styles.classDetailSection}>
                    <Text style={styles.classDetailLabel}>Saving Throw Proficiencies</Text>
                    {selectedClassForDetails.saving_throws.map((save, index) => (
                      <Text key={index} style={styles.classDetailText}>• {save.name}</Text>
                    ))}
                  </View>
                )}

                {selectedClassForDetails.spellcasting && (
                  <View style={styles.classDetailSection}>
                    <Text style={styles.classDetailLabel}>Spellcasting</Text>
                    <Text style={styles.classDetailText}>
                      Spellcasting begins at level {selectedClassForDetails.spellcasting.level}
                    </Text>
                    <Text style={styles.classDetailText}>
                      Spellcasting Ability: {selectedClassForDetails.spellcasting.spellcasting_ability.name}
                    </Text>
                  </View>
                )}

                {selectedClassForDetails.starting_equipment && selectedClassForDetails.starting_equipment.length > 0 && (
                  <View style={styles.classDetailSection}>
                    <Text style={styles.classDetailLabel}>Starting Equipment</Text>
                    {selectedClassForDetails.starting_equipment.map((item, index) => (
                      <Text key={index} style={styles.classDetailText}>
                        • {item.equipment.name} x{item.quantity}
                      </Text>
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
    marginBottom: 0,
  },
  classCardContainer: {
    marginBottom: 0,
  },
  optionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
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
  classCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  raceInfo: {
    flex: 1,
  },
  classInfo: {
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
  racialBonusInfo: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  racialBonusTitle: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  racialBonusText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
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
  abilityScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  abilityScore: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  racialBonusScore: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginLeft: 4,
  },
  finalScore: {
    fontSize: 24,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  abilityModifier: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    height: 70,
  },
  skillCounter: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  skillCounterText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  noSkillsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noSkillsText: {
    color: '#888',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  skillCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedSkill: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a3a1a',
  },
  disabledSkill: {
    backgroundColor: '#1a1a1a',
    opacity: 0.5,
  },
  skillName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  selectedSkillText: {
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
  },
  disabledSkillText: {
    color: '#666',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
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
  reviewRacialBonus: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
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
  classDetailSection: {
    marginBottom: 20,
  },
  raceDetailLabel: {
    fontSize: 18,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  classDetailLabel: {
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
  classDetailText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
    lineHeight: 22,
  },
});