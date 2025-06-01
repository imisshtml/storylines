import { atom } from 'jotai';

export type Campaign = {
  id: string;
  name: string;
  theme: string;
  startingLevel: number;
  tone: 'serious' | 'humorous' | 'grimdark';
  excludedTags: string[];
  status: 'creation' | 'waiting' | 'in_progress';
  players: Player[];
  inviteCode: string;
};

export type Player = {
  id: string;
  name: string;
  ready: boolean;
  avatar?: string;
};

export const campaignsAtom = atom<Campaign[]>([]);
export const currentCampaignAtom = atom<Campaign | null>(null);