import { atom } from 'jotai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TTSProvider } from '@/utils/elevenLabs';

const STORAGE_KEY = 'tts_provider';

// TTS Provider preference atom with persistence
export const ttsProviderAtom = atom<TTSProvider>('openai');

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