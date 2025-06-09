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
} from 'react-native';
import { ArrowLeft, ArrowRight, Save, User, Dices, Scroll, Package, Camera, Upload, ShieldUser, Dna } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import * as ImagePicker from 'expo-image-picker';
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
  { id: 0, title: 'Info', icon: User },
  { id: 1, title: 'Class', icon: ShieldUser },
  { id: 2, title: 'Race', icon: Dna },
  { id: 3, title: 'Stats', icon: Dices },
  { id: 4, title: 'Skills', icon: Scroll },
  { id: 5, title: 'Spells', icon: Scroll },
  { id: 6, title: 'Equip', icon: Package },
  { id: 7, title: 'Review', icon: Save },
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
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

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

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // For web, we'll use a placeholder image picker
      Alert.alert(
        'Avatar Selection',
        'Choose an avatar option:',
        [
          {
            text: 'Random Fantasy Portrait',
            onPress: () => {
              // Use a random fantasy portrait from Pexels
              const portraits = [
                'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
                'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
                'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=400',
                'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
                'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=400',
              ];
              const randomPortrait = portraits[Math.floor(Math.random() * portraits.length)];
              setAvatarUri(randomPortrait);
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      // For mobile platforms, use the image picker
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select an avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
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
          avatar: avatarUri,
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
    <ScrollView 
      horizontal 
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
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Character Details</Text>
      
      <View style={styles.avatarSection}>
        <Text style={styles.avatarLabel}>Character Portrait</Text>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Camera size={32} color="#666" />
              <Text style={styles.avatarPlaceholderText}>Add Portrait</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Upload size={16} color="#4CAF50" />
          <Text style={styles.uploadButtonText}>
            {avatarUri ? 'Change Portrait' : 'Upload Portrait'}
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
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls.index}
            style={[
              styles.classOptionItem,
              selectedClass?.index === cls.index && styles.optionItemSelected,
            ]}
            onPress={() => setSelectedClass(cls)}
          >
            <View style={styles.classOptionContent}>
              <Text style={[
                styles.classOptionTitle,
                selectedClass?.index === cls.index && styles.optionTextSelected,
              ]}>
                {cls.name}
              </Text>
              <Text style={[
                styles.classOptionDescription,
                selectedClass?.index === cls.index && styles.classOptionDescriptionSelected,
              ]}>
                Hit Die: d{cls.hit_die} • {cls.spellcasting ? 'Spellcaster' : 'Non-spellcaster'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
            </View>
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
        <Text style={styles.subtitle}>Distribute points between 8-15 for each ability</Text>
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
      <Text style={styles.stepTitle}>Starting Equipment</Text>
      <Text style={styles.subtitle}>Your class provides basic equipment to begin your adventure</Text>
      <View style={styles.equipmentPreview}>
        <Text style={styles.equipmentText}>• Leather Armor (AC 11 + Dex modifier)</Text>
        <Text style={styles.equipmentText}>• Simple Weapon (1d6 damage)</Text>
        <Text style={styles.equipmentText}>• Adventuring Pack (rope, rations, etc.)</Text>
        <Text style={styles.equipmentText}>• 50 Gold Pieces</Text>
        {selectedClass?.spellcasting && (
          <Text style={styles.equipmentText}>• Spellcasting Focus</Text>
        )}
      </View>
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
          {selectedClass?.spellcasting && ', Spellcasting Focus'}
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
      case 3: return true; // Abilities always have default values
      case 4: return true; // Skills are optional
      case 5: return true; // Spells are optional
      case 6: return true; // Equipment is automatic
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
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    height: 30,
  },
  stepIndicatorContent: {
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  stepItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 25,
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
    //flex: 1,
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
  },
  classOptionContent: {
    flex: 1,
  },
  classOptionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  classOptionDescription: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  classOptionDescriptionSelected: {
    color: '#fff',
  },
  raceOptionItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
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
  },
  raceOptionDescriptionSelected: {
    color: '#fff',
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
    borderRadius: 12,
    padding: 16,
  },
  equipmentText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
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
});