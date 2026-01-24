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

// SECURITY FIX: Transaction storage with timeout cleanup
const TRANSACTION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_TRANSACTIONS_PER_USER = 10;

interface TransactionEntry {
  transaction: unknown;
  createdAt: number;
  connectionId: string;
}

// Cleanup stale transactions periodically
const cleanupStaleTransactions = (transactions: Record<string, TransactionEntry>) => {
  const now = Date.now();
  for (const [txnId, entry] of Object.entries(transactions)) {
    if (now - entry.createdAt > TRANSACTION_TIMEOUT_MS) {
      logger.warn(`Cleaning up stale transaction: ${txnId}`);
      try {
        (entry.transaction as { rollback: () => Promise<void> }).rollback?.();
      } catch (e) {
        logger.error(`Failed to rollback stale transaction ${txnId}:`, e);
      }
      delete transactions[txnId];
    }
  }
};

// Begin transaction
router.post('/transaction/begin', asyncHandler(async (req: Request, res: Response) => {
  const { connectionId } = req.body;

  const transaction = await dbPool.beginTransaction(connectionId);
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Initialize transactions store with proper typing
  if (!req.app.locals.transactions) {
    req.app.locals.transactions = {} as Record<string, TransactionEntry>;
    // Set up periodic cleanup (every 60 seconds)
    setInterval(() => cleanupStaleTransactions(req.app.locals.transactions), 60000);
  }

  // Cleanup stale transactions before adding new one
  cleanupStaleTransactions(req.app.locals.transactions);

  // Limit number of active transactions
  const activeCount = Object.keys(req.app.locals.transactions).length;
  if (activeCount >= MAX_TRANSACTIONS_PER_USER * 10) { // Global limit
    return res.status(429).json({
      success: false,
      error: 'Too many active transactions. Please commit or rollback existing ones.',
    });
  }

  req.app.locals.transactions[transactionId] = {
    transaction,
    createdAt: Date.now(),
    connectionId,
  };

  res.json({
    success: true,
    transactionId,
  });
}));

// Commit transaction
router.post('/transaction/commit', asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.body;
  const entry = req.app.locals.transactions?.[transactionId] as TransactionEntry | undefined;

  if (!entry) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found or expired',
    });
  }

  await (entry.transaction as { commit: () => Promise<void> }).commit();
  delete req.app.locals.transactions[transactionId];

  res.json({
    success: true,
    message: 'Transaction committed successfully',
  });
}));

// Rollback transaction
router.post('/transaction/rollback', asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.body;
  const entry = req.app.locals.transactions?.[transactionId] as TransactionEntry | undefined;

  if (!entry) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found or expired',
    });
  }

  await (entry.transaction as { rollback: () => Promise<void> }).rollback();
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