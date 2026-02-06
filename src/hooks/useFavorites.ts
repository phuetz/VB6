// Hook React pour la gestion des répertoires favoris
// Fournit une interface simple pour interagir avec le FavoritesService

import { useState, useEffect, useCallback } from 'react';
import { favoritesService, FavoriteDirectory } from '../services/FavoritesService';

export interface UseFavoritesReturn {
  // État
  favorites: FavoriteDirectory[];
  isLoading: boolean;

  // Actions
  addFavorite: (path: string, name?: string, projectType?: 'vb6' | 'vbnet' | 'other') => boolean;
  removeFavorite: (path: string) => boolean;
  isFavorite: (path: string) => boolean;
  toggleFavorite: (path: string, name?: string, projectType?: 'vb6' | 'vbnet' | 'other') => boolean;

  // Gestion
  renameFavorite: (path: string, newName: string) => boolean;
  moveFavorite: (path: string, direction: 'up' | 'down') => boolean;
  markAsAccessed: (path: string) => void;

  // Filtres
  getFavoritesByType: (projectType: 'vb6' | 'vbnet' | 'other') => FavoriteDirectory[];
  getRecentlyAccessed: (limit?: number) => FavoriteDirectory[];

  // Utilitaires
  cleanupFavorites: () => number;
  exportFavorites: () => string;
  importFavorites: (jsonData: string) => boolean;
  getStats: () => {
    totalFavorites: number;
    vb6Projects: number;
    recentlyAccessed: number;
    oldestFavorite: Date | null;
    newestFavorite: Date | null;
  };
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<FavoriteDirectory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les favoris au démarrage
  useEffect(() => {
    const initialFavorites = favoritesService.getFavorites();
    setFavorites(initialFavorites);
    setIsLoading(false);

    // S'abonner aux changements
    const unsubscribe = favoritesService.subscribe(updatedFavorites => {
      setFavorites(updatedFavorites);
    });

    return unsubscribe;
  }, []);

  // Ajouter un favori
  const addFavorite = useCallback(
    (path: string, name?: string, projectType?: 'vb6' | 'vbnet' | 'other'): boolean => {
      return favoritesService.addFavorite(path, name, projectType);
    },
    []
  );

  // Supprimer un favori
  const removeFavorite = useCallback((path: string): boolean => {
    return favoritesService.removeFavorite(path);
  }, []);

  // Vérifier si un chemin est en favoris
  const isFavorite = useCallback((path: string): boolean => {
    return favoritesService.isFavorite(path);
  }, []);

  // Basculer l'état favori
  const toggleFavorite = useCallback(
    (path: string, name?: string, projectType?: 'vb6' | 'vbnet' | 'other'): boolean => {
      if (favoritesService.isFavorite(path)) {
        return favoritesService.removeFavorite(path);
      } else {
        return favoritesService.addFavorite(path, name, projectType);
      }
    },
    []
  );

  // Renommer un favori
  const renameFavorite = useCallback((path: string, newName: string): boolean => {
    return favoritesService.renameFavorite(path, newName);
  }, []);

  // Déplacer un favori
  const moveFavorite = useCallback((path: string, direction: 'up' | 'down'): boolean => {
    return favoritesService.moveFavorite(path, direction);
  }, []);

  // Marquer comme accédé
  const markAsAccessed = useCallback((path: string): void => {
    favoritesService.markAsAccessed(path);
  }, []);

  // Obtenir favoris by type
  const getFavoritesByType = useCallback((projectType: 'vb6' | 'vbnet' | 'other') => {
    return favoritesService.getFavoritesByType(projectType);
  }, []);

  // Obtenir récemment accédés
  const getRecentlyAccessed = useCallback((limit?: number) => {
    return favoritesService.getRecentlyAccessed(limit);
  }, []);

  // Nettoyer les favoris
  const cleanupFavorites = useCallback((): number => {
    return favoritesService.cleanupFavorites();
  }, []);

  // Exporter les favoris
  const exportFavorites = useCallback((): string => {
    return favoritesService.exportFavorites();
  }, []);

  // Importer les favoris
  const importFavorites = useCallback((jsonData: string): boolean => {
    return favoritesService.importFavorites(jsonData);
  }, []);

  // Obtenir les statistiques
  const getStats = useCallback(() => {
    return favoritesService.getStats();
  }, []);

  return {
    // État
    favorites,
    isLoading,

    // Actions
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,

    // Gestion
    renameFavorite,
    moveFavorite,
    markAsAccessed,

    // Filtres
    getFavoritesByType,
    getRecentlyAccessed,

    // Utilitaires
    cleanupFavorites,
    exportFavorites,
    importFavorites,
    getStats,
  };
};
