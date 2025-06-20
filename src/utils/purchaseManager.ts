import { supabase } from '../config/supabase';

// TODO: Uncomment when RevenueCat is installed
// import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

interface PurchaseUpdate {
  userId: string;
  productId: string;
  quantity?: number;
  purchasedAt: string;
}

export class PurchaseManager {
  
  // Initialize RevenueCat with user ID
  static async initialize(userId: string) {
    try {
      // TODO: Implement RevenueCat initialization
      // await Purchases.logIn(userId);
      console.log('RevenueCat initialized for user:', userId);
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }

  // Handle successful purchase and update database
  static async handlePurchaseSuccess(productId: string, userId: string) {
    try {
      // Get customer info to verify purchase
      // TODO: Implement RevenueCat customer info check
      // const customerInfo = await Purchases.getCustomerInfo();
      
      // For now, simulate the purchase update
      await this.updateDatabaseForPurchase({
        userId,
        productId,
        purchasedAt: new Date().toISOString()
      });
      
      console.log('Purchase processed successfully:', productId);
      return true;
    } catch (error) {
      console.error('Failed to process purchase:', error);
      return false;
    }
  }

  // Update database based on purchase type
  static async updateDatabaseForPurchase({ userId, productId, purchasedAt }: PurchaseUpdate) {
    try {
      // First, log the purchase
      await this.logPurchase(userId, productId, purchasedAt);
      
      // Then update user capabilities based on product
      switch (productId) {
        case 'remove_ads':
          await this.updateUserProfile(userId, { ads_removed: true });
          break;
          
        case 'character_limit_2':
          await this.incrementUserLimit(userId, 'character_limit', 2);
          break;
          
        case 'campaign_limit_2':
          await this.incrementUserLimit(userId, 'campaign_limit', 2);
          break;
          
        case 'group_size_2':
          await this.incrementUserLimit(userId, 'group_size', 2);
          break;
          
        case 'all_adventures':
          await this.updateUserProfile(userId, { all_adventures_unlocked: true });
          break;
          
        case 'scroll_rebirth':
          await this.addToUserInventory(userId, 'scroll_rebirth', 1);
          break;
          
        case 'dm_subscription':
          await this.updateUserProfile(userId, { 
            dm_subscription_active: true,
            character_limit: 10,
            campaign_limit: 10,
            max_group_size: 7,
            all_adventures_unlocked: true,
            ads_removed: true
          });
          break;
          
        case 'adventurers_pack':
          await this.updateUserProfile(userId, { 
            adventurers_pack_active: true,
            ads_removed: true
          });
          await this.incrementUserLimit(userId, 'character_limit', 3);
          await this.incrementUserLimit(userId, 'campaign_limit', 3);
          break;
          
        default:
          console.warn('Unknown product ID:', productId);
      }
    } catch (error) {
      console.error('Database update failed:', error);
      throw error;
    }
  }

  // Log purchase in database
  static async logPurchase(userId: string, productId: string, purchasedAt: string) {
    const { error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: productId,
        purchased_at: purchasedAt,
        status: 'completed'
      });
      
    if (error) {
      console.error('Failed to log purchase:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Record<string, any>) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
      
    if (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  // Increment user limits
  static async incrementUserLimit(userId: string, limitType: string, increment: number) {
    // First get current value
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select(limitType)
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      console.error('Failed to fetch current limit:', fetchError);
      throw fetchError;
    }
    
    const currentValue = profile?.[limitType] || 0;
    const newValue = currentValue + increment;
    
    // Update with new value
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [limitType]: newValue })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Failed to increment user limit:', updateError);
      throw updateError;
    }
  }

  // Add items to user inventory
  static async addToUserInventory(userId: string, itemType: string, quantity: number) {
    // Check if item already exists
    const { data: existing, error: fetchError } = await supabase
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') { // Not found error is OK
      console.error('Failed to fetch inventory:', fetchError);
      throw fetchError;
    }
    
    if (existing) {
      // Update existing quantity
      const { error } = await supabase
        .from('user_inventory')
        .update({ quantity: existing.quantity + quantity })
        .eq('user_id', userId)
        .eq('item_type', itemType);
        
      if (error) throw error;
    } else {
      // Insert new item
      const { error } = await supabase
        .from('user_inventory')
        .insert({
          user_id: userId,
          item_type: itemType,
          quantity: quantity
        });
        
      if (error) throw error;
    }
  }

  // Get user's purchase history
  static async getUserPurchases(userId: string) {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });
      
    if (error) {
      console.error('Failed to fetch purchases:', error);
      return [];
    }
    
    return data || [];
  }

  // Check if user has specific purchase
  static async hasPurchase(userId: string, productId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('status', 'completed')
      .limit(1);
      
    if (error) {
      console.error('Failed to check purchase:', error);
      return false;
    }
    
    return (data?.length || 0) > 0;
  }

  // Restore purchases from RevenueCat
  static async restorePurchases(userId: string) {
    try {
      // TODO: Implement RevenueCat restore
      // const customerInfo = await Purchases.restorePurchases();
      // const activeEntitlements = customerInfo.entitlements.active;
      
      // For each active entitlement, update database
      // Object.keys(activeEntitlements).forEach(async (entitlementId) => {
      //   const entitlement = activeEntitlements[entitlementId];
      //   await this.updateDatabaseForPurchase({
      //     userId,
      //     productId: entitlement.productIdentifier,
      //     purchasedAt: entitlement.originalPurchaseDate
      //   });
      // });
      
      console.log('Purchases restored for user:', userId);
      return true;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return false;
    }
  }
} 