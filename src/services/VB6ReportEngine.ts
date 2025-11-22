import { vb6DatabaseService, ADOConnection, ADORecordset } from './VB6DatabaseService';

// Report Section Types
export enum ReportSectionType {
  ReportHeader = 'ReportHeader',
  PageHeader = 'PageHeader',
  GroupHeader = 'GroupHeader',
  Details = 'Details',
  GroupFooter = 'GroupFooter',
  PageFooter = 'PageFooter',
  ReportFooter = 'ReportFooter'
}

// Field Types
export enum ReportFieldType {
  Text = 'Text',
  Number = 'Number',
  Date = 'Date',
  Formula = 'Formula',
  Image = 'Image',
  Barcode = 'Barcode',
  Line = 'Line',
  Box = 'Box',
  Subreport = 'Subreport'
}

// Text Alignment
export enum TextAlignment {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify'
}

// Border Styles
export enum BorderStyle {
  None = 'none',
  Solid = 'solid',
  Dashed = 'dashed',
  Dotted = 'dotted',
  Double = 'double'
}

// Report Field Interface
export interface ReportField {
  id: string;
  name: string;
  type: ReportFieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string | number | Date | null;
  formula?: string;
  formatting: {
    fontFamily: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textDecoration: 'none' | 'underline';
    color: string;
    backgroundColor: string;
    alignment: TextAlignment;
    borderStyle: BorderStyle;
    borderColor: string;
    borderWidth: number;
    padding: number;
    wordWrap: boolean;
    canGrow: boolean;
    canShrink: boolean;
  };
  dataBinding?: {
    tableName: string;
    fieldName: string;
    expression?: string;
  };
  visibility: {
    visible: boolean;
    suppressIfDuplicate: boolean;
    suppressIfBlank: boolean;
    printWhen?: string;
  };
}

// Report Section Interface
export interface ReportSection {
  id: string;
  type: ReportSectionType;
  name: string;
  height: number;
  backgroundColor: string;
  visible: boolean;
  newPageBefore: boolean;
  newPageAfter: boolean;
  keepTogether: boolean;
  suppressIfBlank: boolean;
  fields: ReportField[];
  groupBy?: string;
  sortBy?: { field: string; direction: 'ASC' | 'DESC' }[];
}

// Report Page Settings
export interface ReportPageSettings {
  orientation: 'portrait' | 'landscape';
  paperSize: 'A4' | 'Letter' | 'Legal' | 'Custom';
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  columns: number;
  columnSpacing: number;
}

// Report Data Source
export interface ReportDataSource {
  type: 'database' | 'json' | 'xml' | 'api';
  connection?: ADOConnection;
  sql?: string;
  data?: any[];
  url?: string;
  parameters?: { [key: string]: any };
}

// Report Definition
export interface ReportDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  version: string;
  created: Date;
  modified: Date;
  author: string;
  pageSettings: ReportPageSettings;
  dataSource: ReportDataSource;
  sections: ReportSection[];
  parameters: ReportParameter[];
  formulas: ReportFormula[];
  subreports: ReportDefinition[];
}

// Report Parameter
export interface ReportParameter {
  id: string;
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  defaultValue: any;
  required: boolean;
  prompt: string;
  allowMultiple: boolean;
  values?: { value: any; label: string }[];
}

// Report Formula
export interface ReportFormula {
  id: string;
  name: string;
  expression: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  description: string;
}

// Report Generation Context
interface ReportContext {
  data: any[];
  parameters: { [key: string]: any };
  pageNumber: number;
  totalPages: number;
  currentRecord: any;
  recordNumber: number;
  totalRecords: number;
  groupValues: { [key: string]: any };
  formulas: { [key: string]: any };
}

// Formula Engine
class FormulaEngine {
  private context: ReportContext;

  constructor(context: ReportContext) {
    this.context = context;
  }

  evaluate(expression: string): any {
    try {
      // Replace Crystal Reports functions with JavaScript equivalents
      const jsExpression = expression
        .replace(/\{([^}]+)\}/g, (match, fieldName) => {
          // Handle field references
          if (fieldName.startsWith('@')) {
            // Parameter reference
            const paramName = fieldName.substring(1);
            return `context.parameters['${paramName}']`;
          } else if (fieldName.includes('.')) {
            // Table.Field reference
            const [table, field] = fieldName.split('.');
            return `context.currentRecord['${field}']`;
          } else {
            // Direct field reference
            return `context.currentRecord['${fieldName}']`;
          }
        })
        .replace(/CurrentDate/g, 'new Date()')
        .replace(/PageNumber/g, 'context.pageNumber')
        .replace(/TotalPageCount/g, 'context.totalPages')
        .replace(/RecordNumber/g, 'context.recordNumber')
        .replace(/Count/g, 'context.totalRecords')
        .replace(/ToText\(([^)]+)\)/g, 'String($1)')
        .replace(/ToNumber\(([^)]+)\)/g, 'Number($1)')
        .replace(/DateAdd\("([^"]+)", ([^,]+), ([^)]+)\)/g, this.handleDateAdd)
        .replace(/FormatDateTime\(([^,]+), "([^"]+)"\)/g, this.handleFormatDateTime);

      // Create a safe evaluation context
      const context = this.context;
      const func = new Function('context', `return ${jsExpression}`);
      return func(context);
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return '#ERROR';
    }
  }

  private handleDateAdd(match: string, interval: string, number: string, date: string): string {
    const intervals: { [key: string]: string } = {
      'yyyy': 'FullYear',
      'mm': 'Month',
      'dd': 'Date',
      'hh': 'Hours',
      'nn': 'Minutes',
      'ss': 'Seconds'
    };
    
    const method = intervals[interval.toLowerCase()];
    if (method) {
      return `(() => {
        const d = new Date(${date});
        d.set${method}(d.get${method}() + ${number});
        return d;
      })()`;
    }
    return match;
  }

  private handleFormatDateTime(match: string, date: string, format: string): string {
    // Convert Crystal Reports date format to JavaScript
    const jsFormat = format
      .replace(/yyyy/g, 'getFullYear()')
      .replace(/mm/g, '(getMonth()+1).toString().padStart(2,"0")')
      .replace(/dd/g, 'getDate().toString().padStart(2,"0")')
      .replace(/hh/g, 'getHours().toString().padStart(2,"0")')
      .replace(/nn/g, 'getMinutes().toString().padStart(2,"0")')
      .replace(/ss/g, 'getSeconds().toString().padStart(2,"0")');
    
    return `(${date}).${jsFormat}`;
  }
}

// Report Engine
export class VB6ReportEngine {
  private static instance: VB6ReportEngine;
  private reports: Map<string, ReportDefinition> = new Map();
  private formulaEngine?: FormulaEngine;

  static getInstance(): VB6ReportEngine {
    if (!VB6ReportEngine.instance) {
      VB6ReportEngine.instance = new VB6ReportEngine();
    }
    return VB6ReportEngine.instance;
  }

  // Create a new report
  createReport(name: string, title: string): ReportDefinition {
    const report: ReportDefinition = {
      id: `report_${Date.now()}`,
      name,
      title,
      description: '',
      version: '1.0',
      created: new Date(),
      modified: new Date(),
      author: 'VB6 Web IDE',
      pageSettings: this.getDefaultPageSettings(),
      dataSource: {
        type: 'database',
        data: []
      },
      sections: this.getDefaultSections(),
      parameters: [],
      formulas: [],
      subreports: []
    };

    this.reports.set(report.id, report);
    return report;
  }

  // Load report from definition
  loadReport(definition: ReportDefinition): void {
    this.reports.set(definition.id, definition);
  }

  // Get report by ID
  getReport(id: string): ReportDefinition | undefined {
    return this.reports.get(id);
  }

  // Save report
  saveReport(report: ReportDefinition): void {
    report.modified = new Date();
    this.reports.set(report.id, report);
  }

  // Delete report
  deleteReport(id: string): boolean {
    return this.reports.delete(id);
  }

  // Get all reports
  getAllReports(): ReportDefinition[] {
    return Array.from(this.reports.values());
  }

  // Generate report data
  async generateReport(reportId: string, parameters: { [key: string]: any } = {}): Promise<ReportOutput> {
    const report = this.getReport(reportId);
    if (!report) {
      throw new Error(`Report with ID ${reportId} not found`);
    }

    // Load data
    const data = await this.loadReportData(report, parameters);
    
    // Create context
    const context: ReportContext = {
      data,
      parameters,
      pageNumber: 1,
      totalPages: 1, // Will be calculated
      currentRecord: {},
      recordNumber: 0,
      totalRecords: data.length,
      groupValues: {},
      formulas: {}
    };

    this.formulaEngine = new FormulaEngine(context);

    // Process formulas
    report.formulas.forEach(formula => {
      context.formulas[formula.name] = this.formulaEngine!.evaluate(formula.expression);
    });

    // Generate pages
    const pages = this.generatePages(report, context);

    return {
      report,
      pages,
      context,
      generatedAt: new Date(),
      totalPages: pages.length,
      totalRecords: data.length
    };
  }

  // Load data for report
  private async loadReportData(report: ReportDefinition, parameters: { [key: string]: any }): Promise<any[]> {
    const { dataSource } = report;

    switch (dataSource.type) {
      case 'database':
        if (dataSource.connection && dataSource.sql) {
          const recordset = await dataSource.connection.Execute(dataSource.sql);
          return recordset.GetRows().map((row: any[], index: number) => {
            const record: any = {};
            Object.keys(recordset.Fields).forEach((fieldName, fieldIndex) => {
              record[fieldName] = row[fieldIndex];
            });
            return record;
          });
        }
        break;

      case 'json':
        return dataSource.data || [];

      case 'api':
        if (dataSource.url) {
          const response = await fetch(dataSource.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parameters)
          });
          return await response.json();
        }
        break;
    }

    return [];
  }

  // Generate report pages
  private generatePages(report: ReportDefinition, context: ReportContext): ReportPage[] {
    const pages: ReportPage[] = [];
    const { pageSettings } = report;
    
    let currentPage: ReportPage = this.createNewPage(pageSettings);
    let currentY = pageSettings.marginTop;

    // Group data if needed
    const groupedData = this.groupData(context.data, report.sections);
    
    // Report Header
    const reportHeader = report.sections.find(s => s.type === ReportSectionType.ReportHeader);
    if (reportHeader && reportHeader.visible) {
      currentY = this.addSectionToPage(currentPage, reportHeader, context, currentY);
    }

    // Process groups/details
    for (let i = 0; i < groupedData.length; i++) {
      const group = groupedData[i];
      context.currentRecord = group.data[0];
      context.recordNumber = i + 1;

      // Page Header (if needed)
      if (currentY === pageSettings.marginTop) {
        const pageHeader = report.sections.find(s => s.type === ReportSectionType.PageHeader);
        if (pageHeader && pageHeader.visible) {
          currentY = this.addSectionToPage(currentPage, pageHeader, context, currentY);
        }
      }

      // Group Header
      const groupHeader = report.sections.find(s => s.type === ReportSectionType.GroupHeader);
      if (groupHeader && groupHeader.visible) {
        currentY = this.addSectionToPage(currentPage, groupHeader, context, currentY);
      }

      // Details
      for (const record of group.data) {
        context.currentRecord = record;
        context.recordNumber++;

        const detailsSection = report.sections.find(s => s.type === ReportSectionType.Details);
        if (detailsSection && detailsSection.visible) {
          // Check if we need a new page
          if (currentY + detailsSection.height > pageSettings.height - pageSettings.marginBottom) {
            // Add page footer
            const pageFooter = report.sections.find(s => s.type === ReportSectionType.PageFooter);
            if (pageFooter && pageFooter.visible) {
              const footerY = pageSettings.height - pageSettings.marginBottom - pageFooter.height;
              this.addSectionToPage(currentPage, pageFooter, context, footerY);
            }

            pages.push(currentPage);
            context.pageNumber++;
            currentPage = this.createNewPage(pageSettings);
            currentY = pageSettings.marginTop;

            // Add page header to new page
            const pageHeader = report.sections.find(s => s.type === ReportSectionType.PageHeader);
            if (pageHeader && pageHeader.visible) {
              currentY = this.addSectionToPage(currentPage, pageHeader, context, currentY);
            }
          }

          currentY = this.addSectionToPage(currentPage, detailsSection, context, currentY);
        }
      }

      // Group Footer
      const groupFooter = report.sections.find(s => s.type === ReportSectionType.GroupFooter);
      if (groupFooter && groupFooter.visible) {
        currentY = this.addSectionToPage(currentPage, groupFooter, context, currentY);
      }
    }

    // Report Footer
    const reportFooter = report.sections.find(s => s.type === ReportSectionType.ReportFooter);
    if (reportFooter && reportFooter.visible) {
      currentY = this.addSectionToPage(currentPage, reportFooter, context, currentY);
    }

    // Add final page footer
    const pageFooter = report.sections.find(s => s.type === ReportSectionType.PageFooter);
    if (pageFooter && pageFooter.visible) {
      const footerY = pageSettings.height - pageSettings.marginBottom - pageFooter.height;
      this.addSectionToPage(currentPage, pageFooter, context, footerY);
    }

    pages.push(currentPage);

    // Update total pages in context
    context.totalPages = pages.length;

    return pages;
  }

  // Create new page
  private createNewPage(pageSettings: ReportPageSettings): ReportPage {
    return {
      width: pageSettings.width,
      height: pageSettings.height,
      elements: []
    };
  }

  // Add section to page
  private addSectionToPage(page: ReportPage, section: ReportSection, context: ReportContext, y: number): number {
    section.fields.forEach(field => {
      const element = this.createPageElement(field, context, y);
      if (element) {
        page.elements.push(element);
      }
    });

    return y + section.height;
  }

  // Create page element from field
  private createPageElement(field: ReportField, context: ReportContext, sectionY: number): ReportPageElement | null {
    if (!field.visibility.visible) {
      return null;
    }

    let value = field.value;

    // Evaluate data binding
    if (field.dataBinding) {
      const { fieldName, expression } = field.dataBinding;
      if (expression) {
        value = this.formulaEngine?.evaluate(expression);
      } else if (fieldName && context.currentRecord) {
        value = context.currentRecord[fieldName];
      }
    }

    // Evaluate formula
    if (field.formula) {
      value = this.formulaEngine?.evaluate(field.formula);
    }

    // Apply visibility rules
    if (field.visibility.suppressIfBlank && (!value || value === '')) {
      return null;
    }

    // Format value
    const formattedValue = this.formatValue(value, field);

    return {
      id: field.id,
      type: field.type,
      x: field.x,
      y: sectionY + field.y,
      width: field.width,
      height: field.height,
      value: formattedValue,
      formatting: field.formatting
    };
  }

  // Format value based on field type
  private formatValue(value: any, field: ReportField): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (field.type) {
      case ReportFieldType.Number:
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        return String(value);

      case ReportFieldType.Date:
        if (value instanceof Date) {
          return value.toLocaleDateString();
        } else if (typeof value === 'string') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date.toLocaleDateString();
        }
        return String(value);

      default:
        return String(value);
    }
  }

  // Group data by section grouping
  private groupData(data: any[], sections: ReportSection[]): { key: string; data: any[] }[] {
    const groupBy = sections.find(s => s.groupBy)?.groupBy;
    if (!groupBy) {
      return [{ key: 'all', data }];
    }

    const groups = new Map<string, any[]>();
    data.forEach(record => {
      const groupKey = String(record[groupBy] || '');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(record);
    });

    return Array.from(groups.entries()).map(([key, data]) => ({ key, data }));
  }

  // Get default page settings
  private getDefaultPageSettings(): ReportPageSettings {
    return {
      orientation: 'portrait',
      paperSize: 'A4',
      width: 595, // A4 width in points
      height: 842, // A4 height in points
      marginTop: 72, // 1 inch
      marginBottom: 72,
      marginLeft: 72,
      marginRight: 72,
      columns: 1,
      columnSpacing: 0
    };
  }

  // Get default sections
  private getDefaultSections(): ReportSection[] {
    return [
      {
        id: 'report_header',
        type: ReportSectionType.ReportHeader,
        name: 'Report Header',
        height: 50,
        backgroundColor: 'transparent',
        visible: true,
        newPageBefore: false,
        newPageAfter: false,
        keepTogether: false,
        suppressIfBlank: false,
        fields: []
      },
      {
        id: 'page_header',
        type: ReportSectionType.PageHeader,
        name: 'Page Header',
        height: 30,
        backgroundColor: 'transparent',
        visible: true,
        newPageBefore: false,
        newPageAfter: false,
        keepTogether: false,
        suppressIfBlank: false,
        fields: []
      },
      {
        id: 'details',
        type: ReportSectionType.Details,
        name: 'Details',
        height: 20,
        backgroundColor: 'transparent',
        visible: true,
        newPageBefore: false,
        newPageAfter: false,
        keepTogether: false,
        suppressIfBlank: false,
        fields: []
      },
      {
        id: 'page_footer',
        type: ReportSectionType.PageFooter,
        name: 'Page Footer',
        height: 30,
        backgroundColor: 'transparent',
        visible: true,
        newPageBefore: false,
        newPageAfter: false,
        keepTogether: false,
        suppressIfBlank: false,
        fields: []
      },
      {
        id: 'report_footer',
        type: ReportSectionType.ReportFooter,
        name: 'Report Footer',
        height: 50,
        backgroundColor: 'transparent',
        visible: true,
        newPageBefore: false,
        newPageAfter: false,
        keepTogether: false,
        suppressIfBlank: false,
        fields: []
      }
    ];
  }

  // Create default field
  createField(type: ReportFieldType, x: number, y: number): ReportField {
    return {
      id: `field_${Date.now()}_${Math.random()}`,
      name: `Field${Date.now()}`,
      type,
      x,
      y,
      width: 100,
      height: 20,
      value: type === ReportFieldType.Text ? 'Text Field' : null,
      formatting: {
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        backgroundColor: 'transparent',
        alignment: TextAlignment.Left,
        borderStyle: BorderStyle.None,
        borderColor: '#000000',
        borderWidth: 1,
        padding: 2,
        wordWrap: false,
        canGrow: false,
        canShrink: false
      },
      visibility: {
        visible: true,
        suppressIfDuplicate: false,
        suppressIfBlank: false
      }
    };
  }

  // Export report to JSON
  exportReport(reportId: string): string {
    const report = this.getReport(reportId);
    if (!report) {
      throw new Error(`Report with ID ${reportId} not found`);
    }
    return JSON.stringify(report, null, 2);
  }

  // Import report from JSON
  importReport(json: string): ReportDefinition {
    const report = JSON.parse(json) as ReportDefinition;
    this.loadReport(report);
    return report;
  }
}

// Report Output Interfaces
export interface ReportPageElement {
  id: string;
  type: ReportFieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  formatting: ReportField['formatting'];
}

export interface ReportPage {
  width: number;
  height: number;
  elements: ReportPageElement[];
}

export interface ReportOutput {
  report: ReportDefinition;
  pages: ReportPage[];
  context: ReportContext;
  generatedAt: Date;
  totalPages: number;
  totalRecords: number;
}

// Global instance
export const vb6ReportEngine = VB6ReportEngine.getInstance();