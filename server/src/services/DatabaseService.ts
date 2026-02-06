/**
 * Service de base de données haute performance pour VB6 Studio
 * Support pour MySQL, PostgreSQL, SQL Server, Oracle, SQLite, MongoDB
 * Pool de connexions, cache, transactions, sécurité
 */

import mysql from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import sql from 'mssql';
import oracledb from 'oracledb';
import sqlite3 from 'sqlite3';
import { MongoClient, Db } from 'mongodb';
import { createPool, Pool } from 'generic-pool';
import Redis from 'ioredis';
import { Logger } from '../utils/Logger';
import crypto from 'crypto';

export interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'mssql' | 'oracle' | 'sqlite' | 'mongodb';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filename?: string; // Pour SQLite
  connectionString?: string;
  ssl?: boolean;
  options?: any;
}

export interface ConnectionPoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

export interface QueryResult {
  data: any[];
  fields: any[];
  rowsAffected: number;
  insertId?: any;
  fromCache: boolean;
  executionTime: number;
}

export interface PreparedStatement {
  id: string;
  sql: string;
  paramTypes: string[];
}

export class DatabaseService {
  private logger: Logger;
  private pools: Map<string, Pool<any>> = new Map();
  private connections: Map<string, any> = new Map();
  private cache: Redis;
  private config: Map<string, DatabaseConfig> = new Map();
  private preparedStatements: Map<string, PreparedStatement> = new Map();
  private transactionConnections: Map<string, any> = new Map();

  constructor() {
    this.logger = new Logger('DatabaseService');
    this.cache = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
    });
  }

  /**
   * Initialise le service de base de données
   */
  async initialize(): Promise<void> {
    this.logger.info('Initialisation du service de base de données...');

    try {
      // Configuration Oracle
      oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
      oracledb.autoCommit = true;

      // Test de connexion Redis
      await this.cache.ping();
      this.logger.info('Connexion Redis établie');

      this.logger.info('Service de base de données initialisé');
    } catch (error) {
      this.logger.error('Erreur initialisation service DB:', error);
      throw error;
    }
  }

  /**
   * Ajoute une configuration de base de données
   */
  async addConnection(
    connectionId: string,
    config: DatabaseConfig,
    poolConfig: ConnectionPoolConfig = this.getDefaultPoolConfig()
  ): Promise<void> {
    try {
      this.config.set(connectionId, config);

      const factory = {
        create: async () => await this.createConnection(config),
        destroy: async (connection: any) => await this.destroyConnection(connection, config.type),
        validate: async (connection: any) => await this.validateConnection(connection, config.type),
      };

      const pool = createPool(factory, poolConfig);
      this.pools.set(connectionId, pool);

      this.logger.info(`Pool de connexions créé pour ${connectionId}`, {
        type: config.type,
        database: config.database,
        poolConfig,
      });
    } catch (error) {
      this.logger.error(`Erreur création pool ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * Exécute une requête SQL
   */
  async executeQuery(
    connectionId: string,
    sql: string,
    parameters: any[] = [],
    useCache: boolean = true,
    cacheTimeout: number = 300
  ): Promise<QueryResult> {
    const startTime = Date.now();
    const cacheKey = `query:${connectionId}:${this.hashQuery(sql, parameters)}`;

    try {
      // Vérifier le cache
      if (useCache && this.isSelectQuery(sql)) {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          const result = JSON.parse(cached);
          this.logger.debug(`Cache hit pour ${connectionId}`, { sql: sql.substring(0, 100) });
          return {
            ...result,
            fromCache: true,
            executionTime: Date.now() - startTime,
          };
        }
      }

      const pool = this.pools.get(connectionId);
      if (!pool) {
        throw new Error(`Pool de connexions non trouvé: ${connectionId}`);
      }

      const connection = await pool.acquire();
      const config = this.config.get(connectionId)!;

      try {
        const result = await this.executeQueryOnConnection(
          connection,
          config.type,
          sql,
          parameters
        );

        // Mettre en cache les résultats SELECT
        if (useCache && this.isSelectQuery(sql)) {
          await this.cache.setex(
            cacheKey,
            cacheTimeout,
            JSON.stringify({
              data: result.data,
              fields: result.fields,
              rowsAffected: result.rowsAffected,
            })
          );
        }

        this.logger.debug(`Requête exécutée sur ${connectionId}`, {
          sql: sql.substring(0, 100),
          rowsAffected: result.rowsAffected,
          executionTime: Date.now() - startTime,
        });

        return {
          ...result,
          fromCache: false,
          executionTime: Date.now() - startTime,
        };
      } finally {
        await pool.release(connection);
      }
    } catch (error) {
      this.logger.error(`Erreur exécution requête ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * Exécute une requête préparée
   */
  async executePreparedStatement(
    connectionId: string,
    statementId: string,
    parameters: any[]
  ): Promise<QueryResult> {
    const statement = this.preparedStatements.get(statementId);
    if (!statement) {
      throw new Error(`Statement préparé non trouvé: ${statementId}`);
    }

    return this.executeQuery(connectionId, statement.sql, parameters, false);
  }

  /**
   * Prépare un statement SQL
   */
  async prepareStatement(
    connectionId: string,
    statementId: string,
    sql: string,
    paramTypes: string[] = []
  ): Promise<void> {
    try {
      this.preparedStatements.set(statementId, {
        id: statementId,
        sql,
        paramTypes,
      });

      this.logger.debug(`Statement préparé: ${statementId}`, { sql: sql.substring(0, 100) });
    } catch (error) {
      this.logger.error(`Erreur préparation statement ${statementId}:`, error);
      throw error;
    }
  }

  /**
   * Démarre une transaction
   */
  async beginTransaction(connectionId: string): Promise<string> {
    try {
      const pool = this.pools.get(connectionId);
      if (!pool) {
        throw new Error(`Pool de connexions non trouvé: ${connectionId}`);
      }

      const connection = await pool.acquire();
      const config = this.config.get(connectionId)!;
      const transactionId = `${connectionId}_${Date.now()}_${Math.random()}`;

      await this.beginTransactionOnConnection(connection, config.type);
      this.transactionConnections.set(transactionId, { connection, pool, config });

      this.logger.debug(`Transaction démarrée: ${transactionId}`);
      return transactionId;
    } catch (error) {
      this.logger.error(`Erreur début transaction ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * Valide une transaction
   */
  async commitTransaction(transactionId: string): Promise<void> {
    try {
      const transactionData = this.transactionConnections.get(transactionId);
      if (!transactionData) {
        throw new Error(`Transaction non trouvée: ${transactionId}`);
      }

      const { connection, pool, config } = transactionData;
      await this.commitTransactionOnConnection(connection, config.type);
      await pool.release(connection);
      this.transactionConnections.delete(transactionId);

      this.logger.debug(`Transaction validée: ${transactionId}`);
    } catch (error) {
      this.logger.error(`Erreur validation transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Annule une transaction
   */
  async rollbackTransaction(transactionId: string): Promise<void> {
    try {
      const transactionData = this.transactionConnections.get(transactionId);
      if (!transactionData) {
        throw new Error(`Transaction non trouvée: ${transactionId}`);
      }

      const { connection, pool, config } = transactionData;
      await this.rollbackTransactionOnConnection(connection, config.type);
      await pool.release(connection);
      this.transactionConnections.delete(transactionId);

      this.logger.debug(`Transaction annulée: ${transactionId}`);
    } catch (error) {
      this.logger.error(`Erreur annulation transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Exécute une requête dans une transaction
   */
  async executeInTransaction(
    transactionId: string,
    sql: string,
    parameters: any[] = []
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const transactionData = this.transactionConnections.get(transactionId);
      if (!transactionData) {
        throw new Error(`Transaction non trouvée: ${transactionId}`);
      }

      const { connection, config } = transactionData;
      const result = await this.executeQueryOnConnection(connection, config.type, sql, parameters);

      return {
        ...result,
        fromCache: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Erreur requête transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Importe des données en masse
   */
  async bulkInsert(
    connectionId: string,
    table: string,
    data: any[],
    batchSize: number = 1000
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const pool = this.pools.get(connectionId);
      const config = this.config.get(connectionId)!;

      if (!pool || !config) {
        throw new Error(`Configuration non trouvée: ${connectionId}`);
      }

      let totalRowsAffected = 0;
      const batches = this.chunkArray(data, batchSize);

      for (const batch of batches) {
        const connection = await pool.acquire();
        try {
          const result = await this.executeBulkInsert(connection, config.type, table, batch);
          totalRowsAffected += result.rowsAffected;
        } finally {
          await pool.release(connection);
        }
      }

      this.logger.info(`Import en masse terminé: ${table}`, {
        totalRows: data.length,
        batches: batches.length,
        rowsAffected: totalRowsAffected,
      });

      return {
        data: [],
        fields: [],
        rowsAffected: totalRowsAffected,
        fromCache: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Erreur import en masse ${table}:`, error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques des pools de connexions
   */
  getPoolStats(connectionId?: string): any {
    const stats: any = {};

    if (connectionId) {
      const pool = this.pools.get(connectionId);
      if (pool) {
        stats[connectionId] = {
          size: pool.size,
          available: pool.available,
          borrowed: pool.borrowed,
          pending: pool.pending,
          max: pool.max,
          min: pool.min,
        };
      }
    } else {
      for (const [id, pool] of this.pools.entries()) {
        stats[id] = {
          size: pool.size,
          available: pool.available,
          borrowed: pool.borrowed,
          pending: pool.pending,
          max: pool.max,
          min: pool.min,
        };
      }
    }

    return stats;
  }

  /**
   * Vide le cache des requêtes
   */
  async clearCache(pattern?: string): Promise<number> {
    try {
      if (pattern) {
        const keys = await this.cache.keys(`query:*${pattern}*`);
        if (keys.length > 0) {
          return await this.cache.del(...keys);
        }
        return 0;
      } else {
        const keys = await this.cache.keys('query:*');
        if (keys.length > 0) {
          return await this.cache.del(...keys);
        }
        return 0;
      }
    } catch (error) {
      this.logger.error('Erreur vidage cache:', error);
      throw error;
    }
  }

  /**
   * Ferme toutes les connexions
   */
  async close(): Promise<void> {
    try {
      // Fermer les transactions en cours
      for (const [transactionId, transactionData] of this.transactionConnections.entries()) {
        try {
          await this.rollbackTransaction(transactionId);
        } catch (error) {
          this.logger.warn(`Erreur annulation transaction ${transactionId}:`, error);
        }
      }

      // Fermer les pools
      for (const [connectionId, pool] of this.pools.entries()) {
        try {
          await pool.drain();
          await pool.clear();
          this.logger.info(`Pool fermé: ${connectionId}`);
        } catch (error) {
          this.logger.warn(`Erreur fermeture pool ${connectionId}:`, error);
        }
      }

      // Fermer Redis
      await this.cache.disconnect();

      this.logger.info('Service de base de données fermé');
    } catch (error) {
      this.logger.error('Erreur fermeture service DB:', error);
      throw error;
    }
  }

  // Méthodes privées

  private getDefaultPoolConfig(): ConnectionPoolConfig {
    return {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
      createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000'),
      destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'),
      reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000'),
      createRetryIntervalMillis: parseInt(process.env.DB_RETRY_INTERVAL || '200'),
    };
  }

  private async createConnection(config: DatabaseConfig): Promise<any> {
    switch (config.type) {
      case 'mysql':
        return await mysql.createConnection({
          host: config.host,
          port: config.port || 3306,
          user: config.username,
          password: config.password,
          database: config.database,
          ssl: config.ssl,
          ...config.options,
        });

      case 'postgresql': {
        const pgPool = new PgPool({
          host: config.host,
          port: config.port || 5432,
          user: config.username,
          password: config.password,
          database: config.database,
          ssl: config.ssl,
          ...config.options,
        });
        return await pgPool.connect();
      }

      case 'mssql':
        return await sql.connect({
          server: config.host!,
          port: config.port || 1433,
          user: config.username,
          password: config.password,
          database: config.database,
          options: {
            encrypt: config.ssl || false,
            trustServerCertificate: true,
            ...config.options,
          },
        });

      case 'oracle':
        return await oracledb.getConnection({
          user: config.username,
          password: config.password,
          connectString:
            config.connectionString || `${config.host}:${config.port || 1521}/${config.database}`,
          ...config.options,
        });

      case 'sqlite':
        return new Promise((resolve, reject) => {
          const db = new sqlite3.Database(config.filename!, err => {
            if (err) reject(err);
            else resolve(db);
          });
        });

      case 'mongodb': {
        const client = new MongoClient(config.connectionString!, config.options);
        await client.connect();
        return client.db(config.database);
      }

      default:
        throw new Error(`Type de base de données non supporté: ${config.type}`);
    }
  }

  private async destroyConnection(connection: any, type: string): Promise<void> {
    try {
      switch (type) {
        case 'mysql':
          await connection.end();
          break;
        case 'postgresql':
          connection.release();
          break;
        case 'mssql':
          await connection.close();
          break;
        case 'oracle':
          await connection.close();
          break;
        case 'sqlite':
          connection.close();
          break;
        case 'mongodb':
          await connection.client.close();
          break;
      }
    } catch (error) {
      this.logger.warn(`Erreur fermeture connexion ${type}:`, error);
    }
  }

  private async validateConnection(connection: any, type: string): Promise<boolean> {
    try {
      switch (type) {
        case 'mysql':
          await connection.ping();
          return true;
        case 'postgresql':
          await connection.query('SELECT 1');
          return true;
        case 'mssql':
          return connection.connected;
        case 'oracle': {
          const result = await connection.execute('SELECT 1 FROM DUAL');
          return result.rows.length > 0;
        }
        case 'sqlite':
          return new Promise(resolve => {
            connection.get('SELECT 1', (err: any) => {
              resolve(!err);
            });
          });
        case 'mongodb':
          await connection.admin().ping();
          return true;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  private async executeQueryOnConnection(
    connection: any,
    type: string,
    sql: string,
    parameters: any[]
  ): Promise<Omit<QueryResult, 'fromCache' | 'executionTime'>> {
    switch (type) {
      case 'mysql': {
        const [rows, fields] = await connection.execute(sql, parameters);
        return {
          data: Array.isArray(rows) ? rows : [],
          fields: fields || [],
          rowsAffected: Array.isArray(rows) ? rows.length : (rows as any).affectedRows || 0,
          insertId: (rows as any).insertId,
        };
      }

      case 'postgresql': {
        const pgResult = await connection.query(sql, parameters);
        return {
          data: pgResult.rows,
          fields: pgResult.fields,
          rowsAffected: pgResult.rowCount || 0,
        };
      }

      case 'mssql': {
        const request = connection.request();
        parameters.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
        const msResult = await request.query(sql);
        return {
          data: msResult.recordset || [],
          fields: msResult.recordset?.columns || [],
          rowsAffected: msResult.rowsAffected?.[0] || 0,
        };
      }

      case 'oracle': {
        const oracleResult = await connection.execute(sql, parameters);
        return {
          data: oracleResult.rows || [],
          fields: oracleResult.metaData || [],
          rowsAffected: oracleResult.rowsAffected || 0,
        };
      }

      case 'sqlite':
        return new Promise((resolve, reject) => {
          if (this.isSelectQuery(sql)) {
            connection.all(sql, parameters, (err: any, rows: any[]) => {
              if (err) reject(err);
              else
                resolve({
                  data: rows,
                  fields: [],
                  rowsAffected: rows.length,
                });
            });
          } else {
            connection.run(sql, parameters, function (err: any) {
              if (err) reject(err);
              else
                resolve({
                  data: [],
                  fields: [],
                  rowsAffected: this.changes,
                  insertId: this.lastID,
                });
            });
          }
        });

      case 'mongodb': {
        // MongoDB requiert une approche différente
        const collection = connection.collection('data');
        if (sql.toLowerCase().startsWith('find')) {
          const docs = await collection.find(parameters[0] || {}).toArray();
          return {
            data: docs,
            fields: [],
            rowsAffected: docs.length,
          };
        } else {
          const result = await collection.insertMany(parameters);
          return {
            data: [],
            fields: [],
            rowsAffected: result.insertedCount,
          };
        }
      }

      default:
        throw new Error(`Type de base de données non supporté: ${type}`);
    }
  }

  private async beginTransactionOnConnection(connection: any, type: string): Promise<void> {
    switch (type) {
      case 'mysql':
        await connection.beginTransaction();
        break;
      case 'postgresql':
        await connection.query('BEGIN');
        break;
      case 'mssql':
        await connection.request().query('BEGIN TRANSACTION');
        break;
      case 'oracle':
        // Oracle gère les transactions automatiquement
        break;
      case 'sqlite':
        connection.run('BEGIN TRANSACTION');
        break;
      case 'mongodb':
        // MongoDB requiert des sessions pour les transactions
        break;
    }
  }

  private async commitTransactionOnConnection(connection: any, type: string): Promise<void> {
    switch (type) {
      case 'mysql':
        await connection.commit();
        break;
      case 'postgresql':
        await connection.query('COMMIT');
        break;
      case 'mssql':
        await connection.request().query('COMMIT TRANSACTION');
        break;
      case 'oracle':
        await connection.commit();
        break;
      case 'sqlite':
        connection.run('COMMIT');
        break;
      case 'mongodb':
        // MongoDB sessions
        break;
    }
  }

  private async rollbackTransactionOnConnection(connection: any, type: string): Promise<void> {
    switch (type) {
      case 'mysql':
        await connection.rollback();
        break;
      case 'postgresql':
        await connection.query('ROLLBACK');
        break;
      case 'mssql':
        await connection.request().query('ROLLBACK TRANSACTION');
        break;
      case 'oracle':
        await connection.rollback();
        break;
      case 'sqlite':
        connection.run('ROLLBACK');
        break;
      case 'mongodb':
        // MongoDB sessions
        break;
    }
  }

  private async executeBulkInsert(
    connection: any,
    type: string,
    table: string,
    data: any[]
  ): Promise<Omit<QueryResult, 'fromCache' | 'executionTime'>> {
    if (data.length === 0) {
      return { data: [], fields: [], rowsAffected: 0 };
    }

    const columns = Object.keys(data[0]);
    const values = data.map(row => columns.map(col => row[col]));

    switch (type) {
      case 'mysql': {
        const placeholders = data.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
        const flatValues = values.flat();
        const [result] = await connection.execute(sql, flatValues);
        return {
          data: [],
          fields: [],
          rowsAffected: (result as any).affectedRows,
        };
      }

      case 'postgresql': {
        const pgPlaceholders = data
          .map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`)
          .join(', ');
        const pgSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${pgPlaceholders}`;
        const pgResult = await connection.query(pgSql, values.flat());
        return {
          data: [],
          fields: [],
          rowsAffected: pgResult.rowCount,
        };
      }

      default: {
        // Pour les autres types, utiliser des insertions individuelles
        let rowsAffected = 0;
        for (const row of data) {
          const insertSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
          const result = await this.executeQueryOnConnection(
            connection,
            type,
            insertSql,
            values[0]
          );
          rowsAffected += result.rowsAffected;
        }
        return {
          data: [],
          fields: [],
          rowsAffected,
        };
      }
    }
  }

  private isSelectQuery(sql: string): boolean {
    return sql.trim().toLowerCase().startsWith('select');
  }

  private hashQuery(sql: string, parameters: any[]): string {
    return crypto
      .createHash('md5')
      .update(sql + JSON.stringify(parameters))
      .digest('hex');
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
