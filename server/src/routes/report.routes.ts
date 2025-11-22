/**
 * Crystal Reports Routes
 * Handles report generation, export, and management
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

const router = Router();

// WEAK RANDOMNESS BUG FIX: Cryptographically secure ID generation utility
function generateSecureId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}

// Report storage
const reports = new Map<string, ReportDefinition>();
const reportSessions = new Map<string, ReportSession>();

interface ReportDefinition {
  id: string;
  fileName: string;
  reportTitle: string;
  reportSubject?: string;
  reportComments?: string;
  parameters: ReportParameter[];
  sections: ReportSection[];
  dataSource?: any;
  lastModified: Date;
  version: string;
}

interface ReportParameter {
  name: string;
  dataType: string;
  promptText: string;
  defaultValue?: any;
  valueType: 'discrete' | 'range';
  optional: boolean;
  allowMultiple: boolean;
  allowCustomValues: boolean;
}

interface ReportSection {
  name: string;
  type: 'header' | 'detail' | 'footer' | 'group';
  visible: boolean;
  height: number;
  suppressBlankSection: boolean;
  fields: any[];
}

interface ReportSession {
  id: string;
  reportId: string;
  connectionId?: string;
  parameters: Map<string, any>;
  currentPage: number;
  totalPages: number;
  data?: any[];
  generatedAt?: Date;
  exportFormat?: string;
}

// Open report
router.post('/open', asyncHandler(async (req: Request, res: Response) => {
  const { fileName, reportKind } = req.body;
  
  // DATA VALIDATION BUG FIX: Validate fileName to prevent path traversal
  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'fileName is required and must be a string'
    });
  }
  
  if (fileName.length > 255) {
    return res.status(400).json({
      success: false,
      error: 'fileName too long (max 255 characters)'
    });
  }
  
  // Prevent path traversal attacks
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid fileName: path traversal not allowed'
    });
  }
  
  // Only allow .rpt files
  if (!fileName.toLowerCase().endsWith('.rpt')) {
    return res.status(400).json({
      success: false,
      error: 'Only .rpt files are allowed'
    });
  }
  
  // Validate reportKind if provided
  if (reportKind && typeof reportKind !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'reportKind must be a string'
    });
  }
  
  // WEAK RANDOMNESS BUG FIX: Use cryptographically secure ID generation
  const reportId = generateSecureId('rpt');
  
  try {
    // In a real implementation, this would load the .rpt file
    // For now, we'll create a mock report definition
    const report: ReportDefinition = {
      id: reportId,
      fileName,
      reportTitle: path.basename(fileName, '.rpt'),
      parameters: [],
      sections: [
        {
          name: 'ReportHeader',
          type: 'header',
          visible: true,
          height: 1000,
          suppressBlankSection: false,
          fields: [],
        },
        {
          name: 'PageHeader',
          type: 'header',
          visible: true,
          height: 500,
          suppressBlankSection: false,
          fields: [],
        },
        {
          name: 'Details',
          type: 'detail',
          visible: true,
          height: 300,
          suppressBlankSection: true,
          fields: [],
        },
        {
          name: 'PageFooter',
          type: 'footer',
          visible: true,
          height: 500,
          suppressBlankSection: false,
          fields: [],
        },
        {
          name: 'ReportFooter',
          type: 'footer',
          visible: true,
          height: 1000,
          suppressBlankSection: false,
          fields: [],
        },
      ],
      lastModified: new Date(),
      version: '14.0',
    };
    
    reports.set(reportId, report);
    
    res.json({
      success: true,
      reportId,
      reportTitle: report.reportTitle,
      hasParameters: report.parameters.length > 0,
      parameterFields: report.parameters,
      sections: report.sections.map(s => ({
        name: s.name,
        type: s.type,
        visible: s.visible,
      })),
    });
  } catch (error) {
    // INTEGRATION BUG FIX: Consistent error handling across API boundaries
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.json({ success: false, error: errorMessage });
  }
}));

// Set data source
router.post('/:id/datasource', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { connectionId, dataSource, tables } = req.body;
  
  const report = reports.get(id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  
  try {
    report.dataSource = {
      connectionId,
      dataSource,
      tables: tables || [],
      lastRefresh: new Date(),
    };
    
    res.json({ success: true });
  } catch (error) {
    // INTEGRATION BUG FIX: Consistent error handling across API boundaries
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.json({ success: false, error: errorMessage });
  }
}));

// Set parameters
router.post('/:id/parameters', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { parameters } = req.body;
  // WEAK RANDOMNESS BUG FIX: Use cryptographically secure session ID generation
  const sessionId = generateSecureId('session');
  
  const report = reports.get(id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  
  try {
    const session: ReportSession = {
      id: sessionId,
      reportId: id,
      connectionId: report.dataSource?.connectionId,
      parameters: new Map(Object.entries(parameters || {})),
      currentPage: 1,
      totalPages: 0,
    };
    
    reportSessions.set(sessionId, session);
    
    res.json({
      success: true,
      sessionId,
    });
  } catch (error) {
    // INTEGRATION BUG FIX: Consistent error handling across API boundaries
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.json({ success: false, error: errorMessage });
  }
}));

// Generate report
router.post('/:id/generate', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sessionId, preview } = req.body;
  
  const report = reports.get(id);
  const session = sessionId ? reportSessions.get(sessionId) : null;
  
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  
  try {
    // Simulate report generation
    // In a real implementation, this would:
    // 1. Connect to data source
    // 2. Execute queries with parameters
    // 3. Process data through report engine
    // 4. Generate formatted output
    
    const pageCount = preview ? 1 : Math.floor(Math.random() * 10) + 1;
    
    if (session) {
      session.totalPages = pageCount;
      session.generatedAt = new Date();
    }
    
    res.json({
      success: true,
      sessionId: session?.id,
      pageCount,
      recordCount: Math.floor(Math.random() * 1000),
      generatedAt: new Date(),
    });
  } catch (error) {
    // INTEGRATION BUG FIX: Consistent error handling across API boundaries
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.json({ success: false, error: errorMessage });
  }
}));

// Get page
router.get('/session/:sessionId/page/:pageNumber', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, pageNumber } = req.params;
  
  const session = reportSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  
  const report = reports.get(session.reportId);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  
  try {
    // Simulate page rendering
    // In a real implementation, this would return rendered page data
    // INTEGER OVERFLOW FIX: Validate parseInt result and range\n    const page = parseInt(pageNumber, 10);\n    if (isNaN(page) || page < 1 || page > 10000) { // Reasonable page limit\n      return res.status(400).json({ error: 'Invalid page number. Must be between 1 and 10000.' });\n    }
    
    res.json({
      success: true,
      pageNumber: page,
      totalPages: session.totalPages,
      content: {
        // This would contain the actual rendered page content
        html: `<div>Page ${page} of ${session.totalPages}</div>`,
        width: 8.5 * 96, // 8.5 inches at 96 DPI
        height: 11 * 96,  // 11 inches at 96 DPI
      },
    });
  } catch (error) {
    // INTEGRATION BUG FIX: Consistent error handling across API boundaries
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.json({ success: false, error: errorMessage });
  }
}));

// Export report
router.post('/session/:sessionId/export', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { format, options } = req.body;
  
  const session = reportSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  
  const report = reports.get(session.reportId);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  
  try {
    // Simulate export
    // WEAK RANDOMNESS BUG FIX: Use cryptographically secure export ID generation
    const exportId = generateSecureId('export');
    const fileName = `${report.reportTitle}_${exportId}.${getFileExtension(format)}`;
    
    // In a real implementation, this would generate the actual export file
    const exportInfo = {
      exportId,
      fileName,
      format,
      mimeType: getMimeType(format),
      size: Math.floor(Math.random() * 1000000), // Simulated file size
      createdAt: new Date(),
    };
    
    res.json({
      success: true,
      ...exportInfo,
    });
  } catch (error) {
    // INTEGRATION BUG FIX: Consistent error handling across API boundaries
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.json({ success: false, error: errorMessage });
  }
}));

// Print report
router.post('/session/:sessionId/print', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { printerName, copies, collate, fromPage, toPage } = req.body;
  
  const session = reportSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  
  try {
    // Simulate printing
    // WEAK RANDOMNESS BUG FIX: Use cryptographically secure print job ID generation
    const printJobId = generateSecureId('print');
    
    res.json({
      success: true,
      printJobId,
      status: 'queued',
      printer: printerName || 'Default Printer',
      copies: copies || 1,
      pages: toPage ? `${fromPage || 1}-${toPage}` : 'All',
    });
  } catch (error) {
    // INTEGRATION BUG FIX: Consistent error handling across API boundaries
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.json({ success: false, error: errorMessage });
  }
}));

// Get report info
router.get('/:id/info', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const report = reports.get(id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  
  res.json({
    success: true,
    reportTitle: report.reportTitle,
    reportSubject: report.reportSubject,
    reportComments: report.reportComments,
    fileName: report.fileName,
    lastModified: report.lastModified,
    version: report.version,
    parameters: report.parameters,
    sections: report.sections.length,
    hasDataSource: !!report.dataSource,
  });
}));

// Close report
router.post('/:id/close', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const report = reports.get(id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  
  // Clean up sessions
  for (const [sessionId, session] of reportSessions) {
    if (session.reportId === id) {
      reportSessions.delete(sessionId);
    }
  }
  
  reports.delete(id);
  
  res.json({ success: true });
}));

// Formula operations
router.post('/:id/formula', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, text, syntax } = req.body;
  
  const report = reports.get(id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  
  try {
    // In a real implementation, this would compile and validate the formula
    res.json({
      success: true,
      formulaName: name,
      isValid: true,
      syntax: syntax || 'Crystal',
    });
  } catch (error) {
    // INTEGRATION BUG FIX: Consistent error handling across API boundaries
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.json({ success: false, error: errorMessage });
  }
}));

// SQL operations
router.get('/:id/sql', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const report = reports.get(id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  
  try {
    // In a real implementation, this would return the generated SQL
    res.json({
      success: true,
      sql: 'SELECT * FROM Customers WHERE Country = ?',
      parameters: Array.from(report.parameters || []).map(p => p.name),
    });
  } catch (error) {
    // INTEGRATION BUG FIX: Consistent error handling across API boundaries
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.json({ success: false, error: errorMessage });
  }
}));

// Helper functions
function getFileExtension(format: number): string {
  const formats = {
    0: 'rpt',   // crEFTNoFormat
    1: 'rpt',   // crEFTCrystalReport
    2: 'txt',   // crEFTText
    14: 'doc',  // crEFTWordForWindows
    27: 'pdf',  // crEFTPortableDocFormat
    29: 'html', // crEFTHTML40
    30: 'xls',  // crEFTExcel97
    31: 'xml',  // crEFTXML
  };
  return formats[format] || 'dat';
}

function getMimeType(format: number): string {
  const mimeTypes = {
    0: 'application/octet-stream',
    1: 'application/x-crystal-report',
    2: 'text/plain',
    14: 'application/msword',
    27: 'application/pdf',
    29: 'text/html',
    30: 'application/vnd.ms-excel',
    31: 'application/xml',
  };
  return mimeTypes[format] || 'application/octet-stream';
}

// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of reportSessions) {
    if (session.generatedAt && now - session.generatedAt.getTime() > 30 * 60 * 1000) {
      reportSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

export const reportRouter = router;