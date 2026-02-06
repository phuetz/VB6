/**
 * Cache Service
 * In-memory and Redis caching for improved performance
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export class CacheService {
  private static instance: CacheService;
  private redisClient?: RedisClientType;
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  private constructor() {
    this.initializeRedis();
    this.startCleanupInterval();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private async initializeRedis() {
    if (process.env.REDIS_URL) {
      try {
        this.redisClient = createClient({
          url: process.env.REDIS_URL,
        });

        this.redisClient.on('error', err => {
          logger.error('Redis Client Error:', err);
        });

        await this.redisClient.connect();
        logger.info('Redis cache connected');
      } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        this.redisClient = undefined;
      }
    }
  }

  private startCleanupInterval() {
    // Clean up expired memory cache entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache) {
        if (entry.expires && entry.expires < now) {
          this.memoryCache.delete(key);
        }
      }
    }, 60 * 1000);
  }

  async get(key: string): Promise<any> {
    try {
      // Try Redis first
      if (this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          this.stats.hits++;
          return JSON.parse(value);
        }
      }

      // Fall back to memory cache
      const entry = this.memoryCache.get(key);
      if (entry) {
        if (!entry.expires || entry.expires > Date.now()) {
          this.stats.hits++;
          return entry.value;
        } else {
          this.memoryCache.delete(key);
        }
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      this.stats.sets++;
      const serialized = JSON.stringify(value);

      // Set in Redis if available
      if (this.redisClient) {
        if (ttl) {
          await this.redisClient.setEx(key, ttl, serialized);
        } else {
          await this.redisClient.set(key, serialized);
        }
      }

      // Also set in memory cache
      this.memoryCache.set(key, {
        value,
        expires: ttl ? Date.now() + ttl * 1000 : 0,
      });
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.stats.deletes++;

      if (this.redisClient) {
        await this.redisClient.del(key);
      }

      this.memoryCache.delete(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.flushAll();
      }

      this.memoryCache.clear();
      logger.info('Cache flushed');
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  async getStats(): Promise<any> {
    const memorySize = this.memoryCache.size;
    let redisSize = 0;

    if (this.redisClient) {
      try {
        redisSize = await this.redisClient.dbSize();
      } catch (error) {
        logger.error('Failed to get Redis size:', error);
      }
    }

    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      memoryEntries: memorySize,
      redisEntries: redisSize,
      redisConnected: !!this.redisClient,
    };
  }

  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  // Utility methods for specific use cases

  async cacheQuery(
    connectionId: string,
    query: string,
    params: any[],
    result: any,
    ttl: number = 300
  ): Promise<void> {
    const key = this.getQueryKey(connectionId, query, params);
    await this.set(key, result, ttl);
  }

  async getCachedQuery(connectionId: string, query: string, params: any[]): Promise<any> {
    const key = this.getQueryKey(connectionId, query, params);
    return this.get(key);
  }

  async invalidateConnection(connectionId: string): Promise<void> {
    // In a production system, we'd track all keys for a connection
    // For now, we'll just log
    logger.info(`Cache invalidation requested for connection: ${connectionId}`);
  }

  private getQueryKey(connectionId: string, query: string, params: any[]): string {
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();
    const paramsHash = JSON.stringify(params);
    return `query:${connectionId}:${normalizedQuery}:${paramsHash}`;
  }
}
