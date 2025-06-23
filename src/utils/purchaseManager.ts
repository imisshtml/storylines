// Mock PurchaseManager for Expo Go compatibility
// This replaces the RevenueCat functionality

import { supabase } from '../config/supabase';

// Mock types to replace RevenueCat types
export interface MockCustomerInfo {
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate: string | null;
}

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

// Mock Product IDs - same as before but for reference
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

    try {
      console.log('[PurchaseManager] Mock initialization - purchases disabled for Expo Go');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PurchaseManager:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<MockOffering[]> {
    console.log('[PurchaseManager] Mock offerings - would return real offerings if native');
    
    // Return mock offerings for testing
    return [
      {
        identifier: 'default',
        availablePackages: [
          {
            identifier: 'remove_ads',
            product: {
              identifier: PRODUCT_IDS.REMOVE_ADS,
              priceString: '$1.99'
            }
          },
          {
            identifier: 'increase_characters',
            product: {
              identifier: PRODUCT_IDS.INCREASE_CHARACTERS,
              priceString: '$1.99'
            }
          }
        ]
      }
    ];
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; customerInfo?: MockCustomerInfo; error?: string }> {
    console.log('[PurchaseManager] Mock purchase for product:', productId);
    
    // In Expo Go, simulate a successful purchase for testing
    // In a real app, you'd want to handle this differently
    try {
      // Simulate the purchase process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockCustomerInfo: MockCustomerInfo = {
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: [productId],
        latestExpirationDate: null
      };

      // Update database with mock purchase (optional for testing)
      // await this.updateDatabaseAfterPurchase(productId, mockCustomerInfo);

      return { 
        success: true, 
        customerInfo: mockCustomerInfo 
      };
    } catch (error) {
      console.error('Mock purchase failed:', error);
      return { 
        success: false, 
        error: 'Mock purchase failed - this would work with native RevenueCat' 
      };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; customerInfo?: MockCustomerInfo; error?: string }> {
    console.log('[PurchaseManager] Mock restore purchases');
    
    try {
      const mockCustomerInfo: MockCustomerInfo = {
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: [],
        latestExpirationDate: null
      };

      return { success: true, customerInfo: mockCustomerInfo };
    } catch (error) {
      console.error('Mock restore failed:', error);
      return { success: false, error: 'Mock restore failed' };
    }
  }

  private async updateDatabaseAfterPurchase(productId: string, customerInfo: MockCustomerInfo): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Log the purchase
      await supabase.from('purchases').insert({
        user_id: user.id,
        product_id: productId,
        purchased_at: new Date().toISOString(),
        status: 'completed',
        revenue_cat_transaction_id: `mock_${Date.now()}`
      });

      // Update user capabilities
      await this.updateUserCapabilities(productId, user.id);
    } catch (error) {
      console.error('Error updating database after purchase:', error);
    }
  }

  private async syncPurchasesWithDatabase(customerInfo: MockCustomerInfo): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real implementation, you'd sync all purchases
      // For mock, we just log
      console.log('[PurchaseManager] Would sync purchases with database');
    } catch (error) {
      console.error('Error syncing purchases with database:', error);
    }
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
        const { data: profile } = await supabase
          .from('profiles')
          .select('character_limit_purchases')
          .eq('id', userId)
          .single();
        
        updates.character_limit_purchases = (profile?.character_limit_purchases || 0) + 1;
        break;
      
      case PRODUCT_IDS.INCREASE_CAMPAIGNS:
        const { data: campaignProfile } = await supabase
          .from('profiles')
          .select('campaign_limit_purchases')
          .eq('id', userId)
          .single();
        
        updates.campaign_limit_purchases = (campaignProfile?.campaign_limit_purchases || 0) + 1;
        break;
      
      case PRODUCT_IDS.GROUP_SIZE:
        const { data: groupProfile } = await supabase
          .from('profiles')
          .select('group_size_purchases')
          .eq('id', userId)
          .single();
        
        updates.group_size_purchases = (groupProfile?.group_size_purchases || 0) + 1;
        break;
      
      case PRODUCT_IDS.SCROLL_OF_REBIRTH:
        await supabase.from('user_inventory').upsert({
          user_id: userId,
          item_type: 'scroll_of_rebirth',
          quantity: 1
        }, {
          onConflict: 'user_id,item_type',
          ignoreDuplicates: false
        });
        return;
      
      case PRODUCT_IDS.DM_SUBSCRIPTION:
        updates.dm_subscription_active = true;
        updates.dm_subscription_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      
      case PRODUCT_IDS.ADVENTURERS_PACK:
        updates.adventurers_pack_active = true;
        updates.adventurers_pack_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    }
  }

  static async handlePurchaseSuccess(productId: string, userId: string): Promise<boolean> {
    console.log('[PurchaseManager] Mock handlePurchaseSuccess for:', productId);
    return true;
  }
}

// Export singleton instance
export const purchaseManager = PurchaseManager.getInstance(); 