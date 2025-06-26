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
import { ArrowLeft, ShoppingCart, Crown, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCustomAlert } from '../components/CustomAlert';
import DMSubscriptionModal from '../components/DMSubscriptionModal';
import AdventurerPackModal from '../components/AdventurerPackModal';
import { PurchaseManager, purchaseManager, PRODUCT_IDS } from '../utils/purchaseManager';
import Purchases from 'react-native-purchases';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/authAtoms';
import { fetchUserCapabilitiesAtom, userCapabilitiesAtom } from '../atoms/userCapabilitiesAtoms';
import ScrollSelectionModal from '../components/ScrollSelectionModal';
import RevenueCatPaywall from '../components/RevenueCatPaywall';
import { usePaywall } from '../hooks/usePaywall';

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
  const [showScrollModal, setShowScrollModal] = useState(false);
  const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { showAlert } = useCustomAlert();
  const [user] = useAtom(userAtom);
  const [, fetchCapabilities] = useAtom(fetchUserCapabilitiesAtom);
  const [userCapabilities] = useAtom(userCapabilitiesAtom);
  const { isPaywallVisible, showPaywall, hidePaywall, currentOffering } = usePaywall();

  // Load capabilities when component mounts
  useEffect(() => {
    const loadCapabilities = async () => {
      console.log('🛍️ ShopScreen: Starting loadCapabilities');
      
      if (user?.id) {
        try {
          console.log('🛍️ ShopScreen: Fetching user capabilities...');
          await fetchCapabilities();
          console.log('🛍️ ShopScreen: Capabilities fetched successfully');
          
          // Initialize RevenueCat with validation
          console.log('🛍️ ShopScreen: Initializing RevenueCat for user:', user.id);
          await purchaseManager.initialize(user.id);
          console.log('🛍️ ShopScreen: RevenueCat initialization completed');
          
          // Reset retry counter on successful connection
          setRetryCount(0);
        } catch (error) {
          console.error('❌ ShopScreen: Failed to load capabilities or initialize RevenueCat:', error);
          console.error('❌ ShopScreen: Error type:', typeof error);
          console.error('❌ ShopScreen: Error message:', error instanceof Error ? error.message : String(error));
          
          // Auto-retry connection on failure (max 3 attempts)
          if (retryCount < 3) {
            const nextRetry = retryCount + 1;
            console.log(`🔄 Connection failed, auto-retrying in 2 seconds... (attempt ${nextRetry}/3)`);
            setRetryCount(nextRetry);
            
            setTimeout(() => {
              console.log(`🔄 Starting auto-retry attempt ${nextRetry}`);
              setCapabilitiesLoaded(false);
              loadWithTimeout();
            }, 2000);
          } else {
            console.log('❌ Max retry attempts reached, giving up');
            showAlert(
              'Connection Failed', 
              'Could not connect to purchase services after multiple attempts. Some features may not work properly.',
              [{ text: 'OK' }],
              'error'
            );
          }
        } finally {
          console.log('🛍️ ShopScreen: Setting capabilities loaded to true');
          setCapabilitiesLoaded(true);
        }
      } else {
        console.log('🛍️ ShopScreen: No user ID available, skipping RevenueCat initialization');
        setCapabilitiesLoaded(true);
      }
    };

    // Add timeout to prevent infinite loading
    const loadWithTimeout = () => {
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ ShopScreen: Loading timeout - forcing capabilities loaded');
        setCapabilitiesLoaded(true);
      }, 15000); // 15 second timeout

      loadCapabilities().finally(() => {
        clearTimeout(timeoutId);
      });
    };

    loadWithTimeout();
  }, [user?.id, fetchCapabilities, showAlert]);

  // Debug: Log capabilities changes
  useEffect(() => {
    console.log('ShopScreen: User capabilities updated:', userCapabilities);
  }, [userCapabilities]);

  const shopItems: ShopItem[] = [
    {
      id: 'remove_ads',
      title: 'Remove Ads',
      description: 'Enjoy uninterrupted gameplay without advertisements',
      price: '$1.99',
      image: require('../../assets/images/noAds.png'),
      type: 'one_time',
      revenueCatId: PRODUCT_IDS.REMOVE_ADS,
    },
    {
      id: 'character_limit',
      title: 'Character Limit +3',
      description: 'Create 3 additional characters for your adventures',
      price: '$1.99',
      image: require('../../assets/images/increaseCharacters.png'),
      type: 'one_time',
      revenueCatId: PRODUCT_IDS.INCREASE_CHARACTERS,
    },
    {
      id: 'campaign_limit',
      title: 'Campaign Limit +3',
      description: 'Host and/or Join 3 additional campaigns',
      price: '$1.99',
      image: require('../../assets/images/increaseCampaigns.png'),
      type: 'one_time',
      revenueCatId: PRODUCT_IDS.INCREASE_CAMPAIGNS,
    },
    {
      id: 'all_adventures',
      title: 'Access All Adventures',
      description: 'Unlock all premium adventure modules and content',
      price: '$4.99',
      image: require('../../assets/images/allAdventures.png'),
      type: 'one_time',
      revenueCatId: PRODUCT_IDS.ACCESS_ALL_ADVENTURES,
    },
  ];
  /*
  DM prod340862bac9
  AP prod8b4bd9634c
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
      revenueCatId: PRODUCT_IDS.SCROLL_OF_REBIRTH,
    },
  */

  // Check if an item is purchased
  const isItemPurchased = (itemId: string): boolean => {
    console.log(`ShopScreen: Checking if ${itemId} is purchased. adsRemoved:`, userCapabilities.adsRemoved);
    
    switch (itemId) {
      case 'remove_ads':
        return userCapabilities.adsRemoved;
      case 'all_adventures':
        return userCapabilities.allAdventuresUnlocked;
      case 'group_size':
        // Group size can be purchased twice, so check if at max (7 players)
        return userCapabilities.groupSizeLimit >= 5;
      case 'character_limit':
        // Character limit purchases are stackable, so we don't mark as "purchased"
        return false;
      case 'campaign_limit':
        // Campaign limit purchases are stackable, so we don't mark as "purchased"
        return false;
      case 'scroll_rebirth':
        // Scrolls are consumable, so never mark as "purchased"
        return false;
      default:
        return false;
    }
  };

  // Get purchase status text
  const getPurchaseStatusText = (itemId: string): string => {
    if (isItemPurchased(itemId)) {
      return 'Purchased';
    }
    return '';
  };

  const handleBack = () => {
    router.back();
  };

  const handlePurchase = async (productId: string) => {
    console.log('🛍️ SHOP PURCHASE INITIATED');
    console.log('🛍️ Product ID:', productId);
    console.log('🛍️ User ID:', user?.id);
    console.log('🛍️ User email:', user?.email);
    console.log('🛍️ Timestamp:', new Date().toISOString());
    
    if (!user?.id) {
      console.error('❌ SHOP PURCHASE FAILED: No user ID');
      showAlert('Authentication Error', 'Please log in to make purchases.', [{ text: 'OK' }], 'error');
      return;
    }

    setLoadingItemId(productId);
    console.log('🛍️ Loading state set for product:', productId);

    try {
      console.log('🛍️ Calling purchaseManager.purchaseProductDirect...');
      const result = await purchaseManager.purchaseProductDirect(productId);
      console.log('🛍️ Purchase result received:', {
        success: result.success,
        error: result.error,
        hasCustomerInfo: !!result.customerInfo
      });
      
      if (result.success) {
        console.log('✅ SHOP PURCHASE SUCCESS');
        console.log('✅ Customer info:', result.customerInfo ? {
          originalAppUserId: result.customerInfo.originalAppUserId,
          activeEntitlements: Object.keys(result.customerInfo.entitlements.active)
        } : 'No customer info');
        
        showAlert('Purchase Successful!', 'Your purchase has been completed.', [{ text: 'OK' }], 'success');
        
        console.log('🛍️ Refreshing capabilities...');
        await fetchCapabilities();
        console.log('🛍️ Capabilities refreshed');
      } else {
        console.log('❌ SHOP PURCHASE FAILED');
        console.log('❌ Error message:', result.error);
        
        if (result.error !== 'Purchase cancelled by user') {
          showAlert('Purchase Failed', result.error || 'Something went wrong. Please try again.', [
            { text: 'OK' },
            ...((__DEV__ && result.error) ? [{
              text: 'Copy Error',
              onPress: () => {
                // In development, allow copying the error for debugging
                console.log('📋 Error copied to console for debugging:', result.error);
              }
            }] : [])
          ], 'error');
        } else {
          console.log('ℹ️ Purchase was cancelled by user');
        }
      }
    } catch (error) {
      console.error('❌ SHOP PURCHASE EXCEPTION');
      console.error('❌ Exception details:', error);
      console.error('❌ Exception type:', typeof error);
      console.error('❌ Exception constructor:', error?.constructor?.name);
      
      if (error && typeof error === 'object') {
        console.error('❌ Exception properties:', Object.getOwnPropertyNames(error));
      }
      
      showAlert('Purchase Failed', 'Something went wrong. Please try again.', [
        { text: 'OK' },
        ...(__DEV__ ? [{
          text: 'Show Debug Info',
          onPress: () => {
            console.log('🐛 DEBUG INFO FOR PURCHASE FAILURE:');
            console.log('🐛 Product ID:', productId);
            console.log('🐛 User:', { id: user?.id, email: user?.email });
            console.log('🐛 Error:', error);
            console.log('🐛 PurchaseManager initialized:', purchaseManager.isBillingSupported());
            console.log('🐛 Timestamp:', new Date().toISOString());
          }
        }] : [])
      ], 'error');
    } finally {
      console.log('🛍️ Clearing loading state');
      setLoadingItemId(null);
    }
  };

  const handleRestorePurchases = async () => {
    if (!user?.id) {
      showAlert('Authentication Error', 'Please log in to restore purchases.', [{ text: 'OK' }], 'error');
      return;
    }

    setIsLoading(true);

    try {
      const result = await purchaseManager.restorePurchases();
      
      if (result.success) {
        showAlert('Purchases Restored!', 'Your previous purchases have been restored.', [{ text: 'OK' }], 'success');
        // Refresh capabilities to reflect restored purchases
        await fetchCapabilities();
      } else {
        showAlert('Restore Failed', result.error || 'No purchases found to restore.', [{ text: 'OK' }], 'error');
      }
    } catch (error) {
      console.error('Restore error:', error);
      showAlert('Restore Failed', 'Something went wrong. Please try again.', [{ text: 'OK' }], 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestOfferings = async () => {
    try {
      const offerings = await purchaseManager.getOfferings();
      console.log('=== 🔍 COMPLETE OFFERINGS ANALYSIS ===');
      console.log('🔍 Found offerings:', offerings.length);
      
      // Log all available products
      const allAvailableProducts: string[] = [];
      offerings.forEach((offering, index) => {
        console.log(`🔍 Offering ${index + 1}: "${offering.identifier}"`);
        console.log(`🔍   Packages: ${offering.availablePackages.length}`);
        offering.availablePackages.forEach((pkg, pkgIndex) => {
          const productId = pkg.product.identifier;
          allAvailableProducts.push(productId);
          console.log(`🔍   Package ${pkgIndex + 1}:`, {
            packageId: pkg.identifier,
            productId: productId,
            price: pkg.product.priceString,
            title: pkg.product.title
          });
        });
      });
      
      console.log('🔍 ALL AVAILABLE PRODUCT IDS:', allAvailableProducts);
      
      // Compare with expected product IDs
      console.log('🔍 EXPECTED PRODUCT IDS:');
      Object.entries(PRODUCT_IDS).forEach(([key, value]) => {
        const isAvailable = allAvailableProducts.includes(value);
        console.log(`🔍   ${key}: ${value} - ${isAvailable ? '✅ AVAILABLE' : '❌ MISSING'}`);
      });
      
      console.log('🔍 SHOP ITEMS MAPPING:');
      shopItems.forEach(item => {
        const revenueCatId = item.revenueCatId || item.id;
        const isAvailable = allAvailableProducts.includes(revenueCatId);
        console.log(`🔍   ${item.title}: ${revenueCatId} - ${isAvailable ? '✅ AVAILABLE' : '❌ MISSING'}`);
      });
      
      console.log('=== 🔍 END OFFERINGS ANALYSIS ===');
      
      // Create detailed alert message
      const missingProducts = Object.entries(PRODUCT_IDS).filter(([, value]) => 
        !allAvailableProducts.includes(value)
      );
      
      const alertMessage = `Found ${offerings.length} offerings with ${allAvailableProducts.length} products.\n\n` +
        `Missing products: ${missingProducts.length}\n` +
        (missingProducts.length > 0 ? 
          missingProducts.map(([key, value]) => `• ${key}: ${value}`).join('\n') : 
          'All products available!'
        );
      
      showAlert(
        'Offerings Analysis', 
        alertMessage,
        [{ text: 'OK' }],
        missingProducts.length > 0 ? 'warning' : 'success'
      );
    } catch (error) {
      console.error('Offerings test error:', error);
      showAlert('Offerings Test Failed', 'Could not load offerings. Check console.', [{ text: 'OK' }], 'error');
    }
  };

  const handleSystemDebug = async () => {
    console.log('🔍 SYSTEM DEBUG INFO');
    console.log('🔍 Platform:', Platform.OS);
    console.log('🔍 User:', { id: user?.id, email: user?.email });
    console.log('🔍 PurchaseManager billing supported:', purchaseManager.isBillingSupported());
    
    try {
      const customerInfo = await purchaseManager.getCustomerInfo();
      console.log('🔍 Customer Info:', customerInfo ? {
        originalAppUserId: customerInfo.originalAppUserId,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        allPurchaseDates: Object.keys(customerInfo.allPurchaseDates)
      } : 'null');
    } catch (error) {
      console.log('🔍 Customer Info Error:', error);
    }
    
    try {
      const offerings = await purchaseManager.getOfferings();
      console.log('🔍 Offerings count:', offerings.length);
      console.log('🔍 Available products:', offerings.flatMap(o => 
        o.availablePackages.map(p => p.product.identifier)
      ));
    } catch (error) {
      console.log('🔍 Offerings Error:', error);
    }

    // Test individual product IDs
    console.log('🔍 TESTING INDIVIDUAL PRODUCT IDS:');
    const productIds = Object.values(PRODUCT_IDS);
    
    for (const productId of productIds) {
      try {
        console.log(`🔍 Testing product: ${productId}`);
        const products = await Purchases.getProducts([productId]);
        if (products.length > 0) {
          console.log(`✅ ${productId}: FOUND - Price: ${products[0].priceString}`);
        } else {
          console.log(`❌ ${productId}: NOT FOUND`);
        }
      } catch (error) {
        console.log(`❌ ${productId}: ERROR -`, error);
      }
    }
    
    console.log('🔍 User Capabilities:', userCapabilities);
    console.log('🔍 Timestamp:', new Date().toISOString());
    
    showAlert(
      'Debug Info Logged',
      'System debug information has been logged to console. Check your development tools.',
      [{ text: 'OK' }],
      'info'
    );
  };

  const handleScrollModalSuccess = () => {
    // Refresh capabilities after scroll is assigned
    fetchCapabilities();
  };

  const displayAdventurersPack = false;
  const displayScroll = false;

  // Show loading while capabilities are being fetched
  if (!capabilitiesLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading shop...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The Goblin&apos;s Market</Text>
        <View style={styles.headerRight}>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Featured Subscriptions */}
        <View style={styles.subscriptionsSection}>
          {/* GM Subscription */}
          <TouchableOpacity
            style={styles.premiumCard}
            onPress={() => showPaywall()}
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
                    <Text style={styles.premiumTitle}>Ultimate Host</Text>
                  </View>
                  <Text style={styles.premiumDescription}>
                    Make the most of your campaigns for you and your players!
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
          {displayAdventurersPack && (
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
          )}
        </View>

        {/* Shop Items */}
        <View style={styles.itemsSection}>
          <View style={styles.divider} />
          
          <View style={styles.itemsGrid}>
            {shopItems.map((item) => {
              const isPurchased = isItemPurchased(item.id);
              const statusText = getPurchaseStatusText(item.id);
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.shopItem, 
                    loadingItemId === item.id && styles.shopItemLoading,
                    isPurchased && styles.shopItemPurchased
                  ]}
                  onPress={() => handlePurchase(item.revenueCatId || item.id)}
                                      disabled={loadingItemId === (item.revenueCatId || item.id) || isPurchased}
                  activeOpacity={isPurchased ? 1 : 0.8}
                >
                  {/* Content */}
                  <View style={styles.itemContent}>
                    <View style={styles.itemLeft}>
                      <View style={styles.itemImageContainer}>
                        <Image 
                          source={item.image} 
                          style={[styles.itemImage, isPurchased && styles.itemImagePurchased]}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemTitle, isPurchased && styles.itemTitlePurchased]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.itemDescription, isPurchased && styles.itemDescriptionPurchased]}>
                          {item.description}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.itemRight}>
                      {loadingItemId === (item.revenueCatId || item.id) ? (
                        <View style={styles.itemLoadingContainer}>
                          <ActivityIndicator size="small" color="#4CAF50" />
                        </View>
                      ) : isPurchased ? (
                        <View style={styles.purchasedContainer}>
                          <Check size={16} color="#4CAF50" />
                          <Text style={styles.purchasedText}>Purchased</Text>
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
              );
            })}
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
          
          {false && (
            <TouchableOpacity
              style={[styles.restoreButton, { backgroundColor: '#4CAF50', marginTop: 10 }]}
              onPress={async () => {
                console.log('🔄 Manual connection refresh triggered');
                setCapabilitiesLoaded(false);
                
                // Recreate the loadWithTimeout logic
                const timeoutId = setTimeout(() => {
                  console.warn('⚠️ ShopScreen: Manual refresh timeout - forcing capabilities loaded');
                  setCapabilitiesLoaded(true);
                }, 15000);

                try {
                  if (user?.id) {
                    await fetchCapabilities();
                    await purchaseManager.initialize(user.id);
                  }
                } catch (error) {
                  console.error('❌ Manual refresh failed:', error);
                } finally {
                  clearTimeout(timeoutId);
                  setCapabilitiesLoaded(true);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.restoreButtonText}>Refresh Connection</Text>
            </TouchableOpacity>
          )}
          
          {__DEV__ && false && (
            <>
              <TouchableOpacity
                style={[styles.restoreButton, { backgroundColor: '#2196F3', marginTop: 10 }]}
                onPress={handleTestOfferings}
                activeOpacity={0.7}
              >
                <Text style={styles.restoreButtonText}>Test Offerings (Dev)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.restoreButton, { backgroundColor: '#FF9800', marginTop: 10 }]}
                onPress={handleSystemDebug}
                activeOpacity={0.7}
              >
                <Text style={styles.restoreButtonText}>System Debug (Dev)</Text>
              </TouchableOpacity>
            </>
          )}
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

      {/* Scroll Selection Modal */}
      <ScrollSelectionModal
        isVisible={showScrollModal}
        onClose={() => setShowScrollModal(false)}
        onSuccess={handleScrollModalSuccess}
      />

      {/* RevenueCat Paywall */}
      <RevenueCatPaywall
        visible={isPaywallVisible}
        onClose={hidePaywall}
        offering={currentOffering}
        onPurchaseSuccess={() => {
          console.log('Purchase successful from RevenueCat paywall');
          // Refresh capabilities will be handled by the paywall component
        }}
        onPurchaseError={(error) => {
          console.error('Purchase failed from RevenueCat paywall:', error);
        }}
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
    paddingRight: 2,
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
    transform: [{ scale: 1 }],
  },
  shopItemLoading: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  shopItemPurchased: {
    opacity: 0.5,
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
  itemImagePurchased: {
    opacity: 0.5,
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
  itemTitlePurchased: {
    opacity: 0.5,
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    lineHeight: 18,
  },
  itemDescriptionPurchased: {
    opacity: 0.5,
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
  purchasedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  purchasedText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginTop: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#2f2f2f',
    marginBottom: 24
  }
});