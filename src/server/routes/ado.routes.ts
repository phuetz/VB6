/**
 * ADO (ActiveX Data Objects) Routes
 * Implements VB6 ADO compatibility layer
 */

import { Router, Request, Response, NextFunction } from 'express';
import { DatabasePool } from '../services/DatabasePool';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

const router = Router();
const dbPool = DatabasePool.getInstance();

// ADO Connection
router.post('/connection/open', asyncHandler(async (req: Request, res: Response) => {
  const { connectionString, mode, cursorLocation } = req.body;
  const connectionId = `ado_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Parse ADO connection string
    const config = parseADOConnectionString(connectionString);
    await dbPool.connect(connectionId, {
      type: 'ADO',
      ...config,
    });
    
    res.json({
      success: true,
      connectionId,
      state: 1, // adStateOpen
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      state: 0, // adStateClosed
    });
  }
}));

// ADO Recordset
router.post('/recordset/open', asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, source, cursorType, lockType, options } = req.body;
  
  const recordset = await dbPool.createADORecordset(
    connectionId,
    source,
    cursorType || 1, // adOpenKeyset
    lockType || 3     // adLockOptimistic
  );
  
  res.json({
    success: true,
    recordset: {
      id: recordset.id,
      recordCount: recordset.recordCount,
      fields: recordset.fields,
      eof: recordset.eof,
      bof: recordset.bof,
      absolutePosition: recordset.position,
      pageSize: 10,
      pageCount: Math.ceil(recordset.recordCount / 10),
    },
  });
}));

// Recordset navigation
router.post('/recordset/:id/movefirst', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Get recordset from session/cache
  const recordset = getRecordset(id);
  if (!recordset) {
    return res.status(404).json({ success: false, error: 'Recordset not found' });
  }
  
  recordset.position = 0;
  recordset.eof = false;
  recordset.bof = recordset.rows.length === 0;
  
  res.json({
    success: true,
    position: recordset.position,
    eof: recordset.eof,
    bof: recordset.bof,
    data: recordset.rows[recordset.position],
  });
}));

router.post('/recordset/:id/movenext', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const recordset = getRecordset(id);
  
  if (!recordset) {
    return res.status(404).json({ success: false, error: 'Recordset not found' });
  }
  
  if (recordset.position < recordset.rows.length - 1) {
    recordset.position++;
    recordset.bof = false;
    recordset.eof = false;
  } else {
    recordset.eof = true;
  }
  
  res.json({
    success: true,
    position: recordset.position,
    eof: recordset.eof,
    bof: recordset.bof,
    data: recordset.rows[recordset.position],
  });
}));

router.post('/recordset/:id/moveprevious', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const recordset = getRecordset(id);
  
  if (!recordset) {
    return res.status(404).json({ success: false, error: 'Recordset not found' });
  }
  
  if (recordset.position > 0) {
    recordset.position--;
    recordset.eof = false;
    recordset.bof = false;
  } else {
    recordset.bof = true;
  }
  
  res.json({
    success: true,
    position: recordset.position,
    eof: recordset.eof,
    bof: recordset.bof,
    data: recordset.rows[recordset.position],
  });
}));

router.post('/recordset/:id/movelast', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const recordset = getRecordset(id);
  
  if (!recordset) {
    return res.status(404).json({ success: false, error: 'Recordset not found' });
  }
  
  recordset.position = Math.max(0, recordset.rows.length - 1);
  recordset.bof = false;
  recordset.eof = recordset.rows.length === 0;
  
  res.json({
    success: true,
    position: recordset.position,
    eof: recordset.eof,
    bof: recordset.bof,
    data: recordset.rows[recordset.position],
  });
}));

// Recordset data manipulation
router.post('/recordset/:id/addnew', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fields } = req.body;
  
  const recordset = getRecordset(id);
  if (!recordset) {
    return res.status(404).json({ success: false, error: 'Recordset not found' });
  }
  
  const newRecord = {};
  recordset.fields.forEach(field => {
    newRecord[field.name] = fields[field.name] || null;
  });
  
  recordset.rows.push(newRecord);
  recordset.position = recordset.rows.length - 1;
  recordset.recordCount = recordset.rows.length;
  
  res.json({
    success: true,
    position: recordset.position,
    data: newRecord,
  });
}));

router.post('/recordset/:id/update', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fields } = req.body;
  
  const recordset = getRecordset(id);
  if (!recordset || recordset.position < 0 || recordset.position >= recordset.rows.length) {
    return res.status(404).json({ success: false, error: 'Invalid recordset position' });
  }
  
  Object.assign(recordset.rows[recordset.position], fields);
  
  res.json({
    success: true,
    data: recordset.rows[recordset.position],
  });
}));

router.post('/recordset/:id/delete', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const recordset = getRecordset(id);
  if (!recordset || recordset.position < 0 || recordset.position >= recordset.rows.length) {
    return res.status(404).json({ success: false, error: 'Invalid recordset position' });
  }
  
  recordset.rows.splice(recordset.position, 1);
  recordset.recordCount = recordset.rows.length;
  
  if (recordset.position >= recordset.rows.length && recordset.rows.length > 0) {
    recordset.position = recordset.rows.length - 1;
  }
  
  res.json({
    success: true,
    recordCount: recordset.recordCount,
    position: recordset.position,
  });
}));

// Recordset queries
router.post('/recordset/:id/find', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { criteria, skipRecords, searchDirection } = req.body;
  
  const recordset = getRecordset(id);
  if (!recordset) {
    return res.status(404).json({ success: false, error: 'Recordset not found' });
  }
  
  // Parse ADO find criteria
  const { field, operator, value } = parseFindCriteria(criteria);
  
  let found = false;
  const startPos = recordset.position + (skipRecords || 0);
  
  if (searchDirection === 1) { // adSearchForward
    for (let i = startPos; i < recordset.rows.length; i++) {
      if (evaluateCriteria(recordset.rows[i][field], operator, value)) {
        recordset.position = i;
        found = true;
        break;
      }
    }
  } else { // adSearchBackward
    for (let i = startPos; i >= 0; i--) {
      if (evaluateCriteria(recordset.rows[i][field], operator, value)) {
        recordset.position = i;
        found = true;
        break;
      }
    }
  }
  
  res.json({
    success: true,
    found,
    position: recordset.position,
    data: found ? recordset.rows[recordset.position] : null,
  });
}));

router.post('/recordset/:id/filter', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { filter } = req.body;
  
  const recordset = getRecordset(id);
  if (!recordset) {
    return res.status(404).json({ success: false, error: 'Recordset not found' });
  }
  
  if (filter === 0) { // adFilterNone
    recordset.filteredRows = null;
  } else if (typeof filter === 'string') {
    // Parse filter criteria
    const criteria = parseFilterCriteria(filter);
    recordset.filteredRows = recordset.rows.filter(row => 
      evaluateFilterCriteria(row, criteria)
    );
  }
  
  const activeRows = recordset.filteredRows || recordset.rows;
  
  res.json({
    success: true,
    recordCount: activeRows.length,
    data: activeRows,
  });
}));

// Command execution
router.post('/command/execute', asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, commandText, commandType, parameters } = req.body;
  
  let result;
  
  switch (commandType) {
    case 1: // adCmdText
      result = await dbPool.execute(connectionId, commandText, parameters);
      break;
    case 4: // adCmdStoredProc
      // Execute stored procedure
      result = await executeStoredProcedure(connectionId, commandText, parameters);
      break;
    default:
      result = await dbPool.execute(connectionId, commandText, parameters);
  }
  
  res.json({
    success: true,
    recordsAffected: result.affectedRows || 0,
    data: result.rows,
  });
}));

// Helper functions
function parseADOConnectionString(connectionString: string): any {
  const config: any = {};
  const pairs = connectionString.split(';');
  
  pairs.forEach(pair => {
    const [key, value] = pair.split('=').map(s => s.trim());
    
    switch (key.toLowerCase()) {
      case 'provider':
        // Map ADO providers to database engines
        if (value.includes('SQLOLEDB') || value.includes('SQLNCLI')) {
          config.engine = 'mssql';
        } else if (value.includes('Microsoft.Jet') || value.includes('Microsoft.ACE')) {
          config.engine = 'access';
        } else if (value.includes('MSDAORA') || value.includes('OraOLEDB')) {
          config.engine = 'oracle';
        }
        break;
      case 'data source':
      case 'server':
        config.host = value;
        break;
      case 'initial catalog':
      case 'database':
        config.database = value;
        break;
      case 'user id':
      case 'uid':
        config.user = value;
        break;
      case 'password':
      case 'pwd':
        config.password = value;
        break;
      case 'integrated security':
        if (value.toLowerCase() === 'true' || value.toLowerCase() === 'sspi') {
          config.options = { ...config.options, trustedConnection: true };
        }
        break;
    }
  });
  
  return config;
}

function parseFindCriteria(criteria: string): { field: string; operator: string; value: any } {
  // Parse ADO find criteria like "CustomerID = 'ALFKI'"
  const match = criteria.match(/(\w+)\s*(=|<>|>|<|>=|<=|LIKE)\s*(.+)/i);
  
  if (match) {
    let value = match[3].trim();
    // Remove quotes if present
    if ((value.startsWith("'") && value.endsWith("'")) || 
        (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    
    return {
      field: match[1],
      operator: match[2].toUpperCase(),
      value,
    };
  }
  
  throw new Error('Invalid find criteria');
}

function evaluateCriteria(fieldValue: any, operator: string, criteriaValue: any): boolean {
  switch (operator) {
    case '=':
      return fieldValue == criteriaValue;
    case '<>':
      return fieldValue != criteriaValue;
    case '>':
      return fieldValue > criteriaValue;
    case '<':
      return fieldValue < criteriaValue;
    case '>=':
      return fieldValue >= criteriaValue;
    case '<=':
      return fieldValue <= criteriaValue;
    case 'LIKE': {
      const pattern = criteriaValue.replace(/%/g, '.*').replace(/_/g, '.');
      return new RegExp(pattern, 'i').test(fieldValue);
    }
    default:
      return false;
  }
}

function parseFilterCriteria(filter: string): any[] {
  // Parse complex filter criteria
  // This is a simplified version - full ADO filter parsing would be more complex
  const criteria: any[] = [];
  const parts = filter.split(/\s+(AND|OR)\s+/i);
  
  for (let i = 0; i < parts.length; i += 2) {
    criteria.push(parseFindCriteria(parts[i]));
    if (i + 1 < parts.length) {
      criteria.push({ connector: parts[i + 1].toUpperCase() });
    }
  }
  
  return criteria;
}

function evaluateFilterCriteria(row: any, criteria: any[]): boolean {
  let result = true;
  let connector = 'AND';
  
  for (const criterion of criteria) {
    if (criterion.connector) {
      connector = criterion.connector;
    } else {
      const matches = evaluateCriteria(row[criterion.field], criterion.operator, criterion.value);
      
      if (connector === 'AND') {
        result = result && matches;
      } else {
        result = result || matches;
      }
    }
  }
  
  return result;
}

async function executeStoredProcedure(connectionId: string, procName: string, parameters: any[]): Promise<any> {
  // Build stored procedure call
  const placeholders = parameters.map((_, i) => `?`).join(', ');
  const sql = `CALL ${procName}(${placeholders})`;
  
  return await dbPool.execute(connectionId, sql, parameters);
}

// Temporary recordset storage (in production, use Redis or similar)
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

// Async handler wrapper
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Simple logger
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
};

export const adoRouter = router;