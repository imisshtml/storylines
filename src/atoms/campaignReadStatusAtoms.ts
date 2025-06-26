import { atom } from 'jotai';
import { supabase } from '../config/supabase';
import { createRealtimeSubscription } from '../utils/connectionUtils';

export type CampaignReadStatus = {
  id: string;
  user_id: string;
  campaign_id: string;
  last_read_message_id: number | null;
  updated_at: string;
};

// Campaign read status state
export const campaignReadStatusAtom = atom<Record<string, CampaignReadStatus>>({});
export const campaignReadStatusLoadingAtom = atom(false);
export const campaignReadStatusErrorAtom = atom<string | null>(null);

// Fetch all read statuses for the current user
export const fetchCampaignReadStatusAtom = atom(
  null,
  async (get, set) => {
    try {
      set(campaignReadStatusLoadingAtom, true);
      set(campaignReadStatusErrorAtom, null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('campaign_read_status')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Convert array to object keyed by campaign_id for easy lookup
      const statusMap = (data || []).reduce((acc, status) => {
        acc[status.campaign_id] = status;
        return acc;
      }, {} as Record<string, CampaignReadStatus>);

      set(campaignReadStatusAtom, statusMap);
    } catch (error) {
      set(campaignReadStatusErrorAtom, (error as Error).message);
      console.error('Error fetching campaign read status:', error);
    } finally {
      set(campaignReadStatusLoadingAtom, false);
    }
  }
);

// Update read status for a specific campaign
export const updateCampaignReadStatusAtom = atom(
  null,
  async (get, set, { campaignId, messageId }: { campaignId: string; messageId: number }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, check if a record already exists
      const { data: existingRecord } = await supabase
        .from('campaign_read_status')
        .select('id')
        .eq('user_id', user.id)
        .eq('campaign_id', campaignId)
        .single();

      let data, error;

      if (existingRecord) {
        // Update existing record
        const result = await supabase
          .from('campaign_read_status')
          .update({
            last_read_message_id: messageId,
          })
          .eq('user_id', user.id)
          .eq('campaign_id', campaignId)
          .select()
          .single();

        data = result.data;
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('campaign_read_status')
          .insert({
            user_id: user.id,
            campaign_id: campaignId,
            last_read_message_id: messageId,
          })
          .select()
          .single();

        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Update local state
      const currentStatuses = get(campaignReadStatusAtom);
      set(campaignReadStatusAtom, {
        ...currentStatuses,
        [campaignId]: data,
      });
    } catch (error) {
      set(campaignReadStatusErrorAtom, (error as Error).message);
      console.error('Error updating campaign read status:', error);
    }
  }
);

// Get the latest message ID for a campaign
export const getLatestMessageIdAtom = atom(
  null,
  async (get, set, campaignId: string): Promise<number | null> => {
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
      console.error('Error fetching latest message ID:', error);
      return null;
    }
  }
);

// Check if a campaign has unread messages
export const hasUnreadMessagesAtom = atom(
  (get) => (campaignId: string, latestMessageId: number | null): boolean => {
    const readStatuses = get(campaignReadStatusAtom);
    const readStatus = readStatuses[campaignId];

    // If there's no latest message, there's nothing to read
    if (!latestMessageId) {
      return false;
    }

    // If no read status exists, but there are messages, only show unread if we've established a baseline
    // This prevents showing unread for campaigns that haven't been visited yet
    if (!readStatus) {
      return false; // Don't show unread until user has visited the campaign at least once
    }

    // If the latest message ID is greater than the last read message ID, it's unread
    return latestMessageId > (readStatus?.last_read_message_id || 0);
  }
);

// Track the active read status subscription
let activeReadStatusCleanup: (() => void) | null = null;
let activeReadStatusUserId: string | null = null;

// Initialize real-time subscription for read status updates
export const initializeCampaignReadStatusRealtimeAtom = atom(
  null,
  async (get, set) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user found for read status subscription');
      return;
    }

    // If we already have an active subscription for this user, return the existing cleanup
    if (activeReadStatusCleanup && activeReadStatusUserId === user.id) {
      console.log(`📡 Reusing existing read status subscription for user: ${user.id}`);
      return activeReadStatusCleanup;
    }

    // Clean up any existing subscription for a different user
    if (activeReadStatusCleanup) {
      console.log(`📡 Cleaning up read status subscription for different user`);
      activeReadStatusCleanup();
      activeReadStatusCleanup = null;
      activeReadStatusUserId = null;
    }

    console.log(`📡 Creating new robust read status subscription for user: ${user.id}`);
    
    const channelName = `campaign_read_status:${user.id}`;
    
    // Create subscription with automatic reconnection using the new robust system
    const cleanup = createRealtimeSubscription(
      channelName,
      {
        postgres_changes: [{
          event: '*',
          schema: 'public',
          table: 'campaign_read_status',
          filter: `user_id=eq.${user.id}`,
        }]
      },
      (payload) => {
        console.log(`📨 [${channelName}] Received update:`, payload.eventType);
        
        const currentStatuses = get(campaignReadStatusAtom);

        if (payload.eventType === 'DELETE') {
          const { [payload.old.campaign_id]: deleted, ...rest } = currentStatuses;
          set(campaignReadStatusAtom, rest);
        } else {
          const updatedStatus = payload.new as CampaignReadStatus;
          set(campaignReadStatusAtom, {
            ...currentStatuses,
            [updatedStatus.campaign_id]: updatedStatus,
          });
        }
      },
      5 // Max 5 reconnection attempts
    );

    // Store the cleanup function and user ID
    activeReadStatusCleanup = cleanup;
    activeReadStatusUserId = user.id;

    return cleanup;
  }
);