import { useEffect, useCallback, useRef } from 'react';

interface AutoSaveOptions {
  enabled: boolean;
  interval: number; // in milliseconds
  onSave: () => void;
  onError?: (error: Error) => void;
}

export const useAutoSave = (data: any, options: AutoSaveOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const { enabled, interval, onSave, onError } = options;

  const save = useCallback(async () => {
    try {
      const currentData = JSON.stringify(data);
      
      // Only save if data has changed
      if (currentData !== lastSavedDataRef.current) {
        await onSave();
        lastSavedDataRef.current = currentData;
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, save]);

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
    hasUnsavedChanges
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

  const setStoredValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

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
  const [versions, setVersions] = useState<Array<{ 
    id: string; 
    timestamp: Date; 
    data: T; 
    description?: string;
  }>>([]);

  const saveVersion = useCallback((description?: string) => {
    const newVersion = {
      id: Date.now().toString(),
      timestamp: new Date(),
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      description
    };

    setVersions(prev => [newVersion, ...prev.slice(0, 99)]); // Keep last 100 versions
  }, [data]);

  const restoreVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    return version ? version.data : null;
  }, [versions]);

  const deleteVersion = useCallback((versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
  }, []);

  const getVersionDiff = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return null;

    // Simple diff implementation
    const currentStr = JSON.stringify(data, null, 2);
    const versionStr = JSON.stringify(version.data, null, 2);
    
    return {
      current: currentStr,
      version: versionStr,
      timestamp: version.timestamp,
      description: version.description
    };
  }, [data, versions]);

  return {
    versions,
    saveVersion,
    restoreVersion,
    deleteVersion,
    getVersionDiff
  };
};

function useState<T>(arg0: () => T): [any, any] {
  throw new Error('Function not implemented.');
}