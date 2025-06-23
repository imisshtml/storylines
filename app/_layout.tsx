import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { initializeAuthAtom } from '../src/atoms/authAtoms'
import { initializeRealtimeAtom } from '../src/atoms/campaignAtoms';
import { initializeCampaignReadStatusRealtimeAtom } from '../src/atoms/campaignReadStatusAtoms';
import { initializeFriendshipsRealtimeAtom } from '../src/atoms/friendsAtoms';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useConnectionMonitor } from '../src/hooks/useConnectionMonitor';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { View, Platform } from 'react-native';
import { CustomAlertProvider } from '../src/components/CustomAlert';
import { adManager } from '../src/utils/adManager';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  const [, initializeAuth] = useAtom(initializeAuthAtom);
  const [, initializeRealtime] = useAtom(initializeRealtimeAtom);
  const [, initializeReadStatusRealtime] = useAtom(initializeCampaignReadStatusRealtimeAtom);
  const [, initializeFriendshipsRealtime] = useAtom(initializeFriendshipsRealtimeAtom);

  // Global connection monitoring - runs once and persists across all navigation
  useConnectionMonitor({
    onConnectionLost: () => {
      console.info('Global connection lost - this will persist across all screens');
    },
    onConnectionRestored: () => {
      console.info('Global connection restored');
    },
    checkInterval: 120000 // Check every 2 minutes (less aggressive)
  });

  useEffect(() => {
    // Initialize authentication, real-time subscriptions, and ads
    const initialize = async () => {
      try {
        await initializeAuth();
        await initializeRealtime();
        await initializeReadStatusRealtime();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await initializeFriendshipsRealtime();
        
        // Initialize AdManager
        await adManager.initialize();
        console.log('AdManager initialized in app layout');
      } catch (error) {
        console.error(`[${Platform.OS}] [App Layout] Initialization error:`, error);
      }
    };

    initialize();
  }, [initializeAuth, initializeRealtime, initializeReadStatusRealtime, initializeFriendshipsRealtime]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
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
          </View>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </CustomAlertProvider>
  );
}