/**
 * Database Connection Pool Manager
 * Manages connections for ADO, DAO, and RDO with multiple database engines
 */

import { Pool as PgPool } from 'pg';
import mysql from 'mysql2/promise';
import sql from 'mssql';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import knex, { Knex } from 'knex';
import { logger } from '../utils/logger';
import { CacheService } from './CacheService';

export interface ConnectionConfig {
  type: 'ADO' | 'DAO' | 'RDO';
  engine: 'mssql' | 'mysql' | 'postgresql' | 'sqlite' | 'oracle' | 'access';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  options?: any;
}

export interface QueryResult {
  rows: any[];
  fields?: any[];
  rowCount: number;
  affectedRows?: number;
}

export class DatabasePool {
  private static instance: DatabasePool;
  private connections: Map<string, any> = new Map();
  private knexConnections: Map<string, Knex> = new Map();
  private cache: CacheService;

  private constructor() {
    this.cache = CacheService.getInstance();
  }

  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  async connect(id: string, config: ConnectionConfig): Promise<string> {
    try {
      if (this.connections.has(id)) {
        await this.disconnect(id);
      }

      let connection: any;
      let knexConnection: Knex;

      switch (config.engine) {
        case 'mssql':
          connection = await this.connectMSSQL(config);
          knexConnection = knex({
            client: 'mssql',
            connection: {
              server: config.host,
              port: config.port,
              user: config.user,
              password: config.password,
              database: config.database,
              options: config.options,
            },
          });
          break;

        case 'mysql':
          connection = await this.connectMySQL(config);
          knexConnection = knex({
            client: 'mysql2',
            connection: {
              host: config.host,
              port: config.port,
              user: config.user,
              password: config.password,
              database: config.database,
              ...config.options,
            },
          });
          break;

        case 'postgresql':
          connection = await this.connectPostgreSQL(config);
          knexConnection = knex({
            client: 'pg',
            connection: {
              host: config.host,
              port: config.port,
              user: config.user,
              password: config.password,
              database: config.database,
              ...config.options,
            },
          });
          break;

        case 'sqlite':
          connection = await this.connectSQLite(config);
          knexConnection = knex({
            client: 'sqlite3',
            connection: {
              filename: config.database || ':memory:',
            },
            useNullAsDefault: true,
          });
          break;

        default:
          throw new Error(`Unsupported database engine: ${config.engine}`);
      }

      this.connections.set(id, { connection, config, type: config.type });
      this.knexConnections.set(id, knexConnection);

      logger.info(`Database connection established: ${id} (${config.engine})`);
      return id;
    } catch (error) {
      logger.error(`Failed to connect to database: ${error.message}`);
      throw error;
    }
  }

  private async connectMSSQL(config: ConnectionConfig): Promise<sql.ConnectionPool> {
    const poolConfig: sql.config = {
      server: config.host || 'localhost',
      port: config.port || 1433,
      user: config.user,
      password: config.password,
      database: config.database,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      options: {
        encrypt: true,
        trustServerCertificate: true,
        ...config.options,
      },
    };

    const pool = new sql.ConnectionPool(poolConfig);
    await pool.connect();
    return pool;
  }

  private async connectMySQL(config: ConnectionConfig): Promise<mysql.Pool> {
    const pool = mysql.createPool({
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ...config.options,
    });

    // Test connection
    const connection = await pool.getConnection();
    connection.release();
    return pool;
  }

  private async connectPostgreSQL(config: ConnectionConfig): Promise<PgPool> {
    const pool = new PgPool({
      host: config.host || 'localhost',
      port: config.port || 5432,
      user: config.user,
      password: config.password,
      database: config.database,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ...config.options,
    });

    // Test connection
    await pool.query('SELECT 1');
    return pool;
  }

  private async connectSQLite(config: ConnectionConfig) {
    const db = await open({
      filename: config.database || ':memory:',
      driver: sqlite3.Database,
    });

    return db;
  }

  async execute(connectionId: string, query: string, params?: any[]): Promise<QueryResult> {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    // Check cache first
    const cacheKey = `${connectionId}:${query}:${JSON.stringify(params)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let result: QueryResult;

    try {
      switch (conn.config.engine) {
        case 'mssql':
          result = await this.executeMSSQL(conn.connection, query, params);
          break;
        case 'mysql':
          result = await this.executeMySQL(conn.connection, query, params);
          break;
        case 'postgresql':
          result = await this.executePostgreSQL(conn.connection, query, params);
          break;
        case 'sqlite':
          result = await this.executeSQLite(conn.connection, query, params);
          break;
        default:
          throw new Error(`Unsupported engine: ${conn.config.engine}`);
      }

      // Cache SELECT queries
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        await this.cache.set(cacheKey, result, 300); // 5 minutes TTL
      }

      return result;
    } catch (error) {
      logger.error(`Query execution failed: ${error.message}`);
      throw error;
    }
  }

  private async executeMSSQL(
    pool: sql.ConnectionPool,
    query: string,
    params?: any[]
  ): Promise<QueryResult> {
    const request = pool.request();

    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }

    const result = await request.query(query);

    return {
      rows: result.recordset || [],
      rowCount: result.rowsAffected[0] || 0,
      affectedRows: result.rowsAffected[0] || 0,
    };
  }

  private async executeMySQL(
    pool: mysql.Pool,
    query: string,
    params?: any[]
  ): Promise<QueryResult> {
    const [rows, fields] = await pool.execute(query, params);

    if (Array.isArray(rows)) {
      return {
        rows,
        fields,
        rowCount: rows.length,
      };
    } else {
      return {
        rows: [],
        rowCount: 0,
        affectedRows: (rows as any).affectedRows,
      };
    }
  }

  private async executePostgreSQL(
    pool: PgPool,
    query: string,
    params?: any[]
  ): Promise<QueryResult> {
    const result = await pool.query(query, params);

    return {
      rows: result.rows,
      fields: result.fields,
      rowCount: result.rowCount,
    };
  }

  private async executeSQLite(db: any, query: string, params?: any[]): Promise<QueryResult> {
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await db.all(query, params);
      return {
        rows,
        rowCount: rows.length,
      };
    } else {
      const result = await db.run(query, params);
      return {
        rows: [],
        rowCount: result.changes,
        affectedRows: result.changes,
      };
    }
  }

  async executeQuery(connectionId: string, query: string, params?: any[]): Promise<any> {
    const knexConn = this.knexConnections.get(connectionId);
    if (!knexConn) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    // Use Knex query builder for complex queries
    const result = await knexConn.raw(query, params);
    return result;
  }

  async beginTransaction(connectionId: string): Promise<any> {
    const knexConn = this.knexConnections.get(connectionId);
    if (!knexConn) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    return await knexConn.transaction();
  }

  async disconnect(connectionId: string): Promise<void> {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    try {
      switch (conn.config.engine) {
        case 'mssql':
          await conn.connection.close();
          break;
        case 'mysql':
          await conn.connection.end();
          break;
        case 'postgresql':
          await conn.connection.end();
          break;
        case 'sqlite':
          await conn.connection.close();
          break;
      }

      const knexConn = this.knexConnections.get(connectionId);
      if (knexConn) {
        await knexConn.destroy();
        this.knexConnections.delete(connectionId);
      }

      this.connections.delete(connectionId);
      logger.info(`Database connection closed: ${connectionId}`);
    } catch (error) {
      logger.error(`Error closing connection: ${error.message}`);
      throw error;
    }
  }

  async closeAll(): Promise<void> {
    for (const [id] of this.connections) {
      await this.disconnect(id);
    }
  }

  getConnectionStats(): object {
    const stats: any = {};
    for (const [id, conn] of this.connections) {
      stats[id] = {
        type: conn.type,
        engine: conn.config.engine,
        database: conn.config.database,
        connected: true,
      };
    }
    return stats;
  }

  // ADO-specific methods
  async createADORecordset(
    connectionId: string,
    source: string,
    cursorType: number,
    lockType: number
  ): Promise<any> {
    const result = await this.execute(connectionId, source);

    return {
      id: `rs_${Date.now()}`,
      connectionId,
      source,
      cursorType,
      lockType,
      fields: result.fields || [],
      rows: result.rows,
      position: 0,
      eof: result.rows.length === 0,
      bof: true,
      recordCount: result.rowCount,
    };
  }

  // DAO-specific methods
  async createDAORecordset(connectionId: string, sql: string, type: number): Promise<any> {
    const result = await this.execute(connectionId, sql);

    return {
      id: `dao_${Date.now()}`,
      connectionId,
      sql,
      type,
      fields: Object.keys(result.rows[0] || {}),
      data: result.rows,
      position: 0,
      recordCount: result.rowCount,
    };
  }

  // RDO-specific methods
  async createRDOResultset(connectionId: string, sql: string): Promise<any> {
    const result = await this.execute(connectionId, sql);

    return {
      id: `rdo_${Date.now()}`,
      connectionId,
      sql,
      columns: result.fields || [],
      rows: result.rows,
      rowCount: result.rowCount,
      position: 0,
    };
  }
}
