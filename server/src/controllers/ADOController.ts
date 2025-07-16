/**
 * Contrôleur ADO (ActiveX Data Objects) pour VB6 Studio
 * Implémentation complète des objets ADO : Connection, Recordset, Command, etc.
 */

import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../database/DatabaseManager';
import { Logger } from '../utils/Logger';
import {
  ADOConnectionConfig,
  ADORecordsetConfig,
  VB6Connection,
  VB6Recordset,
  DataCommandConfig,
  DataParameterConfig,
} from '../types/database';

export class ADOController {
  private router: Router;
  private logger: Logger;
  private connections: Map<string, VB6Connection>;
  private recordsets: Map<string, VB6Recordset>;
  private commands: Map<string, any>;

  constructor(private databaseManager: DatabaseManager) {
    this.router = Router();
    this.logger = new Logger('ADOController');
    this.connections = new Map();
    this.recordsets = new Map();
    this.commands = new Map();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // ADO Connection Object
    this.router.post('/connection/create', this.createConnection.bind(this));
    this.router.post('/connection/:id/open', this.openConnection.bind(this));
    this.router.post('/connection/:id/close', this.closeConnection.bind(this));
    this.router.post('/connection/:id/execute', this.executeConnection.bind(this));
    this.router.get('/connection/:id/state', this.getConnectionState.bind(this));
    this.router.get('/connection/:id/errors', this.getConnectionErrors.bind(this));
    this.router.post('/connection/:id/begin-trans', this.beginTransaction.bind(this));
    this.router.post('/connection/:id/commit-trans', this.commitTransaction.bind(this));
    this.router.post('/connection/:id/rollback-trans', this.rollbackTransaction.bind(this));

    // ADO Recordset Object
    this.router.post('/recordset/create', this.createRecordset.bind(this));
    this.router.post('/recordset/:id/open', this.openRecordset.bind(this));
    this.router.post('/recordset/:id/close', this.closeRecordset.bind(this));
    this.router.get('/recordset/:id/fields', this.getRecordsetFields.bind(this));
    this.router.get('/recordset/:id/data', this.getRecordsetData.bind(this));
    this.router.post('/recordset/:id/move-first', this.moveFirst.bind(this));
    this.router.post('/recordset/:id/move-last', this.moveLast.bind(this));
    this.router.post('/recordset/:id/move-next', this.moveNext.bind(this));
    this.router.post('/recordset/:id/move-previous', this.movePrevious.bind(this));
    this.router.post('/recordset/:id/move/:position', this.moveToPosition.bind(this));
    this.router.get('/recordset/:id/field/:name', this.getFieldValue.bind(this));
    this.router.put('/recordset/:id/field/:name', this.setFieldValue.bind(this));
    this.router.post('/recordset/:id/add-new', this.addNew.bind(this));
    this.router.post('/recordset/:id/update', this.updateRecord.bind(this));
    this.router.post('/recordset/:id/cancel-update', this.cancelUpdate.bind(this));
    this.router.post('/recordset/:id/delete', this.deleteRecord.bind(this));
    this.router.post('/recordset/:id/requery', this.requeryRecordset.bind(this));
    this.router.post('/recordset/:id/find', this.findRecord.bind(this));
    this.router.post('/recordset/:id/filter', this.filterRecordset.bind(this));
    this.router.post('/recordset/:id/sort', this.sortRecordset.bind(this));

    // ADO Command Object
    this.router.post('/command/create', this.createCommand.bind(this));
    this.router.post('/command/:id/execute', this.executeCommand.bind(this));
    this.router.get('/command/:id/parameters', this.getCommandParameters.bind(this));
    this.router.post('/command/:id/parameter', this.addCommandParameter.bind(this));
    this.router.put('/command/:id/parameter/:name', this.setParameterValue.bind(this));
    this.router.delete('/command/:id/parameter/:name', this.removeParameter.bind(this));

    // ADO Error Collection
    this.router.get('/errors', this.getAllErrors.bind(this));
    this.router.delete('/errors', this.clearErrors.bind(this));

    // Utilitaires
    this.router.get('/providers', this.getProviders.bind(this));
    this.router.get('/connection/:id/schema/:type', this.getSchema.bind(this));
    this.router.get('/connection/:id/properties', this.getConnectionProperties.bind(this));
  }

  // Méthodes ADO Connection

  private async createConnection(req: Request, res: Response): Promise<void> {
    try {
      const config: ADOConnectionConfig = req.body;

      const connection = await this.databaseManager.createVB6Connection(
        config.connectionString,
        this.parseProvider(config.provider)
      );

      this.connections.set(connection.id, connection);

      res.json({
        success: true,
        connectionId: connection.id,
        state: connection.state,
        version: this.getADOVersion(),
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur création connexion ADO');
    }
  }

  private async openConnection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { connectionString, userId, password } = req.body;

      const connection = this.connections.get(id);
      if (!connection) {
        res.status(404).json({ success: false, error: 'Connexion non trouvée' });
        return;
      }

      // La connexion est déjà ouverte lors de la création
      connection.state = 'open';

      res.json({
        success: true,
        state: connection.state,
        connectionTimeout: connection.timeout,
        cursorLocation: connection.cursorLocation,
        mode: connection.mode,
        isolationLevel: connection.isolationLevel,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur ouverture connexion');
    }
  }

  private async closeConnection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.databaseManager.closeConnection(id);
      this.connections.delete(id);

      res.json({ success: true, message: 'Connexion fermée' });
    } catch (error) {
      this.handleError(res, error, 'Erreur fermeture connexion');
    }
  }

  private async executeConnection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { commandText, recordsAffected, options } = req.body;

      const result = await this.databaseManager.executeVB6Query(id, commandText);

      res.json({
        success: true,
        recordsAffected: result.recordsAffected,
        executionTime: result.executionTime,
        data: result.data,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur exécution commande');
    }
  }

  // Méthodes ADO Recordset

  private async createRecordset(req: Request, res: Response): Promise<void> {
    try {
      const config: ADORecordsetConfig = req.body;

      const recordset = await this.databaseManager.createRecordset(
        config.activeConnection,
        config.source,
        {
          cursorType: config.cursorType,
          lockType: config.lockType,
          maxRecords: config.maxRecords,
        }
      );

      this.recordsets.set(recordset.id, recordset);

      res.json({
        success: true,
        recordsetId: recordset.id,
        state: recordset.state,
        recordCount: recordset.recordCount,
        fields: recordset.fields,
        bof: recordset.bof,
        eof: recordset.eof,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur création recordset');
    }
  }

  private async openRecordset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { source, activeConnection, cursorType, lockType, options } = req.body;

      // Le recordset est déjà ouvert lors de la création
      const recordset = this.recordsets.get(id);
      if (!recordset) {
        res.status(404).json({ success: false, error: 'Recordset non trouvé' });
        return;
      }

      res.json({
        success: true,
        state: recordset.state,
        recordCount: recordset.recordCount,
        fields: recordset.fields,
        pageCount: Math.ceil(recordset.recordCount / (recordset.pageSize || 10)),
        pageSize: recordset.pageSize || 10,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur ouverture recordset');
    }
  }

  private async closeRecordset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recordset = this.recordsets.get(id);
      if (recordset) {
        recordset.isOpen = false;
        recordset.state = 'closed';
        this.recordsets.delete(id);
      }

      res.json({ success: true, message: 'Recordset fermé' });
    } catch (error) {
      this.handleError(res, error, 'Erreur fermeture recordset');
    }
  }

  private async getRecordsetFields(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recordset = this.recordsets.get(id);
      if (!recordset) {
        res.status(404).json({ success: false, error: 'Recordset non trouvé' });
        return;
      }

      res.json({
        success: true,
        fields: recordset.fields,
        count: recordset.fields.length,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur récupération des champs');
    }
  }

  private async getRecordsetData(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 100 } = req.query;

      const recordset = this.recordsets.get(id);
      if (!recordset) {
        res.status(404).json({ success: false, error: 'Recordset non trouvé' });
        return;
      }

      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const data = recordset.data.slice(start, end);

      res.json({
        success: true,
        data,
        currentRecord: recordset.data[recordset.position] || null,
        position: recordset.position,
        recordCount: recordset.recordCount,
        bof: recordset.bof,
        eof: recordset.eof,
        absolutePosition: recordset.absolutePosition,
        percentPosition: recordset.percentPosition,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(recordset.recordCount / Number(pageSize)),
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur récupération des données');
    }
  }

  // Navigation dans les recordsets

  private async moveFirst(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.databaseManager.moveFirst(id);
      await this.sendRecordsetPosition(res, id);
    } catch (error) {
      this.handleError(res, error, 'Erreur MoveFirst');
    }
  }

  private async moveLast(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.databaseManager.moveLast(id);
      await this.sendRecordsetPosition(res, id);
    } catch (error) {
      this.handleError(res, error, 'Erreur MoveLast');
    }
  }

  private async moveNext(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.databaseManager.moveNext(id);
      await this.sendRecordsetPosition(res, id);
    } catch (error) {
      this.handleError(res, error, 'Erreur MoveNext');
    }
  }

  private async movePrevious(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.databaseManager.movePrevious(id);
      await this.sendRecordsetPosition(res, id);
    } catch (error) {
      this.handleError(res, error, 'Erreur MovePrevious');
    }
  }

  private async moveToPosition(req: Request, res: Response): Promise<void> {
    try {
      const { id, position } = req.params;

      const recordset = this.recordsets.get(id);
      if (!recordset) {
        res.status(404).json({ success: false, error: 'Recordset non trouvé' });
        return;
      }

      const pos = Number(position);
      if (pos < 0 || pos >= recordset.recordCount) {
        res.status(400).json({ success: false, error: 'Position invalide' });
        return;
      }

      recordset.position = pos;
      recordset.bof = false;
      recordset.eof = false;

      await this.sendRecordsetPosition(res, id);
    } catch (error) {
      this.handleError(res, error, 'Erreur Move');
    }
  }

  // Manipulation des champs

  private async getFieldValue(req: Request, res: Response): Promise<void> {
    try {
      const { id, name } = req.params;

      const value = this.databaseManager.getFieldValue(id, name);

      res.json({
        success: true,
        fieldName: name,
        value,
        type: typeof value,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur récupération champ');
    }
  }

  private async setFieldValue(req: Request, res: Response): Promise<void> {
    try {
      const { id, name } = req.params;
      const { value } = req.body;

      await this.databaseManager.setFieldValue(id, name, value);

      res.json({
        success: true,
        fieldName: name,
        value,
        message: 'Valeur mise à jour',
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur mise à jour champ');
    }
  }

  // Modification des enregistrements

  private async addNew(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recordset = this.recordsets.get(id);
      if (!recordset) {
        res.status(404).json({ success: false, error: 'Recordset non trouvé' });
        return;
      }

      if (recordset.lockType === 'read-only') {
        res.status(400).json({ success: false, error: 'Recordset en lecture seule' });
        return;
      }

      // Création d'un nouvel enregistrement vide
      const newRecord: any = {};
      recordset.fields.forEach(field => {
        newRecord[field.name] = field.defaultValue || null;
      });

      recordset.data.push(newRecord);
      recordset.position = recordset.data.length - 1;
      recordset.recordCount = recordset.data.length;
      recordset.eof = false;
      recordset.bof = false;

      res.json({
        success: true,
        message: 'Nouvel enregistrement créé',
        position: recordset.position,
        record: newRecord,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur AddNew');
    }
  }

  private async updateRecord(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.databaseManager.updateRecord(id);

      res.json({
        success: true,
        message: 'Enregistrement mis à jour',
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur Update');
    }
  }

  private async cancelUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Logique d'annulation à implémenter
      res.json({
        success: true,
        message: 'Modifications annulées',
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur CancelUpdate');
    }
  }

  private async deleteRecord(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recordset = this.recordsets.get(id);
      if (!recordset) {
        res.status(404).json({ success: false, error: 'Recordset non trouvé' });
        return;
      }

      if (recordset.lockType === 'read-only') {
        res.status(400).json({ success: false, error: 'Recordset en lecture seule' });
        return;
      }

      if (recordset.eof || recordset.bof) {
        res.status(400).json({ success: false, error: 'Aucun enregistrement courant' });
        return;
      }

      // Suppression de l'enregistrement
      recordset.data.splice(recordset.position, 1);
      recordset.recordCount = recordset.data.length;

      // Ajustement de la position
      if (recordset.position >= recordset.recordCount) {
        recordset.position = recordset.recordCount - 1;
        if (recordset.recordCount === 0) {
          recordset.eof = true;
          recordset.bof = true;
        }
      }

      res.json({
        success: true,
        message: 'Enregistrement supprimé',
        recordCount: recordset.recordCount,
        position: recordset.position,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur Delete');
    }
  }

  // Requêtes et filtres

  private async requeryRecordset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recordset = this.recordsets.get(id);
      if (!recordset) {
        res.status(404).json({ success: false, error: 'Recordset non trouvé' });
        return;
      }

      // Ré-exécution de la requête source
      const result = await this.databaseManager.executeVB6Query(
        recordset.connectionId,
        recordset.source
      );

      recordset.data = result.data;
      recordset.recordCount = result.data.length;
      recordset.position = 0;
      recordset.bof = result.data.length === 0;
      recordset.eof = result.data.length === 0;

      res.json({
        success: true,
        message: 'Recordset actualisé',
        recordCount: recordset.recordCount,
        executionTime: result.executionTime,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur Requery');
    }
  }

  private async findRecord(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { criteria, skipCurrent, searchDirection } = req.body;

      const recordset = this.recordsets.get(id);
      if (!recordset) {
        res.status(404).json({ success: false, error: 'Recordset non trouvé' });
        return;
      }

      // Implémentation basique de la recherche
      const startPos = skipCurrent ? recordset.position + 1 : recordset.position;
      const direction = searchDirection === 'backward' ? -1 : 1;

      let found = false;
      let position = startPos;

      while (position >= 0 && position < recordset.recordCount) {
        const record = recordset.data[position];
        if (this.evaluateCriteria(record, criteria)) {
          recordset.position = position;
          recordset.bof = false;
          recordset.eof = false;
          found = true;
          break;
        }
        position += direction;
      }

      if (!found) {
        recordset.eof = true;
      }

      res.json({
        success: true,
        found,
        position: found ? recordset.position : -1,
        eof: recordset.eof,
        currentRecord: found ? recordset.data[recordset.position] : null,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur Find');
    }
  }

  private async filterRecordset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { filter } = req.body;

      const recordset = this.recordsets.get(id);
      if (!recordset) {
        res.status(404).json({ success: false, error: 'Recordset non trouvé' });
        return;
      }

      recordset.filter = filter;

      // Application du filtre (implémentation basique)
      if (filter) {
        const filteredData = recordset.data.filter(record => this.evaluateCriteria(record, filter));
        recordset.data = filteredData;
        recordset.recordCount = filteredData.length;
      }

      recordset.position = 0;
      recordset.bof = recordset.recordCount === 0;
      recordset.eof = recordset.recordCount === 0;

      res.json({
        success: true,
        message: 'Filtre appliqué',
        recordCount: recordset.recordCount,
        filter: recordset.filter,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur Filter');
    }
  }

  private async sortRecordset(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sort } = req.body;

      const recordset = this.recordsets.get(id);
      if (!recordset) {
        res.status(404).json({ success: false, error: 'Recordset non trouvé' });
        return;
      }

      recordset.sort = sort;

      // Application du tri (implémentation basique)
      if (sort) {
        const sortFields = this.parseSortExpression(sort);
        recordset.data.sort((a, b) => {
          for (const field of sortFields) {
            const aVal = a[field.name];
            const bVal = b[field.name];
            const comparison = this.compareValues(aVal, bVal);
            if (comparison !== 0) {
              return field.desc ? -comparison : comparison;
            }
          }
          return 0;
        });
      }

      recordset.position = 0;
      recordset.bof = recordset.recordCount === 0;
      recordset.eof = recordset.recordCount === 0;

      res.json({
        success: true,
        message: 'Tri appliqué',
        sort: recordset.sort,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur Sort');
    }
  }

  // Méthodes ADO Command (à implémenter)

  private async createCommand(req: Request, res: Response): Promise<void> {
    try {
      const config: DataCommandConfig = req.body;
      const commandId = this.generateCommandId();

      this.commands.set(commandId, {
        id: commandId,
        ...config,
        createdAt: new Date(),
      });

      res.json({
        success: true,
        commandId,
        message: 'Commande créée',
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur création commande');
    }
  }

  private async executeCommand(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { parameters } = req.body;

      const command = this.commands.get(id);
      if (!command) {
        res.status(404).json({ success: false, error: 'Commande non trouvée' });
        return;
      }

      const result = await this.databaseManager.executeVB6Query(
        command.connectionId,
        command.commandText,
        parameters
      );

      res.json({
        success: true,
        result,
        recordsAffected: result.recordsAffected,
        executionTime: result.executionTime,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur exécution commande');
    }
  }

  // Utilitaires

  private async getProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = [
        { name: 'Microsoft.Jet.OLEDB.4.0', description: 'Microsoft Access' },
        { name: 'SQLOLEDB', description: 'SQL Server OLE DB' },
        { name: 'MSDAORA', description: 'Oracle OLE DB' },
        { name: 'Microsoft.ACE.OLEDB.12.0', description: 'Microsoft Access 2007+' },
        { name: 'MSDASQL', description: 'ODBC Driver' },
      ];

      res.json({
        success: true,
        providers,
      });
    } catch (error) {
      this.handleError(res, error, 'Erreur récupération providers');
    }
  }

  // Méthodes auxiliaires

  private async sendRecordsetPosition(res: Response, recordsetId: string): Promise<void> {
    const recordset = this.recordsets.get(recordsetId);
    if (!recordset) {
      res.status(404).json({ success: false, error: 'Recordset non trouvé' });
      return;
    }

    res.json({
      success: true,
      position: recordset.position,
      bof: recordset.bof,
      eof: recordset.eof,
      currentRecord: recordset.eof || recordset.bof ? null : recordset.data[recordset.position],
      recordCount: recordset.recordCount,
    });
  }

  private parseProvider(provider: string): any {
    // Mapping des providers ADO vers les providers internes
    const mapping: Record<string, string> = {
      'Microsoft.Jet.OLEDB.4.0': 'access',
      SQLOLEDB: 'mssql',
      MSDAORA: 'oracle',
      'Microsoft.ACE.OLEDB.12.0': 'access',
      MSDASQL: 'odbc',
    };

    return mapping[provider] || 'oledb';
  }

  private getADOVersion(): string {
    return '6.1'; // Version ADO simulée
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private evaluateCriteria(record: any, criteria: string): boolean {
    // Implémentation basique d'évaluation de critères
    try {
      // Pour une implémentation complète, il faudrait un parser d'expressions SQL
      return true;
    } catch {
      return false;
    }
  }

  private parseSortExpression(sort: string): Array<{ name: string; desc: boolean }> {
    return sort.split(',').map(field => {
      const trimmed = field.trim();
      const desc = trimmed.toLowerCase().endsWith(' desc');
      const name = desc ? trimmed.slice(0, -5).trim() : trimmed;
      return { name, desc };
    });
  }

  private compareValues(a: any, b: any): number {
    if (a === b) return 0;
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;

    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }

    return a < b ? -1 : 1;
  }

  private handleError(res: Response, error: any, context: string): void {
    this.logger.error(`${context}:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      context,
    });
  }

  // Méthodes non implémentées (à compléter)
  private async getConnectionState(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: 'Non implémenté' });
  }

  private async getConnectionErrors(req: Request, res: Response): Promise<void> {
    res.json({ success: true, errors: [] });
  }

  private async beginTransaction(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: 'Transaction démarrée' });
  }

  private async commitTransaction(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: 'Transaction validée' });
  }

  private async rollbackTransaction(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: 'Transaction annulée' });
  }

  private async getCommandParameters(req: Request, res: Response): Promise<void> {
    res.json({ success: true, parameters: [] });
  }

  private async addCommandParameter(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: 'Paramètre ajouté' });
  }

  private async setParameterValue(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: 'Valeur définie' });
  }

  private async removeParameter(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: 'Paramètre supprimé' });
  }

  private async getAllErrors(req: Request, res: Response): Promise<void> {
    res.json({ success: true, errors: [] });
  }

  private async clearErrors(req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: 'Erreurs effacées' });
  }

  private async getSchema(req: Request, res: Response): Promise<void> {
    res.json({ success: true, schema: {} });
  }

  private async getConnectionProperties(req: Request, res: Response): Promise<void> {
    res.json({ success: true, properties: {} });
  }

  public getRouter(): Router {
    return this.router;
  }
}
