import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { initializeAuthAtom, userAtom } from '../src/atoms/authAtoms';
import { fetchCampaignsAtom } from '../src/atoms/campaignAtoms';
import { 
  fetchFriendsAtom,
  fetchFriendRequestsReceivedAtom,
  fetchFriendRequestsSentAtom,
  fetchCampaignInvitationsAtom
} from '../src/atoms/friendsAtoms';
import { fetchCampaignReadStatusAtom } from '../src/atoms/campaignReadStatusAtoms';
import { fetchCharactersAtom } from '../src/atoms/characterAtoms';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { useConnectionMonitor } from '../src/hooks/useConnectionMonitor';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { View, Platform } from 'react-native';
import { CustomAlertProvider } from '../src/components/CustomAlert';
import { adManager } from '../src/utils/adManager';
import LevelUpModal from '../src/components/LevelUpModal';
import { checkForLevelUpCharactersAtom } from '../src/atoms/levelUpAtoms';
import UpdateManager from '../src/components/UpdateManager';
import { 
  initializeAppStateMonitoring, 
  cleanupConnectionMonitoring,
  monitorSubscriptionHealth,
  reconnectAllSubscriptions,
  createUnifiedUserSubscription,
  getUnifiedSubscriptionStatus
} from '../src/utils/connectionUtils';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  const [, initializeAuth] = useAtom(initializeAuthAtom);
  const [user] = useAtom(userAtom);
  
  // Fetch functions for updating state based on realtime events
  const [, fetchCampaigns] = useAtom(fetchCampaignsAtom);
  const [, fetchFriends] = useAtom(fetchFriendsAtom);
  const [, fetchFriendRequestsReceived] = useAtom(fetchFriendRequestsReceivedAtom);
  const [, fetchFriendRequestsSent] = useAtom(fetchFriendRequestsSentAtom);
  const [, fetchCampaignInvitations] = useAtom(fetchCampaignInvitationsAtom);
  const [, fetchCampaignReadStatus] = useAtom(fetchCampaignReadStatusAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [, checkForLevelUpCharacters] = useAtom(checkForLevelUpCharactersAtom);

  // TEMPORARILY DISABLED - Connection monitoring was interfering with campaign queries
  // useConnectionMonitor({
  //   onConnectionLost: () => {
  //     console.log('🔴 Global connection lost - monitoring all subscriptions');
  //   },
  //   onConnectionRestored: () => {
  //     console.log('🟢 Global connection restored - checking subscription health');
  //     setTimeout(() => {
  //       monitorSubscriptionHealth();
  //     }, 2000);
  //   },
  //   checkInterval: 120000 // Check every 2 minutes
  // });

  useEffect(() => {
    // Store cleanup functions
    let unifiedCleanup: (() => void) | null = null;
    let isInitialized = false;

    // Initialize authentication and unified real-time subscription
    const initialize = async () => {
      if (isInitialized) {
        console.log('🚫 Skipping duplicate initialization');
        return;
      }
      
      try {
        console.log('🚀 Starting app initialization...');
        isInitialized = true;
        
        // Initialize app state monitoring for connection recovery
        initializeAppStateMonitoring();
        
        console.log('🔐 Initializing authentication...');
        await initializeAuth();
        
        console.log('👤 User status after auth:', user ? `ID: ${user.id}` : 'No user');
        
        // Initialize AdManager with delay
        await new Promise(resolve => setTimeout(resolve, 500));
        await adManager.initialize();
        
        console.log('✅ App initialization completed successfully');
      } catch (error) {
        console.error(`❌ [${Platform.OS}] [App Layout] Initialization error:`, error);
        isInitialized = false; // Allow retry
        
        // On critical initialization failure, try to recover connections
        setTimeout(async () => {
          console.log('🔄 Attempting connection recovery after initialization failure...');
          await reconnectAllSubscriptions();
        }, 5000);
      }
    };

    // Separate function to initialize unified subscription when user is available
    const initializeUnifiedSubscription = () => {
      if (!user?.id) {
        console.log('⏳ No user available yet for unified subscription');
        return;
      }

      if (unifiedCleanup) {
        console.log('🔄 User changed, cleaning up previous unified subscription');
        unifiedCleanup();
        unifiedCleanup = null;
      }

      console.log('📡 Creating unified realtime subscription for user:', user.id);
      
      unifiedCleanup = createUnifiedUserSubscription(user.id, {
        onCampaignUpdate: (payload) => {
          console.log('📨 Campaign update received');
          fetchCampaigns();
        },
        onCampaignHistoryUpdate: (payload) => {
          console.log('📨 Campaign history update received');
          fetchCampaigns(); // Refresh campaigns to update notification status
        },
        onFriendshipUpdate: (payload) => {
          console.log('📨 Friendship update received');
          setTimeout(() => {
            fetchFriends();
            fetchFriendRequestsReceived();
            fetchFriendRequestsSent();
          }, 100);
        },
        onCampaignInvitationUpdate: (payload) => {
          console.log('📨 Campaign invitation update received');
          setTimeout(() => {
            fetchCampaignInvitations();
          }, 100);
        },
        onReadStatusUpdate: (payload) => {
          console.log('📨 Read status update received');
          fetchCampaignReadStatus();
        },
                    onCharacterUpdate: (payload) => {
              console.log('📨 Character update received');
              // Only handle level changes for notifications
              if (payload.new.level !== payload.old.level) {
                console.log('Character level changed:', payload.new.name, payload.old.level, '->', payload.new.level);
                fetchCharacters();
                checkForLevelUpCharacters();
              }
            }
      });

      // Monitor subscription health after initialization
      setTimeout(() => {
        const status = getUnifiedSubscriptionStatus();
        console.log('📊 Unified subscription status:', status);
        monitorSubscriptionHealth();
      }, 2000);
    };

    // Initialize app first (auth, ads, etc.)
    initialize();

    // TEMPORARILY DISABLED - Testing if unified subscription interferes with REST queries
    // if (user?.id) {
    //   initializeUnifiedSubscription();
    // }

    // Cleanup function to run when component unmounts or user changes
    return () => {
      console.log('🧹 Cleaning up unified subscription...');
      if (unifiedCleanup) {
        try {
          unifiedCleanup();
          console.log('✅ Unified subscription cleaned up');
        } catch (error) {
          console.error('❌ Error during unified subscription cleanup:', error);
        }
      }
      cleanupConnectionMonitoring();
      isInitialized = false;
    };
  }, [user?.id]); // Re-initialize when user changes

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <UpdateManager>
      <CustomAlertProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <View style={{ flex: 1, backgroundColor: '#121212' }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="home" />
                <Stack.Screen name="login" />
                <Stack.Screen name="creation" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="shop" />
                <Stack.Screen name="friends" />
                <Stack.Screen name="invite" />
                <Stack.Screen name="create" />
                <Stack.Screen name="characters" />
                <Stack.Screen name="join" />
                <Stack.Screen
                  name="story"
                  options={{
                    presentation: 'fullScreenModal',
                    animation: 'fade',
                  }}
                />
              </Stack>
              <StatusBar style="auto" />
              <LevelUpModal />
            </View>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </CustomAlertProvider>
    </UpdateManager>
  );
}