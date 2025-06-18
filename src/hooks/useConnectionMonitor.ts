import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { checkSupabaseConnection, refreshSupabaseConnection } from '../utils/connectionUtils';

export const useConnectionMonitor = () => {
  const appState = useRef(AppState.currentState);
  const lastConnectionCheck = useRef(Date.now());
  const connectionCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // When app comes to foreground after being in background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground, checking connection...');
        
        // Check if we've been in background for more than 30 seconds
        const timeSinceLastCheck = Date.now() - lastConnectionCheck.current;
        if (timeSinceLastCheck > 30000) {
          try {
            const isConnected = await checkSupabaseConnection();
            if (!isConnected) {
              console.log('Connection lost, attempting to refresh...');
              await refreshSupabaseConnection();
            }
          } catch (error) {
            console.error('Error checking/refreshing connection:', error);
          }
        }
        
        lastConnectionCheck.current = Date.now();
      }
      
      appState.current = nextAppState;
    };

    // Periodic connection check every 5 minutes when app is active
    const startPeriodicCheck = () => {
      connectionCheckInterval.current = setInterval(async () => {
        if (AppState.currentState === 'active') {
          try {
            const isConnected = await checkSupabaseConnection();
            if (!isConnected) {
              console.log('Periodic check: Connection lost, attempting to refresh...');
              await refreshSupabaseConnection();
            }
            lastConnectionCheck.current = Date.now();
          } catch (error) {
            console.error('Error in periodic connection check:', error);
          }
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    startPeriodicCheck();

    return () => {
      subscription?.remove();
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
    };
  }, []);
}; 