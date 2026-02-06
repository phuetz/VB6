import NodeCache from 'node-cache';
import redis from 'redis';
import { logger } from '../index.js';

class CacheService {
  constructor() {
    this.memoryCache = new NodeCache({
      stdTTL: 300, // 5 minutes par défaut
      checkperiod: 60, // Vérifier les expirations chaque minute
      useClones: false,
      deleteOnExpire: true,
    });

    this.redisClient = null;
    this.useRedis = process.env.REDIS_URL ? true : false;
    this.statistics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  async initialize() {
    if (this.useRedis) {
      try {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: retries => {
              if (retries > 10) {
                logger.error('Redis connection failed after 10 retries');
                return new Error('Too many retries');
              }
              return Math.min(retries * 100, 3000);
            },
          },
        });

        this.redisClient.on('error', err => {
          logger.error('Redis Client Error', err);
        });

        this.redisClient.on('connect', () => {
          logger.info('Redis connected successfully');
        });

        await this.redisClient.connect();
      } catch (error) {
        logger.error('Failed to initialize Redis:', error);
        this.useRedis = false;
      }
    }

    logger.info('Cache Service initialized');
  }

  async get(key) {
    try {
      let value;

      if (this.useRedis && this.redisClient) {
        value = await this.redisClient.get(key);
        if (value) {
          value = JSON.parse(value);
        }
      } else {
        value = this.memoryCache.get(key);
      }

      if (value !== undefined && value !== null) {
        this.statistics.hits++;
        return value;
      }

      this.statistics.misses++;
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      this.statistics.sets++;

      if (this.useRedis && this.redisClient) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
      } else {
        this.memoryCache.set(key, value, ttl);
      }

      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      this.statistics.deletes++;

      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.del(key);
      }

      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern) {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        const keys = this.memoryCache.keys();
        const regex = new RegExp(pattern.replace('*', '.*'));
        keys.forEach(key => {
          if (regex.test(key)) {
            this.memoryCache.del(key);
          }
        });
      }

      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  async flush() {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushAll();
      } else {
        this.memoryCache.flushAll();
      }

      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  getStatistics() {
    const stats = {
      ...this.statistics,
      hitRate: this.statistics.hits / (this.statistics.hits + this.statistics.misses) || 0,
      type: this.useRedis ? 'redis' : 'memory',
    };

    if (!this.useRedis) {
      stats.keys = this.memoryCache.keys().length;
      stats.size = this.memoryCache.getStats();
    }

    return stats;
  }

  async shutdown() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    this.memoryCache.close();
    logger.info('Cache Service shut down');
  }

  // Méthodes spécialisées pour différents types de cache

  async cacheQuery(connectionId, query, params, result, ttl = 300) {
    const key = this.generateQueryKey(connectionId, query, params);
    return await this.set(key, result, ttl);
  }

  async getCachedQuery(connectionId, query, params) {
    const key = this.generateQueryKey(connectionId, query, params);
    return await this.get(key);
  }

  async cacheTableMetadata(connectionId, tableName, metadata, ttl = 3600) {
    const key = `metadata:${connectionId}:${tableName}`;
    return await this.set(key, metadata, ttl);
  }

  async getCachedTableMetadata(connectionId, tableName) {
    const key = `metadata:${connectionId}:${tableName}`;
    return await this.get(key);
  }

  async cacheConnectionInfo(connectionId, info, ttl = 86400) {
    const key = `connection:${connectionId}`;
    return await this.set(key, info, ttl);
  }

  async getCachedConnectionInfo(connectionId) {
    const key = `connection:${connectionId}`;
    return await this.get(key);
  }

  generateQueryKey(connectionId, query, params) {
    const paramStr = JSON.stringify(params || []);
    const queryHash = this.hashString(query + paramStr);
    return `query:${connectionId}:${queryHash}`;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Cache avec tags pour invalidation groupée
  async setWithTags(key, value, tags = [], ttl = 300) {
    await this.set(key, value, ttl);

    // Stocker les tags
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const keys = (await this.get(tagKey)) || [];
      if (!keys.includes(key)) {
        keys.push(key);
        await this.set(tagKey, keys, 86400); // 24 heures
      }
    }
  }

  async invalidateTag(tag) {
    const tagKey = `tag:${tag}`;
    const keys = (await this.get(tagKey)) || [];

    for (const key of keys) {
      await this.delete(key);
    }

    await this.delete(tagKey);
  }

  // Warmup du cache
  async warmup(queries = []) {
    logger.info('Starting cache warmup');

    for (const query of queries) {
      try {
        // Ici on pourrait pré-charger des requêtes fréquentes
        logger.info(`Warming up: ${query.name}`);
      } catch (error) {
        logger.error(`Warmup failed for ${query.name}:`, error);
      }
    }

    logger.info('Cache warmup completed');
  }
}

export default new CacheService();
