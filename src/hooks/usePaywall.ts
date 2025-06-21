import { useState } from 'react';
import { PurchasesOffering } from 'react-native-purchases';

interface UsePaywallReturn {
  isPaywallVisible: boolean;
  showPaywall: (offering?: PurchasesOffering) => void;
  hidePaywall: () => void;
  currentOffering?: PurchasesOffering;
}

export function usePaywall(): UsePaywallReturn {
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | undefined>();

  const showPaywall = (offering?: PurchasesOffering) => {
    setCurrentOffering(offering);
    setIsPaywallVisible(true);
  };

  const hidePaywall = () => {
    setIsPaywallVisible(false);
    setCurrentOffering(undefined);
  };

  return {
    isPaywallVisible,
    showPaywall,
    hidePaywall,
    currentOffering,
  };
} 