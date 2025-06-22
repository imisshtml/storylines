import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { X } from 'lucide-react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { PurchasesOffering } from 'react-native-purchases';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/authAtoms';
import { fetchUserCapabilitiesAtom } from '../atoms/userCapabilitiesAtoms';
import { purchaseManager } from '../utils/purchaseManager';
import { useCustomAlert } from './CustomAlert';

interface RevenueCatPaywallProps {
  visible: boolean;
  onClose: () => void;
  offering?: PurchasesOffering; // Optional specific offering object
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
}

export default function RevenueCatPaywall({
  visible,
  onClose,
  offering,
  onPurchaseSuccess,
  onPurchaseError
}: RevenueCatPaywallProps) {
  const [user] = useAtom(userAtom);
  const [, fetchCapabilities] = useAtom(fetchUserCapabilitiesAtom);
  const { showAlert } = useCustomAlert();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeRevenueCat = async () => {
      if (user?.id && !isInitialized) {
        try {
          await purchaseManager.initialize(user.id);
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize RevenueCat for paywall:', error);
        }
      }
    };

    if (visible) {
      initializeRevenueCat();
    }
  }, [visible, user?.id, isInitialized]);

  const handlePurchaseCompleted = async (customerInfo: any) => {
    console.log('Purchase completed from paywall:', customerInfo);
    try {
      await fetchCapabilities();
      onPurchaseSuccess?.();
      showAlert(
        'Purchase Successful!',
        'Thank you for your purchase! Your new features are now available.',
        [{ text: 'Continue', onPress: onClose }],
        'success'
      );
    } catch (error) {
      console.error('Error refreshing capabilities after purchase:', error);
    }
  };

  const handleRestoreCompleted = async (customerInfo: any) => {
    console.log('Restore completed from paywall:', customerInfo);
    try {
      await fetchCapabilities();
      showAlert(
        'Purchases Restored!',
        'Your previous purchases have been restored successfully.',
        [{ text: 'Continue', onPress: onClose }],
        'success'
      );
    } catch (error) {
      console.error('Error refreshing capabilities after restore:', error);
    }
  };

  const handlePurchaseError = (error: any) => {
    console.log('Purchase error from paywall:', error);
    const errorMessage = 'There was an issue processing your purchase. Please try again.';
    onPurchaseError?.(errorMessage);
    showAlert(
      'Purchase Failed',
      errorMessage,
      [{ text: 'OK' }],
      'error'
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* RevenueCat Paywall */}
        <View style={styles.paywallContainer}>
          {isInitialized ? (
            <RevenueCatUI.Paywall
              options={{
                offering: offering,
              }}
              onPurchaseCompleted={handlePurchaseCompleted}
              onRestoreCompleted={handleRestoreCompleted}
              onPurchaseError={handlePurchaseError}
              onDismiss={onClose}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading purchase options...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 60,
  },
  headerSpacer: {
    width: 24, // Same width as close button for centering
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  paywallContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#ccc',
    fontFamily: 'Inter-Regular',
  },
}); 