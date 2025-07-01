import { atom } from 'jotai';
import { supabase } from '../config/supabase';
import { userAtom } from './authAtoms';

export interface UserCapabilities {
  // Ad removal
  adsRemoved: boolean;
  
  // Limits
  characterLimit: number;
  campaignLimit: number;
  groupSizeLimit: number;
  
  // Unlocks
  allAdventuresUnlocked: boolean;
  
  // Subscriptions
  dmSubscriptionActive: boolean;
  adventurersPackActive: boolean;
  
  // Inventory
  scrollsOfRebirth: number;
}

export interface UserInventoryItem {
  id: string;
  userId: string;
  itemType: string;
  quantity: number;
}

// Default capabilities for new users
const DEFAULT_CAPABILITIES: UserCapabilities = {
  adsRemoved: false,
  characterLimit: 2,
  campaignLimit: 2,
  groupSizeLimit: 3, // User + 2 others
  allAdventuresUnlocked: false,
  dmSubscriptionActive: false,
  adventurersPackActive: false,
  scrollsOfRebirth: 0,
};

// Main capabilities atom
export const userCapabilitiesAtom = atom<UserCapabilities>(DEFAULT_CAPABILITIES);

// Loading state
export const capabilitiesLoadingAtom = atom(false);

// Error state
export const capabilitiesErrorAtom = atom<string | null>(null);

// User inventory atom
export const userInventoryAtom = atom<UserInventoryItem[]>([]);

// Fetch user capabilities from database
export const fetchUserCapabilitiesAtom = atom(
  null,
  async (get, set) => {
    const user = get(userAtom);
    if (!user?.id) {
      set(userCapabilitiesAtom, DEFAULT_CAPABILITIES);
      return;
    }

    try {
      set(capabilitiesLoadingAtom, true);
      set(capabilitiesErrorAtom, null);

      // Fetch user profile with purchase-related fields
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          character_limit,
          campaign_limit,
          group_size,
          ads_removed,
          all_adventures_unlocked,
          dm_subscription_active,
          adventurers_pack_active
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

      // Calculate scrolls of rebirth
      const scrollsItem = inventory?.find(item => item.item_type === 'scroll_rebirth');
      const scrollsOfRebirth = scrollsItem?.quantity || 0;

      // Calculate actual limits based on subscriptions and purchases
      let characterLimit = profile?.character_limit || DEFAULT_CAPABILITIES.characterLimit;
      let campaignLimit = profile?.campaign_limit || DEFAULT_CAPABILITIES.campaignLimit;
      let groupSizeLimit = profile?.group_size || DEFAULT_CAPABILITIES.groupSizeLimit;

      // DM Subscription overrides limits if higher
      if (profile?.dm_subscription_active) {
        characterLimit = Math.max(characterLimit, 10);
        campaignLimit = Math.max(campaignLimit, 10);
        groupSizeLimit = Math.max(groupSizeLimit, 7);
      }

      // Adventurers Pack adds to base limits
      if (profile?.adventurers_pack_active) {
        // Adventurers pack adds 3 to character and campaign limits
        // but doesn't affect group size
        characterLimit = Math.max(characterLimit, DEFAULT_CAPABILITIES.characterLimit + 3);
        campaignLimit = Math.max(campaignLimit, DEFAULT_CAPABILITIES.campaignLimit + 3);
      }

      const capabilities: UserCapabilities = {
        // Ads removed if any of these flags are true
        adsRemoved: Boolean(
          profile?.ads_removed ||
          profile?.dm_subscription_active ||
          profile?.adventurers_pack_active
        ),
        characterLimit,
        campaignLimit,
        groupSizeLimit,
        allAdventuresUnlocked: profile?.all_adventures_unlocked || false,
        dmSubscriptionActive: profile?.dm_subscription_active || false,
        adventurersPackActive: profile?.adventurers_pack_active || false,
        scrollsOfRebirth,
      };

      set(userCapabilitiesAtom, capabilities);
      set(userInventoryAtom, inventory || []);

    } catch (error) {
      console.error('Error fetching user capabilities:', error);
      set(capabilitiesErrorAtom, (error as Error).message);
      set(userCapabilitiesAtom, DEFAULT_CAPABILITIES);
    } finally {
      set(capabilitiesLoadingAtom, false);
    }
  }
);

// Helper atoms for specific capabilities
export const canCreateCharacterAtom = atom(
  (get) => {
    const capabilities = get(userCapabilitiesAtom);
    // This will be checked against actual character count in the character creation flow
    return capabilities.characterLimit;
  }
);

export const canJoinCampaignAtom = atom(
  (get) => {
    const capabilities = get(userCapabilitiesAtom);
    // This will be checked against actual campaign count in the campaign join flow
    return capabilities.campaignLimit;
  }
);

export const canCreateCampaignAtom = atom(
  (get) => {
    const capabilities = get(userCapabilitiesAtom);
    // This will be checked against actual created campaign count
    return capabilities.campaignLimit;
  }
);

export const availableAdventuresAtom = atom(
  (get) => {
    const capabilities = get(userCapabilitiesAtom);
    // Return all adventures if unlocked, otherwise only first 3
    return capabilities.allAdventuresUnlocked ? 'all' : 'first_3';
  }
);

export const maxGroupSizeAtom = atom(
  (get) => {
    const capabilities = get(userCapabilitiesAtom);
    return capabilities.groupSizeLimit;
  }
);

export const shouldShowAdsAtom = atom(
  (get) => {
    const capabilities = get(userCapabilitiesAtom);
    return !capabilities.adsRemoved;
  }
);

// Use scroll of rebirth
export const useScrollOfRebirthAtom = atom(
  null,
  async (get, set, characterId: string) => {
    const user = get(userAtom);
    const capabilities = get(userCapabilitiesAtom);
    
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (capabilities.scrollsOfRebirth <= 0) {
      throw new Error('No scrolls of rebirth available');
    }

    try {
      // Update character equipment to add scroll of rebirth
      const { data: character, error: fetchError } = await supabase
        .from('characters')
        .select('equipment')
        .eq('id', characterId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentEquipment = character.equipment || [];
      const updatedEquipment = [...currentEquipment, {
        id: `scroll_rebirth_${Date.now()}`,
        name: 'Scroll of Rebirth',
        type: 'consumable',
        description: 'Instantly revive a fallen character with full health',
        quantity: 1,
        addedAt: new Date().toISOString()
      }];

      // Update character with new equipment
      const { error: updateError } = await supabase
        .from('characters')
        .update({ equipment: updatedEquipment })
        .eq('id', characterId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Decrease scroll count in inventory
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .update({ quantity: capabilities.scrollsOfRebirth - 1 })
        .eq('user_id', user.id)
        .eq('item_type', 'scroll_rebirth');

      if (inventoryError) throw inventoryError;

      // Refresh capabilities
      set(fetchUserCapabilitiesAtom);

      return true;
    } catch (error) {
      console.error('Error using scroll of rebirth:', error);
      throw error;
    }
  }
);

// Check if user can perform an action
export const checkUserLimitAtom = atom(
  null,
  async (get, set, limitType: 'character' | 'campaign', currentCount: number) => {
    const capabilities = get(userCapabilitiesAtom);
    
    switch (limitType) {
      case 'character':
        return currentCount < capabilities.characterLimit;
      case 'campaign':
        return currentCount < capabilities.campaignLimit;
      default:
        return false;
    }
  }
); 