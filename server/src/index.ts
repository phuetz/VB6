/**
 * VB6 Database Server
 * High-performance server supporting ADO, DAO, RDO connections
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { databaseRouter } from './routes/database.routes';
import { adoRouter } from './routes/ado.routes';
import { daoRouter } from './routes/dao.routes';
import { rdoRouter } from './routes/rdo.routes';
import { reportRouter } from './routes/report.routes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authentication } from './middleware/authentication';
import { logger } from './utils/logger';
import { DatabasePool } from './services/DatabasePool';
import { CacheService } from './services/CacheService';
import { MetricsService } from './services/MetricsService';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173';
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true,
  },
});

// Initialize services
const databasePool = DatabasePool.getInstance();
const cacheService = CacheService.getInstance();
const metricsService = MetricsService.getInstance();

// CONFIGURATION VULNERABILITY BUG FIX: Remove unsafe-inline from CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Use a concrete nonce string, not a JS expression
        styleSrc: [
          "'self'",
          `nonce-${process.env.CSP_NONCE || 'development-only-nonce'}`,
        ],
        scriptSrc: [
          "'self'",
          `nonce-${process.env.CSP_NONCE || 'development-only-nonce'}`,
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", CLIENT_ORIGIN, 'ws:', 'wss:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
);
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
app.use('/api', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: databasePool.getConnectionStats(),
  });
});

// API Routes
app.use('/api/database', databaseRouter);
app.use('/api/ado', adoRouter);
app.use('/api/dao', daoRouter);
app.use('/api/rdo', rdoRouter);
app.use('/api/reports', reportRouter);

// WebSocket connections for real-time data
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe', async (params) => {
    const { database, table, query } = params;
    socket.join(`${database}:${table}`);
    
    // Send initial data
    try {
      const data = await databasePool.executeQuery(database, query);
      socket.emit('data', { database, table, data });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('unsubscribe', (params) => {
    const { database, table } = params;
    socket.leave(`${database}:${table}`);
  });

  socket.on('execute', async (params) => {
    const { connectionId, query, parameters } = params;
    try {
      const result = await databasePool.execute(connectionId, query, parameters);
      socket.emit('result', { connectionId, result });
    } catch (error) {
      socket.emit('error', { connectionId, error: error.message });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  
  await databasePool.closeAll();
  await cacheService.close();
  
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info(`VB6 Database Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`WebSocket server ready`);
});

export { app, io };
