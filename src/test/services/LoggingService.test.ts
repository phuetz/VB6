/**
 * Tests pour LoggingService
 * TASK-006: Validation du service de logging centralisé
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logger,
  Logger,
  LogLevel,
  createLogger,
  configureLogger,
  setLogLevel,
  enableLogging,
  silenceAllLogs,
  enableVerboseLogging,
  compilerLogger,
  runtimeLogger,
  designerLogger,
  compactFormatter,
  vb6Formatter,
  LogEntry,
} from '../../services/LoggingService';

describe('TASK-006: LoggingService', () => {
  // Sauvegarder les méthodes console originales
  const originalConsole = {
    log: console.log,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    group: console.group,
    groupCollapsed: console.groupCollapsed,
    groupEnd: console.groupEnd,
    time: console.time,
    timeEnd: console.timeEnd,
    table: console.table,
    clear: console.clear,
    count: console.count,
    countReset: console.countReset,
  };

  beforeEach(() => {
    // Mock toutes les méthodes console
    console.log = vi.fn();
    console.debug = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.group = vi.fn();
    console.groupCollapsed = vi.fn();
    console.groupEnd = vi.fn();
    console.time = vi.fn();
    console.timeEnd = vi.fn();
    console.table = vi.fn();
    console.clear = vi.fn();
    console.count = vi.fn();
    console.countReset = vi.fn();

    // Réinitialiser le logger pour chaque test
    configureLogger({
      level: LogLevel.DEBUG,
      enabled: true,
      showTimestamp: false,
      showLevel: true,
      showContext: false,
    });
  });

  afterEach(() => {
    // Restaurer les méthodes console
    Object.assign(console, originalConsole);
  });

  describe('Logger de base', () => {
    it('devrait créer un logger avec configuration par défaut', () => {
      const testLogger = new Logger();
      expect(testLogger).toBeDefined();
    });

    it('devrait créer un logger avec un contexte', () => {
      const testLogger = createLogger('TestModule');
      expect(testLogger).toBeDefined();
    });

    it('devrait créer un logger enfant avec child()', () => {
      const childLogger = logger.child('ChildContext');
      expect(childLogger).toBeDefined();
    });
  });

  describe('Niveaux de log', () => {
    it('devrait logger au niveau DEBUG', () => {
      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });

    it('devrait logger au niveau INFO', () => {
      logger.info('Info message');
      expect(console.info).toHaveBeenCalled();
    });

    it('devrait logger au niveau LOG', () => {
      logger.log('Log message');
      expect(console.log).toHaveBeenCalled();
    });

    it('devrait logger au niveau WARN', () => {
      logger.warn('Warning message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('devrait logger au niveau ERROR', () => {
      logger.error('Error message');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Filtrage par niveau', () => {
    it('devrait filtrer les logs sous le niveau configuré', () => {
      setLogLevel(LogLevel.WARN);

      logger.debug('Debug');
      logger.info('Info');
      logger.log('Log');
      logger.warn('Warn');
      logger.error('Error');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('devrait permettre tous les logs en mode DEBUG', () => {
      setLogLevel(LogLevel.DEBUG);

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('devrait bloquer tous les logs en mode SILENT', () => {
      silenceAllLogs();

      logger.debug('Debug');
      logger.info('Info');
      logger.log('Log');
      logger.warn('Warn');
      logger.error('Error');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Activation/Désactivation', () => {
    it('devrait désactiver tous les logs avec enableLogging(false)', () => {
      enableLogging(false);

      logger.log('Test');
      logger.error('Error');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('devrait réactiver les logs avec enableLogging(true)', () => {
      enableLogging(false);
      enableLogging(true);

      logger.log('Test');
      expect(console.log).toHaveBeenCalled();
    });

    it('devrait activer le mode verbose', () => {
      enableVerboseLogging();
      logger.debug('Verbose debug');
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('Arguments supplémentaires', () => {
    it('devrait passer les arguments supplémentaires à console', () => {
      const extraArg = { foo: 'bar' };
      logger.log('Message with args', extraArg);

      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        extraArg
      );
    });

    it('devrait gérer plusieurs arguments', () => {
      logger.log('Multiple args', 1, 2, 3);

      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        1, 2, 3
      );
    });
  });

  describe('Groupes de logs', () => {
    it('devrait créer un groupe de logs', () => {
      logger.group('Test Group');
      expect(console.group).toHaveBeenCalledWith('Test Group');
    });

    it('devrait créer un groupe collapsed', () => {
      logger.groupCollapsed('Collapsed Group');
      expect(console.groupCollapsed).toHaveBeenCalledWith('Collapsed Group');
    });

    it('devrait terminer un groupe', () => {
      logger.group('Group');
      logger.groupEnd();
      expect(console.groupEnd).toHaveBeenCalled();
    });
  });

  describe('Utilitaires', () => {
    it('devrait supporter time/timeEnd', () => {
      logger.time('Timer');
      logger.timeEnd('Timer');

      expect(console.time).toHaveBeenCalledWith('Timer');
      expect(console.timeEnd).toHaveBeenCalledWith('Timer');
    });

    it('devrait supporter table()', () => {
      const data = [{ a: 1 }, { a: 2 }];
      logger.table(data);
      expect(console.table).toHaveBeenCalledWith(data);
    });

    it('devrait supporter clear()', () => {
      logger.clear();
      expect(console.clear).toHaveBeenCalled();
    });

    it('devrait supporter count()', () => {
      logger.count('Counter');
      expect(console.count).toHaveBeenCalledWith('Counter');
    });

    it('devrait supporter assert() - condition vraie', () => {
      logger.assert(true, 'Should not log');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('devrait supporter assert() - condition fausse', () => {
      logger.assert(false, 'Assertion failed');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Loggers spécialisés', () => {
    it('devrait avoir un compilerLogger', () => {
      expect(compilerLogger).toBeDefined();
    });

    it('devrait avoir un runtimeLogger', () => {
      expect(runtimeLogger).toBeDefined();
    });

    it('devrait avoir un designerLogger', () => {
      expect(designerLogger).toBeDefined();
    });

    it('les loggers enfants devraient fonctionner indépendamment', () => {
      // Créer un nouveau logger enfant (pas les pré-créés au chargement du module)
      const testChildLogger = logger.child('TestChild');

      testChildLogger.info('Child logger info');
      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('Formateurs personnalisés', () => {
    it('devrait utiliser le formateur compact', () => {
      const entry: LogEntry = {
        level: LogLevel.WARN,
        message: 'Test warning',
        args: [],
        timestamp: new Date(),
      };

      const result = compactFormatter(entry);
      expect(result).toContain('⚠️');
      expect(result).toContain('Test warning');
    });

    it('devrait utiliser le formateur VB6', () => {
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Test error',
        args: [],
        timestamp: new Date(),
        context: 'TestModule',
      };

      const result = vb6Formatter(entry);
      expect(result).toContain('[VB6 IDE]');
      expect(result).toContain('Error');
      expect(result).toContain('TestModule');
    });
  });

  describe('Configuration dynamique', () => {
    it('devrait permettre de changer la configuration', () => {
      configureLogger({
        level: LogLevel.ERROR,
        showTimestamp: true,
      });

      logger.warn('Should not appear');
      logger.error('Should appear');

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('devrait permettre de changer le niveau avec setLogLevel', () => {
      setLogLevel(LogLevel.INFO);

      logger.debug('Debug - hidden');
      logger.info('Info - visible');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('Vérification des fichiers créés', () => {
    it('LoggingService.ts devrait exister', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../../services/LoggingService.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('logging.ts config devrait exister', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../../config/logging.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Export des fonctions utilitaires', () => {
    it('devrait exporter createLogger', () => {
      expect(typeof createLogger).toBe('function');
    });

    it('devrait exporter configureLogger', () => {
      expect(typeof configureLogger).toBe('function');
    });

    it('devrait exporter setLogLevel', () => {
      expect(typeof setLogLevel).toBe('function');
    });

    it('devrait exporter enableLogging', () => {
      expect(typeof enableLogging).toBe('function');
    });

    it('devrait exporter silenceAllLogs', () => {
      expect(typeof silenceAllLogs).toBe('function');
    });

    it('devrait exporter enableVerboseLogging', () => {
      expect(typeof enableVerboseLogging).toBe('function');
    });
  });
});
