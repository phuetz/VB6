import { useEffect, useCallback, useRef, useState } from 'react';

interface AutoSaveOptions {
  enabled: boolean;
  interval: number; // in milliseconds
  onSave: () => void;
  onError?: (error: Error) => void;
}

export const useAutoSave = <T = unknown>(data: T, options: AutoSaveOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isSavingRef = useRef<boolean>(false); // RACE CONDITION BUG FIX: Prevent concurrent saves
  const isMountedRef = useRef<boolean>(true); // MEMORY CORRUPTION BUG FIX: Track component mount status
  const { enabled, interval, onSave, onError } = options;

  const save = useCallback(async () => {
    // MEMORY CORRUPTION BUG FIX: Prevent operations on unmounted component
    if (!isMountedRef.current || isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      const currentData = JSON.stringify(data);

      // Only save if data has changed and component is still mounted
      if (currentData !== lastSavedDataRef.current && isMountedRef.current) {
        await onSave();
        // Check again after async operation completes
        if (isMountedRef.current) {
          lastSavedDataRef.current = currentData;
        }
      }
    } catch (error) {
      // Only handle errors if component is still mounted
      if (onError && isMountedRef.current) {
        onError(error as Error);
      }
    } finally {
      isSavingRef.current = false; // Always reset the flag
    }
  }, [data, onSave, onError]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start auto-save interval
    intervalRef.current = setInterval(save, interval);

    return () => {
      // MEMORY CORRUPTION BUG FIX: Proper cleanup to prevent use-after-free
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isMountedRef.current = false; // Mark component as unmounted
    };
  }, [enabled, interval, save]);

  // MEMORY CORRUPTION BUG FIX: Cleanup on component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Manual save function
  const forceSave = useCallback(() => {
    save();
  }, [save]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const currentData = JSON.stringify(data);
    return currentData !== lastSavedDataRef.current;
  }, [data]);

  return {
    forceSave,
    hasUnsavedChanges,
  };
};

// Hook pour la sauvegarde locale
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((val: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
        setValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, value]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setValue(defaultValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [value, setStoredValue, removeValue] as const;
};

// Hook pour la gestion des versions
export const useVersioning = <T>(data: T) => {
  const [versions, setVersions] = useState<
    Array<{
      id: string;
      timestamp: Date;
      data: T;
      description?: string;
    }>
  >([]);

  const saveVersion = useCallback(
    (description?: string) => {
      // MEMORY CORRUPTION BUG FIX: Use cryptographically secure ID generation
      const generateSecureId = () => {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          const array = new Uint8Array(16);
          crypto.getRandomValues(array);
          return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
      };
      
      const newVersion = {
        id: generateSecureId(),
        timestamp: new Date(),
        data: JSON.parse(JSON.stringify(data)), // Deep clone
        description,
      };

      setVersions(prev => [newVersion, ...prev.slice(0, 99)]); // Keep last 100 versions
    },
    [data]
  );

  const restoreVersion = useCallback(
    (versionId: string) => {
      const version = versions.find(v => v.id === versionId);
      return version ? version.data : null;
    },
    [versions]
  );

  const deleteVersion = useCallback((versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
  }, []);

  const getVersionDiff = useCallback(
    (versionId: string) => {
      const version = versions.find(v => v.id === versionId);
      if (!version) return null;

      // Simple diff implementation
      const currentStr = JSON.stringify(data, null, 2);
      const versionStr = JSON.stringify(version.data, null, 2);

      return {
        current: currentStr,
        version: versionStr,
        timestamp: version.timestamp,
        description: version.description,
      };
    },
    [data, versions]
  );

  return {
    versions,
    saveVersion,
    restoreVersion,
    deleteVersion,
    getVersionDiff,
  };
};

// RUNTIME LOGIC BUG FIX: Removed incorrectly implemented useState - use React's useState instead
