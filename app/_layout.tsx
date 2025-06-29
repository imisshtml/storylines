import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { initializeAuthAtom } from '../src/atoms/authAtoms'
import { initializeRealtimeAtom } from '../src/atoms/campaignAtoms';
import { initializeCampaignReadStatusRealtimeAtom } from '../src/atoms/campaignReadStatusAtoms';
import { initializeFriendshipsRealtimeAtom } from '../src/atoms/friendsAtoms';
import { useConnectionMonitor } from '../src/hooks/useConnectionMonitor';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { View, Platform } from 'react-native';
import { CustomAlertProvider } from '../src/components/CustomAlert';
import { adManager } from '../src/utils/adManager';
import LevelUpModal from '../src/components/LevelUpModal';
import { initializeCharacterLevelRealtimeAtom } from '../src/atoms/levelUpAtoms';
import UpdateManager from '../src/components/UpdateManager';
import { useEquipmentReference } from '../src/hooks/useEquipmentReference';
import { 
  cleanupConnectionMonitoring,
  monitorSubscriptionHealth,
  reconnectAllSubscriptions,
  initializeAppStateMonitoring
} from '../src/utils/connectionUtils';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  const [, initializeAuth] = useAtom(initializeAuthAtom);
  const [, initializeRealtime] = useAtom(initializeRealtimeAtom);
  const [, initializeReadStatusRealtime] = useAtom(initializeCampaignReadStatusRealtimeAtom);
  const [, initializeFriendshipsRealtime] = useAtom(initializeFriendshipsRealtimeAtom);
  const [, initializeCharacterLevelRealtime] = useAtom(initializeCharacterLevelRealtimeAtom);
  
  // Initialize equipment reference
  const { loadEquipmentReference } = useEquipmentReference();

  // Enhanced connection monitoring with manual recovery options
  useConnectionMonitor({
    onConnectionLost: () => {
      console.log('🔴 Global connection lost - monitoring all subscriptions');
      // Don't automatically reconnect here - let individual subscriptions handle it
    },
    onConnectionRestored: () => {
      console.log('🟢 Global connection restored - checking subscription health');
      setTimeout(() => {
        monitorSubscriptionHealth();
      }, 2000); // Give subscriptions time to reconnect
    },
    checkInterval: 120000 // Check every 2 minutes (less aggressive)
  });

  useEffect(() => {
    // Store cleanup functions
    let cleanupFunctions: (() => void)[] = [];
    let isInitialized = false;

    // Initialize authentication, real-time subscriptions, and ads
    const initialize = async () => {
      if (isInitialized) {
        console.log('🚫 Skipping duplicate initialization');
        return;
      }

      try {
        console.log('🚀 Starting app initialization...');
        isInitialized = true;
        await initializeAuth();
        
        // Load equipment reference early in the initialization process
        console.log('🛡️ Loading equipment reference...');
        await loadEquipmentReference();

        // Initialize realtime subscriptions with staggered timing to prevent overload
        console.log('📡 Initializing realtime subscriptions...');

        const campaignCleanup = await initializeRealtime();
        if (campaignCleanup) cleanupFunctions.push(campaignCleanup);

        // Small delay between subscriptions to prevent Android memory pressure
        await new Promise(resolve => setTimeout(resolve, 500));

        const readStatusCleanup = await initializeReadStatusRealtime();
        if (readStatusCleanup) cleanupFunctions.push(readStatusCleanup);

        await new Promise(resolve => setTimeout(resolve, 500));

        const friendshipsCleanup = await initializeFriendshipsRealtime();
        if (friendshipsCleanup) cleanupFunctions.push(friendshipsCleanup);

        await new Promise(resolve => setTimeout(resolve, 500));

        const characterLevelCleanup = await initializeCharacterLevelRealtime();
        if (characterLevelCleanup) cleanupFunctions.push(characterLevelCleanup);

        // Initialize AdManager with delay
        await new Promise(resolve => setTimeout(resolve, 500));
        await adManager.initialize();
        
        // Initialize app state monitoring for online status tracking
        initializeAppStateMonitoring();
        
        // Monitor subscription health after initialization
        setTimeout(() => {
          monitorSubscriptionHealth();
        }, 2000);
        
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

    initialize();

    // Cleanup function to run when component unmounts or dependencies change
    return () => {
      console.log('🧹 Cleaning up app subscriptions...');
      cleanupFunctions.forEach((cleanup, index) => {
        try {
          cleanup();
          console.log(`✅ Cleaned up subscription ${index + 1}`);
        } catch (error) {
          console.error(`❌ Error during subscription cleanup ${index + 1}:`, error);
        }
      });
      cleanupFunctions = [];
      cleanupConnectionMonitoring();
      isInitialized = false;
    };
  }, []); // Remove dependency array to prevent re-initialization

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
                <Stack.Screen name="story" />
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