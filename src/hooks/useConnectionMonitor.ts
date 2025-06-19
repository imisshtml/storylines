import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  checkSupabaseConnection, 
  refreshSupabaseConnection, 
  startConnectionMonitoring, 
  stopConnectionMonitoring,
  isConnectionError 
} from '../utils/connectionUtils';

interface ConnectionMonitorOptions {
  onConnectionLost?: () => void;
  onConnectionRestored?: () => void;
  checkInterval?: number; // in milliseconds
  backgroundThreshold?: number; // time in ms before checking connection when app comes to foreground
}

export const useConnectionMonitor = (options: ConnectionMonitorOptions = {}) => {
  const {
    onConnectionLost,
    onConnectionRestored,
    checkInterval = 60000, // 1 minute default
    backgroundThreshold = 30000 // 30 seconds default
  } = options;

  const appState = useRef(AppState.currentState);
  const lastConnectionCheck = useRef(Date.now());
  const isConnected = useRef(true);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // When app comes to foreground after being in background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground, checking connection...');
        
        // Check if we've been in background for more than the threshold
        const timeSinceLastCheck = Date.now() - lastConnectionCheck.current;
        if (timeSinceLastCheck > backgroundThreshold) {
          try {
            const connectionStatus = await checkSupabaseConnection();
            
            if (!connectionStatus && isConnected.current) {
              // Connection lost
              isConnected.current = false;
              console.log('Connection lost, attempting to refresh...');
              onConnectionLost?.();
              
              await refreshSupabaseConnection();
              
              // Check again after refresh
              const reconnectionStatus = await checkSupabaseConnection();
              if (reconnectionStatus) {
                isConnected.current = true;
                onConnectionRestored?.();
              }
            } else if (connectionStatus && !isConnected.current) {
              // Connection restored
              isConnected.current = true;
              onConnectionRestored?.();
            }
          } catch (error) {
            console.error('Error checking/refreshing connection:', error);
            if (isConnectionError(error)) {
              isConnected.current = false;
              onConnectionLost?.();
            }
          }
        }
        
        lastConnectionCheck.current = Date.now();
      }
      
      appState.current = nextAppState;
    };

    // Start monitoring when hook mounts
    startConnectionMonitoring(checkInterval);

    // Set up app state change listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function
    return () => {
      subscription?.remove();
      stopConnectionMonitoring();
    };
  }, [checkInterval, backgroundThreshold, onConnectionLost, onConnectionRestored]);

  // Return connection utilities for manual use
  return {
    checkConnection: checkSupabaseConnection,
    refreshConnection: refreshSupabaseConnection,
    isConnectionError
  };
}; 