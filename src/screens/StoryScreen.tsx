import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import { Home, User as User2, X, CircleAlert as AlertCircle, Forward, ChevronDown, MessageSquare, Drama, Ear, CircleHelp as HelpCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { currentCampaignAtom } from '../atoms/campaignAtoms';
import { userAtom } from '../atoms/authAtoms';
import { charactersAtom, fetchCharactersAtom, type Character } from '../atoms/characterAtoms';
import {
  campaignHistoryAtom,
  fetchCampaignHistoryAtom,
  initializeCampaignHistoryRealtimeAtom,
  clearCampaignHistoryAtom,
  addCampaignMessageAtom
} from '../atoms/campaignHistoryAtoms';
import { updateCampaignReadStatusAtom } from '../atoms/campaignReadStatusAtoms';
import {
  sortedPlayerActionsAtom,
  fetchPlayerActionsAtom,
  initializePlayerActionsRealtimeAtom,
  getAiChoicesAtom,
  setAiChoicesAtom,
  clearAiChoicesAtom
} from '../atoms/playerActionsAtoms';
import CharacterView from '../components/CharacterView';
import StoryEventItem from '../components/StoryEventItem';
import EnhancedStoryChoices from '../components/EnhancedStoryChoices';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import ActivityIndicator from '../components/ActivityIndicator';
import { useLoading } from '../hooks/useLoading';

type InputType = 'say' | 'rp' | 'whisper' | 'ask';

interface InputOption {
  type: InputType;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  target?: string; // For whisper targets
}

export default function StoryScreen() {
  const [userInput, setUserInput] = useState('');
  const [currentCampaign] = useAtom(currentCampaignAtom);
  const [user] = useAtom(userAtom);
  const [characters] = useAtom(charactersAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [isCharacterSheetVisible, setIsCharacterSheetVisible] = useState(false);
  const [showChoices, setShowChoices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoading, startLoading, stopLoading } = useLoading();

  // Input type selection
  const [selectedInputType, setSelectedInputType] = useState<InputType>('say');
  const [showInputTypeDropdown, setShowInputTypeDropdown] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState<string>('');

  // Campaign history atoms
  const [campaignHistory] = useAtom(campaignHistoryAtom);
  const [, fetchCampaignHistory] = useAtom(fetchCampaignHistoryAtom);
  const [, initializeRealtimeSubscription] = useAtom(initializeCampaignHistoryRealtimeAtom);
  const [, clearCampaignHistory] = useAtom(clearCampaignHistoryAtom);
  const [, addCampaignMessage] = useAtom(addCampaignMessageAtom);
  const [, updateCampaignReadStatus] = useAtom(updateCampaignReadStatusAtom);

  // Player actions atoms
  const [playerActions] = useAtom(sortedPlayerActionsAtom);
  const [, fetchPlayerActions] = useAtom(fetchPlayerActionsAtom);
  const [, initializePlayerActionsRealtime] = useAtom(initializePlayerActionsRealtimeAtom);

  // AI choices persistence atoms
  const [getAiChoices] = useAtom(getAiChoicesAtom);
  const [, setAiChoices] = useAtom(setAiChoicesAtom);
  const [, clearAiChoices] = useAtom(clearAiChoicesAtom);

  const scrollViewRef = useRef<ScrollView>(null);
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);
  const playerActionsUnsubscribeRef = useRef<(() => void) | null>(null);

  // Monitor connection health
  useConnectionMonitor();

  useEffect(() => {
    if (user) {
      fetchCharacters();
    }
  }, [user, fetchCharacters]);

  useEffect(() => {
    if (!currentCampaign) {
      router.replace('/home');
      return;
    }

    // Clear previous campaign history when switching campaigns
    clearCampaignHistory();

    // Initial fetch of campaign history
    fetchCampaignHistory(currentCampaign.uid);

    // Initialize real-time subscription
    const initializeSubscription = async () => {
      try {
        const unsubscribe = await initializeRealtimeSubscription(currentCampaign.uid);
        realtimeUnsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error('Error initializing realtime subscription:', error);
      }
    };

    initializeSubscription();

    // Mark campaign as read when entering
    if (currentCampaign.latest_message_id) {
      updateCampaignReadStatus({
        campaignUid: currentCampaign.uid,
        messageId: currentCampaign.latest_message_id,
      }).catch(error => {
        console.error('Error marking campaign as read on entry:', error);
      });
    }

    // Cleanup function
    return () => {
      if (realtimeUnsubscribeRef.current) {
        try {
          realtimeUnsubscribeRef.current();
          realtimeUnsubscribeRef.current = null;
        } catch (error) {
          console.error('Error during subscription cleanup:', error);
        }
      }
    };
  }, [currentCampaign?.uid, fetchCampaignHistory, initializeRealtimeSubscription, clearCampaignHistory, updateCampaignReadStatus]);

  // Load player actions when campaign and user are available
  useEffect(() => {
    if (!currentCampaign || !user) return;

    console.log('📋 Loading player actions for campaign:', currentCampaign.uid, 'user:', user.id);

    // Fetch player actions from database
    fetchPlayerActions({ campaignUid: currentCampaign.uid, userId: user.id });

    // Initialize real-time subscription for player actions
    const initializePlayerActionsSubscription = async () => {
      try {
        // Clean up any existing subscription first
        if (playerActionsUnsubscribeRef.current) {
          playerActionsUnsubscribeRef.current();
          playerActionsUnsubscribeRef.current = null;
        }

        const unsubscribe = await initializePlayerActionsRealtime({
          campaignUid: currentCampaign.uid,
          userId: user.id
        });
        playerActionsUnsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error('Error initializing player actions realtime:', error);
      }
    };

    initializePlayerActionsSubscription();

    // Log current AI choices for debugging
    const existingAiChoices = getAiChoices(currentCampaign.uid);
    console.log('🎯 Existing AI choices for campaign:', existingAiChoices);

    // Cleanup function
    return () => {
      if (playerActionsUnsubscribeRef.current) {
        try {
          playerActionsUnsubscribeRef.current();
          playerActionsUnsubscribeRef.current = null;
        } catch (error) {
          console.error('Error during player actions subscription cleanup:', error);
        }
      }
    };
  }, [currentCampaign?.uid, user?.id, fetchPlayerActions, initializePlayerActionsRealtime, getAiChoices]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollViewRef.current && campaignHistory.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [campaignHistory]);

  useEffect(() => {
    // Update read status when new messages arrive
    if (currentCampaign && campaignHistory.length > 0) {
      const latestMessage = campaignHistory[campaignHistory.length - 1];
      updateCampaignReadStatus({
        campaignUid: currentCampaign.uid,
        messageId: latestMessage.id,
      }).catch(error => {
        console.error('Error updating read status:', error);
      });
    }
  }, [campaignHistory, currentCampaign, updateCampaignReadStatus]);

  // Add new useEffect to generate initial story when campaign has no history
  useEffect(() => {
    const generateInitialStory = async () => {
      console.log('🔍 generateInitialStory called with:', {
        currentCampaign: currentCampaign?.name,
        user: user?.username,
        campaignHistoryLength: campaignHistory.length,
        isLoading: isLoading('initialStory'),
        campaignStatus: currentCampaign?.status
      });

      if (!currentCampaign || !user || campaignHistory.length > 0 || isLoading('initialStory')) {
        console.log('🚫 Early return from generateInitialStory:', {
          hasCurrentCampaign: !!currentCampaign,
          hasUser: !!user,
          campaignHistoryLength: campaignHistory.length,
          isLoading: isLoading('initialStory')
        });
        return;
      }

      // Generate initial story for campaigns in 'creation', 'waiting' or 'in_progress' status
      if (currentCampaign.status !== 'creation' && currentCampaign.status !== 'waiting' && currentCampaign.status !== 'in_progress') {
        console.log('🚫 Campaign status not eligible for initial story:', currentCampaign.status);
        return;
      }

      console.log('🎭 Generating initial story for campaign:', currentCampaign.name);

      try {
        startLoading('initialStory');
        setError(null);

        // If campaign is still in 'creation' status, transition it to 'waiting'
        if (currentCampaign.status === 'creation') {
          console.log('🔄 Transitioning campaign from creation to waiting status');

          // Update campaign status directly using Supabase
          // The real-time subscription will update our state
          const { supabase } = await import('../config/supabase');
          await supabase
            .from('campaigns')
            .update({ status: 'waiting' })
            .eq('uid', currentCampaign.uid);
        }

        // Prepare context for the initial story generation
        const context = {
          campaign: currentCampaign,
          storyHistory: [], // Empty history for initial story
        };

        console.log('📡 Making API request to /api/story with:', {
          campaignId: currentCampaign.uid,
          playerId: user.id,
          message: 'Generate initial story introduction',
          playerAction: 'INITIAL_STORY_GENERATION'
        });

        // Send request to generate initial story
        const response = await fetch('/api/story', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId: currentCampaign.uid,
            playerId: user.id,
            message: 'Generate initial story introduction',
            context,
            playerAction: 'INITIAL_STORY_GENERATION',
          }),
        });

        console.log('📡 API response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('📡 API response data:', data);

        if (!data.success) {
          throw new Error(data.error || 'Failed to generate initial story');
        }

        console.log('✅ Successfully generated initial story, adding message to campaign');

        // Add the initial story as a DM message
        await addCampaignMessage({
          campaign_uid: currentCampaign.uid,
          message: data.response,
          author: 'DM',
          message_type: 'dm',
        });

        // Set the choices from the initial story
        if (currentCampaign) {
          setAiChoices({ campaignUid: currentCampaign.uid, choices: data.choices || [] });
        }

        console.log('✅ Initial story generation completed successfully');

      } catch (error) {
        console.error('❌ Error generating initial story:', error);
        // Don't show error to user for initial story generation failure
        // Just let them start with the welcome message
      } finally {
        stopLoading('initialStory');
      }
    };

    // Add a small delay to ensure all other useEffects have run
    const timeoutId = setTimeout(generateInitialStory, 500);

    return () => clearTimeout(timeoutId);
  }, [currentCampaign, user, campaignHistory.length, isLoading, startLoading, stopLoading, addCampaignMessage, setAiChoices]);

  // Get current user's character for this campaign
  const getCurrentCharacter = (): Character | null => {
    if (!user || !currentCampaign) return null;
    return characters.find(char =>
      char.user_id === user.id && char.campaign_id === currentCampaign.uid
    ) || null;
  };

  // Get other players in the campaign (for whisper targets)
  const getOtherPlayers = () => {
    if (!currentCampaign || !user) return [];
    return currentCampaign.players.filter(player => player.id !== user.id);
  };

  // Get input options based on current state
  const getInputOptions = (): InputOption[] => {
    const baseOptions: InputOption[] = [
      {
        type: 'say',
        label: 'Say',
        icon: <MessageSquare size={16} color="#4CAF50" />,
        placeholder: 'Say something out loud...'
      },
      {
        type: 'rp',
        label: 'RP',
        icon: <Drama size={16} color="#9C27B0" />,
        placeholder: 'Roleplay your action...'
      },
      {
        type: 'ask',
        label: 'Ask',
        icon: <HelpCircle size={16} color="#2196F3" />,
        placeholder: 'Ask the Dungeon Master...'
      }
    ];

    const otherPlayers = getOtherPlayers();
    if (otherPlayers.length > 0) {
      // Add whisper options for each other player
      otherPlayers.forEach(player => {
        baseOptions.push({
          type: 'whisper',
          label: `Whisper ${player.name}`,
          icon: <Ear size={16} color="#FF9800" />,
          placeholder: `Whisper to ${player.name}...`,
          target: player.id
        });
      });
    }

    return baseOptions;
  };

  const getCurrentPlaceholder = () => {
    const options = getInputOptions();
    if (selectedInputType === 'whisper' && whisperTarget) {
      const whisperOption = options.find(opt => opt.type === 'whisper' && opt.target === whisperTarget);
      return whisperOption?.placeholder || 'Whisper...';
    }
    const option = options.find(opt => opt.type === selectedInputType);
    return option?.placeholder || 'Type your message...';
  };

  const handleInputTypeSelect = (option: InputOption) => {
    setSelectedInputType(option.type);
    if (option.type === 'whisper' && option.target) {
      setWhisperTarget(option.target);
    } else {
      setWhisperTarget('');
    }
    setShowInputTypeDropdown(false);
  };

  const getCurrentInputOption = () => {
    const options = getInputOptions();
    if (selectedInputType === 'whisper' && whisperTarget) {
      return options.find(opt => opt.type === 'whisper' && opt.target === whisperTarget);
    }
    return options.find(opt => opt.type === selectedInputType);
  };

  const sendPlayerAction = async (action: string, playerId: string = 'player1', playerName: string = 'Player') => {
    if (!currentCampaign || !action.trim()) return;

    console.log('🎭 Player action - User data:', {
      userId: user?.id,
      userEmail: user?.email,
      username: user?.username
    });

    if (!user?.id) {
      setError('You need to be logged in to play. Please sign in again.');
      return;
    }

    startLoading('sendAction');
    setError(null);
    // Clear choices while loading
    if (currentCampaign) {
      clearAiChoices(currentCampaign.uid);
    }

    try {
      // Determine message type based on input type
      let messageType: 'player' | 'dm' | 'system' = 'player';
      let formattedMessage = action;
      let messageAuthor = playerName;

      switch (selectedInputType) {
        case 'say':
          formattedMessage = `${playerName} says, "${action}"`;
          break;
        case 'rp':
          formattedMessage = `*${action}*`;
          break;
        case 'whisper':
          if (whisperTarget) {
            const targetPlayer = currentCampaign.players.find(p => p.id === whisperTarget);
            formattedMessage = `[Whispers to ${targetPlayer?.name}] ${action}`;
          }
          break;
        case 'ask':
          formattedMessage = `[Asks DM] ${action}`;
          break;
      }

      // Get current character for this campaign
      const currentCharacter = getCurrentCharacter();

      // Add player message to campaign history (without dice_roll for now)
      await addCampaignMessage({
        campaign_uid: currentCampaign.uid,
        message: formattedMessage,
        author: messageAuthor,
        message_type: messageType,
        character_id: currentCharacter?.id,
        character_name: currentCharacter?.name,
        character_avatar: currentCharacter?.avatar,
        difficulty: 10, // Default difficulty class
      });

      // Only send to AI for non-whisper messages or DM questions
      if (selectedInputType !== 'whisper') {
        // Prepare context for the AI
        const context = {
          campaign: currentCampaign,
          storyHistory: campaignHistory.slice(-5), // Get last 5 messages for context
        };

        // Send request to our API route with user ID in the body
        const response = await fetch('/api/story', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId: currentCampaign.uid, // Use UID for database consistency
            playerId: user.id, // Pass the user ID directly
            message: `Player action: ${action}`,
            context,
            playerAction: action,
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please sign in again.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to get DM response');
        }

        // Add DM response to campaign history
        await addCampaignMessage({
          campaign_uid: currentCampaign.uid,
          message: data.response,
          author: 'DM',
          message_type: 'dm',
        });

        // Use choices from AI response
        if (currentCampaign) {
          setAiChoices({ campaignUid: currentCampaign.uid, choices: data.choices || [] });
        }
      }

    } catch (error) {
      console.error('Error sending player action:', error);
      setError(error instanceof Error ? error.message : 'Failed to get DM response');
      // Clear choices on error
      if (currentCampaign) {
        clearAiChoices(currentCampaign.uid);
      }
    } finally {
      stopLoading('sendAction');
    }
  };

  const handleSend = async () => {
    if (!userInput.trim() || isLoading('sendAction')) return;

    const action = userInput.trim();
    setUserInput('');
    setShowChoices(false);

    await sendPlayerAction(
      action,
      user?.id || 'player1',
      user?.username || user?.email || 'Player'
    );

    // Show choices again after DM responds (except for whispers)
    if (selectedInputType !== 'whisper') {
      setTimeout(() => setShowChoices(true), 1000);
    }
  };

  const handleChoiceSelect = async (choice: string) => {
    if (isLoading('sendAction')) return;

    setShowChoices(false);
    await sendPlayerAction(
      `I choose to: ${choice}`,
      user?.id || 'player1',
      user?.username || user?.email || 'Player'
    );

    // Show choices again after DM responds (except for whispers)
    if (selectedInputType !== 'whisper') {
      setTimeout(() => setShowChoices(true), 1000);
    }
  };

  const handleHomePress = () => {
    router.back();
  };

  const handleCharacterPress = () => {
    setIsCharacterSheetVisible(true);
  };

  if (!currentCampaign) {
    return (
      <ActivityIndicator 
        isLoading={true} 
        fullScreen 
        text="Loading campaign..."
      />
    );
  }

  // Use dynamic choices from AI, database actions, or fallback to defaults
  const getDatabaseActionChoices = () => {
    if (!playerActions || playerActions.length === 0) {
      console.log('🎬 No player actions available');
      return [];
    }

    // Filter for current game mode (exploration by default)
    const currentGameMode = 'exploration';
    const modeActions = playerActions.filter(action => action.game_mode === currentGameMode);

    // Convert action data to choice strings
    return modeActions.map(action => action.action_data.title);
  };

  const databaseChoices = getDatabaseActionChoices();
  const aiChoices = currentCampaign ? getAiChoices(currentCampaign.uid) : [];

  const choicesToShow = aiChoices.length > 0
    ? aiChoices // Use AI-generated choices first
    : databaseChoices.length > 0
      ? databaseChoices // Use database actions second
      : [
        'Explore deeper into the forest',
        'Search for signs of civilization',
        'Set up camp for the night',
        'Listen carefully for any sounds',
      ]; // Fallback to defaults last

  const currentCharacter = getCurrentCharacter();
  const currentInputOption = getCurrentInputOption();

  return (
    <ImageBackground
      source={require('../../assets/images/paper_background.jpg')}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleHomePress} style={styles.headerButton}>
            <Home size={24} color="#2a2a2a" />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.title}>{currentCampaign.name}</Text>
          </View>

          <TouchableOpacity onPress={handleCharacterPress} style={styles.headerButton}>
            <User2 size={24} color="#2a2a2a" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.storyContainer}
            showsVerticalScrollIndicator={false}
          >
            {campaignHistory.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>
                  Welcome to {currentCampaign.name}! Your adventure is about to begin...
                </Text>
                <Text style={styles.instructionText}>
                  Choose an action below or write your own to start the story.
                </Text>
              </View>
            ) : (
              campaignHistory.map((message) => (
                <StoryEventItem key={message.id} message={message} />
              ))
            )}

            {isLoading('initialStory') && (
              <View style={styles.loadingEvent}>
                <ActivityIndicator size="small" color="#FFD700" isLoading={true} />
                <Text style={styles.loadingEventText}>
                  The Dungeon Master is preparing your adventure...
                </Text>
              </View>
            )}

            {isLoading('sendAction') && (
              <View style={styles.loadingEvent}>
                <ActivityIndicator size="small" color="#FFD700" isLoading={true} />
                <Text style={styles.loadingEventText}>
                  The Dungeon Master is thinking...
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color="#f44336" />
                <Text style={styles.errorText}>
                  Failed to connect to Dungeon Master. Please try again.
                </Text>
              </View>
            )}

            {showChoices && !isLoading('sendAction') && selectedInputType !== 'whisper' && (
              <EnhancedStoryChoices
                choices={choicesToShow}
                onChoiceSelect={handleChoiceSelect}
                disabled={isLoading('sendAction')}
              />
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            {/* Input Type Selector */}
            <View style={styles.inputTypeContainer}>
              <TouchableOpacity
                style={styles.inputTypeButton}
                onPress={() => setShowInputTypeDropdown(!showInputTypeDropdown)}
              >
                <Text style={styles.inputTypeText}>{currentInputOption?.label}</Text>
                <ChevronDown size={16} color="#888" />
              </TouchableOpacity>

              {/* Dropdown */}
              {showInputTypeDropdown && (
                <View style={styles.inputTypeDropdown}>
                  {getInputOptions().map((option, index) => (
                    <TouchableOpacity
                      key={`${option.type}-${option.target || 'default'}-${index}`}
                      style={[
                        styles.inputTypeOption,
                        selectedInputType === option.type &&
                        (!option.target || option.target === whisperTarget) &&
                        styles.selectedInputTypeOption
                      ]}
                      onPress={() => handleInputTypeSelect(option)}
                    >
                      <Text style={styles.inputTypeOptionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={setUserInput}
              placeholder={getCurrentPlaceholder()}
              placeholderTextColor="#666"
              multiline
              maxLength={500}
              editable={!isLoading('sendAction')}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!userInput.trim() || isLoading('sendAction')) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!userInput.trim() || isLoading('sendAction')}
            >
              {isLoading('sendAction') ? (
                <ActivityIndicator size="small" color="#666" isLoading={true} />
              ) : (
                <Forward size={24} color={userInput.trim() ? '#fff' : '#666'} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <Modal
          visible={isCharacterSheetVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsCharacterSheetVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <View style={styles.sheetHeader}>
                  {currentCharacter ? (
                    <>
                      <Text style={styles.characterName}>{currentCharacter.name}</Text>
                      <Text style={styles.characterClass}>
                        Level {currentCharacter.level} {currentCharacter.race} {currentCharacter.class}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.characterName}>No Character</Text>
                      <Text style={styles.characterClass}>Select a character for this campaign</Text>
                    </>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setIsCharacterSheetVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              {currentCharacter ? (
                <CharacterView character={currentCharacter} />
              ) : (
                <View style={styles.noCharacterContainer}>
                  <Text style={styles.noCharacterText}>
                    You haven&apos;t selected a character for this campaign yet.
                  </Text>
                  <TouchableOpacity
                    style={styles.selectCharacterButton}
                    onPress={() => {
                      setIsCharacterSheetVisible(false);
                      router.push('/invite');
                    }}
                  >
                    <Text style={styles.selectCharacterButtonText}>Select Character</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    marginHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: '#2a2a2a',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  storyContainer: {
    flex: 1,
    padding: 16,
  },
  welcomeContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  welcomeText: {
    fontSize: 18,
    color: '#1a1a1a',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    marginVertical: 8,
  },
  loadingEventText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 6,
    position: 'relative',
  },
  inputTypeContainer: {
    position: 'relative',
  },
  inputTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
    minWidth: 70,
  },
  inputTypeText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  inputTypeDropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
    minWidth: 180,
  },
  inputTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedInputTypeOption: {
    backgroundColor: '#4CAF50',
  },
  inputTypeOptionText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: 'rgb(26, 26, 26)',
  },
  closeButton: {
    padding: 4,
  },
  characterName: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  characterClass: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  sheetHeader: {
    // padding: 16,
  },
  noCharacterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noCharacterText: {
    fontSize: 18,
    color: '#666',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  selectCharacterButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  selectCharacterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  playerActionsPanel: {
    marginVertical: 16,
  },
});