/**
 * Database Routes
 * General database connection and query endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { DatabasePool, ConnectionConfig } from '../services/DatabasePool';
import { validateConnection, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

const router = Router();
const dbPool = DatabasePool.getInstance();

// Connect to database
router.post('/connect', validateConnection, asyncHandler(async (req: Request, res: Response) => {
  const config: ConnectionConfig = req.body;
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await dbPool.connect(connectionId, config);
  
  res.json({
    success: true,
    connectionId,
    message: 'Database connected successfully',
  });
}));

// Execute query
router.post('/query', validateQuery, asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, query, parameters } = req.body;
  
  const result = await dbPool.execute(connectionId, query, parameters);
  
  res.json({
    success: true,
    result: {
      rows: result.rows,
      rowCount: result.rowCount,
      affectedRows: result.affectedRows,
      fields: result.fields,
    },
  });
}));

// Get connection status
router.get('/status/:connectionId', asyncHandler(async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const stats = dbPool.getConnectionStats();
  
  if (!stats[connectionId]) {
    return res.status(404).json({
      success: false,
      error: 'Connection not found',
    });
  }
  
  res.json({
    success: true,
    connection: stats[connectionId],
  });
}));

// Disconnect
router.delete('/disconnect/:connectionId', asyncHandler(async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  
  await dbPool.disconnect(connectionId);
  
  res.json({
    success: true,
    message: 'Database disconnected successfully',
  });
}));

// Get all connections
router.get('/connections', asyncHandler(async (req: Request, res: Response) => {
  const stats = dbPool.getConnectionStats();
  
  res.json({
    success: true,
    connections: stats,
  });
}));

// Begin transaction
router.post('/transaction/begin', asyncHandler(async (req: Request, res: Response) => {
  const { connectionId } = req.body;
  
  const transaction = await dbPool.beginTransaction(connectionId);
  const transactionId = `txn_${Date.now()}`;
  
  // Store transaction reference (in production, use a proper session store)
  req.app.locals.transactions = req.app.locals.transactions || {};
  req.app.locals.transactions[transactionId] = transaction;
  
  res.json({
    success: true,
    transactionId,
  });
}));

// Commit transaction
router.post('/transaction/commit', asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.body;
  const transaction = req.app.locals.transactions?.[transactionId];
  
  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found',
    });
  }
  
  await transaction.commit();
  delete req.app.locals.transactions[transactionId];
  
  res.json({
    success: true,
    message: 'Transaction committed successfully',
  });
}));

// Rollback transaction
router.post('/transaction/rollback', asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.body;
  const transaction = req.app.locals.transactions?.[transactionId];
  
  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found',
    });
  }
  
  await transaction.rollback();
  delete req.app.locals.transactions[transactionId];
  
  res.json({
    success: true,
    message: 'Transaction rolled back successfully',
  });
}));

// Get database metadata
router.get('/metadata/:connectionId/:table?', asyncHandler(async (req: Request, res: Response) => {
  const { connectionId, table } = req.params;
  
  let query: string;
  if (table) {
    // Get columns for specific table
    query = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `;
    const result = await dbPool.execute(connectionId, query, [table]);
    res.json({
      success: true,
      columns: result.rows,
    });
  } else {
    // Get all tables
    query = `
      SELECT TABLE_NAME, TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA NOT IN ('information_schema', 'pg_catalog', 'sys')
      ORDER BY TABLE_NAME
    `;
    const result = await dbPool.execute(connectionId, query);
    res.json({
      success: true,
      tables: result.rows,
    });
  }
}));

// Test connection
router.post('/test', validateConnection, asyncHandler(async (req: Request, res: Response) => {
  const config: ConnectionConfig = req.body;
  const testId = `test_${Date.now()}`;
  
  try {
    await dbPool.connect(testId, config);
    await dbPool.execute(testId, 'SELECT 1');
    await dbPool.disconnect(testId);
    
    res.json({
      success: true,
      message: 'Connection test successful',
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
}));

export const databaseRouter = router;