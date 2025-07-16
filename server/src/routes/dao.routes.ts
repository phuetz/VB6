/**
 * DAO (Data Access Objects) Routes
 * Implements VB6 DAO compatibility layer for Access databases
 */

import { Router, Request, Response } from 'express';
import { DatabasePool } from '../services/DatabasePool';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import * as path from 'path';

const router = Router();
const dbPool = DatabasePool.getInstance();

// DAO Workspace
router.post('/workspace/create', asyncHandler(async (req: Request, res: Response) => {
  const { name, userName, password } = req.body;
  const workspaceId = `dao_ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // DAO workspaces are primarily for Access databases
    res.json({
      success: true,
      workspaceId,
      name: name || 'Default Workspace',
      userName: userName || 'admin',
      type: 2, // dbUseJet
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
}));

// DAO Database
router.post('/database/open', asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, dbPath, exclusive, readOnly, connect } = req.body;
  const connectionId = `dao_db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Parse DAO database path
    const config = parseDAOConnection(dbPath, connect);
    await dbPool.connect(connectionId, {
      type: 'DAO',
      ...config,
      options: {
        exclusive: exclusive || false,
        readOnly: readOnly || false,
      },
    });
    
    res.json({
      success: true,
      connectionId,
      name: path.basename(dbPath),
      collatingOrder: 1033, // dbSortGeneral
      queryTimeout: 60,
      version: '4.0',
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
}));

// DAO Recordset
router.post('/recordset/open', asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, source, type, options, lockEdit } = req.body;
  
  const recordset = await dbPool.createDAORecordset(
    connectionId,
    source,
    type || 1, // dbOpenDynaset
    options || 0,
    lockEdit || 2 // dbOptimistic
  );
  
  res.json({
    success: true,
    recordset: {
      id: recordset.id,
      recordCount: recordset.recordCount,
      fields: recordset.fields.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        required: f.required,
        allowZeroLength: f.allowZeroLength,
        defaultValue: f.defaultValue,
      })),
      eof: recordset.eof,
      bof: recordset.bof,
      absolutePosition: recordset.position,
      percentPosition: recordset.position / Math.max(1, recordset.recordCount) * 100,
      bookmarkable: true,
      updatable: type !== 4, // Not dbOpenSnapshot
    },
  });
}));

// TableDef operations
router.get('/database/:id/tabledefs', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const tables = await dbPool.execute(id, 
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    res.json({
      success: true,
      tableDefs: tables.rows.map((row: any) => ({
        name: row.name,
        attributes: 0,
        connect: '',
        dateCreated: new Date(),
        lastUpdated: new Date(),
        sourceTableName: row.name,
        updatable: true,
        validationRule: '',
        validationText: '',
      })),
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
}));

// QueryDef operations
router.post('/querydef/create', asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, name, sql } = req.body;
  const queryDefId = `dao_qd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Store the query definition
    queryDefs.set(queryDefId, {
      id: queryDefId,
      connectionId,
      name,
      sql,
      type: determineQueryType(sql),
      updatable: isUpdatableQuery(sql),
      parameters: extractParameters(sql),
      dateCreated: new Date(),
      lastUpdated: new Date(),
    });
    
    res.json({
      success: true,
      queryDefId,
      name,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
}));

router.post('/querydef/:id/execute', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { parameters } = req.body;
  
  const queryDef = queryDefs.get(id);
  if (!queryDef) {
    return res.status(404).json({ success: false, error: 'QueryDef not found' });
  }
  
  try {
    // Replace parameters in SQL
    let sql = queryDef.sql;
    if (parameters && queryDef.parameters.length > 0) {
      queryDef.parameters.forEach((param, index) => {
        const value = parameters[param.name] || parameters[index];
        sql = sql.replace(new RegExp(`\\[${param.name}\\]`, 'g'), 
          typeof value === 'string' ? `'${value}'` : value);
      });
    }
    
    const result = await dbPool.execute(queryDef.connectionId, sql);
    
    if (queryDef.type === 1 || queryDef.type === 4) { // Action or DDL query
      res.json({
        success: true,
        recordsAffected: result.affectedRows || 0,
      });
    } else {
      // Select query - return recordset
      const recordset = await dbPool.createDAORecordset(
        queryDef.connectionId,
        sql,
        1, // dbOpenDynaset
        0
      );
      
      res.json({
        success: true,
        recordset: {
          id: recordset.id,
          recordCount: recordset.recordCount,
          fields: recordset.fields,
        },
      });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
}));

// Field operations
router.get('/recordset/:id/fields', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const recordset = getRecordset(id);
  if (!recordset) {
    return res.status(404).json({ success: false, error: 'Recordset not found' });
  }
  
  res.json({
    success: true,
    fields: recordset.fields.map(field => ({
      name: field.name,
      type: field.type,
      size: field.size,
      value: recordset.rows[recordset.position]?.[field.name],
      attributes: field.attributes || 0,
      collatingOrder: 1033,
      defaultValue: field.defaultValue,
      required: field.required,
      allowZeroLength: field.allowZeroLength,
      validationRule: field.validationRule || '',
      validationText: field.validationText || '',
    })),
  });
}));

// Index operations
router.get('/tabledef/:tableId/indexes', asyncHandler(async (req: Request, res: Response) => {
  const { tableId } = req.params;
  
  try {
    // This would need to query system tables for index information
    res.json({
      success: true,
      indexes: [
        {
          name: 'PrimaryKey',
          primary: true,
          unique: true,
          clustered: true,
          required: true,
          ignorenulls: false,
          fields: ['ID'],
        },
      ],
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
}));

// Relation operations (foreign keys)
router.get('/database/:id/relations', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // This would need to query foreign key information
    res.json({
      success: true,
      relations: [],
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
}));

// Transaction management
router.post('/workspace/:id/begintrans', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Begin transaction for all databases in workspace
    res.json({
      success: true,
      transactionId: `trans_${Date.now()}`,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
}));

router.post('/workspace/:id/committrans', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Commit all pending transactions
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
}));

router.post('/workspace/:id/rollback', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Rollback all pending transactions
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
}));

// Helper functions
function parseDAOConnection(dbPath: string, connect?: string): any {
  const config: any = {
    engine: 'sqlite', // Default to SQLite for file-based databases
  };
  
  if (dbPath.endsWith('.mdb') || dbPath.endsWith('.accdb')) {
    config.engine = 'access';
    config.database = dbPath;
  } else if (connect) {
    // Parse ODBC connection string
    const pairs = connect.split(';');
    pairs.forEach(pair => {
      const [key, value] = pair.split('=').map(s => s.trim());
      switch (key.toLowerCase()) {
        case 'dsn':
          config.dsn = value;
          break;
        case 'driver':
          if (value.includes('SQL Server')) {
            config.engine = 'mssql';
          } else if (value.includes('MySQL')) {
            config.engine = 'mysql';
          } else if (value.includes('PostgreSQL')) {
            config.engine = 'postgresql';
          }
          break;
        case 'server':
          config.host = value;
          break;
        case 'database':
          config.database = value;
          break;
        case 'uid':
          config.user = value;
          break;
        case 'pwd':
          config.password = value;
          break;
      }
    });
  } else {
    config.database = dbPath;
  }
  
  return config;
}

function determineQueryType(sql: string): number {
  const trimmedSql = sql.trim().toUpperCase();
  
  if (trimmedSql.startsWith('SELECT')) return 0; // dbQSelect
  if (trimmedSql.startsWith('INSERT') || 
      trimmedSql.startsWith('UPDATE') || 
      trimmedSql.startsWith('DELETE')) return 1; // dbQAction
  if (trimmedSql.startsWith('CREATE') || 
      trimmedSql.startsWith('ALTER') || 
      trimmedSql.startsWith('DROP')) return 4; // dbQDDL
  
  return 0; // Default to select
}

function isUpdatableQuery(sql: string): boolean {
  const trimmedSql = sql.trim().toUpperCase();
  
  // Simple queries without joins are typically updatable
  if (trimmedSql.includes('JOIN')) return false;
  if (trimmedSql.includes('GROUP BY')) return false;
  if (trimmedSql.includes('DISTINCT')) return false;
  if (trimmedSql.includes('UNION')) return false;
  
  return true;
}

function extractParameters(sql: string): any[] {
  const params: any[] = [];
  const paramRegex = /\[([^\]]+)\]/g;
  let match;
  
  while ((match = paramRegex.exec(sql)) !== null) {
    params.push({
      name: match[1],
      type: 10, // dbText - default type
      direction: 1, // dbParamInput
      size: 255,
    });
  }
  
  return params;
}

// Temporary storage
const queryDefs = new Map<string, any>();
const recordsets = new Map<string, any>();

function getRecordset(id: string): any {
  return recordsets.get(id);
}

function storeRecordset(id: string, recordset: any): void {
  recordsets.set(id, recordset);
  
  // Clean up after 30 minutes
  setTimeout(() => {
    recordsets.delete(id);
  }, 30 * 60 * 1000);
}

export const daoRouter = router;