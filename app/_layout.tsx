import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { initializeAuthAtom } from '../src/atoms/authAtoms'
import { initializeRealtimeAtom } from '../src/atoms/campaignAtoms';
import { initializeCampaignReadStatusRealtimeAtom } from '../src/atoms/campaignReadStatusAtoms';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useConnectionMonitor } from '../src/hooks/useConnectionMonitor';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { View } from 'react-native';
import { CustomAlertProvider } from '../src/components/CustomAlert';

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

  // Global connection monitoring - runs once and persists across all navigation
  useConnectionMonitor({
    onConnectionLost: () => {
      console.log('Global connection lost - this will persist across all screens');
    },
    onConnectionRestored: () => {
      console.log('Global connection restored');
    },
    checkInterval: 120000 // Check every 2 minutes (less aggressive)
  });

  useEffect(() => {
    // Initialize authentication and real-time subscriptions
    const initialize = async () => {
      await initializeAuth();
      // Initialize real-time subscription after auth is ready
      await initializeRealtime();
      // Initialize read status real-time subscription
      await initializeReadStatusRealtime();
    };
    
    initialize();
  }, [initializeAuth, initializeRealtime, initializeReadStatusRealtime]);

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