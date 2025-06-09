import { useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import { currentCampaignAtom } from '../atoms/campaignAtoms';
import { addCampaignMessageAtom } from '../atoms/campaignHistoryAtoms';

export type StoryEvent = {
  id: string;
  type: 'player' | 'dm' | 'system';
  content: string;
  timestamp: string;
  playerId?: string;
  playerName?: string;
};

export type StoryState = {
  isLoading: boolean;
  error: string | null;
  currentChoices: string[];
};

export function useStoryAI() {
  const [currentCampaign] = useAtom(currentCampaignAtom);
  const [, addCampaignMessage] = useAtom(addCampaignMessageAtom);
  const [storyState, setStoryState] = useState<StoryState>({
    isLoading: false,
    error: null,
    currentChoices: [
      'Explore deeper into the forest',
      'Search for signs of civilization',
      'Set up camp for the night',
      'Listen carefully for any sounds',
    ],
  });

  const sendPlayerAction = useCallback(async (action: string, playerId: string = 'player1', playerName: string = 'Player') => {
    if (!currentCampaign || !action.trim()) return;

    setStoryState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      currentChoices: [], // Clear choices while loading
    }));

    try {
      // Add player message to campaign history
      await addCampaignMessage({
        campaign_uid: currentCampaign.uid,
        message: action,
        author: playerName,
        message_type: 'player',
      });

      // Prepare context for the AI
      const context = {
        campaign: currentCampaign,
        storyHistory: [], // We'll get this from campaign_history now
      };

      // Send request to our API route
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: currentCampaign.id,
          message: `Player action: ${action}`,
          context,
          playerAction: action,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add DM response to campaign history
      await addCampaignMessage({
        campaign_uid: currentCampaign.uid,
        message: data.response,
        author: 'DM',
        message_type: 'dm',
      });

      setStoryState(prev => ({
        ...prev,
        isLoading: false,
        currentChoices: data.choices || [], // Use choices from AI response
      }));

    } catch (error) {
      console.error('Error sending player action:', error);
      setStoryState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get DM response',
        currentChoices: [], // Clear choices on error
      }));
    }
  }, [currentCampaign, addCampaignMessage]);

  const sendChoice = useCallback(async (choice: string, playerId: string = 'player1', playerName: string = 'Player') => {
    await sendPlayerAction(`I choose to: ${choice}`, playerId, playerName);
  }, [sendPlayerAction]);

  const clearError = useCallback(() => {
    setStoryState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    storyState,
    sendPlayerAction,
    sendChoice,
    clearError,
  };
}