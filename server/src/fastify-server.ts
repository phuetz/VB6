/**
 * Serveur Fastify Ultra-Performant pour VB6 Studio
 * 10x plus rapide qu'Express avec support WebSocket natif
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCompress from '@fastify/compress';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyAuth from '@fastify/auth';
import fastifyJwt from '@fastify/jwt';
import fastifyRedis from '@fastify/redis';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyCookie from '@fastify/cookie';
import fastifyMongodb from '@fastify/mongodb';
import fastifyMysql from '@fastify/mysql';
import fastifyPostgres from '@fastify/postgres';
import { DatabaseService } from './services/UltraPerformantDatabaseService';
import { CrystalReportsService } from './services/AdvancedCrystalReportsService';
import { Logger } from './utils/Logger';
import path from 'path';
import cluster from 'cluster';
import os from 'os';

const numCPUs = os.cpus().length;

// Configuration du serveur
const SERVER_CONFIG = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '8080'),
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: process.env.NODE_ENV === 'development',
  },
  ignoreTrailingSlash: true,
  maxParamLength: 200,
  bodyLimit: 50 * 1024 * 1024, // 50MB
  keepAliveTimeout: 30000,
  requestTimeout: 30000,
  pluginTimeout: 30000,
  connectionTimeout: 30000,
};

// Schema de validation pour les requêtes
const schemas = {
  querySchema: {
    type: 'object',
    properties: {
      connectionId: { type: 'string' },
      sql: { type: 'string' },
      parameters: { type: 'array', items: { type: 'string' } },
      useCache: { type: 'boolean', default: true },
      timeout: { type: 'number', default: 30000 },
    },
    required: ['connectionId', 'sql'],
  },
  reportSchema: {
    type: 'object',
    properties: {
      reportId: { type: 'string' },
      parameters: { type: 'object' },
      format: { type: 'string', enum: ['pdf', 'excel', 'word', 'csv', 'html'] },
      pageSize: { type: 'number', default: 50 },
      pageNumber: { type: 'number', default: 1 },
    },
    required: ['reportId'],
  },
  connectionSchema: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['mysql', 'postgresql', 'mssql', 'oracle', 'mongodb'] },
      host: { type: 'string' },
      port: { type: 'number' },
      database: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string' },
      ssl: { type: 'boolean', default: false },
      poolSize: { type: 'number', default: 10 },
    },
    required: ['type', 'host', 'database'],
  },
};

class VB6FastifyServer {
  private fastify: FastifyInstance;
  private logger: Logger;
  private dbService: DatabaseService;
  private reportsService: CrystalReportsService;
  private connectionStates: Map<string, any> = new Map();
  private activeQueries: Map<string, any> = new Map();
  private performanceMetrics: Map<string, any> = new Map();

  constructor() {
    this.logger = new Logger('VB6FastifyServer');
    this.fastify = Fastify(SERVER_CONFIG);
    this.dbService = new DatabaseService();
    this.reportsService = new CrystalReportsService(this.dbService);
  }

  async initialize(): Promise<void> {
    this.logger.info('Initialisation du serveur Fastify ultra-performant...');

    try {
      // Enregistrer les plugins
      await this.registerPlugins();
      
      // Configurer les routes
      await this.registerRoutes();
      
      // Configurer WebSocket
      await this.registerWebSocket();
      
      // Initialiser les services
      await this.dbService.initialize();
      await this.reportsService.initialize();

      this.logger.info('Serveur Fastify initialisé avec succès');
    } catch (error) {
      this.logger.error('Erreur initialisation serveur:', error);
      throw error;
    }
  }

  private async registerPlugins(): Promise<void> {
    // CONFIGURATION VULNERABILITY BUG FIX: Remove unsafe-inline from CSP
    await this.fastify.register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'nonce-' + (process.env.CSP_NONCE || 'development-only-nonce')"],
          scriptSrc: ["'self'", "'nonce-' + (process.env.CSP_NONCE || 'development-only-nonce')"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    });

    // CORS
    await this.fastify.register(fastifyCors, {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });

    // Rate limiting
    await this.fastify.register(fastifyRateLimit, {
      max: 1000,
      timeWindow: '1 minute',
      redis: process.env.REDIS_URL,
    });

    // Compression
    await this.fastify.register(fastifyCompress, {
      encodings: ['gzip', 'deflate'],
      threshold: 1024,
    });

    // Multipart/form-data
    await this.fastify.register(fastifyMultipart);

    // Fichiers statiques
    await this.fastify.register(fastifyStatic, {
      root: path.join(__dirname, 'public'),
      prefix: '/static/',
    });

    // Cookies (required for CSRF protection)
    await this.fastify.register(fastifyCookie, {
      secret: process.env.COOKIE_SECRET || 'vb6-studio-cookie-secret-key',
      parseOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      },
    });

    // JWT
    await this.fastify.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || 'vb6-studio-secret-key',
      sign: { expiresIn: '24h' },
    });

    // Auth
    await this.fastify.register(fastifyAuth);

    // CSRF VULNERABILITY BUG FIX: Add CSRF protection to prevent Cross-Site Request Forgery attacks
    await this.fastify.register(fastifyCsrf, {
      sessionPlugin: '@fastify/cookie',
      csrfOpts: {
        hmacKey: process.env.CSRF_SECRET || 'vb6-studio-csrf-secret-key-change-in-production',
        ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
        userIdField: 'username', // Field from JWT payload to use as user identifier
      },
    });

    // Redis
    if (process.env.REDIS_URL) {
      await this.fastify.register(fastifyRedis, {
        url: process.env.REDIS_URL,
        lazyConnect: true,
      });
    }

    // Base de données
    if (process.env.MYSQL_URL) {
      await this.fastify.register(fastifyMysql, {
        connectionString: process.env.MYSQL_URL,
      });
    }

    if (process.env.POSTGRES_URL) {
      await this.fastify.register(fastifyPostgres, {
        connectionString: process.env.POSTGRES_URL,
      });
    }

    if (process.env.MONGODB_URL) {
      await this.fastify.register(fastifyMongodb, {
        url: process.env.MONGODB_URL,
      });
    }

    // WebSocket
    await this.fastify.register(fastifyWebsocket);

    // Documentation API
    await this.fastify.register(fastifySwagger, {
      swagger: {
        info: {
          title: 'VB6 Studio API',
          description: 'API ultra-performante pour VB6 Studio',
          version: '2.0.0',
        },
        host: 'localhost:8080',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'database', description: 'Opérations de base de données' },
          { name: 'reports', description: 'Génération de rapports' },
          { name: 'auth', description: 'Authentification' },
          { name: 'websocket', description: 'Temps réel' },
        ],
      },
    });

    await this.fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
      },
    });
  }

  private async registerRoutes(): Promise<void> {
    // Health check
    this.fastify.get('/health', async (request, reply) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connections: this.connectionStates.size,
        activeQueries: this.activeQueries.size,
        dbStatus: await this.dbService.getHealthStatus(),
      };

      reply.code(200).send(health);
    });

    // CSRF VULNERABILITY BUG FIX: Provide CSRF token to authenticated clients
    this.fastify.get('/csrf-token', {
      preHandler: this.fastify.auth([this.fastify.verifyJWT]),
    }, async (request, reply) => {
      const token = await reply.generateCsrf();
      reply.send({ csrfToken: token });
    });

    // Authentification
    this.fastify.register(async (fastify) => {
      await fastify.register(this.authRoutes.bind(this));
    });

    // Routes de base de données
    this.fastify.register(async (fastify) => {
      await fastify.addHook('preHandler', fastify.auth([fastify.verifyJWT]));
      // CSRF VULNERABILITY BUG FIX: Add CSRF validation to all state-changing routes
      await fastify.addHook('preHandler', async (request, reply) => {
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
          await fastify.csrfProtection(request, reply);
        }
      });
      await fastify.register(this.databaseRoutes.bind(this));
    });

    // Routes de rapports
    this.fastify.register(async (fastify) => {
      await fastify.addHook('preHandler', fastify.auth([fastify.verifyJWT]));
      // CSRF VULNERABILITY BUG FIX: Add CSRF validation to all state-changing routes
      await fastify.addHook('preHandler', async (request, reply) => {
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
          await fastify.csrfProtection(request, reply);
        }
      });
      await fastify.register(this.reportsRoutes.bind(this));
    });

    // Routes d'administration
    this.fastify.register(async (fastify) => {
      await fastify.addHook('preHandler', fastify.auth([fastify.verifyJWT]));
      // CSRF VULNERABILITY BUG FIX: Add CSRF validation to all state-changing routes
      await fastify.addHook('preHandler', async (request, reply) => {
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
          await fastify.csrfProtection(request, reply);
        }
      });
      await fastify.register(this.adminRoutes.bind(this));
    });
  }

  private async authRoutes(fastify: FastifyInstance): Promise<void> {
    const opts = {
      schema: {
        tags: ['auth'],
        body: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
          required: ['username', 'password'],
        },
      },
    };

    fastify.post('/auth/login', opts, async (request: FastifyRequest, reply: FastifyReply) => {
      const { username, password } = request.body as any;

      try {
        // Validation utilisateur (à implémenter selon vos besoins)
        if (username === 'admin' && password === 'password') {
          const token = fastify.jwt.sign({ username, role: 'admin' });
          reply.send({ token, expiresIn: '24h' });
        } else {
          reply.code(401).send({ error: 'Identifiants invalides' });
        }
      } catch (error) {
        reply.code(500).send({ error: 'Erreur authentification' });
      }
    });

    fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
      // Invalider le token (à implémenter avec Redis)
      reply.send({ message: 'Déconnecté avec succès' });
    });
  }

  private async databaseRoutes(fastify: FastifyInstance): Promise<void> {
    // Ajouter une connexion
    fastify.post('/db/connections', {
      schema: {
        tags: ['database'],
        body: schemas.connectionSchema,
      },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const config = request.body as any;
      const connectionId = `conn_${Date.now()}`;

      try {
        await this.dbService.addConnection(connectionId, config);
        this.connectionStates.set(connectionId, {
          id: connectionId,
          config: { ...config, password: '***' },
          createdAt: new Date(),
          lastUsed: new Date(),
          queryCount: 0,
        });

        reply.send({ connectionId, message: 'Connexion créée avec succès' });
      } catch (error) {
        reply.code(500).send({ error: 'Erreur création connexion' });
      }
    });

    // Exécuter une requête
    fastify.post('/db/query', {
      schema: {
        tags: ['database'],
        body: schemas.querySchema,
      },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const { connectionId, sql, parameters = [], useCache = true, timeout = 30000 } = request.body as any;
      const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      try {
        // Enregistrer la requête active
        this.activeQueries.set(queryId, {
          connectionId,
          sql: sql.substring(0, 100) + '...',
          startTime: Date.now(),
          status: 'executing',
        });

        const startTime = Date.now();
        const result = await this.dbService.executeQuery(connectionId, sql, parameters, useCache, 300);
        const executionTime = Date.now() - startTime;

        // Mettre à jour les statistiques
        const connState = this.connectionStates.get(connectionId);
        if (connState) {
          connState.lastUsed = new Date();
          connState.queryCount++;
        }

        // Supprimer la requête active
        this.activeQueries.delete(queryId);

        // Enregistrer les métriques
        this.recordPerformanceMetric('query_execution', executionTime);

        reply.send({
          queryId,
          data: result.data,
          fields: result.fields,
          rowsAffected: result.rowsAffected,
          executionTime,
          fromCache: result.fromCache,
        });
      } catch (error) {
        this.activeQueries.delete(queryId);
        this.logger.error(`Erreur requête ${queryId}:`, error);
        reply.code(500).send({ error: 'Erreur exécution requête' });
      }
    });

    // Exécuter une requête préparée
    fastify.post('/db/prepared/:statementId', async (request: FastifyRequest, reply: FastifyReply) => {
      const { statementId } = request.params as any;
      const { connectionId, parameters = [] } = request.body as any;

      try {
        const result = await this.dbService.executePreparedStatement(connectionId, statementId, parameters);
        reply.send(result);
      } catch (error) {
        reply.code(500).send({ error: 'Erreur exécution statement préparé' });
      }
    });

    // Transactions
    fastify.post('/db/transaction/begin', async (request: FastifyRequest, reply: FastifyReply) => {
      const { connectionId } = request.body as any;

      try {
        const transactionId = await this.dbService.beginTransaction(connectionId);
        reply.send({ transactionId });
      } catch (error) {
        reply.code(500).send({ error: 'Erreur début transaction' });
      }
    });

    fastify.post('/db/transaction/commit', async (request: FastifyRequest, reply: FastifyReply) => {
      const { transactionId } = request.body as any;

      try {
        await this.dbService.commitTransaction(transactionId);
        reply.send({ message: 'Transaction validée' });
      } catch (error) {
        reply.code(500).send({ error: 'Erreur validation transaction' });
      }
    });

    fastify.post('/db/transaction/rollback', async (request: FastifyRequest, reply: FastifyReply) => {
      const { transactionId } = request.body as any;

      try {
        await this.dbService.rollbackTransaction(transactionId);
        reply.send({ message: 'Transaction annulée' });
      } catch (error) {
        reply.code(500).send({ error: 'Erreur annulation transaction' });
      }
    });

    // Import en masse
    fastify.post('/db/bulk-import', async (request: FastifyRequest, reply: FastifyReply) => {
      const { connectionId, table, data, batchSize = 1000 } = request.body as any;

      try {
        const result = await this.dbService.bulkInsert(connectionId, table, data, batchSize);
        reply.send(result);
      } catch (error) {
        reply.code(500).send({ error: 'Erreur import en masse' });
      }
    });

    // Statistiques des pools
    fastify.get('/db/stats', async (request: FastifyRequest, reply: FastifyReply) => {
      const stats = this.dbService.getPoolStats();
      reply.send(stats);
    });

    // Vider le cache
    fastify.delete('/db/cache', async (request: FastifyRequest, reply: FastifyReply) => {
      const { pattern } = request.query as any;
      const clearedCount = await this.dbService.clearCache(pattern);
      reply.send({ clearedCount });
    });
  }

  private async reportsRoutes(fastify: FastifyInstance): Promise<void> {
    // Créer un rapport
    fastify.post('/reports', {
      schema: {
        tags: ['reports'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            title: { type: 'string' },
            dataSources: { type: 'array' },
            sections: { type: 'array' },
            parameters: { type: 'array' },
          },
          required: ['name', 'title'],
        },
      },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const reportConfig = request.body as any;

      try {
        const reportId = await this.reportsService.createReport(reportConfig);
        reply.send({ reportId, message: 'Rapport créé avec succès' });
      } catch (error) {
        reply.code(500).send({ error: 'Erreur création rapport' });
      }
    });

    // Générer un rapport
    fastify.post('/reports/:reportId/generate', {
      schema: {
        tags: ['reports'],
        params: {
          type: 'object',
          properties: {
            reportId: { type: 'string' },
          },
        },
        body: schemas.reportSchema,
      },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const { reportId } = request.params as any;
      const { parameters = {}, format = 'pdf' } = request.body as any;

      try {
        const startTime = Date.now();
        const result = await this.reportsService.generateReport(reportId, parameters, { format });
        const generationTime = Date.now() - startTime;

        this.recordPerformanceMetric('report_generation', generationTime);

        reply
          .type(this.getMimeType(format))
          .header('Content-Disposition', `attachment; filename="${reportId}.${format}"`)
          .send(result.buffer);
      } catch (error) {
        reply.code(500).send({ error: 'Erreur génération rapport' });
      }
    });

    // Aperçu de rapport
    fastify.get('/reports/:reportId/preview', async (request: FastifyRequest, reply: FastifyReply) => {
      const { reportId } = request.params as any;
      const { page = 1, pageSize = 50, parameters = {} } = request.query as any;

      try {
        const preview = await this.reportsService.previewReport(reportId, parameters, page, pageSize);
        reply.send(preview);
      } catch (error) {
        reply.code(500).send({ error: 'Erreur aperçu rapport' });
      }
    });

    // Lister les rapports
    fastify.get('/reports', async (request: FastifyRequest, reply: FastifyReply) => {
      const reports = this.reportsService.getReports();
      reply.send(reports);
    });

    // Obtenir un rapport
    fastify.get('/reports/:reportId', async (request: FastifyRequest, reply: FastifyReply) => {
      const { reportId } = request.params as any;
      const report = this.reportsService.getReport(reportId);

      if (!report) {
        reply.code(404).send({ error: 'Rapport non trouvé' });
        return;
      }

      reply.send(report);
    });

    // Mettre à jour un rapport
    fastify.put('/reports/:reportId', async (request: FastifyRequest, reply: FastifyReply) => {
      const { reportId } = request.params as any;
      const updates = request.body as any;

      try {
        await this.reportsService.updateReport(reportId, updates);
        reply.send({ message: 'Rapport mis à jour avec succès' });
      } catch (error) {
        reply.code(500).send({ error: 'Erreur mise à jour rapport' });
      }
    });

    // Supprimer un rapport
    fastify.delete('/reports/:reportId', async (request: FastifyRequest, reply: FastifyReply) => {
      const { reportId } = request.params as any;

      try {
        await this.reportsService.deleteReport(reportId);
        reply.send({ message: 'Rapport supprimé avec succès' });
      } catch (error) {
        reply.code(500).send({ error: 'Erreur suppression rapport' });
      }
    });
  }

  private async adminRoutes(fastify: FastifyInstance): Promise<void> {
    // Métriques de performance
    fastify.get('/admin/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
      const metrics = {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
        connections: Array.from(this.connectionStates.values()),
        activeQueries: Array.from(this.activeQueries.values()),
        performance: Object.fromEntries(this.performanceMetrics.entries()),
        database: this.dbService.getPoolStats(),
      };

      reply.send(metrics);
    });

    // Redémarrer le serveur
    fastify.post('/admin/restart', async (request: FastifyRequest, reply: FastifyReply) => {
      reply.send({ message: 'Redémarrage en cours...' });
      
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    });
  }

  private async registerWebSocket(): Promise<void> {
    this.fastify.register(async (fastify) => {
      fastify.get('/ws', { websocket: true }, async (connection, req) => {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        connection.socket.on('message', async (message) => {
          try {
            const data = JSON.parse(message.toString());
            
            switch (data.type) {
              case 'query':
                await this.handleWebSocketQuery(connection, data);
                break;
              case 'subscribe':
                await this.handleWebSocketSubscription(connection, data);
                break;
              case 'ping':
                connection.socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            }
          } catch (error) {
            connection.socket.send(JSON.stringify({ 
              type: 'error', 
              message: 'Erreur traitement message' 
            }));
          }
        });

        connection.socket.on('close', () => {
          this.logger.info(`Client WebSocket déconnecté: ${clientId}`);
        });

        connection.socket.send(JSON.stringify({
          type: 'connected',
          clientId,
          timestamp: Date.now(),
        }));
      });
    });
  }

  private async handleWebSocketQuery(connection: any, data: any): Promise<void> {
    try {
      const result = await this.dbService.executeQuery(
        data.connectionId,
        data.sql,
        data.parameters || [],
        data.useCache !== false
      );

      connection.socket.send(JSON.stringify({
        type: 'query_result',
        queryId: data.queryId,
        data: result.data,
        fields: result.fields,
        executionTime: result.executionTime,
        fromCache: result.fromCache,
      }));
    } catch (error) {
      connection.socket.send(JSON.stringify({
        type: 'query_error',
        queryId: data.queryId,
        error: 'Erreur exécution requête',
      }));
    }
  }

  private async handleWebSocketSubscription(connection: any, data: any): Promise<void> {
    // Implémentation des souscriptions temps réel
    connection.socket.send(JSON.stringify({
      type: 'subscribed',
      subscription: data.subscription,
      timestamp: Date.now(),
    }));
  }

  private getMimeType(format: string): string {
    const mimeTypes: { [key: string]: string } = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      csv: 'text/csv',
      html: 'text/html',
    };

    return mimeTypes[format] || 'application/octet-stream';
  }

  private recordPerformanceMetric(metric: string, value: number): void {
    if (!this.performanceMetrics.has(metric)) {
      this.performanceMetrics.set(metric, {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
        avg: 0,
      });
    }

    const stats = this.performanceMetrics.get(metric);
    stats.count++;
    stats.total += value;
    stats.min = Math.min(stats.min, value);
    stats.max = Math.max(stats.max, value);
    stats.avg = stats.total / stats.count;
  }

  async start(): Promise<void> {
    try {
      await this.fastify.listen({ 
        port: SERVER_CONFIG.port, 
        host: SERVER_CONFIG.host 
      });
      
      this.logger.info(`Serveur Fastify démarré sur ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
      this.logger.info(`Documentation API disponible sur: http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}/docs`);
    } catch (error) {
      this.logger.error('Erreur démarrage serveur:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    try {
      await this.fastify.close();
      await this.dbService.close();
      this.logger.info('Serveur Fastify arrêté');
    } catch (error) {
      this.logger.error('Erreur arrêt serveur:', error);
    }
  }
}

// Clustering pour haute performance
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const server = new VB6FastifyServer();
  
  server.initialize().then(() => {
    server.start();
  }).catch(error => {
    console.error('Erreur initialisation serveur:', error);
    process.exit(1);
  });

  // Gestion des signaux
  process.on('SIGINT', async () => {
    console.log('Arrêt en cours...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Arrêt demandé...');
    await server.stop();
    process.exit(0);
  });
}

export { VB6FastifyServer };