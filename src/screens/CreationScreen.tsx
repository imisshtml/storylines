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
  Modal,
} from 'react-native';
import { ArrowLeft, ArrowRight, Check, Camera, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react-native';
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
  canAffordEquipment,
  purchaseEquipmentAtom,
  removeEquipmentAtom,
  type Race,
  type Class,
  type DnDSpell,
  type Equipment,
} from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import { SPELLCASTING_BY_CLASS, getSpellcastingInfo } from '../data/spellcastingData';
import { getDefaultAvatar } from '../utils/avatarStorage';
import AvatarSelector from '../components/AvatarSelector';

const CREATION_STEPS = [
  'Basic Info',
  'Choose Race',
  'Choose Class',
  'Assign Abilities',
  'Choose Skills',
  'Choose Spells',
  'Purchase Equipment',
  'Review',
];

export default function CreationScreen() {
  const [currentStep, setCurrentStep] = useAtom(characterCreationStepAtom);
  const [characterName, setCharacterName] = useAtom(characterNameAtom);
  const [selectedRace, setSelectedRace] = useAtom(selectedRaceAtom);
  const [selectedClass, setSelectedClass] = useAtom(selectedClassAtom);
  const [characterAbilities, setCharacterAbilities] = useAtom(characterAbilitiesAtom);
  const [selectedSkills, setSelectedSkills] = useAtom(selectedSkillsAtom);
  const [selectedSpells, setSelectedSpells] = useAtom(selectedSpellsAtom);
  const [characterEquipment, setCharacterEquipment] = useAtom(characterEquipmentAtom);
  const [characterGold, setCharacterGold] = useAtom(characterGoldAtom);
  const [characterSilver, setCharacterSilver] = useAtom(characterSilverAtom);
  const [characterCopper, setCharacterCopper] = useAtom(characterCopperAtom);
  const [purchasedEquipment, setPurchasedEquipment] = useAtom(purchasedEquipmentAtom);

  const [races, setRaces] = useAtom(racesAtom);
  const [classes, setClasses] = useAtom(classesAtom);
  const [spells, setSpells] = useAtom(spellsAtom);
  const [equipment, setEquipment] = useAtom(equipmentAtom);

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

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(getDefaultAvatar());
  const [isAvatarSelectorVisible, setIsAvatarSelectorVisible] = useState(false);
  const [expandedSpells, setExpandedSpells] = useState<Set<string>>(new Set());
  const [activeSpellTab, setActiveSpellTab] = useState<'cantrips' | 'level1'>('cantrips');
  const [selectedEquipmentCategory, setSelectedEquipmentCategory] = useState('All');
  const [equipmentQuantities, setEquipmentQuantities] = useState<{ [key: string]: number }>({});

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
        Alert.alert('Error', 'Failed to load character creation data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchRaces, fetchClasses, fetchSpells, fetchEquipment]);

  useEffect(() => {
    if (selectedClass) {
      setStartingWealth();
    }
  }, [selectedClass, setStartingWealth]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      resetCharacterCreation();
      router.back();
    }
  };

  const handleNext = () => {
    if (currentStep < CREATION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return characterName.trim().length > 0;
      case 1: // Choose Race
        return selectedRace !== null;
      case 2: // Choose Class
        return selectedClass !== null;
      case 3: // Assign Abilities
        return true; // Always allow proceeding from abilities
      case 4: // Choose Skills
        return selectedSkills.length > 0;
      case 5: // Choose Spells
        if (!selectedClass || !hasSpellcasting()) return true;
        const spellcastingInfo = getSpellcastingInfo(selectedClass.name, 1);
        if (!spellcastingInfo) return true;
        
        const cantrips = selectedSpells.filter(spell => spell.level === 0);
        const level1Spells = selectedSpells.filter(spell => spell.level === 1);
        
        const requiredCantrips = spellcastingInfo.cantripsKnown || 0;
        const requiredLevel1 = spellcastingInfo.spellsKnown || 0;
        
        return cantrips.length === requiredCantrips && level1Spells.length === requiredLevel1;
      case 6: // Purchase Equipment
        return true; // Always allow proceeding from equipment
      default:
        return true;
    }
  };

  const hasSpellcasting = () => {
    return selectedClass && SPELLCASTING_BY_CLASS[selectedClass.name.toLowerCase()];
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const getAvatarSource = () => {
    if (selectedAvatar.startsWith('default:')) {
      const { getAvatarById } = require('../data/defaultAvatars');
      const avatarId = selectedAvatar.replace('default:', '');
      const defaultAvatar = getAvatarById(avatarId);
      return defaultAvatar ? defaultAvatar.imagePath : require('../data/defaultAvatars').DEFAULT_AVATARS[0].imagePath;
    }
    return { uri: selectedAvatar };
  };

  const toggleSpellExpansion = (spellIndex: string) => {
    const newExpanded = new Set(expandedSpells);
    if (newExpanded.has(spellIndex)) {
      newExpanded.delete(spellIndex);
    } else {
      newExpanded.add(spellIndex);
    }
    setExpandedSpells(newExpanded);
  };

  const handleSpellSelection = (spell: DnDSpell) => {
    const isSelected = selectedSpells.some(s => s.index === spell.index);
    if (isSelected) {
      setSelectedSpells(selectedSpells.filter(s => s.index !== spell.index));
    } else {
      setSelectedSpells([...selectedSpells, spell]);
    }
  };

  const getFilteredSpells = (level: number) => {
    return spells.filter(spell => spell.level === level);
  };

  const getSpellRequirements = () => {
    if (!selectedClass || !hasSpellcasting()) return { cantrips: 0, level1: 0 };
    const spellcastingInfo = getSpellcastingInfo(selectedClass.name, 1);
    return {
      cantrips: spellcastingInfo?.cantripsKnown || 0,
      level1: spellcastingInfo?.spellsKnown || 0,
    };
  };

  const getEquipmentCategories = () => {
    const categories = ['All', 'Armor', 'Weapons'];
    const otherCategories = [...new Set(equipment
      .filter(item => !['armor', 'weapon'].includes(item.equipment_category))
      .map(item => item.equipment_category)
      .filter(Boolean)
    )].sort();
    return [...categories, ...otherCategories];
  };

  const getFilteredEquipment = () => {
    if (selectedEquipmentCategory === 'All') return equipment;
    if (selectedEquipmentCategory === 'Armor') {
      return equipment.filter(item => item.equipment_category === 'armor');
    }
    if (selectedEquipmentCategory === 'Weapons') {
      return equipment.filter(item => item.equipment_category === 'weapon');
    }
    return equipment.filter(item => item.equipment_category === selectedEquipmentCategory);
  };

  const updateEquipmentQuantity = (equipmentId: string, change: number) => {
    const newQuantity = Math.max(0, (equipmentQuantities[equipmentId] || 0) + change);
    setEquipmentQuantities(prev => ({
      ...prev,
      [equipmentId]: newQuantity
    }));
  };

  const handlePurchaseEquipment = (equipment: Equipment, quantity: number = 1) => {
    try {
      for (let i = 0; i < quantity; i++) {
        purchaseEquipment(equipment);
      }
      // Reset quantity after purchase
      setEquipmentQuantities(prev => ({
        ...prev,
        [equipment.id]: 0
      }));
    } catch (error) {
      Alert.alert('Cannot Purchase', 'You do not have enough gold to purchase this item.');
    }
  };

  const handleSaveCharacter = async () => {
    if (!user || !selectedRace || !selectedClass) {
      Alert.alert('Error', 'Missing required character information.');
      return;
    }

    setIsLoading(true);
    try {
      const characterData = {
        user_id: user.id,
        name: characterName,
        race: selectedRace.name,
        class: selectedClass.name,
        background: 'Folk Hero', // Default background
        level: 1,
        abilities: characterAbilities,
        skills: selectedSkills,
        spells: selectedSpells,
        equipment: characterEquipment,
        character_data: {
          race: selectedRace,
          class: selectedClass,
          avatar: selectedAvatar,
          purchasedEquipment,
        },
        current_hitpoints: 10, // Default
        max_hitpoints: 10, // Default
        temp_hitpoints: 0,
        armor_class: 10, // Default
        conditions: [],
        gold: characterGold,
        silver: characterSilver,
        copper: characterCopper,
      };

      await saveCharacter(characterData);
      resetCharacterCreation();
      Alert.alert('Success', 'Character created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving character:', error);
      Alert.alert('Error', 'Failed to save character. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Create Your Character</Text>
            
            <View style={styles.avatarSection}>
              <Text style={styles.label}>Character Portrait</Text>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => setIsAvatarSelectorVisible(true)}
              >
                <Image source={getAvatarSource()} style={styles.avatar} />
                <View style={styles.avatarOverlay}>
                  <Camera size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Character Name</Text>
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

      case 1: // Choose Race
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Your Race</Text>
            <ScrollView style={styles.optionsList}>
              {races.map((race) => (
                <TouchableOpacity
                  key={race.index}
                  style={[
                    styles.optionCard,
                    selectedRace?.index === race.index && styles.selectedCard
                  ]}
                  onPress={() => setSelectedRace(race)}
                >
                  <Text style={[
                    styles.optionTitle,
                    selectedRace?.index === race.index && styles.selectedText
                  ]}>
                    {race.name}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    selectedRace?.index === race.index && styles.selectedText
                  ]}>
                    Size: {race.size} • Speed: {race.speed} ft
                  </Text>
                  {race.ability_bonuses.length > 0 && (
                    <Text style={[
                      styles.optionDescription,
                      selectedRace?.index === race.index && styles.selectedText
                    ]}>
                      Ability Bonuses: {race.ability_bonuses.map(bonus => 
                        `+${bonus.bonus} ${bonus.ability_score.name}`
                      ).join(', ')}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2: // Choose Class
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Your Class</Text>
            <ScrollView style={styles.optionsList}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.index}
                  style={[
                    styles.optionCard,
                    selectedClass?.index === cls.index && styles.selectedCard
                  ]}
                  onPress={() => setSelectedClass(cls)}
                >
                  <Text style={[
                    styles.optionTitle,
                    selectedClass?.index === cls.index && styles.selectedText
                  ]}>
                    {cls.name}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    selectedClass?.index === cls.index && styles.selectedText
                  ]}>
                    Hit Die: d{cls.hit_die} • Starting Gold: {characterGold} gp
                  </Text>
                  {cls.spellcasting && (
                    <Text style={[
                      styles.optionDescription,
                      selectedClass?.index === cls.index && styles.selectedText
                    ]}>
                      Spellcaster (Level {cls.spellcasting.level})
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 3: // Assign Abilities
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Assign Ability Scores</Text>
            <Text style={styles.stepDescription}>
              Standard array: 15, 14, 13, 12, 10, 8
            </Text>
            <View style={styles.abilitiesGrid}>
              {Object.entries(characterAbilities).map(([ability, score]) => (
                <View key={ability} style={styles.abilityCard}>
                  <Text style={styles.abilityName}>
                    {ability.charAt(0).toUpperCase() + ability.slice(1)}
                  </Text>
                  <Text style={styles.abilityScore}>{score}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 4: // Choose Skills
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Skills</Text>
            <Text style={styles.stepDescription}>
              Select skills you are proficient in
            </Text>
            <ScrollView style={styles.skillsList}>
              {['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 
                'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
                'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
                'Sleight of Hand', 'Stealth', 'Survival'].map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={[
                    styles.skillCard,
                    selectedSkills.includes(skill) && styles.selectedCard
                  ]}
                  onPress={() => {
                    if (selectedSkills.includes(skill)) {
                      setSelectedSkills(selectedSkills.filter(s => s !== skill));
                    } else {
                      setSelectedSkills([...selectedSkills, skill]);
                    }
                  }}
                >
                  <Text style={[
                    styles.skillName,
                    selectedSkills.includes(skill) && styles.selectedText
                  ]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 5: // Choose Spells
        if (!hasSpellcasting()) {
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Spells</Text>
              <Text style={styles.stepDescription}>
                Your class does not have spellcasting abilities.
              </Text>
            </View>
          );
        }

        const requirements = getSpellRequirements();
        const selectedCantrips = selectedSpells.filter(spell => spell.level === 0);
        const selectedLevel1 = selectedSpells.filter(spell => spell.level === 1);

        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Spells</Text>
            
            <View style={styles.spellTabs}>
              <TouchableOpacity
                style={[
                  styles.spellTab,
                  activeSpellTab === 'cantrips' && styles.activeSpellTab
                ]}
                onPress={() => setActiveSpellTab('cantrips')}
              >
                <Text style={[
                  styles.spellTabText,
                  activeSpellTab === 'cantrips' && styles.activeSpellTabText
                ]}>
                  Cantrips ({selectedCantrips.length}/{requirements.cantrips})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.spellTab,
                  activeSpellTab === 'level1' && styles.activeSpellTab
                ]}
                onPress={() => setActiveSpellTab('level1')}
              >
                <Text style={[
                  styles.spellTabText,
                  activeSpellTab === 'level1' && styles.activeSpellTabText
                ]}>
                  1st Level ({selectedLevel1.length}/{requirements.level1})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.spellsList}>
              {getFilteredSpells(activeSpellTab === 'cantrips' ? 0 : 1).map((spell) => {
                const isSelected = selectedSpells.some(s => s.index === spell.index);
                const isExpanded = expandedSpells.has(spell.index);
                
                return (
                  <View key={spell.index} style={styles.spellCard}>
                    <TouchableOpacity
                      style={[
                        styles.spellHeader,
                        isSelected && styles.selectedSpellHeader
                      ]}
                      onPress={() => handleSpellSelection(spell)}
                    >
                      <View style={styles.spellTitleRow}>
                        <Text style={[
                          styles.spellName,
                          isSelected && styles.selectedText
                        ]}>
                          {spell.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleSpellExpansion(spell.index)}
                          style={styles.expandButton}
                        >
                          {isExpanded ? (
                            <ChevronUp size={20} color={isSelected ? "#fff" : "#666"} />
                          ) : (
                            <ChevronDown size={20} color={isSelected ? "#fff" : "#666"} />
                          )}
                        </TouchableOpacity>
                      </View>
                      <Text style={[
                        styles.spellSchool,
                        isSelected && styles.selectedText
                      ]}>
                        {spell.school} • {spell.casting_time} • {spell.range}
                      </Text>
                    </TouchableOpacity>
                    
                    {isExpanded && (
                      <View style={styles.spellDetails}>
                        <Text style={styles.spellProperty}>
                          <Text style={styles.spellPropertyLabel}>Components:</Text> {spell.components.join(', ')}
                        </Text>
                        <Text style={styles.spellProperty}>
                          <Text style={styles.spellPropertyLabel}>Duration:</Text> {spell.duration}
                        </Text>
                        {spell.description.map((desc, index) => (
                          <Text key={index} style={styles.spellDescription}>
                            {desc}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        );

      case 6: // Purchase Equipment
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Purchase Equipment</Text>
            <Text style={styles.stepDescription}>
              Gold: {characterGold} • Silver: {characterSilver} • Copper: {characterCopper}
            </Text>

            <View style={styles.categoryTabs}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {getEquipmentCategories().map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryTab,
                      selectedEquipmentCategory === category && styles.activeCategoryTab
                    ]}
                    onPress={() => setSelectedEquipmentCategory(category)}
                  >
                    <Text style={[
                      styles.categoryTabText,
                      selectedEquipmentCategory === category && styles.activeCategoryTabText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <ScrollView style={styles.equipmentList}>
              {getFilteredEquipment().map((item) => {
                const quantity = equipmentQuantities[item.id] || 0;
                const canAfford = canAffordEquipment(item, characterGold, characterSilver, characterCopper);
                
                return (
                  <View key={item.id} style={styles.equipmentCard}>
                    <View style={styles.equipmentInfo}>
                      <Text style={styles.equipmentName}>{item.name}</Text>
                      <Text style={styles.equipmentCost}>
                        {item.cost_quantity} {item.cost_unit}
                      </Text>
                      <Text style={styles.equipmentWeight}>
                        Weight: {item.weight} lb
                      </Text>
                    </View>
                    
                    <View style={styles.equipmentActions}>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateEquipmentQuantity(item.id, -1)}
                          disabled={quantity === 0}
                        >
                          <Minus size={16} color={quantity === 0 ? "#666" : "#fff"} />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateEquipmentQuantity(item.id, 1)}
                        >
                          <Plus size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity
                        style={[
                          styles.purchaseButton,
                          (!canAfford || quantity === 0) && styles.purchaseButtonDisabled
                        ]}
                        onPress={() => handlePurchaseEquipment(item, quantity)}
                        disabled={!canAfford || quantity === 0}
                      >
                        <Text style={styles.purchaseButtonText}>Buy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {purchasedEquipment.length > 0 && (
              <View style={styles.purchasedSection}>
                <Text style={styles.purchasedTitle}>Purchased Equipment:</Text>
                {purchasedEquipment.map((item, index) => (
                  <View key={index} style={styles.purchasedItem}>
                    <Text style={styles.purchasedItemName}>{item.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeEquipment(item)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 7: // Review
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review Character</Text>
            <ScrollView style={styles.reviewContent}>
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
              </View>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Skills:</Text>
                <Text style={styles.reviewValue}>{selectedSkills.join(', ')}</Text>
              </View>
              {hasSpellcasting() && selectedSpells.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Spells:</Text>
                  <Text style={styles.reviewValue}>
                    {selectedSpells.map(spell => spell.name).join(', ')}
                  </Text>
                </View>
              )}
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Equipment:</Text>
                <Text style={styles.reviewValue}>
                  {purchasedEquipment.map(item => item.name).join(', ')}
                </Text>
              </View>
            </ScrollView>
          </View>
        );

      default:
        return null;
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
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            {currentStep + 1}/{CREATION_STEPS.length}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { width: `${((currentStep + 1) / CREATION_STEPS.length) * 100}%` }
          ]} 
        />
      </View>

      <ScrollView style={styles.content}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep === CREATION_STEPS.length - 1 ? (
          <TouchableOpacity
            style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
            onPress={handleSaveCharacter}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={20} color="#fff" />
                <Text style={styles.nextButtonText}>Create Character</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceedToNext() && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!canProceedToNext()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <AvatarSelector
        isVisible={isAvatarSelectorVisible}
        onClose={() => setIsAvatarSelectorVisible(false)}
        onAvatarSelect={handleAvatarSelect}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontFamily: 'Inter-Bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  stepIndicator: {
    width: 40,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a2a',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#121212',
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  optionsList: {
    flex: 1,
  },
  optionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedCard: {
    backgroundColor: '#4CAF50',
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    marginBottom: 2,
  },
  selectedText: {
    color: '#fff',
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
    fontFamily: 'Inter-Bold',
    color: '#888',
    marginBottom: 4,
  },
  abilityScore: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  skillsList: {
    flex: 1,
  },
  skillCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  spellTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 4,
  },
  spellTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeSpellTab: {
    backgroundColor: '#4CAF50',
  },
  spellTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#888',
  },
  activeSpellTabText: {
    color: '#fff',
  },
  spellsList: {
    flex: 1,
  },
  spellCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  spellHeader: {
    padding: 16,
  },
  selectedSpellHeader: {
    backgroundColor: '#4CAF50',
  },
  spellTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spellName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    flex: 1,
  },
  expandButton: {
    padding: 4,
  },
  spellSchool: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
  },
  spellDetails: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#1a1a1a',
  },
  spellProperty: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    marginBottom: 4,
  },
  spellPropertyLabel: {
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  spellDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    marginTop: 8,
    lineHeight: 20,
  },
  categoryTabs: {
    marginBottom: 16,
  },
  categoryTab: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeCategoryTab: {
    backgroundColor: '#4CAF50',
  },
  categoryTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#888',
  },
  activeCategoryTabText: {
    color: '#fff',
  },
  equipmentList: {
    flex: 1,
  },
  equipmentCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  equipmentCost: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    marginBottom: 2,
  },
  equipmentWeight: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  equipmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#666',
  },
  purchaseButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  purchasedSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  purchasedTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 12,
  },
  purchasedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  purchasedItemName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  reviewContent: {
    flex: 1,
  },
  reviewSection: {
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
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
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
});