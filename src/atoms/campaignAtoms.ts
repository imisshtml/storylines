import { atom } from 'jotai';
import { supabase } from '../config/supabase';

export type Campaign = {
  id: string;
  name: string;
  theme: string;
  level: number;
  tone: 'serious' | 'humorous' | 'grimdark';
  exclude: string[];
  status: 'creation' | 'waiting' | 'in_progress';
  players: Player[];
  invite_code: string;
  owner: string;
  created_at?: string;
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

// Derived atom that fetches campaigns from Supabase
export const fetchCampaignsAtom = atom(
  null,
  async (get, set) => {
    try {
      set(campaignsLoadingAtom, true);
      set(campaignsErrorAtom, null);

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set(campaignsAtom, data || []);
    } catch (error) {
      set(campaignsErrorAtom, (error as Error).message);
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

      const { data, error } = await supabase
        .from('campaigns')
        .upsert(campaign)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const currentCampaigns = get(campaignsAtom);
      const updatedCampaigns = currentCampaigns.map(c => 
        c.id === data.id ? data : c
      );

      if (!currentCampaigns.find(c => c.id === data.id)) {
        updatedCampaigns.unshift(data);
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

// Initialize Supabase real-time subscription
export const initializeRealtimeAtom = atom(
  null,
  async (get, set) => {
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
          // Fetch fresh data to ensure we have the complete state
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });

          if (campaigns) {
            set(campaignsAtom, campaigns);
            
            // Update current campaign if it was modified
            const currentCampaign = get(currentCampaignAtom);
            if (currentCampaign) {
              const updatedCampaign = campaigns.find(c => c.id === currentCampaign.id);
              if (updatedCampaign) {
                set(currentCampaignAtom, updatedCampaign);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
);