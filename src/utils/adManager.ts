import { Platform } from 'react-native';
import mobileAds, { 
  BannerAd, 
  BannerAdSize, 
  TestIds, 
  InterstitialAd, 
  AdEventType,
  GAMBannerAd,
} from 'react-native-google-mobile-ads';

/**
 * AdMob Integration for Storylines
 * 
 * PRODUCTION SETUP:
 * 1. Create an AdMob account at https://admob.google.com
 * 2. Create a new app and get your App ID
 * 3. Create banner and interstitial ad units
 * 4. Replace the test IDs below with your real ad unit IDs
 * 5. Update app.json with your real AdMob App IDs
 * 
 * Current configuration uses test IDs for development.
 */

// AdMob configuration
const ADMOB_CONFIG = {
  // Test IDs for development (provided by Google)
  BANNER_AD_UNIT_ID: __DEV__ ? TestIds.BANNER : Platform.select({
    ios: 'ca-app-pub-YOUR_APP_ID/YOUR_BANNER_UNIT_ID',
    android: 'ca-app-pub-YOUR_APP_ID/YOUR_BANNER_UNIT_ID',
  }),
  INTERSTITIAL_AD_UNIT_ID: __DEV__ ? TestIds.INTERSTITIAL : Platform.select({
    ios: 'ca-app-pub-YOUR_APP_ID/YOUR_INTERSTITIAL_UNIT_ID',
    android: 'ca-app-pub-YOUR_APP_ID/YOUR_INTERSTITIAL_UNIT_ID',
  }),
};

export class AdManager {
  private static instance: AdManager;
  private isInitialized = false;
  private interstitialAd: InterstitialAd | null = null;
  private interstitialLoaded = false;

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize the Google Mobile Ads SDK
      await mobileAds().initialize();
      
      // Create and load interstitial ad
      await this.createInterstitialAd();
      
      this.isInitialized = true;
      console.log('AdManager initialized successfully with Google Mobile Ads');
    } catch (error) {
      console.error('Failed to initialize AdManager:', error);
    }
  }

  private async createInterstitialAd(): Promise<void> {
    try {
      if (!ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID) {
        console.warn('Interstitial ad unit ID not configured');
        return;
      }

      this.interstitialAd = InterstitialAd.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: false,
      });

      // Set up event listeners
      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        this.interstitialLoaded = true;
        console.log('Interstitial ad loaded');
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('Interstitial ad error:', error);
        this.interstitialLoaded = false;
      });

      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Interstitial ad closed');
        // Create a new ad for next time
        setTimeout(() => {
          this.createInterstitialAd();
        }, 1000);
      });

      // Load the ad
      await this.interstitialAd.load();
    } catch (error) {
      console.error('Failed to create interstitial ad:', error);
      this.interstitialLoaded = false;
    }
  }

  async showInterstitial(adsRemoved: boolean = false): Promise<void> {
    // Don't show ads if user has purchased ad removal
    if (adsRemoved) {
      console.log('Ads removed - skipping interstitial');
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.interstitialAd && this.interstitialLoaded) {
        await this.interstitialAd.show();
        console.log('Interstitial ad shown');
        this.interstitialLoaded = false; // Will be recreated after close
      } else {
        console.log('Interstitial ad not ready');
        // Try to create for next time
        this.createInterstitialAd();
      }
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      // Try to create for next time
      this.createInterstitialAd();
    }
  }

  getBannerAdUnitId(): string | undefined {
    return ADMOB_CONFIG.BANNER_AD_UNIT_ID;
  }

  getBannerAdSize(): BannerAdSize {
    return BannerAdSize.BANNER;
  }

  shouldShowAds(adsRemoved: boolean): boolean {
    return !adsRemoved;
  }
}

// Export singleton instance
export const adManager = AdManager.getInstance(); 