import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { userAtom, authLoadingAtom } from '../src/atoms/authAtoms';
import { campaignsLoadingAtom } from '../src/atoms/campaignAtoms';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const [user] = useAtom(userAtom);
  const [authLoading] = useAtom(authLoadingAtom);
  const [campaignsLoading] = useAtom(campaignsLoadingAtom);

  useEffect(() => {
    if (!authLoading && !campaignsLoading) {
      if (user) {
        // User is authenticated and campaigns are loaded, go to home
        router.replace('/home');
      } else {
        // User is not authenticated, go to login
        router.replace('/login');
      }
    }
  }, [user, authLoading, campaignsLoading]);

  // Show loading screen while checking auth state and loading campaigns
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
});