import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import winston from 'winston';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Import des routes
import databaseRoutes from './routes/database.js';
import queryRoutes from './routes/query.js';
import connectionRoutes from './routes/connection.js';
import cacheRoutes from './routes/cache.js';
import reportRoutes from './routes/report.js';

// Import des services
import DatabaseService from './services/DatabaseService.js';
import CacheService from './services/CacheService.js';
import SecurityService from './services/SecurityService.js';
import MonitoringService from './services/MonitoringService.js';

// Configuration
dotenv.config();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'vb6-database-server' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Initialisation de l'application
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Rate limiter
const rateLimiter = new RateLimiterMemory({
  points: 100, // Nombre de requêtes
  duration: 60, // Par minute
});

// Middleware de rate limiting
const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too Many Requests' });
  }
};

// Middlewares globaux
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimiterMiddleware);

// Middleware de logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// Routes API
app.use('/api/database', databaseRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/connection', connectionRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/report', reportRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: DatabaseService.getActiveConnections()
  });
});

// WebSocket pour les mises à jour en temps réel
io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);

  socket.on('subscribe', (channel) => {
    socket.join(channel);
    logger.info(`Client ${socket.id} subscribed to ${channel}`);
  });

  socket.on('unsubscribe', (channel) => {
    socket.leave(channel);
    logger.info(`Client ${socket.id} unsubscribed from ${channel}`);
  });

  socket.on('query', async (data) => {
    try {
      const result = await DatabaseService.executeQuery(data);
      socket.emit('queryResult', result);
    } catch (error) {
      socket.emit('queryError', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.path
    }
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`VB6 Database Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialisation des services
  DatabaseService.initialize();
  CacheService.initialize();
  SecurityService.initialize();
  MonitoringService.start();
});

// Gestion de l'arrêt gracieux
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  await DatabaseService.closeAllConnections();
  await CacheService.shutdown();
  process.exit(0);
});

export { app, io, logger };