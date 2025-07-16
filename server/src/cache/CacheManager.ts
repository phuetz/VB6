/**
 * Gestionnaire de cache haute performance pour VB6 Studio
 * Support Redis avec fallback en mémoire
 */

import { Logger } from '../utils/Logger';

interface CacheEntry {
  value: any;
  ttl: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  totalSets: number;
  totalDeletes: number;
  totalClears: number;
  uptime: number;
  redisConnected: boolean;
}

export class CacheManager {
  private logger: Logger;
  private memoryCache: Map<string, CacheEntry>;
  private redisClient: any;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    clears: number;
    startTime: number;
  };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRedisConnected: boolean = false;

  constructor() {
    this.logger = new Logger('CacheManager');
    this.memoryCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      startTime: Date.now(),
    };
  }

  async initialize(): Promise<void> {
    this.logger.info('Initialisation du gestionnaire de cache...');

    try {
      // Tentative de connexion à Redis
      await this.initializeRedis();
    } catch (error) {
      this.logger.warn('Redis non disponible, utilisation du cache mémoire:', error);
    }

    // Démarrage du nettoyage automatique
    this.startCleanupTask();

    this.logger.info(
      `Gestionnaire de cache initialisé (Redis: ${this.isRedisConnected ? 'connecté' : 'non disponible'})`
    );
  }

  /**
   * Initialise la connexion Redis
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Simulation d'une connexion Redis
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      // En production, on utiliserait le vrai client Redis
      this.redisClient = {
        connected: true,

        // Méthodes simulées
        get: async (key: string) => {
          // Simulation d'une récupération Redis
          return null;
        },

        set: async (key: string, value: string, mode?: string, duration?: number) => {
          // Simulation d'une sauvegarde Redis
          return 'OK';
        },

        del: async (key: string) => {
          // Simulation d'une suppression Redis
          return 1;
        },

        flushall: async () => {
          // Simulation d'un vidage Redis
          return 'OK';
        },

        keys: async (pattern: string) => {
          // Simulation de récupération de clés
          return [];
        },

        ttl: async (key: string) => {
          // Simulation de récupération TTL
          return -1;
        },

        exists: async (key: string) => {
          // Simulation de vérification d'existence
          return 0;
        },

        quit: async () => {
          // Simulation de fermeture
          return 'OK';
        },

        // Événements simulés
        on: (event: string, callback: (...args: any[]) => void) => {},
        off: (event: string, callback: (...args: any[]) => void) => {},
      };

      this.isRedisConnected = true;
      this.logger.info('Connexion Redis simulée établie');
    } catch (error) {
      this.logger.error('Erreur connexion Redis:', error);
      throw error;
    }
  }

  /**
   * Récupère une valeur du cache
   */
  async get(key: string): Promise<any> {
    try {
      // Tentative Redis en premier
      if (this.isRedisConnected) {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          this.stats.hits++;
          this.logger.debug(`Cache hit Redis: ${key}`);
          return JSON.parse(redisValue);
        }
      }

      // Fallback cache mémoire
      const entry = this.memoryCache.get(key);
      if (entry) {
        // Vérification du TTL
        if (entry.ttl === 0 || Date.now() - entry.createdAt < entry.ttl * 1000) {
          entry.accessCount++;
          entry.lastAccessed = Date.now();
          this.stats.hits++;
          this.logger.debug(`Cache hit mémoire: ${key}`);
          return entry.value;
        } else {
          // Entrée expirée
          this.memoryCache.delete(key);
        }
      }

      this.stats.misses++;
      this.logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Erreur récupération cache ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Sauvegarde une valeur dans le cache
   */
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);

      // Sauvegarde Redis
      if (this.isRedisConnected) {
        if (ttl > 0) {
          await this.redisClient.set(key, serializedValue, 'EX', ttl);
        } else {
          await this.redisClient.set(key, serializedValue);
        }
        this.logger.debug(`Cache set Redis: ${key} (TTL: ${ttl}s)`);
      }

      // Sauvegarde mémoire
      const entry: CacheEntry = {
        value,
        ttl,
        createdAt: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      this.memoryCache.set(key, entry);
      this.stats.sets++;
      this.logger.debug(`Cache set mémoire: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Erreur sauvegarde cache ${key}:`, error);
    }
  }

  /**
   * Supprime une clé du cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      let deleted = false;

      // Suppression Redis
      if (this.isRedisConnected) {
        const redisResult = await this.redisClient.del(key);
        if (redisResult > 0) {
          deleted = true;
        }
      }

      // Suppression mémoire
      if (this.memoryCache.delete(key)) {
        deleted = true;
      }

      if (deleted) {
        this.stats.deletes++;
        this.logger.debug(`Cache delete: ${key}`);
      }

      return deleted;
    } catch (error) {
      this.logger.error(`Erreur suppression cache ${key}:`, error);
      return false;
    }
  }

  /**
   * Vide tout le cache
   */
  async clear(): Promise<void> {
    try {
      // Vidage Redis
      if (this.isRedisConnected) {
        await this.redisClient.flushall();
      }

      // Vidage mémoire
      this.memoryCache.clear();

      this.stats.clears++;
      this.logger.info('Cache vidé');
    } catch (error) {
      this.logger.error('Erreur vidage cache:', error);
    }
  }

  /**
   * Supprime les clés correspondant à un pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    try {
      let deletedCount = 0;

      // Pattern Redis
      if (this.isRedisConnected) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          for (const key of keys) {
            await this.redisClient.del(key);
            deletedCount++;
          }
        }
      }

      // Pattern mémoire
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          deletedCount++;
        }
      }

      this.logger.info(`${deletedCount} clés supprimées pour le pattern: ${pattern}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Erreur suppression pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Vérification de santé du cache
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test Redis
      if (this.isRedisConnected) {
        await this.redisClient.set('health_check', 'ok', 'EX', 10);
        const result = await this.redisClient.get('health_check');
        if (result !== 'ok') {
          throw new Error('Redis health check failed');
        }
        await this.redisClient.del('health_check');
      }

      // Test mémoire
      const testKey = 'memory_health_check';
      await this.set(testKey, 'ok', 1);
      const testValue = await this.get(testKey);
      if (testValue !== 'ok') {
        throw new Error('Memory cache health check failed');
      }
      await this.delete(testKey);

      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Obtient les statistiques du cache
   */
  async getStats(): Promise<CacheStats> {
    try {
      const memoryUsage = this.calculateMemoryUsage();
      const uptime = Date.now() - this.stats.startTime;
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

      return {
        totalKeys: this.memoryCache.size,
        memoryUsage,
        hitRate: Math.round(hitRate * 100) / 100,
        totalHits: this.stats.hits,
        totalMisses: this.stats.misses,
        totalSets: this.stats.sets,
        totalDeletes: this.stats.deletes,
        totalClears: this.stats.clears,
        uptime,
        redisConnected: this.isRedisConnected,
      };
    } catch (error) {
      this.logger.error('Erreur récupération statistiques:', error);
      return {
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0,
        totalHits: 0,
        totalMisses: 0,
        totalSets: 0,
        totalDeletes: 0,
        totalClears: 0,
        uptime: 0,
        redisConnected: false,
      };
    }
  }

  /**
   * Ferme le gestionnaire de cache
   */
  async close(): Promise<void> {
    try {
      // Arrêt du nettoyage
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      // Fermeture Redis
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.quit();
        this.isRedisConnected = false;
      }

      // Vidage mémoire
      this.memoryCache.clear();

      this.logger.info('Gestionnaire de cache fermé');
    } catch (error) {
      this.logger.error('Erreur fermeture cache:', error);
    }
  }

  // Méthodes privées

  /**
   * Démarre la tâche de nettoyage automatique
   */
  private startCleanupTask(): void {
    // Nettoyage toutes les 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredEntries();
      },
      5 * 60 * 1000
    );

    this.logger.debug('Tâche de nettoyage automatique démarrée');
  }

  /**
   * Nettoie les entrées expirées du cache mémoire
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.ttl > 0 && now - entry.createdAt > entry.ttl * 1000) {
        this.memoryCache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.debug(`${expiredCount} entrées expirées nettoyées`);
    }

    // Nettoyage basé sur la taille si nécessaire
    this.cleanupBySize();
  }

  /**
   * Nettoie le cache basé sur la taille (LRU)
   */
  private cleanupBySize(): void {
    const maxEntries = parseInt(process.env.CACHE_MAX_ENTRIES || '10000', 10);

    if (this.memoryCache.size <= maxEntries) {
      return;
    }

    // Tri par dernier accès (LRU)
    const entries = Array.from(this.memoryCache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    const toRemove = this.memoryCache.size - maxEntries;

    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.memoryCache.delete(key);
    }

    this.logger.debug(`${toRemove} entrées supprimées par LRU`);
  }

  /**
   * Calcule l'usage mémoire approximatif
   */
  private calculateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      // Estimation approximative
      totalSize += key.length * 2; // UTF-16
      totalSize += JSON.stringify(entry.value).length * 2;
      totalSize += 64; // Overhead de l'objet entry
    }

    return totalSize;
  }

  /**
   * Obtient la liste des clés
   */
  async getKeys(pattern?: string): Promise<string[]> {
    try {
      const keys: string[] = [];

      // Clés Redis
      if (this.isRedisConnected && pattern) {
        const redisKeys = await this.redisClient.keys(pattern);
        keys.push(...redisKeys);
      }

      // Clés mémoire
      if (pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            keys.push(key);
          }
        }
      } else {
        keys.push(...Array.from(this.memoryCache.keys()));
      }

      // Suppression des doublons
      return [...new Set(keys)];
    } catch (error) {
      this.logger.error('Erreur récupération des clés:', error);
      return [];
    }
  }

  /**
   * Obtient le TTL d'une clé
   */
  async getTTL(key: string): Promise<number> {
    try {
      // TTL Redis
      if (this.isRedisConnected) {
        const redisTTL = await this.redisClient.ttl(key);
        if (redisTTL > 0) {
          return redisTTL;
        }
      }

      // TTL mémoire
      const entry = this.memoryCache.get(key);
      if (entry) {
        if (entry.ttl === 0) {
          return -1; // Pas d'expiration
        }
        const remaining = entry.ttl - Math.floor((Date.now() - entry.createdAt) / 1000);
        return remaining > 0 ? remaining : 0;
      }

      return -2; // Clé non trouvée
    } catch (error) {
      this.logger.error(`Erreur récupération TTL ${key}:`, error);
      return -2;
    }
  }

  /**
   * Vérifie si une clé existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      // Vérification Redis
      if (this.isRedisConnected) {
        const redisExists = await this.redisClient.exists(key);
        if (redisExists > 0) {
          return true;
        }
      }

      // Vérification mémoire
      const entry = this.memoryCache.get(key);
      if (entry) {
        // Vérification du TTL
        if (entry.ttl === 0 || Date.now() - entry.createdAt < entry.ttl * 1000) {
          return true;
        } else {
          // Entrée expirée
          this.memoryCache.delete(key);
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Erreur vérification existence ${key}:`, error);
      return false;
    }
  }
}
