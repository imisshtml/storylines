import { atom } from 'jotai';

export type StoryEvent = {
  id: string;
  type: 'player' | 'dm' | 'system';
  content: string;
  timestamp: string;
  playerId?: string;
  playerName?: string;
};

export type StorySession = {
  id: string;
  campaignId: string;
  events: StoryEvent[];
  isActive: boolean;
  lastUpdated: string;
};

// Current story session
export const currentStorySessionAtom = atom<StorySession | null>(null);

// Story loading state
export const storyLoadingAtom = atom(false);

// Story error state
export const storyErrorAtom = atom<string | null>(null);

// Derived atom for current story events
export const currentStoryEventsAtom = atom(
  (get) => get(currentStorySessionAtom)?.events || []
);

// Atom to add a new story event
export const addStoryEventAtom = atom(
  null,
  (get, set, event: StoryEvent) => {
    const currentSession = get(currentStorySessionAtom);
    if (currentSession) {
      set(currentStorySessionAtom, {
        ...currentSession,
        events: [...currentSession.events, event],
        lastUpdated: new Date().toISOString(),
      });
    }
  }
);

// Atom to initialize a new story session
export const initializeStorySessionAtom = atom(
  null,
  (get, set, campaignId: string) => {
    const newSession: StorySession = {
      id: `session_${Date.now()}`,
      campaignId,
      events: [],
      isActive: true,
      lastUpdated: new Date().toISOString(),
    };
    set(currentStorySessionAtom, newSession);
  }
);