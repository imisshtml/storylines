import { supabase } from '../config/supabase';
import { AppState } from 'react-native';

// Connection state tracking
let lastConnectionCheck = Date.now();
let connectionCheckInterval: ReturnType<typeof setInterval> | null = null;
let isReconnecting = false;

// Realtime subscription management
const activeSubscriptions = new Map<string, {
  subscription: any;
  reconnectCount: number;
  lastError?: string;
  reconnectAttempts: number;
}>();

// Global registry to prevent duplicate subscriptions
const globalChannelRegistry = new Map<string, boolean>();

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
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
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
    if (responseTime > 15000) { // 15 seconds
      console.warn('Connection check slow:', responseTime, 'ms');
      return false;
    }
    
    lastConnectionCheck = Date.now();
    console.log(`Connection check successful (${responseTime}ms)`);
    return true;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

// Enhanced realtime subscription wrapper with automatic reconnection
export const createRealtimeSubscription = (
  channelName: string,
  config: any,
  onData: (payload: any) => void,
  maxReconnectAttempts: number = 5
) => {
  // Check if this channel is already registered
  if (globalChannelRegistry.has(channelName)) {
    console.warn(`⚠️ Channel ${channelName} already exists. Skipping duplicate subscription.`);
    
    // Return a no-op cleanup function for the duplicate attempt
    return () => {
      console.log(`🔄 No-op cleanup for duplicate channel: ${channelName}`);
    };
  }
  
  console.log(`🔌 Creating realtime subscription: ${channelName}`);
  globalChannelRegistry.set(channelName, true);
  
  const subscriptionData = {
    subscription: null as any,
    reconnectCount: 0,
    reconnectAttempts: 0,
    lastError: undefined as string | undefined
  };
  
  const createSubscription = () => {
    try {
      // Remove channel from Supabase if it exists to prevent conflicts
      const existingChannel = supabase.getChannels().find(ch => ch.topic === channelName);
      if (existingChannel) {
        console.log(`🗑️ Removing existing channel: ${channelName}`);
        supabase.removeChannel(existingChannel);
      }
      
      let channel = supabase.channel(channelName);
      
      // Add postgres changes listeners
      if (config.postgres_changes) {
        config.postgres_changes.forEach((pgConfig: any) => {
          channel = channel.on('postgres_changes', pgConfig, onData);
        });
      }

      channel.on('system', { event: '*' }, (event) => {
        if (event.type === 'join') {
          console.log('✅ Realtime joined the channel');
        } else if (event.type === 'leave') {
          console.warn('⚠️ Realtime left the channel');
        } else {
          console.log('📡 system event:', JSON.stringify(event, null, 2));
        }
      });

      
      // Subscribe with status monitoring
      const subscription = channel
        .subscribe((status: string, err?: Error) => {
          console.log(`📡 [${channelName}] Status: ${status}`, err ? err.message : '');
          
          if (status === 'SUBSCRIBED') {
            console.log(`✅ [${channelName}] Successfully connected`);
            subscriptionData.reconnectCount = 0;
            subscriptionData.reconnectAttempts = 0;
            subscriptionData.lastError = undefined;
          } 
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`❌ [${channelName}] Connection error: ${status}`, err);
            subscriptionData.lastError = `${status}: ${err?.message || 'Unknown error'}`;
            
            // Attempt reconnection with exponential backoff
            if (subscriptionData.reconnectAttempts < maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, subscriptionData.reconnectAttempts), 30000);
              subscriptionData.reconnectAttempts++;
              
              console.log(`🔄 [${channelName}] Scheduling reconnect attempt ${subscriptionData.reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`);
              
              setTimeout(() => {
                console.log(`🔄 [${channelName}] Attempting reconnection...`);
                
                // Cleanup old subscription
                try {
                  subscription.unsubscribe();
                } catch (cleanupError) {
                  console.warn('Error cleaning up old subscription:', cleanupError);
                }
                
                // Create new subscription
                subscriptionData.subscription = createSubscription();
              }, delay);
            } else {
              console.error(`💀 [${channelName}] Max reconnection attempts reached. Manual intervention required.`);
            }
          }
          else if (status === 'CLOSED') {
            console.log(`🚪 [${channelName}] Connection closed`);
          }
        });
      
      return subscription;
    } catch (error) {
      console.error(`💥 [${channelName}] Error creating subscription:`, error);
      throw error;
    }
  };
  
  subscriptionData.subscription = createSubscription();
  activeSubscriptions.set(channelName, subscriptionData);
  
  // Return cleanup function
  return () => {
    console.log(`🧹 [${channelName}] Cleaning up subscription`);
    const data = activeSubscriptions.get(channelName);
    if (data?.subscription) {
      try {
        data.subscription.unsubscribe();
        supabase.removeChannel(data.subscription);
      } catch (error) {
        console.warn(`Warning during ${channelName} cleanup:`, error);
      }
    }
    activeSubscriptions.delete(channelName);
    globalChannelRegistry.delete(channelName);
  };
};

export const socketListener = () => {
  

}

// Monitor all active subscriptions health
export const monitorSubscriptionHealth = () => {
  console.log('🏥 Checking subscription health...');
  console.log(`📊 Active Supabase channels: ${supabase.getChannels().length}`);
  console.log(`📊 Global registry entries: ${globalChannelRegistry.size}`);
  console.log(`📊 Active subscriptions tracked: ${activeSubscriptions.size}`);
  
  // List all Supabase channels
  supabase.getChannels().forEach((channel, index) => {
    console.log(`📺 [${index}] Supabase Channel: ${channel.topic} - State: ${channel.state}`);
  });
  
  // List all tracked subscriptions
  activeSubscriptions.forEach((data, channelName) => {
    if (data.lastError || data.reconnectAttempts > 0) {
      console.warn(`⚠️ [${channelName}] Health issue - Reconnect attempts: ${data.reconnectAttempts}, Last error: ${data.lastError}`);
    } else {
      console.log(`✅ [${channelName}] Healthy`);
    }
  });
  
  // List global registry
  console.log('🗂️ Global channel registry:', Array.from(globalChannelRegistry.keys()));
};

// Get current subscription status
export const getSubscriptionStatus = () => {
  return {
    supabaseChannels: supabase.getChannels().length,
    globalRegistry: globalChannelRegistry.size,
    trackedSubscriptions: activeSubscriptions.size,
    channels: Array.from(globalChannelRegistry.keys())
  };
};

// Force reconnect all subscriptions (for manual recovery)
export const reconnectAllSubscriptions = async () => {
  console.log('🔄 Force reconnecting all subscriptions...');
  
  // First refresh the main connection
  await refreshSupabaseConnection();
  
  // Clean up all active subscriptions and registry
  activeSubscriptions.forEach((data, channelName) => {
    data.reconnectAttempts = 0;
    data.lastError = undefined;
    
    if (data.subscription) {
      try {
        data.subscription.unsubscribe();
        supabase.removeChannel(data.subscription);
      } catch (error) {
        console.warn(`Error unsubscribing ${channelName}:`, error);
      }
    }
  });
  
  // Clear all registries to allow fresh subscriptions
  activeSubscriptions.clear();
  globalChannelRegistry.clear();
  
  console.log('🔄 All subscriptions and registry cleared. Ready for fresh connections.');
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
  
  // Set a timeout to ensure isReconnecting doesn't get stuck
  const timeoutId = setTimeout(() => {
    console.warn('Reconnection timeout - resetting isReconnecting flag');
    isReconnecting = false;
  }, 30000); // 30 second timeout
  
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
      // Wait briefly to avoid race with old Realtime connection
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test the connection with a simple query
    const connectionTest = await checkSupabaseConnection();
    if (!connectionTest) {
      console.warn('Connection test failed after refresh, but continuing...');
      // Don't throw here - let the app continue functioning
    } else {
      console.log('Supabase connection successfully refreshed and tested');
    }
    
  } catch (error) {
    console.error('Error refreshing connection:', error);
    // Don't re-throw the error to prevent blocking the app
  } finally {
    clearTimeout(timeoutId);
    isReconnecting = false;
    console.log('Reconnection process completed, flag reset');
  }
};

// Start periodic connection monitoring
export const startConnectionMonitoring = (interval: number = 60000): void => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  console.log(`Starting connection monitoring with ${interval/1000}s interval`);
  
  connectionCheckInterval = setInterval(async () => {
    try {
      // Skip check if already reconnecting
      if (isReconnecting) {
        console.log('Periodic check: Reconnection in progress, skipping check');
        return;
      }
      
      console.log('Periodic connection check...');
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        console.log('Periodic check: Connection lost, attempting to refresh...');
        await refreshSupabaseConnection();
        // Force reconnection of realtime subscriptions after refreshing auth/session
        await reconnectAllSubscriptions();
        // Check health after reconnection
        monitorSubscriptionHealth();
      } else {
        console.log('Periodic check: Connection healthy');
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

// Handle app state changes for better connection management
let appStateSubscription: any = null;

export const initializeAppStateMonitoring = () => {
  if (appStateSubscription) return;
  
  appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
    console.log('App state changed to:', nextAppState);
    
    if (nextAppState === 'active') {
      // App came to foreground - check connections
      console.log('App became active - checking connections...');
      
      // Quick connection check
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        console.log('Connection lost while app was in background - refreshing...');
        await refreshSupabaseConnection();
        await reconnectAllSubscriptions();
      }
      
      // Monitor subscription health
      monitorSubscriptionHealth();
    }
  });
  
  console.log('✅ App state monitoring initialized');
};

export const cleanupConnectionMonitoring = () => {
  stopConnectionMonitoring();
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  console.log('🧹 Connection monitoring cleaned up');
};

// Broadcast system for real-time action coordination
let campaignBroadcastChannel: any = null;

export const initializeCampaignBroadcast = (campaignId: string, callbacks: {
  onActionStarted: (data: { playerId: string, playerName: string, action: string }) => void;
  onActionCompleted: (data: { playerId: string, success: boolean }) => void;
}) => {
  console.log('📡 Initializing campaign broadcast for:', campaignId);
  
  // Clean up existing channel
  if (campaignBroadcastChannel) {
    supabase.removeChannel(campaignBroadcastChannel);
  }
  
  // Create new broadcast channel
  const channelName = `campaign_actions_${campaignId}`;
  console.log('📡 Creating broadcast channel:', channelName);
  
  campaignBroadcastChannel = supabase.channel(channelName)
    .on('broadcast', { event: 'action_started' }, (payload) => {
      console.log('📢 Received action_started broadcast:', payload);
      console.log('📢 action_started payload keys:', Object.keys(payload));
      console.log('📢 action_started payload.payload:', payload.payload);
      callbacks.onActionStarted(payload.payload);
    })
    .on('broadcast', { event: 'action_completed' }, (payload) => {
      console.log('📢 Received action_completed broadcast:', payload);
      console.log('📢 action_completed payload keys:', Object.keys(payload));
      console.log('📢 action_completed payload.payload:', payload.payload);
      callbacks.onActionCompleted(payload.payload);
    })
    .subscribe((status) => {
      console.log('📡 Campaign broadcast status:', status, 'for channel:', channelName);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Campaign broadcast channel ready:', channelName);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Campaign broadcast channel error:', channelName);
      }
    });
    
  return () => {
    if (campaignBroadcastChannel) {
      supabase.removeChannel(campaignBroadcastChannel);
      campaignBroadcastChannel = null;
      console.log('📡 Campaign broadcast cleaned up');
    }
  };
};

export const broadcastActionStarted = async (campaignId: string, data: {
  playerId: string;
  playerName: string;
  action: string;
}) => {
  if (!campaignBroadcastChannel) {
    console.warn('⚠️ No broadcast channel available for action_started');
    return;
  }
  
  console.log('📢 Broadcasting action_started:', data);
  console.log('📢 Channel status:', campaignBroadcastChannel.state);
  
  try {
    const result = await campaignBroadcastChannel.send({
      type: 'broadcast',
      event: 'action_started',
      payload: data
    });
    console.log('📢 action_started send result:', result);
  } catch (error) {
    console.error('❌ action_started broadcast failed:', error);
    console.error('❌ action_started error message:', error instanceof Error ? error.message : String(error));
  }
};

export const broadcastActionCompleted = async (campaignId: string, data: {
  playerId: string;
  success: boolean;
}) => {
  if (!campaignBroadcastChannel) {
    console.warn('⚠️ No broadcast channel available for action_completed');
    return;
  }
  
  console.log('📢 Broadcasting action_completed:', data);
  console.log('📢 Channel status:', campaignBroadcastChannel.state);
  console.log('📢 Channel topic:', campaignBroadcastChannel.topic);
  console.log('📢 Channel joinRef:', campaignBroadcastChannel.joinRef);
  
  try {
    const result = await campaignBroadcastChannel.send({
      type: 'broadcast',
      event: 'action_completed',
      payload: data
    });
    console.log('📢 Broadcast send result:', result);
    console.log('📢 Broadcast send result type:', typeof result);
    console.log('📢 Broadcast send result keys:', result ? Object.keys(result) : 'null');
  } catch (error) {
    console.error('❌ Broadcast send failed:', error);
    console.error('❌ Broadcast error type:', typeof error);
    console.error('❌ Broadcast error message:', error instanceof Error ? error.message : String(error));
    // Don't throw - just log the error like broadcastActionStarted
  }
}; 