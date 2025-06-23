import { atom } from 'jotai';
import { supabase } from '../config/supabase';

export type Campaign = {
  id: string;
  name: string;
  adventure: string;
  level: number;
  tone: 'serious' | 'humorous' | 'grimdark';
  exclude: string[];
  status: 'creation' | 'waiting' | 'in_progress' | 'open';
  players: Player[];
  invite_code: string;
  owner: string;
  content_level: 'kids' | 'teens' | 'adults';
  rp_focus: 'heavy_rp' | 'rp_focused' | 'balanced' | 'combat_focused' | 'heavy_combat';
  limit?: number; // Player limit for the campaign
  created_at?: string;
  // Add fields for notification tracking
  latest_message_id?: number | null;
  has_unread?: boolean;
  // Add field for intro generation tracking
  intro_generated?: boolean;
};

export type Player = {
  id: string;
  name: string;
  ready: boolean;
  avatar?: string;
};

export const campaignsAtom = atom<Campaign[]>([]);

// Atom to handle loading state
export const campaignsLoadingAtom = atom(true);

// Atom to handle error state
export const campaignsErrorAtom = atom<string | null>(null);

// Helper function to get latest message ID for a campaign
const getLatestMessageId = async (campaignId: string): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from('campaign_history')
      .select('id')
      .eq('campaign_id', campaignId)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error fetching latest message ID for campaign:', campaignId, error);
    return null;
  }
};

// Helper function to check if campaign has unread messages
const hasUnreadMessages = (
  campaignId: string,
  latestMessageId: number | null,
  readStatuses: Record<string, any>
): boolean => {
  const readStatus = readStatuses[campaignId];

  // If there's no latest message, there's nothing to read
  if (!latestMessageId) {
    return false;
  }

  // If no read status exists, don't show unread until user has visited the campaign
  // This prevents showing unread for campaigns that haven't been visited yet
  if (!readStatus) {
    return false;
  }

  // If the latest message ID is greater than the last read message ID, it's unread
  return latestMessageId > (readStatus?.last_read_message_id || 0);
};

// Derived atom that fetches campaigns from Supabase with notification data
export const fetchCampaignsAtom = atom(
  null,
  async (get, set) => {
    try {
      set(campaignsLoadingAtom, true);
      set(campaignsErrorAtom, null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, get campaigns where user is the owner
      const { data: ownedCampaigns, error: ownedError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('owner', user.id);

      if (ownedError) throw ownedError;

      // Then, get all campaigns and filter client-side for ones where user is a player
      const { data: allCampaigns, error: allError } = await supabase
        .from('campaigns')
        .select('*');

      if (allError) throw allError;

      // Filter campaigns where user is a player (but not owner to avoid duplicates)
      const playerCampaigns = allCampaigns?.filter(campaign => {
        // Skip if user is already the owner (already included in ownedCampaigns)
        if (campaign.owner === user.id) return false;

        // Check if user is in the players array
        const players = campaign.players || [];
        return players.some((player: Player) => player.id === user.id);
      }) || [];

      // Combine owned and player campaigns
      const userCampaigns = [...(ownedCampaigns || []), ...playerCampaigns];

      // Get read statuses for all campaigns
      const { data: readStatuses, error: readError } = await supabase
        .from('campaign_read_status')
        .select('*')
        .eq('user_id', user.id);

      if (readError) {
        console.error('Error fetching read statuses:', readError);
      }

      // Convert read statuses to a map for easy lookup
      const readStatusMap = (readStatuses || []).reduce((acc, status) => {
        acc[status.campaign_id] = status;
        return acc;
      }, {} as Record<string, any>);

      // Enhance campaigns with notification data
      const enhancedCampaigns = await Promise.all(
        userCampaigns.map(async (campaign) => {
          const latestMessageId = await getLatestMessageId(campaign.id);
          const hasUnread = hasUnreadMessages(campaign.id, latestMessageId, readStatusMap);

          return {
            ...campaign,
            latest_message_id: latestMessageId,
            has_unread: hasUnread,
          };
        })
      );

      // Sort by created_at descending
      enhancedCampaigns.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      set(campaignsAtom, enhancedCampaigns);
    } catch (error) {
      set(campaignsErrorAtom, (error as Error).message);
      console.error('Campaign fetch error:', error);
    } finally {
      set(campaignsLoadingAtom, false);
    }
  }
);

// Atom to handle creating/updating campaigns
export const upsertCampaignAtom = atom(
  null,
  async (get, set, campaign: Partial<Campaign>) => {
    try {
      set(campaignsLoadingAtom, true);
      set(campaignsErrorAtom, null);

      // If adventure is provided, look up the adventure_id
      let adventureId = null;
      if (campaign.adventure) {
        const { data: adventure, error: adventureError } = await supabase
          .from('adventures')
          .select('id')
          .eq('slug', campaign.adventure)
          .single();

        if (!adventureError && adventure) {
          adventureId = adventure.id;
        }
      }

      // Clean the campaign data to only include fields that exist in the database
      const cleanCampaignData = {
        id: campaign.id,
        name: campaign.name,
        adventure: campaign.adventure,
        adventure_id: adventureId,
        level: campaign.level,
        tone: campaign.tone,
        exclude: campaign.exclude,
        status: campaign.status,
        players: campaign.players,
        invite_code: campaign.invite_code,
        owner: campaign.owner,
        content_level: campaign.content_level,
        rp_focus: campaign.rp_focus,
      };

      // Remove undefined values
      const filteredData = Object.fromEntries(
        Object.entries(cleanCampaignData).filter(([_, value]) => value !== undefined)
      );

      const { data, error } = await supabase
        .from('campaigns')
        .upsert(filteredData)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const currentCampaigns = get(campaignsAtom);
      const updatedCampaigns = currentCampaigns.map(c =>
        c.id === data.id ? { ...data, latest_message_id: c.latest_message_id, has_unread: c.has_unread } : c
      );

      if (!currentCampaigns.find(c => c.id === data.id)) {
        updatedCampaigns.unshift({ ...data, latest_message_id: null, has_unread: false });
      }

      set(campaignsAtom, updatedCampaigns);
      return data;
    } catch (error) {
      set(campaignsErrorAtom, (error as Error).message);
      throw error;
    } finally {
      set(campaignsLoadingAtom, false);
    }
  }
);

export const currentCampaignAtom = atom<Campaign | null>(null);

// Track the active campaign subscription
let activeCampaignSubscription: any = null;
let activeCampaignUserId: string | null = null;

// Initialize Supabase real-time subscription
export const initializeRealtimeAtom = atom(
  null,
  async (get, set) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    // If we already have an active subscription for this user, return the existing cleanup
    if (activeCampaignSubscription && activeCampaignUserId === user.id) {
      return () => {
        if (activeCampaignSubscription) {
          activeCampaignSubscription.unsubscribe();
          activeCampaignSubscription = null;
          activeCampaignUserId = null;
        }
      };
    }

    // Clean up any existing subscription for a different user
    if (activeCampaignSubscription) {
      activeCampaignSubscription.unsubscribe();
      activeCampaignSubscription = null;
      activeCampaignUserId = null;
    }

    const subscription = supabase
      .channel('campaigns')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns'
        },
        async (payload) => {
          // Re-fetch campaigns to update notification status
          try {
            set(fetchCampaignsAtom);
          } catch (error) {
            console.error('Error re-fetching campaigns after real-time update:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_history'
        },
        async (payload) => {
          // When new messages are added, update campaign notification status
          try {
            set(fetchCampaignsAtom);
          } catch (error) {
            console.error('Error re-fetching campaigns after message update:', error);
          }
        }
      )
      .subscribe();

    // Store the subscription and user ID
    activeCampaignSubscription = subscription;
    activeCampaignUserId = user.id;

    return () => {
      if (activeCampaignSubscription) {
        activeCampaignSubscription.unsubscribe();
        activeCampaignSubscription = null;
        activeCampaignUserId = null;
      }
    };
  }
);