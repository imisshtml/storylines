import { atom } from 'jotai';
import { supabase } from '../config/supabase';

export type CampaignReadStatus = {
  id: string;
  user_id: string;
  campaign_uid: string;
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

      // Convert array to object keyed by campaign_uid for easy lookup
      const statusMap = (data || []).reduce((acc, status) => {
        acc[status.campaign_uid] = status;
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
  async (get, set, { campaignUid, messageId }: { campaignUid: string; messageId: number }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, check if a record already exists
      const { data: existingRecord } = await supabase
        .from('campaign_read_status')
        .select('id')
        .eq('user_id', user.id)
        .eq('campaign_uid', campaignUid)
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
          .eq('campaign_uid', campaignUid)
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
            campaign_uid: campaignUid,
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
        [campaignUid]: data,
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
  async (get, set, campaignUid: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('campaign_history')
        .select('id')
        .eq('campaign_uid', campaignUid)
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
  (get) => (campaignUid: string, latestMessageId: number | null): boolean => {
    const readStatuses = get(campaignReadStatusAtom);
    const readStatus = readStatuses[campaignUid];

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

// Initialize real-time subscription for read status updates
export const initializeCampaignReadStatusRealtimeAtom = atom(
  null,
  async (get, set) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subscription = supabase
      .channel(`campaign_read_status:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_read_status',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const currentStatuses = get(campaignReadStatusAtom);
          
          if (payload.eventType === 'DELETE') {
            const { [payload.old.campaign_uid]: deleted, ...rest } = currentStatuses;
            set(campaignReadStatusAtom, rest);
          } else {
            const updatedStatus = payload.new as CampaignReadStatus;
            set(campaignReadStatusAtom, {
              ...currentStatuses,
              [updatedStatus.campaign_uid]: updatedStatus,
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
);