import { atom } from 'jotai';
import { supabase } from '../config/supabase';

export type Campaign = {
  id: string;
  name: string;
  adventure: string;
  level: number;
  tone: 'serious' | 'humorous' | 'grimdark';
  exclude: string[];
  status: 'creation' | 'waiting' | 'in_progress' | 'open' | 'completed' | 'failed';
  players: Player[];
  invite_code: string;
  owner: string;
  content_level: 'kids' | 'teens' | 'adults';
  rp_focus: 'heavy_rp' | 'rp_focused' | 'balanced' | 'combat_focused' | 'heavy_combat';
  limit?: number;
  campaign_length?: 'tale' | 'journey' | 'saga' | 'chronicle' | 'epic';
  max_level?: number;
  created_at?: string;
  uid: string;
  latest_message_id?: number | null;
  has_unread?: boolean;
};

export type Player = {
  id: string;
  name: string;
  ready: boolean;
  avatar?: string;
};

export const campaignsAtom = atom<Campaign[]>([]);
export const campaignsLoadingAtom = atom(true);
export const campaignsErrorAtom = atom<string | null>(null);
export const currentCampaignAtom = atom<Campaign | null>(null);

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

    if (error && error.code !== 'PGRST116') {
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

  if (!latestMessageId) {
    return false;
  }

  if (!readStatus) {
    return false;
  }

  return latestMessageId > (readStatus?.last_read_message_id || 0);
};

// SUPER SIMPLE TEST VERSION - Just get campaigns without any complex logic
export const fetchCampaignsAtom = atom(
  null,
  async (get, set) => {
    try {
      console.log('🚀 Simple campaign fetch starting...');
      set(campaignsLoadingAtom, true);
      set(campaignsErrorAtom, null);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 User ID:', user?.id);
      if (!user) {
        console.log('❌ No user, returning');
        return;
      }

      // Just get all campaigns - no filtering, no complex logic
      console.log('📊 Fetching all campaigns...');
      const { data: allCampaigns, error } = await supabase
        .from('campaigns')
        .select('id, name, owner, created_at')
        .limit(10);

      console.log('📊 Raw result:', { data: allCampaigns, error, count: allCampaigns?.length });

      if (error) {
        console.error('❌ Query error:', error);
        throw error;
      }

             // Just set whatever we got (cast to Campaign[] for now)
       set(campaignsAtom, (allCampaigns || []) as Campaign[]);
      console.log('✅ Set campaigns:', allCampaigns?.length || 0);
    } catch (error) {
      console.error('❌ Campaign fetch error:', error);
      set(campaignsErrorAtom, (error as Error).message);
      set(campaignsAtom, []);
    } finally {
      set(campaignsLoadingAtom, false);
      console.log('🏁 Campaign fetch completed');
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
        limit: campaign.limit,
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

      // If it's a new campaign, add it to the list
      if (!currentCampaigns.some(c => c.id === data.id)) {
        updatedCampaigns.push({ ...data, latest_message_id: null, has_unread: false });
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

// Atom to delete a campaign
export const deleteCampaignAtom = atom(
  null,
  async (get, set, campaignId: string) => {
    try {
      set(campaignsLoadingAtom, true);
      set(campaignsErrorAtom, null);

      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      // Update local state
      const currentCampaigns = get(campaignsAtom);
      const updatedCampaigns = currentCampaigns.filter(c => c.id !== campaignId);
      set(campaignsAtom, updatedCampaigns);

      // Clear current campaign if it was deleted
      const currentCampaign = get(currentCampaignAtom);
      if (currentCampaign?.id === campaignId) {
        set(currentCampaignAtom, null);
      }
    } catch (error) {
      set(campaignsErrorAtom, (error as Error).message);
      throw error;
    } finally {
      set(campaignsLoadingAtom, false);
    }
  }
); 