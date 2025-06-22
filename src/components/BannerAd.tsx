import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BannerAdProps {
  size?: string;
  adsRemoved?: boolean;
}

// Mock BannerAd component for Expo Go compatibility
export default function BannerAd({ size = 'BANNER', adsRemoved = false }: BannerAdProps) {
  // Don't show anything if ads are removed
  if (adsRemoved) {
    return null;
  }

  // In Expo Go, show a placeholder instead of real ads
  return (
    <View style={styles.mockAdContainer}>
      <Text style={styles.mockAdText}>
        [Mock Ad - {size}]
      </Text>
      <Text style={styles.mockAdSubtext}>
        Ads disabled in Expo Go
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mockAdContainer: {
    height: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    margin: 10,
  },
  mockAdText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  mockAdSubtext: {
    fontSize: 10,
    color: '#999',
  },
}); 