import { atom } from 'jotai';
import { supabase } from '../config/supabase';
import { createRealtimeSubscription } from '../utils/connectionUtils';

export type ActionSummary = {
  summary: string;
  timestamp: string;
  type: 'player' | 'gm' | 'system';
  author: string;
};

export type CampaignSummary = {
  id: string;
  campaign_id: string;
  action_summaries: ActionSummary[];
  summary_count: number;
  created_at: string;
  updated_at: string;
};

// Atoms for managing campaign summaries
export const campaignSummaryAtom = atom<CampaignSummary | null>(null);
export const campaignSummaryLoadingAtom = atom<boolean>(false);
export const campaignSummaryErrorAtom = atom<string | null>(null);

// Fetch campaign summaries for a specific campaign
export const fetchCampaignSummaryAtom = atom(
  null,
  async (get, set, campaignId: string) => {
    try {
      set(campaignSummaryLoadingAtom, true);
      set(campaignSummaryErrorAtom, null);

      const { data, error } = await supabase
        .from('campaign_summaries')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      set(campaignSummaryAtom, data);
    } catch (error) {
      set(campaignSummaryErrorAtom, (error as Error).message);
      console.error('Error fetching campaign summary:', error);
    } finally {
      set(campaignSummaryLoadingAtom, false);
    }
  }
);

// Get formatted summary for display
export const formattedSummaryAtom = atom<string>((get) => {
  const summary = get(campaignSummaryAtom);

  if (!summary || !summary.action_summaries || summary.action_summaries.length === 0) {
    return 'No recent actions';
  }

  return summary.action_summaries
    .slice(-10) // Last 10 actions
    .map((action, index) => {
      const timeAgo = getTimeAgo(action.timestamp);
      return `${index + 1}. ${action.summary} (${timeAgo})`;
    })
    .join('\n');
});

// Get a human-readable time ago string
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

// Track active campaign summary subscriptions by campaign ID
let activeCampaignSummarySubscriptions: Record<string, (() => void)> = {};

// Initialize real-time subscription for campaign summaries
export const initializeCampaignSummaryRealtimeAtom = atom(
  null,
  async (get, set, campaignId: string) => {
    // If we already have an active subscription for this campaign, return the existing cleanup
    if (activeCampaignSummarySubscriptions[campaignId]) {
      console.log(`📡 Reusing existing campaign summary subscription for: ${campaignId}`);
      return activeCampaignSummarySubscriptions[campaignId];
    }

    console.log(`📡 Creating new robust campaign summary subscription for: ${campaignId}`);
    
    const channelName = `campaign_summaries:${campaignId}`;
    
    // Create subscription with automatic reconnection using the new robust system
    const cleanup = createRealtimeSubscription(
      channelName,
      {
        postgres_changes: [{
          event: '*',
          schema: 'public',
          table: 'campaign_summaries',
          filter: `campaign_id=eq.${campaignId}`
        }]
      },
      (payload) => {
        console.log(`📨 [${channelName}] Received update:`, payload.eventType);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedSummary = payload.new as CampaignSummary;
          set(campaignSummaryAtom, updatedSummary);
        }
      },
      5 // Max 5 reconnection attempts
    );

    // Store the cleanup function
    activeCampaignSummarySubscriptions[campaignId] = cleanup;

    return cleanup;
  }
);

// Add a new action summary (for debugging/manual testing)
export const addActionSummaryAtom = atom(
  null,
  async (get, set, { campaignId, message, author, messageType, characterName }: {
    campaignId: string;
    message: string;
    author: string;
    messageType: 'player' | 'gm' | 'system';
    characterName?: string;
  }) => {
    try {
      // This would typically be handled by the backend
      // But we can add it here for testing purposes
      console.log('Adding action summary:', { campaignId, message, author, messageType, characterName });
    } catch (error) {
      console.error('Error adding action summary:', error);
    }
  }
); 