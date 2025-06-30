import { Audio } from 'expo-av';
import { Buffer } from 'buffer';

// TTS Provider Configuration
export type TTSProvider = 'openai' | 'elevenlabs';

const OPENAI_API = 'https://api.openai.com/v1/audio/speech';
const ELEVEN_API = 'https://api.elevenlabs.io/v1/text-to-speech';

// Keys - set these before using
const OPENAI_KEY = 'YOUR_OPENAI_KEY_HERE';
const ELEVEN_KEY = 'YOUR_ELEVEN_KEY_HERE';

const ELEVEN_VOICE_ID = 'QjB4YEs2DhdhTmZbJqFQ';

async function fetchOpenAITTS(text: string): Promise<string> {
  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
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
    const uri = provider === 'openai' 
      ? await fetchOpenAITTS(text)
      : await fetchElevenLabsTTS(text);
      
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    await sound.playAsync();
  } catch (err) {
    console.error(`[${provider.toUpperCase()} TTS] speak error`, err);
    throw err;
  }
} 