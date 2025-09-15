import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import type { Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

function createNewClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
      encode: (payload: any, callback: any) => {
        callback(JSON.stringify(payload));
      },
      decode: (payload: any, callback: any) => {
        try {
          callback(JSON.parse(payload));
        } catch (error) {
          console.error('Realtime decode error:', error);
          callback(payload);
        }
      }
    },
    global: {
      headers: {
        'x-client-info': 'storylines-app'
      }
    }
  });
}

export let supabase = createNewClient();

// Hard-reset the Supabase client (mimics app relaunch) while preserving session
export async function hardResetSupabase(existingSession?: Session | null): Promise<void> {
  try {
    // Create a fresh client instance
    const fresh = createNewClient();
    // Swap exported binding
    supabase = fresh;
    // Re-apply session if provided
    if (existingSession?.access_token && existingSession?.refresh_token) {
      try {
        await supabase.auth.setSession({
          access_token: existingSession.access_token,
          refresh_token: existingSession.refresh_token,
        });
      } catch (e) {
        console.warn('[supabase] setSession failed during hard reset:', e);
      }
    }
  } catch (e) {
    console.error('hardResetSupabase failed:', e);
  }
}