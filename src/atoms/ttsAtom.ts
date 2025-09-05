import { atom } from 'jotai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TTSProvider } from '../utils/tts';

const STORAGE_KEY = 'tts_provider';
const STORAGE_KEY_ENABLED = 'tts_enabled';

// TTS Provider preference atom with persistence
export const ttsProviderAtom = atom<TTSProvider>('openai');

// Whether TTS is enabled by the user (on/off toggle)
export const ttsEnabledAtom = atom<boolean>(true);

// Whether TTS is currently available (e.g., provider up, configured, etc.)
export const ttsAvailableAtom = atom<boolean>(true);

// Load TTS provider from storage
export const loadTTSProviderAtom = atom(
  null,
  async (get, set) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'openai' || stored === 'elevenlabs') {
        set(ttsProviderAtom, stored);
      }
    } catch (error) {
      console.error('Error loading TTS provider preference:', error);
    }
  }
);

// Save TTS provider to storage
export const saveTTSProviderAtom = atom(
  null,
  async (get, set, provider: TTSProvider) => {
    try {
      set(ttsProviderAtom, provider);
      await AsyncStorage.setItem(STORAGE_KEY, provider);
    } catch (error) {
      console.error('Error saving TTS provider preference:', error);
    }
  }
); 

// Load TTS enabled state from storage
export const loadTTSEnabledAtom = atom(
  null,
  async (get, set) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_ENABLED);
      if (stored === 'true' || stored === 'false') {
        set(ttsEnabledAtom, stored === 'true');
      }
    } catch (error) {
      console.error('Error loading TTS enabled state:', error);
    }
  }
);

// Save TTS enabled state to storage
export const saveTTSEnabledAtom = atom(
  null,
  async (get, set, enabled: boolean) => {
    try {
      set(ttsEnabledAtom, enabled);
      await AsyncStorage.setItem(STORAGE_KEY_ENABLED, enabled ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving TTS enabled state:', error);
    }
  }
);

// Setter to update availability at runtime (e.g., when requests fail)
export const setTTSAvailableAtom = atom(
  null,
  (get, set, available: boolean) => {
    set(ttsAvailableAtom, available);
  }
);

// Track which message IDs are currently loading/playing TTS
export const ttsLoadingMessageIdsAtom = atom<Set<number>>(new Set<number>());

export const addTTSLoadingMessageIdAtom = atom(
  null,
  (get, set, messageId: number) => {
    const current = get(ttsLoadingMessageIdsAtom);
    const next = new Set(current);
    next.add(messageId);
    set(ttsLoadingMessageIdsAtom, next);
  }
);

export const removeTTSLoadingMessageIdAtom = atom(
  null,
  (get, set, messageId: number) => {
    const current = get(ttsLoadingMessageIdsAtom);
    if (!current.has(messageId)) return;
    const next = new Set(current);
    next.delete(messageId);
    set(ttsLoadingMessageIdsAtom, next);
  }
);

// Track the last message id that was narrated (so UI can animate exactly that one)
export const lastNarratedMessageIdAtom = atom<number | null>(null);