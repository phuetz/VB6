/**
 * Gestionnaire de base de données haute performance pour VB6 Studio
 * Support multiple SGBD avec optimisations de performance
 */

import { ConnectionPoolManager } from './ConnectionPoolManager';
import { CacheManager } from '../cache/CacheManager';
import { Logger } from '../utils/Logger';
import {
  VB6Connection,
  VB6Recordset,
  QueryResult,
  ConnectionOptions,
  DatabaseProvider,
} from '../types/database';

export class DatabaseManager {
  private logger: Logger;
  private connections: Map<string, VB6Connection>;
  private recordsets: Map<string, VB6Recordset>;

  constructor(
    private connectionPoolManager: ConnectionPoolManager,
    private cacheManager: CacheManager
  ) {
    this.logger = new Logger('DatabaseManager');
    this.connections = new Map();
    this.recordsets = new Map();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initialisation du gestionnaire de base de données...');

    // Chargement des configurations de base de données
    await this.loadDatabaseConfigurations();

    // Préparation des pools de connexions par défaut
    await this.prepareDefaultConnectionPools();

    this.logger.info('Gestionnaire de base de données initialisé');
  }

  /**
   * Crée une connexion VB6 compatible
   */
  async createVB6Connection(
    connectionString: string,
    provider: DatabaseProvider
  ): Promise<VB6Connection> {
    const connectionId = this.generateConnectionId();

    try {
      // Parse de la chaîne de connexion VB6
      const options = this.parseVB6ConnectionString(connectionString, provider);

      // Création de la connexion
      const pool = await this.connectionPoolManager.getPool(options);
      const connection = await pool.getConnection();

      const vb6Connection: VB6Connection = {
        id: connectionId,
        connectionString,
        provider,
        isOpen: true,
        state: 'open',
        timeout: options.timeout || 30,
        cursorLocation: 'client',
        mode: 'read-write',
        isolationLevel: 'read-committed',
        connection,
        pool,
        createdAt: new Date(),
        lastUsed: new Date(),
      };

      this.connections.set(connectionId, vb6Connection);

      this.logger.info(`Connexion VB6 créée: ${connectionId} (${provider})`);
      return vb6Connection;
    } catch (error) {
      this.logger.error(`Erreur création connexion ${connectionId}:`, error);
      throw new Error(
        `Impossible de créer la connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  /**
   * Exécute une requête VB6 avec optimisations de performance
   */
  async executeVB6Query(
    connectionId: string,
    sql: string,
    parameters?: any[]
  ): Promise<QueryResult> {
    const startTime = Date.now();
    const connection = this.connections.get(connectionId);

    if (!connection || !connection.isOpen) {
      throw new Error('Connexion non trouvée ou fermée');
    }

    try {
      // Mise à jour de la dernière utilisation
      connection.lastUsed = new Date();

      // Vérification du cache pour les requêtes SELECT
      const cacheKey = this.generateCacheKey(sql, parameters);
      if (this.isSelectQuery(sql)) {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit pour la requête: ${cacheKey}`);
          return {
            data: cached.data,
            recordsAffected: cached.recordsAffected,
            executionTime: Date.now() - startTime,
            fromCache: true,
          };
        }
      }

      // Préparation et exécution de la requête
      const query = this.prepareQuery(sql, parameters);
      const result = await this.executeQuery(connection, query);

      const executionTime = Date.now() - startTime;

      // Mise en cache des résultats SELECT
      if (this.isSelectQuery(sql) && result.data.length < 10000) {
        await this.cacheManager.set(
          cacheKey,
          {
            data: result.data,
            recordsAffected: result.recordsAffected,
          },
          300
        ); // Cache 5 minutes
      }

      // Logging des performances
      if (executionTime > 1000) {
        this.logger.warn(
          `Requête lente détectée (${executionTime}ms): ${sql.substring(0, 100)}...`
        );
      }

      return {
        ...result,
        executionTime,
        fromCache: false,
      };
    } catch (error) {
      this.logger.error(`Erreur exécution requête:`, error);
      throw error;
    }
  }

  /**
   * Crée un Recordset VB6 compatible
   */
  async createRecordset(
    connectionId: string,
    source: string,
    options?: {
      cursorType?: 'forward-only' | 'keyset' | 'dynamic' | 'static';
      lockType?: 'read-only' | 'pessimistic' | 'optimistic' | 'batch-optimistic';
      maxRecords?: number;
    }
  ): Promise<VB6Recordset> {
    const recordsetId = this.generateRecordsetId();
    const connection = this.connections.get(connectionId);

    if (!connection) {
      throw new Error('Connexion non trouvée');
    }

    try {
      // Exécution de la requête source
      const result = await this.executeVB6Query(connectionId, source);

      const recordset: VB6Recordset = {
        id: recordsetId,
        connectionId,
        source,
        state: 'open',
        cursorType: options?.cursorType || 'forward-only',
        lockType: options?.lockType || 'read-only',
        maxRecords: options?.maxRecords || 0,
        recordCount: result.data.length,
        fields: this.extractFields(result.data),
        data: result.data,
        position: 0,
        bof: result.data.length === 0,
        eof: result.data.length === 0,
        isOpen: true,
        createdAt: new Date(),
        lastUsed: new Date(),
      };

      this.recordsets.set(recordsetId, recordset);

      this.logger.info(`Recordset créé: ${recordsetId} (${result.data.length} enregistrements)`);
      return recordset;
    } catch (error) {
      this.logger.error(`Erreur création recordset:`, error);
      throw error;
    }
  }

  /**
   * Navigation dans les recordsets (compatible VB6)
   */
  async moveFirst(recordsetId: string): Promise<void> {
    const recordset = this.recordsets.get(recordsetId);
    if (!recordset) throw new Error('Recordset non trouvé');

    recordset.position = 0;
    recordset.bof = recordset.data.length === 0;
    recordset.eof = false;
    recordset.lastUsed = new Date();
  }

  async moveLast(recordsetId: string): Promise<void> {
    const recordset = this.recordsets.get(recordsetId);
    if (!recordset) throw new Error('Recordset non trouvé');

    recordset.position = Math.max(0, recordset.data.length - 1);
    recordset.bof = false;
    recordset.eof = recordset.data.length === 0;
    recordset.lastUsed = new Date();
  }

  async moveNext(recordsetId: string): Promise<void> {
    const recordset = this.recordsets.get(recordsetId);
    if (!recordset) throw new Error('Recordset non trouvé');

    if (recordset.position < recordset.data.length - 1) {
      recordset.position++;
      recordset.bof = false;
      recordset.eof = false;
    } else {
      recordset.eof = true;
    }
    recordset.lastUsed = new Date();
  }

  async movePrevious(recordsetId: string): Promise<void> {
    const recordset = this.recordsets.get(recordsetId);
    if (!recordset) throw new Error('Recordset non trouvé');

    if (recordset.position > 0) {
      recordset.position--;
      recordset.bof = false;
      recordset.eof = false;
    } else {
      recordset.bof = true;
    }
    recordset.lastUsed = new Date();
  }

  /**
   * Obtient la valeur d'un champ du recordset courant
   */
  getFieldValue(recordsetId: string, fieldName: string): any {
    const recordset = this.recordsets.get(recordsetId);
    if (!recordset) throw new Error('Recordset non trouvé');

    if (recordset.eof || recordset.bof || recordset.data.length === 0) {
      throw new Error('Aucun enregistrement courant');
    }

    const currentRecord = recordset.data[recordset.position];
    return currentRecord[fieldName];
  }

  /**
   * Met à jour la valeur d'un champ
   */
  async setFieldValue(recordsetId: string, fieldName: string, value: any): Promise<void> {
    const recordset = this.recordsets.get(recordsetId);
    if (!recordset) throw new Error('Recordset non trouvé');

    if (recordset.lockType === 'read-only') {
      throw new Error('Recordset en lecture seule');
    }

    if (recordset.eof || recordset.bof || recordset.data.length === 0) {
      throw new Error('Aucun enregistrement courant');
    }

    const currentRecord = recordset.data[recordset.position];
    currentRecord[fieldName] = value;
    recordset.lastUsed = new Date();
  }

  /**
   * Sauvegarde les modifications (Update en VB6)
   */
  async updateRecord(recordsetId: string): Promise<void> {
    const recordset = this.recordsets.get(recordsetId);
    if (!recordset) throw new Error('Recordset non trouvé');

    if (recordset.lockType === 'read-only') {
      throw new Error('Recordset en lecture seule');
    }

    // Logique de mise à jour à implémenter selon le type de source
    // Pour l'instant, on simule une mise à jour réussie
    recordset.lastUsed = new Date();
    this.logger.info(`Enregistrement mis à jour dans le recordset ${recordsetId}`);
  }

  /**
   * Ferme une connexion
   */
  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      // Fermeture de tous les recordsets associés
      for (const [id, recordset] of this.recordsets) {
        if (recordset.connectionId === connectionId) {
          recordset.isOpen = false;
          recordset.state = 'closed';
          this.recordsets.delete(id);
        }
      }

      // Libération de la connexion vers le pool
      if (connection.connection) {
        connection.pool.releaseConnection(connection.connection);
      }

      connection.isOpen = false;
      connection.state = 'closed';
      this.connections.delete(connectionId);

      this.logger.info(`Connexion fermée: ${connectionId}`);
    } catch (error) {
      this.logger.error(`Erreur fermeture connexion ${connectionId}:`, error);
    }
  }

  /**
   * Vérification de santé
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test simple de connexion
      const testConnection = await this.createVB6Connection(
        'Provider=Microsoft.Jet.OLEDB.4.0;Data Source=:memory:',
        'oledb'
      );
      await this.closeConnection(testConnection.id);
      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }

  // Méthodes privées

  private parseVB6ConnectionString(
    connectionString: string,
    provider: DatabaseProvider
  ): ConnectionOptions {
    const options: ConnectionOptions = {
      provider,
      host: 'localhost',
      port: this.getDefaultPort(provider),
      database: '',
      username: '',
      password: '',
      timeout: 30,
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 300000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
    };

    // Parse des différents formats de chaînes de connexion VB6
    const pairs = connectionString.split(';');

    for (const pair of pairs) {
      const [key, value] = pair.split('=').map(s => s.trim());
      if (!key || !value) continue;

      switch (key.toLowerCase()) {
        case 'data source':
        case 'server':
          options.host = value;
          break;
        case 'initial catalog':
        case 'database':
          options.database = value;
          break;
        case 'user id':
        case 'uid':
          options.username = value;
          break;
        case 'password':
        case 'pwd':
          options.password = value;
          break;
        case 'connection timeout':
        case 'timeout':
          options.timeout = parseInt(value, 10);
          break;
        case 'port':
          options.port = parseInt(value, 10);
          break;
      }
    }

    return options;
  }

  private getDefaultPort(provider: DatabaseProvider): number {
    switch (provider) {
      case 'mysql':
        return 3306;
      case 'postgresql':
        return 5432;
      case 'mssql':
        return 1433;
      case 'oracle':
        return 1521;
      case 'mongodb':
        return 27017;
      default:
        return 0;
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecordsetId(): string {
    return `rs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(sql: string, parameters?: any[]): string {
    const paramStr = parameters ? JSON.stringify(parameters) : '';
    return `query_${Buffer.from(sql + paramStr).toString('base64')}`;
  }

  private isSelectQuery(sql: string): boolean {
    return sql.trim().toLowerCase().startsWith('select');
  }

  private prepareQuery(sql: string, parameters?: any[]): string {
    if (!parameters || parameters.length === 0) {
      return sql;
    }

    // Remplacement simple des paramètres (à améliorer pour la sécurité)
    let preparedSql = sql;
    parameters.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      preparedSql = preparedSql.replace(placeholder, this.escapeValue(param));
    });

    return preparedSql;
  }

  private escapeValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  private async executeQuery(connection: VB6Connection, sql: string): Promise<QueryResult> {
    // Implémentation spécifique selon le provider
    // Pour l'instant, simulation d'un résultat
    return {
      data: [],
      recordsAffected: 0,
      executionTime: 0,
    };
  }

  private extractFields(data: any[]): Array<{ name: string; type: string; size: number }> {
    if (data.length === 0) return [];

    const firstRow = data[0];
    return Object.keys(firstRow).map(name => ({
      name,
      type: this.inferType(firstRow[name]),
      size: typeof firstRow[name] === 'string' ? firstRow[name].length : 0,
    }));
  }

  private inferType(value: any): string {
    if (value === null || value === undefined) return 'variant';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'double';
    }
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    return 'variant';
  }

  private async loadDatabaseConfigurations(): Promise<void> {
    // Chargement des configurations depuis les variables d'environnement ou fichiers
    this.logger.debug('Chargement des configurations de base de données...');
  }

  private async prepareDefaultConnectionPools(): Promise<void> {
    // Préparation des pools de connexions par défaut
    this.logger.debug('Préparation des pools de connexions par défaut...');
  }
}
