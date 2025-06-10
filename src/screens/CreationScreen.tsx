import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { ArrowLeft, ArrowRight, Save, User, Dices, Scroll, Package, Camera, Upload, ShieldUser, Dna, Brain, BookOpen, X, ShoppingCart, Trash2, Coins } from 'lucide-react-native';
import { router } from 'expo-router';
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
  getEquipmentCostInCopper,
  convertFromCopper,
  getStartingGold,
  STARTING_WEALTH_BY_CLASS,
  type Race,
  type Class,
  type DnDSpell,
  type DnDAbilities,
  type DnDEquipment,
  type Equipment,
} from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import { pickAndUploadAvatar, getRandomFantasyPortrait, getDefaultAvatar } from '../utils/avatarStorage';

const CREATION_STEPS = [
  { id: 0, title: 'Info', icon: User },
  { id: 1, title: 'Class', icon: ShieldUser },
  { id: 2, title: 'Race', icon: Dna },
  { id: 3, title: 'Stats', icon: Dices },
  { id: 4, title: 'Skills', icon: Brain },
  { id: 5, title: 'Spells', icon: Scroll },
  { id: 6, title: 'Equip', icon: Package },
  { id: 7, title: 'Review', icon: Save },
];

// Point buy cost chart for D&D 5e
const POINT_BUY_COSTS: { [key: number]: number } = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

const POINT_BUY_TOTAL = 27;

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
  const [characterGold, setCharacterGold] = useAtom(characterGoldAtom);
  const [characterSilver, setCharacterSilver] = useAtom(characterSilverAtom);
  const [characterCopper, setCharacterCopper] = useAtom(characterCopperAtom);
  const [purchasedEquipment, setPurchasedEquipment] = useAtom(purchasedEquipmentAtom);
  
  const [races] = useAtom(racesAtom);
  const [classes] = useAtom(classesAtom);
  const [spells] = useAtom(spellsAtom);
  const [availableEquipment] = useAtom(equipmentAtom);
  
  const [, fetchRaces] = useAtom(fetchRacesAtom);
  const [, fetchClasses] = useAtom(fetchClassesAtom);
  const [, fetchSpells] = useAtom(fetchSpellsAtom);
  const [, fetchEquipment] = useAtom(fetchEquipmentAtom);
  const [, saveCharacter] = useAtom(saveCharacterAtom);
  const [, resetCharacterCreation] = useAtom(resetCharacterCreationAtom);
  const [, setStartingWealth] = useAtom(setStartingWealthAtom);
  const [, purchaseEquipment] = useAtom(purchaseEquipmentAtom);
  const [, removeEquipment] = useAtom(removeEquipmentAtom);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showClassDetails, setShowClassDetails] = useState<Class | null>(null);
  const [showRaceDetails, setShowRaceDetails] = useState<Race | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchRaces(),
          fetchClasses(),
          fetchSpells(),
          fetchEquipment(),
        ]);
      } catch (error) {
        console.error('Error loading character creation data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchRaces, fetchClasses, fetchSpells, fetchEquipment]);

  // Set starting wealth when class is selected
  useEffect(() => {
    if (selectedClass) {
      setStartingWealth();
    }
  }, [selectedClass, setStartingWealth]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (currentStep < CREATION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const pickImage = async () => {
    if (!user) return;

    setIsUploadingAvatar(true);
    try {
      if (Platform.OS === 'web') {
        // For web, use a random fantasy portrait
        const randomPortrait = getRandomFantasyPortrait();
        setAvatarUri(randomPortrait);
      } else {
        // For mobile, use the avatar upload utility
        const result = await pickAndUploadAvatar(
          user.id,
          undefined, // No character ID yet since we're creating
          setUploadProgress
        );

        if (result.success && result.url) {
          setAvatarUri(result.url);
        } else {
          Alert.alert('Upload Failed', result.error || 'Failed to upload avatar');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select avatar');
    } finally {
      setIsUploadingAvatar(false);
      setUploadProgress('');
    }
  };

  const calculatePointsUsed = () => {
    return Object.values(abilities).reduce((total, score) => {
      return total + (POINT_BUY_COSTS[score] || 0);
    }, 0);
  };

  const getRemainingPoints = () => {
    return POINT_BUY_TOTAL - calculatePointsUsed();
  };

  const canIncreaseAbility = (ability: keyof DnDAbilities) => {
    const currentScore = abilities[ability];
    const nextScore = currentScore + 1;
    
    if (nextScore > 15) return false;
    
    const currentCost = POINT_BUY_COSTS[currentScore] || 0;
    const nextCost = POINT_BUY_COSTS[nextScore] || 0;
    const costDifference = nextCost - currentCost;
    
    return getRemainingPoints() >= costDifference;
  };

  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const getFinalAbilityScore = (ability: keyof DnDAbilities) => {
    let baseScore = abilities[ability];
    
    // Add racial bonuses
    if (selectedRace?.ability_bonuses) {
      const bonus = selectedRace.ability_bonuses.find(
        (bonus) => bonus.ability_score.index === ability.substring(0, 3)
      );
      if (bonus) {
        baseScore += bonus.bonus;
      }
    }
    
    return baseScore;
  };

  const calculateHitPoints = () => {
    if (!selectedClass) return 8;
    
    const hitDie = selectedClass.hit_die;
    const conModifier = getAbilityModifier(getFinalAbilityScore('constitution'));
    
    // Max hit die + CON modifier (minimum 1)
    return Math.max(1, hitDie + conModifier);
  };

  const calculateArmorClass = () => {
    const dexModifier = getAbilityModifier(getFinalAbilityScore('dexterity'));
    
    // Find equipped armor
    const equippedArmor = purchasedEquipment.find(item => 
      item.type === 'armor' && item.category !== 'shield'
    );
    
    if (equippedArmor && equippedArmor.properties) {
      const armorProps = equippedArmor.properties as any;
      let ac = armorProps.ac || 10;
      
      // Apply DEX modifier based on armor type
      if (armorProps.dex_bonus === 'full') {
        ac += dexModifier;
      } else if (armorProps.dex_bonus === 'max_2') {
        ac += Math.min(2, dexModifier);
      }
      
      return ac;
    }
    
    // No armor: 10 + DEX modifier
    return 10 + dexModifier;
  };

  const formatCurrency = (gold: number, silver: number, copper: number) => {
    const parts = [];
    if (gold > 0) parts.push(`${gold} gp`);
    if (silver > 0) parts.push(`${silver} sp`);
    if (copper > 0) parts.push(`${copper} cp`);
    return parts.length > 0 ? parts.join(', ') : '0 cp';
  };

  const getEquipmentCategories = () => {
    const categories = ['all', ...new Set(availableEquipment.map(item => item.category))];
    return categories.filter(Boolean);
  };

  const getFilteredEquipment = () => {
    if (equipmentFilter === 'all') {
      return availableEquipment;
    }
    return availableEquipment.filter(item => item.category === equipmentFilter);
  };

  const handlePurchaseEquipment = (item: Equipment) => {
    try {
      purchaseEquipment(item);
    } catch (error) {
      Alert.alert('Cannot Purchase', 'You cannot afford this item.');
    }
  };

  const handleRemoveEquipment = (item: Equipment) => {
    removeEquipment(item);
  };

  const formatEquipmentCost = (item: Equipment) => {
    const { cost_quantity, cost_unit } = item;
    return `${cost_quantity} ${cost_unit}`;
  };

  const handleSaveCharacter = async () => {
    if (!user || !characterName || !selectedRace || !selectedClass) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const hitPoints = calculateHitPoints();
      const armorClass = calculateArmorClass();

      const characterData = {
        user_id: user.id,
        name: characterName,
        race: selectedRace.name,
        class: selectedClass.name,
        background: 'Folk Hero', // Default background for now
        level: 1,
        abilities,
        skills: selectedSkills,
        spells: selectedSpells,
        equipment,
        current_hitpoints: hitPoints,
        max_hitpoints: hitPoints,
        temp_hitpoints: 0,
        armor_class: armorClass,
        conditions: [],
        gold: characterGold,
        silver: characterSilver,
        copper: characterCopper,
        character_data: {
          race: selectedRace,
          class: selectedClass,
          abilities,
          skills: selectedSkills,
          spells: selectedSpells,
          equipment,
          purchasedEquipment,
          avatar: avatarUri || getDefaultAvatar(selectedClass.name),
        },
      };

      await saveCharacter(characterData);
      
      Alert.alert(
        'Success!',
        'Your character has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              resetCharacterCreation();
              setAvatarUri(null);
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving character:', error);
      Alert.alert('Error', 'Failed to save character. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <ScrollView 
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.stepIndicator}
        contentContainerStyle={styles.stepIndicatorContent}
      >
        {CREATION_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isCompleted && styles.stepCircleCompleted,
              ]}>
                <Icon 
                  size={16} 
                  color={isActive || isCompleted ? '#fff' : '#666'} 
                />
              </View>
              <Text style={[
                styles.stepText,
                isActive && styles.stepTextActive,
              ]}>
                {step.title}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Character Details</Text>
      
      <View style={styles.avatarSection}>
        <Text style={styles.avatarLabel}>Character Portrait</Text>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={isUploadingAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Camera size={32} color="#666" />
              <Text style={styles.avatarPlaceholderText}>Add Portrait</Text>
            </View>
          )}
          {isUploadingAvatar && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#4CAF50" />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.uploadButton, isUploadingAvatar && styles.uploadButtonDisabled]} 
          onPress={pickImage}
          disabled={isUploadingAvatar}
        >
          <Upload size={16} color="#4CAF50" />
          <Text style={styles.uploadButtonText}>
            {isUploadingAvatar 
              ? (uploadProgress || 'Uploading...') 
              : (avatarUri ? 'Change Portrait' : 'Upload Portrait')
            }
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>Character Name</Text>
      <TextInput
        style={styles.input}
        value={characterName}
        onChangeText={setCharacterName}
        placeholder="Enter character name"
        placeholderTextColor="#666"
      />
    </View>
  );

  const renderClassSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Your Class</Text>
      <Text style={styles.subtitle}>Your class determines your abilities, skills, and role in the party</Text>
      <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
        {classes.map((cls) => {
          const wealthData = STARTING_WEALTH_BY_CLASS[cls.name];
          
          return (
            <TouchableOpacity
              key={cls.index}
              style={[
                styles.classOptionItem,
                selectedClass?.index === cls.index && styles.optionItemSelected,
              ]}
              onPress={() => setSelectedClass(cls)}
            >
              <View style={styles.classOptionContent}>
                <View style={styles.classOptionHeader}>
                  <Text style={[
                    styles.classOptionTitle,
                    selectedClass?.index === cls.index && styles.optionTextSelected,
                  ]}>
                    {cls.name}
                  </Text>
                  {wealthData && (
                    <View style={styles.goldBadge}>
                      <Coins size={14} color="#FFD700" />
                      <Text style={styles.goldBadgeText}>{wealthData.maxRoll} gp</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.classOptionDescription,
                  selectedClass?.index === cls.index && styles.classOptionDescriptionSelected,
                ]}>
                  Hit Die: d{cls.hit_die} • {cls.spellcasting ? 'Spellcaster' : 'Non-spellcaster'}
                </Text>
                {wealthData && (
                  <Text style={[
                    styles.classWealthInfo,
                    selectedClass?.index === cls.index && styles.classWealthInfoSelected,
                  ]}>
                    Starting Wealth: {wealthData.dice} × {wealthData.multiplier} gp
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => setShowClassDetails(cls)}
              >
                <BookOpen size={20} color={selectedClass?.index === cls.index ? '#fff' : '#4CAF50'} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderRaceSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Your Race</Text>
      <Text style={styles.subtitle}>Your race provides ability bonuses and special traits</Text>
      <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
        {races.map((race) => (
          <TouchableOpacity
            key={race.index}
            style={[
              styles.raceOptionItem,
              selectedRace?.index === race.index && styles.optionItemSelected,
            ]}
            onPress={() => setSelectedRace(race)}
          >
            <View style={styles.raceOptionContent}>
              <Text style={[
                styles.raceOptionTitle,
                selectedRace?.index === race.index && styles.optionTextSelected,
              ]}>
                {race.name}
              </Text>
              <Text style={[
                styles.raceOptionDescription,
                selectedRace?.index === race.index && styles.raceOptionDescriptionSelected,
              ]}>
                Size: {race.size} • Speed: {race.speed} ft
              </Text>
              {race.ability_bonuses && race.ability_bonuses.length > 0 && (
                <Text style={[
                  styles.raceAbilityBonuses,
                  selectedRace?.index === race.index && styles.raceAbilityBonusesSelected,
                ]}>
                  Bonuses: {race.ability_bonuses.map(bonus => 
                    `+${bonus.bonus} ${bonus.ability_score.name}`
                  ).join(', ')}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => setShowRaceDetails(race)}
            >
              <BookOpen size={20} color={selectedRace?.index === race.index ? '#fff' : '#4CAF50'} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAbilities = () => {
    const abilityNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const remainingPoints = getRemainingPoints();
    
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Ability Scores (Point Buy)</Text>
        <Text style={styles.subtitle}>
          You have {POINT_BUY_TOTAL} points to spend. Remaining: {remainingPoints}
        </Text>
        
        <View style={styles.pointBuyRules}>
          <Text style={styles.rulesTitle}>Point Buy Rules:</Text>
          <Text style={styles.rulesText}>• Scores range from 8-15 (before racial bonuses)</Text>
          <Text style={styles.rulesText}>• Cost increases as scores get higher</Text>
          <Text style={styles.rulesText}>• You can freely mix and match as long as total cost ≤ 27</Text>
          
          <View style={styles.costChart}>
            <Text style={styles.costChartTitle}>Cost Chart:</Text>
            <View style={styles.costChartGrid}>
              {Object.entries(POINT_BUY_COSTS).map(([score, cost]) => (
                <View key={score} style={styles.costChartItem}>
                  <Text style={styles.costChartScore}>{score}</Text>
                  <Text style={styles.costChartCost}>{cost}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {abilityNames.map((ability) => {
          const baseScore = abilities[ability as keyof DnDAbilities];
          const finalScore = getFinalAbilityScore(ability as keyof DnDAbilities);
          const modifier = getAbilityModifier(finalScore);
          const racialBonus = finalScore - baseScore;
          
          return (
            <View key={ability} style={styles.abilityRow}>
              <View style={styles.abilityInfo}>
                <Text style={styles.abilityLabel}>
                  {ability.charAt(0).toUpperCase() + ability.slice(1)}
                </Text>
                <View style={styles.abilityScores}>
                  <Text style={styles.abilityBaseScore}>{baseScore}</Text>
                  {racialBonus > 0 && (
                    <Text style={styles.abilityRacialBonus}>+{racialBonus}</Text>
                  )}
                  <Text style={styles.abilityFinalScore}>= {finalScore}</Text>
                  <Text style={styles.abilityModifier}>
                    ({modifier >= 0 ? '+' : ''}{modifier})
                  </Text>
                </View>
              </View>
              <View style={styles.abilityControls}>
                <TouchableOpacity
                  style={[
                    styles.abilityButton,
                    baseScore <= 8 && styles.abilityButtonDisabled,
                  ]}
                  onPress={() => setAbilities(prev => ({
                    ...prev,
                    [ability]: Math.max(8, prev[ability as keyof DnDAbilities] - 1)
                  }))}
                  disabled={baseScore <= 8}
                >
                  <Text style={styles.abilityButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.abilityButton,
                    !canIncreaseAbility(ability as keyof DnDAbilities) && styles.abilityButtonDisabled,
                  ]}
                  onPress={() => setAbilities(prev => ({
                    ...prev,
                    [ability]: Math.min(15, prev[ability as keyof DnDAbilities] + 1)
                  }))}
                  disabled={!canIncreaseAbility(ability as keyof DnDAbilities)}
                >
                  <Text style={styles.abilityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        
        <View style={styles.pointSummary}>
          <Text style={styles.pointSummaryText}>
            Points Used: {calculatePointsUsed()} / {POINT_BUY_TOTAL}
          </Text>
          {remainingPoints < 0 && (
            <Text style={styles.pointsOverLimit}>
              Over limit by {Math.abs(remainingPoints)} points!
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderSkills = () => {
    const availableSkills = [
      'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
      'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
      'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
      'Sleight of Hand', 'Stealth', 'Survival'
    ];

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Choose Skills</Text>
        <Text style={styles.subtitle}>Select up to 4 skills your character is proficient in</Text>
        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          {availableSkills.map((skill) => (
            <TouchableOpacity
              key={skill}
              style={[
                styles.optionItem,
                selectedSkills.includes(skill) && styles.optionItemSelected,
              ]}
              onPress={() => {
                if (selectedSkills.includes(skill)) {
                  setSelectedSkills(prev => prev.filter(s => s !== skill));
                } else if (selectedSkills.length < 4) {
                  setSelectedSkills(prev => [...prev, skill]);
                }
              }}
              disabled={!selectedSkills.includes(skill) && selectedSkills.length >= 4}
            >
              <Text style={[
                styles.optionText,
                selectedSkills.includes(skill) && styles.optionTextSelected,
                !selectedSkills.includes(skill) && selectedSkills.length >= 4 && styles.optionTextDisabled,
              ]}>
                {skill}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSpells = () => {
    if (!selectedClass || !selectedClass.spellcasting) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Spells</Text>
          <Text style={styles.subtitle}>This class doesn't have spellcasting abilities.</Text>
          <View style={styles.noSpellsContainer}>
            <Text style={styles.noSpellsText}>
              {selectedClass?.name} is a martial class that relies on physical prowess rather than magic.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Choose Spells</Text>
        <Text style={styles.subtitle}>Select cantrips and 1st level spells for your spellcaster</Text>
        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          {spells.map((spell) => (
            <TouchableOpacity
              key={spell.index}
              style={[
                styles.spellOptionItem,
                selectedSpells.some(s => s.index === spell.index) && styles.optionItemSelected,
              ]}
              onPress={() => {
                if (selectedSpells.some(s => s.index === spell.index)) {
                  setSelectedSpells(prev => prev.filter(s => s.index !== spell.index));
                } else if (selectedSpells.length < 6) {
                  setSelectedSpells(prev => [...prev, spell]);
                }
              }}
              disabled={!selectedSpells.some(s => s.index === spell.index) && selectedSpells.length >= 6}
            >
              <View style={styles.spellOptionContent}>
                <Text style={[
                  styles.spellOptionTitle,
                  selectedSpells.some(s => s.index === spell.index) && styles.optionTextSelected,
                ]}>
                  {spell.name}
                </Text>
                <Text style={[
                  styles.spellOptionLevel,
                  selectedSpells.some(s => s.index === spell.index) && styles.spellOptionLevelSelected,
                ]}>
                  {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.school.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEquipment = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Purchase Equipment</Text>
      <Text style={styles.subtitle}>Use your starting gold to buy equipment for your adventure</Text>
      
      {/* Currency Display */}
      <View style={styles.currencyContainer}>
        <View style={styles.currencyDisplay}>
          <Coins size={20} color="#FFD700" />
          <Text style={styles.currencyText}>
            {formatCurrency(characterGold, characterSilver, characterCopper)}
          </Text>
        </View>
      </View>

      {/* Equipment Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        {getEquipmentCategories().map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              equipmentFilter === category && styles.categoryButtonActive,
            ]}
            onPress={() => setEquipmentFilter(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              equipmentFilter === category && styles.categoryButtonTextActive,
            ]}>
              {category === 'all' ? 'All' : category.replace(/^\w/, c => c.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Equipment List */}
      <ScrollView style={styles.equipmentList} showsVerticalScrollIndicator={false}>
        {getFilteredEquipment().map((item) => {
          const canAfford = canAffordEquipment(item, characterGold, characterSilver, characterCopper);
          const isPurchased = purchasedEquipment.some(purchased => purchased.id === item.id);
          
          return (
            <View key={item.id} style={[
              styles.equipmentItem,
              !canAfford && !isPurchased && styles.equipmentItemDisabled,
              isPurchased && styles.equipmentItemPurchased,
            ]}>
              <View style={styles.equipmentInfo}>
                <Text style={[
                  styles.equipmentName,
                  !canAfford && !isPurchased && styles.equipmentNameDisabled,
                  isPurchased && styles.equipmentNamePurchased,
                ]}>
                  {item.name}
                </Text>
                <Text style={[
                  styles.equipmentDetails,
                  !canAfford && !isPurchased && styles.equipmentDetailsDisabled,
                  isPurchased && styles.equipmentDetailsPurchased,
                ]}>
                  {item.category} • {item.weight} lb • {formatEquipmentCost(item)}
                </Text>
                {item.description && item.description.length > 0 && (
                  <Text style={[
                    styles.equipmentDescription,
                    !canAfford && !isPurchased && styles.equipmentDescriptionDisabled,
                    isPurchased && styles.equipmentDescriptionPurchased,
                  ]} numberOfLines={2}>
                    {item.description[0]}
                  </Text>
                )}
              </View>
              
              <View style={styles.equipmentActions}>
                {isPurchased ? (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveEquipment(item)}
                  >
                    <Trash2 size={20} color="#f44336" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.purchaseButton,
                      !canAfford && styles.purchaseButtonDisabled,
                    ]}
                    onPress={() => handlePurchaseEquipment(item)}
                    disabled={!canAfford}
                  >
                    <ShoppingCart size={20} color={canAfford ? '#4CAF50' : '#666'} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Purchased Equipment Summary */}
      {purchasedEquipment.length > 0 && (
        <View style={styles.purchasedSummary}>
          <Text style={styles.purchasedTitle}>Purchased Equipment ({purchasedEquipment.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.purchasedList}>
            {purchasedEquipment.map((item) => (
              <View key={item.id} style={styles.purchasedItem}>
                <Text style={styles.purchasedItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.purchasedItemCost}>{formatEquipmentCost(item)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Character Review</Text>
      
      {avatarUri && (
        <View style={styles.reviewAvatarContainer}>
          <Image source={{ uri: avatarUri }} style={styles.reviewAvatar} />
        </View>
      )}
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Name:</Text>
        <Text style={styles.reviewValue}>{characterName}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Class:</Text>
        <Text style={styles.reviewValue}>{selectedClass?.name}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Race:</Text>
        <Text style={styles.reviewValue}>{selectedRace?.name}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Level:</Text>
        <Text style={styles.reviewValue}>1</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Hit Points:</Text>
        <Text style={styles.reviewValue}>{calculateHitPoints()}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Armor Class:</Text>
        <Text style={styles.reviewValue}>{calculateArmorClass()}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Abilities:</Text>
        <Text style={styles.reviewValue}>
          STR {getFinalAbilityScore('strength')}, DEX {getFinalAbilityScore('dexterity')}, CON {getFinalAbilityScore('constitution')}, INT {getFinalAbilityScore('intelligence')}, WIS {getFinalAbilityScore('wisdom')}, CHA {getFinalAbilityScore('charisma')}
        </Text>
      </View>

      {selectedSkills.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Skills:</Text>
          <Text style={styles.reviewValue}>{selectedSkills.join(', ')}</Text>
        </View>
      )}

      {selectedSpells.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Spells:</Text>
          <Text style={styles.reviewValue}>
            {selectedSpells.map(spell => 
              `${spell.name}(${spell.level === 0 ? 'c' : spell.level})`
            ).join(', ')}
          </Text>
        </View>
      )}

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Remaining Currency:</Text>
        <Text style={styles.reviewValue}>
          {formatCurrency(characterGold, characterSilver, characterCopper)}
        </Text>
      </View>

      {purchasedEquipment.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Equipment:</Text>
          <Text style={styles.reviewValue}>
            {purchasedEquipment.map(item => item.name).join(', ')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSaveCharacter}
        disabled={isSaving}
      >
        {isSaving ? (
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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderBasicInfo();
      case 1: return renderClassSelection();
      case 2: return renderRaceSelection();
      case 3: return renderAbilities();
      case 4: return renderSkills();
      case 5: return renderSpells();
      case 6: return renderEquipment();
      case 7: return renderReview();
      default: return renderBasicInfo();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return characterName.length > 0;
      case 1: return selectedClass !== null;
      case 2: return selectedRace !== null;
      case 3: return getRemainingPoints() >= 0; // Must not exceed point limit
      case 4: return true; // Skills are optional
      case 5: return true; // Spells are optional
      case 6: return true; // Equipment is optional
      case 7: return true; // Review step
      default: return false;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading character creation...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Character</Text>
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {currentStep < CREATION_STEPS.length - 1 && (
        <View style={styles.footer}>
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

      {/* Class Details Modal */}
      <Modal
        visible={showClassDetails !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowClassDetails(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{showClassDetails?.name}</Text>
              <TouchableOpacity onPress={() => setShowClassDetails(null)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSectionTitle}>Hit Die</Text>
              <Text style={styles.modalText}>d{showClassDetails?.hit_die}</Text>
              
              {showClassDetails && STARTING_WEALTH_BY_CLASS[showClassDetails.name] && (
                <>
                  <Text style={styles.modalSectionTitle}>Starting Wealth</Text>
                  <Text style={styles.modalText}>
                    {STARTING_WEALTH_BY_CLASS[showClassDetails.name].dice} × {STARTING_WEALTH_BY_CLASS[showClassDetails.name].multiplier} gp
                  </Text>
                  <Text style={styles.modalText}>
                    Maximum: {STARTING_WEALTH_BY_CLASS[showClassDetails.name].maxRoll} gp
                  </Text>
                </>
              )}
              
              <Text style={styles.modalSectionTitle}>Proficiencies</Text>
              {showClassDetails?.proficiencies.map((prof, index) => (
                <Text key={index} style={styles.modalText}>• {prof.name}</Text>
              ))}
              
              <Text style={styles.modalSectionTitle}>Saving Throws</Text>
              {showClassDetails?.saving_throws.map((save, index) => (
                <Text key={index} style={styles.modalText}>• {save.name}</Text>
              ))}
              
              {showClassDetails?.spellcasting && (
                <>
                  <Text style={styles.modalSectionTitle}>Spellcasting</Text>
                  <Text style={styles.modalText}>
                    Spellcasting ability: {showClassDetails.spellcasting.spellcasting_ability.name}
                  </Text>
                  <Text style={styles.modalText}>
                    Spellcasting starts at level {showClassDetails.spellcasting.level}
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Race Details Modal */}
      <Modal
        visible={showRaceDetails !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRaceDetails(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{showRaceDetails?.name}</Text>
              <TouchableOpacity onPress={() => setShowRaceDetails(null)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSectionTitle}>Size & Speed</Text>
              <Text style={styles.modalText}>Size: {showRaceDetails?.size}</Text>
              <Text style={styles.modalText}>Speed: {showRaceDetails?.speed} feet</Text>
              
              <Text style={styles.modalSectionTitle}>Ability Score Increases</Text>
              {showRaceDetails?.ability_bonuses.map((bonus, index) => (
                <Text key={index} style={styles.modalText}>
                  • {bonus.ability_score.name} +{bonus.bonus}
                </Text>
              ))}
              
              <Text style={styles.modalSectionTitle}>Languages</Text>
              {showRaceDetails?.languages.map((lang, index) => (
                <Text key={index} style={styles.modalText}>• {lang.name}</Text>
              ))}
              
              <Text style={styles.modalSectionTitle}>Traits</Text>
              {showRaceDetails?.traits.map((trait, index) => (
                <Text key={index} style={styles.modalText}>• {trait.name}</Text>
              ))}
              
              {showRaceDetails?.subraces && showRaceDetails.subraces.length > 0 && (
                <>
                  <Text style={styles.modalSectionTitle}>Subraces</Text>
                  {showRaceDetails.subraces.map((subrace, index) => (
                    <Text key={index} style={styles.modalText}>• {subrace.name}</Text>
                  ))}
                </>
              )}
            </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 16,
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
  stepIndicatorContainer: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    paddingVertical: 12,
  },
  stepIndicator: {
    flexGrow: 0,
  },
  stepIndicatorContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 30,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#4CAF50',
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  stepTextActive: {
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLabel: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
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
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  optionsList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  optionItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  optionItemSelected: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  optionTextSelected: {
    fontFamily: 'Inter-Bold',
  },
  optionTextDisabled: {
    color: '#666',
  },
  classOptionItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  classOptionContent: {
    flex: 1,
  },
  classOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  classOptionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  goldBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  classOptionDescription: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  classOptionDescriptionSelected: {
    color: '#fff',
  },
  classWealthInfo: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  classWealthInfoSelected: {
    color: '#fff',
  },
  raceOptionItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  raceOptionContent: {
    flex: 1,
  },
  raceOptionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  raceOptionDescription: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  raceOptionDescriptionSelected: {
    color: '#fff',
  },
  raceAbilityBonuses: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  raceAbilityBonusesSelected: {
    color: '#fff',
  },
  detailsButton: {
    padding: 8,
    marginLeft: 12,
  },
  spellOptionItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  spellOptionContent: {
    flex: 1,
  },
  spellOptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  spellOptionLevel: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  spellOptionLevelSelected: {
    color: '#fff',
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
    textAlign: 'center',
    lineHeight: 24,
  },
  pointBuyRules: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  rulesTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  rulesText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  costChart: {
    marginTop: 12,
  },
  costChartTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  costChartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  costChartItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  costChartScore: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  costChartCost: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'Inter-Regular',
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
  abilityLabel: {
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
  abilityBaseScore: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  abilityRacialBonus: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  abilityFinalScore: {
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
    alignItems: 'center',
    gap: 12,
  },
  abilityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  abilityButtonDisabled: {
    backgroundColor: '#666',
  },
  abilityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  pointSummary: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  pointSummaryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  pointsOverLimit: {
    color: '#f44336',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  currencyContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  currencyText: {
    color: '#FFD700',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
  },
  categoryButtonText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  equipmentList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  equipmentItem: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  equipmentItemDisabled: {
    opacity: 0.5,
  },
  equipmentItemPurchased: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  equipmentNameDisabled: {
    color: '#666',
  },
  equipmentNamePurchased: {
    color: '#4CAF50',
  },
  equipmentDetails: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  equipmentDetailsDisabled: {
    color: '#555',
  },
  equipmentDetailsPurchased: {
    color: '#4CAF50',
  },
  equipmentDescription: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  equipmentDescriptionDisabled: {
    color: '#555',
  },
  equipmentDescriptionPurchased: {
    color: '#4CAF50',
  },
  equipmentActions: {
    marginLeft: 12,
  },
  purchaseButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  purchaseButtonDisabled: {
    backgroundColor: '#333',
    borderColor: '#666',
  },
  removeButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  purchasedSummary: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  purchasedTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  purchasedList: {
    flexDirection: 'row',
  },
  purchasedItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  purchasedItemName: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  purchasedItemCost: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  reviewAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  reviewSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reviewLabel: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  reviewValue: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#666',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
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
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  modalBody: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
    lineHeight: 20,
  },
});