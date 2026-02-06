import mysql from 'mysql2/promise';
import pg from 'pg';
import mssql from 'mssql';
import { MongoClient } from 'mongodb';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import knex from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../index.js';
import CacheService from './CacheService.js';

// Pool de connexions
const connectionPools = new Map();
const activeConnections = new Map();

class DatabaseService {
  constructor() {
    this.supportedDatabases = ['mysql', 'postgresql', 'mssql', 'mongodb', 'sqlite', 'oracle'];
  }

  // Initialisation du service
  initialize() {
    logger.info('Database Service initialized');
  }

  // Créer une connexion à la base de données
  async createConnection(config) {
    const connectionId = uuidv4();
    const { type, ...connectionConfig } = config;

    try {
      let connection;

      switch (type.toLowerCase()) {
        case 'mysql':
          connection = await this.createMySQLConnection(connectionConfig);
          break;

        case 'postgresql':
        case 'postgres':
          connection = await this.createPostgreSQLConnection(connectionConfig);
          break;

        case 'mssql':
        case 'sqlserver':
          connection = await this.createMSSQLConnection(connectionConfig);
          break;

        case 'mongodb':
          connection = await this.createMongoDBConnection(connectionConfig);
          break;

        case 'sqlite':
          connection = await this.createSQLiteConnection(connectionConfig);
          break;

        default:
          throw new Error(`Unsupported database type: ${type}`);
      }

      activeConnections.set(connectionId, {
        id: connectionId,
        type,
        connection,
        config: connectionConfig,
        createdAt: new Date(),
        lastUsed: new Date(),
      });

      logger.info(`Database connection created: ${connectionId} (${type})`);

      return {
        connectionId,
        type,
        status: 'connected',
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to create connection: ${error.message}`);
      throw error;
    }
  }

  // MySQL Connection
  async createMySQLConnection(config) {
    const pool = await mysql.createPool({
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    // Test de connexion
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    return pool;
  }

  // PostgreSQL Connection
  async createPostgreSQLConnection(config) {
    const pool = new pg.Pool({
      host: config.host || 'localhost',
      port: config.port || 5432,
      user: config.user,
      password: config.password,
      database: config.database,
      max: config.connectionLimit || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test de connexion
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    return pool;
  }

  // MSSQL Connection
  async createMSSQLConnection(config) {
    const sqlConfig = {
      user: config.user,
      password: config.password,
      database: config.database,
      server: config.host || 'localhost',
      pool: {
        max: config.connectionLimit || 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      options: {
        encrypt: config.encrypt || false,
        trustServerCertificate: config.trustServerCertificate || true,
      },
    };

    const pool = await mssql.connect(sqlConfig);
    return pool;
  }

  // MongoDB Connection
  async createMongoDBConnection(config) {
    const url = config.url || `mongodb://${config.host || 'localhost'}:${config.port || 27017}`;
    const client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: config.connectionLimit || 10,
    });

    await client.connect();
    const db = client.db(config.database);

    return { client, db };
  }

  // SQLite Connection
  async createSQLiteConnection(config) {
    const db = await open({
      filename: config.filename || ':memory:',
      driver: sqlite3.Database,
    });

    return db;
  }

  // Exécuter une requête
  async executeQuery(params) {
    const { connectionId, query, parameters = [], options = {} } = params;

    const connectionInfo = activeConnections.get(connectionId);
    if (!connectionInfo) {
      throw new Error('Connection not found');
    }

    connectionInfo.lastUsed = new Date();

    // Vérifier le cache
    const cacheKey = `query:${connectionId}:${query}:${JSON.stringify(parameters)}`;
    if (options.useCache) {
      const cachedResult = await CacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    let result;
    const startTime = Date.now();

    try {
      switch (connectionInfo.type.toLowerCase()) {
        case 'mysql':
          result = await this.executeMySQLQuery(connectionInfo.connection, query, parameters);
          break;

        case 'postgresql':
        case 'postgres':
          result = await this.executePostgreSQLQuery(connectionInfo.connection, query, parameters);
          break;

        case 'mssql':
        case 'sqlserver':
          result = await this.executeMSSQLQuery(connectionInfo.connection, query, parameters);
          break;

        case 'mongodb':
          result = await this.executeMongoDBQuery(connectionInfo.connection, query, parameters);
          break;

        case 'sqlite':
          result = await this.executeSQLiteQuery(connectionInfo.connection, query, parameters);
          break;

        default:
          throw new Error(`Unsupported database type: ${connectionInfo.type}`);
      }

      const executionTime = Date.now() - startTime;

      const response = {
        success: true,
        data: result.rows || result,
        rowCount: result.rowCount || (Array.isArray(result) ? result.length : 0),
        fields: result.fields || [],
        executionTime,
        timestamp: new Date(),
      };

      // Mettre en cache si nécessaire
      if (options.useCache) {
        await CacheService.set(cacheKey, response, options.cacheTTL || 300);
      }

      logger.info(`Query executed successfully in ${executionTime}ms`);

      return response;
    } catch (error) {
      logger.error(`Query execution failed: ${error.message}`);
      throw error;
    }
  }

  // Exécution MySQL
  async executeMySQLQuery(pool, query, parameters) {
    const [rows, fields] = await pool.execute(query, parameters);
    return {
      rows,
      fields: fields.map(f => ({
        name: f.name,
        type: f.type,
        table: f.table,
      })),
      rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows,
    };
  }

  // Exécution PostgreSQL
  async executePostgreSQLQuery(pool, query, parameters) {
    const result = await pool.query(query, parameters);
    return {
      rows: result.rows,
      fields: result.fields.map(f => ({
        name: f.name,
        dataTypeID: f.dataTypeID,
        tableID: f.tableID,
      })),
      rowCount: result.rowCount,
    };
  }

  // Exécution MSSQL
  async executeMSSQLQuery(pool, query, parameters) {
    const request = pool.request();

    // Ajouter les paramètres
    parameters.forEach((param, index) => {
      request.input(`param${index}`, param);
    });

    const result = await request.query(query);
    return {
      rows: result.recordset,
      fields: result.recordset.columns,
      rowCount: result.rowsAffected[0],
    };
  }

  // SECURITY FIX: Safe JSON parser to prevent prototype pollution
  safeJSONParse(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);

      // Check for prototype pollution attempts
      if (parsed && typeof parsed === 'object') {
        const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
        for (const key of dangerousKeys) {
          if (key in parsed) {
            throw new Error(
              `Dangerous key "${key}" found in JSON - potential prototype pollution attack`
            );
          }
        }

        // Recursively check nested objects
        const checkNested = obj => {
          if (obj && typeof obj === 'object') {
            for (const [key, value] of Object.entries(obj)) {
              if (dangerousKeys.includes(key)) {
                throw new Error(
                  `Dangerous key "${key}" found in nested object - potential prototype pollution attack`
                );
              }
              if (typeof value === 'object' && value !== null) {
                checkNested(value);
              }
            }
          }
        };
        checkNested(parsed);

        // Create clean object without prototype chain
        return Object.create(null, Object.getOwnPropertyDescriptors(parsed));
      }

      return parsed;
    } catch (error) {
      throw new Error(`JSON parsing failed: ${error.message}`);
    }
  }

  // Exécution MongoDB
  async executeMongoDBQuery(connection, query, parameters) {
    const { db } = connection;
    const parsedQuery = this.safeJSONParse(query);
    const { collection, operation, ...queryParams } = parsedQuery;

    const coll = db.collection(collection);
    let result;

    switch (operation) {
      case 'find':
        result = await coll.find(queryParams.filter || {}, queryParams.options || {}).toArray();
        break;

      case 'insertOne':
        result = await coll.insertOne(queryParams.document);
        break;

      case 'updateOne':
        result = await coll.updateOne(queryParams.filter, queryParams.update, queryParams.options);
        break;

      case 'deleteOne':
        result = await coll.deleteOne(queryParams.filter);
        break;

      case 'aggregate':
        result = await coll.aggregate(queryParams.pipeline).toArray();
        break;

      default:
        throw new Error(`Unsupported MongoDB operation: ${operation}`);
    }

    return result;
  }

  // Exécution SQLite
  async executeSQLiteQuery(db, query, parameters) {
    if (query.toLowerCase().startsWith('select')) {
      const rows = await db.all(query, parameters);
      return {
        rows,
        rowCount: rows.length,
      };
    } else {
      const result = await db.run(query, parameters);
      return {
        rowCount: result.changes,
        lastID: result.lastID,
      };
    }
  }

  // Obtenir les métadonnées d'une table
  async getTableMetadata(connectionId, tableName) {
    const connectionInfo = activeConnections.get(connectionId);
    if (!connectionInfo) {
      throw new Error('Connection not found');
    }

    let metadata;

    switch (connectionInfo.type.toLowerCase()) {
      case 'mysql':
        metadata = await this.getMySQLTableMetadata(
          connectionInfo.connection,
          connectionInfo.config.database,
          tableName
        );
        break;

      case 'postgresql':
      case 'postgres':
        metadata = await this.getPostgreSQLTableMetadata(connectionInfo.connection, tableName);
        break;

      case 'mssql':
      case 'sqlserver':
        metadata = await this.getMSSQLTableMetadata(connectionInfo.connection, tableName);
        break;

      default:
        throw new Error(`Metadata retrieval not implemented for ${connectionInfo.type}`);
    }

    return metadata;
  }

  // Métadonnées MySQL
  async getMySQLTableMetadata(pool, database, tableName) {
    const [columns] = await pool.query(
      'SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [database, tableName]
    );

    return columns.map(col => ({
      name: col.COLUMN_NAME,
      type: col.DATA_TYPE,
      nullable: col.IS_NULLABLE === 'YES',
      key: col.COLUMN_KEY,
      default: col.COLUMN_DEFAULT,
      extra: col.EXTRA,
    }));
  }

  // Métadonnées PostgreSQL
  async getPostgreSQLTableMetadata(pool, tableName) {
    const result = await pool.query(
      `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `,
      [tableName]
    );

    return result.rows.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
      default: col.column_default,
    }));
  }

  // Métadonnées MSSQL
  async getMSSQLTableMetadata(pool, tableName) {
    const result = await pool.request().input('tableName', tableName).query(`
        SELECT 
          c.name AS column_name,
          t.name AS data_type,
          c.is_nullable,
          d.definition AS default_value
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        LEFT JOIN sys.default_constraints d ON c.default_object_id = d.object_id
        WHERE c.object_id = OBJECT_ID(@tableName)
        ORDER BY c.column_id
      `);

    return result.recordset.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable,
      default: col.default_value,
    }));
  }

  // Transactions
  async beginTransaction(connectionId) {
    const connectionInfo = activeConnections.get(connectionId);
    if (!connectionInfo) {
      throw new Error('Connection not found');
    }

    switch (connectionInfo.type.toLowerCase()) {
      case 'mysql': {
        const mysqlConn = await connectionInfo.connection.getConnection();
        await mysqlConn.beginTransaction();
        connectionInfo.transaction = mysqlConn;
        break;
      }

      case 'postgresql':
      case 'postgres': {
        const pgClient = await connectionInfo.connection.connect();
        await pgClient.query('BEGIN');
        connectionInfo.transaction = pgClient;
        break;
      }

      case 'mssql':
      case 'sqlserver': {
        const transaction = new mssql.Transaction(connectionInfo.connection);
        await transaction.begin();
        connectionInfo.transaction = transaction;
        break;
      }
    }

    return { transactionId: connectionId };
  }

  async commitTransaction(connectionId) {
    const connectionInfo = activeConnections.get(connectionId);
    if (!connectionInfo || !connectionInfo.transaction) {
      throw new Error('No active transaction found');
    }

    switch (connectionInfo.type.toLowerCase()) {
      case 'mysql':
        await connectionInfo.transaction.commit();
        connectionInfo.transaction.release();
        break;

      case 'postgresql':
      case 'postgres':
        await connectionInfo.transaction.query('COMMIT');
        connectionInfo.transaction.release();
        break;

      case 'mssql':
      case 'sqlserver':
        await connectionInfo.transaction.commit();
        break;
    }

    delete connectionInfo.transaction;
  }

  async rollbackTransaction(connectionId) {
    const connectionInfo = activeConnections.get(connectionId);
    if (!connectionInfo || !connectionInfo.transaction) {
      throw new Error('No active transaction found');
    }

    switch (connectionInfo.type.toLowerCase()) {
      case 'mysql':
        await connectionInfo.transaction.rollback();
        connectionInfo.transaction.release();
        break;

      case 'postgresql':
      case 'postgres':
        await connectionInfo.transaction.query('ROLLBACK');
        connectionInfo.transaction.release();
        break;

      case 'mssql':
      case 'sqlserver':
        await connectionInfo.transaction.rollback();
        break;
    }

    delete connectionInfo.transaction;
  }

  // Fermer une connexion
  async closeConnection(connectionId) {
    const connectionInfo = activeConnections.get(connectionId);
    if (!connectionInfo) {
      throw new Error('Connection not found');
    }

    try {
      switch (connectionInfo.type.toLowerCase()) {
        case 'mysql':
          await connectionInfo.connection.end();
          break;

        case 'postgresql':
        case 'postgres':
          await connectionInfo.connection.end();
          break;

        case 'mssql':
        case 'sqlserver':
          await connectionInfo.connection.close();
          break;

        case 'mongodb':
          await connectionInfo.connection.client.close();
          break;

        case 'sqlite':
          await connectionInfo.connection.close();
          break;
      }

      activeConnections.delete(connectionId);
      logger.info(`Database connection closed: ${connectionId}`);
    } catch (error) {
      logger.error(`Error closing connection: ${error.message}`);
      throw error;
    }
  }

  // Fermer toutes les connexions
  async closeAllConnections() {
    const promises = [];

    for (const [connectionId] of activeConnections) {
      promises.push(this.closeConnection(connectionId));
    }

    await Promise.all(promises);
    logger.info('All database connections closed');
  }

  // Obtenir les connexions actives
  getActiveConnections() {
    const connections = [];

    for (const [id, info] of activeConnections) {
      connections.push({
        id,
        type: info.type,
        createdAt: info.createdAt,
        lastUsed: info.lastUsed,
      });
    }

    return connections;
  }

  // Import/Export de données
  async importData(connectionId, tableName, data, options = {}) {
    const connectionInfo = activeConnections.get(connectionId);
    if (!connectionInfo) {
      throw new Error('Connection not found');
    }

    const batchSize = options.batchSize || 1000;
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Traiter les données par batch
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      try {
        await this.insertBatch(connectionInfo, tableName, batch);
        results.success += batch.length;
      } catch (error) {
        results.failed += batch.length;
        results.errors.push({
          batch: `${i}-${i + batch.length}`,
          error: error.message,
        });
      }
    }

    return results;
  }

  // SECURITY FIX: Validate SQL identifiers to prevent SQL injection
  validateSQLIdentifier(identifier) {
    // Only allow alphanumeric characters, underscores, and dots (for schema.table)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(identifier)) {
      throw new Error(`Invalid SQL identifier: ${identifier} - potential SQL injection attack`);
    }

    // Prevent SQL keywords that could be used for injection
    const dangerousKeywords = [
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'DROP',
      'ALTER',
      'CREATE',
      'EXEC',
      'EXECUTE',
      'UNION',
      'OR',
      'AND',
      '--',
      ';',
    ];
    const upperIdentifier = identifier.toUpperCase();
    for (const keyword of dangerousKeywords) {
      if (upperIdentifier.includes(keyword)) {
        throw new Error(`Dangerous keyword "${keyword}" found in identifier: ${identifier}`);
      }
    }

    return identifier;
  }

  async exportData(connectionId, tableName, options = {}) {
    // SECURITY FIX: Validate all inputs to prevent SQL injection
    const validatedTableName = this.validateSQLIdentifier(tableName);

    const limit = Math.max(1, Math.min(50000, parseInt(options.limit) || 10000)); // Limit between 1-50000
    const offset = Math.max(0, parseInt(options.offset) || 0); // Offset >= 0
    const format = options.format || 'json';

    let query;
    switch (connectionInfo.type.toLowerCase()) {
      case 'mysql':
      case 'postgresql':
      case 'postgres':
      case 'sqlite':
        // Use parameterized query for LIMIT/OFFSET where possible
        query = `SELECT * FROM \`${validatedTableName}\` LIMIT ? OFFSET ?`;
        break;

      case 'mssql':
      case 'sqlserver':
        query = `SELECT * FROM [${validatedTableName}] ORDER BY 1 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`;
        break;
    }

    const result = await this.executeQuery({
      connectionId,
      query,
      parameters: [limit, offset],
    });

    // Convertir selon le format demandé
    switch (format) {
      case 'csv':
        return this.convertToCSV(result.data);

      case 'xml':
        return this.convertToXML(result.data);

      case 'sql':
        return this.convertToSQL(tableName, result.data);

      default:
        return result.data;
    }
  }

  // Méthodes utilitaires de conversion
  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',')
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(',')
      ),
    ].join('\n');

    return csv;
  }

  convertToXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';

    for (const row of data) {
      xml += '  <row>\n';
      for (const [key, value] of Object.entries(row)) {
        xml += `    <${key}>${this.escapeXML(value)}</${key}>\n`;
      }
      xml += '  </row>\n';
    }

    xml += '</data>';
    return xml;
  }

  convertToSQL(tableName, data) {
    if (!data || data.length === 0) return '';

    // SECURITY FIX: Validate table name to prevent SQL injection
    const validatedTableName = this.validateSQLIdentifier(tableName);

    const sql = data
      .map(row => {
        // SECURITY FIX: Validate column names to prevent SQL injection
        const validatedColumns = Object.keys(row).map(column => {
          try {
            return this.validateSQLIdentifier(column);
          } catch (error) {
            throw new Error(`Invalid column name "${column}": ${error.message}`);
          }
        });

        const columns = validatedColumns.join(', ');
        const values = Object.values(row)
          .map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'number') return value;
            if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
            // Convert other types to string and escape
            return `'${String(value).replace(/'/g, "''")}'`;
          })
          .join(', ');

        return `INSERT INTO \`${validatedTableName}\` (\`${validatedColumns.join('\`, \`')}\`) VALUES (${values});`;
      })
      .join('\n');

    return sql;
  }

  escapeXML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Batch insert
  async insertBatch(connectionInfo, tableName, data) {
    if (!data || data.length === 0) return;

    // SECURITY FIX: Validate table name and column names to prevent SQL injection
    const validatedTableName = this.validateSQLIdentifier(tableName);
    const columns = Object.keys(data[0]);
    const validatedColumns = columns.map(column => {
      try {
        return this.validateSQLIdentifier(column);
      } catch (error) {
        throw new Error(`Invalid column name "${column}": ${error.message}`);
      }
    });

    switch (connectionInfo.type.toLowerCase()) {
      case 'mysql': {
        const placeholders = data
          .map(() => `(${validatedColumns.map(() => '?').join(',')})`)
          .join(',');
        const values = data.flatMap(row => columns.map(col => row[col]));

        await connectionInfo.connection.execute(
          `INSERT INTO \`${validatedTableName}\` (\`${validatedColumns.join('\`, \`')}\`) VALUES ${placeholders}`,
          values
        );
        break;
      }

      case 'postgresql':
      case 'postgres':
        // Utiliser COPY pour de meilleures performances
        const client = await connectionInfo.connection.connect();
        try {
          await client.query('BEGIN');

          const placeholders = validatedColumns.map((_, i) => `$${i + 1}`).join(',');
          const insertQuery = `INSERT INTO "${validatedTableName}" ("${validatedColumns.join('", "')}") VALUES (${placeholders})`;

          for (const row of data) {
            await client.query(
              insertQuery,
              columns.map(col => row[col])
            );
          }

          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
        break;
    }
  }
}

export default new DatabaseService();
