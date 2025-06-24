import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesError,
  PURCHASES_ERROR_CODE
} from 'react-native-purchases';
import { supabase } from '../config/supabase';

// RevenueCat Product IDs - Update these with your actual product IDs from RevenueCat
export const PRODUCT_IDS = {
  REMOVE_ADS: 'prod2355afb536',
  INCREASE_CHARACTERS: 'proded7232c986',
  INCREASE_CAMPAIGNS: 'prod99b2b546bd',
  ACCESS_ALL_ADVENTURES: 'prod100afcaa33',
  GROUP_SIZE: 'group_size',
  SCROLL_OF_REBIRTH: 'prod35985e127b',
  DM_SUBSCRIPTION: 'prod340862bac9',
  ADVENTURERS_PACK: 'prod8b4bd9634c'
};

export class PurchaseManager {
  private static instance: PurchaseManager;
  private isInitialized = false;

  static getInstance(): PurchaseManager {
    if (!PurchaseManager.instance) {
      PurchaseManager.instance = new PurchaseManager();
    }
    return PurchaseManager.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;
    
    // Validate userId to prevent nil object crashes
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('Invalid userId provided to RevenueCat initialization:', userId);
      throw new Error('Invalid user ID for RevenueCat initialization');
    }

    try {
      // Configure RevenueCat with your API key
      // TODO: Replace with your actual RevenueCat API key from:
      // 1. Go to https://app.revenuecat.com/
      // 2. Navigate to your app
      // 3. Go to API Keys section
      // 4. Copy the "Apple App Store" key for iOS or "Google Play Store" key for Android
      // 5. For cross-platform, you can use the same key or platform-specific keys
      
      console.log('Initializing RevenueCat with userId:', userId);
      
      await Purchases.configure({ 
        apiKey: 'appl_cYcpLzydnEgWmanyfsJYAFySCyk', // Replace with actual key
        appUserID: userId.trim() 
      });

      console.log('RevenueCat initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      // Don't throw the error to prevent app crashes, just log it
      // throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    try {
      const offerings = await Purchases.getOfferings();
      
      // Debug: Log all available offerings and products
      console.log('=== RevenueCat Debug Info ===');
      console.log('Current offering:', offerings.current?.identifier);
      console.log('All offerings:', Object.keys(offerings.all));
      
      Object.values(offerings.all).forEach(offering => {
        console.log(`Offering "${offering.identifier}" packages:`, 
          offering.availablePackages.map(pkg => ({
            identifier: pkg.identifier,
            productId: pkg.product.identifier,
            price: pkg.product.priceString
          }))
        );
      });
      console.log('Looking for product:', productId);
      console.log('============================');
      
      let packageToPurchase: PurchasesPackage | null = null;

      // Find the package for the product ID
      for (const offering of Object.values(offerings.all)) {
        const foundPackage = offering.availablePackages.find(pkg => 
          pkg.product.identifier === productId
        );
        if (foundPackage) {
          packageToPurchase = foundPackage;
          console.log('Found package:', foundPackage.identifier, 'in offering:', offering.identifier);
          break;
        }
      }

      if (!packageToPurchase) {
        throw new Error(`Product ${productId} not found in offerings`);
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Update database with purchase
      await this.updateDatabaseAfterPurchase(productId, customerInfo);

      return { success: true, customerInfo };
    } catch (error) {
      console.error('Purchase failed:', error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        if ((error as any).code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          return { success: false, error: 'Purchase cancelled by user' };
        }
        return { success: false, error: (error as any).message || 'Purchase failed' };
      }
      
      return { success: false, error: 'Purchase failed' };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      // Update database with restored purchases
      await this.syncPurchasesWithDatabase(customerInfo);
      
      return { success: true, customerInfo };
    } catch (error) {
      console.error('Restore purchases failed:', error);
      return { success: false, error: 'Failed to restore purchases' };
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  private async updateDatabaseAfterPurchase(productId: string, customerInfo: CustomerInfo): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Record the purchase transaction
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    const latestTransaction = Object.values(customerInfo.allPurchaseDates)[0];

    await supabase.from('purchases').insert({
      user_id: user.id,
      product_id: productId,
      transaction_id: latestTransaction || new Date().toISOString(),
      purchase_date: new Date().toISOString(),
      is_active: true
    });

    // Update user capabilities based on purchase
    await this.updateUserCapabilities(productId, user.id);

    console.log(`Purchase recorded: ${productId}`);
  }

  private async syncPurchasesWithDatabase(customerInfo: CustomerInfo): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get active entitlements
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    
    // Update user profile based on active entitlements
    for (const entitlement of activeEntitlements) {
      await this.updateUserCapabilities(entitlement, user.id);
    }

    console.log('Purchases synced with database');
  }

  private async updateUserCapabilities(productId: string, userId: string): Promise<void> {
    const updates: any = {};

    switch (productId) {
      case PRODUCT_IDS.REMOVE_ADS:
        updates.ads_removed = true;
        break;
      
      case PRODUCT_IDS.ACCESS_ALL_ADVENTURES:
        updates.all_adventures_unlocked = true;
        break;
      
      case PRODUCT_IDS.INCREASE_CHARACTERS:
        // Increment character limit
        const { data: profile } = await supabase
          .from('profiles')
          .select('character_limit_purchases')
          .eq('id', userId)
          .single();
        
        updates.character_limit_purchases = (profile?.character_limit_purchases || 0) + 1;
        break;
      
      case PRODUCT_IDS.INCREASE_CAMPAIGNS:
        // Increment campaign limit
        const { data: campaignProfile } = await supabase
          .from('profiles')
          .select('campaign_limit_purchases')
          .eq('id', userId)
          .single();
        
        updates.campaign_limit_purchases = (campaignProfile?.campaign_limit_purchases || 0) + 1;
        break;
      
      case PRODUCT_IDS.GROUP_SIZE:
        // Increment group size purchases
        const { data: groupProfile } = await supabase
          .from('profiles')
          .select('group_size_purchases')
          .eq('id', userId)
          .single();
        
        updates.group_size_purchases = (groupProfile?.group_size_purchases || 0) + 1;
        break;
      
      case PRODUCT_IDS.SCROLL_OF_REBIRTH:
        // Add scroll to inventory
        await supabase.from('user_inventory').upsert({
          user_id: userId,
          item_type: 'scroll_of_rebirth',
          quantity: 1
        }, {
          onConflict: 'user_id,item_type',
          ignoreDuplicates: false
        });
        return; // Don't update profile for consumables
      
      case PRODUCT_IDS.DM_SUBSCRIPTION:
        updates.dm_subscription_active = true;
        updates.dm_subscription_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
        break;
      
      case PRODUCT_IDS.ADVENTURERS_PACK:
        updates.adventurers_pack_active = true;
        updates.adventurers_pack_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
        break;
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    }
  }

  // Helper method to check if user has specific entitlement
  async hasEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo?.entitlements.active[entitlementId] !== undefined;
    } catch (error) {
      console.error('Failed to check entitlement:', error);
      return false;
    }
  }

  // Helper method to get all active entitlements
  async getActiveEntitlements(): Promise<string[]> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return Object.keys(customerInfo?.entitlements.active || {});
    } catch (error) {
      console.error('Failed to get active entitlements:', error);
      return [];
    }
  }

  // Helper method to check if ads should be hidden
  async shouldHideAds(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;

      const activeEntitlements = customerInfo.entitlements.active;
      
      // Check for remove ads purchase
      if (activeEntitlements[PRODUCT_IDS.REMOVE_ADS]) {
        return true;
      }
      
      // Check for Adventurers Pack subscription
      if (activeEntitlements[PRODUCT_IDS.ADVENTURERS_PACK]) {
        return true;
      }
      
      // Check for DM/Ultimate Host subscription
      if (activeEntitlements[PRODUCT_IDS.DM_SUBSCRIPTION]) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check if ads should be hidden:', error);
      return false; // Show ads if we can't determine purchase status
    }
  }
}

// Export singleton instance
export const purchaseManager = PurchaseManager.getInstance(); 