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
import { ArrowLeft, ArrowRight, Save, User, Dices, Scroll, Package } from 'lucide-react-native';
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
  type DnDEquipment,
} from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';

const CREATION_STEPS = [
  { id: 0, title: 'Basic Info', icon: User },
  { id: 1, title: 'Race & Class', icon: Dices },
  { id: 2, title: 'Abilities', icon: Dices },
  { id: 3, title: 'Skills', icon: Scroll },
  { id: 4, title: 'Spells', icon: Scroll },
  { id: 5, title: 'Equipment', icon: Package },
  { id: 6, title: 'Review', icon: Save },
];

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
  const [, resetCharacterCreation] = useAtom(resetCharacterCreationAtom);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchRaces(),
          fetchClasses(),
          fetchSpells(),
        ]);
      } catch (error) {
        console.error('Error loading character creation data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchRaces, fetchClasses, fetchSpells]);

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

  const handleSaveCharacter = async () => {
    if (!user || !characterName || !selectedRace || !selectedClass) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    setIsSaving(true);
    try {
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
        character_data: {
          race: selectedRace,
          class: selectedClass,
          abilities,
          skills: selectedSkills,
          spells: selectedSpells,
          equipment,
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
    <View style={styles.stepIndicator}>
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
    </View>
  );

  const renderBasicInfo = () => (
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

  const renderRaceAndClass = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Race</Text>
      <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
        {races.map((race) => (
          <TouchableOpacity
            key={race.index}
            style={[
              styles.optionItem,
              selectedRace?.index === race.index && styles.optionItemSelected,
            ]}
            onPress={() => setSelectedRace(race)}
          >
            <Text style={[
              styles.optionText,
              selectedRace?.index === race.index && styles.optionTextSelected,
            ]}>
              {race.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.stepTitle}>Choose Class</Text>
      <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls.index}
            style={[
              styles.optionItem,
              selectedClass?.index === cls.index && styles.optionItemSelected,
            ]}
            onPress={() => setSelectedClass(cls)}
          >
            <Text style={[
              styles.optionText,
              selectedClass?.index === cls.index && styles.optionTextSelected,
            ]}>
              {cls.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAbilities = () => {
    const abilityNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Ability Scores</Text>
        {abilityNames.map((ability) => (
          <View key={ability} style={styles.abilityRow}>
            <Text style={styles.abilityLabel}>
              {ability.charAt(0).toUpperCase() + ability.slice(1)}
            </Text>
            <View style={styles.abilityControls}>
              <TouchableOpacity
                style={styles.abilityButton}
                onPress={() => setAbilities(prev => ({
                  ...prev,
                  [ability]: Math.max(8, prev[ability as keyof DnDAbilities] - 1)
                }))}
              >
                <Text style={styles.abilityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.abilityValue}>
                {abilities[ability as keyof DnDAbilities]}
              </Text>
              <TouchableOpacity
                style={styles.abilityButton}
                onPress={() => setAbilities(prev => ({
                  ...prev,
                  [ability]: Math.min(15, prev[ability as keyof DnDAbilities] + 1)
                }))}
              >
                <Text style={styles.abilityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
        <Text style={styles.subtitle}>Select up to 4 skills</Text>
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
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Choose Spells</Text>
        <Text style={styles.subtitle}>Select cantrips and 1st level spells</Text>
        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          {spells.map((spell) => (
            <TouchableOpacity
              key={spell.index}
              style={[
                styles.optionItem,
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
              <Text style={[
                styles.optionText,
                selectedSpells.some(s => s.index === spell.index) && styles.optionTextSelected,
                !selectedSpells.some(s => s.index === spell.index) && selectedSpells.length >= 6 && styles.optionTextDisabled,
              ]}>
                {spell.name} ({spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEquipment = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Starting Equipment</Text>
      <Text style={styles.subtitle}>Basic equipment will be provided based on your class</Text>
      <View style={styles.equipmentPreview}>
        <Text style={styles.equipmentText}>• Leather Armor</Text>
        <Text style={styles.equipmentText}>• Simple Weapon</Text>
        <Text style={styles.equipmentText}>• Adventuring Pack</Text>
        <Text style={styles.equipmentText}>• 50 Gold Pieces</Text>
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Character Review</Text>
      
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
        <Text style={styles.reviewLabel}>Level:</Text>
        <Text style={styles.reviewValue}>1</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Abilities:</Text>
        <Text style={styles.reviewValue}>
          STR {abilities.strength}, DEX {abilities.dexterity}, CON {abilities.constitution}, INT {abilities.intelligence}, WIS {abilities.wisdom}, CHA {abilities.charisma}
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
        <Text style={styles.reviewLabel}>Equipment:</Text>
        <Text style={styles.reviewValue}>
          Leather Armor, Simple Weapon, Adventuring Pack, 50 Gold Pieces
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSaveCharacter}
        disabled={isSaving}
      >
        {isSaving ? (
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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderBasicInfo();
      case 1: return renderRaceAndClass();
      case 2: return renderAbilities();
      case 3: return renderSkills();
      case 4: return renderSpells();
      case 5: return renderEquipment();
      case 6: return renderReview();
      default: return renderBasicInfo();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return characterName.length > 0;
      case 1: return selectedRace && selectedClass;
      case 2: return true; // Abilities always have default values
      case 3: return true; // Skills are optional
      case 4: return true; // Spells are optional
      case 5: return true; // Equipment is automatic
      case 6: return true; // Review step
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
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
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
    maxHeight: 300,
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
  abilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  abilityLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  abilityControls: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  equipmentPreview: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
  },
  equipmentText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
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
});