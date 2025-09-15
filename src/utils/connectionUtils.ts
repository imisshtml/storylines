import { supabase, hardResetSupabase } from '../config/supabase';
import { AppState } from 'react-native';
import { addUserToOnlineStatus, removeUserFromOnlineStatus } from './onlineStatusManager';

// Connection state tracking
let lastConnectionCheck = Date.now();
let connectionCheckInterval: ReturnType<typeof setInterval> | null = null;
let isReconnecting = false;
let lastGlobalReconnectAt = 0;

// Realtime subscription management
const activeSubscriptions = new Map<string, {
  subscription: any;
  reconnectCount: number;
  lastError?: string;
  reconnectAttempts: number;
  recreate?: () => any;
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
      console.log('Connection check failed:', error);
      return false;
    }
    
    // Consider slow responses as potential connection issues
    if (responseTime > 15000) { // 15 seconds
      console.log('Connection check slow:', responseTime, 'ms');
      return false;
    }
    
    lastConnectionCheck = Date.now();
    console.log(`Connection check successful (${responseTime}ms)`);
    return true;
  } catch (error) {
    console.log('Connection check failed:', error);
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
    console.log(`⚠️ Channel ${channelName} already exists. Skipping duplicate subscription.`);
    
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
    lastError: undefined as string | undefined,
    recreate: undefined as undefined | (() => any)
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
          console.log('⚠️ Realtime left the channel');
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
            console.log(`❌ [${channelName}] Connection error: ${status}`, err);
            subscriptionData.lastError = `${status}: ${err?.message || 'Unknown error'}`;
            
            // Detect invalid/expired JWT and refresh session + rebuild channels
            try {
              const msg = String(err?.message || '').toLowerCase();
              if (msg.includes('invalidjwttoken') || msg.includes('expired') || msg.includes('jwt')) {
                console.log(`🔐 [${channelName}] JWT issue detected. Refreshing session and reconnecting channels...`);
                (async () => {
                  try {
                    await refreshSupabaseConnection();
                    await reconnectAllSubscriptions();
                  } catch (e) {
                    console.log('🔐 JWT refresh/reconnect failed, user may need re-authentication:', e);
                  }
                })();
                return; // skip normal backoff path; reconnection handled globally
              }
              // If no error detail, treat as generic transport failure and try one guarded global refresh
              if (!err || !err.message) {
                const now = Date.now();
                if (now - lastGlobalReconnectAt > 20000 && !isReconnecting) {
                  lastGlobalReconnectAt = now;
                  console.log(`🌐 [${channelName}] No error detail; attempting guarded global refresh/reconnect...`);
                  (async () => {
                    try {
                      await refreshSupabaseConnection();
                      await reconnectAllSubscriptions();
                    } catch (e) {
                      console.log('🌐 Guarded refresh/reconnect failed:', e);
                    }
                  })();
                  return; // let global path handle recreate
                }
              }
            } catch (_) {}
            
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
                  console.log('Error cleaning up old subscription:', cleanupError);
                }
                
                // Create new subscription
                subscriptionData.subscription = createSubscription();
              }, delay);
            } else {
              console.log(`💀 [${channelName}] Max reconnection attempts reached. Performing final global refresh & recreate...`);
              (async () => {
                try {
                  await refreshSupabaseConnection();
                  // Try to recreate this channel specifically to avoid full app resubscribe if possible
                  if (subscriptionData.subscription) {
                    try {
                      subscriptionData.subscription.unsubscribe();
                      supabase.removeChannel(subscriptionData.subscription);
                    } catch (e) {
                      console.log(`Warning removing channel during final refresh:`, e);
                    }
                  }
                  if (typeof subscriptionData.recreate === 'function') {
                    subscriptionData.reconnectAttempts = 0;
                    subscriptionData.lastError = undefined;
                    subscriptionData.subscription = subscriptionData.recreate();
                  } else {
                    // Fallback to reconnect all
                    await reconnectAllSubscriptions();
                  }
                } catch (e) {
                  console.log('Final refresh & recreate failed:', e);
                }
              })();
            }
          }
          else if (status === 'CLOSED') {
            console.log(`🚪 [${channelName}] Connection closed`);
          }
        });
      
      return subscription;
    } catch (error) {
      console.log(`💥 [${channelName}] Error creating subscription:`, error);
      throw error;
    }
  };
  
  subscriptionData.recreate = () => {
    try {
      return (subscriptionData.subscription = createSubscription());
    } catch (e) {
      console.log(`💥 [${channelName}] Error in recreate():`, e);
      return null;
    }
  };

  subscriptionData.subscription = subscriptionData.recreate();
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
        console.log(`Warning during ${channelName} cleanup:`, error);
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
      console.log(`⚠️ [${channelName}] Health issue - Reconnect attempts: ${data.reconnectAttempts}, Last error: ${data.lastError}`);
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
  
  // Recreate each tracked subscription in place to avoid consumers needing to re-register
  const names = Array.from(activeSubscriptions.keys());
  for (const channelName of names) {
    const data = activeSubscriptions.get(channelName);
    if (!data) continue;
    try {
      console.log(`🔁 Recreating subscription: ${channelName}`);
      data.reconnectAttempts = 0;
      data.lastError = undefined;
      if (data.subscription) {
        try {
          data.subscription.unsubscribe();
          supabase.removeChannel(data.subscription);
        } catch (e) {
          console.log(`Warning unsubscribing old ${channelName}:`, e);
        }
      }
      if (typeof data.recreate === 'function') {
        data.subscription = data.recreate();
      } else {
        console.log(`⚠️ No recreate() hook for ${channelName}; consumer must resubscribe.`);
        activeSubscriptions.delete(channelName);
        globalChannelRegistry.delete(channelName);
      }
    } catch (err) {
      console.log(`💥 Error recreating subscription ${channelName}:`, err);
      activeSubscriptions.delete(channelName);
      globalChannelRegistry.delete(channelName);
    }
  }
  
  console.log('✅ Reconnect attempt complete for tracked subscriptions.');
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
      console.log(`${operationName} failed (attempt ${i + 1}/${maxRetries}):`, error);
      
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
    console.log('Reconnection timeout - resetting isReconnecting flag');
    isReconnecting = false;
  }, 30000); // 30 second timeout
  
  try {
    console.log('Refreshing Supabase connection...');
    
    // First try to refresh the auth session
    const { data: { session }, error: authError } = await supabase.auth.refreshSession();
    
    if (authError) {
      console.log('Failed to refresh auth session:', authError);
      
      // If refresh fails, try to get the current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession) {
        console.log('No valid session found, user may need to re-authenticate');
        throw new Error('Authentication session expired. Please log in again.');
      }
    } else {
      console.log('Successfully refreshed Supabase auth session');
      // Force fetch of new session to ensure Realtime client has latest access token
      try {
        const { data: { session: verified } } = await supabase.auth.getSession();
        console.log('Verified refreshed session:', !!verified?.access_token);
      } catch (_) {}
      // Wait briefly to avoid race with old Realtime connection
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test the connection with a simple query; if repeated failure, do a hard reset
    const ok = await checkSupabaseConnection();
    if (!ok) {
      console.log('Connection test failed after refresh; attempting hard client reset (no relogin)...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await hardResetSupabase(session ?? null);
        // Give the new client a moment then test again
        await new Promise(r => setTimeout(r, 300));
        const ok2 = await checkSupabaseConnection();
        console.log('Hard reset connection test result:', ok2);
      } catch (e) {
        console.log('Hard reset error:', e);
      }
    } else {
      console.log('Supabase connection successfully refreshed and tested');
    }
    
  } catch (error) {
    console.log('Error refreshing connection:', error);
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
        console.log('Periodic check: Connection appears unhealthy, but checking if realtime is still working...');
        
        // Check if subscriptions are actually still working before forcing reconnection
        let hasWorkingSubscriptions = false;
        try {
          // If we have active subscriptions that aren't in error state, connection might be fine
          hasWorkingSubscriptions = Array.from(activeSubscriptions.values()).some(sub => 
            sub.subscription && 
            !sub.lastError && 
            sub.reconnectAttempts === 0
          );
        } catch (_) {}
        
        if (hasWorkingSubscriptions) {
          console.log('Periodic check: Realtime subscriptions appear healthy, skipping aggressive reconnection');
        } else {
          console.log('Periodic check: Connection lost and subscriptions unhealthy, attempting to refresh...');
          await refreshSupabaseConnection();
          // Force reconnection of realtime subscriptions after refreshing auth/session
          await reconnectAllSubscriptions();
          // Check health after reconnection
          monitorSubscriptionHealth();
        }
      } else {
        console.log('Periodic check: Connection healthy');
      }
    } catch (error) {
      console.log('Error in periodic connection check:', error);
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

      // Add user to online status when app becomes active
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          console.log('🟢 App active: Adding user to online status');
          await addUserToOnlineStatus(user.id);
        }
      } catch (error) {
        console.log('Error updating online status on app active:', error);
      }
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background - remove from online status
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          console.log('🔴 App background: Removing user from online status');
          await removeUserFromOnlineStatus(user.id);
        }
      } catch (error) {
        console.log('Error updating online status on app background:', error);
      }
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
  onRestRequest?: (data: { playerId: string; playerName: string; restType: 'short'|'long'; deadline: number; }) => void;
  onRestResponse?: (data: { playerId: string; accepted: boolean; }) => void;
}) => {
  console.log('📡 Initializing campaign broadcast for:', campaignId);
  
  // Clean up existing channel
  if (campaignBroadcastChannel) {
    supabase.removeChannel(campaignBroadcastChannel);
  }
  
  // Create new broadcast channel
  const channelName = `campaign_actions_${campaignId}`;
  console.log('📡 Creating broadcast channel:', channelName);
  
  campaignBroadcastChannel = supabase.channel(channelName, {
    config: {
      broadcast: { self: true } // Enable receiving own broadcasts
    }
  })
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
    .on('broadcast', { event: 'rest_request' }, (payload) => {
      console.log('📢 Received rest_request broadcast:', payload);
      callbacks.onRestRequest?.(payload.payload);
    })
    .on('broadcast', { event: 'rest_response' }, (payload) => {
      console.log('📢 Received rest_response broadcast:', payload);
      callbacks.onRestResponse?.(payload.payload);
    })
    .subscribe((status) => {
      console.log('📡 Campaign broadcast status:', status, 'for channel:', channelName);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Campaign broadcast channel ready:', channelName);
      } else if (status === 'CHANNEL_ERROR') {
        console.log('❌ Campaign broadcast channel error:', channelName);
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
    console.log('⚠️ No broadcast channel available for action_started');
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
    console.log('❌ action_started broadcast failed:', error);
    console.log('❌ action_started error message:', error instanceof Error ? error.message : String(error));
  }
};

export const broadcastActionCompleted = async (campaignId: string, data: {
  playerId: string;
  success: boolean;
}) => {
  if (!campaignBroadcastChannel) {
    console.log('⚠️ No broadcast channel available for action_completed');
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
    console.log('❌ Broadcast send failed:', error);
    console.log('❌ Broadcast error type:', typeof error);
    console.log('❌ Broadcast error message:', error instanceof Error ? error.message : String(error));
    // Don't throw - just log the error like broadcastActionStarted
  }
};

export const broadcastRestRequest = async (campaignId: string, data: {
  playerId: string;
  playerName: string;
  restType: 'short'|'long';
  deadline: number;
}) => {
  if (!campaignBroadcastChannel) {
    console.log('⚠️ No broadcast channel for rest_request');
    return;
  }
  
  console.log('📢 Broadcasting rest_request:', data);
  console.log('📢 Channel status:', campaignBroadcastChannel.state);
  
  try {
    const result = await campaignBroadcastChannel.send({ 
      type: 'broadcast', 
      event: 'rest_request', 
      payload: data 
    });
    console.log('📢 rest_request send result:', result);
  } catch (error) {
    console.log('❌ rest_request broadcast failed:', error);
  }
};

export const broadcastRestResponse = async (campaignId: string, data: {
  playerId: string;
  accepted: boolean;
}) => {
  if (!campaignBroadcastChannel) {
    console.log('⚠️ No broadcast channel for rest_response');
    return;
  }
  
  console.log('📢 Broadcasting rest_response:', data);
  console.log('📢 Channel status:', campaignBroadcastChannel.state);
  
  try {
    const result = await campaignBroadcastChannel.send({ 
      type: 'broadcast', 
      event: 'rest_response', 
      payload: data 
    });
    console.log('📢 rest_response send result:', result);
  } catch (error) {
    console.log('❌ rest_response broadcast failed:', error);
  }
}; 