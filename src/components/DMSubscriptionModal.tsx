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
import { X, Crown, Check } from 'lucide-react-native';
import { useCustomAlert } from './CustomAlert';
import { PurchaseManager } from '../utils/purchaseManager';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/authAtoms';

interface DMSubscriptionModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DMSubscriptionModal({ isVisible, onClose }: DMSubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useCustomAlert();
  const [user] = useAtom(userAtom);

  const benefits = [
    'Your campaigns can have up to 7 players',
    'You can create up to 10 characters',
    'You can Create/Participate in up to 10 campaigns',
    'Access All Adventures, including new DLC when they come out',
    'No ads for you, no ads for players in your campaign (in that storyline)',
    'Priority listing in Open Campaign Search for your campaigns'
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
      console.log('Subscribing to DM Subscription...');

      // Placeholder for RevenueCat integration
      // const product = await Purchases.getProducts(['dm_subscription']);
      // const purchaseResult = await Purchases.purchaseProduct(product[0]);

      // Simulate subscription delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Process the subscription in our database
      const success = await PurchaseManager.handlePurchaseSuccess('dm_subscription', user.id);

      if (success) {
        showAlert(
          'Welcome, Dungeon Master!',
          'Your DM subscription is now active. Time to create legendary adventures!',
          [{ text: 'Start DMing!' }],
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
          <Text style={styles.headerTitle}>DM Subscription</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/images/gamemaster.png')}
                style={styles.heroIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.titleContainer}>
              <Crown size={32} color="#FFD700" />
              <Text style={styles.heroTitle}>DM Subscription</Text>
            </View>
            <Text style={styles.heroSubtitle}>
              Unlock the full power of being a Dungeon Master with premium features and exclusive content
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>$9.99</Text>
              <Text style={styles.period}>per month</Text>
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Master Features</Text>
            <View style={styles.benefitsList}>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.checkContainer}>
                    <Check size={18} color="#FFD700" strokeWidth={3} />
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
                <>
                  <Crown size={20} color="#000" />
                  <Text style={styles.subscribeButtonText}>Become a Dungeon Master</Text>
                </>
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
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  heroIcon: {
    width: 80,
    height: 80,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#fff',
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
    color: '#FFD700',
  },
  period: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFD700',
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
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
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
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#FFD700',
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