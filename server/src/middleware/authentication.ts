/**
 * Authentication Middleware
 * Handles API authentication and authorization
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

// SECURITY FIX: Require JWT_SECRET in production, only use default in development
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  if (!secret) {
    logger.warn('WARNING: Using default JWT secret. Set JWT_SECRET in production!');
    return 'vb6-dev-secret-change-in-production';
  }
  if (secret.length < 32) {
    logger.warn('WARNING: JWT_SECRET should be at least 32 characters');
  }
  return secret;
};

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email?: string;
    tier: 'free' | 'basic' | 'pro' | 'enterprise';
    permissions: string[];
  };
}

// Generate JWT token
export const generateToken = (user: any): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      tier: user.tier || 'free',
      permissions: user.permissions || [],
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

// Authentication middleware
export const authentication = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Skip authentication for public endpoints
    const publicEndpoints = ['/health', '/api/auth/login', '/api/auth/register'];
    if (publicEndpoints.includes(req.path)) {
      return next();
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyToken(token);

    // Add user to request
    req.user = decoded;

    // Log authentication
    logger.info(`Authenticated user: ${decoded.username}`);

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

// Authorization middleware - check permissions
export const authorize = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(
      permission => userPermissions.includes(permission) || userPermissions.includes('admin')
    );

    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// API key authentication (alternative to JWT)
export const apiKeyAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return next();
    }

    // In production, validate API key against database
    // For now, use a simple check
    if (apiKey === process.env.MASTER_API_KEY) {
      req.user = {
        id: 'api-key-user',
        username: 'API User',
        tier: 'enterprise',
        permissions: ['admin'],
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Combined authentication (JWT or API key)
export const flexibleAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Try API key first
  await apiKeyAuth(req, res, err => {
    if (err || req.user) {
      return next(err);
    }

    // Fall back to JWT authentication
    authentication(req, res, next);
  });
};

// Rate limit by user tier
export const tierBasedLimits = (req: AuthRequest, res: Response, next: NextFunction) => {
  const tier = req.user?.tier || 'free';

  const limits = {
    free: { requests: 1000, connections: 2, databases: 1 },
    basic: { requests: 10000, connections: 10, databases: 5 },
    pro: { requests: 100000, connections: 50, databases: 20 },
    enterprise: { requests: Infinity, connections: Infinity, databases: Infinity },
  };

  // Add limits to request for other middleware to use
  (req as any).limits = limits[tier];

  next();
};
