import { useState, useCallback, useEffect, useRef } from 'react';

interface LoadingState {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  trackPromise: <T>(promise: Promise<T>) => Promise<T>;
  pendingPromises: number;
  error: Error | null;
  setError: (error: Error | null) => void;
}

/**
 * Custom hook to manage loading states across multiple async operations.
 * Tracks the number of pending promises and only sets isLoading to false
 * when all tracked promises have resolved.
 */
export function useLoadingState(initialState = false): LoadingState {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState<Error | null>(null);
  const pendingPromisesRef = useRef(0);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (!loading) {
      // Reset pending promises when manually setting loading to false
      pendingPromisesRef.current = 0;
    }
  }, []);

  const trackPromise = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    try {
      pendingPromisesRef.current += 1;
      setIsLoading(true);
      setError(null);
      
      const result = await promise;
      
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      pendingPromisesRef.current -= 1;
      if (pendingPromisesRef.current <= 0) {
        pendingPromisesRef.current = 0;
        setIsLoading(false);
      }
    }
  }, []);

  // Safety cleanup - ensure loading state is reset if component unmounts with pending promises
  useEffect(() => {
    return () => {
      pendingPromisesRef.current = 0;
    };
  }, []);

  return {
    isLoading,
    setLoading,
    trackPromise,
    pendingPromises: pendingPromisesRef.current,
    error,
    setError
  };
}