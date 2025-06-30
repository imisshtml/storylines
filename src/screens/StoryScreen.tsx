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
import { Home, User as User2, X, CircleAlert as AlertCircle, Forward, ChevronDown, ChevronUp, MessageSquare, Drama, Ear, CircleHelp as HelpCircle, RefreshCw, Search, Package as PackageIcon, BedDouble, EyeOff, HandCoins, Lock, Pause as PauseIcon } from 'lucide-react-native';
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
import { initializeCampaignBroadcast, broadcastActionStarted, broadcastActionCompleted, createRealtimeSubscription, broadcastRestRequest, broadcastRestResponse } from '../utils/connectionUtils';
import BannerAd from '../components/BannerAd';
import LottieView from 'lottie-react-native';
import { BannerAdSize } from 'react-native-google-mobile-ads';
import { purchaseManager } from '../utils/purchaseManager';
import { supabase } from '../config/supabase';
import { performShortRest, performLongRest } from '../atoms/characterAtoms';
import { enterStealth, breakStealth, isInStealth, handleStealthCheck, performStealAttempt } from '../utils/stealthUtils';
import { 
  validateInventoryAction, 
  parseInventoryOperations, 
  applyInventoryOperations,
  generateInventoryContext 
} from '../utils/inventoryManager';

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
  // ▶ Base-Actions Panel state (must be before any conditional returns)
  const [isActionsPanelExpanded, setIsActionsPanelExpanded] = useState(false);
  const [useItemModalVisible, setUseItemModalVisible] = useState(false);
  const [selectedUseItemId, setSelectedUseItemId] = useState<string>('');
  const [useItemNote, setUseItemNote] = useState('');
  const [restModalVisible, setRestModalVisible] = useState(false);
  const [stealModalVisible, setStealModalVisible] = useState(false);
  const [selectedStealTarget, setSelectedStealTarget] = useState<string>('');
  const [stealDescription, setStealDescription] = useState('');
  // Removed isSneaking local state - now using character.stealth_roll from database
  // Rest voting
  const [pendingRest, setPendingRest] = useState<{
    restType: 'short' | 'long';
    requesterId: string;
    requesterName: string;
    deadline: number;
    votes: { [playerId: string]: boolean };
  } | null>(null);
  const [showRestPrompt, setShowRestPrompt] = useState(false);
  // Input type selection
  const [selectedInputType, setSelectedInputType] = useState<InputType>('say');
  const [showInputTypeDropdown, setShowInputTypeDropdown] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasTriedInitialStory, setHasTriedInitialStory] = useState(false);
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
    
    // If user is logged out, don't redirect to home – let global/login guards handle navigation
    if (!user) {
      return;
    }
    
    // If no current campaign, either we are loading (wait) or navigate home
    if (!currentCampaign) {
      if (!isLoading('sendAction')) {
        console.log('📖 No current campaign, redirecting to home');
        router.replace('/home');
      }
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
        },
        onRestRequest: (data) => {
          console.log('🛌 Rest request received:', { 
            ...data, 
            isMyRequest: data.playerId === user?.id,
            currentUserId: user?.id 
          });
          if (data.playerId !== user?.id) {
            setPendingRest({ restType: data.restType, requesterId: data.playerId, requesterName: data.playerName, deadline: data.deadline, votes: { [data.playerId]: true } });
            setShowRestPrompt(true);
            console.log('🛌 Showing rest prompt to user');
          } else {
            console.log('🛌 Ignoring own rest request');
          }
        },
        onRestResponse: (data) => {
          console.log('Rest response received:', data);
          setPendingRest(prev => {
            if (!prev) return prev;
            const newVotes = { ...prev.votes, [data.playerId]: data.accepted };
            console.log('Updated votes:', newVotes);
            return { ...prev, votes: newVotes };
          });
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
        campaignId: currentCampaign?.id,
        user: user?.username,
        campaignHistoryLength: campaignHistory.length,
        isLoading: isLoading('initialStory'),
        isInitialLoading: isInitialLoading,
        hasTriedInitialStory: hasTriedInitialStory,
        campaignStatus: currentCampaign?.status,
        hasGMMessages: campaignHistory.some(m => m.message_type === 'gm' || m.author === 'GM')
      });

      if (!currentCampaign || !user || isLoading('initialStory') || isInitialLoading || hasTriedInitialStory) {
        console.log('🚫 Early return from generateInitialStory:', {
          hasCurrentCampaign: !!currentCampaign,
          hasUser: !!user,
          isLoading: isLoading('initialStory'),
          isInitialLoading: isInitialLoading,
          hasTriedInitialStory: hasTriedInitialStory
        });
        return;
      }

      // Check if story has already started by looking for GM messages
      const hasGMMessages = campaignHistory.some(message => 
        message.message_type === 'gm' || message.author === 'GM'
      );

      if (hasGMMessages) {
        console.log('🚫 Story already started - found GM messages:', {
          campaignHistoryLength: campaignHistory.length,
          gmMessageCount: campaignHistory.filter(m => m.message_type === 'gm' || m.author === 'GM').length
        });
        return;
      }

      // If we have any messages at all but no GM messages, still don't generate
      // This prevents regeneration when players have already started chatting
      if (campaignHistory.length > 0) {
        console.log('🚫 Campaign has messages but no GM story yet - waiting for manual story start:', {
          campaignHistoryLength: campaignHistory.length,
          messageTypes: campaignHistory.map(m => m.message_type).join(', ')
        });
        return;
      }

      // Generate initial story for campaigns in 'creation', 'waiting' or 'in_progress' status
      if (currentCampaign.status !== 'creation' && currentCampaign.status !== 'waiting' && currentCampaign.status !== 'in_progress') {
        console.log('🚫 Campaign status not eligible for initial story:', currentCampaign.status);
        return;
      }

      console.log('🎭 Generating initial story for campaign:', currentCampaign.name);

      // Mark that we've tried to generate initial story for this session
      setHasTriedInitialStory(true);

      try {
        startLoading('initialStory');
        setError(null);

        // If campaign is still in 'creation' status, transition it to 'waiting'
        if (currentCampaign.status === 'creation') {
          console.log('🔄 Transitioning campaign from creation to waiting status');

          // Update campaign status directly using Supabase
          // The real-time subscription will update our state
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
        const insertedMessage = await atomRefs.current.addCampaignMessage({
          campaign_id: currentCampaign.id,
          message: data.response,
          author: 'GM',
          message_type: 'gm',
        });

        // Immediately refresh local history in case realtime not yet connected
        if (insertedMessage?.id) {
          await atomRefs.current.fetchCampaignHistory(currentCampaign.id);
        }

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
  }, [currentCampaign, user, campaignHistory, isInitialLoading]);

  // Reset hasTriedInitialStory when campaign changes
  useEffect(() => {
    setHasTriedInitialStory(false);
  }, [currentCampaign?.id]);
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

  const getStealTargets = (): {type: 'player' | 'npc', id: string, name: string, isOnline: boolean, character?: any}[] => {
    const targets: {type: 'player' | 'npc', id: string, name: string, isOnline: boolean, character?: any}[] = [];
    
    // Add party members (excluding current player)
    const otherPlayers = getOtherPlayers();
    otherPlayers.forEach(player => {
      const character = characters.find(c => c.user_id === player.id && c.campaign_id === currentCampaign?.id);
      targets.push({
        type: 'player',
        id: player.id,
        name: character?.name || player.name || 'Player',
        isOnline: currentCampaign?.players_online?.[player.id] !== undefined,
        character: character // Include character data for perception calculation
      });
    });
    
    // Add common NPC targets (these would typically come from the story context)
    const commonNPCs = [
      'Merchant',
      'Guard',
      'Innkeeper',
      'Noble',
      'Commoner',
      'Bandit',
      'Traveler'
    ];
    
    commonNPCs.forEach(npc => {
      targets.push({
        type: 'npc',
        id: npc.toLowerCase(),
        name: npc,
        isOnline: true // NPCs are always "available"
      });
    });
    
    return targets;
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
      // Add whisper options for each other player (show character name, not profile name)
      otherPlayers.forEach(player => {
        const character = characters.find(c => c.user_id === player.id && c.campaign_id === currentCampaign?.id);
        const displayName = character?.name || player.name || 'Player';
        
        baseOptions.push({
          type: 'whisper',
          label: `Whisper ${displayName}`,
          icon: <Ear size={16} color="#FF9800" />,
          placeholder: `Whisper to ${displayName}...`,
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
      let messageType: 'player' | 'gm' | 'system' | 'whisper' = 'player';
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
            const targetCharacter = characters.find(c => c.user_id === whisperTarget && c.campaign_id === currentCampaign?.id);
            const targetDisplayName = targetCharacter?.name || targetPlayer?.name || 'Player';
            const senderCharacter = getCurrentCharacter();
            const senderDisplayName = senderCharacter?.name || playerName;
            
            formattedMessage = `${senderDisplayName} whispers to you, "${action}"`;
            messageType = 'whisper';
          }
          break;
        case 'ask':
          formattedMessage = `[Asks GM] ${action}`;
          messageType = 'system'; // Ask messages are system messages
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

      // Check if this action should break stealth
      if (currentCharacter) {
        try {
          const stealthBroken = await handleStealthCheck(currentCharacter, action);
          if (stealthBroken) {
            console.log(`💥 Stealth broken for ${currentCharacter.name} due to action: ${action}`);
            // Refresh character data to get updated stealth_roll (now 0)
            await fetchCharacters();
            console.log(`✅ Character stealth broken and data refreshed`);
          }
        } catch (error) {
          console.error('Error checking stealth:', error);
        }
      }

      // Validate inventory for action-type messages
      if (currentCharacter && (typeToUse === 'action' || typeToUse === 'say' || typeToUse === 'rp')) {
        try {
          const inventoryValidation = validateInventoryAction(currentCharacter, action);
          console.log('🎒 Inventory validation result:', inventoryValidation);
          
          if (!inventoryValidation.valid) {
            console.log('❌ Inventory validation failed:', inventoryValidation.message);
            setError(inventoryValidation.message);
            return; // Stop execution if validation fails
          }
          
          // Parse and apply inventory operations if validation passes
          const inventoryOperations = parseInventoryOperations(action, currentCharacter.name, currentCharacter);
          console.log('🎒 Parsed inventory operations:', inventoryOperations);
          
          if (inventoryOperations.length > 0) {
            console.log(`🎒 Applying ${inventoryOperations.length} inventory operations...`);
            await applyInventoryOperations(currentCharacter.id, inventoryOperations);
            
            // Refresh character data to get updated inventory
            await fetchCharacters();
            console.log('✅ Character inventory updated and data refreshed');
          }
        } catch (error) {
          console.error('Error managing inventory:', error);
          setError('Failed to update inventory. Please try again.');
          return;
        }
      }

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
        whisper_target_id: messageType === 'whisper' ? whisperTarget : undefined,
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
        // Add GM response to campaign history (system message for ask responses)
        const responseMessageType = typeToUse === 'ask' ? 'system' : 'gm';
        const insertedMessage = await atomRefs.current.addCampaignMessage({
          campaign_id: currentCampaign.id,
          message: data.response,
          author: typeToUse === 'ask' ? 'System' : 'GM',
          message_type: responseMessageType,
        });

        // Immediately refresh local history in case realtime not yet connected
        if (insertedMessage?.id) {
          await atomRefs.current.fetchCampaignHistory(currentCampaign.id);
        }

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

  const handleMarketAction = async (choice: string, character: any) => {
    if (!currentCampaign || !character) return;

    startLoading('sendAction');

    try {
      // Determine market type from choice
      let marketType = 'general';
      if (choice.toLowerCase().includes('blacksmith')) marketType = 'blacksmith';
      else if (choice.toLowerCase().includes('tavern')) marketType = 'tavern';
      else if (choice.toLowerCase().includes('potions') || choice.toLowerCase().includes('remedies')) marketType = 'apothecary';
      else if (choice.toLowerCase().includes('market')) marketType = 'market';

      // Determine location size based on current scene or default to medium
      const locationSize = 'medium'; // Could be enhanced to detect from scene context
      
      const middlewareUrl = process.env.EXPO_PUBLIC_MIDDLEWARE_SERVICE_URL || 'http://localhost:3001';
      const fullUrl = `${middlewareUrl}/api/market/view-inventory`;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketType,
          locationSize,
          quality: 'average',
          location: `${marketType.charAt(0).toUpperCase() + marketType.slice(1)}`
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch market inventory: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get market inventory');
      }

      // Format inventory display message
      let inventoryMessage = `**${data.location} Inventory**\n\n${data.message}\n\n`;
      
      data.inventory.forEach((item: any) => {
        inventoryMessage += `• **${item.name}** - ${item.price}`;
        if (item.condition && item.condition !== 'new') {
          inventoryMessage += ` (${item.condition})`;
        }
        if (item.craftable) {
          inventoryMessage += ` *[Can be crafted]*`;
        }
        inventoryMessage += '\n';
      });

      // Add the market inventory as a system message
      await atomRefs.current.addCampaignMessage({
        campaign_id: currentCampaign.id,
        message: inventoryMessage,
        author: 'System',
        message_type: 'system',
      });

      // Broadcast completion
      await broadcastActionCompleted(currentCampaign.id, {
        playerId: user.id,
        success: true
      });

    } catch (error) {
      console.error('❌ Market action error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to view market inventory';
      setError(errorMessage);
      
      await broadcastActionCompleted(currentCampaign.id, {
        playerId: user.id,
        success: false
      });
    } finally {
      stopLoading('sendAction');
    }
  };

  const handleChoiceSelect = async (choice: string) => {
    if (isLoading('sendAction')) return;

    setShowChoices(false);
    const currentCharacter = getCurrentCharacter();
    const characterName = currentCharacter?.name || user?.username || user?.email || 'Player';

    // Check if this is a market action
    const marketKeywords = [
      'view blacksmith wares', 'view shop wares', 'view tavern menu', 
      'view potions & remedies', 'browse market stalls', 'view available goods',
      'commission custom item'
    ];
    
    const isMarketAction = marketKeywords.some(keyword => 
      choice.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isMarketAction) {
      console.log('🏪 Market action detected:', choice);
      await handleMarketAction(choice, currentCharacter);
      // Show choices again after market action
      setTimeout(() => setShowChoices(true), 1000);
      return;
    }

    const actionText = `${characterName} chooses to: ${choice}`;

    // Validate inventory for choice actions as well
    if (currentCharacter) {
      try {
        const inventoryValidation = validateInventoryAction(currentCharacter, choice);
        console.log('🎒 Choice inventory validation result:', inventoryValidation);
        
        if (!inventoryValidation.valid) {
          console.log('❌ Choice inventory validation failed:', inventoryValidation.message);
          setError(`Cannot perform that action: ${inventoryValidation.message}`);
          setTimeout(() => setShowChoices(true), 1000); // Show choices again
          return;
        }
      } catch (error) {
        console.error('Error validating choice inventory:', error);
      }
    }

    await sendPlayerAction(
      actionText,
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

  // Helper to execute rest immediately for now (short / long)
  const restExecutionRef = useRef<string | null>(null); // Store the rest type being executed
  const executeRest = useCallback(async (type: 'short' | 'long') => {
    if (!currentCampaign || !pendingRest) return;
    
    // Create a unique execution key for this rest request
    const executionKey = `${pendingRest.requesterId}-${pendingRest.restType}-${pendingRest.deadline}`;
    
    // Prevent duplicate executions of the same rest request
    if (restExecutionRef.current === executionKey) {
      console.log('🚫 Rest execution already in progress for:', executionKey);
      return;
    }
    
    restExecutionRef.current = executionKey;
    console.log('🛌 Executing rest for party...', { type, executionKey });
    
    const partyChars = characters.filter(c => c.campaign_id === currentCampaign.id);
    
    // Perform rest for all party characters
    for (const pc of partyChars) {
      try {
        if (type === 'short') await performShortRest(pc.id);
        else await performLongRest(pc.id);
      } catch (e) {
        console.error('Rest error for', pc.name, e);
      }
    }

    // Send ONE system message for the entire party
    const restMessage = `The party takes a ${type} rest and recovers.`;
    console.log('📝 Adding rest system message for execution:', executionKey, 'Message:', restMessage);
    
    try {
      await atomRefs.current.addCampaignMessage({
        campaign_id: currentCampaign.id,
        message: restMessage,
        author: 'System',
        message_type: 'system'
      });
      console.log('✅ Rest system message added successfully for execution:', executionKey);
    } catch (error) {
      console.error('❌ Failed to add rest system message:', error);
      throw error; // Re-throw to prevent further execution
    }

    // Broadcast completion so turn can continue
    await broadcastActionCompleted(currentCampaign.id, { playerId: pendingRest.requesterId, success: true });
    
    console.log('✅ Rest execution completed for:', executionKey);
    
    // Reset the execution flag after a delay
    setTimeout(() => {
      if (restExecutionRef.current === executionKey) {
        restExecutionRef.current = null;
      }
    }, 3000);
  }, [currentCampaign, characters, pendingRest]);

  // Handle rest resolution
  useEffect(() => {
    if (!pendingRest || !currentCampaign) return;
    
    let isResolved = false; // Prevent multiple executions
    
    const interval = setInterval(() => {
      if (isResolved) return; // Already resolved, don't execute again
      
      const onlinePlayerIds = Object.keys(currentCampaign.players_online || {});
      const idsToWaitFor = onlinePlayerIds.length > 0 ? onlinePlayerIds : currentCampaign.players.map(p => p.id);
      const allResponded = idsToWaitFor.every(id => pendingRest.votes[id] !== undefined);
      const timedOut = Date.now() > pendingRest.deadline;
      
      console.log('Rest resolution check:', {
        onlinePlayerIds,
        idsToWaitFor,
        votes: pendingRest.votes,
        allResponded,
        timedOut,
        playersOnlineData: currentCampaign.players_online,
        playersData: currentCampaign.players.map(p => ({ id: p.id, name: p.name, isOnline: currentCampaign.players_online?.[p.id] !== undefined }))
      });
      
      if (allResponded || timedOut) {
        isResolved = true; // Mark as resolved to prevent multiple executions
        clearInterval(interval); // Stop the interval immediately
        
        // Only explicit "No" votes count as denial - missing votes are treated as approval
        const explicitDenials = Object.values(pendingRest.votes).filter(v => v === false);
        const denied = explicitDenials.length > 0;
        const denierName = currentCampaign.players.find(p => pendingRest.votes[p.id] === false)?.name;
        
        if (!denied) {
          console.log('Rest approved, executing...', { 
            reason: allResponded ? 'all responded' : 'timeout with implicit approval',
            votes: pendingRest.votes,
            isRequester: user?.id === pendingRest.requesterId
          });
          
          // Only the requester should execute the rest to prevent duplicates
          if (user?.id === pendingRest.requesterId) {
            console.log('🎯 This user is the requester, executing rest...');
            executeRest(pendingRest.restType);
          } else {
            console.log('👀 This user is not the requester, skipping rest execution');
          }
        } else {
          console.log('Rest denied by:', denierName, { 
            votes: pendingRest.votes,
            isRequester: user?.id === pendingRest.requesterId 
          });
          
          // Only the requester should send the denial message to prevent duplicates
          if (user?.id === pendingRest.requesterId) {
            console.log('🎯 This user is the requester, sending denial message...');
            // Notify all players that rest was denied
            atomRefs.current.addCampaignMessage({
              campaign_id: currentCampaign.id,
              message: `Rest request was declined by ${denierName || 'a party member'}.`,
              author: 'System',
              message_type: 'system'
            });
            
            // Broadcast completion to the requester
            broadcastActionCompleted(currentCampaign.id, { playerId: pendingRest.requesterId, success: false });
          } else {
            console.log('👀 This user is not the requester, skipping denial message');
          }
        }
        
        setPendingRest(null);
        setShowRestPrompt(false);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [pendingRest, currentCampaign, executeRest]);

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

  // Filter out base panel actions from AI / database suggestions
  const BASE_ACTION_KEYWORDS = [
    'search',
    'look around',
    'use item',
    'rest',
    'sneak',
    'hide',
    'steal',
    'lockpick',
    'pick lock',
    'pause',
    'unpause',
    'refresh',
    'reconnect',
  ];

  const filterBaseActions = (choices: string[]) =>
    choices.filter(choice => !BASE_ACTION_KEYWORDS.some(keyword => choice.toLowerCase().includes(keyword)));

  // Deduplicate choices by removing exact duplicates and very similar choices
  const deduplicateChoices = (choices: string[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    
    for (const choice of choices) {
      const normalizedChoice = choice.toLowerCase().trim();
      
      // Skip if we've seen this exact choice
      if (seen.has(normalizedChoice)) {
        continue;
      }
      
      // Check for very similar choices (80% similarity)
      const isSimilar = Array.from(seen).some(seenChoice => {
        const similarity = calculateSimilarity(normalizedChoice, seenChoice);
        return similarity > 0.8;
      });
      
      if (!isSimilar) {
        seen.add(normalizedChoice);
        result.push(choice);
      }
    }
    
    return result;
  };

  // Enhanced similarity calculation that focuses on key action words
  const calculateSimilarity = (str1: string, str2: string): number => {
    // Extract key action and target words
    const extractKeyWords = (text: string): Set<string> => {
      const movementActions = ['head', 'go', 'move', 'walk', 'run', 'approach', 'enter', 'visit'];
      const investigationActions = ['investigate', 'examine', 'search', 'explore', 'study'];
      const socialActions = ['question', 'ask', 'talk', 'speak', 'converse', 'discuss'];
      const combatActions = ['attack', 'cast', 'fight', 'strike'];
      const stealthActions = ['hide', 'sneak', 'skulk', 'lurk'];
      const itemActions = ['use', 'take', 'grab', 'steal'];
      
      const locationWords = ['moor', 'tavern', 'inn', 'village', 'house', 'shop', 'market', 'forest', 'cave', 'castle', 'whispers', 'curse'];
      const targetWords = ['barkeep', 'innkeeper', 'merchant', 'guard', 'villager', 'stranger', 'woman', 'man', 'person', 'wisewoman'];
      
      const words = text.toLowerCase().split(/\s+/);
      const keyWords = new Set<string>();
      
      // Categorize actions for better semantic matching
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (movementActions.includes(cleanWord)) {
          keyWords.add('movement');
        } else if (investigationActions.includes(cleanWord)) {
          keyWords.add('investigation');
        } else if (socialActions.includes(cleanWord)) {
          keyWords.add('social');
        } else if (combatActions.includes(cleanWord)) {
          keyWords.add('combat');
        } else if (stealthActions.includes(cleanWord)) {
          keyWords.add('stealth');
        } else if (itemActions.includes(cleanWord)) {
          keyWords.add('item');
        }
        
        if (locationWords.includes(cleanWord) || targetWords.includes(cleanWord)) {
          keyWords.add(cleanWord);
        }
      });
      
      return keyWords;
    };
    
    // Get key words from both strings
    const keys1 = extractKeyWords(str1);
    const keys2 = extractKeyWords(str2);
    
    // If both have key words, prioritize key word similarity
    if (keys1.size > 0 && keys2.size > 0) {
      const keyIntersection = new Set([...keys1].filter(word => keys2.has(word)));
      const keyUnion = new Set([...keys1, ...keys2]);
      const keySimilarity = keyIntersection.size / keyUnion.size;
      
      // Special case: if both are movement actions to the same location, they're duplicates
      const bothMovement = keys1.has('movement') && keys2.has('movement');
      const sharedLocation = [...keyIntersection].some(key => 
        ['moor', 'tavern', 'inn', 'village', 'house', 'shop', 'market', 'forest', 'cave', 'castle'].includes(key)
      );
      
      if (bothMovement && sharedLocation) {
        return 1.0; // Perfect match for movement to same location
      }
      
      // If key words are very similar, consider them duplicates
      if (keySimilarity >= 0.6) { // Lowered threshold from 0.7 to 0.6
        return keySimilarity;
      }
    }
    
    // Fallback to general word similarity
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  };

  const filteredAiChoices = deduplicateChoices(filterBaseActions(aiChoices));
  const filteredDbChoices = deduplicateChoices(filterBaseActions(databaseChoices));

  // Debug logging for choice sources
  if (aiChoices.length > 0) {
    console.log('🎯 Raw AI choices:', aiChoices.length, aiChoices);
    console.log('🎯 Filtered AI choices:', filteredAiChoices.length, filteredAiChoices);
  }
  if (databaseChoices.length > 0) {
    console.log('🎯 Raw DB choices:', databaseChoices.length, databaseChoices);
    console.log('🎯 Filtered DB choices:', filteredDbChoices.length, filteredDbChoices);
  }

  const choicesToShow = filteredAiChoices.length > 0
    ? filteredAiChoices // Use AI-generated choices first
    : filteredDbChoices.length > 0
      ? filteredDbChoices // Use database actions second
      : [
        'Explore deeper into the forest',
        'Investigate any strange noises',
        'Set up camp for the night',
        'Plan your next move together',
      ]; // Fallback to defaults last

  console.log('🎯 Final choices to show:', choicesToShow.length, choicesToShow);

  const currentInputOption = getCurrentInputOption();
  // Add manual refresh connection function
  const handleRefreshConnection = async () => {
    setConnectionStatus('connecting');
    try {
      const { refreshSupabaseConnection, reconnectAllSubscriptions, monitorSubscriptionHealth } = await import('../utils/connectionUtils');
      
      console.log('🔄 Manual connection refresh initiated...');
      await refreshSupabaseConnection();
      await reconnectAllSubscriptions();
      
      // Also refresh campaign and character data to ensure everything is in sync
      console.log('🔄 Refreshing campaign and character data...');
      const refreshPromises = [
        fetchCampaigns(),
        fetchCharacters()
      ];
      
      if (currentCampaign?.id) {
        refreshPromises.push(atomRefs.current.fetchCampaignHistory(currentCampaign.id));
      }
      
      await Promise.all(refreshPromises);
      
      // Wait a moment then check health
      setTimeout(() => {
        monitorSubscriptionHealth();
        setConnectionStatus('connected');
        setRetryCount(0);
        setError(null);
        console.log('✅ Connection and data refresh completed');
      }, 3000);
      
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setConnectionStatus('disconnected');
      setError('Failed to refresh connection. Please try again.');
    }
  };

  // Determine if it is the current player's turn
  const isPlayerTurn = currentCharacter?.id && currentCampaign?.current_player === currentCharacter.id && !currentCampaign?.paused;

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

  // ─── Base-Actions Panel ────────────────────────────────────────────────
  const toggleActionsPanel = () => setIsActionsPanelExpanded(prev => !prev);

  const handleSearch = () => {
    setIsActionsPanelExpanded(false);
    sendPlayerAction('looks around the environment');
  };

  const handleSneak = async () => {
    setIsActionsPanelExpanded(false);
    const currentCharacter = getCurrentCharacter();
    if (!currentCharacter) return;
    
    try {
      // Roll for stealth and update character
      const stealthRoll = await enterStealth(currentCharacter);
      console.log(`🎭 ${currentCharacter.name} entered stealth with roll: ${stealthRoll}`);
      
      // Refresh character data to get updated stealth_roll
      await fetchCharacters();
      
      // Send action message with stealth roll
      sendPlayerAction(`attempts to move silently and hide (Stealth: ${stealthRoll})`);
      
      console.log(`✅ Character stealth updated and refreshed`);
    } catch (error) {
      console.error('Failed to enter stealth:', error);
      sendPlayerAction('attempts to move silently and hide');
    }
  };

  const handleLockpick = () => {
    setIsActionsPanelExpanded(false);
    sendPlayerAction('attempts to pick the lock using their lockpicks');
  };

  const handleUseItem = () => {
    setIsActionsPanelExpanded(false);
    setUseItemModalVisible(true);
  };

  const handleRest = () => {
    setIsActionsPanelExpanded(false);
    setRestModalVisible(true);
  };

  const handleSteal = () => {
    setIsActionsPanelExpanded(false);
    setStealModalVisible(true);
  };

  const handleTogglePause = async () => {
    if (!currentCampaign) return;
    try {
      await supabase
        .from('campaigns')
        .update({ paused: !currentCampaign.paused })
        .eq('id', currentCampaign.id);
      setCurrentCampaign({ ...currentCampaign, paused: !currentCampaign.paused });
    } catch (error) {
      console.error('Failed toggling pause:', error);
    }
  };

  // COMPUTE BASE ACTIONS (insert right after currentCharacter const)
  const characterHasLockpicks = currentCharacter?.equipment?.some(eq => eq.name.toLowerCase().includes('lockpick')) ?? false;
  const characterIsInStealth = currentCharacter ? isInStealth(currentCharacter) : false;

  const refreshHistory = async () => {
    if (!currentCampaign?.id) {
      console.log('❌ No current campaign to refresh history for');
      return;
    }
    
    console.log('🔄 Manually refreshing campaign history...');
    try {
      await atomRefs.current.fetchCampaignHistory(currentCampaign.id);
      console.log('✅ Campaign history refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh campaign history:', error);
      setError('Failed to refresh history. Please try again.');
    }
  };

  const baseActions = [
    { key: 'search', label: 'Search', icon: <Search size={18} color="#fff" />, onPress: handleSearch },
    { key: 'useItem', label: 'Use Item', icon: <PackageIcon size={18} color="#fff" />, onPress: handleUseItem },
    { key: 'rest', label: 'Rest', icon: <BedDouble size={18} color="#fff" />, onPress: handleRest },
    { key: 'sneak', label: characterIsInStealth ? 'Sneaking' : 'Sneak', icon: <EyeOff size={18} color="#fff" />, onPress: characterIsInStealth ? undefined : handleSneak },
    ...(characterIsInStealth ? [{ key: 'steal', label: 'Steal', icon: <HandCoins size={18} color="#fff" />, onPress: handleSteal }] : []),
    ...(characterHasLockpicks ? [{ key: 'lockpick', label: 'Lockpick', icon: <Lock size={18} color="#fff" />, onPress: handleLockpick }] : []),
    { key: 'pause', label: currentCampaign?.paused ? 'Unpause' : 'Pause', icon: <PauseIcon size={18} color="#fff" />, onPress: handleTogglePause },
    { key: 'refresh', label: 'Refresh', icon: <RefreshCw size={18} color="#fff" />, onPress: refreshHistory },
  ].map(action => ({
    ...action,
    disabled: !(isPlayerTurn || action.key === 'refresh' || action.key === 'pause') || (action.key === 'sneak' && characterIsInStealth),
  }));

  // ==== Helper for Use Item confirm ====
  const handleConfirmUseItem = () => {
    if (!currentCharacter) return;
    const item = currentCharacter.equipment.find(eq => eq.id === selectedUseItemId);
    if (!item) return;
    const note = useItemNote.trim().length > 0 ? `: ${useItemNote.trim()}` : '';
    sendPlayerAction(`${currentCharacter.name} uses ${item.name}${note}`);
    // reset
    setSelectedUseItemId('');
    setUseItemNote('');
    setUseItemModalVisible(false);
  };

  // ==== Helper for Steal confirm ====
  const handleConfirmSteal = async () => {
    if (!currentCharacter || !selectedStealTarget || !stealDescription.trim()) return;
    
    const description = stealDescription.trim();
    
    // Find the target object
    const targets = getStealTargets();
    const target = targets.find(t => t.name === selectedStealTarget);
    if (!target) return;
    
    try {
      // Perform D&D 5e steal attempt
      const result = await performStealAttempt(currentCharacter, target, description);
      
      // Send the result message
      sendPlayerAction(result.message);
      
      // If stealth was broken, refresh character data
      if (result.stealthBroken) {
        await fetchCharacters();
        console.log(`💥 Stealth broken due to steal attempt`);
      }
      
    } catch (error) {
      console.error('Failed to perform steal attempt:', error);
      // Fallback to basic message
      sendPlayerAction(`${currentCharacter.name} attempts to stealthily steal from ${selectedStealTarget}: ${description}`);
    }
    
    // reset
    setSelectedStealTarget('');
    setStealDescription('');
    setStealModalVisible(false);
  };

  // Broadcast helpers
  const requestRest = async (type: 'short' | 'long') => {
    if (!currentCampaign || !user) return;
    const deadline = Date.now() + 10000; // 5 seconds - shorter timeout
    console.log('🛌 Requesting rest:', { type, playerId: user.id, playerName: currentCharacter?.name || user.username || 'Player' });
    setPendingRest({ restType: type, requesterId: user.id, requesterName: currentCharacter?.name || user.username || 'Player', deadline, votes: { [user.id]: true } });
    await broadcastRestRequest(currentCampaign.id, { playerId: user.id, playerName: currentCharacter?.name || user.username || 'Player', restType: type, deadline });
  };

  const respondToRest = async (accepted: boolean) => {
    if (!currentCampaign || !user || !pendingRest) return;
    console.log('🛌 Responding to rest with:', { 
      accepted, 
      playerId: user.id, 
      campaignId: currentCampaign.id,
      pendingRestId: pendingRest.requesterId 
    });
    
    try {
      await broadcastRestResponse(currentCampaign.id, { playerId: user.id, accepted });
      console.log('✅ Rest response broadcast sent successfully');
    } catch (error) {
      console.error('❌ Failed to send rest response:', error);
    }
    
    // Don't update local state here - let the broadcast callback handle it
    setShowRestPrompt(false);
  };

  // Redirect to login if auth lost
  useEffect(() => {
    if (user === null) {
      router.replace('/login');
    }
  }, [user]);

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
                .map((message, index) => {
                  // Find the character for this message if it's a player message
                  const messageCharacter = message.character_id 
                    ? characters.find(c => c.id === message.character_id)
                    : undefined;
                  
                  return (
                    <StoryEventItem 
                      key={`${message.id}-${index}`} 
                      message={message} 
                      campaignId={currentCampaign.id}
                      character={messageCharacter}
                      currentUserId={user?.id}
                      onReport={handleReport}
                    />
                  );
                })
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
                    {error}
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
                  {currentCampaign?.paused 
                    ? 'The story has been paused a moment...'
                    : `${currentCampaign?.current_player_name || 'Another player'} is writing their verse...`
                  }
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

          {/* ─── Base Actions Panel ─────────────────────────────── */}
          <View style={styles.actionsPanelWrapper}>
            <TouchableOpacity style={styles.actionsTab} onPress={toggleActionsPanel} activeOpacity={0.7}>
              <ChevronUp size={16} color="#ccc" style={{ transform: [{ rotate: isActionsPanelExpanded ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>

            {isActionsPanelExpanded && (
              <ScrollView style={styles.actionsPanel} horizontal>
                {baseActions.map(action => (
                  <TouchableOpacity
                    key={action.key}
                    style={[styles.actionButton, action.disabled && styles.actionButtonDisabled]}
                    onPress={action.onPress}
                    activeOpacity={0.7}
                    disabled={action.disabled}
                  >
                    {action.icon}
                    <Text style={styles.actionButtonLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

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

        {/* Use Item Modal */}
        <Modal visible={useItemModalVisible} transparent animationType="fade" onRequestClose={() => setUseItemModalVisible(false)}>
          <View style={styles.centeredOverlay}>
            <View style={styles.simpleModal}>
              <Text style={styles.simpleModalTitle}>Use an Item</Text>

              <ScrollView style={{ maxHeight: 250, alignSelf: 'stretch', marginVertical: 8 }}>
                {currentCharacter?.equipment?.filter(eq => {
                  if (!currentCharacter.equipped_items) return true;
                  const isEquipped = Object.values(currentCharacter.equipped_items).some(eqi => {
                    if (!eqi) return false;
                    if (Array.isArray(eqi)) {
                      return eqi.some(item => item && item.id === eq.id);
                    }
                    return eqi.id === eq.id;
                  });
                  return !isEquipped;
                }).map((eq, idx) => (
                  <TouchableOpacity
                    key={`${eq.id}-${idx}`}
                    style={[styles.itemRow, selectedUseItemId === eq.id && styles.itemRowSelected]}
                    onPress={() => setSelectedUseItemId(eq.id)}
                  >
                    <Text style={styles.itemRowText}>{eq.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.simpleTextInput}
                placeholder="Describe how you use the item (optional)"
                placeholderTextColor="#666"
                multiline
                value={useItemNote}
                onChangeText={setUseItemNote}
              />

              <View style={styles.simpleModalButtons}>
                <TouchableOpacity
                  style={[styles.simpleModalButton, !selectedUseItemId && styles.simpleModalButtonDisabled]}
                  disabled={!selectedUseItemId}
                  onPress={handleConfirmUseItem}
                >
                  <Text style={styles.simpleModalButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.simpleModalCancel} onPress={() => setUseItemModalVisible(false)}>
                  <Text style={styles.simpleModalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Rest Modal */}
        <Modal visible={restModalVisible} transparent animationType="fade" onRequestClose={() => setRestModalVisible(false)}>
          <View style={styles.centeredOverlay}>
            <View style={styles.simpleModal}>
              <Text style={styles.simpleModalTitle}>Choose Rest Type</Text>
              <View style={styles.simpleModalButtons}>
                <TouchableOpacity style={styles.simpleModalButton} onPress={() => { requestRest('short'); setRestModalVisible(false); }}>
                  <Text style={styles.simpleModalButtonText}>Short Rest</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.simpleModalButton} onPress={() => { requestRest('long'); setRestModalVisible(false); }}>
                  <Text style={styles.simpleModalButtonText}>Long Rest</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.simpleModalCancel} onPress={() => setRestModalVisible(false)}>
                  <Text style={styles.simpleModalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Steal Modal */}
        <Modal visible={stealModalVisible} transparent animationType="fade" onRequestClose={() => setStealModalVisible(false)}>
          <View style={styles.centeredOverlay}>
            <View style={styles.simpleModal}>
              <Text style={styles.simpleModalTitle}>Choose Steal Target</Text>
              
              <ScrollView style={{ maxHeight: 200, alignSelf: 'stretch', marginVertical: 8 }}>
                {getStealTargets().map((target) => (
                  <TouchableOpacity
                    key={target.id}
                    style={[
                      styles.itemRow, 
                      selectedStealTarget === target.name && styles.itemRowSelected,
                      target.type === 'player' && !target.isOnline && styles.itemRowOffline
                    ]}
                    onPress={() => setSelectedStealTarget(target.name)}
                    disabled={target.type === 'player' && !target.isOnline}
                  >
                    <Text style={[
                      styles.itemRowText,
                      target.type === 'player' && !target.isOnline && styles.itemRowTextOffline
                    ]}>
                      {target.name} {target.type === 'player' ? '(Player)' : '(NPC)'}
                      {target.type === 'player' && !target.isOnline && ' (Offline)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.simpleTextInput}
                placeholder="Describe what you're trying to steal..."
                placeholderTextColor="#666"
                multiline
                value={stealDescription}
                onChangeText={setStealDescription}
              />

              <View style={styles.simpleModalButtons}>
                <TouchableOpacity
                  style={[
                    styles.simpleModalButton, 
                    (!selectedStealTarget || !stealDescription.trim()) && styles.simpleModalButtonDisabled
                  ]}
                  disabled={!selectedStealTarget || !stealDescription.trim()}
                  onPress={handleConfirmSteal}
                >
                  <Text style={styles.simpleModalButtonText}>Attempt Steal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.simpleModalCancel} onPress={() => setStealModalVisible(false)}>
                  <Text style={styles.simpleModalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Rest Vote Prompt */}
        <Modal visible={showRestPrompt && !!pendingRest} transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.centeredOverlay}>
            <View style={styles.simpleModal}>
              <Text style={styles.simpleModalTitle}>{pendingRest?.requesterName} has requested a {pendingRest?.restType} rest.</Text>
              <Text style={{ color: '#ccc', marginBottom: 12 }}>Do you agree?</Text>
              <View style={styles.simpleModalButtons}>
                <TouchableOpacity style={styles.simpleModalButton} onPress={() => respondToRest(true)}>
                  <Text style={styles.simpleModalButtonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.simpleModalCancel} onPress={() => respondToRest(false)}>
                  <Text style={styles.simpleModalCancelText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  bannerAd: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  // ─── Base Actions Panel Styles ──────────────────────────────
  actionsPanelWrapper: {
    backgroundColor: 'rgba(26,26,26,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionsTab: {
    alignSelf: 'center',
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsPanel: {
    flexDirection: 'row',
    paddingBottom: 6,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 8,
    margin: 4,
    width: 80,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonLabel: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    textAlign: 'center',
  },
  // Simple modal
  simpleModal: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 32,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  simpleModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  simpleModalButtons: {
    width: '100%',
    gap: 12,
  },
  simpleModalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  simpleModalButtonText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  simpleModalCancel: {
    marginTop: 8,
    alignItems: 'center',
  },
  simpleModalCancelText: {
    color: '#f44336',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  // Item row styles
  itemRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  itemRowSelected: {
    backgroundColor: '#4CAF50',
  },
  itemRowText: {
    color: '#fff',
    fontFamily: 'Inter-Regular',
  },
  itemRowOffline: {
    opacity: 0.5,
    backgroundColor: '#333',
  },
  itemRowTextOffline: {
    color: '#999',
  },
  simpleTextInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
    alignSelf: 'stretch',
    marginVertical: 8,
    fontFamily: 'Inter-Regular',
  },
  simpleModalButtonDisabled: {
    backgroundColor: '#555',
  },
  centeredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});