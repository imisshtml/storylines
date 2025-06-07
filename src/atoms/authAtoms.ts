import { atom } from 'jotai';
import { supabase } from '../config/supabase';
import type { User, Session } from '@supabase/supabase-js';

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
};

export const userAtom = atom<AuthUser | null>(null);
export const sessionAtom = atom<Session | null>(null);
export const authLoadingAtom = atom(true);
export const authErrorAtom = atom<string | null>(null);

// Atom to handle sign in
export const signInAtom = atom(
  null,
  async (get, set, { email, password }: { email: string; password: string }) => {
    try {
      set(authLoadingAtom, true);
      set(authErrorAtom, null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user && data.session) {
        set(sessionAtom, data.session);
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .single();

        set(userAtom, {
          id: data.user.id,
          email: data.user.email!,
          username: profile?.username,
        });
      }

      return data;
    } catch (error) {
      set(authErrorAtom, (error as Error).message);
      throw error;
    } finally {
      set(authLoadingAtom, false);
    }
  }
);

// Atom to handle sign up
export const signUpAtom = atom(
  null,
  async (get, set, { email, password, username }: { email: string; password: string; username?: string }) => {
    try {
      set(authLoadingAtom, true);
      set(authErrorAtom, null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      set(authErrorAtom, (error as Error).message);
      throw error;
    } finally {
      set(authLoadingAtom, false);
    }
  }
);

// Atom to handle sign out
export const signOutAtom = atom(
  null,
  async (get, set) => {
    try {
      set(authLoadingAtom, true);
      set(authErrorAtom, null);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set(userAtom, null);
      set(sessionAtom, null);
    } catch (error) {
      set(authErrorAtom, (error as Error).message);
      throw error;
    } finally {
      set(authLoadingAtom, false);
    }
  }
);

// Initialize auth state
export const initializeAuthAtom = atom(
  null,
  async (get, set) => {
    try {
      set(authLoadingAtom, true);

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set(sessionAtom, session);
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        set(userAtom, {
          id: session.user.id,
          email: session.user.email!,
          username: profile?.username,
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          set(sessionAtom, session);
          
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();

          set(userAtom, {
            id: session.user.id,
            email: session.user.email!,
            username: profile?.username,
          });
        } else {
          set(userAtom, null);
          set(sessionAtom, null);
        }
      });
    } catch (error) {
      set(authErrorAtom, (error as Error).message);
    } finally {
      set(authLoadingAtom, false);
    }
  }
);