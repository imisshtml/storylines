import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { ArrowLeft, ShoppingCart, Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCustomAlert } from '../components/CustomAlert';
import DMSubscriptionModal from '../components/DMSubscriptionModal';
import AdventurerPackModal from '../components/AdventurerPackModal';
import { PurchaseManager } from '../utils/purchaseManager';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/authAtoms';

// TODO: Import RevenueCat
// import Purchases from 'react-native-purchases';

interface ShopItem {
  id: string;
  title: string;
  description: string;
  price: string;
  image: any;
  type: 'one_time' | 'subscription';
  revenueCatId?: string;
  isSubscription?: boolean;
}

export default function ShopScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [showDMModal, setShowDMModal] = useState(false);
  const [showAdventurerModal, setShowAdventurerModal] = useState(false);
  const { showAlert } = useCustomAlert();
  const [user] = useAtom(userAtom);

  const shopItems: ShopItem[] = [
    {
      id: 'remove_ads',
      title: 'Remove Ads',
      description: 'Enjoy uninterrupted gameplay without advertisements',
      price: '$0.99',
      image: require('../../assets/images/noAds.png'),
      type: 'one_time',
      revenueCatId: 'remove_ads',
    },
    {
      id: 'character_limit',
      title: 'Character Limit +2',
      description: 'Create 2 additional characters for your adventures',
      price: '$0.99',
      image: require('../../assets/images/increaseCharacters.png'),
      type: 'one_time',
      revenueCatId: 'character_limit_2',
    },
    {
      id: 'campaign_limit',
      title: 'Campaign Limit +2',
      description: 'Host 2 additional campaigns simultaneously',
      price: '$0.99',
      image: require('../../assets/images/increaseCampaigns.png'),
      type: 'one_time',
      revenueCatId: 'campaign_limit_2',
    },
    {
      id: 'all_adventures',
      title: 'Access All Adventures',
      description: 'Unlock all premium adventure modules and content',
      price: '$2.99',
      image: require('../../assets/images/allAdventures.png'),
      type: 'one_time',
      revenueCatId: 'all_adventures',
    },
    {
      id: 'group_size',
      title: 'Group Size +2',
      description: 'Increase your maximum party size by 2 players',
      price: '$0.99',
      image: require('../../assets/images/increaseGroup.png'),
      type: 'one_time',
      revenueCatId: 'group_size_2',
    },
    {
      id: 'scroll_rebirth',
      title: 'Scroll of Rebirth',
      description: 'Instantly revive a fallen character with full health',
      price: '$0.99',
      image: require('../../assets/images/scrollRevive.png'),
      type: 'one_time',
      revenueCatId: 'scroll_rebirth',
    },
  ];

  const handleBack = () => {
    router.back();
  };

  const handlePurchase = async (item: ShopItem) => {
    if (item.id === 'dm_subscription') {
      setShowDMModal(true);
      return;
    }

    if (!user?.id) {
      showAlert(
        'Authentication Required',
        'Please log in to make purchases.',
        [{ text: 'OK' }],
        'error'
      );
      return;
    }

    setLoadingItemId(item.id);
    try {
      // TODO: Implement RevenueCat purchase logic
      console.log(`Purchasing ${item.title}...`);

      // Placeholder for RevenueCat integration
      // const product = await Purchases.getProducts([item.revenueCatId]);
      // const purchaseResult = await Purchases.purchaseProduct(product[0]);

      // Simulate purchase delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Process the purchase in our database
      const success = await PurchaseManager.handlePurchaseSuccess(item.revenueCatId || item.id, user.id);

      if (success) {
        showAlert(
          'Purchase Successful!',
          `${item.title} has been added to your account.`,
          [{ text: 'Continue' }],
          'success'
        );
      } else {
        throw new Error('Failed to process purchase');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showAlert(
        'Purchase Failed',
        'There was an issue processing your purchase. Please try again.',
        [{ text: 'OK' }],
        'error'
      );
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleRestorePurchases = async () => {
    if (!user?.id) {
      showAlert(
        'Authentication Required',
        'Please log in to restore purchases.',
        [{ text: 'OK' }],
        'error'
      );
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement RevenueCat restore logic
      console.log('Restoring purchases...');

      const success = await PurchaseManager.restorePurchases(user.id);

      if (success) {
        showAlert(
          'Purchases Restored',
          'Your previous purchases have been restored successfully.',
          [{ text: 'OK' }],
          'success'
        );
      } else {
        throw new Error('Failed to restore purchases');
      }
    } catch (error) {
      console.error('Restore error:', error);
      showAlert(
        'Restore Failed',
        'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }],
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop</Text>
        <View style={styles.headerRight}>
          <ShoppingCart size={24} color="#4CAF50" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Featured Subscriptions */}
        <View style={styles.subscriptionsSection}>
          <Text style={styles.sectionTitle}>Premium Subscriptions</Text>

          {/* GM Subscription */}
          <TouchableOpacity
            style={styles.premiumCard}
            onPress={() => setShowDMModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.premiumContent}>
              <View style={styles.premiumLeft}>
                <View style={styles.premiumImageContainer}>
                  <Image
                    source={require('../../assets/images/gamemaster.png')}
                    style={styles.premiumImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.premiumInfo}>
                  <View style={styles.premiumHeader}>
                    <Crown size={20} color="#FFD700" />
                    <Text style={styles.premiumTitle}>GM Subscription</Text>
                  </View>
                  <Text style={styles.premiumDescription}>
                    Ultimate GM tools, unlimited campaigns, and exclusive content
                  </Text>
                </View>
              </View>
              <View style={styles.premiumPriceContainer}>
                <Text style={styles.premiumPrice}>$9.99</Text>
                <Text style={styles.premiumPeriod}>/ month</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Adventurers Pack Subscription */}
          <TouchableOpacity
            style={styles.premiumCard}
            onPress={() => setShowAdventurerModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.premiumContent}>
              <View style={styles.premiumLeft}>
                <View style={styles.premiumImageContainer}>
                  <Image
                    source={require('../../assets/images/adventurersPack.png')}
                    style={styles.premiumImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.premiumInfo}>
                  <View style={styles.premiumHeader}>
                    <Text style={styles.premiumTitle}>Adventurers Pack</Text>
                  </View>
                  <Text style={styles.premiumDescription}>
                    Enhanced player features, bonus content, and priority support
                  </Text>
                </View>
              </View>
              <View style={styles.premiumPriceContainer}>
                <Text style={styles.premiumPrice}>$4.99</Text>
                <Text style={styles.premiumPeriod}>/ month</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Shop Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>One-Time Purchases</Text>
          <View style={styles.itemsGrid}>
            {shopItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.shopItem, loadingItemId === item.id && styles.shopItemLoading]}
                onPress={() => handlePurchase(item)}
                disabled={loadingItemId === item.id}
                activeOpacity={0.8}
              >
                {/* Content */}
                <View style={styles.itemContent}>
                  <View style={styles.itemLeft}>
                    <View style={styles.itemImageContainer}>
                      <Image
                        source={item.image}
                        style={styles.itemImage}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    </View>
                  </View>

                  <View style={styles.itemRight}>
                    {loadingItemId === item.id ? (
                      <View style={styles.itemLoadingContainer}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                      </View>
                    ) : (
                      <View style={styles.itemPriceContainer}>
                        <Text style={styles.itemPrice}>
                          {item.price}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Restore Purchases */}
        <View style={styles.restoreSection}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.restoreNote}>
            Already purchased? Tap here to restore your previous purchases.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All purchases are processed securely through your app store account.
          </Text>
        </View>
      </ScrollView>

      {/* GM Subscription Modal */}
      <DMSubscriptionModal
        isVisible={showDMModal}
        onClose={() => setShowDMModal(false)}
      />

      {/* Adventurer Pack Modal */}
      <AdventurerPackModal
        isVisible={showAdventurerModal}
        onClose={() => setShowAdventurerModal(false)}
      />
    </SafeAreaView>
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
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  subscriptionsSection: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  premiumCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  premiumLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  premiumImage: {
    width: 48,
    height: 48,
  },
  premiumInfo: {
    flex: 1,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  premiumTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  premiumDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    lineHeight: 18,
  },
  premiumPriceContainer: {
    alignItems: 'flex-end',
  },
  premiumPrice: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
  },
  premiumPeriod: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    marginTop: 2,
  },
  itemsSection: {
    padding: 16,
    paddingTop: 8,
  },
  itemsGrid: {
    gap: 12,
  },
  shopItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1 }],
  },
  shopItemLoading: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  itemImage: {
    width: 40,
    height: 40,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    lineHeight: 18,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemPriceContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  itemPrice: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
  },
  itemLoadingContainer: {
    width: 56,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoreSection: {
    padding: 16,
    alignItems: 'center',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginBottom: 8,
  },
  restoreButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
  },
  restoreNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    maxWidth: 280,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 16,
  },
});