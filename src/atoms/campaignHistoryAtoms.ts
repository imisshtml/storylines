import { atom } from 'jotai';
import { supabase } from '../config/supabase';

export type CampaignMessage = {
  id: number;
  campaign_id: string;
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
  async (get, set, campaignId: string) => {
    try {
      set(campaignHistoryLoadingAtom, true);
      set(campaignHistoryErrorAtom, null);

      const { data, error } = await supabase
        .from('campaign_history')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('timestamp', { ascending: true });

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
    campaign_id: string;
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

      // Update local state
      const currentHistory = get(campaignHistoryAtom);
      set(campaignHistoryAtom, [...currentHistory, data]);

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
  async (get, set, campaignId: string) => {
    const subscription = supabase
      .channel(`campaign_history:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_history',
          filter: `campaign_id=eq.${campaignId}`
        },
        (payload) => {
          const newMessage = payload.new as CampaignMessage;
          const currentHistory = get(campaignHistoryAtom);
          
          // Check if message already exists to avoid duplicates
          const messageExists = currentHistory.some(msg => msg.id === newMessage.id);
          if (!messageExists) {
            set(campaignHistoryAtom, [...currentHistory, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
);