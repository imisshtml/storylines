import { supabase } from '../config/supabase';

// Connection state tracking
let lastConnectionCheck = Date.now();
let connectionCheckInterval: ReturnType<typeof setInterval> | null = null;
let isReconnecting = false;

// Enhanced error types that indicate connection issues
const CONNECTION_ERROR_CODES = [
  'PGRST301', // JWT expired
  'PGRST302', // JWT invalid
  'PGRST116', // JWT missing
  'network_error',
  'timeout',
  'fetch_error'
];

const CONNECTION_ERROR_MESSAGES = [
  'fetch',
  'network',
  'timeout',
  'connection',
  'jwt',
  'expired',
  'invalid',
  'unauthorized'
];

export const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  const errorCode = error.code || error.error_code || '';
  const errorMessage = error.message || error.details || '';
  
  // Check for specific error codes
  if (CONNECTION_ERROR_CODES.some(code => errorCode.includes(code))) {
    return true;
  }
  
  // Check for connection-related error messages
  if (CONNECTION_ERROR_MESSAGES.some(msg => 
    errorString.includes(msg) || 
    errorMessage.toLowerCase().includes(msg)
  )) {
    return true;
  }
  
  return false;
};

export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const startTime = Date.now();
    
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
    
    const queryPromise = supabase
      .from('campaigns')
      .select('count')
      .limit(1);
    
    const { error } = await Promise.race([queryPromise, timeoutPromise]) as any;
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.warn('Connection check failed:', error);
      return false;
    }
    
    // Consider slow responses as potential connection issues
    if (responseTime > 10000) { // 10 seconds
      console.warn('Connection check slow:', responseTime, 'ms');
      return false;
    }
    
    lastConnectionCheck = Date.now();
    return true;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

export const withConnectionRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  operationName: string = 'operation'
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check connection before operation if it's been a while
      const timeSinceLastCheck = Date.now() - lastConnectionCheck;
      if (timeSinceLastCheck > 30000) { // 30 seconds
        const isConnected = await checkSupabaseConnection();
        if (!isConnected) {
          await refreshSupabaseConnection();
        }
      }
      
      console.log(`Attempting ${operationName} (attempt ${i + 1}/${maxRetries})`);
      const result = await operation();
      
      // Operation succeeded
      if (i > 0) {
        console.log(`${operationName} succeeded after ${i + 1} attempts`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`${operationName} failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      // If it's a connection error, try to refresh the connection
      if (isConnectionError(error)) {
        console.log('Connection error detected, attempting to refresh connection...');
        await refreshSupabaseConnection();
      }
      
      // Don't retry if it's the last attempt
      if (i < maxRetries - 1) {
        const retryDelay = delay * Math.pow(2, i); // Exponential backoff
        console.log(`Retrying ${operationName} in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw new Error(`${operationName} failed after ${maxRetries} attempts: ${lastError!.message}`);
};

export const refreshSupabaseConnection = async (): Promise<void> => {
  if (isReconnecting) {
    console.log('Reconnection already in progress, skipping...');
    return;
  }
  
  isReconnecting = true;
  
  try {
    console.log('Refreshing Supabase connection...');
    
    // First try to refresh the auth session
    const { data: { session }, error: authError } = await supabase.auth.refreshSession();
    
    if (authError) {
      console.error('Failed to refresh auth session:', authError);
      
      // If refresh fails, try to get the current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession) {
        console.error('No valid session found, user may need to re-authenticate');
        throw new Error('Authentication session expired. Please log in again.');
      }
    } else {
      console.log('Successfully refreshed Supabase auth session');
    }
    
    // Test the connection with a simple query
    const connectionTest = await checkSupabaseConnection();
    if (!connectionTest) {
      throw new Error('Connection test failed after refresh');
    }
    
    console.log('Supabase connection successfully refreshed and tested');
    
  } catch (error) {
    console.error('Error refreshing connection:', error);
    throw error;
  } finally {
    isReconnecting = false;
  }
};

// Start periodic connection monitoring
export const startConnectionMonitoring = (interval: number = 60000): void => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  connectionCheckInterval = setInterval(async () => {
    try {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        console.log('Periodic check: Connection lost, attempting to refresh...');
        await refreshSupabaseConnection();
      }
    } catch (error) {
      console.error('Error in periodic connection check:', error);
    }
  }, interval);
  
  console.log(`Started connection monitoring with ${interval}ms interval`);
};

// Stop connection monitoring
export const stopConnectionMonitoring = (): void => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
    console.log('Stopped connection monitoring');
  }
};

// Enhanced operation wrapper with user-friendly error messages
export const withConnectionHandling = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'operation',
  userFriendlyName: string = 'operation'
): Promise<T> => {
  try {
    return await withConnectionRetry(operation, 3, 1000, operationName);
  } catch (error) {
    console.error(`Failed to complete ${operationName}:`, error);
    
    if (isConnectionError(error)) {
      throw new Error(`Connection lost while ${userFriendlyName}. Please check your internet connection and try again.`);
    }
    
    throw new Error(`Failed to ${userFriendlyName}. Please try again.`);
  }
}; 