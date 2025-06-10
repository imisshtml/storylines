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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Send, Home, User as User2, X, CircleAlert as AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { currentCampaignAtom } from '../atoms/campaignAtoms';
import { userAtom } from '../atoms/authAtoms';
import {
  campaignHistoryAtom,
  fetchCampaignHistoryAtom,
  initializeCampaignHistoryRealtimeAtom,
  clearCampaignHistoryAtom,
  addCampaignMessageAtom
} from '../atoms/campaignHistoryAtoms';
import CharacterView from '../components/CharacterView';
import StoryEventItem from '../components/StoryEventItem';
import StoryChoices from '../components/StoryChoices';

export default function StoryScreen() {
  const [userInput, setUserInput] = useState('');
  const [currentCampaign] = useAtom(currentCampaignAtom);
  const [user] = useAtom(userAtom);
  const [isCharacterSheetVisible, setIsCharacterSheetVisible] = useState(false);
  const [showChoices, setShowChoices] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChoices, setCurrentChoices] = useState<string[]>([
    'Explore deeper into the forest',
    'Search for signs of civilization',
    'Set up camp for the night',
    'Listen carefully for any sounds',
  ]);

  // Campaign history atoms
  const [campaignHistory] = useAtom(campaignHistoryAtom);
  const [, fetchCampaignHistory] = useAtom(fetchCampaignHistoryAtom);
  const [, initializeRealtimeSubscription] = useAtom(initializeCampaignHistoryRealtimeAtom);
  const [, clearCampaignHistory] = useAtom(clearCampaignHistoryAtom);
  const [, addCampaignMessage] = useAtom(addCampaignMessageAtom);

  const scrollViewRef = useRef<ScrollView>(null);
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!currentCampaign) {
      router.replace('/home');
      return;
    }

    console.log('StoryScreen: Initializing for campaign:', currentCampaign.uid);

    // Clear previous campaign history when switching campaigns
    clearCampaignHistory();

    // Initial fetch of campaign history
    fetchCampaignHistory(currentCampaign.uid);

    // Initialize real-time subscription
    initializeRealtimeSubscription(currentCampaign.uid).then(unsubscribe => {
      realtimeUnsubscribeRef.current = unsubscribe;
    });

    // Cleanup function
    return () => {
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
      }
    };
  }, [currentCampaign, fetchCampaignHistory, initializeRealtimeSubscription, clearCampaignHistory]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollViewRef.current && campaignHistory.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [campaignHistory]);

  useEffect(() => {
    // Show error alert if there's an error
    if (error) {
      Alert.alert(
        'Connection Error',
        'Failed to get response from Dungeon Master. Please check your internet connection and try again.',
        [
          { text: 'OK', onPress: () => setError(null) }
        ]
      );
    }
  }, [error]);

  const sendPlayerAction = async (action: string, playerId: string = 'player1', playerName: string = 'Player') => {
    if (!currentCampaign || !action.trim()) return;

    console.log('StoryScreen: Sending player action:', action);
    
    setIsLoading(true);
    setError(null);
    setCurrentChoices([]); // Clear choices while loading

    try {
      // Add player message to campaign history
      console.log('StoryScreen: Adding player message to history');
      await addCampaignMessage({
        campaign_uid: currentCampaign.uid,
        message: action,
        author: playerName,
        message_type: 'player',
      });

      // Prepare context for the AI
      const context = {
        campaign: currentCampaign,
        storyHistory: campaignHistory.slice(-5), // Get last 5 messages for context
      };

      console.log('StoryScreen: Sending request to API with context:', {
        campaignId: currentCampaign.id,
        historyLength: context.storyHistory.length
      });

      // Send request to our API route
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: currentCampaign.id,
          message: `Player action: ${action}`,
          context,
          playerAction: action,
        }),
      });

      console.log('StoryScreen: API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('StoryScreen: API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('StoryScreen: API response data:', data);

      // Add DM response to campaign history
      console.log('StoryScreen: Adding DM response to history');
      await addCampaignMessage({
        campaign_uid: currentCampaign.uid,
        message: data.response,
        author: 'DM',
        message_type: 'dm',
      });

      setCurrentChoices(data.choices || []); // Use choices from AI response
      console.log('StoryScreen: Set new choices:', data.choices);

    } catch (error) {
      console.error('StoryScreen: Error sending player action:', error);
      setError(error instanceof Error ? error.message : 'Failed to get DM response');
      setCurrentChoices([]); // Clear choices on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;

    const action = userInput.trim();
    setUserInput('');
    setShowChoices(false);

    await sendPlayerAction(
      action,
      user?.id || 'player1',
      user?.username || user?.email || 'Player'
    );

    // Show choices again after DM responds
    setTimeout(() => setShowChoices(true), 1000);
  };

  const handleChoiceSelect = async (choice: string) => {
    if (isLoading) return;

    setShowChoices(false);
    await sendPlayerAction(
      `I choose to: ${choice}`,
      user?.id || 'player1',
      user?.username || user?.email || 'Player'
    );

    // Show choices again after DM responds
    setTimeout(() => setShowChoices(true), 1000);
  };

  const handleHomePress = () => {
    router.back();
  };

  const handleCharacterPress = () => {
    setIsCharacterSheetVisible(true);
  };

  if (!currentCampaign) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading campaign...</Text>
      </View>
    );
  }

  // Use dynamic choices from AI or fallback to default choices
  const choicesToShow = currentChoices.length > 0
    ? currentChoices
    : [
      'Explore deeper into the forest',
      'Search for signs of civilization',
      'Set up camp for the night',
      'Listen carefully for any sounds',
    ];

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
            <Text style={styles.subtitle}>
              {campaignHistory.length > 0 ? 'Adventure in Progress' : 'Chapter 1: The Beginning'}
            </Text>
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

            {isLoading && (
              <View style={styles.loadingEvent}>
                <ActivityIndicator size="small" color="#FFD700" />
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

            {showChoices && !isLoading && choicesToShow.length > 0 && (
              <StoryChoices
                choices={choicesToShow}
                onChoiceSelect={handleChoiceSelect}
                disabled={isLoading}
              />
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Write your own action..."
              placeholderTextColor="#666"
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!userInput.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!userInput.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Send size={24} color={userInput.trim() ? '#fff' : '#666'} />
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
                  <Text style={styles.characterName}>Eldric the Brave</Text>
                  <Text style={styles.characterClass}>Level 5 Warrior</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsCharacterSheetVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <CharacterView />
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
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
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
  subtitle: {
    fontSize: 14,
    color: '#2a2a2a',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
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
    gap: 12,
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
});