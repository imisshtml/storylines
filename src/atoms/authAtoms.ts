import { atom } from 'jotai';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Session } from '@supabase/supabase-js';
import { addUserToOnlineStatus, removeUserFromOnlineStatus } from '../utils/onlineStatusManager';
import { router } from 'expo-router';

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  phone?: string;
};

export const userAtom = atom<AuthUser | null>(null);
export const sessionAtom = atom<Session | null>(null);
export const authLoadingAtom = atom(true);
export const authErrorAtom = atom<string | null>(null);

// AsyncStorage keys
const STORAGE_KEYS = {
  USER_SESSION: 'user_session',
  USER_DATA: 'user_data',
};

// Helper function to find user by username or email
const findUserByUsernameOrEmail = async (identifier: string) => {
  // First try to find by username
  const { data: profileData } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', identifier)
    .single();

  if (profileData) {
    return profileData.email;
  }

  // If not found by username, assume it's an email
  return identifier;
};

// Helper functions for AsyncStorage
const saveUserSession = async (session: Session, user: AuthUser) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user session:', error);
  }
};

const getUserSession = async (): Promise<{ session: Session | null; user: AuthUser | null }> => {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    
    return {
      session: sessionData ? JSON.parse(sessionData) : null,
      user: userData ? JSON.parse(userData) : null,
    };
  } catch (error) {
    console.error('Error getting user session:', error);
    return { session: null, user: null };
  }
};

const clearUserSession = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Error clearing user session:', error);
  }
};

// Helper function to trigger campaign fetch
const triggerCampaignFetch = async (set: any) => {
  try {
    const { fetchCampaignsAtom } = await import('./campaignAtoms');
    set(fetchCampaignsAtom, null); // Trigger the fetch action
  } catch (error) {
    console.error('Error triggering campaign fetch:', error);
  }
};

// Helper function to clear campaigns
const clearCampaigns = async (set: any) => {
  try {
    const { campaignsAtom } = await import('./campaignAtoms');
    set(campaignsAtom, []);
  } catch (error) {
    console.error('Error clearing campaigns:', error);
  }
};

// Atom to handle sign in
export const signInAtom = atom(
  null,
  async (get, set, { emailOrUsername, password }: { emailOrUsername: string; password: string }) => {
    try {
      set(authLoadingAtom, true);
      set(authErrorAtom, null);

      // Find the actual email if username was provided
      const email = await findUserByUsernameOrEmail(emailOrUsername);

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
          .select('username, phone')
          .eq('id', data.user.id)
          .single();

        const userData: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          username: profile?.username,
          phone: profile?.phone,
        };

        set(userAtom, userData);

        // Save to AsyncStorage for persistence
        await saveUserSession(data.session, userData);

        // Fetch campaigns after successful login
        await triggerCampaignFetch(set);

        // Add user to online status for all their campaigns
        await addUserToOnlineStatus(data.user.id);
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
  async (get, set, { email, password, username, phone }: { email: string; password: string; username?: string; phone?: string }) => {
    try {
      set(authLoadingAtom, true);
      set(authErrorAtom, null);

      // Check if username already exists
      if (username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (existingUser) {
          throw new Error('Username already taken');
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
            phone: phone || null,
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

      const user = get(userAtom);
      
      // Remove user from online status before signing out
      if (user?.id) {
        await removeUserFromOnlineStatus(user.id);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear AsyncStorage
      await clearUserSession();

      set(userAtom, null);
      set(sessionAtom, null);

      // Clear campaigns when signing out
      await clearCampaigns(set);

      // Navigate to login screen to ensure UI resets
      try {
        router.replace('/login');
      } catch (navErr) {
        console.warn('[Auth] Navigation error on sign out:', navErr);
      }
    } catch (error) {
      set(authErrorAtom, (error as Error).message);
      throw error;
    } finally {
      set(authLoadingAtom, false);
    }
  }
);

// Initialize auth state with persistence
export const initializeAuthAtom = atom(
  null,
  async (get, set) => {
    try {
      set(authLoadingAtom, true);

      // First, check AsyncStorage for saved session
      const { session: savedSession, user: savedUser } = await getUserSession();

      if (savedSession && savedUser) {
        // Verify the saved session is still valid with Supabase
        await supabase.auth.setSession({
          access_token: savedSession.access_token,
          refresh_token: savedSession.refresh_token,
        });
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          // Session is still valid, use it
          set(sessionAtom, currentSession);
          set(userAtom, savedUser);

          // Fetch campaigns for authenticated user
          await triggerCampaignFetch(set);

          // Add user to online status when app initializes with valid session
          await addUserToOnlineStatus(currentSession.user.id);
        } else {
          // Session expired, clear AsyncStorage and get fresh session
          await clearUserSession();
          
          const { data: { session: freshSession } } = await supabase.auth.getSession();
          
          if (freshSession?.user) {
            set(sessionAtom, freshSession);
            
            // Fetch user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, phone')
              .eq('id', freshSession.user.id)
              .single();

            const userData: AuthUser = {
              id: freshSession.user.id,
              email: freshSession.user.email!,
              username: profile?.username,
              phone: profile?.phone,
            };

            set(userAtom, userData);
            await saveUserSession(freshSession, userData);

            // Fetch campaigns for authenticated user
            await triggerCampaignFetch(set);

            // Add user to online status with fresh session
            await addUserToOnlineStatus(freshSession.user.id);
          }
        }
      } else {
        // No saved session, check Supabase directly
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          set(sessionAtom, session);
          
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, phone')
            .eq('id', session.user.id)
            .single();

          const userData: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            username: profile?.username,
            phone: profile?.phone,
          };

          set(userAtom, userData);
          await saveUserSession(session, userData);

          // Fetch campaigns for authenticated user
          await triggerCampaignFetch(set);

          // Add user to online status
          await addUserToOnlineStatus(session.user.id);
        }
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          set(sessionAtom, session);
          
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, phone')
            .eq('id', session.user.id)
            .single();

          const userData: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            username: profile?.username,
            phone: profile?.phone,
          };

          set(userAtom, userData);
          await saveUserSession(session, userData);

          // Fetch campaigns for authenticated user
          await triggerCampaignFetch(set);

          // Add user to online status on auth state change
          await addUserToOnlineStatus(session.user.id);
        } else {
          // User signed out
          const currentUser = get(userAtom);
          if (currentUser?.id) {
            await removeUserFromOnlineStatus(currentUser.id);
          }
          
          await clearUserSession();
          set(userAtom, null);
          set(sessionAtom, null);

          // Clear campaigns when signing out
          await clearCampaigns(set);
        }
      });
    } catch (error) {
      set(authErrorAtom, (error as Error).message);
      console.error('Auth initialization error:', error);
    } finally {
      set(authLoadingAtom, false);
    }
  }
);