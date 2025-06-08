import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { fetchCampaignsAtom } from '../src/atoms/campaignAtoms';
import { initializeAuthAtom } from '../src/atoms/authAtoms'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { View } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  const [, fetchCampaigns] = useAtom(fetchCampaignsAtom);
  const [, initializeAuth] = useAtom(initializeAuthAtom);

  useEffect(() => {
    // Initialize authentication and fetch campaigns
    const initialize = async () => {
      await initializeAuth();
      await fetchCampaigns();
    };
    
    initialize();
  }, [initializeAuth, fetchCampaigns]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
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