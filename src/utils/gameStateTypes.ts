// Core Game State Types for Multiplayer D&D

import { Campaign } from '../atoms/campaignAtoms';
import { Character } from '../atoms/characterAtoms';

export type GameMode = 'exploration' | 'social' | 'combat' | 'rest';

export interface DiceRoll {
  sides: number;
  result: number;
  modifier: number;
  total: number;
  type: 'ability' | 'skill' | 'attack' | 'damage' | 'initiative' | 'save';
  description: string;
}

export interface DiceResult {
  playerId: string;
  characterId: string;
  rolls: DiceRoll[];
  success: boolean;
  criticalSuccess?: boolean;
  criticalFailure?: boolean;
  timestamp: string;
}

export interface PlayerAction {
  id: string;
  playerId: string;
  characterId: string;
  campaignId: string;
  type: 'movement' | 'attack' | 'spell' | 'skill' | 'social' | 'item' | 'other';
  description: string;
  target?: string; // target player/npc/object
  requiredRolls?: {
    type: DiceRoll['type'];
    sides: number;
    modifier: number;
    difficulty?: number;
  }[];
  timestamp: string;
  status: 'pending' | 'processing' | 'resolved' | 'invalid';
}

export interface EnvironmentState {
  location: string;
  description: string;
  lighting: 'bright' | 'dim' | 'dark';
  weather?: string;
  hazards?: string[];
  npcs?: NPC[];
  interactables?: Interactable[];
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  attitude: 'friendly' | 'neutral' | 'hostile';
  ac?: number;
  hp?: number;
  maxHp?: number;
  abilities?: Record<string, number>;
}

export interface Interactable {
  id: string;
  name: string;
  description: string;
  type: 'object' | 'door' | 'container' | 'trap' | 'mechanism';
  state: 'available' | 'used' | 'broken' | 'locked';
}

export interface PlayerState {
  playerId: string;
  character: Character;
  currentHp: number;
  tempHp: number;
  conditions: string[];
  position?: { x: number; y: number }; // For combat positioning
  initiative?: number;
  availableActions: string[];
  personalizedChoices: string[];
  lastActionTime: string;
  isOnline: boolean;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  environment: EnvironmentState;
  activeNPCs: NPC[];
  objectives?: string[];
  secrets?: string[];
  combatActive: boolean;
  socialEncounter?: {
    type: 'negotiation' | 'interrogation' | 'persuasion' | 'intimidation';
    participants: string[];
    difficulty: number;
  };
}

export interface CombatState {
  isActive: boolean;
  round: number;
  currentTurn: number;
  turnOrder: string[]; // Player IDs in initiative order
  combatants: {
    playerId: string;
    initiative: number;
    hasActed: boolean;
    hasMovement: boolean;
    hasBonusAction: boolean;
    hasReaction: boolean;
  }[];
}

export interface GameState {
  id: string;
  campaignId: string;
  campaign: Campaign;
  currentScene: Scene;
  playerStates: Map<string, PlayerState>;
  mode: GameMode;
  actionQueue: PlayerAction[];
  actionHistory: PlayerAction[];
  combatState?: CombatState;
  lastUpdated: string;
  version: number; // For optimistic concurrency control
}

export interface GameResponse {
  success: boolean;
  gameState: GameState;
  narrative?: string;
  diceResults?: DiceResult[];
  personalizedChoices?: Record<string, string[]>; // playerId -> choices
  modeTransition?: {
    from: GameMode;
    to: GameMode;
    reason: string;
  };
  errors?: string[];
  broadcastToPlayers?: string[]; // Player IDs to notify
}

export interface GameActionRequest {
  campaignId: string;
  playerId: string;
  characterId: string;
  action: string;
  actionType?: PlayerAction['type'];
  target?: string;
  metadata?: Record<string, any>;
}

export interface GameStateSnapshot {
  gameState: GameState;
  playerChoices: Record<string, string[]>;
  timestamp: string;
}

// Utility types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface GameStateApiResponse extends ApiResponse<GameState> {
  personalizedChoices?: Record<string, string[]>;
  narrative?: string;
  diceResults?: DiceResult[];
  modeTransition?: GameResponse['modeTransition'];
}