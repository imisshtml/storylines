import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { campaignHistoryAtom, type CampaignMessage } from '../atoms/campaignHistoryAtoms';
import { speak, type TTSProvider } from '../utils/elevenLabs';

export function useStoryNarrator() {
  const history = useAtomValue(campaignHistoryAtom);
  const lastProcessedId = useRef<number | null>(null);

  useEffect(() => {
    if (!history.length) return;

    // Find messages to narrate (only 'gm' and 'system' types)
    const narratableMessages = history.filter(msg => 
      msg.message_type === 'gm' || msg.message_type === 'system'
    );

    if (!narratableMessages.length) return;

    // Get the latest message
    const latestMessage = narratableMessages[narratableMessages.length - 1];
    
    // Skip if we've already processed this message or if it's the initial load
    if (lastProcessedId.current === null) {
      lastProcessedId.current = latestMessage.id;
      return;
    }

    if (lastProcessedId.current === latestMessage.id) return;

    // Narrate the new message
    speak(latestMessage.message, 'openai').catch((err: any) => {
      console.warn('TTS narration failed:', err);
    });

    lastProcessedId.current = latestMessage.id;
  }, [history]);
} 