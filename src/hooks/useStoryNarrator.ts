import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { campaignHistoryAtom, type CampaignMessage } from '@/atoms/campaignHistoryAtoms';
import { ttsProviderAtom } from '@/atoms/settingsAtoms';
import { speak } from '@/utils/elevenLabs';

/**
 * Plays the latest storyteller message via ElevenLabs whenever campaign history updates.
 * Only runs on client. Skips duplicates.
 */
export default function useStoryNarrator() {
  const [history] = useAtom(campaignHistoryAtom);
  const [ttsProvider] = useAtom(ttsProviderAtom);
  const lastId = useRef<number | null>(null);

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

    if (latest.message_type === 'gm' || latest.message_type === 'system') {
      speak(latest.message, ttsProvider);
    }

    lastId.current = latest.id;
  }, [history, ttsProvider]);
} 