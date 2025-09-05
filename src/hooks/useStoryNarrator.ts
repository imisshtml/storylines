import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { campaignHistoryAtom, type CampaignMessage } from '@/atoms/campaignHistoryAtoms';
import { ttsProviderAtom, ttsEnabledAtom, ttsAvailableAtom, setTTSAvailableAtom, addTTSLoadingMessageIdAtom, removeTTSLoadingMessageIdAtom, lastNarratedMessageIdAtom } from '@/atoms/ttsAtom';
import { speak, isTTSConfigured } from '../utils/tts';

/**
 * Plays the latest storyteller message via ElevenLabs whenever campaign history updates.
 * Only runs on client. Skips duplicates.
 */
export default function useStoryNarrator() {
  const [history] = useAtom(campaignHistoryAtom);
  const [ttsProvider] = useAtom(ttsProviderAtom);
  const [ttsEnabled] = useAtom(ttsEnabledAtom);
  const [ttsAvailable] = useAtom(ttsAvailableAtom);
  const [, setAvailable] = useAtom(setTTSAvailableAtom);
  const lastId = useRef<number | null>(null);
  const [, addLoading] = useAtom(addTTSLoadingMessageIdAtom);
  const [, removeLoading] = useAtom(removeTTSLoadingMessageIdAtom);
  const [, setLastNarrated] = useAtom(lastNarratedMessageIdAtom);

  // On first mount, set baseline so old history isn't narrated
  useEffect(() => {
    if (lastId.current === null && history.length) {
      lastId.current = history[history.length - 1].id;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for new storyteller/system messages after baseline
  useEffect(() => {
    if (!history.length) return;

    const latest: CampaignMessage = history[history.length - 1];
    if (latest.id === lastId.current) return;

    if (ttsEnabled && ttsAvailable && isTTSConfigured(ttsProvider)) {
      if (latest.message_type === 'gm' || latest.message_type === 'system') {
        try { addLoading(latest.id); } catch {}
        speak(latest.message, ttsProvider)
          .catch(() => { try { setAvailable(false); } catch {} })
          .finally(() => { try { removeLoading(latest.id); } catch {} });
        try { setLastNarrated(latest.id); } catch {}
      }
    }

    lastId.current = latest.id;
  }, [history, ttsProvider, ttsEnabled, ttsAvailable, setAvailable, addLoading, removeLoading]);
} 
