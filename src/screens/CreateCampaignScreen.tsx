import React, { useState, useEffect, useCallback } from 'react';
import { View, Platform, StatusBar, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { CircleAlert as AlertCircle, Save, ArrowLeft, ChevronDown, Trash2, Lock } from 'lucide-react-native';
import { useAtom } from 'jotai';
import { campaignsLoadingAtom, campaignsErrorAtom, currentCampaignAtom, upsertCampaignAtom, type Campaign } from '../atoms/campaignAtoms';
import { userAtom } from '../atoms/authAtoms';
import { router } from 'expo-router';
import AdventureSelectSheet, { type Adventure, ADVENTURES } from '../components/AdventureSelectSheet';
import { supabase } from '../config/supabase';
import { useCustomAlert } from '../components/CustomAlert';
import { useLimitEnforcement } from '../hooks/useLimitEnforcement';
import { fetchUserCapabilitiesAtom } from '../atoms/userCapabilitiesAtoms';
import ActivityIndicator from '../components/ActivityIndicator';

type Tone = 'serious' | 'humorous' | 'grimdark';
type ContentLevel = 'kids' | 'teens' | 'adults';
type RPFocus = 'heavy_rp' | 'rp_focused' | 'balanced' | 'combat_focused' | 'heavy_combat';
type CampaignLength = 'tale' | 'journey' | 'saga' | 'chronicle' | 'epic';
type Verbosity = 'concise' | 'detailed' | 'cinematic';

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

const campaignLengthLabels: Record<CampaignLength, string> = {
  'tale': 'Tale',
  'journey': 'Journey',
  'saga': 'Saga',
  'chronicle': 'Chronicle',
  'epic': 'Epic',
};

const campaignLengthDescriptions: Record<CampaignLength, string> = {
  'tale': 'A compact tale to enjoy in one sitting.',
  'journey': 'A narrative journey full of twists and turns.',
  'saga': 'A classic saga that unfolds over time.',
  'chronicle': 'A winding chronicle for those seeking rich storytelling.',
  'epic': 'An epic experience that defines legends.',
};

const verbosityLabels: Record<Verbosity, string> = {
  'concise': 'Concise',
  'detailed': 'Detailed',
  'cinematic': 'Cinematic',
};

const verbosityDescriptions: Record<Verbosity, string> = {
  'concise': 'Just the facts',
  'detailed': 'Balanced storytelling with setting, emotion, and action',
  'cinematic': 'Rich, immersive story with a focus on roleplay',
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
  const { showAlert } = useCustomAlert();
  const { getGroupSizeLimit } = useLimitEnforcement();
  const [, fetchCapabilities] = useAtom(fetchUserCapabilitiesAtom);

  const [campaignName, setCampaignName] = useState('');
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const [startingLevel, setStartingLevel] = useState('1');
  const [selectedTone, setSelectedTone] = useState<Tone | null>('humorous');
  const [excludedTags, setExcludedTags] = useState<string[]>([]);
  const [contentLevel, setContentLevel] = useState<ContentLevel>('adults');
  const [rpFocusValue, setRpFocusValue] = useState(2); // 0-4 scale, 2 = balanced
  const [playerLimit, setPlayerLimit] = useState(3);
  const [isAdventureSheetVisible, setIsAdventureSheetVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);
  const [isOpenCampaign, setIsOpenCampaign] = useState(false);
  const [campaignLengthValue, setCampaignLengthValue] = useState(2); // 0-4 scale, 2 = saga (default)
  const [verbosityValue, setVerbosityValue] = useState(1); // 0-2 scale, 1 = detailed (default)
  const [maxLevel, setMaxLevel] = useState(20);
  const [isMaxLevelDropdownVisible, setIsMaxLevelDropdownVisible] = useState(false);

  const isEditing = currentCampaign !== null;
  const maxGroupSize = getGroupSizeLimit();

  // Fetch capabilities when component mounts
  useEffect(() => {
    const loadCapabilities = async () => {
      if (user?.id && !capabilitiesLoaded) {
        try {
          await fetchCapabilities();
          setCapabilitiesLoaded(true);
        } catch (error) {
          console.error('Error loading capabilities:', error);
          setCapabilitiesLoaded(true); // Set to true anyway to avoid infinite loading
        }
      }
    };

    loadCapabilities();
  }, [user?.id, fetchCapabilities, capabilitiesLoaded]);

  useEffect(() => {
    // Only initialize form after capabilities are loaded
    if (!capabilitiesLoaded) return;

    if (currentCampaign && isEditing) {
      // Only populate form if we're editing an existing campaign
      setCampaignName(currentCampaign.name);
      setStartingLevel(currentCampaign.level.toString());
      setSelectedTone(currentCampaign.tone);
      setExcludedTags(currentCampaign.exclude || []);
      setContentLevel(currentCampaign.content_level);
      setRpFocusValue(getValueFromRpFocus(currentCampaign.rp_focus));
      setPlayerLimit(Math.min(currentCampaign.limit || 3, maxGroupSize));
      setIsOpenCampaign(currentCampaign.status === 'open');
      setCampaignLengthValue(getValueFromCampaignLength(currentCampaign.campaign_length || 'saga'));
      setVerbosityValue(getValueFromVerbosity(currentCampaign.verbosity || 'detailed'));
      setMaxLevel(currentCampaign.max_level || 20);
      // Set the selected adventure from the campaign's adventure ID
      const adventure = ADVENTURES.find((a: Adventure) => a.id === currentCampaign.adventure);
      if (adventure) {
        setSelectedAdventure(adventure);
      }
    } else {
      // Reset form for new campaign
      setCampaignName('');
      setStartingLevel('1');
      setSelectedTone('humorous');
      setExcludedTags([]);
      setContentLevel('adults');
      setRpFocusValue(2); // balanced
      setPlayerLimit(Math.min(3, maxGroupSize));
      setSelectedAdventure(null);
      setIsOpenCampaign(false);
      setCampaignLengthValue(2); // saga (default)
      setVerbosityValue(1); // detailed (default)
      setMaxLevel(20);
    }
  }, [currentCampaign, isEditing, maxGroupSize, capabilitiesLoaded]);

  // Helper functions to convert between slider value and RPFocus enum
  const rpFocusOptions: RPFocus[] = ['heavy_rp', 'rp_focused', 'balanced', 'combat_focused', 'heavy_combat'];
  
  const getRpFocusFromValue = (value: number): RPFocus => {
    return rpFocusOptions[Math.round(value)] || 'balanced';
  };
  
  const getValueFromRpFocus = (focus: RPFocus): number => {
    return rpFocusOptions.indexOf(focus);
  };

  // Helper functions to convert between slider value and CampaignLength enum
  const campaignLengthOptions: CampaignLength[] = ['tale', 'journey', 'saga', 'chronicle', 'epic'];
  
  const getCampaignLengthFromValue = (value: number): CampaignLength => {
    return campaignLengthOptions[Math.round(value)] || 'saga';
  };
  
  const getValueFromCampaignLength = (length: CampaignLength): number => {
    return campaignLengthOptions.indexOf(length);
  };

  // Helper functions to convert between slider value and Verbosity enum
  const verbosityOptions: Verbosity[] = ['concise', 'detailed', 'cinematic'];
  
  const getVerbosityFromValue = (value: number): Verbosity => {
    return verbosityOptions[Math.round(value)] || 'detailed';
  };
  
  const getValueFromVerbosity = (verbosity: Verbosity): number => {
    return verbosityOptions.indexOf(verbosity);
  };

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
        status: isOpenCampaign ? 'open' : 'creation',
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
        campaign_length: getCampaignLengthFromValue(campaignLengthValue),
        verbosity: getVerbosityFromValue(verbosityValue),
        max_level: maxLevel,
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

  const handleDelete = () => {
    if (!currentCampaign || !isEditing) return;

    showAlert(
      'Delete Campaign',
      'Are you sure you want to delete this campaign? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              
              // Delete the campaign from Supabase
              const { error } = await supabase
                .from('campaigns')
                .delete()
                .eq('id', currentCampaign.id);
              
              if (error) throw error;
              
              // Clear current campaign and navigate back to home
              setCurrentCampaign(null);
              router.replace('/home');
              
              // Show success message
              showAlert(
                'Campaign Deleted',
                'The campaign has been successfully deleted.',
                undefined,
                'success'
              );
            } catch (error) {
              console.error('Error deleting campaign:', error);
              showAlert(
                'Error',
                'Failed to delete campaign. Please try again.',
                undefined,
                'error'
              );
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ],
      'warning'
    );
  };

  if (isLoading) {
    return (
      <ActivityIndicator 
        isLoading={true} 
        fullScreen={true}
        text="Loading campaign..."
      />
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

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
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
            {[1, 2, 3, 4, 5, 6, 7].map(limit => {
              const isLocked = limit > maxGroupSize;
              return (
                <TouchableOpacity
                  key={limit}
                  style={[
                    styles.playerLimitButton,
                    playerLimit === limit && styles.selectedPlayerLimit,
                    isLocked && styles.lockedPlayerLimit
                  ]}
                  onPress={() => {
                    if (!isLocked) {
                      setPlayerLimit(limit);
                    } else {
                      showAlert(
                        'Group Size Limit Reached',
                        `You can only create campaigns with up to ${maxGroupSize} players. Purchase &quot;Group Size +2&quot; in the shop to increase your limit.`,
                        [
                          {
                            text: 'Go to Shop',
                            onPress: () => {
                              router.push('/shop');
                            },
                          },
                          {
                            text: 'Cancel',
                            style: 'cancel',
                          },
                        ],
                        'warning'
                      );
                    }
                  }}
                  disabled={isLocked}
                >
                  {isLocked && (
                    <Lock size={12} color="#666" style={styles.lockIcon} />
                  )}
                  <Text style={[
                    styles.playerLimitText,
                    playerLimit === limit && styles.selectedPlayerLimitText,
                    isLocked && styles.lockedPlayerLimitText
                  ]}>
                    {limit}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.playerLimitDescription}>
            Maximum number of players (including yourself) that can join this campaign.
            {maxGroupSize < 7 && (
              <Text style={styles.upgradeHint}>
                {' '}Ultimate Host subscriptions can have up to 7 players.
              </Text>
            )}
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
          <Text style={styles.label}>Campaign Length</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Tale</Text>
              <Text style={styles.sliderLabelText}>Epic</Text>
            </View>
            <View style={styles.customSlider}>
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderThumb, 
                    { left: `${(campaignLengthValue / 4) * 100}%` }
                  ]} 
                />
                {[0, 1, 2, 3, 4].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.sliderStep,
                      { left: `${(value / 4) * 100}%` }
                    ]}
                    onPress={() => setCampaignLengthValue(value)}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.currentFocusLabel}>
              {campaignLengthLabels[getCampaignLengthFromValue(campaignLengthValue)]}
            </Text>
            <Text style={styles.contentLevelDescription}>
              {campaignLengthDescriptions[getCampaignLengthFromValue(campaignLengthValue)]}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Narrative</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Concise</Text>
              <Text style={styles.sliderLabelText}>Cinematic</Text>
            </View>
            <View style={styles.customSlider}>
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderThumb, 
                    { left: `${(verbosityValue / 2) * 100}%` }
                  ]} 
                />
                {[0, 1, 2].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.sliderStep,
                      { left: `${(value / 2) * 100}%` }
                    ]}
                    onPress={() => setVerbosityValue(value)}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.currentFocusLabel}>
              {verbosityLabels[getVerbosityFromValue(verbosityValue)]}
            </Text>
            <Text style={styles.contentLevelDescription}>
              {verbosityDescriptions[getVerbosityFromValue(verbosityValue)]}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Milestones</Text>
          <TouchableOpacity
            style={styles.adventureSelector}
            onPress={() => setIsMaxLevelDropdownVisible(true)}
          >
            <Text style={styles.adventureSelectorText}>
              Max Level: {maxLevel}
            </Text>
            <ChevronDown color="#fff" size={20} />
          </TouchableOpacity>
          <Text style={styles.contentLevelDescription}>
            The maximum character level for this campaign
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Content Level</Text>
          <View style={styles.contentLevelContainer}>
            {(['adults', 'teens', 'kids' ] as ContentLevel[]).map(level => (
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

        <View style={styles.section}>
          <Text style={styles.label}>Campaign Visibility</Text>
          <TouchableOpacity
            style={styles.openCampaignToggle}
            onPress={() => setIsOpenCampaign(!isOpenCampaign)}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Open Campaign</Text>
              <Text style={styles.toggleDescription}>
                Allow players to discover and join this campaign from the Join Campaigns screen
              </Text>
            </View>
            <View style={[
              styles.toggleSwitch,
              isOpenCampaign && styles.toggleSwitchActive
            ]}>
              <View style={[
                styles.toggleIndicator,
                isOpenCampaign && styles.toggleIndicatorActive
              ]} />
            </View>
          </TouchableOpacity>
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

        {isEditing && currentCampaign && currentCampaign.status === 'creation' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator 
                isLoading={true} 
                size="small" 
                style={styles.deleteButtonSpinner}
              />
            ) : (
              <>
                <Trash2 color="#fff" size={20} />
                <Text style={styles.deleteButtonText}>Delete Campaign</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <AdventureSelectSheet
        isVisible={isAdventureSheetVisible}
        onClose={() => setIsAdventureSheetVisible(false)}
        onSelect={handleAdventureSelect}
        selectedId={selectedAdventure?.id}
      />

      {/* Max Level Dropdown Modal */}
      {isMaxLevelDropdownVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Max Level</Text>
            <ScrollView style={styles.levelList}>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelOption,
                    maxLevel === level && styles.selectedLevelOption
                  ]}
                  onPress={() => {
                    setMaxLevel(level);
                    setIsMaxLevelDropdownVisible(false);
                  }}
                >
                  <Text style={[
                    styles.levelOptionText,
                    maxLevel === level && styles.selectedLevelOptionText
                  ]}>
                    Level {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsMaxLevelDropdownVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  scrollContent: {
    paddingBottom: 50,
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
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
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
    marginBottom: 10,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  customSlider: {
    height: 30,
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
    flexDirection: 'row',
    justifyContent: 'center',
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
  lockedPlayerLimit: {
    backgroundColor: '#1a1a1a',
    opacity: 0.6,
  },
  lockedPlayerLimitText: {
    color: '#666',
  },
  lockIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  upgradeHint: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  deleteButtonSpinner: {
    backgroundColor: 'transparent',
    padding: 0,
    minWidth: 0,
    minHeight: 0,
  },
  openCampaignToggle: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#666',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#4CAF50',
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleIndicatorActive: {
    transform: [{ translateX: 20 }],
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '70%',
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  levelList: {
    maxHeight: 300,
  },
  levelOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
  },
  selectedLevelOption: {
    backgroundColor: '#4CAF50',
  },
  levelOptionText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  selectedLevelOptionText: {
    fontFamily: 'Inter-Bold',
  },
  modalCloseButton: {
    backgroundColor: '#666',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
});