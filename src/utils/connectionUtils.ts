import { supabase } from '../config/supabase';

export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('campaigns').select('count').limit(1);
    return !error;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

export const withConnectionRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
};

export const refreshSupabaseConnection = async (): Promise<void> => {
  try {
    // Force refresh the auth session
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Failed to refresh session:', error);
    } else {
      console.log('Successfully refreshed Supabase session');
    }
  } catch (error) {
    console.error('Error refreshing connection:', error);
  }
}; 