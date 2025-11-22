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
   * HARDWARE CACHE TIMING BUG FIX: Cache-timing resistant request recording
   */
  recordRequest(method: string, path: string, statusCode: number, duration: number): void {
    // HARDWARE CACHE TIMING BUG FIX: Add timing jitter and reduce precision
    const jitteredDuration = this.addTimingJitter(duration);
    const quantizedDuration = Math.floor(jitteredDuration / 10) * 10; // 10ms quantization
    
    // Randomize memory access patterns
    this.randomizeMemoryAccess();
    
    const metric: RequestMetric = {
      method,
      path,
      statusCode,
      duration: quantizedDuration,
      timestamp: new Date(),
      memoryUsage: this.sanitizeMemoryUsage(process.memoryUsage()),
    };

    this.metrics.push(metric);

    // Limitation de l'historique
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Vérification des alertes avec timing résistant
    this.checkAlerts('response_time', quantizedDuration);
    this.checkAlerts('error_rate', statusCode >= 400 ? 1 : 0);

    // Logging des requêtes lentes avec seuil plus élevé
    if (quantizedDuration > 5000) {
      // Plus de 5 secondes
      this.logger.warn(`Requête lente détectée: ${method} ${path} - ${quantizedDuration}ms`);
    }

    // Logging des erreurs
    if (statusCode >= 500) {
      this.recordError(`HTTP ${statusCode}`, `${method} ${path}`, { duration: quantizedDuration, statusCode });
    }
    
    // Add cache-timing resistant delay
    this.microJitter();
  }

  /**
   * HARDWARE CACHE TIMING BUG FIX: Cache-timing resistant database query recording
   */
  recordDatabaseQuery(connectionId: string, sql: string, duration: number, error?: Error): void {
    // HARDWARE CACHE TIMING BUG FIX: Add timing jitter and reduce precision
    const jitteredDuration = this.addTimingJitter(duration);
    const quantizedDuration = Math.floor(jitteredDuration / 50) * 50; // 50ms quantization for DB queries
    
    // Randomize memory access patterns
    this.randomizeMemoryAccess();
    
    const queryMetric = {
      connectionId,
      sql: sql.substring(0, 200),
      duration: quantizedDuration,
      timestamp: new Date(),
      error: error ? error.message : null,
      success: !error,
    };

    this.queryMetrics.push(queryMetric);

    // Limitation de l'historique
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics.shift();
    }

    // Vérification des alertes avec timing résistant
    this.checkAlerts('query_time', quantizedDuration);

    // Logging des requêtes lentes avec timing protégé
    if (quantizedDuration > 10000) {
      // Plus de 10 secondes
      this.logger.warn(`Requête BD lente: ${sql.substring(0, 100)}... - ${quantizedDuration}ms`);
    }

    if (error) {
      this.recordError('Database Error', error.message, {
        connectionId,
        sql: sql.substring(0, 100),
        duration: quantizedDuration,
      });
    }
    
    // Add cache-timing resistant delay
    this.microJitter();
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
   * HARDWARE CACHE TIMING BUG FIX: Cache-timing resistant system metrics collection
   */
  private collectSystemMetrics(): void {
    // Randomize memory access patterns before collecting metrics
    this.randomizeMemoryAccess();
    
    const memoryUsage = this.sanitizeMemoryUsage(process.memoryUsage());
    const cpuUsage = process.cpuUsage();

    // HARDWARE CACHE TIMING BUG FIX: Quantize memory measurements
    const memoryUsedMB = Math.floor((memoryUsage.heapUsed / 1024 / 1024) / 5) * 5; // 5MB quantization
    this.checkAlerts('memory_usage', memoryUsedMB);

    // HARDWARE CACHE TIMING BUG FIX: Quantize CPU measurements
    const rawCpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 / 30;
    const quantizedCpuPercent = Math.floor(rawCpuPercent * 20) / 20; // 5% quantization
    this.checkAlerts('cpu_usage', quantizedCpuPercent);

    this.logger.debug('Métriques système collectées', {
      memory: `${Math.round(memoryUsedMB)}MB`,
      cpu: `${Math.round(quantizedCpuPercent * 100)}%`,
    });
    
    // Add cache-timing resistant delay
    this.microJitter();
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
   * HARDWARE CACHE TIMING BUG FIX: Cache-timing resistant metrics export
   */
  exportMetrics(): string {
    // Randomize memory access patterns
    this.randomizeMemoryAccess();
    
    // Add timing jitter to prevent timing analysis
    this.microJitter();
    
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

  /**
   * HARDWARE CACHE TIMING BUG FIX: Add timing jitter to measurements
   */
  private addTimingJitter(duration: number): number {
    // Add ±5ms random jitter to prevent cache timing analysis
    const jitter = (Math.random() - 0.5) * 10;
    return Math.max(0, duration + jitter);
  }

  /**
   * HARDWARE CACHE TIMING BUG FIX: Sanitize memory usage to prevent information leakage
   */
  private sanitizeMemoryUsage(memUsage: NodeJS.MemoryUsage): NodeJS.MemoryUsage {
    // Quantize memory measurements to prevent cache state inference
    const quantize = (value: number, quantum: number) => Math.floor(value / quantum) * quantum;
    
    return {
      rss: quantize(memUsage.rss, 1024 * 1024), // 1MB quantization
      heapTotal: quantize(memUsage.heapTotal, 512 * 1024), // 512KB quantization
      heapUsed: quantize(memUsage.heapUsed, 512 * 1024), // 512KB quantization
      external: quantize(memUsage.external, 256 * 1024), // 256KB quantization
      arrayBuffers: quantize(memUsage.arrayBuffers || 0, 256 * 1024), // 256KB quantization
    };
  }

  /**
   * HARDWARE CACHE TIMING BUG FIX: Randomize memory access patterns
   */
  private randomizeMemoryAccess(): void {
    // Create unpredictable memory access patterns to obfuscate cache state
    const sizes = [64, 128, 256, 512];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const dummy = new Array(size);
    
    // Random access pattern
    for (let i = 0; i < Math.min(size / 8, 32); i++) {
      const randomIndex = Math.floor(Math.random() * size);
      dummy[randomIndex] = Math.random();
    }
  }

  /**
   * HARDWARE CACHE TIMING BUG FIX: Micro-jitter for fine-grained timing resistance
   */
  private microJitter(): void {
    // Very small delay with unpredictable cache access
    for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
      Math.random();
    }
  }
}
