/**
 * Système de logging centralisé pour VB6 Studio
 * Support de différents niveaux et formats de logs
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  stack?: string;
}

export class Logger {
  private context: string;
  private static logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  private static logs: LogEntry[] = [];
  private static maxLogs: number = parseInt(process.env.MAX_LOGS || '1000', 10);

  constructor(context: string = 'App') {
    this.context = context;
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: any): void {
    const stack = error instanceof Error ? error.stack : undefined;
    this.log('error', message, error, stack);
  }

  private log(level: LogLevel, message: string, data?: any, stack?: string): void {
    const logLevels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    // Filtrage par niveau
    if (logLevels[level] < logLevels[Logger.logLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      context: this.context,
      message,
      data,
      stack,
    };

    // Stockage en mémoire
    Logger.logs.push(entry);

    // Limitation du nombre de logs
    if (Logger.logs.length > Logger.maxLogs) {
      Logger.logs.shift();
    }

    // Affichage console
    this.writeToConsole(entry);

    // En production, on pourrait également écrire dans des fichiers ou envoyer à un service externe
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile(entry);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelColor = this.getLevelColor(entry.level);
    const contextColor = '\x1b[36m'; // Cyan
    const resetColor = '\x1b[0m';

    const logMessage = `${timestamp} ${levelColor}[${entry.level.toUpperCase()}]${resetColor} ${contextColor}[${entry.context}]${resetColor} ${entry.message}`;

    if (entry.data) {
      console.log(logMessage, entry.data);
    } else {
      console.log(logMessage);
    }

    if (entry.stack) {
      console.log(entry.stack);
    }
  }

  private writeToFile(entry: LogEntry): void {
    // En production, on écrirait dans des fichiers de log
    // Pour l'instant, on simule juste
    try {
      const logLine = JSON.stringify({
        timestamp: entry.timestamp.toISOString(),
        level: entry.level,
        context: entry.context,
        message: entry.message,
        data: entry.data,
        stack: entry.stack,
      });

      // fs.appendFileSync('app.log', logLine + '\n');
    } catch (error) {
      console.error('Erreur écriture log:', error);
    }
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '\x1b[37m'; // White
      case 'info':
        return '\x1b[32m'; // Green
      case 'warn':
        return '\x1b[33m'; // Yellow
      case 'error':
        return '\x1b[31m'; // Red
      default:
        return '\x1b[0m'; // Reset
    }
  }

  // Méthodes statiques pour la gestion globale des logs

  static setLogLevel(level: LogLevel): void {
    Logger.logLevel = level;
  }

  static getLogLevel(): LogLevel {
    return Logger.logLevel;
  }

  static getLogs(options?: {
    level?: LogLevel;
    context?: string;
    limit?: number;
    since?: Date;
  }): LogEntry[] {
    let filteredLogs = [...Logger.logs];

    if (options?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === options.level);
    }

    if (options?.context) {
      filteredLogs = filteredLogs.filter(log =>
        log.context.toLowerCase().includes(options.context!.toLowerCase())
      );
    }

    if (options?.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= options.since!);
    }

    if (options?.limit) {
      filteredLogs = filteredLogs.slice(-options.limit);
    }

    return filteredLogs.reverse(); // Plus récents en premier
  }

  static clearLogs(): void {
    Logger.logs = [];
  }

  static getStats(): {
    totalLogs: number;
    levelCounts: Record<LogLevel, number>;
    oldestLog?: Date;
    newestLog?: Date;
  } {
    const levelCounts: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    Logger.logs.forEach(log => {
      levelCounts[log.level]++;
    });

    const oldestLog = Logger.logs.length > 0 ? Logger.logs[0].timestamp : undefined;
    const newestLog =
      Logger.logs.length > 0 ? Logger.logs[Logger.logs.length - 1].timestamp : undefined;

    return {
      totalLogs: Logger.logs.length,
      levelCounts,
      oldestLog,
      newestLog,
    };
  }

  // Méthodes utilitaires pour des logs spécialisés

  performance(operation: string, duration: number, details?: any): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...details,
    });
  }

  security(event: string, details?: any): void {
    this.warn(`Security: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  audit(action: string, user?: string, details?: any): void {
    this.info(`Audit: ${action}`, {
      action,
      user,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  database(query: string, duration?: number, error?: any): void {
    if (error) {
      this.error(`Database error: ${query}`, {
        query: query.substring(0, 200),
        error: error.message,
        duration,
      });
    } else {
      this.debug(`Database query: ${query.substring(0, 100)}...`, {
        query: query.substring(0, 200),
        duration,
      });
    }
  }

  api(method: string, path: string, statusCode: number, duration: number, details?: any): void {
    const level: LogLevel = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';

    this.log(level, `API ${method} ${path} - ${statusCode} (${duration}ms)`, {
      method,
      path,
      statusCode,
      duration,
      ...details,
    });
  }

  cache(operation: string, key: string, hit: boolean, duration?: number): void {
    this.debug(`Cache ${operation}: ${key} (${hit ? 'HIT' : 'MISS'})`, {
      operation,
      key,
      hit,
      duration,
    });
  }

  websocket(event: string, socketId: string, details?: any): void {
    this.debug(`WebSocket ${event}: ${socketId}`, {
      event,
      socketId,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  // Méthodes de formatage pour différents contextes

  formatError(error: Error | any): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    return String(error);
  }

  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    } else {
      return `${(milliseconds / 60000).toFixed(2)}m`;
    }
  }

  formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  // Méthodes pour les contextes spécialisés VB6

  vb6Connection(connectionId: string, provider: string, action: string, details?: any): void {
    this.info(`VB6 Connection [${provider}] ${action}: ${connectionId}`, {
      connectionId,
      provider,
      action,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  vb6Query(
    connectionId: string,
    sql: string,
    duration: number,
    recordsAffected?: number,
    fromCache?: boolean
  ): void {
    this.debug(`VB6 Query: ${sql.substring(0, 100)}...`, {
      connectionId,
      sql: sql.substring(0, 500),
      duration,
      recordsAffected,
      fromCache,
      timestamp: new Date().toISOString(),
    });
  }

  vb6Recordset(recordsetId: string, action: string, position?: number, recordCount?: number): void {
    this.debug(`VB6 Recordset ${action}: ${recordsetId}`, {
      recordsetId,
      action,
      position,
      recordCount,
      timestamp: new Date().toISOString(),
    });
  }

  crystalReport(reportId: string, action: string, details?: any): void {
    this.info(`Crystal Report ${action}: ${reportId}`, {
      reportId,
      action,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  // Groupement de logs pour les opérations complexes

  startGroup(groupName: string): void {
    this.info(`START: ${groupName}`, { groupStart: true, groupName });
  }

  endGroup(groupName: string, duration?: number): void {
    this.info(`END: ${groupName}${duration ? ` (${duration}ms)` : ''}`, {
      groupEnd: true,
      groupName,
      duration,
    });
  }

  // Logging conditionnel

  logIf(condition: boolean, level: LogLevel, message: string, data?: any): void {
    if (condition) {
      this.log(level, message, data);
    }
  }

  debugIf(condition: boolean, message: string, data?: any): void {
    this.logIf(condition, 'debug', message, data);
  }
}
