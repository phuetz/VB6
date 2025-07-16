/**
 * Moniteur de performance pour VB6 Studio
 * Collecte et analyse des métriques de performance en temps réel
 */

import { Logger } from '../utils/Logger';

interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  memoryUsage?: NodeJS.MemoryUsage;
}

interface PerformanceMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    slowestRequest: RequestMetric | null;
    fastestRequest: RequestMetric | null;
    requestsPerSecond: number;
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    loadAverage: number[];
  };
  database: {
    totalQueries: number;
    averageQueryTime: number;
    slowestQuery: any | null;
    cacheHitRate: number;
    activeConnections: number;
  };
  cache: {
    totalKeys: number;
    hitRate: number;
    memoryUsage: number;
    totalOperations: number;
  };
  errors: {
    total: number;
    last24Hours: number;
    mostFrequentErrors: Array<{ message: string; count: number }>;
  };
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // en secondes
  enabled: boolean;
  triggered: boolean;
  lastTriggered?: Date;
  actions: Array<{
    type: 'log' | 'webhook' | 'email';
    config: Record<string, any>;
  }>;
}

export class PerformanceMonitor {
  private logger: Logger;
  private metrics: RequestMetric[];
  private queryMetrics: any[];
  private errorMetrics: any[];
  private alertRules: Map<string, AlertRule>;
  private cpuUsageStart: NodeJS.CpuUsage;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private maxMetricsHistory: number;

  constructor() {
    this.logger = new Logger('PerformanceMonitor');
    this.metrics = [];
    this.queryMetrics = [];
    this.errorMetrics = [];
    this.alertRules = new Map();
    this.cpuUsageStart = process.cpuUsage();
    this.maxMetricsHistory = parseInt(process.env.MAX_METRICS_HISTORY || '10000', 10);
    this.initializeDefaultAlertRules();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initialisation du moniteur de performance...');

    // Démarrage du monitoring système
    this.startSystemMonitoring();

    // Initialisation des règles d'alerte
    this.loadAlertRules();

    this.logger.info('Moniteur de performance initialisé');
  }

  /**
   * Enregistre une métrique de requête
   */
  recordRequest(method: string, path: string, statusCode: number, duration: number): void {
    const metric: RequestMetric = {
      method,
      path,
      statusCode,
      duration,
      timestamp: new Date(),
      memoryUsage: process.memoryUsage(),
    };

    this.metrics.push(metric);

    // Limitation de l'historique
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Vérification des alertes
    this.checkAlerts('response_time', duration);
    this.checkAlerts('error_rate', statusCode >= 400 ? 1 : 0);

    // Logging des requêtes lentes
    if (duration > 5000) {
      // Plus de 5 secondes
      this.logger.warn(`Requête lente détectée: ${method} ${path} - ${duration}ms`);
    }

    // Logging des erreurs
    if (statusCode >= 500) {
      this.recordError(`HTTP ${statusCode}`, `${method} ${path}`, { duration, statusCode });
    }
  }

  /**
   * Enregistre une métrique de requête base de données
   */
  recordDatabaseQuery(connectionId: string, sql: string, duration: number, error?: Error): void {
    const queryMetric = {
      connectionId,
      sql: sql.substring(0, 200),
      duration,
      timestamp: new Date(),
      error: error ? error.message : null,
      success: !error,
    };

    this.queryMetrics.push(queryMetric);

    // Limitation de l'historique
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics.shift();
    }

    // Vérification des alertes
    this.checkAlerts('query_time', duration);

    // Logging des requêtes lentes
    if (duration > 10000) {
      // Plus de 10 secondes
      this.logger.warn(`Requête BD lente: ${sql.substring(0, 100)}... - ${duration}ms`);
    }

    if (error) {
      this.recordError('Database Error', error.message, {
        connectionId,
        sql: sql.substring(0, 100),
        duration,
      });
    }
  }

  /**
   * Enregistre une erreur
   */
  recordError(type: string, message: string, details?: any): void {
    const errorMetric = {
      type,
      message,
      details,
      timestamp: new Date(),
      stack: details?.stack,
    };

    this.errorMetrics.push(errorMetric);

    // Limitation de l'historique
    if (this.errorMetrics.length > this.maxMetricsHistory) {
      this.errorMetrics.shift();
    }

    this.logger.error(`${type}: ${message}`, details);
  }

  /**
   * Obtient les métriques de performance actuelles
   */
  async getMetrics(): Promise<PerformanceMetrics> {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const lastMinute = now - 60 * 1000;

    // Métriques des requêtes
    const recentRequests = this.metrics.filter(m => m.timestamp.getTime() > last24Hours);
    const successfulRequests = recentRequests.filter(m => m.statusCode < 400);
    const failedRequests = recentRequests.filter(m => m.statusCode >= 400);
    const lastMinuteRequests = this.metrics.filter(m => m.timestamp.getTime() > lastMinute);

    const averageResponseTime =
      recentRequests.length > 0
        ? recentRequests.reduce((sum, m) => sum + m.duration, 0) / recentRequests.length
        : 0;

    const slowestRequest =
      recentRequests.length > 0
        ? recentRequests.reduce((prev, curr) => (prev.duration > curr.duration ? prev : curr))
        : null;

    const fastestRequest =
      recentRequests.length > 0
        ? recentRequests.reduce((prev, curr) => (prev.duration < curr.duration ? prev : curr))
        : null;

    // Métriques des requêtes BD
    const recentQueries = this.queryMetrics.filter(q => q.timestamp.getTime() > last24Hours);
    const averageQueryTime =
      recentQueries.length > 0
        ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length
        : 0;

    const slowestQuery =
      recentQueries.length > 0
        ? recentQueries.reduce((prev, curr) => (prev.duration > curr.duration ? prev : curr))
        : null;

    // Métriques des erreurs
    const recentErrors = this.errorMetrics.filter(e => e.timestamp.getTime() > last24Hours);
    const errorCounts = this.groupErrorsByMessage(recentErrors);
    const mostFrequentErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Métriques système
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.cpuUsageStart);

    return {
      requests: {
        total: recentRequests.length,
        successful: successfulRequests.length,
        failed: failedRequests.length,
        averageResponseTime: Math.round(averageResponseTime),
        slowestRequest,
        fastestRequest,
        requestsPerSecond: lastMinuteRequests.length / 60,
      },
      system: {
        uptime: process.uptime(),
        memoryUsage,
        cpuUsage,
        loadAverage: process.platform === 'linux' ? [0, 0, 0] : [], // Simulation
      },
      database: {
        totalQueries: recentQueries.length,
        averageQueryTime: Math.round(averageQueryTime),
        slowestQuery,
        cacheHitRate: this.calculateCacheHitRate(),
        activeConnections: 0, // À implémenter avec le gestionnaire de connexions
      },
      cache: {
        totalKeys: 0, // À implémenter avec le cache manager
        hitRate: this.calculateCacheHitRate(),
        memoryUsage: 0,
        totalOperations: 0,
      },
      errors: {
        total: this.errorMetrics.length,
        last24Hours: recentErrors.length,
        mostFrequentErrors,
      },
    };
  }

  /**
   * Démarrage du monitoring système
   */
  private startSystemMonitoring(): void {
    // Monitoring toutes les 30 secondes
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.evaluateAlertRules();
    }, 30000);

    this.logger.debug('Monitoring système démarré');
  }

  /**
   * Collecte les métriques système
   */
  private collectSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Vérification de la mémoire
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    this.checkAlerts('memory_usage', memoryUsedMB);

    // Vérification du CPU (simulation)
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 / 30; // Approximation
    this.checkAlerts('cpu_usage', cpuPercent);

    this.logger.debug('Métriques système collectées', {
      memory: `${Math.round(memoryUsedMB)}MB`,
      cpu: `${Math.round(cpuPercent * 100)}%`,
    });
  }

  /**
   * Initialise les règles d'alerte par défaut
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_response_time',
        name: 'Temps de réponse élevé',
        metric: 'response_time',
        operator: 'gt',
        threshold: 5000, // 5 secondes
        duration: 60, // 1 minute
        enabled: true,
        triggered: false,
        actions: [{ type: 'log', config: { level: 'warn' } }],
      },
      {
        id: 'high_error_rate',
        name: "Taux d'erreur élevé",
        metric: 'error_rate',
        operator: 'gt',
        threshold: 0.1, // 10%
        duration: 300, // 5 minutes
        enabled: true,
        triggered: false,
        actions: [{ type: 'log', config: { level: 'error' } }],
      },
      {
        id: 'high_memory_usage',
        name: 'Utilisation mémoire élevée',
        metric: 'memory_usage',
        operator: 'gt',
        threshold: 512, // 512 MB
        duration: 300, // 5 minutes
        enabled: true,
        triggered: false,
        actions: [{ type: 'log', config: { level: 'warn' } }],
      },
      {
        id: 'slow_database_query',
        name: 'Requête base de données lente',
        metric: 'query_time',
        operator: 'gt',
        threshold: 10000, // 10 secondes
        duration: 0, // Immédiat
        enabled: true,
        triggered: false,
        actions: [{ type: 'log', config: { level: 'warn' } }],
      },
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    this.logger.info(`${defaultRules.length} règles d'alerte par défaut initialisées`);
  }

  /**
   * Charge les règles d'alerte personnalisées
   */
  private loadAlertRules(): void {
    // En production, on chargerait depuis une base de données ou un fichier de config
    this.logger.debug("Chargement des règles d'alerte personnalisées...");
  }

  /**
   * Vérifie les règles d'alerte pour une métrique
   */
  private checkAlerts(metric: string, value: number): void {
    this.alertRules.forEach(rule => {
      if (!rule.enabled || rule.metric !== metric) {
        return;
      }

      const shouldTrigger = this.evaluateCondition(value, rule.operator, rule.threshold);

      if (shouldTrigger && !rule.triggered) {
        this.triggerAlert(rule, value);
      } else if (!shouldTrigger && rule.triggered) {
        this.resolveAlert(rule);
      }
    });
  }

  /**
   * Évalue une condition d'alerte
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  /**
   * Déclenche une alerte
   */
  private triggerAlert(rule: AlertRule, value: number): void {
    rule.triggered = true;
    rule.lastTriggered = new Date();

    this.logger.warn(`ALERTE DÉCLENCHÉE: ${rule.name}`, {
      rule: rule.id,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
    });

    // Exécution des actions
    rule.actions.forEach(action => {
      this.executeAlertAction(action, rule, value);
    });

    // Enregistrement de l'alerte comme erreur
    this.recordError('Alert Triggered', rule.name, {
      ruleId: rule.id,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
    });
  }

  /**
   * Résout une alerte
   */
  private resolveAlert(rule: AlertRule): void {
    rule.triggered = false;

    this.logger.info(`Alerte résolue: ${rule.name}`, {
      rule: rule.id,
      metric: rule.metric,
    });
  }

  /**
   * Exécute une action d'alerte
   */
  private executeAlertAction(action: any, rule: AlertRule, value: number): void {
    switch (action.type) {
      case 'log': {
        const level = action.config.level || 'warn';
        this.logger[level as keyof Logger](
          `Alerte: ${rule.name} - Valeur: ${value}, Seuil: ${rule.threshold}`
        );
        break;
      }

      case 'webhook':
        // En production, on enverrait un webhook
        this.logger.debug(`Webhook alerte simulé pour: ${rule.name}`);
        break;

      case 'email':
        // En production, on enverrait un email
        this.logger.debug(`Email alerte simulé pour: ${rule.name}`);
        break;

      default:
        this.logger.warn(`Type d'action d'alerte non supporté: ${action.type}`);
    }
  }

  /**
   * Évalue toutes les règles d'alerte
   */
  private evaluateAlertRules(): void {
    // Cette méthode pourrait implémenter des évaluations plus complexes
    // basées sur des tendances ou des agrégations
  }

  /**
   * Calcule le taux de cache hit (simulation)
   */
  private calculateCacheHitRate(): number {
    // En production, on récupérerait les vraies statistiques du cache
    return Math.random() * 100; // Simulation
  }

  /**
   * Groupe les erreurs par message
   */
  private groupErrorsByMessage(errors: any[]): Record<string, number> {
    return errors.reduce((acc, error) => {
      const message = error.message || 'Unknown error';
      acc[message] = (acc[message] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Obtient les métriques en temps réel pour un endpoint spécifique
   */
  getEndpointMetrics(path: string): any {
    const endpointMetrics = this.metrics.filter(m => m.path === path);

    if (endpointMetrics.length === 0) {
      return null;
    }

    const totalRequests = endpointMetrics.length;
    const averageResponseTime =
      endpointMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const successRate = endpointMetrics.filter(m => m.statusCode < 400).length / totalRequests;

    return {
      path,
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round(successRate * 100),
      slowestRequest: endpointMetrics.reduce((prev, curr) =>
        prev.duration > curr.duration ? prev : curr
      ),
      fastestRequest: endpointMetrics.reduce((prev, curr) =>
        prev.duration < curr.duration ? prev : curr
      ),
    };
  }

  /**
   * Nettoie les métriques anciennes
   */
  cleanup(): void {
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 jours

    const initialMetricsCount = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoffTime);

    const initialQueriesCount = this.queryMetrics.length;
    this.queryMetrics = this.queryMetrics.filter(q => q.timestamp.getTime() > cutoffTime);

    const initialErrorsCount = this.errorMetrics.length;
    this.errorMetrics = this.errorMetrics.filter(e => e.timestamp.getTime() > cutoffTime);

    const cleanedMetrics = initialMetricsCount - this.metrics.length;
    const cleanedQueries = initialQueriesCount - this.queryMetrics.length;
    const cleanedErrors = initialErrorsCount - this.errorMetrics.length;

    if (cleanedMetrics > 0 || cleanedQueries > 0 || cleanedErrors > 0) {
      this.logger.info(
        `Nettoyage métriques: ${cleanedMetrics} requêtes, ${cleanedQueries} requêtes BD, ${cleanedErrors} erreurs supprimées`
      );
    }
  }

  /**
   * Arrête le monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.logger.info('Monitoring arrêté');
  }

  /**
   * Redémarre le monitoring
   */
  restart(): void {
    this.stop();
    this.startSystemMonitoring();
    this.logger.info('Monitoring redémarré');
  }

  /**
   * Exporte les métriques au format JSON
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        requests: this.metrics,
        queries: this.queryMetrics,
        errors: this.errorMetrics,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }
}
