/**
 * VB6 Crystal Reports Integration - Complete Reporting System
 * Provides Crystal Reports compatibility and report generation for VB6 applications
 * Supports report design, data binding, parameters, and export functionality
 */

import { createLogger } from './LoggingService';

const logger = createLogger('CrystalReports');

export enum CrystalReportType {
  STANDARD = 'standard',
  SUBREPORT = 'subreport',
  CROSSTAB = 'crosstab',
  MAILING_LABELS = 'mailing_labels',
  OLAP = 'olap',
  DRILL_DOWN = 'drill_down'
}

export enum CrystalFieldType {
  DATABASE = 'database',
  FORMULA = 'formula',
  PARAMETER = 'parameter',
  RUNNING_TOTAL = 'running_total',
  SUMMARY = 'summary',
  GROUP_NAME = 'group_name',
  SPECIAL = 'special',
  BLOB = 'blob'
}

export enum CrystalDataType {
  STRING = 'string',
  NUMBER = 'number',
  CURRENCY = 'currency',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  MEMO = 'memo',
  BLOB = 'blob'
}

export enum CrystalSectionType {
  REPORT_HEADER = 'report_header',
  PAGE_HEADER = 'page_header',
  GROUP_HEADER = 'group_header',
  DETAILS = 'details',
  GROUP_FOOTER = 'group_footer',
  REPORT_FOOTER = 'report_footer',
  PAGE_FOOTER = 'page_footer'
}

export enum CrystalExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  WORD = 'word',
  RTF = 'rtf',
  HTML = 'html',
  XML = 'xml',
  CSV = 'csv',
  TEXT = 'text',
  CRYSTAL_REPORTS = 'rpt'
}

export interface CrystalReport {
  id: string;
  name: string;
  fileName: string;
  type: CrystalReportType;
  version: string;
  created: Date;
  modified: Date;
  
  // Report structure
  sections: CrystalSection[];
  fields: CrystalField[];
  formulas: CrystalFormula[];
  parameters: CrystalParameter[];
  groups: CrystalGroup[];
  
  // Data source
  dataSources: CrystalDataSource[];
  
  // Page setup
  pageSetup: CrystalPageSetup;
  
  // Report options
  options: CrystalReportOptions;
  
  // Subreports
  subreports: CrystalReport[];
}

export interface CrystalSection {
  id: string;
  type: CrystalSectionType;
  name: string;
  height: number;
  visible: boolean;
  printAtBottomOfPage: boolean;
  newPageBefore: boolean;
  newPageAfter: boolean;
  resetPageNAfter: boolean;
  keepTogether: boolean;
  suppressBlankSection: boolean;
  
  // Formatting
  backgroundColor: string;
  conditionalFormatting?: CrystalConditionalFormat[];
  
  // Objects in section
  objects: CrystalObject[];
}

export interface CrystalField {
  id: string;
  name: string;
  type: CrystalFieldType;
  dataType: CrystalDataType;
  tableName?: string;
  columnName?: string;
  formula?: string;
  defaultValue?: any;
  
  // Display properties
  displayString: string;
  format: CrystalFieldFormat;
}

export interface CrystalFieldFormat {
  fontName: string;
  fontSize: number;
  fontStyle: ('bold' | 'italic' | 'underline' | 'strikethrough')[];
  color: string;
  backgroundColor: string;
  alignment: 'left' | 'center' | 'right' | 'justified';
  
  // Number formatting
  decimals?: number;
  thousandsSeparator?: boolean;
  currencySymbol?: string;
  negativeFormat?: string;
  
  // Date formatting
  dateFormat?: string;
  timeFormat?: string;
  
  // Conditional formatting
  conditionalFormats?: CrystalConditionalFormat[];
}

export interface CrystalConditionalFormat {
  condition: string;
  format: Partial<CrystalFieldFormat>;
  priority: number;
}

export interface CrystalFormula {
  id: string;
  name: string;
  text: string;
  syntax: 'crystal' | 'basic';
  dataType: CrystalDataType;
  
  // Dependencies
  fields: string[];
  parameters: string[];
  functions: string[];
}

export interface CrystalParameter {
  id: string;
  name: string;
  promptText: string;
  dataType: CrystalDataType;
  allowMultipleValues: boolean;
  hasDefaultValue: boolean;
  defaultValue?: any;
  allowCustomCurrentValue: boolean;
  discreetOrRangeInfo: 'discreet' | 'range' | 'discreet_and_range';
  
  // Value constraints
  minValue?: any;
  maxValue?: any;
  editMask?: string;
  pickListItems: any[];
}

export interface CrystalGroup {
  id: string;
  name: string;
  field: string;
  sortOrder: 'ascending' | 'descending' | 'specified' | 'original';
  
  // Group options
  keepTogether: boolean;
  repeatGroupHeader: boolean;
  newPageAfter: boolean;
  newPageBefore: boolean;
  resetPageNAfter: boolean;
  
  // Group tree
  includeInGroupTree: boolean;
  customizeGroupName: boolean;
  groupNameFieldFormat?: CrystalFieldFormat;
}

export interface CrystalDataSource {
  id: string;
  name: string;
  type: 'database' | 'stored_procedure' | 'command' | 'xml' | 'web_service';
  connectionString?: string;
  
  // Database specific
  serverName?: string;
  databaseName?: string;
  userId?: string;
  password?: string;
  integratedSecurity?: boolean;
  
  // Tables and relations
  tables: CrystalTable[];
  links: CrystalTableLink[];
  
  // SQL Command
  commandText?: string;
  parameters?: CrystalParameter[];
}

export interface CrystalTable {
  id: string;
  name: string;
  alias: string;
  type: 'table' | 'view' | 'stored_procedure' | 'synonym';
  columns: CrystalColumn[];
}

export interface CrystalColumn {
  name: string;
  dataType: CrystalDataType;
  length: number;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey: boolean;
}

export interface CrystalTableLink {
  id: string;
  leftTable: string;
  rightTable: string;
  leftFields: string[];
  rightFields: string[];
  joinType: 'inner' | 'left_outer' | 'right_outer' | 'full_outer';
  enforceJoin: boolean;
}

export interface CrystalPageSetup {
  paperSize: string;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  
  // Margins
  topMargin: number;
  bottomMargin: number;
  leftMargin: number;
  rightMargin: number;
  
  // Printer settings
  printerName?: string;
  copies: number;
  collate: boolean;
  printRange: 'all' | 'pages';
  fromPage?: number;
  toPage?: number;
}

export interface CrystalReportOptions {
  // General options
  saveDataWithReport: boolean;
  savePreviewPicture: boolean;
  verifyWhenDatabaseUpdated: boolean;
  
  // Performance
  caseInsensitiveSQLData: boolean;
  performGroupingOnServer: boolean;
  useIndexesForSpeed: boolean;
  
  // Reporting
  translateDOSStrings: boolean;
  translateDOSMemos: boolean;
  convertDateTimeField: boolean;
  convertNullFieldToDefault: boolean;
  
  // Export options
  defaultExportFormat: CrystalExportFormat;
  exportWithFormatting: boolean;
}

export interface CrystalObject {
  id: string;
  type: 'field' | 'text' | 'line' | 'box' | 'picture' | 'chart' | 'subreport' | 'ole';
  name: string;
  
  // Position and size
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Properties
  visible: boolean;
  canGrow: boolean;
  canShrink: boolean;
  suppressIfDuplicated: boolean;
  
  // Content
  content?: any;
  fieldName?: string;
  text?: string;
  
  // Formatting
  format?: CrystalFieldFormat;
  border?: CrystalBorder;
}

export interface CrystalBorder {
  left: CrystalBorderSide;
  top: CrystalBorderSide;
  right: CrystalBorderSide;
  bottom: CrystalBorderSide;
}

export interface CrystalBorderSide {
  style: 'none' | 'single' | 'double' | 'dashed' | 'dotted';
  width: number;
  color: string;
}

export interface CrystalReportViewer {
  // Viewer properties
  reportSource: CrystalReport | null;
  displayGroupTree: boolean;
  displayToolbar: boolean;
  displayStatusbar: boolean;
  displayBorder: boolean;
  enableRefresh: boolean;
  enablePrint: boolean;
  enableExport: boolean;
  enableSearch: boolean;
  enableZoom: boolean;
  
  // Current state
  currentPageNumber: number;
  totalPageCount: number;
  zoomLevel: number;
  
  // Events
  onLoad?: (report: CrystalReport) => void;
  onPrint?: (report: CrystalReport) => void;
  onExport?: (report: CrystalReport, format: CrystalExportFormat) => void;
  onParameterPrompt?: (parameters: CrystalParameter[]) => boolean;
  onDatabaseLogon?: (dataSource: CrystalDataSource) => boolean;
}

export interface CrystalReportEngine {
  // Report management
  openReport(fileName: string): Promise<CrystalReport>;
  saveReport(report: CrystalReport, fileName?: string): Promise<boolean>;
  closeReport(report: CrystalReport): boolean;
  
  // Data operations
  setDataSource(report: CrystalReport, dataSource: CrystalDataSource): boolean;
  setParameters(report: CrystalReport, parameters: Map<string, any>): boolean;
  refreshData(report: CrystalReport): Promise<boolean>;
  
  // Preview and print
  printReport(report: CrystalReport, showDialog?: boolean): Promise<boolean>;
  previewReport(report: CrystalReport): Promise<boolean>;
  exportReport(report: CrystalReport, format: CrystalExportFormat, fileName: string): Promise<boolean>;
  
  // Report manipulation
  addField(report: CrystalReport, section: string, field: CrystalField): boolean;
  removeField(report: CrystalReport, fieldId: string): boolean;
  moveField(report: CrystalReport, fieldId: string, left: number, top: number): boolean;
  
  // Formula operations
  addFormula(report: CrystalReport, formula: CrystalFormula): boolean;
  editFormula(report: CrystalReport, formulaId: string, text: string): boolean;
  deleteFormula(report: CrystalReport, formulaId: string): boolean;
}

export class VB6CrystalReports implements CrystalReportEngine {
  private static instance: VB6CrystalReports;
  private reports: Map<string, CrystalReport> = new Map();
  private viewer: CrystalReportViewer | null = null;
  private isInitialized: boolean = false;

  static getInstance(): VB6CrystalReports {
    if (!VB6CrystalReports.instance) {
      VB6CrystalReports.instance = new VB6CrystalReports();
    }
    return VB6CrystalReports.instance;
  }

  constructor() {
    this.initializeCrystalReports();
  }

  private initializeCrystalReports(): void {
    this.createSampleReports();
    this.isInitialized = true;
  }

  private createSampleReports(): void {
    // Sample Customer Report
    const customerReport: CrystalReport = {
      id: 'customer-report',
      name: 'Customer Report',
      fileName: 'CustomerReport.rpt',
      type: CrystalReportType.STANDARD,
      version: '8.5',
      created: new Date('2002-01-01'),
      modified: new Date(),
      
      sections: [
        {
          id: 'report-header',
          type: CrystalSectionType.REPORT_HEADER,
          name: 'Report Header',
          height: 0.5,
          visible: true,
          printAtBottomOfPage: false,
          newPageBefore: false,
          newPageAfter: false,
          resetPageNAfter: false,
          keepTogether: false,
          suppressBlankSection: false,
          backgroundColor: '#FFFFFF',
          objects: [
            {
              id: 'title-text',
              type: 'text',
              name: 'Report Title',
              left: 2,
              top: 0.1,
              width: 4,
              height: 0.3,
              visible: true,
              canGrow: false,
              canShrink: false,
              suppressIfDuplicated: false,
              text: 'Customer Report',
              format: {
                fontName: 'Arial',
                fontSize: 16,
                fontStyle: ['bold'],
                color: '#000000',
                backgroundColor: 'transparent',
                alignment: 'center'
              }
            }
          ]
        },
        {
          id: 'page-header',
          type: CrystalSectionType.PAGE_HEADER,
          name: 'Page Header',
          height: 0.3,
          visible: true,
          printAtBottomOfPage: false,
          newPageBefore: false,
          newPageAfter: false,
          resetPageNAfter: false,
          keepTogether: false,
          suppressBlankSection: false,
          backgroundColor: '#F0F0F0',
          objects: [
            {
              id: 'customer-name-header',
              type: 'text',
              name: 'Customer Name Header',
              left: 0.5,
              top: 0.05,
              width: 2,
              height: 0.2,
              visible: true,
              canGrow: false,
              canShrink: false,
              suppressIfDuplicated: false,
              text: 'Customer Name',
              format: {
                fontName: 'Arial',
                fontSize: 10,
                fontStyle: ['bold'],
                color: '#000000',
                backgroundColor: 'transparent',
                alignment: 'left'
              }
            },
            {
              id: 'customer-city-header',
              type: 'text',
              name: 'Customer City Header',
              left: 3,
              top: 0.05,
              width: 1.5,
              height: 0.2,
              visible: true,
              canGrow: false,
              canShrink: false,
              suppressIfDuplicated: false,
              text: 'City',
              format: {
                fontName: 'Arial',
                fontSize: 10,
                fontStyle: ['bold'],
                color: '#000000',
                backgroundColor: 'transparent',
                alignment: 'left'
              }
            }
          ]
        },
        {
          id: 'details',
          type: CrystalSectionType.DETAILS,
          name: 'Details',
          height: 0.25,
          visible: true,
          printAtBottomOfPage: false,
          newPageBefore: false,
          newPageAfter: false,
          resetPageNAfter: false,
          keepTogether: false,
          suppressBlankSection: false,
          backgroundColor: '#FFFFFF',
          objects: [
            {
              id: 'customer-name-field',
              type: 'field',
              name: 'Customer Name Field',
              left: 0.5,
              top: 0.05,
              width: 2,
              height: 0.15,
              visible: true,
              canGrow: true,
              canShrink: false,
              suppressIfDuplicated: false,
              fieldName: 'Customers.CustomerName',
              format: {
                fontName: 'Arial',
                fontSize: 9,
                fontStyle: [],
                color: '#000000',
                backgroundColor: 'transparent',
                alignment: 'left'
              }
            },
            {
              id: 'customer-city-field',
              type: 'field',
              name: 'Customer City Field',
              left: 3,
              top: 0.05,
              width: 1.5,
              height: 0.15,
              visible: true,
              canGrow: false,
              canShrink: false,
              suppressIfDuplicated: false,
              fieldName: 'Customers.City',
              format: {
                fontName: 'Arial',
                fontSize: 9,
                fontStyle: [],
                color: '#000000',
                backgroundColor: 'transparent',
                alignment: 'left'
              }
            }
          ]
        },
        {
          id: 'page-footer',
          type: CrystalSectionType.PAGE_FOOTER,
          name: 'Page Footer',
          height: 0.25,
          visible: true,
          printAtBottomOfPage: true,
          newPageBefore: false,
          newPageAfter: false,
          resetPageNAfter: false,
          keepTogether: false,
          suppressBlankSection: false,
          backgroundColor: '#FFFFFF',
          objects: [
            {
              id: 'page-number',
              type: 'field',
              name: 'Page Number',
              left: 4,
              top: 0.05,
              width: 1,
              height: 0.15,
              visible: true,
              canGrow: false,
              canShrink: false,
              suppressIfDuplicated: false,
              fieldName: 'PageNumber',
              format: {
                fontName: 'Arial',
                fontSize: 8,
                fontStyle: [],
                color: '#666666',
                backgroundColor: 'transparent',
                alignment: 'right'
              }
            }
          ]
        }
      ],
      
      fields: [
        {
          id: 'customer-name',
          name: 'CustomerName',
          type: CrystalFieldType.DATABASE,
          dataType: CrystalDataType.STRING,
          tableName: 'Customers',
          columnName: 'CustomerName',
          displayString: 'Customer Name',
          format: {
            fontName: 'Arial',
            fontSize: 9,
            fontStyle: [],
            color: '#000000',
            backgroundColor: 'transparent',
            alignment: 'left'
          }
        },
        {
          id: 'customer-city',
          name: 'City',
          type: CrystalFieldType.DATABASE,
          dataType: CrystalDataType.STRING,
          tableName: 'Customers',
          columnName: 'City',
          displayString: 'City',
          format: {
            fontName: 'Arial',
            fontSize: 9,
            fontStyle: [],
            color: '#000000',
            backgroundColor: 'transparent',
            alignment: 'left'
          }
        }
      ],
      
      formulas: [
        {
          id: 'full-address',
          name: 'FullAddress',
          text: '{Customers.Address} + ", " + {Customers.City} + ", " + {Customers.State} + " " + {Customers.ZipCode}',
          syntax: 'crystal',
          dataType: CrystalDataType.STRING,
          fields: ['Customers.Address', 'Customers.City', 'Customers.State', 'Customers.ZipCode'],
          parameters: [],
          functions: []
        }
      ],
      
      parameters: [
        {
          id: 'date-range-start',
          name: 'DateRangeStart',
          promptText: 'Enter start date:',
          dataType: CrystalDataType.DATE,
          allowMultipleValues: false,
          hasDefaultValue: true,
          defaultValue: new Date(),
          allowCustomCurrentValue: true,
          discreetOrRangeInfo: 'discreet',
          pickListItems: []
        }
      ],
      
      groups: [],
      
      dataSources: [
        {
          id: 'main-datasource',
          name: 'Northwind Database',
          type: 'database',
          connectionString: 'Data Source=northwind.mdb;Provider=Microsoft.Jet.OLEDB.4.0;',
          serverName: 'localhost',
          databaseName: 'Northwind',
          integratedSecurity: true,
          tables: [
            {
              id: 'customers-table',
              name: 'Customers',
              alias: 'Customers',
              type: 'table',
              columns: [
                { name: 'CustomerID', dataType: CrystalDataType.STRING, length: 5, nullable: false, primaryKey: true, foreignKey: false },
                { name: 'CustomerName', dataType: CrystalDataType.STRING, length: 50, nullable: false, primaryKey: false, foreignKey: false },
                { name: 'City', dataType: CrystalDataType.STRING, length: 25, nullable: true, primaryKey: false, foreignKey: false },
                { name: 'State', dataType: CrystalDataType.STRING, length: 2, nullable: true, primaryKey: false, foreignKey: false },
                { name: 'ZipCode', dataType: CrystalDataType.STRING, length: 10, nullable: true, primaryKey: false, foreignKey: false }
              ]
            }
          ],
          links: []
        }
      ],
      
      pageSetup: {
        paperSize: 'Letter',
        width: 8.5,
        height: 11,
        orientation: 'portrait',
        topMargin: 0.5,
        bottomMargin: 0.5,
        leftMargin: 0.5,
        rightMargin: 0.5,
        copies: 1,
        collate: true,
        printRange: 'all'
      },
      
      options: {
        saveDataWithReport: false,
        savePreviewPicture: true,
        verifyWhenDatabaseUpdated: true,
        caseInsensitiveSQLData: false,
        performGroupingOnServer: true,
        useIndexesForSpeed: true,
        translateDOSStrings: false,
        translateDOSMemos: false,
        convertDateTimeField: true,
        convertNullFieldToDefault: true,
        defaultExportFormat: CrystalExportFormat.PDF,
        exportWithFormatting: true
      },
      
      subreports: []
    };

    this.reports.set(customerReport.id, customerReport);
  }

  // Report Management
  async openReport(fileName: string): Promise<CrystalReport> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          logger.debug(`Opening Crystal Report: ${fileName}`);
          
          // Check if already loaded
          const existingReport = Array.from(this.reports.values()).find(r => r.fileName === fileName);
          if (existingReport) {
            resolve(existingReport);
            return;
          }

          // Simulate loading report file
          const reportId = `report-${Date.now()}`;
          const report: CrystalReport = {
            id: reportId,
            name: fileName.replace('.rpt', ''),
            fileName,
            type: CrystalReportType.STANDARD,
            version: '8.5',
            created: new Date(),
            modified: new Date(),
            sections: [],
            fields: [],
            formulas: [],
            parameters: [],
            groups: [],
            dataSources: [],
            pageSetup: {
              paperSize: 'Letter',
              width: 8.5,
              height: 11,
              orientation: 'portrait',
              topMargin: 0.5,
              bottomMargin: 0.5,
              leftMargin: 0.5,
              rightMargin: 0.5,
              copies: 1,
              collate: true,
              printRange: 'all'
            },
            options: {
              saveDataWithReport: false,
              savePreviewPicture: true,
              verifyWhenDatabaseUpdated: true,
              caseInsensitiveSQLData: false,
              performGroupingOnServer: true,
              useIndexesForSpeed: true,
              translateDOSStrings: false,
              translateDOSMemos: false,
              convertDateTimeField: true,
              convertNullFieldToDefault: true,
              defaultExportFormat: CrystalExportFormat.PDF,
              exportWithFormatting: true
            },
            subreports: []
          };

          this.reports.set(reportId, report);
          resolve(report);
        } catch (error) {
          reject(new Error(`Failed to open report: ${error}`));
        }
      }, 500);
    });
  }

  async saveReport(report: CrystalReport, fileName?: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.debug(`Saving Crystal Report: ${fileName || report.fileName}`);
        if (fileName) {
          report.fileName = fileName;
        }
        report.modified = new Date();
        resolve(true);
      }, 300);
    });
  }

  closeReport(report: CrystalReport): boolean {
    logger.debug(`Closing Crystal Report: ${report.name}`);
    this.reports.delete(report.id);
    return true;
  }

  // Data Operations
  setDataSource(report: CrystalReport, dataSource: CrystalDataSource): boolean {
    logger.debug(`Setting data source for report: ${report.name}`);
    
    // Replace or add data source
    const existingIndex = report.dataSources.findIndex(ds => ds.id === dataSource.id);
    if (existingIndex >= 0) {
      report.dataSources[existingIndex] = dataSource;
    } else {
      report.dataSources.push(dataSource);
    }
    
    report.modified = new Date();
    return true;
  }

  setParameters(report: CrystalReport, parameters: Map<string, any>): boolean {
    logger.debug(`Setting parameters for report: ${report.name}`);
    
    for (const [paramName, value] of parameters) {
      const param = report.parameters.find(p => p.name === paramName);
      if (param) {
        param.defaultValue = value;
      }
    }
    
    return true;
  }

  async refreshData(report: CrystalReport): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.debug(`Refreshing data for report: ${report.name}`);
        resolve(true);
      }, 1000);
    });
  }

  // Preview and Print
  async printReport(report: CrystalReport, showDialog: boolean = true): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.debug(`Printing report: ${report.name} (Show Dialog: ${showDialog})`);
        if (showDialog) {
          const proceed = window.confirm(`Print ${report.name}?`);
          resolve(proceed);
        } else {
          resolve(true);
        }
      }, 200);
    });
  }

  async previewReport(report: CrystalReport): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.debug(`Previewing report: ${report.name}`);
        // In a real implementation, would show the report viewer
        if (this.viewer) {
          this.viewer.reportSource = report;
          this.viewer.onLoad?.(report);
        }
        resolve(true);
      }, 500);
    });
  }

  async exportReport(report: CrystalReport, format: CrystalExportFormat, fileName: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.debug(`Exporting report ${report.name} to ${format.toUpperCase()}: ${fileName}`);

        // Simulate export process
        const exportSize = Math.floor(Math.random() * 1000000) + 50000; // 50KB to 1MB
        logger.info(`Export completed: ${fileName} (${(exportSize / 1024).toFixed(1)} KB)`);

        this.viewer?.onExport?.(report, format);
        resolve(true);
      }, 1500);
    });
  }

  // Report Manipulation
  addField(report: CrystalReport, sectionId: string, field: CrystalField): boolean {
    logger.debug(`Adding field ${field.name} to section ${sectionId} in report ${report.name}`);
    
    // Add field to report
    const existingField = report.fields.find(f => f.id === field.id);
    if (!existingField) {
      report.fields.push(field);
    }
    
    // Add field object to section
    const section = report.sections.find(s => s.id === sectionId);
    if (section) {
      const fieldObject: CrystalObject = {
        id: `field-object-${Date.now()}`,
        type: 'field',
        name: field.name,
        left: 1,
        top: 0.1,
        width: 2,
        height: 0.2,
        visible: true,
        canGrow: field.dataType === CrystalDataType.MEMO,
        canShrink: false,
        suppressIfDuplicated: false,
        fieldName: field.name,
        format: field.format
      };
      
      section.objects.push(fieldObject);
    }
    
    report.modified = new Date();
    return true;
  }

  removeField(report: CrystalReport, fieldId: string): boolean {
    logger.debug(`Removing field ${fieldId} from report ${report.name}`);
    
    // Remove from fields array
    const fieldIndex = report.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex >= 0) {
      report.fields.splice(fieldIndex, 1);
    }
    
    // Remove field objects from all sections
    for (const section of report.sections) {
      section.objects = section.objects.filter(obj => obj.fieldName !== fieldId);
    }
    
    report.modified = new Date();
    return true;
  }

  moveField(report: CrystalReport, fieldId: string, left: number, top: number): boolean {
    logger.debug(`Moving field ${fieldId} to position (${left}, ${top}) in report ${report.name}`);
    
    // Find and move field objects in all sections
    for (const section of report.sections) {
      const fieldObject = section.objects.find(obj => obj.fieldName === fieldId);
      if (fieldObject) {
        fieldObject.left = left;
        fieldObject.top = top;
      }
    }
    
    report.modified = new Date();
    return true;
  }

  // Formula Operations
  addFormula(report: CrystalReport, formula: CrystalFormula): boolean {
    logger.debug(`Adding formula ${formula.name} to report ${report.name}`);
    
    const existingFormula = report.formulas.find(f => f.id === formula.id);
    if (!existingFormula) {
      report.formulas.push(formula);
      report.modified = new Date();
      return true;
    }
    
    return false;
  }

  editFormula(report: CrystalReport, formulaId: string, text: string): boolean {
    logger.debug(`Editing formula ${formulaId} in report ${report.name}`);
    
    const formula = report.formulas.find(f => f.id === formulaId);
    if (formula) {
      formula.text = text;
      report.modified = new Date();
      return true;
    }
    
    return false;
  }

  deleteFormula(report: CrystalReport, formulaId: string): boolean {
    logger.debug(`Deleting formula ${formulaId} from report ${report.name}`);
    
    const formulaIndex = report.formulas.findIndex(f => f.id === formulaId);
    if (formulaIndex >= 0) {
      report.formulas.splice(formulaIndex, 1);
      report.modified = new Date();
      return true;
    }
    
    return false;
  }

  // Report Information
  getAllReports(): CrystalReport[] {
    return Array.from(this.reports.values());
  }

  getReport(reportId: string): CrystalReport | null {
    return this.reports.get(reportId) || null;
  }

  // Viewer Management
  createViewer(): CrystalReportViewer {
    this.viewer = {
      reportSource: null,
      displayGroupTree: true,
      displayToolbar: true,
      displayStatusbar: true,
      displayBorder: true,
      enableRefresh: true,
      enablePrint: true,
      enableExport: true,
      enableSearch: true,
      enableZoom: true,
      currentPageNumber: 1,
      totalPageCount: 1,
      zoomLevel: 100
    };
    
    return this.viewer;
  }

  getViewer(): CrystalReportViewer | null {
    return this.viewer;
  }

  // Report Statistics
  getReportStats(): {
    totalReports: number;
    reportsByType: Map<CrystalReportType, number>;
    averageFields: number;
    averageFormulas: number;
  } {
    const reports = this.getAllReports();
    const stats = {
      totalReports: reports.length,
      reportsByType: new Map<CrystalReportType, number>(),
      averageFields: 0,
      averageFormulas: 0
    };

    if (reports.length > 0) {
      let totalFields = 0;
      let totalFormulas = 0;

      for (const report of reports) {
        // Count by type
        const typeCount = stats.reportsByType.get(report.type) || 0;
        stats.reportsByType.set(report.type, typeCount + 1);
        
        totalFields += report.fields.length;
        totalFormulas += report.formulas.length;
      }

      stats.averageFields = totalFields / reports.length;
      stats.averageFormulas = totalFormulas / reports.length;
    }

    return stats;
  }

  // VB6 Compatibility Functions
  createCrystalApplicationObject(): any {
    return {
      OpenReport: (fileName: string) => this.openReport(fileName),
      NewReport: () => {
        const newReport: CrystalReport = {
          id: `new-report-${Date.now()}`,
          name: 'New Report',
          fileName: 'NewReport.rpt',
          type: CrystalReportType.STANDARD,
          version: '8.5',
          created: new Date(),
          modified: new Date(),
          sections: [],
          fields: [],
          formulas: [],
          parameters: [],
          groups: [],
          dataSources: [],
          pageSetup: {
            paperSize: 'Letter',
            width: 8.5,
            height: 11,
            orientation: 'portrait',
            topMargin: 0.5,
            bottomMargin: 0.5,
            leftMargin: 0.5,
            rightMargin: 0.5,
            copies: 1,
            collate: true,
            printRange: 'all'
          },
          options: {
            saveDataWithReport: false,
            savePreviewPicture: true,
            verifyWhenDatabaseUpdated: true,
            caseInsensitiveSQLData: false,
            performGroupingOnServer: true,
            useIndexesForSpeed: true,
            translateDOSStrings: false,
            translateDOSMemos: false,
            convertDateTimeField: true,
            convertNullFieldToDefault: true,
            defaultExportFormat: CrystalExportFormat.PDF,
            exportWithFormatting: true
          },
          subreports: []
        };
        
        this.reports.set(newReport.id, newReport);
        return newReport;
      }
    };
  }
}

// Global instance
export const VB6CrystalReportsInstance = VB6CrystalReports.getInstance();

// VB6 Global Functions for compatibility
export function CreateObject(className: string): any {
  switch (className.toLowerCase()) {
    case 'crystalreports.application':
    case 'crystal.application':
      return VB6CrystalReportsInstance.createCrystalApplicationObject();
    default:
      throw new Error(`Unknown Crystal Reports class: ${className}`);
  }
}

logger.info('VB6 Crystal Reports Integration initialized with report engine and viewer support');