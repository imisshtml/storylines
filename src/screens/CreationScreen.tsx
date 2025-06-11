import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { ArrowLeft, Save, User, Dice6, ShoppingCart, Scroll, ChevronDown, ChevronUp, X, Plus, Minus, Camera } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAtom } from 'jotai';
import {
  characterCreationStepAtom,
  characterNameAtom,
  selectedRaceAtom,
  selectedClassAtom,
  characterAbilitiesAtom,
  selectedSkillsAtom,
  selectedSpellsAtom,
  characterEquipmentAtom,
  characterGoldAtom,
  characterSilverAtom,
  characterCopperAtom,
  purchasedEquipmentAtom,
  racesAtom,
  classesAtom,
  spellsAtom,
  equipmentAtom,
  fetchRacesAtom,
  fetchClassesAtom,
  fetchSpellsAtom,
  fetchEquipmentAtom,
  saveCharacterAtom,
  resetCharacterCreationAtom,
  setStartingWealthAtom,
  purchaseEquipmentAtom,
  removeEquipmentAtom,
  canAffordEquipment,
  type Race,
  type Class,
  type DnDSpell,
  type Equipment,
  type DnDAbilities,
} from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import { currentCampaignAtom } from '../atoms/campaignAtoms';
import { raceDesc, classDesc, skillsDesc, skillsStat } from '../data/characterData';
import { getSpellcastingInfo, hasSpellcastingAtLevel } from '../data/spellcastingData';
import AvatarSelector from '../components/AvatarSelector';
import { getDefaultAvatar } from '../utils/avatarStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CREATION_STEPS = [
  { id: 0, title: 'Basic Info', icon: User },
  { id: 1, title: 'Race & Class', icon: User },
  { id: 2, title: 'Abilities', icon: Dice6 },
  { id: 3, title: 'Skills', icon: User },
  { id: 4, title: 'Equipment', icon: ShoppingCart },
  { id: 5, title: 'Spells', icon: Scroll },
  { id: 6, title: 'Review', icon: Save },
];

const POINT_BUY_COSTS = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

const TOTAL_POINTS = 27;

export default function CreationScreen() {
  const params = useLocalSearchParams();
  const returnToCampaign = params.returnToCampaign as string;
  const campaignUid = params.campaignUid as string;

  const [currentStep, setCurrentStep] = useAtom(characterCreationStepAtom);
  const [characterName, setCharacterName] = useAtom(characterNameAtom);
  const [selectedRace, setSelectedRace] = useAtom(selectedRaceAtom);
  const [selectedClass, setSelectedClass] = useAtom(selectedClassAtom);
  const [abilities, setAbilities] = useAtom(characterAbilitiesAtom);
  const [selectedSkills, setSelectedSkills] = useAtom(selectedSkillsAtom);
  const [selectedSpells, setSelectedSpells] = useAtom(selectedSpellsAtom);
  const [equipment, setEquipment] = useAtom(characterEquipmentAtom);
  const [gold, setGold] = useAtom(characterGoldAtom);
  const [silver, setSilver] = useAtom(characterSilverAtom);
  const [copper, setCopper] = useAtom(characterCopperAtom);
  const [purchasedEquipment, setPurchasedEquipment] = useAtom(purchasedEquipmentAtom);

  const [races] = useAtom(racesAtom);
  const [classes] = useAtom(classesAtom);
  const [spells] = useAtom(spellsAtom);
  const [equipmentList] = useAtom(equipmentAtom);

  const [, fetchRaces] = useAtom(fetchRacesAtom);
  const [, fetchClasses] = useAtom(fetchClassesAtom);
  const [, fetchSpells] = useAtom(fetchSpellsAtom);
  const [, fetchEquipment] = useAtom(fetchEquipmentAtom);
  const [, saveCharacter] = useAtom(saveCharacterAtom);
  const [, resetCharacterCreation] = useAtom(resetCharacterCreationAtom);
  const [, setStartingWealth] = useAtom(setStartingWealthAtom);
  const [, purchaseEquipment] = useAtom(purchaseEquipmentAtom);
  const [, removeEquipment] = useAtom(removeEquipmentAtom);

  const [user] = useAtom(userAtom);
  const [currentCampaign] = useAtom(currentCampaignAtom);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRace, setExpandedRace] = useState<string | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number>(0);
  const [selectedEquipmentCategory, setSelectedEquipmentCategory] = useState<string>('weapon');
  const [isAvatarSelectorVisible, setIsAvatarSelectorVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(getDefaultAvatar());

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Load initial data
    fetchRaces();
    fetchClasses();
    fetchSpells();
    fetchEquipment();
  }, [fetchRaces, fetchClasses, fetchSpells, fetchEquipment]);

  useEffect(() => {
    // Set starting wealth when class is selected
    if (selectedClass) {
      setStartingWealth();
    }
  }, [selectedClass, setStartingWealth]);

  const handleBack = () => {
    if (returnToCampaign && campaignUid) {
      // If we came from a campaign, go back to the invite screen
      router.push('/invite');
    } else {
      // Otherwise go to home
      router.push('/');
    }
  };

  const handleNext = () => {
    if (currentStep < CREATION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      // Scroll to top when moving to next step
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Scroll to top when moving to previous step
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSaveCharacter = async () => {
    if (!user || !characterName || !selectedRace || !selectedClass) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Calculate final ability scores with racial bonuses
      const finalAbilities: DnDAbilities = { ...abilities };
      if (selectedRace.ability_bonuses) {
        selectedRace.ability_bonuses.forEach(bonus => {
          const abilityName = bonus.ability_score.index;
          if (finalAbilities[abilityName as keyof DnDAbilities] !== undefined) {
            finalAbilities[abilityName as keyof DnDAbilities] += bonus.bonus;
          }
        });
      }

      // Calculate hit points (class hit die + constitution modifier)
      const constitutionModifier = Math.floor((finalAbilities.constitution - 10) / 2);
      const hitPoints = selectedClass.hit_die + constitutionModifier;

      // Calculate armor class (10 + dexterity modifier)
      const dexterityModifier = Math.floor((finalAbilities.dexterity - 10) / 2);
      const armorClass = 10 + dexterityModifier;

      const characterData = {
        user_id: user.id,
        campaign_id: campaignUid || null, // Assign to campaign if coming from invite flow
        name: characterName,
        race: selectedRace.name,
        class: selectedClass.name,
        background: 'Folk Hero', // Default background for now
        level: 1,
        abilities: finalAbilities,
        skills: selectedSkills,
        spells: selectedSpells,
        equipment,
        character_data: {
          race: selectedRace,
          class: selectedClass,
          purchasedEquipment,
          avatar: selectedAvatar,
        },
        current_hitpoints: Math.max(1, hitPoints),
        max_hitpoints: Math.max(1, hitPoints),
        temp_hitpoints: 0,
        armor_class: Math.max(10, armorClass),
        conditions: [],
        gold,
        silver,
        copper,
      };

      const savedCharacter = await saveCharacter(characterData);
      
      // Reset creation state
      resetCharacterCreation();

      if (returnToCampaign && campaignUid) {
        // If we came from a campaign, go back to the invite screen
        router.push('/invite');
      } else {
        // Otherwise go to character view
        router.push({
          pathname: '/character-view',
          params: { characterId: savedCharacter.id }
        });
      }
    } catch (error) {
      console.error('Error saving character:', error);
      Alert.alert('Error', 'Failed to save character. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return characterName.length > 0;
      case 1:
        return selectedRace && selectedClass;
      case 2:
        return true; // Abilities are set by default
      case 3:
        return true; // Skills are optional
      case 4:
        return true; // Equipment is optional
      case 5:
        return true; // Spells are optional
      case 6:
        return characterName && selectedRace && selectedClass;
      default:
        return false;
    }
  };

  const getUsedPoints = () => {
    return Object.values(abilities).reduce((total, score) => {
      return total + (POINT_BUY_COSTS[score as keyof typeof POINT_BUY_COSTS] || 0);
    }, 0);
  };

  const getRemainingPoints = () => {
    return TOTAL_POINTS - getUsedPoints();
  };

  const canIncreaseAbility = (ability: string, currentValue: number) => {
    if (currentValue >= 15) return false;
    const nextValue = currentValue + 1;
    const currentCost = POINT_BUY_COSTS[currentValue as keyof typeof POINT_BUY_COSTS] || 0;
    const nextCost = POINT_BUY_COSTS[nextValue as keyof typeof POINT_BUY_COSTS] || 0;
    const costDifference = nextCost - currentCost;
    return getRemainingPoints() >= costDifference;
  };

  const canDecreaseAbility = (currentValue: number) => {
    return currentValue > 8;
  };

  const adjustAbility = (ability: string, delta: number) => {
    const currentValue = abilities[ability as keyof DnDAbilities];
    const newValue = currentValue + delta;
    
    if (delta > 0 && canIncreaseAbility(ability, currentValue)) {
      setAbilities({ ...abilities, [ability]: newValue });
    } else if (delta < 0 && canDecreaseAbility(currentValue)) {
      setAbilities({ ...abilities, [ability]: newValue });
    }
  };

  const getFinalAbilityScore = (ability: string) => {
    const baseScore = abilities[ability as keyof DnDAbilities];
    let bonus = 0;
    
    if (selectedRace?.ability_bonuses) {
      const raceBonus = selectedRace.ability_bonuses.find(
        b => b.ability_score.index === ability.substring(0, 3)
      );
      if (raceBonus) {
        bonus = raceBonus.bonus;
      }
    }
    
    return baseScore + bonus;
  };

  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const getAvailableSkills = () => {
    if (!selectedClass?.proficiency_choices?.[0]) return [];
    return selectedClass.proficiency_choices[0].from.options.map(option => option.item.name);
  };

  const getMaxSkills = () => {
    return selectedClass?.proficiency_choices?.[0]?.choose || 0;
  };

  const toggleSkill = (skillName: string) => {
    const isSelected = selectedSkills.includes(skillName);
    const maxSkills = getMaxSkills();

    if (isSelected) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    } else if (selectedSkills.length < maxSkills) {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const getEquipmentCategories = () => {
    const categories = [...new Set(equipmentList.map(item => item.equipment_category))];
    return categories.filter(cat => cat && cat !== 'ammunition'); // Filter out ammunition for simplicity
  };

  const getEquipmentByCategory = (category: string) => {
    return equipmentList.filter(item => item.equipment_category === category);
  };

  const handlePurchaseEquipment = (item: Equipment) => {
    try {
      purchaseEquipment(item);
    } catch (error) {
      Alert.alert('Cannot Purchase', (error as Error).message);
    }
  };

  const handleRemoveEquipment = (item: Equipment) => {
    removeEquipment(item);
  };

  const getSpellcastingInfo = () => {
    if (!selectedClass || !hasSpellcastingAtLevel(selectedClass.name, 1)) {
      return null;
    }
    return getSpellcastingInfo(selectedClass.name, 1);
  };

  const getAvailableSpellLevels = () => {
    const spellcastingInfo = getSpellcastingInfo();
    if (!spellcastingInfo) return [];

    const levels = [];
    if (spellcastingInfo.cantripsKnown > 0) {
      levels.push({ value: 0, label: 'Cantrips' });
    }
    if (spellcastingInfo.spellsKnown && spellcastingInfo.spellsKnown > 0) {
      levels.push({ value: 1, label: '1st Level' });
    }
    return levels;
  };

  const getSpellsByLevel = (level: number) => {
    return spells.filter(spell => spell.level === level);
  };

  const getSelectedSpellsByLevel = (level: number) => {
    return selectedSpells.filter(spell => spell.level === level);
  };

  const getMaxSpellsForLevel = (level: number) => {
    const spellcastingInfo = getSpellcastingInfo();
    if (!spellcastingInfo) return 0;
    
    if (level === 0) return spellcastingInfo.cantripsKnown;
    return spellcastingInfo.spellsKnown || 0;
  };

  const toggleSpell = (spell: DnDSpell) => {
    const isSelected = selectedSpells.some(s => s.index === spell.index);
    const selectedAtLevel = getSelectedSpellsByLevel(spell.level);
    const maxAtLevel = getMaxSpellsForLevel(spell.level);

    if (isSelected) {
      setSelectedSpells(selectedSpells.filter(s => s.index !== spell.index));
    } else if (selectedAtLevel.length < maxAtLevel) {
      setSelectedSpells([...selectedSpells, spell]);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Character Basics</Text>
            <Text style={styles.stepDescription}>
              Let's start with the basics of your character
            </Text>

            {/* Avatar Selection */}
            <View style={styles.avatarSection}>
              <Text style={styles.sectionTitle}>Character Portrait</Text>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => setIsAvatarSelectorVisible(true)}
              >
                <Image source={require('../data/defaultAvatars').getAvatarById(selectedAvatar.replace('default:', ''))?.imagePath || require('../data/defaultAvatars').DEFAULT_AVATARS[0].imagePath} style={styles.avatarImage} />
                <View style={styles.avatarOverlay}>
                  <Camera size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Character Name */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Character Name</Text>
              <TextInput
                style={styles.input}
                value={characterName}
                onChangeText={setCharacterName}
                placeholder="Enter character name"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Race & Class</Text>
            <Text style={styles.stepDescription}>
              Choose your character's race and class
            </Text>
            
            {/* Race Selection */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Race</Text>
              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {races.map((race) => (
                  <View key={race.index} style={styles.optionContainer}>
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        selectedRace?.index === race.index && styles.selectedOption
                      ]}
                      onPress={() => {
                        setSelectedRace(race);
                        setExpandedRace(expandedRace === race.index ? null : race.index);
                      }}
                    >
                      <View style={styles.optionHeader}>
                        <Text style={[
                          styles.optionText,
                          selectedRace?.index === race.index && styles.selectedOptionText
                        ]}>
                          {race.name}
                        </Text>
                        {expandedRace === race.index ? (
                          <ChevronUp size={20} color={selectedRace?.index === race.index ? "#fff" : "#888"} />
                        ) : (
                          <ChevronDown size={20} color={selectedRace?.index === race.index ? "#fff" : "#888"} />
                        )}
                      </View>
                    </TouchableOpacity>
                    {expandedRace === race.index && (
                      <View style={styles.expandedContent}>
                        <Text style={styles.expandedText}>
                          {raceDesc[race.index as keyof typeof raceDesc] || 'No description available.'}
                        </Text>
                        {race.ability_bonuses && race.ability_bonuses.length > 0 && (
                          <View style={styles.bonusSection}>
                            <Text style={styles.bonusTitle}>Ability Score Bonuses:</Text>
                            {race.ability_bonuses.map((bonus, index) => (
                              <Text key={index} style={styles.bonusText}>
                                +{bonus.bonus} {bonus.ability_score.name}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Class Selection */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Class</Text>
              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {classes.map((cls) => (
                  <View key={cls.index} style={styles.optionContainer}>
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        selectedClass?.index === cls.index && styles.selectedOption
                      ]}
                      onPress={() => {
                        setSelectedClass(cls);
                        setExpandedClass(expandedClass === cls.index ? null : cls.index);
                      }}
                    >
                      <View style={styles.optionHeader}>
                        <Text style={[
                          styles.optionText,
                          selectedClass?.index === cls.index && styles.selectedOptionText
                        ]}>
                          {cls.name}
                        </Text>
                        {expandedClass === cls.index ? (
                          <ChevronUp size={20} color={selectedClass?.index === cls.index ? "#fff" : "#888"} />
                        ) : (
                          <ChevronDown size={20} color={selectedClass?.index === cls.index ? "#fff" : "#888"} />
                        )}
                      </View>
                    </TouchableOpacity>
                    {expandedClass === cls.index && (
                      <View style={styles.expandedContent}>
                        <Text style={styles.expandedText}>
                          {classDesc[cls.index as keyof typeof classDesc] || 'No description available.'}
                        </Text>
                        <View style={styles.classStatsSection}>
                          <Text style={styles.classStatText}>Hit Die: d{cls.hit_die}</Text>
                          {cls.spellcasting && (
                            <Text style={styles.classStatText}>Spellcaster</Text>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Ability Scores</Text>
            <Text style={styles.stepDescription}>
              Distribute points among your abilities (Point Buy System)
            </Text>
            
            <View style={styles.pointBuyInfo}>
              <Text style={styles.pointsRemaining}>
                Points Remaining: {getRemainingPoints()}/{TOTAL_POINTS}
              </Text>
            </View>
            
            {Object.entries(abilities).map(([ability, value]) => {
              const finalScore = getFinalAbilityScore(ability);
              const modifier = getAbilityModifier(finalScore);
              const raceBonus = finalScore - value;
              
              return (
                <View key={ability} style={styles.abilityRow}>
                  <View style={styles.abilityInfo}>
                    <Text style={styles.abilityName}>
                      {ability.charAt(0).toUpperCase() + ability.slice(1)}
                    </Text>
                    <View style={styles.abilityScores}>
                      <Text style={styles.abilityScore}>
                        {value}
                        {raceBonus > 0 && <Text style={styles.raceBonus}> +{raceBonus}</Text>}
                        {raceBonus > 0 && <Text style={styles.finalScore}> = {finalScore}</Text>}
                      </Text>
                      <Text style={styles.abilityModifier}>
                        ({modifier >= 0 ? '+' : ''}{modifier})
                      </Text>
                    </View>
                  </View>
                  <View style={styles.abilityControls}>
                    <TouchableOpacity
                      style={[
                        styles.abilityButton,
                        !canDecreaseAbility(value) && styles.disabledButton
                      ]}
                      onPress={() => adjustAbility(ability, -1)}
                      disabled={!canDecreaseAbility(value)}
                    >
                      <Minus size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.abilityButton,
                        !canIncreaseAbility(ability, value) && styles.disabledButton
                      ]}
                      onPress={() => adjustAbility(ability, 1)}
                      disabled={!canIncreaseAbility(ability, value)}
                    >
                      <Plus size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        );

      case 3:
        const availableSkills = getAvailableSkills();
        const maxSkills = getMaxSkills();

        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Skills</Text>
            <Text style={styles.stepDescription}>
              Choose skills your character is proficient in
            </Text>
            
            {maxSkills > 0 && (
              <Text style={styles.skillLimit}>
                Choose {maxSkills} skills ({selectedSkills.length}/{maxSkills} selected)
              </Text>
            )}

            {availableSkills.length > 0 ? (
              <ScrollView style={styles.skillsList} showsVerticalScrollIndicator={false}>
                {availableSkills.map((skillName, index) => {
                  const isSelected = selectedSkills.includes(skillName);
                  const canSelect = isSelected || selectedSkills.length < maxSkills;
                  const skillKey = skillName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
                  const skillStat = skillsStat[skillKey as keyof typeof skillsStat] || 'Unknown';

                  return (
                    <View key={index} style={styles.skillContainer}>
                      <TouchableOpacity
                        style={[
                          styles.skillItem,
                          isSelected && styles.selectedSkill,
                          !canSelect && styles.disabledSkill
                        ]}
                        onPress={() => {
                          if (canSelect) {
                            toggleSkill(skillName);
                          }
                          setExpandedSkill(expandedSkill === skillName ? null : skillName);
                        }}
                        disabled={!canSelect && !isSelected}
                      >
                        <View style={styles.skillHeader}>
                          <View style={styles.skillInfo}>
                            <Text style={[
                              styles.skillText,
                              isSelected && styles.selectedSkillText,
                              !canSelect && styles.disabledSkillText
                            ]}>
                              {skillName}
                            </Text>
                            <Text style={[
                              styles.skillStat,
                              isSelected && styles.selectedSkillText,
                              !canSelect && styles.disabledSkillText
                            ]}>
                              ({skillStat})
                            </Text>
                          </View>
                          {expandedSkill === skillName ? (
                            <ChevronUp size={16} color={isSelected ? "#fff" : "#888"} />
                          ) : (
                            <ChevronDown size={16} color={isSelected ? "#fff" : "#888"} />
                          )}
                        </View>
                      </TouchableOpacity>
                      {expandedSkill === skillName && (
                        <View style={styles.skillDescription}>
                          <Text style={styles.skillDescriptionText}>
                            {skillsDesc[skillKey as keyof typeof skillsDesc] || 'No description available.'}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.noSkillsContainer}>
                <Text style={styles.noSkillsText}>
                  Your class doesn't have skill proficiency choices at level 1.
                </Text>
              </View>
            )}
          </View>
        );

      case 4:
        const categories = getEquipmentCategories();

        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Equipment</Text>
            <Text style={styles.stepDescription}>
              Purchase equipment with your starting gold
            </Text>
            
            <View style={styles.currencyDisplay}>
              <Text style={styles.currencyText}>
                {gold}gp {silver}sp {copper}cp
              </Text>
            </View>

            {/* Equipment Categories */}
            <View style={styles.categorySelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedEquipmentCategory === category && styles.selectedCategoryButton
                    ]}
                    onPress={() => setSelectedEquipmentCategory(category)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      selectedEquipmentCategory === category && styles.selectedCategoryButtonText
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Equipment List */}
            <ScrollView style={styles.equipmentList} showsVerticalScrollIndicator={false}>
              {getEquipmentByCategory(selectedEquipmentCategory).map((item) => {
                const canAfford = canAffordEquipment(item, gold, silver, copper);
                const isPurchased = purchasedEquipment.some(p => p.id === item.id);
                
                return (
                  <View key={item.id} style={styles.equipmentItem}>
                    <View style={styles.equipmentInfo}>
                      <Text style={styles.equipmentName}>{item.name}</Text>
                      <Text style={styles.equipmentCost}>
                        {item.cost_quantity} {item.cost_unit}
                      </Text>
                      {item.description && (
                        <Text style={styles.equipmentDescription} numberOfLines={2}>
                          {Array.isArray(item.description) ? item.description.join(' ') : item.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.equipmentActions}>
                      {isPurchased ? (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveEquipment(item)}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.buyButton,
                            !canAfford && styles.disabledBuyButton
                          ]}
                          onPress={() => handlePurchaseEquipment(item)}
                          disabled={!canAfford}
                        >
                          <Text style={[
                            styles.buyButtonText,
                            !canAfford && styles.disabledBuyButtonText
                          ]}>
                            Buy
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Purchased Equipment Summary */}
            {purchasedEquipment.length > 0 && (
              <View style={styles.purchasedSection}>
                <Text style={styles.purchasedTitle}>Purchased Equipment:</Text>
                <View style={styles.purchasedList}>
                  {purchasedEquipment.map((item, index) => (
                    <Text key={index} style={styles.purchasedItem}>
                      • {item.name}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      case 5:
        const spellcastingInfo = getSpellcastingInfo();
        const availableSpellLevels = getAvailableSpellLevels();

        if (!spellcastingInfo) {
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Spells</Text>
              <Text style={styles.stepDescription}>
                Your class doesn't have spellcasting abilities at level 1.
              </Text>
              <View style={styles.noSpellsContainer}>
                <Text style={styles.noSpellsText}>
                  {selectedClass?.name} characters gain spellcasting abilities at higher levels.
                </Text>
              </View>
            </View>
          );
        }

        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Spells</Text>
            <Text style={styles.stepDescription}>
              Choose your starting spells
            </Text>

            {/* Spell Level Selector */}
            {availableSpellLevels.length > 1 && (
              <View style={styles.spellLevelSelector}>
                {availableSpellLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.spellLevelButton,
                      selectedSpellLevel === level.value && styles.selectedSpellLevelButton
                    ]}
                    onPress={() => setSelectedSpellLevel(level.value)}
                  >
                    <Text style={[
                      styles.spellLevelButtonText,
                      selectedSpellLevel === level.value && styles.selectedSpellLevelButtonText
                    ]}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Spell List */}
            <View style={styles.spellSection}>
              <Text style={styles.spellSectionTitle}>
                {selectedSpellLevel === 0 ? 'Cantrips' : `Level ${selectedSpellLevel} Spells`}
                <Text style={styles.spellCount}>
                  {' '}({getSelectedSpellsByLevel(selectedSpellLevel).length}/{getMaxSpellsForLevel(selectedSpellLevel)})
                </Text>
              </Text>

              <ScrollView style={styles.spellsList} showsVerticalScrollIndicator={false}>
                {getSpellsByLevel(selectedSpellLevel).map((spell) => {
                  const isSelected = selectedSpells.some(s => s.index === spell.index);
                  const selectedAtLevel = getSelectedSpellsByLevel(selectedSpellLevel);
                  const maxAtLevel = getMaxSpellsForLevel(selectedSpellLevel);
                  const canSelect = isSelected || selectedAtLevel.length < maxAtLevel;

                  return (
                    <View key={spell.index} style={styles.spellContainer}>
                      <TouchableOpacity
                        style={[
                          styles.spellItem,
                          isSelected && styles.selectedSpell,
                          !canSelect && styles.disabledSpell
                        ]}
                        onPress={() => {
                          if (canSelect) {
                            toggleSpell(spell);
                          }
                          setExpandedSpell(expandedSpell === spell.index ? null : spell.index);
                        }}
                        disabled={!canSelect && !isSelected}
                      >
                        <View style={styles.spellHeader}>
                          <View style={styles.spellInfo}>
                            <Text style={[
                              styles.spellText,
                              isSelected && styles.selectedSpellText,
                              !canSelect && styles.disabledSpellText
                            ]}>
                              {spell.name}
                            </Text>
                            <Text style={[
                              styles.spellSchool,
                              isSelected && styles.selectedSpellText,
                              !canSelect && styles.disabledSpellText
                            ]}>
                              {spell.school?.name || 'Unknown School'}
                            </Text>
                          </View>
                          {expandedSpell === spell.index ? (
                            <ChevronUp size={16} color={isSelected ? "#fff" : "#888"} />
                          ) : (
                            <ChevronDown size={16} color={isSelected ? "#fff" : "#888"} />
                          )}
                        </View>
                      </TouchableOpacity>
                      {expandedSpell === spell.index && (
                        <View style={styles.spellDetails}>
                          <Text style={styles.spellProperty}>Casting Time: {spell.casting_time}</Text>
                          <Text style={styles.spellProperty}>Range: {spell.range}</Text>
                          <Text style={styles.spellProperty}>Duration: {spell.duration}</Text>
                          <Text style={styles.spellProperty}>Components: {spell.components.join(', ')}</Text>
                          {spell.concentration && (
                            <Text style={styles.spellProperty}>Concentration</Text>
                          )}
                          {spell.description && spell.description.map((desc, i) => (
                            <Text key={i} style={styles.spellDescription}>{desc}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review Character</Text>
            <Text style={styles.stepDescription}>
              Review your character before saving
            </Text>

            <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
              {/* Basic Info */}
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Basic Information</Text>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Name:</Text>
                  <Text style={styles.reviewValue}>{characterName}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Race:</Text>
                  <Text style={styles.reviewValue}>{selectedRace?.name}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Class:</Text>
                  <Text style={styles.reviewValue}>{selectedClass?.name}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Level:</Text>
                  <Text style={styles.reviewValue}>1</Text>
                </View>
              </View>

              {/* Ability Scores */}
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Ability Scores</Text>
                {Object.entries(abilities).map(([ability, value]) => {
                  const finalScore = getFinalAbilityScore(ability);
                  const modifier = getAbilityModifier(finalScore);
                  
                  return (
                    <View key={ability} style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>
                        {ability.charAt(0).toUpperCase() + ability.slice(1)}:
                      </Text>
                      <Text style={styles.reviewValue}>
                        {finalScore} ({modifier >= 0 ? '+' : ''}{modifier})
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Skills */}
              {selectedSkills.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Skills</Text>
                  <Text style={styles.reviewValue}>
                    {selectedSkills.join(', ')}
                  </Text>
                </View>
              )}

              {/* Spells */}
              {selectedSpells.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Spells</Text>
                  <Text style={styles.reviewValue}>
                    {selectedSpells.map(s => s.name).join(', ')}
                  </Text>
                </View>
              )}

              {/* Equipment */}
              {purchasedEquipment.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Equipment</Text>
                  <Text style={styles.reviewValue}>
                    {purchasedEquipment.map(item => item.name).join(', ')}
                  </Text>
                </View>
              )}

              {/* Currency */}
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Remaining Currency</Text>
                <Text style={styles.reviewValue}>
                  {gold}gp {silver}sp {copper}cp
                </Text>
              </View>

              {returnToCampaign && (
                <View style={styles.campaignNotice}>
                  <Text style={styles.campaignNoticeText}>
                    This character will be assigned to the campaign you joined.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Character</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentStep + 1) / CREATION_STEPS.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {CREATION_STEPS.length}: {CREATION_STEPS[currentStep].title}
        </Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderStepContent()}
      </ScrollView>

      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevious}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}

        {currentStep < CREATION_STEPS.length - 1 ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              !canProceed() && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.saveButton,
              (!canProceed() || isLoading) && styles.disabledButton
            ]}
            onPress={handleSaveCharacter}
            disabled={!canProceed() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.navButtonText}>Save Character</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isVisible={isAvatarSelectorVisible}
        onClose={() => setIsAvatarSelectorVisible(false)}
        onAvatarSelect={(avatarUrl) => {
          setSelectedAvatar(avatarUrl);
          setIsAvatarSelectorVisible(false);
        }}
        currentAvatar={selectedAvatar}
        userId={user?.id || ''}
      />
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
  },
  progressContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  stepContent: {
    flex: 1,
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
    marginBottom: 24,
    lineHeight: 22,
  },
  
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarOverlay: {
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

  // Input Section
  inputSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },

  // Selection Section
  selectionSection: {
    marginBottom: 24,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionContainer: {
    marginBottom: 8,
  },
  optionItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  selectedOptionText: {
    fontFamily: 'Inter-Bold',
  },
  expandedContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  expandedText: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  bonusSection: {
    marginTop: 8,
  },
  bonusTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  bonusText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  classStatsSection: {
    marginTop: 8,
  },
  classStatText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },

  // Point Buy Section
  pointBuyInfo: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  pointsRemaining: {
    color: '#4CAF50',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  abilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  abilityInfo: {
    flex: 1,
  },
  abilityName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  abilityScores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  abilityScore: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  raceBonus: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  finalScore: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  abilityModifier: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  abilityControls: {
    flexDirection: 'row',
    gap: 8,
  },
  abilityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.5,
  },

  // Skills Section
  skillLimit: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    textAlign: 'center',
  },
  skillsList: {
    maxHeight: 400,
  },
  skillContainer: {
    marginBottom: 8,
  },
  skillItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
  },
  selectedSkill: {
    backgroundColor: '#4CAF50',
  },
  disabledSkill: {
    backgroundColor: '#1a1a1a',
    opacity: 0.5,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillInfo: {
    flex: 1,
  },
  skillText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedSkillText: {
    fontFamily: 'Inter-Bold',
  },
  disabledSkillText: {
    color: '#666',
  },
  skillStat: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  skillDescription: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  skillDescriptionText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  noSkillsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  noSkillsText: {
    color: '#888',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },

  // Equipment Section
  currencyDisplay: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  currencyText: {
    color: '#4CAF50',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  categorySelector: {
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#4CAF50',
  },
  categoryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedCategoryButtonText: {
    fontFamily: 'Inter-Bold',
  },
  equipmentList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  equipmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  equipmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  equipmentName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  equipmentCost: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  equipmentDescription: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  equipmentActions: {
    alignItems: 'flex-end',
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  disabledBuyButton: {
    backgroundColor: '#666',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  disabledBuyButtonText: {
    color: '#ccc',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  purchasedSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
  },
  purchasedTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  purchasedList: {
    gap: 4,
  },
  purchasedItem: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },

  // Spells Section
  spellLevelSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  spellLevelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  selectedSpellLevelButton: {
    backgroundColor: '#4CAF50',
  },
  spellLevelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedSpellLevelButtonText: {
    fontFamily: 'Inter-Bold',
  },
  spellSection: {
    marginBottom: 16,
  },
  spellSectionTitle: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  spellCount: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  spellsList: {
    maxHeight: 400,
  },
  spellContainer: {
    marginBottom: 8,
  },
  spellItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
  },
  selectedSpell: {
    backgroundColor: '#4CAF50',
  },
  disabledSpell: {
    backgroundColor: '#1a1a1a',
    opacity: 0.5,
  },
  spellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spellInfo: {
    flex: 1,
  },
  spellText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedSpellText: {
    fontFamily: 'Inter-Bold',
  },
  disabledSpellText: {
    color: '#666',
  },
  spellSchool: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  spellDetails: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  spellProperty: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  spellDescription: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
    marginTop: 8,
  },
  noSpellsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  noSpellsText: {
    color: '#888',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },

  // Review Section
  reviewContainer: {
    maxHeight: 400,
  },
  reviewSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reviewSectionTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewLabel: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  reviewValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 2,
    textAlign: 'right',
  },
  campaignNotice: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  campaignNoticeText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },

  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});