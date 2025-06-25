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
  private isBillingAvailable = true;

  static getInstance(): PurchaseManager {
    if (!PurchaseManager.instance) {
      PurchaseManager.instance = new PurchaseManager();
    }
    return PurchaseManager.instance;
  }

  isBillingSupported(): boolean {
    return this.isInitialized && this.isBillingAvailable;
  }

  async initialize(userId: string): Promise<void> {
    console.log('🔧 REVENUECAT INITIALIZATION STARTED');
    console.log('🔧 User ID:', userId);
    console.log('🔧 Already initialized:', this.isInitialized);
    console.log('🔧 Billing available:', this.isBillingAvailable);
    
    if (this.isInitialized) {
      console.log('🔧 Already initialized, skipping');
      return;
    }
    
    // Validate userId to prevent nil object crashes
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('❌ Invalid userId provided to RevenueCat initialization:', userId);
      console.error('❌ UserId type:', typeof userId);
      console.error('❌ UserId length:', userId?.length);
      throw new Error('Invalid user ID for RevenueCat initialization');
    }

    try {
      console.log('🔧 Step 1: Configuring RevenueCat...');
      console.log('🔧 API Key (first 10 chars):', 'appl_cYcpL...');
      console.log('🔧 Trimmed User ID:', userId.trim());
      
      await Purchases.configure({ 
        apiKey: 'appl_cYcpLzydnEgWmanyfsJYAFySCyk', // Replace with actual key
        appUserID: userId.trim() 
      });

      console.log('🔧 Step 2: Testing basic functionality...');
      
      // Test basic functionality
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        console.log('🔧 Step 2 SUCCESS: Got customer info:', {
          originalAppUserId: customerInfo.originalAppUserId,
          activeEntitlements: Object.keys(customerInfo.entitlements.active).length
        });
      } catch (testError) {
        console.warn('🔧 Step 2 WARNING: Could not get customer info:', testError);
      }

      console.log('✅ REVENUECAT INITIALIZED SUCCESSFULLY');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ REVENUECAT INITIALIZATION FAILED');
      console.error('❌ Full error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error constructor:', error?.constructor?.name);
      
      // Handle specific billing unavailable error gracefully
      if (error && typeof error === 'object' && 'code' in error) {
        const purchaseError = error as PurchasesError;
        console.error('❌ Error code:', purchaseError.code);
        console.error('❌ Error message:', purchaseError.message);
        
        if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR ||
            purchaseError.code === PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
          console.warn('⚠️  BILLING NOT AVAILABLE: Likely emulator or missing Google Play Services');
          console.warn('⚠️  In-app purchases will be disabled');
          // Set flags to indicate billing is not available
          this.isInitialized = false;
          this.isBillingAvailable = false;
          return; // Don't throw error, just gracefully handle
        }
      }
      
      // For other errors, don't throw to prevent app crashes, just log
      console.warn('🔔 REVENUECAT INITIALIZATION FAILED - In-app purchases will be disabled');
      console.warn('🔔 This might be normal in development/testing environments');
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    if (!this.isBillingSupported()) {
      console.log('Billing not supported, returning empty offerings');
      return [];
    }

    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    console.log('🛒 PURCHASE ATTEMPT STARTED');
    console.log('🛒 Product ID:', productId);
    console.log('🛒 Billing supported:', this.isBillingSupported());
    console.log('🛒 RevenueCat initialized:', this.isInitialized);
    console.log('🛒 Timestamp:', new Date().toISOString());
    
    if (!this.isBillingSupported()) {
      console.log('❌ PURCHASE FAILED: Billing not supported');
      return { success: false, error: 'In-app purchases are not available on this device' };
    }

    try {
      console.log('🛒 Step 1: Getting offerings...');
      const offerings = await Purchases.getOfferings();
      console.log('🛒 Step 1 SUCCESS: Got offerings');
      
      // Debug: Log all available offerings and products
      console.log('=== 🛒 DETAILED PURCHASE DEBUG INFO ===');
      console.log('🛒 Current offering:', offerings.current?.identifier);
      console.log('🛒 All offerings count:', Object.keys(offerings.all).length);
      console.log('🛒 All offering IDs:', Object.keys(offerings.all));
      
      Object.values(offerings.all).forEach((offering, index) => {
        console.log(`🛒 Offering ${index + 1}: "${offering.identifier}"`);
        console.log(`🛒   - Packages count: ${offering.availablePackages.length}`);
        offering.availablePackages.forEach((pkg, pkgIndex) => {
          console.log(`🛒   - Package ${pkgIndex + 1}:`, {
            identifier: pkg.identifier,
            productId: pkg.product.identifier,
            price: pkg.product.priceString,
            title: pkg.product.title,
            description: pkg.product.description
          });
        });
      });
      console.log('🛒 Looking for product:', productId);
      console.log('=== 🛒 END DETAILED DEBUG INFO ===');
      
      console.log('🛒 Step 2: Finding package for product...');
      let packageToPurchase: PurchasesPackage | null = null;

      // Find the package for the product ID
      for (const offering of Object.values(offerings.all)) {
        const foundPackage = offering.availablePackages.find(pkg => 
          pkg.product.identifier === productId
        );
        if (foundPackage) {
          packageToPurchase = foundPackage;
          console.log('🛒 Step 2 SUCCESS: Found package:', foundPackage.identifier, 'in offering:', offering.identifier);
          console.log('🛒 Package details:', {
            packageId: foundPackage.identifier,
            productId: foundPackage.product.identifier,
            price: foundPackage.product.priceString,
            title: foundPackage.product.title
          });
          break;
        }
      }

      if (!packageToPurchase) {
        console.log('❌ PURCHASE FAILED: Product not found in offerings');
        console.log('❌ Available products:', Object.values(offerings.all).flatMap(o => 
          o.availablePackages.map(p => p.product.identifier)
        ));
        throw new Error(`Product ${productId} not found in offerings`);
      }

      console.log('🛒 Step 3: Initiating purchase...');
      console.log('🛒 About to purchase package:', packageToPurchase.identifier);
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('🛒 Step 3 SUCCESS: Purchase completed');
      console.log('🛒 Customer info received:', {
        originalAppUserId: customerInfo.originalAppUserId,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        allPurchaseDates: Object.keys(customerInfo.allPurchaseDates)
      });
      
      console.log('🛒 Step 4: Updating database...');
      await this.updateDatabaseAfterPurchase(productId, customerInfo);
      console.log('🛒 Step 4 SUCCESS: Database updated');

      console.log('✅ PURCHASE COMPLETED SUCCESSFULLY');
      return { success: true, customerInfo };
    } catch (error) {
      console.log('❌ PURCHASE FAILED WITH EXCEPTION');
      console.error('❌ Full error object:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error constructor:', error?.constructor?.name);
      
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        console.error('❌ Error properties:', {
          code: errorObj.code,
          message: errorObj.message,
          domain: errorObj.domain,
          userInfo: errorObj.userInfo,
          underlyingErrorMessage: errorObj.underlyingErrorMessage
        });
        
        // Log all enumerable properties
        console.error('❌ All error properties:', Object.getOwnPropertyNames(errorObj));
        
        if ('code' in errorObj) {
          console.error('❌ Error code details:', {
            code: errorObj.code,
            codeType: typeof errorObj.code,
            isPurchaseCancelled: errorObj.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
            allErrorCodes: Object.values(PURCHASES_ERROR_CODE)
          });
          
          if (errorObj.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
            console.log('ℹ️  Purchase was cancelled by user');
            return { success: false, error: 'Purchase cancelled by user' };
          }
          
          return { success: false, error: errorObj.message || `Purchase failed with code: ${errorObj.code}` };
        }
      }
      
      console.error('❌ Returning generic error');
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
      // Don't check if not initialized
      if (!this.isInitialized) {
        console.log('RevenueCat not initialized, showing ads by default');
        return false;
      }

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