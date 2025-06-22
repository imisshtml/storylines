// Mock usePaywall hook for Expo Go compatibility
// This replaces the RevenueCat paywall functionality

import { useState, useCallback } from 'react';

// Mock types to replace RevenueCat types
export interface MockOffering {
  identifier: string;
  availablePackages: MockPackage[];
}

export interface MockPackage {
  identifier: string;
  product: {
    identifier: string;
    priceString: string;
  };
}

export function usePaywall() {
  const [isVisible, setIsVisible] = useState(false);
  const [offering, setOffering] = useState<MockOffering | undefined>();

  const showPaywall = useCallback((mockOffering?: MockOffering) => {
    console.log('[usePaywall] Mock paywall shown');
    
    // Set a default mock offering if none provided
    const defaultOffering: MockOffering = {
      identifier: 'default',
      availablePackages: [
        {
          identifier: 'remove_ads',
          product: {
            identifier: 'prod2355afb536',
            priceString: '$1.99'
          }
        },
        {
          identifier: 'increase_characters',
          product: {
            identifier: 'proded7232c986',
            priceString: '$1.99'
          }
        }
      ]
    };

    setOffering(mockOffering || defaultOffering);
    setIsVisible(true);
  }, []);

  const hidePaywall = useCallback(() => {
    console.log('[usePaywall] Mock paywall hidden');
    setIsVisible(false);
    setOffering(undefined);
  }, []);

  return {
    isVisible,
    offering,
    showPaywall,
    hidePaywall,
  };
} 