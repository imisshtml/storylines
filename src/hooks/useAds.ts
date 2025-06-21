import { useAtom } from 'jotai';
import { userCapabilitiesAtom } from '../atoms/userCapabilitiesAtoms';
import { adManager } from '../utils/adManager';

export const useAds = () => {
  const [userCapabilities] = useAtom(userCapabilitiesAtom);

  const showInterstitial = async (context?: string) => {
    try {
      console.log(`Showing interstitial ad for context: ${context || 'general'}`);
      await adManager.showInterstitial(userCapabilities.adsRemoved);
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
    }
  };

  const shouldShowAds = () => {
    return adManager.shouldShowAds(userCapabilities.adsRemoved);
  };

  const getBannerAdUnitId = () => {
    return adManager.getBannerAdUnitId();
  };

  return {
    showInterstitial,
    shouldShowAds,
    getBannerAdUnitId,
    adsRemoved: userCapabilities.adsRemoved,
  };
}; 