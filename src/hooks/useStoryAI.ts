import { useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import { currentCampaignAtom } from '../atoms/campaignAtoms';

export type StoryEvent = {
  id: string;
  type: 'player' | 'dm' | 'system';
  content: string;
  timestamp: string;
  playerId?: string;
  playerName?: string;
};

export type StoryState = {
  events: StoryEvent[];
  isLoading: boolean;
  error: string | null;
  currentChoices: string[];
};

export function useStoryAI() {
  const [currentCampaign] = useAtom(currentCampaignAtom);
  const [storyState, setStoryState] = useState<StoryState>({
    events: [
      {
        id: '1',
        type: 'dm',
        content: 'The ancient trees loomed overhead, their branches intertwining to form a dense canopy that barely allowed any sunlight to penetrate. The air was thick with an otherworldly presence, and the silence was deafening. Your journey begins here, in the heart of the Dark Forest...',
        timestamp: new Date().toISOString(),
      }
    ],
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

    // Add player action to story
    const playerEvent: StoryEvent = {
      id: Date.now().toString(),
      type: 'player',
      content: action,
      timestamp: new Date().toISOString(),
      playerId,
      playerName,
    };

    setStoryState(prev => ({
      ...prev,
      events: [...prev.events, playerEvent],
      isLoading: true,
      error: null,
      currentChoices: [], // Clear choices while loading
    }));

    try {
      // Prepare context for the AI
      const context = {
        campaign: currentCampaign,
        storyHistory: storyState.events,
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

      // Add DM response to story
      const dmEvent: StoryEvent = {
        id: (Date.now() + 1).toString(),
        type: 'dm',
        content: data.response,
        timestamp: data.timestamp,
      };

      setStoryState(prev => ({
        ...prev,
        events: [...prev.events, dmEvent],
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
  }, [currentCampaign, storyState.events]);

  const sendChoice = useCallback(async (choice: string, playerId: string = 'player1', playerName: string = 'Player') => {
    await sendPlayerAction(`I choose to: ${choice}`, playerId, playerName);
  }, [sendPlayerAction]);

  const clearError = useCallback(() => {
    setStoryState(prev => ({ ...prev, error: null }));
  }, []);

  const resetStory = useCallback(() => {
    setStoryState({
      events: [],
      isLoading: false,
      error: null,
      currentChoices: [],
    });
  }, []);

  return {
    storyState,
    sendPlayerAction,
    sendChoice,
    clearError,
    resetStory,
  };
}