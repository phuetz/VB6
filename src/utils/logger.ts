/**
 * Centralized logging utility for the VB6 IDE Clone application
 * Provides different log levels and can be configured for production/development
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enableRemoteLogging: boolean;

  private constructor() {
    // Set log level based on environment
    this.logLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN;
    this.enableRemoteLogging = !import.meta.env.DEV;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Enable or disable remote logging
   */
  public setRemoteLogging(enabled: boolean): void {
    this.enableRemoteLogging = enabled;
  }

  /**
   * Log a debug message
   */
  public debug(message: string, ...args: unknown[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      // noop
    }
  }

  /**
   * Log an info message
   */
  public info(message: string, ...args: unknown[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   */
  public warn(message: string, ...args: unknown[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
      this.sendToRemote('warn', message, args);
    }
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args);
      this.sendToRemote('error', message, [error, ...args]);
    }
  }

  /**
   * Send logs to remote error tracking service (e.g., Sentry)
   */
  private sendToRemote(level: string, message: string, args: unknown[]): void {
    if (!this.enableRemoteLogging) return;

    // This will be integrated with Sentry later
    // For now, it's a placeholder
    try {
      // @ts-expect-error - Sentry will be added later
      if (window.Sentry) {
        // @ts-expect-error - Sentry will be added later
        window.Sentry.captureMessage(message, {
          level: level as 'error' | 'warning',
          extra: { args },
        });
      }
    } catch (err) {
      // Silently fail if remote logging fails
    }
  }

  /**
   * Create a performance mark
   */
  public performance(name: string): void {
    if (this.logLevel <= LogLevel.DEBUG && performance) {
      performance.mark(name);
      this.debug(`Performance mark: ${name}`);
    }
  }

  /**
   * Measure performance between two marks
   */
  public measurePerformance(name: string, startMark: string, endMark: string): void {
    if (this.logLevel <= LogLevel.DEBUG && performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        this.debug(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
      } catch (err) {
        this.warn('Failed to measure performance', err);
      }
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
