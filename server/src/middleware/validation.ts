/**
 * Validation Middleware
 * Input validation for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './errorHandler';

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
    }));

    throw new AppError(`Validation failed: ${errorMessages.map(e => e.message).join(', ')}`, 400);
  }

  next();
};

// Connection validation
export const validateConnection = [
  body('engine')
    .isIn(['mssql', 'mysql', 'postgresql', 'sqlite', 'oracle', 'access'])
    .withMessage('Invalid database engine'),
  body('host').optional().isString().notEmpty().withMessage('Host must be a non-empty string'),
  body('port')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('Port must be between 1 and 65535'),
  body('database').isString().notEmpty().withMessage('Database name is required'),
  body('user').optional().isString().withMessage('User must be a string'),
  body('password').optional().isString().withMessage('Password must be a string'),
  handleValidationErrors,
];

// Query validation
export const validateQuery = [
  body('connectionId').isString().notEmpty().withMessage('Connection ID is required'),
  body('query').isString().notEmpty().withMessage('Query is required'),
  body('parameters').optional().isArray().withMessage('Parameters must be an array'),
  handleValidationErrors,
];

// ADO connection string validation
export const validateADOConnection = [
  body('connectionString')
    .isString()
    .notEmpty()
    .withMessage('Connection string is required')
    .matches(/Provider=.+/i)
    .withMessage('Connection string must contain a Provider'),
  body('mode').optional().isInt({ min: 0, max: 16 }).withMessage('Invalid connection mode'),
  body('cursorLocation').optional().isIn([1, 2, 3]).withMessage('Invalid cursor location'),
  handleValidationErrors,
];

// DAO database validation
export const validateDAODatabase = [
  body('workspaceId').optional().isString().withMessage('Workspace ID must be a string'),
  body('dbPath').isString().notEmpty().withMessage('Database path is required'),
  body('exclusive').optional().isBoolean().withMessage('Exclusive must be a boolean'),
  body('readOnly').optional().isBoolean().withMessage('ReadOnly must be a boolean'),
  handleValidationErrors,
];

// RDO connection validation
export const validateRDOConnection = [
  body('environmentId').optional().isString().withMessage('Environment ID must be a string'),
  body('dsn').optional().isString().withMessage('DSN must be a string'),
  body('connect').optional().isString().withMessage('Connect string must be a string'),
  body('prompt').optional().isIn([1, 2, 3, 4]).withMessage('Invalid prompt value'),
  body('readOnly').optional().isBoolean().withMessage('ReadOnly must be a boolean'),
  handleValidationErrors,
];

// Report validation
export const validateReportOpen = [
  body('fileName')
    .isString()
    .notEmpty()
    .withMessage('Report file name is required')
    .matches(/\.rpt$/i)
    .withMessage('File must have .rpt extension'),
  body('reportKind').optional().isIn([0, 1]).withMessage('Invalid report kind'),
  handleValidationErrors,
];

// Export format validation
export const validateExportFormat = [
  body('format').isInt({ min: 0, max: 31 }).withMessage('Invalid export format'),
  body('options').optional().isObject().withMessage('Options must be an object'),
  handleValidationErrors,
];

// Batch operation validation
export const validateBatchOperation = [
  body('connectionId').isString().notEmpty().withMessage('Connection ID is required'),
  body('operations').isArray({ min: 1 }).withMessage('Operations must be a non-empty array'),
  body('operations.*.query').isString().notEmpty().withMessage('Each operation must have a query'),
  body('operations.*.parameters')
    .optional()
    .isArray()
    .withMessage('Operation parameters must be an array'),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('sort')
    .optional()
    .isString()
    .matches(/^[a-zA-Z0-9_]+:(asc|desc)$/)
    .withMessage('Sort must be in format field:direction'),
  handleValidationErrors,
];

// ID parameter validation
export const validateIdParam = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('ID parameter is required')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('ID contains invalid characters'),
  handleValidationErrors,
];

// Sanitize SQL queries (basic protection)
export const sanitizeSQL = (sql: string): string => {
  // Remove comments
  sql = sql.replace(/--.*$/gm, '');
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');

  // Check for multiple statements (basic check)
  if (sql.split(';').filter(s => s.trim()).length > 1) {
    throw new AppError('Multiple SQL statements not allowed', 400);
  }

  return sql.trim();
};

// Custom validators
export const isValidConnectionString = (value: string): boolean => {
  // Basic validation for connection strings
  const requiredKeys = ['provider', 'data source'];
  const lowerValue = value.toLowerCase();

  return requiredKeys.every(key => lowerValue.includes(key));
};

export const isValidSQL = (value: string): boolean => {
  // Basic SQL validation
  const dangerousPatterns = [
    /;\s*(drop|create|alter|truncate)\s+/i,
    /;\s*delete\s+from\s+/i,
    /;\s*insert\s+into\s+/i,
    /;\s*update\s+.+\s+set\s+/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(value));
};
