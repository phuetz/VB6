/**
 * RDO (Remote Data Objects) Routes
 * Implements VB6 RDO compatibility layer for remote database access
 */

import { Router, Request, Response } from 'express';
import { DatabasePool } from '../services/DatabasePool';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

const router = Router();
const dbPool = DatabasePool.getInstance();

// RDO Environment
router.post(
  '/environment/create',
  asyncHandler(async (req: Request, res: Response) => {
    const { cursorDriver } = req.body;
    const environmentId = `rdo_env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      res.json({
        success: true,
        environmentId,
        cursorDriver: cursorDriver || 2, // rdUseOdbc
        loginTimeout: 15,
        queryTimeout: 30,
        version: '2.0',
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message,
      });
    }
  })
);

// RDO Connection
router.post(
  '/connection/open',
  asyncHandler(async (req: Request, res: Response) => {
    const { environmentId, dsn, connect, prompt, readOnly, options } = req.body;
    const connectionId = `rdo_conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Parse RDO connection string
      const config = parseRDOConnection(dsn, connect);
      await dbPool.connect(connectionId, {
        type: 'RDO',
        ...config,
        options: {
          readOnly: readOnly || false,
          cursorDriver: options?.cursorDriver || 2,
          prompt: prompt || 3, // rdDriverComplete
        },
      });

      res.json({
        success: true,
        connectionId,
        connect: connect || dsn,
        cursorDriver: options?.cursorDriver || 2,
        loginTimeout: 15,
        queryTimeout: 30,
        stillConnecting: false,
        stillExecuting: false,
        transactions: true,
        updatable: !readOnly,
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message,
      });
    }
  })
);

// RDO Resultset
router.post(
  '/resultset/open',
  asyncHandler(async (req: Request, res: Response) => {
    const { connectionId, source, type, lockType, options } = req.body;

    const resultset = await dbPool.createRDOResultset(
      connectionId,
      source,
      type || 1, // rdOpenKeyset
      lockType || 3, // rdConcurRowVer
      options || 0
    );

    res.json({
      success: true,
      resultset: {
        id: resultset.id,
        absolutePosition: resultset.position,
        bof: resultset.bof,
        bookmark: resultset.position,
        bookmarkable: true,
        editMode: 0, // rdEditNone
        eof: resultset.eof,
        lastModified: null,
        lockEdits: lockType === 2, // rdConcurLock
        name: `Resultset_${resultset.id}`,
        percentPosition: (resultset.position / Math.max(1, resultset.rowCount)) * 100,
        restartable: true,
        rowCount: resultset.rowCount,
        rowsAffected: 0,
        stillExecuting: false,
        type: type || 1,
        updatable: type !== 3, // Not rdOpenStatic
        fields: resultset.fields,
      },
    });
  })
);

// RDO Query
router.post(
  '/query/create',
  asyncHandler(async (req: Request, res: Response) => {
    const { connectionId, sql, cursorType, lockType, rowsetSize, options } = req.body;
    const queryId = `rdo_query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Store the prepared query
      queries.set(queryId, {
        id: queryId,
        connectionId,
        sql,
        cursorType: cursorType || 1,
        lockType: lockType || 3,
        rowsetSize: rowsetSize || 100,
        bindThreshold: 1024,
        dirty: false,
        keysetSize: 0,
        logMessages: false,
        maxRows: 0,
        prepared: false,
        queryTimeout: 30,
        stillExecuting: false,
        type: determineQueryType(sql),
        parameters: extractRDOParameters(sql),
      });

      res.json({
        success: true,
        queryId,
        sql,
      });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  })
);

router.post(
  '/query/:id/execute',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { parameters, options } = req.body;

    const query = queries.get(id);
    if (!query) {
      return res.status(404).json({ success: false, error: 'Query not found' });
    }

    try {
      // Prepare SQL with parameters
      let sql = query.sql;
      if (parameters && query.parameters.length > 0) {
        query.parameters.forEach((param, index) => {
          const value = parameters[index];
          sql = sql.replace('?', typeof value === 'string' ? `'${value}'` : value);
        });
      }

      const result = await dbPool.execute(query.connectionId, sql);

      if (query.type === 1) {
        // Action query
        res.json({
          success: true,
          rowsAffected: result.affectedRows || 0,
        });
      } else {
        // Create resultset
        const resultset = await dbPool.createRDOResultset(
          query.connectionId,
          sql,
          query.cursorType,
          query.lockType,
          options
        );

        res.json({
          success: true,
          resultset: {
            id: resultset.id,
            rowCount: resultset.rowCount,
          },
        });
      }
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  })
);

// Prepared statements
router.post(
  '/preparedstatement/create',
  asyncHandler(async (req: Request, res: Response) => {
    const { connectionId, sql, type } = req.body;
    const psId = `rdo_ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      preparedStatements.set(psId, {
        id: psId,
        connectionId,
        sql,
        type: type || 1, // rdTypeUnknown
        bindThreshold: 1024,
        keysetSize: 0,
        lockType: 3, // rdConcurRowVer
        logMessages: false,
        maxRows: 0,
        queryTimeout: 30,
        rowsetSize: 100,
        stillExecuting: false,
        parameters: extractRDOParameters(sql),
      });

      res.json({
        success: true,
        preparedStatementId: psId,
        sql,
      });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  })
);

// Async operations
router.post(
  '/connection/:id/execute/async',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { sql, options } = req.body;
    const asyncId = `rdo_async_${Date.now()}`;

    try {
      // Start async execution
      asyncOperations.set(asyncId, {
        id: asyncId,
        connectionId: id,
        sql,
        status: 'executing',
        startTime: Date.now(),
      });

      // Execute in background
      dbPool
        .execute(id, sql)
        .then(result => {
          const op = asyncOperations.get(asyncId);
          if (op) {
            op.status = 'complete';
            op.result = result;
            op.endTime = Date.now();
          }
        })
        .catch(error => {
          const op = asyncOperations.get(asyncId);
          if (op) {
            op.status = 'error';
            op.error = error.message;
            op.endTime = Date.now();
          }
        });

      res.json({
        success: true,
        asyncId,
        stillExecuting: true,
      });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  })
);

router.get(
  '/async/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const operation = asyncOperations.get(id);
    if (!operation) {
      return res.status(404).json({ success: false, error: 'Operation not found' });
    }

    res.json({
      success: true,
      stillExecuting: operation.status === 'executing',
      status: operation.status,
      result: operation.result,
      error: operation.error,
      duration: operation.endTime ? operation.endTime - operation.startTime : null,
    });
  })
);

// Cancel async operation
router.post(
  '/async/:id/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const operation = asyncOperations.get(id);
    if (!operation) {
      return res.status(404).json({ success: false, error: 'Operation not found' });
    }

    if (operation.status === 'executing') {
      operation.status = 'cancelled';
      operation.endTime = Date.now();
    }

    res.json({ success: true });
  })
);

// RDO Table operations
router.get(
  '/connection/:id/tables',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const tables = await dbPool.execute(
        id,
        'SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = DATABASE()'
      );

      res.json({
        success: true,
        tables: tables.rows.map((row: any) => ({
          name: row.table_name,
          type: row.table_type === 'VIEW' ? 1 : 0, // rdoTableTypeView : rdoTableTypeTable
          updatable: row.table_type !== 'VIEW',
        })),
      });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  })
);

// Batch updates
router.post(
  '/resultset/:id/batchupdate',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { batchSize, batchCollisionCount } = req.body;

    const resultset = getResultset(id);
    if (!resultset) {
      return res.status(404).json({ success: false, error: 'Resultset not found' });
    }

    try {
      // Simulate batch update
      const updateCount = Math.min(batchSize || 10, resultset.pendingUpdates || 0);

      res.json({
        success: true,
        batchCollisionCount: 0,
        batchCollisionRows: [],
        batchSize: updateCount,
        updateCount,
      });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  })
);

// Helper functions
function parseRDOConnection(dsn?: string, connect?: string): any {
  const config: any = {};

  if (dsn) {
    // DSN-based connection
    config.dsn = dsn;
  } else if (connect) {
    // Parse ODBC connection string
    const pairs = connect.split(';');
    pairs.forEach(pair => {
      const [key, value] = pair.split('=').map(s => s.trim());
      switch (key.toLowerCase()) {
        case 'driver':
          if (value.includes('SQL Server')) {
            config.engine = 'mssql';
          } else if (value.includes('MySQL')) {
            config.engine = 'mysql';
          } else if (value.includes('PostgreSQL')) {
            config.engine = 'postgresql';
          } else if (value.includes('Oracle')) {
            config.engine = 'oracle';
          }
          break;
        case 'server':
        case 'host':
          config.host = value;
          break;
        case 'database':
        case 'dbq':
          config.database = value;
          break;
        case 'uid':
        case 'user':
          config.user = value;
          break;
        case 'pwd':
        case 'password':
          config.password = value;
          break;
        case 'port':
          config.port = parseInt(value);
          break;
      }
    });
  }

  // Default to SQL Server if no engine specified
  if (!config.engine && config.host) {
    config.engine = 'mssql';
  }

  return config;
}

function determineQueryType(sql: string): number {
  const trimmedSql = sql.trim().toUpperCase();

  if (trimmedSql.startsWith('SELECT')) return 0; // Select query
  return 1; // Action query
}

function extractRDOParameters(sql: string): any[] {
  const params: any[] = [];
  const paramCount = (sql.match(/\?/g) || []).length;

  for (let i = 0; i < paramCount; i++) {
    params.push({
      name: `Param${i + 1}`,
      type: 12, // rdTypeVARCHAR
      direction: 1, // rdParamInput
      size: 255,
      value: null,
    });
  }

  return params;
}

// Temporary storage
const queries = new Map<string, any>();
const preparedStatements = new Map<string, any>();
const resultsets = new Map<string, any>();
const asyncOperations = new Map<string, any>();

function getResultset(id: string): any {
  return resultsets.get(id);
}

function storeResultset(id: string, resultset: any): void {
  resultsets.set(id, resultset);

  // Clean up after 30 minutes
  setTimeout(
    () => {
      resultsets.delete(id);
    },
    30 * 60 * 1000
  );
}

// Clean up async operations periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, op] of asyncOperations) {
    if (op.status !== 'executing' && now - op.endTime > 5 * 60 * 1000) {
      asyncOperations.delete(id);
    }
  }
}, 60 * 1000);

export const rdoRouter = router;
