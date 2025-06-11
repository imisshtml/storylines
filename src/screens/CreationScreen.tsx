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
} from 'react-native';
import { ArrowLeft, Save, User, Dice6, ShoppingCart, Scroll } from 'lucide-react-native';
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
  type Race,
  type Class,
  type DnDSpell,
  type Equipment,
} from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import { currentCampaignAtom } from '../atoms/campaignAtoms';
import { getSpellcastingInfo, hasSpellcastingAtLevel } from '../data/spellcastingData';

const CREATION_STEPS = [
  { id: 0, title: 'Basic Info', icon: User },
  { id: 1, title: 'Race & Class', icon: User },
  { id: 2, title: 'Abilities', icon: Dice6 },
  { id: 3, title: 'Skills', icon: User },
  { id: 4, title: 'Equipment', icon: ShoppingCart },
  { id: 5, title: 'Spells', icon: Scroll },
  { id: 6, title: 'Review', icon: Save },
];

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

  const [user] = useAtom(userAtom);
  const [currentCampaign] = useAtom(currentCampaignAtom);
  const [isLoading, setIsLoading] = useState(false);

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
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveCharacter = async () => {
    if (!user || !characterName || !selectedRace || !selectedClass) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const characterData = {
        user_id: user.id,
        campaign_id: campaignUid || null, // Assign to campaign if coming from invite flow
        name: characterName,
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
          purchasedEquipment,
          avatar: null, // Will be set later if user chooses one
        },
        current_hitpoints: selectedClass.hit_die + (abilities.constitution ? Math.floor((abilities.constitution - 10) / 2) : 0),
        max_hitpoints: selectedClass.hit_die + (abilities.constitution ? Math.floor((abilities.constitution - 10) / 2) : 0),
        temp_hitpoints: 0,
        armor_class: 10 + (abilities.dexterity ? Math.floor((abilities.dexterity - 10) / 2) : 0),
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
        return true; // Abilities are optional for now
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Character Name</Text>
            <TextInput
              style={styles.input}
              value={characterName}
              onChangeText={setCharacterName}
              placeholder="Enter character name"
              placeholderTextColor="#666"
            />
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Race & Class</Text>
            
            <Text style={styles.sectionTitle}>Race</Text>
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {races.map((race) => (
                <TouchableOpacity
                  key={race.index}
                  style={[
                    styles.optionItem,
                    selectedRace?.index === race.index && styles.selectedOption
                  ]}
                  onPress={() => setSelectedRace(race)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedRace?.index === race.index && styles.selectedOptionText
                  ]}>
                    {race.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Class</Text>
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.index}
                  style={[
                    styles.optionItem,
                    selectedClass?.index === cls.index && styles.selectedOption
                  ]}
                  onPress={() => setSelectedClass(cls)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedClass?.index === cls.index && styles.selectedOptionText
                  ]}>
                    {cls.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Ability Scores</Text>
            <Text style={styles.stepDescription}>
              Adjust your character's core abilities (using point buy system)
            </Text>
            
            {Object.entries(abilities).map(([ability, value]) => (
              <View key={ability} style={styles.abilityRow}>
                <Text style={styles.abilityName}>
                  {ability.charAt(0).toUpperCase() + ability.slice(1)}
                </Text>
                <View style={styles.abilityControls}>
                  <TouchableOpacity
                    style={styles.abilityButton}
                    onPress={() => setAbilities({
                      ...abilities,
                      [ability]: Math.max(8, value - 1)
                    })}
                  >
                    <Text style={styles.abilityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.abilityValue}>{value}</Text>
                  <TouchableOpacity
                    style={styles.abilityButton}
                    onPress={() => setAbilities({
                      ...abilities,
                      [ability]: Math.min(15, value + 1)
                    })}
                  >
                    <Text style={styles.abilityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Skills</Text>
            <Text style={styles.stepDescription}>
              Choose skills your character is proficient in
            </Text>
            
            {selectedClass?.proficiency_choices?.[0] && (
              <Text style={styles.skillLimit}>
                Choose {selectedClass.proficiency_choices[0].choose} skills
              </Text>
            )}

            <ScrollView style={styles.skillsList} showsVerticalScrollIndicator={false}>
              {selectedClass?.proficiency_choices?.[0]?.from?.options?.map((option, index) => {
                const skillName = option.item.name;
                const isSelected = selectedSkills.includes(skillName);
                const maxSkills = selectedClass.proficiency_choices[0].choose;
                const canSelect = isSelected || selectedSkills.length < maxSkills;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.skillItem,
                      isSelected && styles.selectedSkill,
                      !canSelect && styles.disabledSkill
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedSkills(selectedSkills.filter(s => s !== skillName));
                      } else if (canSelect) {
                        setSelectedSkills([...selectedSkills, skillName]);
                      }
                    }}
                    disabled={!canSelect}
                  >
                    <Text style={[
                      styles.skillText,
                      isSelected && styles.selectedSkillText,
                      !canSelect && styles.disabledSkillText
                    ]}>
                      {skillName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );

      case 4:
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

            <ScrollView style={styles.equipmentList} showsVerticalScrollIndicator={false}>
              {equipmentList.slice(0, 20).map((item) => (
                <View key={item.id} style={styles.equipmentItem}>
                  <View style={styles.equipmentInfo}>
                    <Text style={styles.equipmentName}>{item.name}</Text>
                    <Text style={styles.equipmentCost}>
                      {item.cost_gold}gp {item.cost_silver}sp {item.cost_copper}cp
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.buyButton}
                    onPress={() => {
                      // Simple purchase logic - would need proper implementation
                      console.log('Purchase', item.name);
                    }}
                  >
                    <Text style={styles.buyButtonText}>Buy</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case 5:
        if (!selectedClass || !hasSpellcastingAtLevel(selectedClass.name, 1)) {
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Spells</Text>
              <Text style={styles.stepDescription}>
                Your class doesn't have spellcasting abilities at level 1.
              </Text>
            </View>
          );
        }

        const spellcastingInfo = getSpellcastingInfo(selectedClass.name, 1);
        const cantrips = spells.filter(spell => spell.level === 0);
        const firstLevelSpells = spells.filter(spell => spell.level === 1);

        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Spells</Text>
            <Text style={styles.stepDescription}>
              Choose your starting spells
            </Text>

            {spellcastingInfo && spellcastingInfo.cantripsKnown > 0 && (
              <>
                <Text style={styles.spellSectionTitle}>
                  Cantrips ({selectedSpells.filter(s => s.level === 0).length}/{spellcastingInfo.cantripsKnown})
                </Text>
                <ScrollView style={styles.spellsList} showsVerticalScrollIndicator={false}>
                  {cantrips.map((spell) => {
                    const isSelected = selectedSpells.some(s => s.index === spell.index);
                    const selectedCantrips = selectedSpells.filter(s => s.level === 0);
                    const canSelect = isSelected || selectedCantrips.length < spellcastingInfo.cantripsKnown;

                    return (
                      <TouchableOpacity
                        key={spell.index}
                        style={[
                          styles.spellItem,
                          isSelected && styles.selectedSpell,
                          !canSelect && styles.disabledSpell
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedSpells(selectedSpells.filter(s => s.index !== spell.index));
                          } else if (canSelect) {
                            setSelectedSpells([...selectedSpells, spell]);
                          }
                        }}
                        disabled={!canSelect}
                      >
                        <Text style={[
                          styles.spellText,
                          isSelected && styles.selectedSpellText
                        ]}>
                          {spell.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {spellcastingInfo && spellcastingInfo.spellsKnown && spellcastingInfo.spellsKnown > 0 && (
              <>
                <Text style={styles.spellSectionTitle}>
                  1st Level Spells ({selectedSpells.filter(s => s.level === 1).length}/{spellcastingInfo.spellsKnown})
                </Text>
                <ScrollView style={styles.spellsList} showsVerticalScrollIndicator={false}>
                  {firstLevelSpells.map((spell) => {
                    const isSelected = selectedSpells.some(s => s.index === spell.index);
                    const selectedFirstLevel = selectedSpells.filter(s => s.level === 1);
                    const canSelect = isSelected || selectedFirstLevel.length < (spellcastingInfo.spellsKnown || 0);

                    return (
                      <TouchableOpacity
                        key={spell.index}
                        style={[
                          styles.spellItem,
                          isSelected && styles.selectedSpell,
                          !canSelect && styles.disabledSpell
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedSpells(selectedSpells.filter(s => s.index !== spell.index));
                          } else if (canSelect) {
                            setSelectedSpells([...selectedSpells, spell]);
                          }
                        }}
                        disabled={!canSelect}
                      >
                        <Text style={[
                          styles.spellText,
                          isSelected && styles.selectedSpellText
                        ]}>
                          {spell.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review Character</Text>
            <Text style={styles.stepDescription}>
              Review your character before saving
            </Text>

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
              <Text style={styles.reviewValue}>
                {selectedSkills.length > 0 ? selectedSkills.join(', ') : 'None selected'}
              </Text>
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Spells:</Text>
              <Text style={styles.reviewValue}>
                {selectedSpells.length > 0 ? selectedSpells.map(s => s.name).join(', ') : 'None selected'}
              </Text>
            </View>

            {returnToCampaign && (
              <View style={styles.campaignNotice}>
                <Text style={styles.campaignNoticeText}>
                  This character will be assigned to the campaign you joined.
                </Text>
              </View>
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
          Step {currentStep + 1} of {CREATION_STEPS.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 12,
  },
  optionsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  optionItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  selectedOptionText: {
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
  abilityName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
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
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  abilityValue: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    minWidth: 32,
    textAlign: 'center',
  },
  skillLimit: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  skillsList: {
    maxHeight: 300,
  },
  skillItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedSkill: {
    backgroundColor: '#4CAF50',
  },
  disabledSkill: {
    backgroundColor: '#1a1a1a',
    opacity: 0.5,
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
  equipmentList: {
    maxHeight: 300,
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
  },
  equipmentName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  equipmentCost: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  spellSectionTitle: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 12,
  },
  spellsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  spellItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedSpell: {
    backgroundColor: '#4CAF50',
  },
  disabledSpell: {
    backgroundColor: '#1a1a1a',
    opacity: 0.5,
  },
  spellText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedSpellText: {
    fontFamily: 'Inter-Bold',
  },
  reviewSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reviewLabel: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  reviewValue: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
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