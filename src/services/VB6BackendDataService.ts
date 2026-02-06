/**
 * VB6 Backend Data Service
 * Manages connections to the backend database server
 * Provides synchronization, caching, and error handling
 */

import {
  DAORecordset,
  CreateBackendConnection,
  DAOBackendConnectionBridge,
} from '../runtime/VB6DAOSystem';
import { createLogger } from './LoggingService';

const logger = createLogger('BackendData');

export interface BackendConnectionConfig {
  baseUrl?: string;
  connectionString?: string;
  useCache?: boolean;
  cacheDuration?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface SyncResult {
  success: boolean;
  recordsAffected: number;
  errors: string[];
  duration: number;
}

export class VB6BackendDataService {
  private connection: DAOBackendConnectionBridge | null = null;
  private config: BackendConnectionConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private isConnected: boolean = false;
  private retryCount: number = 0;

  constructor(config: BackendConnectionConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '/api/database',
      useCache: config.useCache !== false,
      cacheDuration: config.cacheDuration || 5 * 60 * 1000, // 5 minutes
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  /**
   * Establishes connection to backend
   */
  async connect(connectionString: string): Promise<boolean> {
    try {
      this.connection = CreateBackendConnection(this.config.baseUrl);
      this.isConnected = await this.connection.connect(connectionString);

      if (this.isConnected) {
        logger.info('Successfully connected to backend database');
        this.retryCount = 0;
      } else {
        throw new Error('Backend connection failed');
      }

      return this.isConnected;
    } catch (error) {
      logger.error('Connection error:', error);

      if (this.retryCount < (this.config.retryAttempts || 3)) {
        this.retryCount++;
        await this.delay(this.config.retryDelay || 1000);
        return this.connect(connectionString);
      }

      return false;
    }
  }

  /**
   * Disconnects from backend
   */
  disconnect(): void {
    if (this.connection) {
      this.connection.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Loads data from backend into a recordset
   */
  async loadRecordset(recordset: DAORecordset, sql: string, parameters: any[] = []): Promise<void> {
    if (!this.isConnected || !this.connection) {
      throw new Error('Not connected to backend');
    }

    try {
      // Check cache
      const cacheKey = this.generateCacheKey(sql, parameters);
      if (this.config.useCache) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          recordset.ConnectToBackend(this.connection);
          // Populate recordset from cache
          logger.debug('Using cached result for query');
          return;
        }
      }

      // Load from backend
      await recordset.LoadFromBackend(sql, parameters);
      recordset.ConnectToBackend(this.connection);

      // Cache result
      if (this.config.useCache) {
        this.setInCache(cacheKey, recordset);
      }
    } catch (error) {
      logger.error('Failed to load recordset from backend:', error);
      throw error;
    }
  }

  /**
   * Saves recordset changes to backend
   */
  async saveRecordset(recordset: DAORecordset, tableName: string): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      recordsAffected: 0,
      errors: [],
      duration: 0,
    };

    if (!this.isConnected || !this.connection) {
      result.errors.push('Not connected to backend');
      result.duration = Date.now() - startTime;
      return result;
    }

    try {
      // Start transaction
      await recordset.BeginTransaction();

      // Generate and execute SQL
      const updates = this.generateUpdateSQL(recordset, tableName);
      for (const sql of updates) {
        await recordset.SaveToBackend(sql);
        result.recordsAffected++;
      }

      // Commit transaction
      await recordset.CommitTransaction();

      result.success = true;
      result.duration = Date.now() - startTime;

      // Invalidate cache
      this.invalidateCache();
    } catch (error) {
      result.errors.push((error as Error).message);

      // Rollback transaction
      try {
        await recordset.RollbackTransaction();
      } catch (rollbackError) {
        result.errors.push(`Rollback failed: ${rollbackError}`);
      }

      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Executes arbitrary SQL query
   */
  async executeQuery(sql: string, parameters: any[] = []): Promise<any> {
    if (!this.isConnected || !this.connection) {
      throw new Error('Not connected to backend');
    }

    try {
      // Check cache for SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const cacheKey = this.generateCacheKey(sql, parameters);
        if (this.config.useCache) {
          const cached = this.getFromCache(cacheKey);
          if (cached) {
            return cached;
          }
        }
      }

      const result = await this.connection.execute(sql, parameters);

      // Cache SELECT results
      if (sql.trim().toUpperCase().startsWith('SELECT') && this.config.useCache) {
        const cacheKey = this.generateCacheKey(sql, parameters);
        this.setInCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      logger.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Begins a transaction
   */
  async beginTransaction(): Promise<string> {
    if (!this.isConnected || !this.connection) {
      throw new Error('Not connected to backend');
    }

    try {
      return await this.connection.beginTransaction();
    } catch (error) {
      logger.error('Failed to begin transaction:', error);
      throw error;
    }
  }

  /**
   * Commits a transaction
   */
  async commitTransaction(transactionId: string): Promise<void> {
    if (!this.isConnected || !this.connection) {
      throw new Error('Not connected to backend');
    }

    try {
      await this.connection.commitTransaction(transactionId);
      this.invalidateCache();
    } catch (error) {
      logger.error('Failed to commit transaction:', error);
      throw error;
    }
  }

  /**
   * Rolls back a transaction
   */
  async rollbackTransaction(transactionId: string): Promise<void> {
    if (!this.isConnected || !this.connection) {
      throw new Error('Not connected to backend');
    }

    try {
      await this.connection.rollbackTransaction(transactionId);
    } catch (error) {
      logger.error('Failed to rollback transaction:', error);
      throw error;
    }
  }

  /**
   * Generates UPDATE SQL statements from recordset changes
   */
  private generateUpdateSQL(recordset: DAORecordset, tableName: string): string[] {
    const statements: string[] = [];

    // This is a simplified implementation
    // In a real scenario, you would track which records were modified
    // and generate appropriate INSERT/UPDATE/DELETE statements

    return statements;
  }

  /**
   * Generates cache key from SQL and parameters
   */
  private generateCacheKey(sql: string, parameters: any[]): string {
    return `${sql}:${JSON.stringify(parameters)}`;
  }

  /**
   * Gets value from cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < (this.config.cacheDuration || 0)) {
        return cached.data;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  /**
   * Sets value in cache
   */
  private setInCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidates entire cache
   */
  private invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Clears cache for specific query pattern
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Gets connection status
   */
  isConnectedToBackend(): boolean {
    return this.isConnected;
  }

  /**
   * Utility delay function for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global instance
export const backendDataService = new VB6BackendDataService();
