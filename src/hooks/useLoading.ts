import { useState, useCallback } from 'react';

/**
 * A hook to manage loading states for multiple operations
 * 
 * @returns An object with loading state and utility functions
 */
export function useLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  /**
   * Start loading for a specific key
   * @param key - Unique identifier for the loading operation
   */
  const startLoading = useCallback((key: string = 'default') => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
  }, []);
  
  /**
   * Stop loading for a specific key
   * @param key - Unique identifier for the loading operation
   */
  const stopLoading = useCallback((key: string = 'default') => {
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  }, []);
  
  /**
   * Check if any loading operation is in progress
   */
  const isLoading = useCallback((key?: string) => {
    if (key) {
      return !!loadingStates[key];
    }
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);
  
  /**
   * Wrap an async function with loading state management
   * @param fn - Async function to wrap
   * @param key - Optional key for the loading state
   */
  const withLoading = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    key: string = 'default'
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        startLoading(key);
        return await fn(...args);
      } finally {
        stopLoading(key);
      }
    };
  }, [startLoading, stopLoading]);
  
  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    loadingStates
  };
}