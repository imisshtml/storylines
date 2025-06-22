import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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

// Mock PAYWALL_RESULT enum
export const PAYWALL_RESULT = {
  NOT_PRESENTED: 0,
  ERROR: 1,
  CANCELLED: 2,
  PURCHASED: 3,
  RESTORED: 4,
};

interface RevenueCatPaywallProps {
  offering?: MockOffering;
  onPurchaseCompleted?: (result: number) => void;
  onRestoreCompleted?: (result: number) => void;
  onError?: (error: any) => void;
}

// Mock RevenueCat Paywall component for Expo Go compatibility
export default function RevenueCatPaywall({ 
  offering, 
  onPurchaseCompleted, 
  onRestoreCompleted, 
  onError 
}: RevenueCatPaywallProps) {
  
  const handleMockPurchase = (packageItem: MockPackage) => {
    console.log('[RevenueCatPaywall] Mock purchase for:', packageItem.product.identifier);
    
    // Simulate purchase delay
    setTimeout(() => {
      onPurchaseCompleted?.(PAYWALL_RESULT.PURCHASED);
    }, 1000);
  };

  const handleMockRestore = () => {
    console.log('[RevenueCatPaywall] Mock restore purchases');
    
    // Simulate restore delay
    setTimeout(() => {
      onRestoreCompleted?.(PAYWALL_RESULT.RESTORED);
    }, 1000);
  };

  if (!offering) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mock Paywall</Text>
        <Text style={styles.subtitle}>No offering available</Text>
        <Text style={styles.note}>
          RevenueCat disabled in Expo Go
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mock Paywall</Text>
      <Text style={styles.subtitle}>Choose your upgrade</Text>
      
      {offering.availablePackages.map((packageItem) => (
        <TouchableOpacity
          key={packageItem.identifier}
          style={styles.packageButton}
          onPress={() => handleMockPurchase(packageItem)}
        >
          <Text style={styles.packageTitle}>
            {packageItem.identifier.replace(/_/g, ' ').toUpperCase()}
          </Text>
          <Text style={styles.packagePrice}>
            {packageItem.product.priceString}
          </Text>
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleMockRestore}
      >
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        This is a mock paywall for Expo Go testing.
        Real purchases would work with native RevenueCat.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  packageButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  packageTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  packagePrice: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
  restoreButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  restoreText: {
    color: '#007AFF',
    fontSize: 14,
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
    maxWidth: 300,
  },
}); 