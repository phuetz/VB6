/**
 * Service Crystal Reports pour VB6 Studio
 * Génération de rapports PDF, Excel, Word avec compatibilité Crystal Reports
 * Support pour formules, graphiques, sous-rapports, paramètres
 */

import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Document as DocxDocument, Packer, Paragraph, Table, TableRow, TableCell } from 'docx';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { Logger } from '../utils/Logger';
import { DatabaseService } from './DatabaseService';

export interface CrystalReport {
  id: string;
  name: string;
  title: string;
  description?: string;
  dataSources: ReportDataSource[];
  sections: ReportSection[];
  parameters: ReportParameter[];
  formulas: ReportFormula[];
  charts: ReportChart[];
  subReports: SubReport[];
  pageSettings: PageSettings;
  formatting: ReportFormatting;
  filters: ReportFilter[];
  groups: ReportGroup[];
  summary: ReportSummary[];
}

export interface ReportDataSource {
  id: string;
  name: string;
  connectionId: string;
  query: string;
  parameters: string[];
  fields: ReportField[];
}

export interface ReportField {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'memo';
  format?: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  visible: boolean;
  canGrow: boolean;
  canShrink: boolean;
  suppressIfDuplicated: boolean;
}

export interface ReportSection {
  type: 'ReportHeader' | 'PageHeader' | 'GroupHeader' | 'Details' | 'GroupFooter' | 'ReportFooter' | 'PageFooter';
  name: string;
  height: number;
  visible: boolean;
  keepTogether: boolean;
  newPageBefore: boolean;
  newPageAfter: boolean;
  suppressBlankSection: boolean;
  objects: ReportObject[];
}

export interface ReportObject {
  id: string;
  type: 'text' | 'field' | 'formula' | 'image' | 'line' | 'box' | 'chart' | 'subReport';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fieldName?: string;
  formulaName?: string;
  formatting: ObjectFormatting;
  border: BorderSettings;
  conditions: ConditionalFormatting[];
}

export interface ReportParameter {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  defaultValue?: any;
  allowMultipleValues: boolean;
  allowDiscreteValues: boolean;
  allowRangeValues: boolean;
  pickListValues?: any[];
  prompt: string;
  required: boolean;
}

export interface ReportFormula {
  name: string;
  text: string;
  description?: string;
  syntax: 'Crystal' | 'Basic';
}

export interface ReportChart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'bubble';
  title: string;
  dataField: string;
  categoryField: string;
  valueField: string;
  x: number;
  y: number;
  width: number;
  height: number;
  showLegend: boolean;
  showDataLabels: boolean;
  colors: string[];
}

export interface SubReport {
  id: string;
  name: string;
  reportPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
  linkFields: SubReportLink[];
}

export interface SubReportLink {
  masterField: string;
  subReportField: string;
}

export interface PageSettings {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  orientation: 'portrait' | 'landscape';
}

export interface ReportFormatting {
  font: {
    name: string;
    size: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    color: string;
  };
  background: {
    color: string;
    transparent: boolean;
  };
}

export interface ObjectFormatting extends ReportFormatting {
  alignment: 'left' | 'center' | 'right' | 'justified';
  verticalAlignment: 'top' | 'middle' | 'bottom';
  wordWrap: boolean;
  canGrow: boolean;
  canShrink: boolean;
}

export interface BorderSettings {
  left: BorderLine;
  right: BorderLine;
  top: BorderLine;
  bottom: BorderLine;
}

export interface BorderLine {
  style: 'none' | 'single' | 'double' | 'dashed' | 'dotted';
  width: number;
  color: string;
}

export interface ConditionalFormatting {
  condition: string;
  formatting: Partial<ObjectFormatting>;
  priority: number;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'startsWith' | 'endsWith' | 'between' | 'in';
  value: any;
  values?: any[];
}

export interface ReportGroup {
  field: string;
  sortOrder: 'ascending' | 'descending';
  keepTogether: boolean;
  repeatGroupHeader: boolean;
  header: ReportSection;
  footer: ReportSection;
}

export interface ReportSummary {
  field: string;
  operation: 'sum' | 'average' | 'count' | 'distinctCount' | 'maximum' | 'minimum' | 'standardDeviation' | 'variance';
  scope: 'report' | 'group' | 'page';
  groupName?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'word' | 'csv' | 'xml' | 'html';
  fileName?: string;
  destination?: string;
  compression?: boolean;
  password?: string;
  watermark?: string;
  pageRange?: {
    start: number;
    end: number;
  };
}

export interface ReportData {
  [dataSourceId: string]: {
    fields: any[];
    records: any[];
  };
}

export class CrystalReportsService {
  private logger: Logger;
  private dbService: DatabaseService;
  private reportsCache: Map<string, CrystalReport> = new Map();
  private formulaEngine: FormulaEngine;

  constructor(dbService: DatabaseService) {
    this.logger = new Logger('CrystalReportsService');
    this.dbService = dbService;
    this.formulaEngine = new FormulaEngine();
  }

  /**
   * Initialise le service Crystal Reports
   */
  async initialize(): Promise<void> {
    this.logger.info('Initialisation du service Crystal Reports...');
    
    try {
      // Créer les dossiers nécessaires
      await this.ensureDirectories();
      
      // Charger les rapports existants
      await this.loadReports();
      
      this.logger.info('Service Crystal Reports initialisé');
    } catch (error) {
      this.logger.error('Erreur initialisation Crystal Reports:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau rapport
   */
  async createReport(report: Partial<CrystalReport>): Promise<string> {
    try {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newReport: CrystalReport = {
        id: reportId,
        name: report.name || 'Nouveau Rapport',
        title: report.title || report.name || 'Nouveau Rapport',
        description: report.description,
        dataSources: report.dataSources || [],
        sections: report.sections || this.getDefaultSections(),
        parameters: report.parameters || [],
        formulas: report.formulas || [],
        charts: report.charts || [],
        subReports: report.subReports || [],
        pageSettings: report.pageSettings || this.getDefaultPageSettings(),
        formatting: report.formatting || this.getDefaultFormatting(),
        filters: report.filters || [],
        groups: report.groups || [],
        summary: report.summary || [],
      };

      this.reportsCache.set(reportId, newReport);
      await this.saveReport(newReport);

      this.logger.info(`Rapport créé: ${reportId}`, { name: newReport.name });
      return reportId;
    } catch (error) {
      this.logger.error('Erreur création rapport:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport dans le format spécifié
   */
  async generateReport(
    reportId: string,
    parameters: Record<string, any> = {},
    exportOptions: ExportOptions
  ): Promise<{ filePath: string; buffer: Buffer }> {
    try {
      const report = this.reportsCache.get(reportId);
      if (!report) {
        throw new Error(`Rapport non trouvé: ${reportId}`);
      }

      this.logger.info(`Génération rapport: ${reportId}`, { 
        format: exportOptions.format,
        parameters 
      });

      // Valider les paramètres
      this.validateParameters(report.parameters, parameters);

      // Récupérer les données
      const reportData = await this.fetchReportData(report, parameters);

      // Appliquer les filtres
      const filteredData = this.applyFilters(reportData, report.filters);

      // Générer selon le format
      let buffer: Buffer;
      let extension: string;

      switch (exportOptions.format) {
        case 'pdf':
          buffer = await this.generatePDF(report, filteredData, parameters);
          extension = '.pdf';
          break;
        case 'excel':
          buffer = await this.generateExcel(report, filteredData, parameters);
          extension = '.xlsx';
          break;
        case 'word':
          buffer = await this.generateWord(report, filteredData, parameters);
          extension = '.docx';
          break;
        case 'csv':
          buffer = await this.generateCSV(report, filteredData);
          extension = '.csv';
          break;
        case 'xml':
          buffer = await this.generateXML(report, filteredData);
          extension = '.xml';
          break;
        case 'html':
          buffer = await this.generateHTML(report, filteredData, parameters);
          extension = '.html';
          break;
        default:
          throw new Error(`Format non supporté: ${exportOptions.format}`);
      }

      // Sauvegarder le fichier
      const fileName = exportOptions.fileName || `${report.name}_${Date.now()}${extension}`;
      const outputDir = exportOptions.destination || path.join(process.cwd(), 'reports', 'output');
      const filePath = path.join(outputDir, fileName);

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, buffer);

      this.logger.info(`Rapport généré: ${filePath}`, { 
        size: buffer.length,
        format: exportOptions.format 
      });

      return { filePath, buffer };
    } catch (error) {
      this.logger.error(`Erreur génération rapport ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Génère un aperçu du rapport
   */
  async previewReport(
    reportId: string,
    parameters: Record<string, any> = {},
    pageNumber: number = 1,
    pageSize: number = 50
  ): Promise<{
    pages: number;
    currentPage: number;
    data: any[];
    fields: ReportField[];
  }> {
    try {
      const report = this.reportsCache.get(reportId);
      if (!report) {
        throw new Error(`Rapport non trouvé: ${reportId}`);
      }

      // Récupérer les données avec pagination
      const reportData = await this.fetchReportData(report, parameters);
      const filteredData = this.applyFilters(reportData, report.filters);

      // Calculer la pagination
      const totalRecords = Object.values(filteredData)[0]?.records.length || 0;
      const totalPages = Math.ceil(totalRecords / pageSize);
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      // Paginer les données
      const paginatedData = Object.keys(filteredData).reduce((acc, key) => {
        acc[key] = {
          ...filteredData[key],
          records: filteredData[key].records.slice(startIndex, endIndex),
        };
        return acc;
      }, {} as ReportData);

      return {
        pages: totalPages,
        currentPage: pageNumber,
        data: Object.values(paginatedData)[0]?.records || [],
        fields: Object.values(paginatedData)[0]?.fields || [],
      };
    } catch (error) {
      this.logger.error(`Erreur aperçu rapport ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Obtient la liste des rapports disponibles
   */
  getReports(): CrystalReport[] {
    return Array.from(this.reportsCache.values());
  }

  /**
   * Obtient un rapport par son ID
   */
  getReport(reportId: string): CrystalReport | undefined {
    return this.reportsCache.get(reportId);
  }

  /**
   * Met à jour un rapport
   */
  async updateReport(reportId: string, updates: Partial<CrystalReport>): Promise<void> {
    try {
      const report = this.reportsCache.get(reportId);
      if (!report) {
        throw new Error(`Rapport non trouvé: ${reportId}`);
      }

      const updatedReport = { ...report, ...updates, id: reportId };
      this.reportsCache.set(reportId, updatedReport);
      await this.saveReport(updatedReport);

      this.logger.info(`Rapport mis à jour: ${reportId}`);
    } catch (error) {
      this.logger.error(`Erreur mise à jour rapport ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Supprime un rapport
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      this.reportsCache.delete(reportId);
      
      const reportPath = path.join(process.cwd(), 'reports', 'definitions', `${reportId}.json`);
      await fs.unlink(reportPath).catch(() => {
        // Ignore if file doesn't exist - this is expected behavior
      });

      this.logger.info(`Rapport supprimé: ${reportId}`);
    } catch (error) {
      this.logger.error(`Erreur suppression rapport ${reportId}:`, error);
      throw error;
    }
  }

  // Méthodes privées

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      'reports/definitions',
      'reports/output',
      'reports/templates',
      'reports/cache'
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(process.cwd(), dir), { recursive: true });
    }
  }

  private async loadReports(): Promise<void> {
    try {
      const reportsDir = path.join(process.cwd(), 'reports', 'definitions');
      const files = await fs.readdir(reportsDir).catch(() => []);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(reportsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const report: CrystalReport = JSON.parse(content);
          this.reportsCache.set(report.id, report);
        }
      }

      this.logger.info(`${this.reportsCache.size} rapports chargés`);
    } catch (error) {
      this.logger.warn('Erreur chargement rapports:', error);
    }
  }

  private async saveReport(report: CrystalReport): Promise<void> {
    const filePath = path.join(process.cwd(), 'reports', 'definitions', `${report.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
  }

  private validateParameters(reportParams: ReportParameter[], userParams: Record<string, any>): void {
    for (const param of reportParams) {
      if (param.required && !(param.name in userParams)) {
        throw new Error(`Paramètre requis manquant: ${param.displayName}`);
      }

      if (param.name in userParams) {
        // Valider le type et la valeur
        const value = userParams[param.name];
        // TODO: Ajouter validation complète des types et valeurs
      }
    }
  }

  private async fetchReportData(report: CrystalReport, parameters: Record<string, any>): Promise<ReportData> {
    const reportData: ReportData = {};

    for (const dataSource of report.dataSources) {
      try {
        // Remplacer les paramètres dans la requête
        let processedQuery = dataSource.query;
        for (const [paramName, paramValue] of Object.entries(parameters)) {
          processedQuery = processedQuery.replace(
            new RegExp(`{${paramName}}`, 'g'),
            this.formatParameterValue(paramValue)
          );
        }

        // Exécuter la requête
        const result = await this.dbService.executeQuery(
          dataSource.connectionId,
          processedQuery,
          []
        );

        reportData[dataSource.id] = {
          fields: result.fields,
          records: result.data,
        };
      } catch (error) {
        this.logger.error(`Erreur récupération données ${dataSource.id}:`, error);
        throw error;
      }
    }

    return reportData;
  }

  private applyFilters(reportData: ReportData, filters: ReportFilter[]): ReportData {
    if (filters.length === 0) return reportData;

    const filteredData: ReportData = {};

    for (const [dataSourceId, data] of Object.entries(reportData)) {
      const filteredRecords = data.records.filter(record => {
        return filters.every(filter => this.evaluateFilter(record, filter));
      });

      filteredData[dataSourceId] = {
        fields: data.fields,
        records: filteredRecords,
      };
    }

    return filteredData;
  }

  private evaluateFilter(record: any, filter: ReportFilter): boolean {
    const fieldValue = record[filter.field];
    const filterValue = filter.value;

    switch (filter.operator) {
      case 'equals':
        return fieldValue === filterValue;
      case 'notEquals':
        return fieldValue !== filterValue;
      case 'greaterThan':
        return fieldValue > filterValue;
      case 'lessThan':
        return fieldValue < filterValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
      case 'startsWith':
        return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
      case 'endsWith':
        return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
      case 'between':
        return filter.values && fieldValue >= filter.values[0] && fieldValue <= filter.values[1];
      case 'in':
        return filter.values && filter.values.includes(fieldValue);
      default:
        return true;
    }
  }

  private async generatePDF(
    report: CrystalReport,
    data: ReportData,
    parameters: Record<string, any>
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [report.pageSettings.width, report.pageSettings.height],
          margins: {
            top: report.pageSettings.marginTop,
            bottom: report.pageSettings.marginBottom,
            left: report.pageSettings.marginLeft,
            right: report.pageSettings.marginRight,
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Générer le contenu PDF
        this.renderPDFContent(doc, report, data, parameters);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private renderPDFContent(
    doc: PDFKit.PDFDocument,
    report: CrystalReport,
    data: ReportData,
    parameters: Record<string, any>
  ): void {
    // Générer les sections du rapport
    for (const section of report.sections) {
      if (!section.visible) continue;

      switch (section.type) {
        case 'ReportHeader':
          this.renderPDFSection(doc, section, data, parameters, true);
          break;
        case 'PageHeader':
          this.renderPDFSection(doc, section, data, parameters, true);
          break;
        case 'Details': {
          // Répéter pour chaque enregistrement
          const records = Object.values(data)[0]?.records || [];
          for (const record of records) {
            this.renderPDFSection(doc, section, { ...data, currentRecord: record }, parameters);
          }
          break;
        }
        case 'ReportFooter':
          this.renderPDFSection(doc, section, data, parameters, true);
          break;
        case 'PageFooter':
          this.renderPDFSection(doc, section, data, parameters, true);
          break;
      }
    }
  }

  private renderPDFSection(
    doc: PDFKit.PDFDocument,
    section: ReportSection,
    data: ReportData,
    parameters: Record<string, any>,
    isStatic: boolean = false
  ): void {
    for (const obj of section.objects) {
      this.renderPDFObject(doc, obj, data, parameters);
    }
  }

  private renderPDFObject(
    doc: PDFKit.PDFDocument,
    obj: ReportObject,
    data: ReportData,
    parameters: Record<string, any>
  ): void {
    const x = obj.x;
    const y = obj.y;

    switch (obj.type) {
      case 'text':
        doc.fontSize(obj.formatting.font.size)
           .font(obj.formatting.font.bold ? 'Helvetica-Bold' : 'Helvetica')
           .fillColor(obj.formatting.font.color)
           .text(obj.content || '', x, y, {
             width: obj.width,
             align: obj.formatting.alignment,
           });
        break;

      case 'field':
        if (obj.fieldName && data.currentRecord) {
          const value = data.currentRecord[obj.fieldName] || '';
          doc.fontSize(obj.formatting.font.size)
             .font(obj.formatting.font.bold ? 'Helvetica-Bold' : 'Helvetica')
             .fillColor(obj.formatting.font.color)
             .text(String(value), x, y, {
               width: obj.width,
               align: obj.formatting.alignment,
             });
        }
        break;

      case 'formula':
        if (obj.formulaName) {
          const value = this.formulaEngine.evaluate(obj.formulaName, data, parameters);
          doc.fontSize(obj.formatting.font.size)
             .font(obj.formatting.font.bold ? 'Helvetica-Bold' : 'Helvetica')
             .fillColor(obj.formatting.font.color)
             .text(String(value), x, y, {
               width: obj.width,
               align: obj.formatting.alignment,
             });
        }
        break;

      case 'line':
        doc.strokeColor(obj.border.top.color)
           .lineWidth(obj.border.top.width)
           .moveTo(x, y)
           .lineTo(x + obj.width, y + obj.height)
           .stroke();
        break;

      case 'box':
        doc.rect(x, y, obj.width, obj.height);
        if (obj.formatting.background.color && !obj.formatting.background.transparent) {
          doc.fillColor(obj.formatting.background.color).fill();
        } else {
          doc.strokeColor(obj.border.top.color).stroke();
        }
        break;
    }
  }

  private async generateExcel(
    report: CrystalReport,
    data: ReportData,
    parameters: Record<string, any>
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(report.name);

    // Récupérer les données principales
    const mainData = Object.values(data)[0];
    if (!mainData) {
      throw new Error('Aucune donnée trouvée pour le rapport');
    }

    // Ajouter les en-têtes
    const headers = mainData.fields.map(field => field.name || field);
    worksheet.addRow(headers);

    // Styliser les en-têtes
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Ajouter les données
    for (const record of mainData.records) {
      const rowData = headers.map(header => record[header]);
      worksheet.addRow(rowData);
    }

    // Ajuster la largeur des colonnes
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  private async generateWord(
    report: CrystalReport,
    data: ReportData,
    parameters: Record<string, any>
  ): Promise<Buffer> {
    const mainData = Object.values(data)[0];
    if (!mainData) {
      throw new Error('Aucune donnée trouvée pour le rapport');
    }

    const doc = new DocxDocument({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                {
                  text: report.title,
                  bold: true,
                  size: 32,
                },
              ],
            }),
            new Table({
              rows: [
                // En-tête
                new TableRow({
                  children: mainData.fields.map(field => 
                    new TableCell({
                      children: [new Paragraph(field.name || field)],
                    })
                  ),
                }),
                // Données
                ...mainData.records.map(record =>
                  new TableRow({
                    children: mainData.fields.map(field =>
                      new TableCell({
                        children: [new Paragraph(String(record[field.name || field] || ''))],
                      })
                    ),
                  })
                ),
              ],
            }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  private async generateCSV(report: CrystalReport, data: ReportData): Promise<Buffer> {
    const mainData = Object.values(data)[0];
    if (!mainData) {
      throw new Error('Aucune donnée trouvée pour le rapport');
    }

    const headers = mainData.fields.map(field => field.name || field);
    const csvRows = [headers.join(',')];

    for (const record of mainData.records) {
      const row = headers.map(header => {
        const value = record[header] || '';
        // Échapper les guillemets et virgules
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csvRows.push(row.join(','));
    }

    return Buffer.from(csvRows.join('\n'), 'utf-8');
  }

  private async generateXML(report: CrystalReport, data: ReportData): Promise<Buffer> {
    const mainData = Object.values(data)[0];
    if (!mainData) {
      throw new Error('Aucune donnée trouvée pour le rapport');
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<Report name="${report.name}" title="${report.title}">\n`;
    xml += '  <Data>\n';

    for (const record of mainData.records) {
      xml += '    <Record>\n';
      for (const [key, value] of Object.entries(record)) {
        xml += `      <${key}>${this.escapeXML(String(value))}</${key}>\n`;
      }
      xml += '    </Record>\n';
    }

    xml += '  </Data>\n';
    xml += '</Report>';

    return Buffer.from(xml, 'utf-8');
  }

  private async generateHTML(
    report: CrystalReport,
    data: ReportData,
    parameters: Record<string, any>
  ): Promise<Buffer> {
    const mainData = Object.values(data)[0];
    if (!mainData) {
      throw new Error('Aucune donnée trouvée pour le rapport');
    }

    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>${report.title}</h1>
    <table>
        <thead>
            <tr>
`;

    // En-têtes
    for (const field of mainData.fields) {
      html += `                <th>${field.name || field}</th>\n`;
    }

    html += `
            </tr>
        </thead>
        <tbody>
`;

    // Données
    for (const record of mainData.records) {
      html += '            <tr>\n';
      for (const field of mainData.fields) {
        const value = record[field.name || field] || '';
        html += `                <td>${this.escapeHTML(String(value))}</td>\n`;
      }
      html += '            </tr>\n';
    }

    html += `
        </tbody>
    </table>
</body>
</html>`;

    return Buffer.from(html, 'utf-8');
  }

  private getDefaultSections(): ReportSection[] {
    return [
      {
        type: 'ReportHeader',
        name: 'En-tête de rapport',
        height: 50,
        visible: true,
        keepTogether: false,
        newPageBefore: false,
        newPageAfter: false,
        suppressBlankSection: false,
        objects: [],
      },
      {
        type: 'Details',
        name: 'Détails',
        height: 20,
        visible: true,
        keepTogether: false,
        newPageBefore: false,
        newPageAfter: false,
        suppressBlankSection: false,
        objects: [],
      },
      {
        type: 'ReportFooter',
        name: 'Pied de rapport',
        height: 50,
        visible: true,
        keepTogether: false,
        newPageBefore: false,
        newPageAfter: false,
        suppressBlankSection: false,
        objects: [],
      },
    ];
  }

  private getDefaultPageSettings(): PageSettings {
    return {
      width: 612, // 8.5 inches * 72 DPI
      height: 792, // 11 inches * 72 DPI
      marginTop: 72,
      marginBottom: 72,
      marginLeft: 72,
      marginRight: 72,
      orientation: 'portrait',
    };
  }

  private getDefaultFormatting(): ReportFormatting {
    return {
      font: {
        name: 'Arial',
        size: 10,
        bold: false,
        italic: false,
        underline: false,
        color: '#000000',
      },
      background: {
        color: '#FFFFFF',
        transparent: true,
      },
    };
  }

  private formatParameterValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    } else if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    } else {
      return String(value);
    }
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

/**
 * Moteur de formules Crystal Reports
 */
class FormulaEngine {
  private formulas: Map<string, ReportFormula> = new Map();

  evaluate(formulaName: string, data: ReportData, parameters: Record<string, any>): any {
    const formula = this.formulas.get(formulaName);
    if (!formula) {
      return '';
    }

    try {
      // Évaluation simplifiée des formules
      // TODO: Implémenter un véritable moteur de formules Crystal
      return this.evaluateFormula(formula.text, data, parameters);
    } catch (error) {
      return '#ERROR';
    }
  }

  private evaluateFormula(formulaText: string, data: ReportData, parameters: Record<string, any>): any {
    // Implémentation basique pour les formules courantes
    if (formulaText.includes('Sum(')) {
      // Extraire le champ et calculer la somme
      const field = formulaText.match(/Sum\(([^)]+)\)/)?.[1];
      if (field && data.currentRecord) {
        const records = Object.values(data)[0]?.records || [];
        return records.reduce((sum, record) => sum + (Number(record[field]) || 0), 0);
      }
    }

    if (formulaText.includes('Count(')) {
      const records = Object.values(data)[0]?.records || [];
      return records.length;
    }

    if (formulaText.includes('CurrentDate')) {
      return new Date().toLocaleDateString();
    }

    if (formulaText.includes('PageNumber')) {
      return 1; // TODO: Implémenter la numérotation des pages
    }

    // Retourner le texte tel quel si aucune formule reconnue
    return formulaText;
  }
}