import { atom } from 'jotai';
import { supabase } from '../config/supabase';
import { createRealtimeSubscription } from '../utils/connectionUtils';

export type PlayerActionData = {
  title: string;
  description: string;
  type: string;
  requirements: string[];
  context?: any;
};

export type PlayerAction = {
  id: string;
  campaign_id: string;
  character_id: string;
  user_id: string;
  action_type: 'base' | 'llm_generated' | 'contextual';
  action_data: PlayerActionData;
  game_mode: 'exploration' | 'combat' | 'social' | 'rest';
  scene_id?: string | null;
  priority: number;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
};

// Base atoms for managing player actions state
export const playerActionsAtom = atom<PlayerAction[]>([]);
export const playerActionsLoadingAtom = atom<boolean>(false);
export const playerActionsErrorAtom = atom<string | null>(null);

// Derived atom to get actions by type
export const baseActionsAtom = atom<PlayerAction[]>((get) => {
  const actions = get(playerActionsAtom);
  return actions.filter(action => action.action_type === 'base');
});

export const llmActionsAtom = atom<PlayerAction[]>((get) => {
  const actions = get(playerActionsAtom);
  return actions.filter(action => action.action_type === 'llm_generated');
});

export const contextualActionsAtom = atom<PlayerAction[]>((get) => {
  const actions = get(playerActionsAtom);
  return actions.filter(action => action.action_type === 'contextual');
});

// Derived atom to get sorted actions by priority
export const sortedPlayerActionsAtom = atom<PlayerAction[]>((get) => {
  const actions = get(playerActionsAtom);
  return [...actions].sort((a, b) => {
    // First sort by priority (higher priority first)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // Then by creation time (newer first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
});

// Fetch player actions for a specific campaign and user
export const fetchPlayerActionsAtom = atom(
  null,
  async (get, set, { campaignId, userId }: { campaignId: string; userId: string }) => {
    try {
      set(playerActionsLoadingAtom, true);
      set(playerActionsErrorAtom, null);

      const { data, error } = await supabase
        .from('player_actions')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out expired actions
      const now = new Date();
      const validActions = (data || []).filter(action => {
        const isExpired = action.expires_at && new Date(action.expires_at) <= now;
        return !isExpired;
      });

      set(playerActionsAtom, validActions);
    } catch (error) {
      set(playerActionsErrorAtom, (error as Error).message);
      console.error('Error fetching player actions:', error);
    } finally {
      set(playerActionsLoadingAtom, false);
    }
  }
);

// Clear player actions
export const clearPlayerActionsAtom = atom(
  null,
  async (get, set) => {
    set(playerActionsAtom, []);
    set(playerActionsErrorAtom, null);
  }
);

// Execute a player action
export const executePlayerActionAtom = atom(
  null,
  async (get, set, { action, campaignId }: { action: PlayerAction; campaignId: string }) => {
    try {
      // Here you would integrate with your existing action processing system
      // For now, we'll just log the action
      console.log('Executing player action:', {
        actionId: action.id,
        title: action.action_data.title,
        type: action.action_data.type,
        campaignId
      });

      // You can integrate this with your existing GameStateManager.processPlayerAction
      // or create a new endpoint for handling action execution

      return {
        success: true,
        action: action
      };
    } catch (error) {
      console.error('Error executing player action:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
);

// Track active player action subscriptions by campaign and user ID
let activePlayerActionSubscriptions: Record<string, (() => void)> = {};

// Initialize real-time subscription for player actions
export const initializePlayerActionsRealtimeAtom = atom(
  null,
  async (get, set, { campaignId, userId }: { campaignId: string; userId: string }) => {
    const subscriptionKey = `${campaignId}:${userId}`;
    
    // If we already have an active subscription for this campaign/user, return the existing cleanup
    if (activePlayerActionSubscriptions[subscriptionKey]) {
      console.log(`🎬 Reusing existing player actions subscription for: ${subscriptionKey}`);
      return activePlayerActionSubscriptions[subscriptionKey];
    }

    console.log(`🎬 Creating new robust player actions subscription for: ${subscriptionKey}`);
    
    const channelName = `player_actions:${campaignId}:${userId}`;
    
    // Create subscription with automatic reconnection using the new robust system
    const cleanup = createRealtimeSubscription(
      channelName,
      {
        postgres_changes: [{
          event: '*',
          schema: 'public',
          table: 'player_actions',
          filter: `campaign_id=eq.${campaignId} AND user_id=eq.${userId}`
        }]
      },
      (payload) => {
        console.log(`📨 [${channelName}] Received update:`, payload.eventType);
        
        const currentActions = get(playerActionsAtom);

        if (payload.eventType === 'INSERT') {
          const newAction = payload.new as PlayerAction;

          // Check if action is not expired
          if (!newAction.expires_at || new Date(newAction.expires_at) > new Date()) {
            const updatedActions = [...currentActions, newAction];
            set(playerActionsAtom, updatedActions);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedAction = payload.new as PlayerAction;
          const updatedActions = currentActions.map(action =>
            action.id === updatedAction.id ? updatedAction : action
          );
          set(playerActionsAtom, updatedActions);
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          const updatedActions = currentActions.filter(action => action.id !== deletedId);
          set(playerActionsAtom, updatedActions);
        }
      },
      5 // Max 5 reconnection attempts
    );

    // Store the cleanup function
    activePlayerActionSubscriptions[subscriptionKey] = cleanup;

    return cleanup;
  }
);

// Atom to clean up expired actions periodically
export const cleanupExpiredActionsAtom = atom(
  null,
  async (get, set) => {
    const currentActions = get(playerActionsAtom);
    const now = new Date();

    const validActions = currentActions.filter(action => {
      if (!action.expires_at) return true;
      return new Date(action.expires_at) > now;
    });

    if (validActions.length !== currentActions.length) {
      set(playerActionsAtom, validActions);
    }
  }
);

// AI-generated choices persistence
export const aiChoicesAtom = atom<Record<string, string[]>>({});

export const setAiChoicesAtom = atom(
  null,
  (get, set, { campaignId, choices }: { campaignId: string; choices: string[] }) => {
    const currentChoices = get(aiChoicesAtom);
    set(aiChoicesAtom, {
      ...currentChoices,
      [campaignId]: choices
    });
  }
);

export const getAiChoicesAtom = atom((get) => {
  return (campaignId: string): string[] => {
    const choices = get(aiChoicesAtom);
    return choices[campaignId] || [];
  };
});

export const clearAiChoicesAtom = atom(
  null,
  (get, set, campaignId: string) => {
    const currentChoices = get(aiChoicesAtom);
    const updatedChoices = { ...currentChoices };
    delete updatedChoices[campaignId];
    set(aiChoicesAtom, updatedChoices);
  }
);

// Get actions filtered by current game mode
export const getActionsByModeAtom = atom(
  null,
  (get, set, gameMode: 'exploration' | 'combat' | 'social' | 'rest') => {
    const actions = get(sortedPlayerActionsAtom);
    return actions.filter(action => action.game_mode === gameMode);
  }
); 