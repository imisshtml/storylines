import { atom } from 'jotai';
import { supabase } from '../config/supabase';
import { withConnectionRetry, checkSupabaseConnection } from '../utils/connectionUtils';

export type CampaignMessage = {
  id: number;
  campaign_id: string;
  message: string;
  author: string;
  message_type: 'player' | 'gm' | 'system';
  timestamp: string;
  created_at: string;
  dice_roll?: number; // Optional dice roll result
  difficulty?: number; // Difficulty class for rolls (defaults to 10)
  character_id?: string; // Character ID for player messages
  character_name?: string; // Character name for display
  character_avatar?: string; // Character avatar URL
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
    campaign_id: string;
    message: string;
    author: string;
    message_type: 'player' | 'gm' | 'system';
    dice_roll?: number;
    difficulty?: number;
    character_id?: string;
    character_name?: string;
    character_avatar?: string;
  }) => {
    try {
      // Check connection first
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error('Connection to server lost. Please check your internet connection.');
      }

      // Use retry logic for the database operation
      const data = await withConnectionRetry(async () => {
        const { data, error } = await supabase
          .from('campaign_history')
          .insert(messageData)
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      // Don't update local state here - let real-time subscription handle it
      // This prevents duplicate messages when real-time is working
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set(campaignHistoryErrorAtom, errorMessage);
      throw new Error(errorMessage);
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