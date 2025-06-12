import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { initializeAuthAtom } from '../src/atoms/authAtoms'
import { initializeRealtimeAtom } from '../src/atoms/campaignAtoms';
import { initializeCampaignReadStatusRealtimeAtom } from '../src/atoms/campaignReadStatusAtoms';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { View } from 'react-native';
import CustomSplashScreen from '../src/components/CustomSplashScreen';

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
  
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // Initialize authentication and real-time subscriptions
    const initialize = async () => {
      try {
        await initializeAuth();
        // Initialize real-time subscription after auth is ready
        await initializeRealtime();
        // Initialize read status real-time subscription
        await initializeReadStatusRealtime();
        
        // Add a small delay to ensure splash screen is visible
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setAppIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setAppIsReady(true); // Still set ready to prevent infinite loading
      }
    };
    
    if (fontsLoaded || fontError) {
      initialize();
    }
  }, [fontsLoaded, fontError, initializeAuth, initializeRealtime, initializeReadStatusRealtime]);

  useEffect(() => {
    if (appIsReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded, fontError]);

  if (!appIsReady || (!fontsLoaded && !fontError)) {
    return <CustomSplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={{ flex: 1, backgroundColor: '#121212' }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="home" />
            <Stack.Screen name="login" />
            <Stack.Screen name="creation" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="(tabs)" />
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
  );
}