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
  uid: string;
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

      // Sort by created_at descending
      userCampaigns.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      set(campaignsAtom, userCampaigns);
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
          // Re-fetch campaigns using the same filtering logic as fetchCampaignsAtom
          try {
            // Get campaigns where user is the owner
            const { data: ownedCampaigns, error: ownedError } = await supabase
              .from('campaigns')
              .select('*')
              .eq('owner', user.id)
              .order('created_at', { ascending: false });

            if (ownedError) throw ownedError;

            // Get all campaigns and filter client-side for ones where user is a player
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

            // Sort by created_at descending
            userCampaigns.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

            set(campaignsAtom, userCampaigns);

            // Update current campaign if it was modified
            const currentCampaign = get(currentCampaignAtom);
            if (currentCampaign) {
              const updatedCampaign = userCampaigns.find(c => c.id === currentCampaign.id);
              if (updatedCampaign) {
                set(currentCampaignAtom, updatedCampaign);
              }
            }
          } catch (error) {
            console.error('Real-time campaign update error:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
);