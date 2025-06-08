import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { userAtom, authLoadingAtom } from '../src/atoms/authAtoms';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const [user] = useAtom(userAtom);
  const [authLoading] = useAtom(authLoadingAtom);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // User is authenticated, go to home
        router.replace('/home');
      } else {
        // User is not authenticated, go to login
        router.replace('/login');
      }
    }
  }, [user, authLoading]);

  // Show loading screen while checking auth state
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