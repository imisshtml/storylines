import React, { useState, useEffect, useCallback } from 'react';
import { View, Platform, StatusBar, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { CircleAlert as AlertCircle, Save, ArrowLeft, ChevronDown } from 'lucide-react-native';
import { useAtom } from 'jotai';
import { campaignsLoadingAtom, campaignsErrorAtom, currentCampaignAtom, upsertCampaignAtom, type Campaign } from '../atoms/campaignAtoms';
import { userAtom } from '../atoms/authAtoms';
import { router } from 'expo-router';
import AdventureSelectSheet, { type Adventure, ADVENTURES } from '../components/AdventureSelectSheet';

type Tone = 'serious' | 'humorous' | 'grimdark';
type ContentLevel = 'kids' | 'teens' | 'adults';
type RPFocus = 'heavy_rp' | 'rp_focused' | 'balanced' | 'combat_focused' | 'heavy_combat';

const contentTags = [
  'Gore',
  'Horror',
  'Abuse',
  'Death',
  'Rituals',
  'Romance',
  'Betrayal',
  'Drug Use',
  'Violence',
  'Self-harm',
  'Mental Health',
];

const rpFocusLabels: Record<RPFocus, string> = {
  'heavy_rp': 'Heavy Roleplay',
  'rp_focused': 'Roleplay Focused',
  'balanced': 'Balanced',
  'combat_focused': 'Combat Focused',
  'heavy_combat': 'Heavy Combat',
};

const contentLevelDescriptions: Record<ContentLevel, string> = {
  'kids': 'Suitable for children. No mature themes or violence.',
  'teens': 'Mild themes and fantasy violence. Similar to YA content.',
  'adults': 'Mature themes and content. Default setting.',
};

export default function CreateCampaignScreen() {
  const [currentCampaign, setCurrentCampaign] = useAtom(currentCampaignAtom);
  const [isLoading] = useAtom(campaignsLoadingAtom);
  const [error] = useAtom(campaignsErrorAtom);
  const [, upsertCampaign] = useAtom(upsertCampaignAtom);
  const [user] = useAtom(userAtom);

  const [campaignName, setCampaignName] = useState('');
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const [startingLevel, setStartingLevel] = useState('1');
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);
  const [contentLevel, setContentLevel] = useState<ContentLevel>('adults');
  const [rpFocusValue, setRpFocusValue] = useState(2); // 0-4 scale, 2 = balanced
  const [playerLimit, setPlayerLimit] = useState(3);
  const [isAdventureSheetVisible, setIsAdventureSheetVisible] = useState(false);

  const isEditing = currentCampaign !== null;

  // Helper functions to convert between slider value and RPFocus enum
  const rpFocusOptions: RPFocus[] = ['heavy_rp', 'rp_focused', 'balanced', 'combat_focused', 'heavy_combat'];
  
  const getRpFocusFromValue = (value: number): RPFocus => {
    return rpFocusOptions[Math.round(value)] || 'balanced';
  };
  
  const getValueFromRpFocus = (focus: RPFocus): number => {
    return rpFocusOptions.indexOf(focus);
  };

  useEffect(() => {
    if (currentCampaign && isEditing) {
      // Only populate form if we're editing an existing campaign
      setCampaignName(currentCampaign.name);
      setStartingLevel(currentCampaign.level.toString());
      setSelectedTone(currentCampaign.tone);
      setExcludedTags(currentCampaign.exclude || []);
      setContentLevel(currentCampaign.content_level);
      setRpFocusValue(getValueFromRpFocus(currentCampaign.rp_focus));
      setPlayerLimit(currentCampaign.limit || 3);
      // Set the selected adventure from the campaign's adventure ID
      const adventure = ADVENTURES.find((a: Adventure) => a.id === currentCampaign.adventure);
      if (adventure) {
        setSelectedAdventure(adventure);
      }
    } else {
      // Reset form for new campaign
      setCampaignName('');
      setStartingLevel('1');
      setSelectedTone(null);
      setExcludedTags([]);
      setContentLevel('adults');
      setRpFocusValue(2); // balanced
      setPlayerLimit(3);
      setSelectedAdventure(null);
    }
  }, [currentCampaign, isEditing]);

  const handleBack = () => {
    setCurrentCampaign(null);
    router.push('/');
  };

  const toggleTag = (tag: string) => {
    setExcludedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAdventurePress = useCallback(() => {
    setIsAdventureSheetVisible(true);
  }, []);

  const handleAdventureSelect = useCallback((adventure: Adventure) => {
    setSelectedAdventure(adventure);
  }, []);

  const handleSave = async () => {
    if (!campaignName || !selectedAdventure || !selectedTone || !user) return;

    try {
      const campaignData: Partial<Campaign> = {
        name: campaignName,
        adventure: selectedAdventure.id,
        level: parseInt(startingLevel, 10),
        tone: selectedTone,
        exclude: excludedTags,
        status: 'creation',
        players: [{
          id: user.id,
          name: user.username || '',
          ready: false,
        }],
        invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        owner: user.id,
        content_level: contentLevel,
        rp_focus: getRpFocusFromValue(rpFocusValue),
        limit: playerLimit,
      };

      // If editing, include the ID
      if (isEditing && currentCampaign) {
        campaignData.id = currentCampaign.id;
      }

      const savedCampaign = await upsertCampaign(campaignData);
      setCurrentCampaign(savedCampaign);
      router.push('/invite');
    } catch (err) {
      console.error('Error saving campaign:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backButton}>
          <TouchableOpacity onPress={handleBack} style={styles.touchable} />
          <ArrowLeft color="#fff" size={24} />
        </View>
        <Text style={styles.title}>{isEditing ? 'Edit Campaign' : 'Create New Campaign'}</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle color="#f44336" size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Campaign Name</Text>
          <TextInput
            style={styles.input}
            value={campaignName}
            onChangeText={setCampaignName}
            placeholder="Enter campaign name"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Choose Adventure</Text>
          <TouchableOpacity
            style={styles.adventureSelector}
            onPress={handleAdventurePress}
          >
            <Text style={styles.adventureSelectorText}>
              {selectedAdventure ? selectedAdventure.title : 'Select Adventure'}
            </Text>
            <ChevronDown color="#fff" size={20} />
          </TouchableOpacity>
          {selectedAdventure && (
            <Text style={styles.adventureDescription}>
              {selectedAdventure.description}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Player Limit</Text>
          <View style={styles.playerLimitContainer}>
            {[1, 2, 3, 4, 5, 6, 7].map(limit => (
              <TouchableOpacity
                key={limit}
                style={[
                  styles.playerLimitButton,
                  playerLimit === limit && styles.selectedPlayerLimit
                ]}
                onPress={() => setPlayerLimit(limit)}
              >
                <Text style={[
                  styles.playerLimitText,
                  playerLimit === limit && styles.selectedPlayerLimitText
                ]}>
                  {limit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.playerLimitDescription}>
            Maximum number of players (including yourself) that can join this campaign.
          </Text>
        </View>

        {false && (<View style={styles.section}>
          <Text style={styles.label}>Starting Level</Text>
          <TextInput
            style={styles.input}
            value={startingLevel}
            onChangeText={setStartingLevel}
            keyboardType="numeric"
            placeholder="Enter starting level"
            placeholderTextColor="#666"
          />
        </View>)}

        <View style={styles.section}>
          <Text style={styles.label}>Campaign Tone</Text>
          <View style={styles.toneContainer}>
            {(['serious', 'humorous', 'grimdark'] as Tone[]).map(tone => (
              <TouchableOpacity
                key={tone}
                style={[
                  styles.toneButton,
                  selectedTone === tone && styles.selectedTone
                ]}
                onPress={() => setSelectedTone(tone)}
              >
                <Text style={[
                  styles.toneText,
                  selectedTone === tone && styles.selectedToneText
                ]}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Content Level</Text>
          <View style={styles.contentLevelContainer}>
            {(['kids', 'teens', 'adults'] as ContentLevel[]).map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.contentLevelButton,
                  contentLevel === level && styles.selectedContentLevel
                ]}
                onPress={() => setContentLevel(level)}
              >
                <Text style={[
                  styles.contentLevelText,
                  contentLevel === level && styles.selectedContentLevelText
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.contentLevelDescription}>
            {contentLevelDescriptions[contentLevel]}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Roleplay vs Combat Focus</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Heavy RP</Text>
              <Text style={styles.sliderLabelText}>Heavy Combat</Text>
            </View>
            <View style={styles.customSlider}>
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderThumb, 
                    { left: `${(rpFocusValue / 4) * 100}%` }
                  ]} 
                />
                {[0, 1, 2, 3, 4].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.sliderStep,
                      { left: `${(value / 4) * 100}%` }
                    ]}
                    onPress={() => setRpFocusValue(value)}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.currentFocusLabel}>
              {rpFocusLabels[getRpFocusFromValue(rpFocusValue)]}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Content to Exclude</Text>
          <Text style={styles.contentLevelDescription}>
            Dark Realms content—such as sexual themes, religious extremism, or real-world hate—are banished from our adventures.
          </Text>
          <View style={styles.tagsContainer}>
            {contentTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  excludedTags.includes(tag) && styles.selectedTag
                ]}
                onPress={() => toggleTag(tag)}
              >
                {excludedTags.includes(tag) && (
                  <AlertCircle size={16} color="#fff" style={styles.tagIcon} />
                )}
                <Text style={[
                  styles.tagText,
                  excludedTags.includes(tag) && styles.selectedTagText
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!campaignName || !selectedAdventure || !selectedTone) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!campaignName || !selectedAdventure || !selectedTone}
        >
          <Save color="#fff" size={20} />
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Save Changes' : 'Create Campaign'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AdventureSelectSheet
        isVisible={isAdventureSheetVisible}
        onClose={() => setIsAdventureSheetVisible(false)}
        onSelect={handleAdventureSelect}
        selectedId={selectedAdventure?.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#121212',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 16,
  },
  touchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  adventureSelector: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adventureSelectorText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  adventureDescription: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
  toneContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toneButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedTone: {
    backgroundColor: '#4CAF50',
  },
  toneText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedToneText: {
    fontFamily: 'Inter-Bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTag: {
    backgroundColor: '#f44336',
  },
  tagIcon: {
    marginRight: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedTagText: {
    fontFamily: 'Inter-Bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorContainer: {
    backgroundColor: '#f443361a',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  contentLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contentLevelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedContentLevel: {
    backgroundColor: '#4CAF50',
  },
  contentLevelText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedContentLevelText: {
    fontFamily: 'Inter-Bold',
  },
  contentLevelDescription: {
    color: '#999',
    fontSize: 14,
    marginTop: 0,
    fontFamily: 'Inter-Regular',
  },
  sliderContainer: {
    paddingVertical: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  customSlider: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    position: 'relative',
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderStep: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    backgroundColor: '#666',
    borderRadius: 6,
    marginLeft: -6,
  },
  currentFocusLabel: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  playerLimitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  playerLimitButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  selectedPlayerLimit: {
    backgroundColor: '#4CAF50',
  },
  playerLimitText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedPlayerLimitText: {
    fontFamily: 'Inter-Bold',
  },
  playerLimitDescription: {
    color: '#999',
    fontSize: 14,
    marginTop: 0,
    fontFamily: 'Inter-Regular',
  },
});