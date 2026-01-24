/**
 * Configuration du système de logging
 * TASK-006: Configuration centralisée pour LoggingService
 */

import { LogLevel, LoggerConfig, configureLogger } from '../services/LoggingService';

// ============================================================================
// CONFIGURATION PAR ENVIRONNEMENT
// ============================================================================

/**
 * Détecter l'environnement
 */
const isDev = import.meta.env?.DEV ?? process.env.NODE_ENV !== 'production';
const isProd = import.meta.env?.PROD ?? process.env.NODE_ENV === 'production';
const isTest = import.meta.env?.MODE === 'test' ?? process.env.NODE_ENV === 'test';

/**
 * Configuration développement
 */
export const developmentConfig: Partial<LoggerConfig> = {
  level: LogLevel.DEBUG,
  enabled: true,
  showTimestamp: true,
  showLevel: true,
  showContext: true,
};

/**
 * Configuration production
 */
export const productionConfig: Partial<LoggerConfig> = {
  level: LogLevel.WARN,
  enabled: true,
  showTimestamp: false,
  showLevel: true,
  showContext: false,
};

/**
 * Configuration test
 */
export const testConfig: Partial<LoggerConfig> = {
  level: LogLevel.ERROR,
  enabled: false, // Silencieux pendant les tests sauf erreurs
  showTimestamp: false,
  showLevel: true,
  showContext: true,
};

/**
 * Configuration silencieuse (désactivée)
 */
export const silentConfig: Partial<LoggerConfig> = {
  level: LogLevel.SILENT,
  enabled: false,
  showTimestamp: false,
  showLevel: false,
  showContext: false,
};

// ============================================================================
// CONFIGURATION AUTOMATIQUE
// ============================================================================

/**
 * Obtenir la configuration selon l'environnement actuel
 */
export function getEnvironmentConfig(): Partial<LoggerConfig> {
  if (isTest) return testConfig;
  if (isProd) return productionConfig;
  return developmentConfig;
}

/**
 * Initialiser le logger avec la configuration de l'environnement
 */
export function initializeLogging(): void {
  const config = getEnvironmentConfig();
  configureLogger(config);
}

// ============================================================================
// PRÉRÉGLAGES DE LOGGING
// ============================================================================

/**
 * Préréglages pour différents cas d'usage
 */
export const LoggingPresets = {
  /** Développement verbeux */
  verbose: {
    level: LogLevel.DEBUG,
    enabled: true,
    showTimestamp: true,
    showLevel: true,
    showContext: true,
  },

  /** Production standard */
  production: {
    level: LogLevel.WARN,
    enabled: true,
    showTimestamp: false,
    showLevel: true,
    showContext: false,
  },

  /** Débogage uniquement erreurs */
  errorsOnly: {
    level: LogLevel.ERROR,
    enabled: true,
    showTimestamp: true,
    showLevel: true,
    showContext: true,
  },

  /** Complètement silencieux */
  silent: {
    level: LogLevel.SILENT,
    enabled: false,
  },

  /** Performance (minimal) */
  performance: {
    level: LogLevel.WARN,
    enabled: true,
    showTimestamp: false,
    showLevel: false,
    showContext: false,
  },
} as const;

// ============================================================================
// MODULES À LOGGER
// ============================================================================

/**
 * Configuration par module (pour filtrage fin)
 */
export const ModuleLogLevels: Record<string, LogLevel> = {
  Compiler: isDev ? LogLevel.DEBUG : LogLevel.WARN,
  Runtime: isDev ? LogLevel.INFO : LogLevel.ERROR,
  Designer: isDev ? LogLevel.DEBUG : LogLevel.WARN,
  Services: isDev ? LogLevel.INFO : LogLevel.WARN,
  UI: isDev ? LogLevel.LOG : LogLevel.ERROR,
  Debugger: isDev ? LogLevel.DEBUG : LogLevel.INFO,
  Data: isDev ? LogLevel.INFO : LogLevel.WARN,
  Security: LogLevel.WARN, // Toujours logger les problèmes de sécurité
};

// ============================================================================
// INITIALISATION AUTOMATIQUE
// ============================================================================

// Initialiser automatiquement au chargement du module
if (typeof window !== 'undefined' || typeof process !== 'undefined') {
  initializeLogging();
}

export default {
  initializeLogging,
  getEnvironmentConfig,
  LoggingPresets,
  ModuleLogLevels,
};
