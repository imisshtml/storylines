import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useCustomAlert } from './CustomAlert';
import { PurchaseManager } from '../utils/purchaseManager';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/authAtoms';

interface AdventurerPackModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function AdventurerPackModal({ isVisible, onClose }: AdventurerPackModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useCustomAlert();
  const [user] = useAtom(userAtom);

  const benefits = [
    '+3 characters',
    '+3 campaigns', 
    'No ads',
    'New characters get class specific kit',
    'Start of campaign you get 3 healing potions',
    'Receive random magical item at start of campaign'
  ];

  const handleSubscribe = async () => {
    if (!user?.id) {
      showAlert(
        'Authentication Required',
        'Please log in to subscribe.',
        [{ text: 'OK' }],
        'error'
      );
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement RevenueCat subscription logic
      console.log('Subscribing to Adventurer Pack...');
      
      // Placeholder for RevenueCat integration
      // const product = await Purchases.getProducts(['adventurers_pack']);
      // const purchaseResult = await Purchases.purchaseProduct(product[0]);
      
      // Simulate subscription delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Process the subscription in our database
      const success = await PurchaseManager.handlePurchaseSuccess('adventurers_pack', user.id);
      
      if (success) {
        showAlert(
          'Welcome to the Adventurer Pack!',
          'Your subscription is now active. Enjoy your enhanced adventures!',
          [{ text: 'Start Adventuring!' }],
          'success'
        );
        
        onClose();
      } else {
        throw new Error('Failed to process subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showAlert(
        'Subscription Failed',
        'There was an issue processing your subscription. Please try again.',
        [{ text: 'OK' }],
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Adventurer Pack</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../../assets/images/adventurersPack.png')} 
                style={styles.heroIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.heroTitle}>Adventurer Pack</Text>
            <Text style={styles.heroSubtitle}>
              Enhanced player features for the ultimate adventure experience
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>$4.99</Text>
              <Text style={styles.period}>per month</Text>
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>What's Included</Text>
            <View style={styles.benefitsList}>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.checkContainer}>
                    <Check size={18} color="#4CAF50" strokeWidth={3} />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Call to Action */}
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={[styles.subscribeButton, isLoading && styles.subscribeButtonLoading]}
              onPress={handleSubscribe}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.subscribeButtonText}>Start Your Adventure</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.disclaimer}>
              Cancel anytime. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 32,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  heroIcon: {
    width: 80,
    height: 80,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
  },
  period: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
  },
  benefitsSection: {
    padding: 24,
    paddingTop: 0,
  },
  benefitsTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  benefitText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    flex: 1,
    lineHeight: 24,
  },
  ctaSection: {
    padding: 24,
    paddingBottom: 40,
  },
  subscribeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  subscribeButtonLoading: {
    opacity: 0.8,
  },
  subscribeButtonText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
}); 