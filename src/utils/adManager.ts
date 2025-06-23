// Mock AdManager for Expo Go compatibility
// This replaces the native Google Mobile Ads functionality

export class AdManager {
  private static instance: AdManager;
  private isInitialized = false;

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[AdManager] Mock initialization - ads disabled for Expo Go');
    this.isInitialized = true;
  }

  async showInterstitial(adsRemoved: boolean = false): Promise<void> {
    console.log('[AdManager] Mock interstitial ad - would show if native');
    // In Expo Go, we just log and return
    return;
  }

  async showRewarded(): Promise<{ rewarded: boolean }> {
    console.log('[AdManager] Mock rewarded ad - would show if native');
    // In Expo Go, we simulate a successful reward
    return { rewarded: true };
  }

  getBannerAdSize(): string {
    return 'BANNER'; // Mock banner size
  }

  isAdManagerInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const adManager = AdManager.getInstance(); 