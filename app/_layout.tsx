import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { fetchCampaignsAtom, initializeRealtimeAtom } from '../src/atoms/campaignAtoms'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  const [, fetchCampaigns] = useAtom(fetchCampaignsAtom);
  const [, initializeRealtime] = useAtom(initializeRealtimeAtom);

  useEffect(() => {
    // Initialize Supabase realtime subscription
    initializeRealtime();
    // Fetch initial campaigns data
    fetchCampaigns();
  }, [initializeRealtime, fetchCampaigns]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            title: 'Home'
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}