import { atom } from 'jotai';
import { supabase } from '../config/supabase';

export type CampaignMessage = {
  id: number;
  campaign_uid: string;
  message: string;
  author: string;
  message_type: 'player' | 'dm' | 'system';
  timestamp: string;
  created_at: string;
};

// Campaign history state
export const campaignHistoryAtom = atom<CampaignMessage[]>([]);
export const campaignHistoryLoadingAtom = atom(false);
export const campaignHistoryErrorAtom = atom<string | null>(null);

// Fetch campaign history
export const fetchCampaignHistoryAtom = atom(
  null,
  async (get, set, campaignUid: string) => {
    try {
      set(campaignHistoryLoadingAtom, true);
      set(campaignHistoryErrorAtom, null);

      const { data, error } = await supabase
        .from('campaign_history')
        .select('*')
        .eq('campaign_uid', campaignUid)
        .order('timestamp', { ascending: true })
        .order('id', { ascending: true }); // Secondary sort by ID for consistent ordering

      if (error) throw error;

      set(campaignHistoryAtom, data || []);
    } catch (error) {
      set(campaignHistoryErrorAtom, (error as Error).message);
      console.error('Error fetching campaign history:', error);
    } finally {
      set(campaignHistoryLoadingAtom, false);
    }
  }
);

// Add message to campaign history
export const addCampaignMessageAtom = atom(
  null,
  async (get, set, messageData: {
    campaign_uid: string;
    message: string;
    author: string;
    message_type: 'player' | 'dm' | 'system';
  }) => {
    try {
      const { data, error } = await supabase
        .from('campaign_history')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Don't update local state here - let real-time subscription handle it
      // This prevents duplicate messages when real-time is working
      return data;
    } catch (error) {
      set(campaignHistoryErrorAtom, (error as Error).message);
      throw error;
    }
  }
);

// Initialize real-time subscription for campaign history
export const initializeCampaignHistoryRealtimeAtom = atom(
  null,
  async (get, set, campaignUid: string) => {
    const subscription = supabase
      .channel(`campaign_history:${campaignUid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_history',
          filter: `campaign_uid=eq.${campaignUid}`
        },
        (payload) => {
          const newMessage = payload.new as CampaignMessage;
          const currentHistory = get(campaignHistoryAtom);

          // Check if message already exists to avoid duplicates
          const messageExists = currentHistory.some(msg => msg.id === newMessage.id);
          if (!messageExists) {
            // Insert in correct chronological order
            const updatedHistory = [...currentHistory, newMessage].sort((a, b) => {
              const timeCompare = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
              return timeCompare !== 0 ? timeCompare : a.id - b.id;
            });
            set(campaignHistoryAtom, updatedHistory);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
);

// Clear campaign history (useful when switching campaigns)
export const clearCampaignHistoryAtom = atom(
  null,
  (get, set) => {
    set(campaignHistoryAtom, []);
    set(campaignHistoryErrorAtom, null);
  }
);