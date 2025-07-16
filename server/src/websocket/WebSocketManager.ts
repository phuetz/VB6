/**
 * Gestionnaire WebSocket pour VB6 Studio
 * Communications temps réel pour les données et notifications
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { DatabaseManager } from '../database/DatabaseManager';
import { Logger } from '../utils/Logger';
import { DataNotification } from '../types/database';

interface ConnectedClient {
  id: string;
  socket: Socket;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    userId?: string;
    sessionId?: string;
  };
}

interface SubscriptionInfo {
  type: 'table' | 'query' | 'connection' | 'report';
  target: string;
  filters?: Record<string, any>;
  clientId: string;
  subscribedAt: Date;
}

export class WebSocketManager {
  private logger: Logger;
  private clients: Map<string, ConnectedClient>;
  private subscriptions: Map<string, SubscriptionInfo[]>;
  private eventHandlers: Map<string, (...args: any[]) => void>;

  constructor(
    private io: SocketIOServer,
    private databaseManager: DatabaseManager
  ) {
    this.logger = new Logger('WebSocketManager');
    this.clients = new Map();
    this.subscriptions = new Map();
    this.eventHandlers = new Map();
    this.initializeEventHandlers();
  }

  /**
   * Gère une nouvelle connexion WebSocket
   */
  handleConnection(socket: Socket): void {
    const clientId = socket.id;

    const client: ConnectedClient = {
      id: clientId,
      socket,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set(),
      metadata: {
        userAgent: socket.handshake.headers['user-agent'],
        ipAddress: socket.handshake.address,
        userId: socket.handshake.auth?.userId,
        sessionId: socket.handshake.auth?.sessionId,
      },
    };

    this.clients.set(clientId, client);
    this.logger.websocket('client_connected', clientId, {
      totalClients: this.clients.size,
      userAgent: client.metadata.userAgent,
      ipAddress: client.metadata.ipAddress,
    });

    // Configuration des gestionnaires d'événements
    this.setupSocketEventHandlers(socket, client);

    // Envoi des informations de connexion
    socket.emit('connected', {
      clientId,
      serverTime: new Date().toISOString(),
      capabilities: this.getServerCapabilities(),
    });
  }

  /**
   * Gère la déconnexion d'un client
   */
  handleDisconnection(socket: Socket): void {
    const clientId = socket.id;
    const client = this.clients.get(clientId);

    if (client) {
      // Nettoyage des souscriptions
      this.cleanupClientSubscriptions(clientId);

      // Suppression du client
      this.clients.delete(clientId);

      const connectionDuration = Date.now() - client.connectedAt.getTime();
      this.logger.websocket('client_disconnected', clientId, {
        connectionDuration,
        totalClients: this.clients.size,
        subscriptions: client.subscriptions.size,
      });
    }
  }

  /**
   * Configuration des gestionnaires d'événements du socket
   */
  private setupSocketEventHandlers(socket: Socket, client: ConnectedClient): void {
    // Souscription aux changements de données
    socket.on('subscribe', data => {
      this.handleSubscribe(client, data);
    });

    // Désouscription
    socket.on('unsubscribe', data => {
      this.handleUnsubscribe(client, data);
    });

    // Exécution de requête en temps réel
    socket.on('execute_query', data => {
      this.handleExecuteQuery(client, data);
    });

    // Demande de statut de connexion
    socket.on('connection_status', data => {
      this.handleConnectionStatus(client, data);
    });

    // Ping/Pong pour maintenir la connexion
    socket.on('ping', () => {
      client.lastActivity = new Date();
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Demande de statistiques
    socket.on('get_stats', () => {
      this.handleGetStats(client);
    });

    // Gestion des erreurs
    socket.on('error', error => {
      this.logger.error(`Erreur WebSocket client ${client.id}:`, error);
    });
  }

  /**
   * Initialise les gestionnaires d'événements internes
   */
  private initializeEventHandlers(): void {
    this.eventHandlers.set('table_changed', this.notifyTableChange.bind(this));
    this.eventHandlers.set('connection_lost', this.notifyConnectionLost.bind(this));
    this.eventHandlers.set('query_completed', this.notifyQueryCompleted.bind(this));
    this.eventHandlers.set('report_generated', this.notifyReportGenerated.bind(this));
  }

  /**
   * Gère la souscription à des événements
   */
  private async handleSubscribe(client: ConnectedClient, data: any): Promise<void> {
    try {
      const { type, target, filters } = data;

      if (!type || !target) {
        client.socket.emit('subscribe_error', {
          error: 'Type et target requis pour la souscription',
        });
        return;
      }

      const subscriptionKey = `${type}:${target}`;

      // Ajout à la liste des souscriptions du client
      client.subscriptions.add(subscriptionKey);

      // Ajout à la liste globale des souscriptions
      if (!this.subscriptions.has(subscriptionKey)) {
        this.subscriptions.set(subscriptionKey, []);
      }

      const subscription: SubscriptionInfo = {
        type,
        target,
        filters,
        clientId: client.id,
        subscribedAt: new Date(),
      };

      this.subscriptions.get(subscriptionKey)!.push(subscription);

      this.logger.websocket('subscription_added', client.id, {
        type,
        target,
        totalSubscriptions: client.subscriptions.size,
      });

      client.socket.emit('subscribed', {
        type,
        target,
        subscriptionKey,
        message: 'Souscription réussie',
      });

      // Envoi des données initiales si demandées
      if (data.sendInitialData) {
        await this.sendInitialData(client, subscription);
      }
    } catch (error) {
      this.logger.error(`Erreur souscription client ${client.id}:`, error);
      client.socket.emit('subscribe_error', {
        error: 'Erreur lors de la souscription',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }

  /**
   * Gère la désouscription
   */
  private handleUnsubscribe(client: ConnectedClient, data: any): void {
    try {
      const { type, target } = data;
      const subscriptionKey = `${type}:${target}`;

      // Suppression de la souscription du client
      client.subscriptions.delete(subscriptionKey);

      // Suppression de la liste globale
      const subscriptions = this.subscriptions.get(subscriptionKey);
      if (subscriptions) {
        const index = subscriptions.findIndex(sub => sub.clientId === client.id);
        if (index !== -1) {
          subscriptions.splice(index, 1);

          // Suppression de la clé si plus de souscriptions
          if (subscriptions.length === 0) {
            this.subscriptions.delete(subscriptionKey);
          }
        }
      }

      this.logger.websocket('subscription_removed', client.id, {
        type,
        target,
        totalSubscriptions: client.subscriptions.size,
      });

      client.socket.emit('unsubscribed', {
        type,
        target,
        message: 'Désouscription réussie',
      });
    } catch (error) {
      this.logger.error(`Erreur désouscription client ${client.id}:`, error);
    }
  }

  /**
   * Gère l'exécution de requête en temps réel
   */
  private async handleExecuteQuery(client: ConnectedClient, data: any): Promise<void> {
    try {
      const { queryId, connectionId, sql, parameters } = data;

      if (!queryId || !connectionId || !sql) {
        client.socket.emit('query_error', {
          queryId,
          error: 'queryId, connectionId et sql requis',
        });
        return;
      }

      this.logger.websocket('query_start', client.id, { queryId, sql: sql.substring(0, 100) });

      const startTime = Date.now();
      const result = await this.databaseManager.executeVB6Query(connectionId, sql, parameters);
      const executionTime = Date.now() - startTime;

      client.socket.emit('query_result', {
        queryId,
        success: true,
        data: result.data,
        recordsAffected: result.recordsAffected,
        executionTime,
        fromCache: result.fromCache,
      });

      this.logger.websocket('query_completed', client.id, {
        queryId,
        executionTime,
        recordsCount: result.data.length,
      });
    } catch (error) {
      this.logger.error(`Erreur exécution requête client ${client.id}:`, error);

      client.socket.emit('query_error', {
        queryId: data.queryId,
        error: 'Erreur exécution requête',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }

  /**
   * Gère la demande de statut de connexion
   */
  private async handleConnectionStatus(client: ConnectedClient, data: any): Promise<void> {
    try {
      const { connectionId } = data;

      // Simulation de vérification de statut
      const status = {
        connectionId,
        isConnected: true,
        lastActivity: new Date(),
        statistics: {
          queriesExecuted: 150,
          totalExecutionTime: 45000,
          errorsCount: 2,
          cacheHits: 75,
        },
      };

      client.socket.emit('connection_status_result', status);
    } catch (error) {
      this.logger.error(`Erreur statut connexion client ${client.id}:`, error);
    }
  }

  /**
   * Gère la demande de statistiques
   */
  private handleGetStats(client: ConnectedClient): void {
    try {
      const stats = {
        connectedClients: this.clients.size,
        totalSubscriptions: Array.from(this.subscriptions.values()).reduce(
          (sum, subs) => sum + subs.length,
          0
        ),
        serverUptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        clientInfo: {
          id: client.id,
          connectedAt: client.connectedAt,
          subscriptions: client.subscriptions.size,
          lastActivity: client.lastActivity,
        },
      };

      client.socket.emit('stats_result', stats);
    } catch (error) {
      this.logger.error(`Erreur statistiques client ${client.id}:`, error);
    }
  }

  /**
   * Envoie les données initiales pour une souscription
   */
  private async sendInitialData(
    client: ConnectedClient,
    subscription: SubscriptionInfo
  ): Promise<void> {
    try {
      switch (subscription.type) {
        case 'table': {
          // Simulation de données de table
          const tableData = {
            tableName: subscription.target,
            recordCount: 1000,
            lastModified: new Date(),
            recentChanges: [],
          };
          client.socket.emit('initial_data', { subscription, data: tableData });
          break;
        }

        case 'connection': {
          // Simulation de statut de connexion
          const connectionData = {
            connectionId: subscription.target,
            isConnected: true,
            statistics: {
              queriesExecuted: 0,
              totalExecutionTime: 0,
              errorsCount: 0,
            },
          };
          client.socket.emit('initial_data', { subscription, data: connectionData });
          break;
        }

        default:
          this.logger.warn(`Type de souscription non supporté: ${subscription.type}`);
      }
    } catch (error) {
      this.logger.error(`Erreur envoi données initiales:`, error);
    }
  }

  /**
   * Diffuse une notification à tous les clients concernés
   */
  broadcast(notification: DataNotification): void {
    const subscriptionKey = `${notification.type}:${notification.source}`;
    const subscribers = this.subscriptions.get(subscriptionKey);

    if (!subscribers || subscribers.length === 0) {
      return;
    }

    this.logger.websocket('broadcast_notification', 'server', {
      type: notification.type,
      source: notification.source,
      subscribersCount: subscribers.length,
    });

    subscribers.forEach(subscription => {
      const client = this.clients.get(subscription.clientId);
      if (client) {
        // Application des filtres si nécessaire
        if (this.shouldNotifyClient(subscription, notification)) {
          client.socket.emit('data_notification', notification);
        }
      }
    });
  }

  /**
   * Notifie un changement de table
   */
  private notifyTableChange(tableName: string, changeType: string, details: any): void {
    const notification: DataNotification = {
      type: 'table-changed',
      timestamp: new Date(),
      source: tableName,
      data: {
        changeType,
        ...details,
      },
    };

    this.broadcast(notification);
  }

  /**
   * Notifie une perte de connexion
   */
  private notifyConnectionLost(connectionId: string, error: string): void {
    const notification: DataNotification = {
      type: 'connection-lost',
      timestamp: new Date(),
      source: connectionId,
      data: { error },
    };

    this.broadcast(notification);
  }

  /**
   * Notifie la completion d'une requête
   */
  private notifyQueryCompleted(queryId: string, result: any): void {
    // Notification spécifique aux clients intéressés
    this.clients.forEach(client => {
      client.socket.emit('query_completed_broadcast', {
        queryId,
        result: {
          recordsAffected: result.recordsAffected,
          executionTime: result.executionTime,
          timestamp: new Date(),
        },
      });
    });
  }

  /**
   * Notifie la génération d'un rapport
   */
  private notifyReportGenerated(reportId: string, status: string): void {
    const notification: DataNotification = {
      type: 'record-changed',
      timestamp: new Date(),
      source: 'reports',
      target: reportId,
      data: { status },
    };

    this.broadcast(notification);
  }

  /**
   * Vérifie si un client doit être notifié selon ses filtres
   */
  private shouldNotifyClient(
    subscription: SubscriptionInfo,
    notification: DataNotification
  ): boolean {
    if (!subscription.filters) {
      return true;
    }

    // Application des filtres personnalisés
    // Implémentation basique
    return true;
  }

  /**
   * Nettoie les souscriptions d'un client
   */
  private cleanupClientSubscriptions(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.forEach(subscriptionKey => {
      const subscriptions = this.subscriptions.get(subscriptionKey);
      if (subscriptions) {
        const index = subscriptions.findIndex(sub => sub.clientId === clientId);
        if (index !== -1) {
          subscriptions.splice(index, 1);

          if (subscriptions.length === 0) {
            this.subscriptions.delete(subscriptionKey);
          }
        }
      }
    });
  }

  /**
   * Obtient les capacités du serveur
   */
  private getServerCapabilities(): any {
    return {
      version: '1.0.0',
      supportedSubscriptions: ['table', 'query', 'connection', 'report'],
      maxSubscriptionsPerClient: 100,
      features: [
        'real-time-queries',
        'data-notifications',
        'connection-monitoring',
        'performance-stats',
      ],
    };
  }

  /**
   * Diffuse un message à tous les clients connectés
   */
  broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
    this.logger.websocket('broadcast_all', 'server', {
      event,
      clientsCount: this.clients.size,
    });
  }

  /**
   * Diffuse un message à des clients spécifiques
   */
  broadcastToClients(clientIds: string[], event: string, data: any): void {
    clientIds.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client) {
        client.socket.emit(event, data);
      }
    });

    this.logger.websocket('broadcast_targeted', 'server', {
      event,
      targetCount: clientIds.length,
    });
  }

  /**
   * Obtient les statistiques du gestionnaire WebSocket
   */
  getStats(): any {
    const now = Date.now();
    const clientStats = Array.from(this.clients.values()).map(client => ({
      id: client.id,
      connectedAt: client.connectedAt,
      connectionDuration: now - client.connectedAt.getTime(),
      subscriptions: client.subscriptions.size,
      lastActivity: client.lastActivity,
      metadata: client.metadata,
    }));

    const subscriptionStats = Array.from(this.subscriptions.entries()).map(([key, subs]) => ({
      key,
      subscribersCount: subs.length,
      subscribers: subs.map(s => s.clientId),
    }));

    return {
      connectedClients: this.clients.size,
      totalSubscriptions: subscriptionStats.reduce((sum, stat) => sum + stat.subscribersCount, 0),
      uniqueSubscriptions: this.subscriptions.size,
      clients: clientStats,
      subscriptions: subscriptionStats,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  /**
   * Démarre une tâche de nettoyage périodique
   */
  startCleanupTask(): void {
    // Nettoyage toutes les 30 minutes
    setInterval(
      () => {
        this.performCleanup();
      },
      30 * 60 * 1000
    );
  }

  /**
   * Effectue le nettoyage des connexions inactives
   */
  private performCleanup(): void {
    const now = Date.now();
    const timeoutDuration = 24 * 60 * 60 * 1000; // 24 heures
    let cleanedCount = 0;

    this.clients.forEach((client, clientId) => {
      const inactiveDuration = now - client.lastActivity.getTime();

      if (inactiveDuration > timeoutDuration) {
        client.socket.disconnect(true);
        this.clients.delete(clientId);
        this.cleanupClientSubscriptions(clientId);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.logger.info(`Nettoyage WebSocket: ${cleanedCount} clients inactifs supprimés`);
    }
  }
}
