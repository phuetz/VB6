/**
 * Rate Limiter Middleware
 * Prevents API abuse and ensures fair usage
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';

// Create Redis client if available
let redisClient: any = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  
  redisClient.on('error', (err: Error) => {
    console.error('Redis Client Error:', err);
  });
  
  redisClient.connect().catch(console.error);
}

// Base rate limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    }),
  }),
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:auth:',
    }),
  }),
});

// Rate limiter for database operations
export const dbRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 database operations per minute
  message: 'Too many database operations, please slow down.',
  keyGenerator: (req: Request) => {
    // Use connection ID + IP for more granular limiting
    const connectionId = req.body?.connectionId || req.params?.connectionId || 'unknown';
    return `${req.ip}:${connectionId}`;
  },
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:db:',
    }),
  }),
});

// Rate limiter for report generation
export const reportRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 report generations per 5 minutes
  message: 'Too many report generation requests, please try again later.',
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:report:',
    }),
  }),
});

// Dynamic rate limiter based on user tier
export const tieredRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Get user tier from request (would come from authentication)
  const userTier = (req as any).user?.tier || 'free';
  
  const limits = {
    free: { windowMs: 15 * 60 * 1000, max: 100 },
    basic: { windowMs: 15 * 60 * 1000, max: 500 },
    pro: { windowMs: 15 * 60 * 1000, max: 2000 },
    enterprise: { windowMs: 15 * 60 * 1000, max: 10000 },
  };
  
  const tierLimit = limits[userTier] || limits.free;
  
  const limiter = rateLimit({
    ...tierLimit,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      return (req as any).user?.id || req.ip;
    },
    ...(redisClient && {
      store: new RedisStore({
        client: redisClient,
        prefix: `rl:tier:${userTier}:`,
      }),
    }),
  });
  
  limiter(req, res, next);
};

// Cleanup function
export const cleanupRateLimiter = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};