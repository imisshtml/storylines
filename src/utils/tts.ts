import { Audio } from 'expo-av';
import { Buffer } from 'buffer';

// TTS Provider Configuration
export type TTSProvider = 'openai' | 'elevenlabs';

const OPENAI_API = 'https://api.openai.com/v1/audio/speech';
const ELEVEN_API = 'https://api.elevenlabs.io/v1/text-to-speech';

// Keys - set these before using
const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const ELEVEN_KEY = 'YOUR_ELEVEN_KEY_HERE';

const ELEVEN_VOICE_ID = 'QjB4YEs2DhdhTmZbJqFQ';

// Track the currently playing sound so we can stop it on demand
let currentSound: Audio.Sound | null = null;

async function fetchOpenAITTS(text: string): Promise<string> {
  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // Faster model vs hd
      model: 'tts-1',
      input: text,
      voice: 'onyx'
    })
  });

  if (!res.ok) {
    throw new Error(`OpenAI TTS failed: ${res.status} ${await res.text()}`);
  }

  const buffer = await res.arrayBuffer();
  return `data:audio/mpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function fetchElevenLabsTTS(text: string): Promise<string> {
  const res = await fetch(`${ELEVEN_API}/${ELEVEN_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg'
    },
    body: JSON.stringify({
      text,
      voice_settings: { stability: 0.3, similarity_boost: 0.6 }
    })
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${await res.text()}`);
  }

  const buffer = await res.arrayBuffer();
  return `data:audio/mpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

export async function speak(text: string, provider: TTSProvider = 'openai') {
  try {
    if (provider === 'openai' && !OPENAI_KEY) {
      throw new Error('OpenAI key missing');
    }
    const uri = provider === 'openai' 
      ? await fetchOpenAITTS(text)
      : await fetchElevenLabsTTS(text);

    // Stop any previous sound before starting a new one
    if (currentSound) {
      try { await currentSound.stopAsync(); } catch {}
      try { await currentSound.unloadAsync(); } catch {}
      currentSound = null;
    }

    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    currentSound = sound;

    // Auto-cleanup after playback finishes
    sound.setOnPlaybackStatusUpdate(async (status: any) => {
      try {
        if (status && status.isLoaded && (status.didJustFinish || status.positionMillis >= status.durationMillis)) {
          await sound.unloadAsync();
          if (currentSound === sound) {
            currentSound = null;
          }
        }
      } catch {}
    });

    await sound.playAsync();
  } catch (err) {
    console.error(`[${provider.toUpperCase()} TTS] speak error`, err);
    throw err;
  }
} 

export function isTTSConfigured(provider: TTSProvider): boolean {
  if (provider === 'openai') return !!OPENAI_KEY;
  if (provider === 'elevenlabs') return !!ELEVEN_KEY && ELEVEN_KEY !== 'YOUR_ELEVEN_KEY_HERE';
  return false;
}

export async function stopTTS() {
  try {
    if (currentSound) {
      try { await currentSound.stopAsync(); } catch {}
      try { await currentSound.unloadAsync(); } catch {}
      currentSound = null;
    }
  } catch {}
}