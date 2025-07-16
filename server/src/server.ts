/**
 * VB6 Studio Data Server
 * Serveur haute performance pour l'accès aux données VB6
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { DatabaseManager } from './database/DatabaseManager';
import { CacheManager } from './cache/CacheManager';
import { ConnectionPoolManager } from './database/ConnectionPoolManager';
import { DataController } from './controllers/DataController';
import { ADOController } from './controllers/ADOController';
import { ODBCController } from './controllers/ODBCController';
import { CrystalReportsController } from './controllers/CrystalReportsController';
import { PerformanceMonitor } from './monitoring/PerformanceMonitor';
import { Logger } from './utils/Logger';
import { WebSocketManager } from './websocket/WebSocketManager';

// Chargement de la configuration
dotenv.config();

class VB6DataServer {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;
  private databaseManager: DatabaseManager;
  private cacheManager: CacheManager;
  private connectionPoolManager: ConnectionPoolManager;
  private performanceMonitor: PerformanceMonitor;
  private webSocketManager: WebSocketManager;
  private logger: Logger;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      },
    });

    this.logger = new Logger();
    this.initializeServices();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureWebSocket();
    this.configureErrorHandling();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialisation des services
      this.cacheManager = new CacheManager();
      await this.cacheManager.initialize();

      this.connectionPoolManager = new ConnectionPoolManager();
      await this.connectionPoolManager.initialize();

      this.databaseManager = new DatabaseManager(this.connectionPoolManager, this.cacheManager);
      await this.databaseManager.initialize();

      this.performanceMonitor = new PerformanceMonitor();
      await this.performanceMonitor.initialize();

      this.webSocketManager = new WebSocketManager(this.io, this.databaseManager);

      this.logger.info('Tous les services initialisés avec succès');
    } catch (error) {
      this.logger.error("Erreur lors de l'initialisation des services:", error);
      throw error;
    }
  }

  private configureMiddleware(): void {
    // Sécurité
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      })
    );

    // CORS
    this.app.use(
      cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      })
    );

    // Compression
    this.app.use(
      compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limite chaque IP à 1000 requêtes par fenêtre
      message: {
        error: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
        retryAfter: '15 minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Logging
    this.app.use(
      morgan('combined', {
        stream: { write: message => this.logger.info(message.trim()) },
      })
    );

    // Monitoring des performances
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.performanceMonitor.recordRequest(req.method, req.path, res.statusCode, duration);
      });
      next();
    });
  }

  private configureRoutes(): void {
    // Routes de santé
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connections: this.connectionPoolManager.getStatus(),
      });
    });

    this.app.get('/metrics', async (req, res) => {
      const metrics = await this.performanceMonitor.getMetrics();
      res.json(metrics);
    });

    // API Routes
    const dataController = new DataController(this.databaseManager, this.cacheManager);
    const adoController = new ADOController(this.databaseManager);
    const odbcController = new ODBCController(this.databaseManager);
    const crystalController = new CrystalReportsController(this.databaseManager);

    // Routes de données génériques
    this.app.use('/api/data', dataController.getRouter());

    // Routes ADO (ActiveX Data Objects)
    this.app.use('/api/ado', adoController.getRouter());

    // Routes ODBC
    this.app.use('/api/odbc', odbcController.getRouter());

    // Routes Crystal Reports
    this.app.use('/api/reports', crystalController.getRouter());

    // Route pour les connexions VB6
    this.app.post('/api/vb6/connect', async (req, res) => {
      try {
        const { connectionString, provider } = req.body;
        const connection = await this.databaseManager.createVB6Connection(
          connectionString,
          provider
        );
        res.json({
          success: true,
          connectionId: connection.id,
          message: 'Connexion établie avec succès',
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    });

    // Route pour exécuter des requêtes VB6
    this.app.post('/api/vb6/execute', async (req, res) => {
      try {
        const { connectionId, sql, parameters } = req.body;
        const result = await this.databaseManager.executeVB6Query(connectionId, sql, parameters);
        res.json({
          success: true,
          data: result.data,
          recordsAffected: result.recordsAffected,
          executionTime: result.executionTime,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Erreur d'exécution",
        });
      }
    });

    // Route 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route non trouvée',
        path: req.originalUrl,
        method: req.method,
      });
    });
  }

  private configureWebSocket(): void {
    this.io.on('connection', socket => {
      this.logger.info(`Nouvelle connexion WebSocket: ${socket.id}`);
      this.webSocketManager.handleConnection(socket);

      socket.on('disconnect', () => {
        this.logger.info(`Déconnexion WebSocket: ${socket.id}`);
        this.webSocketManager.handleDisconnection(socket);
      });
    });
  }

  private configureErrorHandling(): void {
    // Gestionnaire d'erreur global
    this.app.use(
      (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        this.logger.error('Erreur non gérée:', error);

        res.status(500).json({
          success: false,
          error:
            process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        });
      }
    );

    // Gestion des rejets de promesses non gérées
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Promesse rejetée non gérée:', reason);
      // Ne pas arrêter le processus, juste logger
    });

    // Gestion des exceptions non capturées
    process.on('uncaughtException', error => {
      this.logger.error('Exception non capturée:', error);
      // Arrêt gracieux
      this.shutdown();
    });

    // Gestion de l'arrêt gracieux
    process.on('SIGTERM', () => {
      this.logger.info('Signal SIGTERM reçu, arrêt gracieux...');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      this.logger.info('Signal SIGINT reçu, arrêt gracieux...');
      this.shutdown();
    });
  }

  public async start(): Promise<void> {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    try {
      this.server.listen(port, host, () => {
        this.logger.info(`🚀 Serveur VB6 Studio démarré sur ${host}:${port}`);
        this.logger.info(`📊 Monitoring disponible sur http://${host}:${port}/metrics`);
        this.logger.info(`💓 Santé du serveur: http://${host}:${port}/health`);
        this.logger.info(`🔌 WebSocket disponible sur ws://${host}:${port}`);
      });

      // Test de connexion aux services
      await this.runHealthChecks();
    } catch (error) {
      this.logger.error('Erreur lors du démarrage du serveur:', error);
      throw error;
    }
  }

  private async runHealthChecks(): Promise<void> {
    try {
      // Test de la base de données
      await this.databaseManager.healthCheck();
      this.logger.info('✅ Base de données: OK');

      // Test du cache
      await this.cacheManager.healthCheck();
      this.logger.info('✅ Cache Redis: OK');

      // Test des pools de connexions
      const poolStatus = this.connectionPoolManager.getStatus();
      this.logger.info(`✅ Pools de connexions: ${poolStatus.totalPools} pools actifs`);
    } catch (error) {
      this.logger.warn('⚠️ Certains services ne sont pas disponibles:', error);
    }
  }

  private async shutdown(): Promise<void> {
    this.logger.info('Arrêt du serveur en cours...');

    try {
      // Fermeture des connexions WebSocket
      this.io.close();

      // Fermeture des connexions de base de données
      await this.connectionPoolManager.closeAll();

      // Fermeture du cache
      await this.cacheManager.close();

      // Fermeture du serveur HTTP
      this.server.close(() => {
        this.logger.info('Serveur arrêté avec succès');
        process.exit(0);
      });

      // Force l'arrêt après 30 secondes
      setTimeout(() => {
        this.logger.error('Arrêt forcé après timeout');
        process.exit(1);
      }, 30000);
    } catch (error) {
      this.logger.error("Erreur lors de l'arrêt:", error);
      process.exit(1);
    }
  }
}

// Démarrage du serveur
const server = new VB6DataServer();
server.start().catch(error => {
  console.error('Impossible de démarrer le serveur:', error);
  process.exit(1);
});

export default VB6DataServer;
