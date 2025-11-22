// Service de gestion des répertoires favoris
// Permet de gérer les répertoires favoris de l'utilisateur avec persistance

export interface FavoriteDirectory {
  id: string;
  path: string;
  name: string;
  dateAdded: Date;
  lastAccessed?: Date;
  projectType?: 'vb6' | 'vbnet' | 'other';
}

export class FavoritesService {
  private static instance: FavoritesService;
  private readonly STORAGE_KEY = 'vb6-favorite-directories';
  private readonly MAX_FAVORITES = 20; // Limite le nombre de favoris
  private favorites: FavoriteDirectory[] = [];
  private listeners: Array<(favorites: FavoriteDirectory[]) => void> = [];

  static getInstance(): FavoritesService {
    if (!FavoritesService.instance) {
      FavoritesService.instance = new FavoritesService();
    }
    return FavoritesService.instance;
  }

  constructor() {
    this.loadFavorites();
  }

  // Charger les favoris depuis localStorage
  private loadFavorites(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.favorites = parsed.map((fav: any) => ({
          ...fav,
          dateAdded: new Date(fav.dateAdded),
          lastAccessed: fav.lastAccessed ? new Date(fav.lastAccessed) : undefined
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      this.favorites = [];
    }
  }

  // Sauvegarder les favoris dans localStorage
  private saveFavorites(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.favorites));
      this.notifyListeners();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  }

  // Notifier les listeners des changements
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.favorites]));
  }

  // Ajouter un répertoire aux favoris
  addFavorite(path: string, name?: string, projectType?: 'vb6' | 'vbnet' | 'other'): boolean {
    // Vérifier si déjà en favoris
    if (this.isFavorite(path)) {
      return false;
    }

    // Générer un nom si non fourni
    const finalName = name || this.extractDirectoryName(path);

    const newFavorite: FavoriteDirectory = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path,
      name: finalName,
      dateAdded: new Date(),
      projectType: projectType || 'vb6'
    };

    this.favorites.unshift(newFavorite);

    // Limiter le nombre de favoris
    if (this.favorites.length > this.MAX_FAVORITES) {
      this.favorites = this.favorites.slice(0, this.MAX_FAVORITES);
    }

    this.saveFavorites();
    return true;
  }

  // Retirer un répertoire des favoris
  removeFavorite(path: string): boolean {
    const initialLength = this.favorites.length;
    this.favorites = this.favorites.filter(fav => fav.path !== path);
    
    if (this.favorites.length < initialLength) {
      this.saveFavorites();
      return true;
    }
    return false;
  }

  // Vérifier si un répertoire est en favoris
  isFavorite(path: string): boolean {
    return this.favorites.some(fav => fav.path === path);
  }

  // Obtenir tous les favoris
  getFavorites(): FavoriteDirectory[] {
    return [...this.favorites];
  }

  // Obtenir les favoris par type de projet
  getFavoritesByType(projectType: 'vb6' | 'vbnet' | 'other'): FavoriteDirectory[] {
    return this.favorites.filter(fav => fav.projectType === projectType);
  }

  // Marquer un favori comme récemment accédé
  markAsAccessed(path: string): void {
    const favorite = this.favorites.find(fav => fav.path === path);
    if (favorite) {
      favorite.lastAccessed = new Date();
      this.saveFavorites();
    }
  }

  // Obtenir les favoris récemment accédés
  getRecentlyAccessed(limit: number = 5): FavoriteDirectory[] {
    return this.favorites
      .filter(fav => fav.lastAccessed)
      .sort((a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0))
      .slice(0, limit);
  }

  // Renommer un favori
  renameFavorite(path: string, newName: string): boolean {
    const favorite = this.favorites.find(fav => fav.path === path);
    if (favorite) {
      favorite.name = newName;
      this.saveFavorites();
      return true;
    }
    return false;
  }

  // Réorganiser les favoris (déplacer vers le haut/bas)
  moveFavorite(path: string, direction: 'up' | 'down'): boolean {
    const index = this.favorites.findIndex(fav => fav.path === path);
    if (index === -1) return false;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= this.favorites.length) {
      return false;
    }

    // Échanger les positions
    [this.favorites[index], this.favorites[newIndex]] = [this.favorites[newIndex], this.favorites[index]];
    
    this.saveFavorites();
    return true;
  }

  // Nettoyer les favoris (supprimer les doublons, invalides)
  cleanupFavorites(): number {
    const originalLength = this.favorites.length;
    const seen = new Set<string>();
    
    this.favorites = this.favorites.filter(fav => {
      // Supprimer les doublons
      if (seen.has(fav.path)) {
        return false;
      }
      seen.add(fav.path);
      
      // Supprimer les entrées invalides
      if (!fav.path || !fav.name) {
        return false;
      }
      
      return true;
    });

    const cleaned = originalLength - this.favorites.length;
    if (cleaned > 0) {
      this.saveFavorites();
    }
    
    return cleaned;
  }

  // Exporter les favoris
  exportFavorites(): string {
    return JSON.stringify(this.favorites, null, 2);
  }

  // Importer des favoris
  importFavorites(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      if (Array.isArray(imported)) {
        // Valider la structure
        const validFavorites = imported.filter(fav => 
          fav.path && fav.name && typeof fav.path === 'string' && typeof fav.name === 'string'
        ).map(fav => ({
          ...fav,
          id: fav.id || `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          dateAdded: fav.dateAdded ? new Date(fav.dateAdded) : new Date(),
          lastAccessed: fav.lastAccessed ? new Date(fav.lastAccessed) : undefined,
          projectType: fav.projectType || 'vb6'
        }));

        // Fusionner avec les favoris existants (éviter les doublons)
        const existingPaths = new Set(this.favorites.map(fav => fav.path));
        const newFavorites = validFavorites.filter(fav => !existingPaths.has(fav.path));
        
        this.favorites = [...this.favorites, ...newFavorites];
        
        // Respecter la limite
        if (this.favorites.length > this.MAX_FAVORITES) {
          this.favorites = this.favorites.slice(0, this.MAX_FAVORITES);
        }
        
        this.saveFavorites();
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de l\'importation des favoris:', error);
    }
    return false;
  }

  // Écouter les changements de favoris
  subscribe(listener: (favorites: FavoriteDirectory[]) => void): () => void {
    this.listeners.push(listener);
    
    // Retourner une fonction de désabonnement
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Obtenir des statistiques
  getStats(): {
    totalFavorites: number;
    vb6Projects: number;
    recentlyAccessed: number;
    oldestFavorite: Date | null;
    newestFavorite: Date | null;
  } {
    const vb6Count = this.favorites.filter(fav => fav.projectType === 'vb6').length;
    const recentCount = this.favorites.filter(fav => fav.lastAccessed).length;
    
    const dates = this.favorites.map(fav => fav.dateAdded).sort((a, b) => a.getTime() - b.getTime());
    
    return {
      totalFavorites: this.favorites.length,
      vb6Projects: vb6Count,
      recentlyAccessed: recentCount,
      oldestFavorite: dates.length > 0 ? dates[0] : null,
      newestFavorite: dates.length > 0 ? dates[dates.length - 1] : null
    };
  }

  // Extraire le nom du répertoire depuis le chemin
  private extractDirectoryName(path: string): string {
    const parts = path.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || parts[parts.length - 2] || 'Répertoire';
  }
}

// Export de l'instance singleton
export const favoritesService = FavoritesService.getInstance();