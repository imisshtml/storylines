import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, User as User2, X, CircleAlert as AlertCircle, Forward, ChevronDown, MessageSquare, Drama, Ear, CircleHelp as HelpCircle, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { currentCampaignAtom, fetchCampaignsAtom } from '../atoms/campaignAtoms';
import { userAtom } from '../atoms/authAtoms';
import { charactersAtom, fetchCharactersAtom, type Character } from '../atoms/characterAtoms';
import PartyDisplay from '../components/PartyDisplay';
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
import ContentReportModal from '../components/ContentReportModal';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import ActivityIndicator from '../components/ActivityIndicator';
import { useLoading } from '../hooks/useLoading';
import { initializeCampaignBroadcast, broadcastActionStarted, broadcastActionCompleted, createRealtimeSubscription } from '../utils/connectionUtils';
import BannerAd from '../components/BannerAd';
import LottieView from 'lottie-react-native';
import { BannerAdSize } from 'react-native-google-mobile-ads';
import { purchaseManager } from '../utils/purchaseManager';

type InputType = 'say' | 'rp' | 'whisper' | 'ask' | 'action' | 'ooc';

interface InputOption {
  type: InputType;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  target?: string; // For whisper targets
}

export default function StoryScreen() {
  const insets = useSafeAreaInsets();
  const [userInput, setUserInput] = useState('');
  const [currentCampaign, setCurrentCampaign] = useAtom(currentCampaignAtom);
  const [user] = useAtom(userAtom);
  const [characters] = useAtom(charactersAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [, fetchCampaigns] = useAtom(fetchCampaignsAtom);
  const [isCharacterSheetVisible, setIsCharacterSheetVisible] = useState(false);
  const [isPartyDisplayExpanded, setIsPartyDisplayExpanded] = useState(false);
  const [showChoices, setShowChoices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoading, startLoading, stopLoading, withLoading } = useLoading();
  const [shouldHideAds, setShouldHideAds] = useState(false);

  // Input type selection
  const [selectedInputType, setSelectedInputType] = useState<InputType>('say');
  const [showInputTypeDropdown, setShowInputTypeDropdown] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [otherPlayerActions, setOtherPlayerActions] = useState<{[playerId: string]: {playerName: string, action: string}}>({});
  const [reportingMessage, setReportingMessage] = useState<typeof campaignHistory[0] | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);

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

  // Store refs to avoid useEffect dependency issues
  const atomRefs = useRef({
    fetchCampaignHistory,
    initializeRealtimeSubscription,
    clearCampaignHistory,
    updateCampaignReadStatus,
    fetchPlayerActions,
    initializePlayerActionsRealtime,
    getAiChoices,
    setAiChoices,
    clearAiChoices,
    addCampaignMessage
  });

  // Update refs when atoms change
  useEffect(() => {
    atomRefs.current = {
      fetchCampaignHistory,
      initializeRealtimeSubscription,
      clearCampaignHistory,
      updateCampaignReadStatus,
      fetchPlayerActions,
      initializePlayerActionsRealtime,
      getAiChoices,
      setAiChoices,
      clearAiChoices,
      addCampaignMessage
    };
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);
  const playerActionsUnsubscribeRef = useRef<(() => void) | null>(null);
  const subscriptionHealthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageCountRef = useRef(0);
  const [animation] = useState(new Animated.Value(0));
  const broadcastCleanupRef = useRef<(() => void) | null>(null);

  // Add performance tracking refs
  const lastScrollTime = useRef(0);
  const scrollDebounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderCount = useRef(0);
  const lastHistoryLength = useRef(0);
  // Stabilize callback functions to prevent useConnectionMonitor from restarting
  const onConnectionLost = useCallback(() => {
    console.log('🔴 Story screen connection lost');
    setConnectionStatus('disconnected');
    setError('Connection lost. Stories may not load properly.');
  }, []);

  const onConnectionRestored = useCallback(() => {
    console.log('🟢 Story screen connection restored');
    setConnectionStatus('connected');
    setError(null);
    setRetryCount(0);
  }, []);

  // Enhanced connection monitoring for this critical screen
  useConnectionMonitor({
    onConnectionLost,
    onConnectionRestored,
    checkInterval: 30000 // More frequent checks for story screen (30 seconds)
  });

  // Track render performance
  renderCount.current++;
  if (renderCount.current % 10 === 0) {
    console.log(`📊 StoryScreen render count: ${renderCount.current}`);
  }

  useEffect(() => {
    const toValue = isPartyDisplayExpanded ? 1 : 0;
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isPartyDisplayExpanded, animation]);

  // Check if ads should be hidden based on purchases
  useEffect(() => {
    const checkAdStatus = async () => {
      try {
        // Initialize purchase manager if user is available and not already initialized
        if (user?.id) {
          await purchaseManager.initialize(user.id);
        }
        
        const hideAds = await purchaseManager.shouldHideAds();
        setShouldHideAds(hideAds);
      } catch (error) {
        console.error('Error checking ad status:', error);
        setShouldHideAds(false); // Show ads by default if check fails
      }
    };

    if (user?.id) {
      checkAdStatus();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchCharacters();
    }
  }, [user, fetchCharacters]);

  useEffect(() => {
    console.log('📖 STORY SCREEN - useEffect triggered');
    console.log('📖 Current campaign:', currentCampaign ? currentCampaign.name : 'NONE');
    console.log('📖 Campaign status:', currentCampaign?.status);
    
    if (!currentCampaign && !isLoading('sendAction')) {
      console.log('📖 No current campaign, redirecting to home');
      router.replace('/home');
      return;
    }
    
    if (!currentCampaign) {
      // Campaign is null but we're loading, so just return early
      return;
    }
    
    console.log('📖 Campaign found, initializing story screen');

    // Clear previous campaign history when switching campaigns
    atomRefs.current.clearCampaignHistory();

    // Initial fetch of campaign history
    atomRefs.current.fetchCampaignHistory(currentCampaign.id);

    // Initialize real-time subscription
    const initializeSubscription = async () => {
      try {
        console.log('🔄 Initializing campaign history subscription for:', currentCampaign.id);
        const unsubscribe = await atomRefs.current.initializeRealtimeSubscription(currentCampaign.id);
        realtimeUnsubscribeRef.current = unsubscribe;
        console.log('✅ Campaign history subscription initialized');
      } catch (error) {
        console.error('❌ Error initializing realtime subscription:', error);
      }
    };

    initializeSubscription();

    // Start subscription health monitoring
    const startHealthCheck = () => {
      console.log('🏥 Subscription health monitoring disabled - using broadcast system instead');
      // Temporarily disable health check to let broadcast system work without interference
    };
    startHealthCheck();

    // Initialize broadcast system for real-time action coordination
    const initializeBroadcast = () => {
      if (broadcastCleanupRef.current) {
        broadcastCleanupRef.current();
      }
      
      broadcastCleanupRef.current = initializeCampaignBroadcast(currentCampaign.id, {
        onActionStarted: (data) => {
          console.log('===================^^^^^===================');
          console.log('📢 Other player action started:', data);
          // Don't show loading for our own actions
          if (data.playerId !== user?.id) {
            setOtherPlayerActions(prev => ({
              ...prev,
              [data.playerId]: { playerName: data.playerName, action: data.action }
            }));
            
            // Simple timeout fallback - only as last resort
            setTimeout(() => {
              console.log('⏰ Timeout fallback: Clearing action for player:', data.playerId);
              setOtherPlayerActions(prev => {
                const newState = { ...prev };
                delete newState[data.playerId];
                return newState;
              });
              atomRefs.current.fetchCampaignHistory(currentCampaign.id);
            }, 45000); // 45 second timeout
          }
        },
        onActionCompleted: (data) => {
          console.log('============================================');
          console.log('📢 Action completed broadcast received:', data);
          // Clear the loading state for this player
          setOtherPlayerActions(prev => {
            const newState = { ...prev };
            delete newState[data.playerId];
            return newState;
          });
          
          // Refresh campaign history if the action was successful
          if (data.success) {
            console.log('📢 Action completed successfully, refreshing history');
            atomRefs.current.fetchCampaignHistory(currentCampaign.id);
          } else {
            console.log('📢 Action completed with failure');
          }
        }
      });
      
      console.log('📡 Campaign broadcast initialized');
    };
    
    initializeBroadcast();

    // Mark campaign as read when entering
    if (currentCampaign.latest_message_id) {
      atomRefs.current.updateCampaignReadStatus({
        campaignId: currentCampaign.id,
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
      
      if (subscriptionHealthCheckRef.current) {
        clearInterval(subscriptionHealthCheckRef.current);
        subscriptionHealthCheckRef.current = null;
        console.log('🧹 Subscription health monitoring stopped');
      }
      
      if (broadcastCleanupRef.current) {
        broadcastCleanupRef.current();
        broadcastCleanupRef.current = null;
      }
    };
  }, [currentCampaign?.id]);
  // Load player actions when campaign and user are available
  useEffect(() => {
    if (!currentCampaign || !user) return;
    console.log('📋 Loading player actions for campaign:', currentCampaign.id, 'user:', user.id);

    // Fetch player actions from database
    atomRefs.current.fetchPlayerActions({ campaignId: currentCampaign.id, userId: user.id });

    // Initialize real-time subscription for player actions
    const initializePlayerActionsSubscription = async () => {
      try {
        // Clean up any existing subscription first
        if (playerActionsUnsubscribeRef.current) {
          playerActionsUnsubscribeRef.current();
          playerActionsUnsubscribeRef.current = null;
        }

        const unsubscribe = await atomRefs.current.initializePlayerActionsRealtime({
          campaignId: currentCampaign.id,
          userId: user.id
        });
        playerActionsUnsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error('Error initializing player actions realtime:', error);
      }
    };

    initializePlayerActionsSubscription();

    // Log current AI choices for debugging
    const existingAiChoices = atomRefs.current.getAiChoices(currentCampaign.id);
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
  }, [currentCampaign?.id, user?.id]);

  // Track when initial data loading is complete
  useEffect(() => {
    if (!currentCampaign || !user) {
      setIsInitialLoading(true);
      return;
    }
    // Check if all essential data has loaded
    const hasHistoryLoaded = campaignHistory.length >= 0; // Even empty history counts as "loaded"
    const hasPlayerActionsLoaded =
      Array.isArray(playerActions) || playerActions === undefined; // Even undefined actions counts as "loaded"
    
    if (hasHistoryLoaded && hasPlayerActionsLoaded) {
      // Wait 500ms before dismissing the campfire loader
      const dismissTimeout = setTimeout(() => {
        setIsInitialLoading(false);
        
        // Scroll to bottom after loader is dismissed and UI has updated
        setTimeout(() => {
          if (scrollViewRef.current && campaignHistory.length > 0) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 100); // Small delay to ensure UI has updated
      }, 500);

      return () => clearTimeout(dismissTimeout);
    }
  }, [currentCampaign, user, campaignHistory.length, playerActions.length]);

  useEffect(() => {
    // Debounced auto-scroll to prevent excessive scrolling operations
    // Don't auto-scroll while initial loader is showing
    if (scrollViewRef.current && campaignHistory.length > 0 && !isInitialLoading) {
      const now = Date.now();
      
      // Only scroll if enough time has passed since last scroll
      if (now - lastScrollTime.current > 300) {
        if (scrollDebounceTimeout.current) {
          clearTimeout(scrollDebounceTimeout.current);
        }
        
        scrollDebounceTimeout.current = setTimeout(() => {
          try {
            scrollViewRef.current?.scrollToEnd({ animated: true });
            lastScrollTime.current = Date.now();
          } catch (error) {
            console.error('Error scrolling to end:', error);
          }
        }, 150);
      }
    }
    
    return () => {
      if (scrollDebounceTimeout.current) {
        clearTimeout(scrollDebounceTimeout.current);
      }
    };
  }, [campaignHistory.length, isInitialLoading]); // Include isInitialLoading in dependencies
  useEffect(() => {
    // Debounced read status update to prevent excessive API calls
    if (currentCampaign && campaignHistory.length > lastHistoryLength.current) {
      const latestMessage = campaignHistory[campaignHistory.length - 1];
      
      // Debounce the read status update
      const updateTimeout = setTimeout(() => {
        atomRefs.current.updateCampaignReadStatus({
          campaignId: currentCampaign.id,
          messageId: latestMessage.id,
        }).catch(error => {
          console.error('Error updating read status:', error);
        });
      }, 1000); // 1 second debounce
      
      lastHistoryLength.current = campaignHistory.length;
      
      return () => clearTimeout(updateTimeout);
    }
  }, [campaignHistory.length, currentCampaign?.id]);

  // Add new useEffect to generate initial story when campaign has no history
  useEffect(() => {
    // Early exit if campaign is not eligible for initial story generation
    if (!currentCampaign || 
        (currentCampaign.status !== 'creation' && 
         currentCampaign.status !== 'waiting' && 
         currentCampaign.status !== 'in_progress')) {
      return;
    }

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
            .eq('uid', currentCampaign.id);
        }

        // Prepare context for the initial story generation
        const context = {
          campaign: currentCampaign,
          storyHistory: [], // Empty history for initial story
        };

        console.log('📡 Making API request to /api/story with:', {
          campaignId: currentCampaign.id,
          playerId: user.id,
          message: 'Generate initial story introduction',
          playerAction: 'INITIAL_STORY_GENERATION'
        });

        // Use production endpoint for API calls
        const middlewareUrl = process.env.EXPO_PUBLIC_MIDDLEWARE_SERVICE_URL || 'http://localhost:3001';
        const fullUrl = `${middlewareUrl}/api/game/action`;
        
        console.log('📡 Middleware URL from env:', process.env.EXPO_PUBLIC_MIDDLEWARE_SERVICE_URL);
        console.log('📡 Initial story API endpoint:', fullUrl);

        // Send request to generate initial story
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId: currentCampaign.id,
            playerId: user.id,
            characterId: null,
            action: 'INITIAL_STORY_GENERATION',
            actionType: 'initial_story',
            chatType: 'action',
            shouldContributeToStory: true,
            metadata: {
              context,
              playerAction: 'INITIAL_STORY_GENERATION',
              timestamp: new Date().toISOString()
            }
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

        // Add the initial story as a GM message
        await atomRefs.current.addCampaignMessage({
          campaign_id: currentCampaign.id,
          message: data.response,
          author: 'GM',
          message_type: 'gm',
        });

        // Set the choices from the initial story
        if (currentCampaign) {
          atomRefs.current.setAiChoices({ campaignId: currentCampaign.id, choices: data.choices || [] });
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
  }, [currentCampaign, user, campaignHistory.length]);
  // Get current user's character for this campaign
  const getCurrentCharacter = (): Character | null => {
    if (!user || !currentCampaign) return null;
    return characters.find(char =>
      char.user_id === user.id && char.campaign_id === currentCampaign.id
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
        type: 'ooc',
        label: 'OoC',
        icon: <MessageSquare size={16} color="#4CAF50" />,
        placeholder: 'Say something out of character...'
      },
      {
        type: 'ask',
        label: 'Ask',
        icon: <HelpCircle size={16} color="#2196F3" />,
        placeholder: 'Ask the Storyteller...'
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

  // Helper function to infer action type from message content
  const inferActionType = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    // Handle initial story generation
    if (message === 'INITIAL_STORY_GENERATION' || lowerMessage.includes('initial story') || lowerMessage.includes('generate initial')) {
      return 'initial_story';
    }

    if (lowerMessage.includes('attack') || lowerMessage.includes('strike') || lowerMessage.includes('hit')) {
      return 'attack';
    }
    if (lowerMessage.includes('cast') || lowerMessage.includes('spell') || lowerMessage.includes('magic')) {
      return 'spell';
    }
    if (lowerMessage.includes('persuade') || lowerMessage.includes('convince') || lowerMessage.includes('talk') || lowerMessage.includes('negotiate')) {
      return 'social';
    }
    if (lowerMessage.includes('move') || lowerMessage.includes('go') || lowerMessage.includes('walk') || lowerMessage.includes('run')) {
      return 'movement';
    }
    if (lowerMessage.includes('search') || lowerMessage.includes('look') || lowerMessage.includes('examine') || lowerMessage.includes('investigate')) {
      return 'exploration';
    }
    if (lowerMessage.includes('use') || lowerMessage.includes('drink') || lowerMessage.includes('eat') || lowerMessage.includes('activate')) {
      return 'item';
    }
    if (lowerMessage.includes('rest') || lowerMessage.includes('sleep') || lowerMessage.includes('recover')) {
      return 'rest';
    }
    if (lowerMessage.includes('hide') || lowerMessage.includes('sneak') || lowerMessage.includes('stealth')) {
      return 'stealth';
    }

    return 'other';
  };

  const sendPlayerAction = async (action: string, playerId: string = 'player1', playerName: string = 'Player', inputType?: InputType) => {
    console.log('🎭 STORYTELLER REQUEST STARTING');
    console.log('🎭 Campaign:', currentCampaign?.id, currentCampaign?.name);
    console.log('🎭 Action:', action);
    console.log('🎭 Input Type:', inputType || selectedInputType);
    
    if (!currentCampaign || !action.trim()) {
      console.log('❌ Early return - no campaign or empty action');
      return;
    }

    console.log('🎭 User data:', {
      userId: user?.id,
      userEmail: user?.email,
      username: user?.username,
      hasUser: !!user
    });

    if (!user?.id) {
      console.log('❌ No user ID - authentication error');
      setError('You need to be logged in to play. Please sign in again.');
      return;
    }

    console.log('🎭 Starting loading state');
    startLoading('sendAction');
    
    // Broadcast that this player is starting an action
    try {
      const currentCharacter = getCurrentCharacter();
      await broadcastActionStarted(currentCampaign.id, {
        playerId: user.id,
        playerName: currentCharacter?.name || 'Player',
        action: action
      });
    } catch (error) {
      console.error('Failed to broadcast action started:', error);
    }
    setError(null);
    // Clear choices while loading
    if (currentCampaign) {
      atomRefs.current.clearAiChoices(currentCampaign.id);
    }

    try {
      // Determine message type based on input type
      let messageType: 'player' | 'gm' | 'system' = 'player';
      let formattedMessage = action;
      let messageAuthor = playerName;

      const typeToUse = inputType || selectedInputType;

      switch (typeToUse) {
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
          formattedMessage = `[Asks GM] ${action}`;
          break;
        case 'ooc':
          formattedMessage = `[OOC] ${action}`;
          break;
        case 'action':
          formattedMessage = action;
          break;
      }

      // Get current character for this campaign
      const currentCharacter = getCurrentCharacter();

      // Add player message to campaign history (without dice_roll for now)
      await atomRefs.current.addCampaignMessage({
        campaign_id: currentCampaign.id,
        message: formattedMessage,
        author: messageAuthor,
        message_type: messageType,
        character_id: currentCharacter?.id,
        character_name: currentCharacter?.name,
        character_avatar: currentCharacter?.avatar,
        difficulty: 10, // Default difficulty class
      });

      // Determine if GM should respond and if message should contribute to story
      const shouldTriggerGM = typeToUse === 'say' || typeToUse === 'rp' || typeToUse === 'action' || typeToUse === 'ask';
      const shouldContributeToStory = typeToUse === 'say' || typeToUse === 'rp' || typeToUse === 'action';
      // Only send to AI for messages that should trigger GM response
      if (shouldTriggerGM) {
        console.log('🎭 Preparing to send to AI storyteller');
        console.log('🎭 Should contribute to story:', shouldContributeToStory);
        
        // Prepare context for the AI
        const context = {
          campaign: currentCampaign,
          storyHistory: campaignHistory.slice(-5), // Get last 5 messages for context
        };

        console.log('🎭 Context prepared:', {
          campaignId: currentCampaign.id,
          historyLength: campaignHistory.length,
          lastMessages: context.storyHistory.length
        });

        const requestBody = {
          campaignId: currentCampaign.id,
          playerId: user.id,
          characterId: currentCharacter?.id || null,
          action: action,
          actionType: inferActionType(action),
          chatType: typeToUse,
          shouldContributeToStory,
          metadata: {
            context,
            playerAction: action,
            timestamp: new Date().toISOString()
          }
        };

        // Use production endpoint for API calls
        const middlewareUrl = process.env.EXPO_PUBLIC_MIDDLEWARE_SERVICE_URL || 'http://localhost:3001';
        const fullUrl = `${middlewareUrl}/api/game/action`;
        
        console.log('🎭 Middleware URL from env:', process.env.EXPO_PUBLIC_MIDDLEWARE_SERVICE_URL);
        console.log('🎭 Full URL for request:', fullUrl);
        console.log('🎭 Request body keys:', Object.keys(requestBody));
        console.log('🎭 Request body size:', JSON.stringify(requestBody).length, 'characters');

        // Send request to our API route with user ID in the body
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('🎭 Fetch response received');
        console.log('🎭 Response status:', response.status);
        console.log('🎭 Response ok:', response.ok);
        console.log('🎭 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          console.log('❌ Response not OK - status:', response.status);
          const errorText = await response.text().catch(() => 'Unable to read error response');
          console.log('❌ Error response body:', errorText);
          
          if (response.status === 401) {
            throw new Error('Authentication failed. Please sign in again.');
          }
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        console.log('🎭 Parsing JSON response');
        const data = await response.json();
        
        console.log('🎭 Response data received:', {
          success: data.success,
          hasResponse: !!data.response,
          responseLength: data.response?.length || 0,
          hasChoices: !!data.choices,
          choicesCount: data.choices?.length || 0,
          error: data.error
        });

        if (!data.success) {
          console.log('❌ API returned success=false, error:', data.error);
          throw new Error(data.error || 'Failed to get GM response');
        }

        console.log('🎭 Adding GM response to campaign history');
        // Add GM response to campaign history
        await atomRefs.current.addCampaignMessage({
          campaign_id: currentCampaign.id,
          message: data.response,
          author: 'GM',
          message_type: 'gm',
        });

                // Use choices from AI response (only for story-contributing messages)
        if (currentCampaign && shouldContributeToStory) {
          console.log('🎭 Setting AI choices:', data.choices?.length || 0, 'choices');
          atomRefs.current.setAiChoices({ campaignId: currentCampaign.id, choices: data.choices || [] });
        }

        // Force refresh campaign history to ensure we have the latest data
        // This works around potential real-time subscription issues
        console.log('🔄 Force refreshing campaign history after story action');
        setTimeout(() => {
          atomRefs.current.fetchCampaignHistory(currentCampaign.id);
        }, 1000); // Wait 1 second for server to process

        // Broadcast that this player's action completed successfully
        try {
          console.log('📢 Broadcasting action completed (success):', { playerId: user.id, success: true });
          await broadcastActionCompleted(currentCampaign.id, {
            playerId: user.id,
            success: true
          });
          console.log('📢 Action completed broadcast sent successfully');
        } catch (error) {
          console.error('❌ Failed to broadcast action completed:', error);
        }

        console.log('✅ Storyteller request completed successfully');
      } else {
        console.log('🎭 Skipping AI request - shouldTriggerGM is false for input type:', typeToUse);
        
        // Still broadcast completion for non-GM actions
        try {
          console.log('📢 Broadcasting action completed (non-GM action):', { playerId: user.id, success: true });
          await broadcastActionCompleted(currentCampaign.id, {
            playerId: user.id,
            success: true
          });
          console.log('📢 Non-GM action completed broadcast sent successfully');
        } catch (error) {
          console.error('❌ Failed to broadcast non-GM action completed:', error);
        }
      }

    } catch (error) {
      console.error('❌ STORYTELLER ERROR - Full error object:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error constructor:', error?.constructor?.name);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Log additional context
      console.error('❌ Error context:', {
        campaignId: currentCampaign?.id,
        userId: user?.id,
        action: action,
        inputType: inputType || selectedInputType,
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Storyteller';
      console.error('❌ Setting error message:', errorMessage);
      setError(errorMessage);
      
      // Clear choices on error
      if (currentCampaign) {
        atomRefs.current.clearAiChoices(currentCampaign.id);
      }
      
      // Broadcast that this player's action failed
      try {
        console.log('📢 Broadcasting action completed (failed):', { playerId: user.id, success: false });
        await broadcastActionCompleted(currentCampaign.id, {
          playerId: user.id,
          success: false
        });
        console.log('📢 Action failed broadcast sent successfully');
      } catch (error) {
        console.error('❌ Failed to broadcast action failed:', error);
      }
    } finally {
      console.log('🎭 Stopping loading state');
      stopLoading('sendAction');
    }
  };
  
  const alwaysAllowedTypes: InputType[] = ['whisper', 'ask', 'ooc'];
  const currentCharacter = getCurrentCharacter();
  const isTurn = currentCharacter?.id && currentCampaign?.current_player === currentCharacter.id && !currentCampaign?.paused;
  const canSend = isTurn || alwaysAllowedTypes.includes(selectedInputType);
  //if (!userInput.trim() || isLoading('sendAction') || !canSend) return;
  const handleSend = async () => {
    if (!userInput.trim() || isLoading('sendAction') || !canSend) return;

    const action = userInput.trim();
    setUserInput('');
    setShowChoices(false);

    await sendPlayerAction(
      action,
      user?.id || 'player1',
      user?.username || user?.email || 'Player'
    );

    // Show choices again after GM responds (only for story-contributing messages)
    const shouldShowChoices = selectedInputType === 'say' || selectedInputType === 'rp' || selectedInputType === 'action';
    if (shouldShowChoices) {
      setTimeout(() => setShowChoices(true), 1000);
    }
  };
  const handleChoiceSelect = async (choice: string) => {
    if (isLoading('sendAction')) return;

    setShowChoices(false);
    const currentCharacter = getCurrentCharacter();
    const characterName = currentCharacter?.name || user?.username || user?.email || 'Player';

    await sendPlayerAction(
      `${characterName} chooses to: ${choice}`,
      user?.id || 'player1',
      characterName,
      'action'
    );

    // Show choices again after GM responds (except for whispers)
    setTimeout(() => setShowChoices(true), 1000);
  };

  const handleHomePress = () => {
    router.replace('/home'); // Replace instead of push to avoid stack buildup
  };

  const handleCharacterPress = () => {
    setIsCharacterSheetVisible(true);
  };

  const arrowRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const renderLoading = !currentCampaign;

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
  const aiChoices = currentCampaign ? atomRefs.current.getAiChoices(currentCampaign.id) : [];
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

  const currentInputOption = getCurrentInputOption();
  // Add manual refresh connection function
  const handleRefreshConnection = async () => {
    setConnectionStatus('connecting');
    try {
      const { refreshSupabaseConnection, reconnectAllSubscriptions, monitorSubscriptionHealth } = await import('../utils/connectionUtils');
      
      console.log('🔄 Manual connection refresh initiated...');
      await refreshSupabaseConnection();
      await reconnectAllSubscriptions();
      
      // Wait a moment then check health
      setTimeout(() => {
        monitorSubscriptionHealth();
        setConnectionStatus('connected');
        setRetryCount(0);
        setError(null);
      }, 3000);
      
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setConnectionStatus('disconnected');
      setError('Failed to refresh connection. Please try again.');
    }
  };

  // Determine if it is the current player's turn
  const isPlayerTurn = currentCharacter?.id && currentCampaign?.current_player === currentCharacter.id && !currentCampaign?.paused;

  // Subscribe to campaign row updates to track current_player / paused changes
  const campaignSubscriptionRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!currentCampaign) return;

    // Clean existing subscription first
    if (campaignSubscriptionRef.current) {
      campaignSubscriptionRef.current();
      campaignSubscriptionRef.current = null;
    }

    const channelName = `campaign_${currentCampaign.id}`;
    const cleanup = createRealtimeSubscription(
      channelName,
      {
        postgres_changes: [{
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${currentCampaign.id}`
        }]
      },
      (payload) => {
        console.log('📡 Campaign update received', payload);
        if (payload.new) {
          setCurrentCampaign(payload.new);
        }
      },
      5
    );

    campaignSubscriptionRef.current = cleanup;

    return () => {
      if (campaignSubscriptionRef.current) {
        campaignSubscriptionRef.current();
        campaignSubscriptionRef.current = null;
      }
    };
  }, [currentCampaign?.id]);

  const closeCharacterView = () => {
    setIsCharacterSheetVisible(false);
  };

  const handleLeaveCampaign = async () => {
    // CharacterView component handles modal closing after successful campaign leave
    console.log('Leave campaign callback triggered');
    
    try {
      // Refresh campaigns data to remove the left campaign from the list
      await fetchCampaigns();
      
      // Refresh character data in case campaign_id was cleared
      await fetchCharacters();
      
      // Navigate back to home screen after leaving
      setTimeout(() => {
        router.push('/');
      }, 1000);
      
      console.log('✅ Campaign data refreshed after leaving');
    } catch (error) {
      console.error('❌ Error refreshing data after leaving campaign:', error);
    }
  };

  // Allowed to send now? Say/RP require turn; OoC/Ask/Whisper allowed anytime
  const allowedAnytime: InputType[] = ['whisper', 'ask', 'ooc'];
  const canSendNow = isPlayerTurn || allowedAnytime.includes(selectedInputType);
  if (renderLoading) {
    return (
      <ActivityIndicator
        isLoading={true}
        fullScreen
        text="Loading campaign..."
      />
    );
  }

  const handleReport = (message: typeof campaignHistory[0]) => {
    setReportingMessage(message);
    setShowReportModal(true);
  };

  const handleCloseReport = () => {
    setShowReportModal(false);
    setReportingMessage(null);
  };

  return (
    <ImageBackground
      source={require('../../assets/images/paper_background.jpg')}
      style={styles.container}
    >
      <ActivityIndicator
        isLoading={isInitialLoading}
        text="Loading your adventure..."
        fullScreen={true}
      >
        <SafeAreaView style={styles.safeArea}>
        {/* Banner Ad */}
        {!shouldHideAds && (
          <BannerAd size={BannerAdSize.BANNER} style={styles.bannerAd} />
        )}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleHomePress} style={styles.headerButton}>
              <Home size={24} color="#2a2a2a" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.headerTitle}
              onPress={() => setIsPartyDisplayExpanded(!isPartyDisplayExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.title}>{currentCampaign.name}</Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.subTitle}>Turn Tracker</Text>
                <Animated.View style={{marginLeft: 5, transform: [{ rotate: arrowRotation }] }}>
                  <ChevronDown size={18} color="#666" />
                </Animated.View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                console.log('🔄 Manual refresh triggered');
                atomRefs.current.fetchCampaignHistory(currentCampaign.id);
              }} 
              style={styles.headerButton}
            >
              <RefreshCw size={20} color="#2a2a2a" />
            </TouchableOpacity>
            
            {/* Debug button to clear other player actions */}
            {Object.keys(otherPlayerActions).length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  console.log('🧹 Manually clearing other player actions');
                  setOtherPlayerActions({});
                }} 
                style={styles.headerButton}
              >
                <X size={20} color="#ff4444" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={handleCharacterPress} style={styles.headerButton}>
              <User2 size={24} color="#2a2a2a" />
            </TouchableOpacity>
          </View>
          {/* Party Display */}
          <PartyDisplay 
            campaign={currentCampaign} 
            currentUserId={user?.id}
            isExpanded={isPartyDisplayExpanded}
            onToggle={() => setIsPartyDisplayExpanded(!isPartyDisplayExpanded)}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.content}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 10}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.storyContainer}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Campaign History */}
            {campaignHistory.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>
                  Welcome to your adventure! The storyteller is preparing your tale...
                </Text>
              </View>
            ) : (
              // Limit rendered messages to prevent memory issues on Android
              campaignHistory
                .slice(-30) // Only show last 30 messages to prevent memory overflow
                .map((message, index) => (
                  <StoryEventItem 
                    key={`${message.id}-${index}`} 
                    message={message} 
                    campaignId={currentCampaign.id}
                    onReport={handleReport}
                  />
                ))
            )}

            {isLoading('initialStory') && (
              <View style={styles.loadingEvent}>
                <Text style={styles.loadingEventText}>
                  The Storyteller is preparing your adventure...
                </Text>
              </View>
            )}

            {isLoading('sendAction') && (
              <View style={styles.loadingEvent}>
                <LottieView
                  source={require('../../assets/lottie/writing.json')}
                  autoPlay
                  loop
                  style={styles.writingAnimation}
                  resizeMode='contain'
                />
                <Text style={styles.loadingEventText}>
                  Your story is being woven...
                </Text>
              </View>
            )}

            {/* Show other players' actions in progress */}
            {Object.entries(otherPlayerActions).map(([playerId, actionData]) => (
              <View key={playerId} style={styles.loadingEvent}>
                <LottieView
                  source={require('../../assets/lottie/writing.json')}
                  autoPlay
                  loop
                  style={styles.writingAnimation}
                  resizeMode='contain'
                />
                <Text style={styles.loadingEventText}>
                  {actionData.playerName} is taking action...
                </Text>
              </View>
            ))}

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color="#f44336" />
                <View style={styles.errorTextContainer}>
                  <Text style={styles.errorText}>
                    Failed to connect to Storyteller. Please try again.
                  </Text>
                  {(connectionStatus === 'disconnected' || connectionStatus === 'connecting') && (
                    <TouchableOpacity 
                      style={styles.refreshButton}
                      onPress={handleRefreshConnection}
                      disabled={connectionStatus === 'connecting'}
                    >
                      <RefreshCw 
                        size={16} 
                        color={connectionStatus === 'connecting' ? '#888' : '#2196F3'} 
                      />
                      <Text style={[
                        styles.refreshButtonText,
                        connectionStatus === 'connecting' && styles.refreshButtonTextDisabled
                      ]}>
                        {connectionStatus === 'connecting' ? 'Connecting...' : 'Refresh Connection'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Waiting for turn notification */}
            {!isPlayerTurn && Object.keys(otherPlayerActions).length === 0 && (
              <View style={styles.loadingEvent}>
                <Text style={styles.loadingEventText}>
                  {currentCampaign?.current_player_name || 'Another player'} is writing their verse...
                </Text>
              </View>
            )}

            {showChoices && isPlayerTurn && !isLoading('sendAction') &&
              (selectedInputType === 'say' || selectedInputType === 'rp' || selectedInputType === 'action') && (
                <EnhancedStoryChoices
                  choices={choicesToShow}
                  onChoiceSelect={handleChoiceSelect}
                  disabled={isLoading('sendAction')}
                />
            )}
          </ScrollView>

          <View style={[styles.inputContainer, Platform.OS === 'android' && {marginBottom: insets.bottom}]}>
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
                (userInput.trim().length === 0 || isLoading('sendAction') || !canSendNow) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={userInput.trim().length === 0 || isLoading('sendAction') || !canSendNow}
            >

              <Forward size={18} color={userInput.trim() ? '#fff' : '#666'} />
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
              {currentCharacter ? (
                <CharacterView 
                  character={currentCharacter} 
                  onClose={closeCharacterView}
                  onLeaveCampaign={handleLeaveCampaign}
                />
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

        {/* Content Report Modal */}
        <ContentReportModal
          visible={showReportModal}
          onClose={handleCloseReport}
          message={reportingMessage}
          campaignId={currentCampaign?.id || ''}
        />
      </SafeAreaView>
      </ActivityIndicator>
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
    paddingTop: 10,
    marginHorizontal: 20,
  },
  headerWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    paddingBottom: 6,
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    color: '#2a2a2a',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 12,
    color: '#2a2a2a',
    fontFamily: 'Inter-Regular',
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
  loadingEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    marginVertical: 8,
    //marginBottom: 15,
  },
  writingAnimation: {
    width: 60,
    height: 60,
  },
  loadingEventText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 2,
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
  errorTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  refreshButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  refreshButtonTextDisabled: {
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 6,
  },
  inputTypeContainer: {
    position: 'relative',
  },
  inputTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
    minWidth: 60,
    height: 32,
  },
  inputTypeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  inputTypeDropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 8,
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
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    height: 32,
  },
  sendButton: {
    width: 32,
    height: 32,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
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
  bannerAd: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});