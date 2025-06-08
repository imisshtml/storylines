import { atom } from 'jotai';
import { supabase } from '../config/supabase';

export type Campaign = {
  id: string;
  name: string;
  adventure: string;
  level: number;
  tone: 'serious' | 'humorous' | 'grimdark';
  exclude: string[];
  status: 'creation' | 'waiting' | 'in_progress';
  players: Player[];
  invite_code: string;
  owner: string;
  content_level: 'kids' | 'teens' | 'adults';
  rp_focus: 'heavy_rp' | 'rp_focused' | 'balanced' | 'combat_focused' | 'heavy_combat';
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Fetch campaigns where user is either owner OR a player
      const { data: allCampaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .or(`owner.eq.${user.id},players.cs.[{"id":"${user.id}"}]`)
        .order('created_at', { ascending: false });

      if (campaignError) throw campaignError;

      set(campaignsAtom, allCampaigns || []);
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

      // Clean the campaign data to only include fields that exist in the database
      const cleanCampaignData = {
        id: campaign.id,
        name: campaign.name,
        adventure: campaign.adventure,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
            .or(`owner.eq.${user.id},players.cs.[{"id":"${user.id}"}]`)
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