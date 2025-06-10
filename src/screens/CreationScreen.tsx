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
} from 'react-native';
import { ArrowLeft, ArrowRight, Save, Camera } from 'lucide-react-native';
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
  getEquipmentCostInCopper,
  convertFromCopper,
  type Race,
  type Class,
  type DnDSpell,
  type Equipment,
  type DnDAbilities,
  STARTING_WEALTH_BY_CLASS,
} from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import { currentCampaignAtom } from '../atoms/campaignAtoms';
import { SPELLCASTING_BY_CLASS, hasSpellcastingAtLevel } from '../data/spellcastingData';
import { getDefaultAvatar } from '../utils/avatarStorage';
import { DEFAULT_AVATARS, getAvatarById } from '../data/defaultAvatars';
import AvatarSelector from '../components/AvatarSelector';

const ABILITY_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const POINT_BUY_TOTAL = 27;
const ABILITY_COSTS = [0, 1, 2, 3, 4, 5, 7, 9]; // Cost for scores 8-15

export default function CreationScreen() {
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

  const [user] = useAtom(userAtom);
  const [currentCampaign] = useAtom(currentCampaignAtom);

  const [isLoading, setIsLoading] = useState(false);
  const [characterAvatar, setCharacterAvatar] = useState<string>(getDefaultAvatar());
  const [isAvatarSelectorVisible, setIsAvatarSelectorVisible] = useState(false);

  useEffect(() => {
    // Fetch data when component mounts
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
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      resetCharacterCreation();
      router.back();
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return characterName.trim().length > 0;
      case 1: return selectedRace !== null;
      case 2: return selectedClass !== null;
      case 3: return true; // Abilities are always valid
      case 4: return true; // Skills are optional
      case 5: return true; // Spells are optional
      case 6: return true; // Equipment is optional
      default: return false;
    }
  };

  const getAvatarSource = () => {
    if (characterAvatar.startsWith('default:')) {
      const avatarId = characterAvatar.replace('default:', '');
      const defaultAvatar = getAvatarById(avatarId);
      return defaultAvatar ? defaultAvatar.imagePath : DEFAULT_AVATARS[0].imagePath;
    }
    return { uri: characterAvatar };
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setCharacterAvatar(avatarUrl);
  };

  const calculatePointsUsed = () => {
    return ABILITY_NAMES.reduce((total, ability) => {
      const score = abilities[ability as keyof DnDAbilities];
      const cost = ABILITY_COSTS[score - 8] || 0;
      return total + cost;
    }, 0);
  };

  const handleAbilityChange = (ability: string, value: number) => {
    const newAbilities = { ...abilities, [ability]: value };
    const pointsUsed = ABILITY_NAMES.reduce((total, abilityName) => {
      const score = newAbilities[abilityName as keyof DnDAbilities];
      const cost = ABILITY_COSTS[score - 8] || 0;
      return total + cost;
    }, 0);

    if (pointsUsed <= POINT_BUY_TOTAL) {
      setAbilities(newAbilities);
    }
  };

  const getAvailableSkills = () => {
    if (!selectedClass) return [];
    
    const classSkills = selectedClass.proficiency_choices?.[0]?.from?.options?.map(
      option => option.item.name
    ) || [];
    
    return classSkills;
  };

  const getMaxSkills = () => {
    if (!selectedClass) return 0;
    return selectedClass.proficiency_choices?.[0]?.choose || 0;
  };

  const toggleSkill = (skillName: string) => {
    const maxSkills = getMaxSkills();
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(skill => skill !== skillName));
    } else if (selectedSkills.length < maxSkills) {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const getAvailableSpells = () => {
    if (!selectedClass || !hasSpellcastingAtLevel(selectedClass.name, 1)) {
      return [];
    }
    
    // Filter spells by class
    return spells.filter(spell => 
      spell.classes && spell.classes.includes(selectedClass.name) && spell.level <= 1
    );
  };

  const getMaxSpells = () => {
    if (!selectedClass || !hasSpellcastingAtLevel(selectedClass.name, 1)) {
      return { cantrips: 0, spells: 0 };
    }
    
    const spellcastingInfo = SPELLCASTING_BY_CLASS[selectedClass.name.toLowerCase()]?.[1];
    if (!spellcastingInfo) {
      return { cantrips: 0, spells: 0 };
    }
    
    return {
      cantrips: spellcastingInfo.cantripsKnown,
      spells: spellcastingInfo.spellsKnown || 0
    };
  };

  const toggleSpell = (spell: DnDSpell) => {
    const maxSpells = getMaxSpells();
    const currentCantrips = selectedSpells.filter(s => s.level === 0).length;
    const currentSpells = selectedSpells.filter(s => s.level > 0).length;
    
    if (selectedSpells.some(s => s.index === spell.index)) {
      setSelectedSpells(selectedSpells.filter(s => s.index !== spell.index));
    } else {
      if (spell.level === 0 && currentCantrips < maxSpells.cantrips) {
        setSelectedSpells([...selectedSpells, spell]);
      } else if (spell.level > 0 && currentSpells < maxSpells.spells) {
        setSelectedSpells([...selectedSpells, spell]);
      }
    }
  };

  const handleEquipmentPurchase = (item: Equipment) => {
    try {
      purchaseEquipment(item);
    } catch (error) {
      Alert.alert('Cannot Purchase', 'You do not have enough money for this item.');
    }
  };

  const handleEquipmentRemove = (item: Equipment) => {
    removeEquipment(item);
  };

  const handleSaveCharacter = async () => {
    if (!user || !characterName.trim() || !selectedRace || !selectedClass) {
      Alert.alert('Error', 'Please complete all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      const characterData = {
        user_id: user.id,
        campaign_id: currentCampaign?.uid || null,
        name: characterName.trim(),
        race: selectedRace.name,
        class: selectedClass.name,
        background: 'Folk Hero', // Default background
        level: 1,
        abilities,
        skills: selectedSkills,
        spells: selectedSpells,
        equipment,
        character_data: {
          race: selectedRace,
          class: selectedClass,
          avatar: characterAvatar,
          purchasedEquipment,
        },
        current_hitpoints: 10, // Default
        max_hitpoints: 10, // Default
        temp_hitpoints: 0,
        armor_class: 10, // Default
        conditions: [],
        gold,
        silver,
        copper,
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Character Name & Avatar</Text>
            
            {/* Avatar Selection */}
            <View style={styles.avatarSection}>
              <Text style={styles.label}>Avatar</Text>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => setIsAvatarSelectorVisible(true)}
              >
                <Image source={getAvatarSource()} style={styles.avatar} />
                <View style={styles.avatarEditButton}>
                  <Camera size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Name Input */}
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
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choose Race</Text>
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
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choose Class</Text>
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
                    Hit Die: d{cls.hit_die}
                    {cls.spellcasting && ' • Spellcaster'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Ability Scores</Text>
            <Text style={styles.pointBuyInfo}>
              Points Used: {calculatePointsUsed()}/{POINT_BUY_TOTAL}
            </Text>
            <ScrollView style={styles.abilitiesList}>
              {ABILITY_NAMES.map((ability) => (
                <View key={ability} style={styles.abilityRow}>
                  <Text style={styles.abilityName}>
                    {ability.charAt(0).toUpperCase() + ability.slice(1)}
                  </Text>
                  <View style={styles.abilityControls}>
                    <TouchableOpacity
                      style={styles.abilityButton}
                      onPress={() => handleAbilityChange(ability, Math.max(8, abilities[ability as keyof DnDAbilities] - 1))}
                      disabled={abilities[ability as keyof DnDAbilities] <= 8}
                    >
                      <Text style={styles.abilityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.abilityValue}>
                      {abilities[ability as keyof DnDAbilities]}
                    </Text>
                    <TouchableOpacity
                      style={styles.abilityButton}
                      onPress={() => handleAbilityChange(ability, Math.min(15, abilities[ability as keyof DnDAbilities] + 1))}
                      disabled={abilities[ability as keyof DnDAbilities] >= 15}
                    >
                      <Text style={styles.abilityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case 4:
        const availableSkills = getAvailableSkills();
        const maxSkills = getMaxSkills();
        
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choose Skills</Text>
            <Text style={styles.skillInfo}>
              Selected: {selectedSkills.length}/{maxSkills}
            </Text>
            <ScrollView style={styles.skillsList}>
              {availableSkills.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={[
                    styles.skillCard,
                    selectedSkills.includes(skill) && styles.selectedCard
                  ]}
                  onPress={() => toggleSkill(skill)}
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

      case 5:
        const availableSpells = getAvailableSpells();
        const maxSpells = getMaxSpells();
        const currentCantrips = selectedSpells.filter(s => s.level === 0).length;
        const currentSpells = selectedSpells.filter(s => s.level > 0).length;

        if (!selectedClass || !hasSpellcastingAtLevel(selectedClass.name, 1)) {
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Spells</Text>
              <Text style={styles.noSpellsText}>
                {selectedClass?.name} does not have spellcasting at level 1.
              </Text>
            </View>
          );
        }

        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choose Spells</Text>
            <Text style={styles.spellInfo}>
              Cantrips: {currentCantrips}/{maxSpells.cantrips} • 
              Spells: {currentSpells}/{maxSpells.spells}
            </Text>
            <ScrollView style={styles.spellsList}>
              {availableSpells.map((spell) => (
                <TouchableOpacity
                  key={spell.index}
                  style={[
                    styles.spellCard,
                    selectedSpells.some(s => s.index === spell.index) && styles.selectedCard
                  ]}
                  onPress={() => toggleSpell(spell)}
                >
                  <Text style={[
                    styles.spellName,
                    selectedSpells.some(s => s.index === spell.index) && styles.selectedText
                  ]}>
                    {spell.name}
                  </Text>
                  <Text style={[
                    styles.spellDetails,
                    selectedSpells.some(s => s.index === spell.index) && styles.selectedText
                  ]}>
                    {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.school}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Equipment & Gear</Text>
            <View style={styles.currencyDisplay}>
              <Text style={styles.currencyText}>
                {gold}gp {silver}sp {copper}cp
              </Text>
            </View>
            
            <Text style={styles.sectionTitle}>Available Equipment</Text>
            <ScrollView style={styles.equipmentList}>
              {availableEquipment.slice(0, 20).map((item) => (
                <View key={item.id} style={styles.equipmentCard}>
                  <View style={styles.equipmentInfo}>
                    <Text style={styles.equipmentName}>{item.name}</Text>
                    <Text style={styles.equipmentType}>{item.type}</Text>
                    <Text style={styles.equipmentCost}>
                      {item.cost_gold > 0 && `${item.cost_gold}gp `}
                      {item.cost_silver > 0 && `${item.cost_silver}sp `}
                      {item.cost_copper > 0 && `${item.cost_copper}cp`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.equipmentButton,
                      !canAffordEquipment(item, gold, silver, copper) && styles.equipmentButtonDisabled
                    ]}
                    onPress={() => handleEquipmentPurchase(item)}
                    disabled={!canAffordEquipment(item, gold, silver, copper)}
                  >
                    <Text style={styles.equipmentButtonText}>Buy</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {purchasedEquipment.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Purchased Equipment</Text>
                <ScrollView style={styles.purchasedList}>
                  {purchasedEquipment.map((item) => (
                    <View key={`purchased-${item.id}`} style={styles.purchasedCard}>
                      <Text style={styles.purchasedName}>{item.name}</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleEquipmentRemove(item)}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
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
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{currentStep + 1}/7</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep < 6 ? (
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ArrowRight color="#fff" size={20} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSaveCharacter}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Save color="#fff" size={20} />
                <Text style={styles.saveButtonText}>Create Character</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isVisible={isAvatarSelectorVisible}
        onClose={() => setIsAvatarSelectorVisible(false)}
        onAvatarSelect={handleAvatarSelect}
        currentAvatar={characterAvatar}
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
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
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
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarEditButton: {
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
  inputContainer: {
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
  },
  selectedText: {
    color: '#fff',
  },
  pointBuyInfo: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
  },
  abilitiesList: {
    flex: 1,
  },
  abilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  abilityName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    flex: 1,
  },
  abilityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  abilityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  abilityButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  abilityValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    minWidth: 24,
    textAlign: 'center',
  },
  skillInfo: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
  },
  skillsList: {
    flex: 1,
  },
  skillCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  noSpellsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  spellInfo: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
  },
  spellsList: {
    flex: 1,
  },
  spellCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  spellName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  spellDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
  },
  currencyDisplay: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  currencyText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 12,
    marginTop: 20,
  },
  equipmentList: {
    maxHeight: 200,
  },
  equipmentCard: {
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
  },
  equipmentName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  equipmentType: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textTransform: 'capitalize',
  },
  equipmentCost: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
  },
  equipmentButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  equipmentButtonDisabled: {
    backgroundColor: '#666',
  },
  equipmentButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  purchasedList: {
    maxHeight: 150,
  },
  purchasedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  purchasedName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#dc3545',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#fff',
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
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
});