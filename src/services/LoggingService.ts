/**
 * LoggingService - Service de logging centralisé
 * TASK-006: Remplacement des console.* par un système configurable
 *
 * Fonctionnalités:
 * - Niveaux de log (debug, info, log, warn, error)
 * - Configuration par environnement (dev/prod)
 * - Formatage personnalisable
 * - Support des groupes de logs
 * - Transports extensibles (console, remote, file)
 * - Désactivation totale en production si nécessaire
 */

import { LogArguments, TableData } from './types/VB6ServiceTypes';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Niveaux de log disponibles
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  LOG = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5,
}

/**
 * Configuration du logger
 */
export interface LoggerConfig {
  /** Niveau minimum de log à afficher */
  level: LogLevel;
  /** Activer/désactiver le logging */
  enabled: boolean;
  /** Afficher le timestamp */
  showTimestamp: boolean;
  /** Afficher le niveau de log */
  showLevel: boolean;
  /** Afficher le contexte/module */
  showContext: boolean;
  /** Préfixe personnalisé */
  prefix?: string;
  /** Formateur personnalisé */
  formatter?: LogFormatter;
  /** Transports personnalisés */
  transports?: LogTransport[];
}

/**
 * Entrée de log
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  args: LogArguments;
  timestamp: Date;
  context?: string;
}

/**
 * Formateur de log personnalisé
 */
export type LogFormatter = (entry: LogEntry) => string;

/**
 * Transport de log (où envoyer les logs)
 */
export interface LogTransport {
  name: string;
  log: (entry: LogEntry, formattedMessage: string) => void;
}

// ============================================================================
// CONFIGURATION PAR DÉFAUT
// ============================================================================

const DEFAULT_CONFIG: LoggerConfig = {
  level: import.meta.env?.DEV ? LogLevel.DEBUG : LogLevel.WARN,
  enabled: true,
  showTimestamp: import.meta.env?.DEV ?? true,
  showLevel: true,
  showContext: true,
};

// ============================================================================
// FORMATEURS
// ============================================================================

/**
 * Formateur par défaut
 */
const defaultFormatter: LogFormatter = (entry: LogEntry): string => {
  const parts: string[] = [];

  // Timestamp
  if (DEFAULT_CONFIG.showTimestamp) {
    const time = entry.timestamp.toISOString().split('T')[1].slice(0, 12);
    parts.push(`[${time}]`);
  }

  // Niveau
  if (DEFAULT_CONFIG.showLevel) {
    const levelNames = ['DEBUG', 'INFO', 'LOG', 'WARN', 'ERROR'];
    parts.push(`[${levelNames[entry.level]}]`);
  }

  // Contexte
  if (DEFAULT_CONFIG.showContext && entry.context) {
    parts.push(`[${entry.context}]`);
  }

  // Message
  parts.push(entry.message);

  return parts.join(' ');
};

/**
 * Formateur compact (production)
 */
export const compactFormatter: LogFormatter = (entry: LogEntry): string => {
  const levelSymbols = ['🔍', 'ℹ️', '📝', '⚠️', '❌'];
  return `${levelSymbols[entry.level]} ${entry.message}`;
};

/**
 * Formateur VB6 style
 */
export const vb6Formatter: LogFormatter = (entry: LogEntry): string => {
  const levelNames = ['Debug', 'Info', 'Log', 'Warning', 'Error'];
  const ctx = entry.context ? ` (${entry.context})` : '';
  return `[VB6 IDE] ${levelNames[entry.level]}${ctx}: ${entry.message}`;
};

// ============================================================================
// TRANSPORTS
// ============================================================================

/**
 * Transport console (par défaut)
 */
const consoleTransport: LogTransport = {
  name: 'console',
  log: (entry: LogEntry, formattedMessage: string) => {
    const consoleMethods: Record<number, (...args: any[]) => void> = {
      [LogLevel.DEBUG]: console.debug,
      [LogLevel.INFO]: console.info,
      [LogLevel.LOG]: console.log,
      [LogLevel.WARN]: console.warn,
      [LogLevel.ERROR]: console.error,
    };

    const method = consoleMethods[entry.level] || console.log;

    if (entry.args.length > 0) {
      method(formattedMessage, ...entry.args);
    } else {
      method(formattedMessage);
    }
  },
};

// ============================================================================
// CLASSE LOGGER
// ============================================================================

/**
 * Classe principale du Logger
 */
class Logger {
  private config: LoggerConfig;
  private context?: string;
  private transports: LogTransport[];
  private formatter: LogFormatter;
  private groupDepth: number = 0;

  constructor(config: Partial<LoggerConfig> = {}, context?: string) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.context = context;
    this.transports = config.transports || [consoleTransport];
    this.formatter = config.formatter || defaultFormatter;
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  /**
   * Mettre à jour la configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.formatter) {
      this.formatter = config.formatter;
    }
    if (config.transports) {
      this.transports = config.transports;
    }
  }

  /**
   * Définir le niveau de log
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Activer/désactiver le logging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Créer un logger enfant avec un contexte spécifique
   */
  child(context: string): Logger {
    return new Logger(this.config, context);
  }

  // --------------------------------------------------------------------------
  // Méthodes de log
  // --------------------------------------------------------------------------

  /**
   * Log de niveau DEBUG
   */
  debug(message: string, ...args: any[]): void {
    this.write(LogLevel.DEBUG, message, args);
  }

  /**
   * Log de niveau INFO
   */
  info(message: string, ...args: any[]): void {
    this.write(LogLevel.INFO, message, args);
  }

  /**
   * Log de niveau LOG (standard)
   */
  log(message: string, ...args: any[]): void {
    this.write(LogLevel.LOG, message, args);
  }

  /**
   * Log de niveau WARN
   */
  warn(message: string, ...args: any[]): void {
    this.write(LogLevel.WARN, message, args);
  }

  /**
   * Log de niveau ERROR
   */
  error(message: string, ...args: any[]): void {
    this.write(LogLevel.ERROR, message, args);
  }

  // --------------------------------------------------------------------------
  // Groupes
  // --------------------------------------------------------------------------

  /**
   * Démarrer un groupe de logs
   */
  group(label: string): void {
    if (!this.shouldLog(LogLevel.LOG)) return;
    console.group(label);
    this.groupDepth++;
  }

  /**
   * Démarrer un groupe collapsed
   */
  groupCollapsed(label: string): void {
    if (!this.shouldLog(LogLevel.LOG)) return;
    console.groupCollapsed(label);
    this.groupDepth++;
  }

  /**
   * Terminer un groupe
   */
  groupEnd(): void {
    if (this.groupDepth > 0) {
      console.groupEnd();
      this.groupDepth--;
    }
  }

  // --------------------------------------------------------------------------
  // Utilitaires
  // --------------------------------------------------------------------------

  /**
   * Log avec timing
   */
  time(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.time(label);
  }

  /**
   * Fin du timing
   */
  timeEnd(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.timeEnd(label);
  }

  /**
   * Afficher un tableau
   */
  table(data: any): void {
    if (!this.shouldLog(LogLevel.LOG)) return;
    console.table(data);
  }

  /**
   * Effacer la console
   */
  clear(): void {
    console.clear();
  }

  /**
   * Assert avec message d'erreur
   */
  assert(condition: boolean, message: string, ...args: any[]): void {
    if (!condition) {
      this.error(`Assertion failed: ${message}`, ...args);
    }
  }

  /**
   * Compter les occurrences
   */
  count(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.count(label);
  }

  /**
   * Réinitialiser le compteur
   */
  countReset(label: string): void {
    console.countReset(label);
  }

  // --------------------------------------------------------------------------
  // Méthodes internes
  // --------------------------------------------------------------------------

  /**
   * Vérifier si on doit logger ce niveau
   */
  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && level >= this.config.level;
  }

  /**
   * Écrire un log
   */
  private write(level: LogLevel, message: string, args: any[]): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      args,
      timestamp: new Date(),
      context: this.context,
    };

    const formattedMessage = this.formatter(entry);

    // Envoyer à tous les transports
    for (const transport of this.transports) {
      try {
        transport.log(entry, formattedMessage);
      } catch (e) {
        // Fallback silencieux si un transport échoue
        console.error(`Logger transport '${transport.name}' failed:`, e);
      }
    }
  }
}

// ============================================================================
// INSTANCE GLOBALE
// ============================================================================

/**
 * Instance globale du logger
 */
export const logger = new Logger();

// ============================================================================
// LOGGERS SPÉCIALISÉS (par module)
// ============================================================================

/**
 * Logger pour le compilateur
 */
export const compilerLogger = logger.child('Compiler');

/**
 * Logger pour le runtime
 */
export const runtimeLogger = logger.child('Runtime');

/**
 * Logger pour le designer
 */
export const designerLogger = logger.child('Designer');

/**
 * Logger pour les services
 */
export const servicesLogger = logger.child('Services');

/**
 * Logger pour les composants UI
 */
export const uiLogger = logger.child('UI');

/**
 * Logger pour le débogueur
 */
export const debuggerLogger = logger.child('Debugger');

/**
 * Logger pour les données/DB
 */
export const dataLogger = logger.child('Data');

/**
 * Logger pour la sécurité
 */
export const securityLogger = logger.child('Security');

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Créer un logger pour un module spécifique
 */
export function createLogger(context: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(config, context);
}

/**
 * Configurer le logger global
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  logger.configure(config);
}

/**
 * Définir le niveau de log global
 */
export function setLogLevel(level: LogLevel): void {
  logger.setLevel(level);
}

/**
 * Activer/désactiver le logging global
 */
export function enableLogging(enabled: boolean): void {
  logger.setEnabled(enabled);
}

/**
 * Désactiver tous les logs (production)
 */
export function silenceAllLogs(): void {
  logger.setLevel(LogLevel.SILENT);
}

/**
 * Mode verbose (développement)
 */
export function enableVerboseLogging(): void {
  logger.setLevel(LogLevel.DEBUG);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Logger, consoleTransport, defaultFormatter };

export default logger;
