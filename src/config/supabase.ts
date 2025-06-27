import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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