import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd as GoogleBannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAtom } from 'jotai';
import { userCapabilitiesAtom } from '../atoms/userCapabilitiesAtoms';
import { adManager } from '../utils/adManager';

interface BannerAdProps {
  size?: BannerAdSize;
  style?: any;
}

export default function BannerAd({ size = BannerAdSize.BANNER, style }: BannerAdProps) {
  const [userCapabilities] = useAtom(userCapabilitiesAtom);
  const [adUnitId, setAdUnitId] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAd = async () => {
      try {
        await adManager.initialize();
        const unitId = adManager.getBannerAdUnitId();
        setAdUnitId(unitId);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize banner ad:', error);
      }
    };

    initializeAd();
  }, []);

  // Don't show ads if user has purchased ad removal
  if (!adManager.shouldShowAds(userCapabilities.adsRemoved)) {
    return null;
  }

  // Don't show if ad unit ID is not available or not initialized
  if (!adUnitId || !isInitialized) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <GoogleBannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded successfully');
        }}
        onAdFailedToLoad={(error) => {
          console.error('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
}); 