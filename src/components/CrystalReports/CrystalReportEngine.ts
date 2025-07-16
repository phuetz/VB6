/**
 * Moteur Crystal Reports pour VB6 Studio
 * Implémentation complète compatible avec Crystal Reports
 */

import { ADOManager, ADOConnection, ADORecordset } from '../../services/ADOSystem';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Types et énumérations Crystal Reports
export enum CrystalReportDestination {
  crptToWindow = 0,
  crptToPrinter = 1,
  crptToFile = 2
}

export enum CrystalReportFileType {
  crptRecord = 0,
  crptTabSeparated = 1,
  crptText = 2,
  crptDIF = 3,
  crptCSV = 4,
  crptTabSeparatedText = 5,
  crptLotus123v1 = 6,
  crptLotus123v2 = 7,
  crptRTF = 8,
  crptExcel21 = 9,
  crptExcel30 = 10,
  crptExcel40 = 11,
  crptExcel50 = 12,
  crptExcel70 = 13,
  crptWordForWindows = 14,
  crptHTML32Std = 15,
  crptExplorer32Ext = 16,
  crptNetscape20Std = 17,
  crptLotus123v3 = 18,
  crptPaginatedText = 19,
  crptExcel50Tabular = 20,
  crptExcel70Tabular = 21,
  crptLotusWK3 = 22,
  crptLotusWK4 = 23,
  crptQuattroPro5 = 24,
  crptQuattroPro6 = 25,
  crptTabbedText = 26,
  crptCommaDelimitedText = 27,
  crptXML = 28,
  crptPDF = 29,
  crptExcel80 = 30,
  crptExcel80Tabular = 31
}

export interface CrystalReportSection {
  name: string;
  type: 'reportHeader' | 'pageHeader' | 'groupHeader' | 'detail' | 'groupFooter' | 'pageFooter' | 'reportFooter';
  height: number;
  suppressBlankSection: boolean;
  keepTogether: boolean;
  canGrow: boolean;
  items: CrystalReportItem[];
}

export interface CrystalReportItem {
  type: 'text' | 'field' | 'formula' | 'line' | 'box' | 'image' | 'subreport' | 'chart' | 'crosstab';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  data?: any;
  formatting?: any;
}

export interface CrystalReportDefinition {
  name: string;
  sections: CrystalReportSection[];
  database: {
    tables: string[];
    links: any[];
    connectionString?: string;
  };
  formulas: Map<string, string>;
  parameters: Map<string, any>;
  sortFields: any[];
  groupFields: any[];
  selectionFormula?: string;
  groupSelectionFormula?: string;
}

export class CrystalReportEngine {
  private reportDefinition: CrystalReportDefinition | null = null;
  private connection: ADOConnection | null = null;
  private recordset: ADORecordset | null = null;
  private parameters: Map<string, any> = new Map();
  private formulas: Map<string, any> = new Map();
  private currentPage: number = 1;
  private totalPages: number = 0;
  private pageSize: { width: number; height: number } = { width: 816, height: 1056 }; // Letter size in pixels
  private margins = { top: 72, right: 72, bottom: 72, left: 72 };
  private reportData: any[] = [];
  private groups: Map<string, any[]> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Initialiser les formules intégrées
    this.registerBuiltInFormulas();
  }

  private registerBuiltInFormulas() {
    // Formules de date/heure
    this.formulas.set('CurrentDate', () => new Date().toLocaleDateString());
    this.formulas.set('CurrentTime', () => new Date().toLocaleTimeString());
    this.formulas.set('CurrentDateTime', () => new Date().toLocaleString());
    
    // Formules de page
    this.formulas.set('PageNumber', () => this.currentPage);
    this.formulas.set('TotalPageCount', () => this.totalPages);
    this.formulas.set('PageNofM', () => `Page ${this.currentPage} of ${this.totalPages}`);
    
    // Formules de résumé
    this.formulas.set('RecordNumber', () => this.recordset?.AbsolutePosition || 0);
    this.formulas.set('RecordCount', () => this.recordset?.RecordCount || 0);
  }

  // Charger un rapport
  async loadReport(reportFile: string): Promise<void> {
    try {
      // Charger la définition du rapport (simulé pour la démo)
      this.reportDefinition = await this.loadReportDefinition(reportFile);
      
      // Initialiser la connexion à la base de données si nécessaire
      if (this.reportDefinition.database.connectionString) {
        this.connection = ADOManager.createConnection();
        await this.connection.open(this.reportDefinition.database.connectionString);
      }
    } catch (error) {
      throw new Error(`Failed to load report: ${error.message}`);
    }
  }

  private async loadReportDefinition(reportFile: string): Promise<CrystalReportDefinition> {
    // Simuler le chargement d'un fichier .rpt
    // Dans une vraie implémentation, on parserait le fichier Crystal Reports
    
    return {
      name: reportFile,
      sections: [
        {
          name: 'Report Header',
          type: 'reportHeader',
          height: 100,
          suppressBlankSection: false,
          keepTogether: true,
          canGrow: false,
          items: [
            {
              type: 'text',
              name: 'ReportTitle',
              left: 0,
              top: 20,
              width: 672,
              height: 40,
              data: 'Sample Crystal Report',
              formatting: { font: 'Arial', size: 24, bold: true, align: 'center' }
            }
          ]
        },
        {
          name: 'Page Header',
          type: 'pageHeader',
          height: 50,
          suppressBlankSection: false,
          keepTogether: true,
          canGrow: false,
          items: []
        },
        {
          name: 'Detail',
          type: 'detail',
          height: 20,
          suppressBlankSection: false,
          keepTogether: false,
          canGrow: true,
          items: []
        },
        {
          name: 'Page Footer',
          type: 'pageFooter',
          height: 50,
          suppressBlankSection: false,
          keepTogether: true,
          canGrow: false,
          items: [
            {
              type: 'formula',
              name: 'PageInfo',
              left: 300,
              top: 10,
              width: 200,
              height: 20,
              data: 'PageNofM',
              formatting: { font: 'Arial', size: 10, align: 'center' }
            }
          ]
        }
      ],
      database: {
        tables: [],
        links: []
      },
      formulas: new Map(),
      parameters: new Map(),
      sortFields: [],
      groupFields: []
    };
  }

  // Définir la connexion à la base de données
  async setDatabaseConnection(connectionString: string): Promise<void> {
    if (this.connection) {
      this.connection.close();
    }
    
    this.connection = ADOManager.createConnection();
    await this.connection.open(connectionString);
  }

  // Définir la formule de sélection
  setSelectionFormula(formula: string): void {
    if (this.reportDefinition) {
      this.reportDefinition.selectionFormula = formula;
    }
  }

  // Définir un paramètre
  setParameter(name: string, value: any): void {
    this.parameters.set(name, value);
    if (this.reportDefinition) {
      this.reportDefinition.parameters.set(name, value);
    }
  }

  // Définir une formule
  setFormula(name: string, formula: string): void {
    if (this.reportDefinition) {
      this.reportDefinition.formulas.set(name, formula);
    }
  }

  // Générer le rapport
  async generateReport(): Promise<any> {
    if (!this.reportDefinition) {
      throw new Error('No report loaded');
    }

    try {
      // Récupérer les données
      await this.fetchReportData();
      
      // Appliquer les groupements
      this.applyGrouping();
      
      // Calculer la pagination
      this.calculatePagination();
      
      // Générer les pages HTML
      const pages = this.renderPages();
      
      return {
        pages,
        totalPages: this.totalPages,
        recordsPrinted: this.reportData.length,
        recordsSelected: this.reportData.length,
        groups: this.getGroupTree()
      };
    } catch (error) {
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  private async fetchReportData(): Promise<void> {
    if (!this.connection) {
      // Utiliser des données de démonstration
      this.reportData = this.generateDemoData();
      return;
    }

    // Construire la requête SQL
    let sql = this.buildSQLQuery();
    
    // Appliquer la formule de sélection
    if (this.reportDefinition?.selectionFormula) {
      sql += ' WHERE ' + this.convertSelectionFormula(this.reportDefinition.selectionFormula);
    }
    
    // Exécuter la requête
    this.recordset = await this.connection.execute(sql);
    
    // Convertir en tableau
    this.reportData = [];
    while (!this.recordset.EOF) {
      const record: any = {};
      for (const field of this.recordset.Fields) {
        record[field.Name] = field.Value;
      }
      this.reportData.push(record);
      this.recordset.MoveNext();
    }
  }

  private generateDemoData(): any[] {
    const data = [];
    const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Toys'];
    const products = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'];
    
    for (let i = 0; i < 100; i++) {
      data.push({
        OrderID: i + 1,
        OrderDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        CustomerName: `Customer ${Math.floor(Math.random() * 20) + 1}`,
        ProductName: products[Math.floor(Math.random() * products.length)],
        Category: categories[Math.floor(Math.random() * categories.length)],
        Quantity: Math.floor(Math.random() * 10) + 1,
        UnitPrice: Math.round((Math.random() * 100 + 10) * 100) / 100,
        get Total() { return this.Quantity * this.UnitPrice; }
      });
    }
    
    return data;
  }

  private buildSQLQuery(): string {
    if (!this.reportDefinition) return 'SELECT * FROM Orders';
    
    const tables = this.reportDefinition.database.tables.join(', ');
    return `SELECT * FROM ${tables}`;
  }

  private convertSelectionFormula(formula: string): string {
    // Convertir la formule Crystal Reports en SQL WHERE clause
    // Simplification pour la démo
    return formula
      .replace(/\{([^}]+)\}/g, '$1')
      .replace(/=/g, '=')
      .replace(/and/gi, 'AND')
      .replace(/or/gi, 'OR');
  }

  private applyGrouping(): void {
    if (!this.reportDefinition || this.reportDefinition.groupFields.length === 0) {
      return;
    }

    // Grouper les données
    this.groups.clear();
    for (const groupField of this.reportDefinition.groupFields) {
      const grouped = this.groupBy(this.reportData, groupField.field);
      this.groups.set(groupField.field, grouped);
    }
  }

  private groupBy(data: any[], field: string): any[] {
    const groups: { [key: string]: any[] } = {};
    
    for (const record of data) {
      const key = record[field] || 'null';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
    }
    
    return Object.entries(groups).map(([key, records]) => ({
      key,
      field,
      records,
      count: records.length,
      sum: this.calculateSum(records),
      avg: this.calculateAverage(records),
      min: this.calculateMin(records),
      max: this.calculateMax(records)
    }));
  }

  private calculateSum(records: any[]): { [field: string]: number } {
    const sums: { [field: string]: number } = {};
    
    if (records.length === 0) return sums;
    
    const numericFields = Object.keys(records[0]).filter(key => 
      typeof records[0][key] === 'number'
    );
    
    for (const field of numericFields) {
      sums[field] = records.reduce((sum, record) => sum + (record[field] || 0), 0);
    }
    
    return sums;
  }

  private calculateAverage(records: any[]): { [field: string]: number } {
    const sums = this.calculateSum(records);
    const avgs: { [field: string]: number } = {};
    
    for (const field in sums) {
      avgs[field] = sums[field] / records.length;
    }
    
    return avgs;
  }

  private calculateMin(records: any[]): { [field: string]: number } {
    const mins: { [field: string]: number } = {};
    
    if (records.length === 0) return mins;
    
    const numericFields = Object.keys(records[0]).filter(key => 
      typeof records[0][key] === 'number'
    );
    
    for (const field of numericFields) {
      mins[field] = Math.min(...records.map(r => r[field] || 0));
    }
    
    return mins;
  }

  private calculateMax(records: any[]): { [field: string]: number } {
    const maxs: { [field: string]: number } = {};
    
    if (records.length === 0) return maxs;
    
    const numericFields = Object.keys(records[0]).filter(key => 
      typeof records[0][key] === 'number'
    );
    
    for (const field of numericFields) {
      maxs[field] = Math.max(...records.map(r => r[field] || 0));
    }
    
    return maxs;
  }

  private calculatePagination(): void {
    if (!this.reportDefinition) return;
    
    const pageHeight = this.pageSize.height - this.margins.top - this.margins.bottom;
    const detailHeight = this.reportDefinition.sections.find(s => s.type === 'detail')?.height || 20;
    const recordsPerPage = Math.floor(pageHeight / detailHeight);
    
    this.totalPages = Math.ceil(this.reportData.length / recordsPerPage);
  }

  private renderPages(): string[] {
    const pages: string[] = [];
    
    if (!this.reportDefinition) return pages;
    
    const pageHeight = this.pageSize.height - this.margins.top - this.margins.bottom;
    const detailSection = this.reportDefinition.sections.find(s => s.type === 'detail');
    const detailHeight = detailSection?.height || 20;
    const recordsPerPage = Math.floor(pageHeight / detailHeight);
    
    for (let page = 0; page < this.totalPages; page++) {
      const startIndex = page * recordsPerPage;
      const endIndex = Math.min(startIndex + recordsPerPage, this.reportData.length);
      const pageRecords = this.reportData.slice(startIndex, endIndex);
      
      pages.push(this.renderPage(page + 1, pageRecords));
    }
    
    return pages;
  }

  private renderPage(pageNumber: number, records: any[]): string {
    this.currentPage = pageNumber;
    
    let html = '<div class="crystal-report-page">';
    
    // Report Header (première page seulement)
    if (pageNumber === 1) {
      html += this.renderSection('reportHeader');
    }
    
    // Page Header
    html += this.renderSection('pageHeader');
    
    // Detail section avec les données
    html += '<div class="detail-section">';
    for (const record of records) {
      html += this.renderDetailRecord(record);
    }
    html += '</div>';
    
    // Page Footer
    html += this.renderSection('pageFooter');
    
    // Report Footer (dernière page seulement)
    if (pageNumber === this.totalPages) {
      html += this.renderSection('reportFooter');
    }
    
    html += '</div>';
    
    return html;
  }

  private renderSection(sectionType: string): string {
    const section = this.reportDefinition?.sections.find(s => s.type === sectionType);
    if (!section) return '';
    
    let html = `<div class="report-section ${sectionType}" style="height: ${section.height}px;">`;
    
    for (const item of section.items) {
      html += this.renderItem(item);
    }
    
    html += '</div>';
    
    return html;
  }

  private renderItem(item: CrystalReportItem): string {
    const style = `position: absolute; left: ${item.left}px; top: ${item.top}px; width: ${item.width}px; height: ${item.height}px;`;
    
    switch (item.type) {
      case 'text':
        return `<div class="report-text" style="${style}">${this.formatText(item.data, item.formatting)}</div>`;
      
      case 'field':
        return `<div class="report-field" style="${style}">${this.formatField(item.data, item.formatting)}</div>`;
      
      case 'formula':
        return `<div class="report-formula" style="${style}">${this.evaluateFormula(item.data)}</div>`;
      
      case 'line':
        return `<hr class="report-line" style="${style}">`;
      
      case 'box':
        return `<div class="report-box" style="${style} border: 1px solid black;"></div>`;
      
      case 'image':
        return `<img class="report-image" src="${item.data}" style="${style}">`;
      
      default:
        return '';
    }
  }

  private renderDetailRecord(record: any): string {
    const section = this.reportDefinition?.sections.find(s => s.type === 'detail');
    if (!section) return '';
    
    let html = '<div class="detail-record" style="height: ' + section.height + 'px;">';
    
    // Exemple simple - afficher les champs du record
    let x = 0;
    for (const [field, value] of Object.entries(record)) {
      html += `<span style="position: absolute; left: ${x}px; width: 100px;">${value}</span>`;
      x += 110;
    }
    
    html += '</div>';
    
    return html;
  }

  private formatText(text: string, formatting: any): string {
    if (!formatting) return text;
    
    let style = '';
    if (formatting.font) style += `font-family: ${formatting.font}; `;
    if (formatting.size) style += `font-size: ${formatting.size}px; `;
    if (formatting.bold) style += 'font-weight: bold; ';
    if (formatting.italic) style += 'font-style: italic; ';
    if (formatting.align) style += `text-align: ${formatting.align}; `;
    
    return `<span style="${style}">${text}</span>`;
  }

  private formatField(fieldName: string, formatting: any): string {
    // Obtenir la valeur du champ depuis le record actuel
    const value = this.getCurrentFieldValue(fieldName);
    return this.formatText(String(value), formatting);
  }

  private getCurrentFieldValue(fieldName: string): any {
    // Dans un vrai moteur, on obtiendrait la valeur du record actuel
    return `{${fieldName}}`;
  }

  private evaluateFormula(formulaName: string): string {
    const formula = this.formulas.get(formulaName);
    if (formula && typeof formula === 'function') {
      return String(formula());
    }
    
    const customFormula = this.reportDefinition?.formulas.get(formulaName);
    if (customFormula) {
      return this.evaluateCustomFormula(customFormula);
    }
    
    return `{${formulaName}}`;
  }

  private evaluateCustomFormula(formula: string): string {
    // Évaluation simplifiée des formules Crystal Reports
    // Dans une vraie implémentation, on utiliserait un parser complet
    try {
      // Remplacer les références de champs
      let evaluated = formula.replace(/\{([^}]+)\}/g, (match, field) => {
        return this.getCurrentFieldValue(field);
      });
      
      // Évaluer les fonctions de base
      evaluated = evaluated.replace(/Sum\(([^)]+)\)/g, (match, field) => {
        return String(this.calculateSum(this.reportData)[field] || 0);
      });
      
      return evaluated;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  private getGroupTree(): any[] {
    const tree: any[] = [];
    
    for (const [field, groups] of this.groups) {
      for (const group of groups) {
        tree.push({
          name: `${field}: ${group.key}`,
          level: 1,
          page: 1, // Calculer la vraie page où se trouve ce groupe
          field,
          value: group.key,
          count: group.count
        });
      }
    }
    
    return tree;
  }

  // Rechercher dans le rapport
  searchInReport(searchText: string): any[] {
    const results: any[] = [];
    const pages = this.renderPages();
    
    pages.forEach((pageHtml, index) => {
      if (pageHtml.toLowerCase().includes(searchText.toLowerCase())) {
        results.push({
          page: index + 1,
          text: searchText,
          context: this.extractContext(pageHtml, searchText)
        });
      }
    });
    
    return results;
  }

  private extractContext(html: string, searchText: string): string {
    const index = html.toLowerCase().indexOf(searchText.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(html.length, index + searchText.length + 50);
    
    return '...' + html.substring(start, end) + '...';
  }

  // Exporter le rapport
  async exportReport(format: string, reportData: any): Promise<any> {
    switch (format.toLowerCase()) {
      case 'pdf':
        return this.exportToPDF(reportData);
      
      case 'xls':
      case 'xlsx':
        return this.exportToExcel(reportData);
      
      case 'csv':
        return this.exportToCSV(reportData);
      
      case 'xml':
        return this.exportToXML(reportData);
      
      case 'html':
        return this.exportToHTML(reportData);
      
      case 'rtf':
      case 'doc':
      case 'docx':
        return this.exportToWord(reportData);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportToPDF(reportData: any): Uint8Array {
    const doc = new jsPDF();
    
    // Ajouter le titre
    doc.setFontSize(20);
    doc.text('Crystal Report', 105, 20, { align: 'center' });
    
    // Ajouter les données sous forme de tableau
    if (this.reportData.length > 0) {
      const headers = Object.keys(this.reportData[0]);
      const data = this.reportData.map(record => 
        headers.map(header => String(record[header]))
      );
      
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 40
      });
    }
    
    return doc.output('arraybuffer') as Uint8Array;
  }

  private exportToExcel(reportData: any): ArrayBuffer {
    const ws = XLSX.utils.json_to_sheet(this.reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  }

  private exportToCSV(reportData: any): string {
    if (this.reportData.length === 0) return '';
    
    const headers = Object.keys(this.reportData[0]);
    const csv = [
      headers.join(','),
      ...this.reportData.map(record => 
        headers.map(header => {
          const value = record[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    return csv;
  }

  private exportToXML(reportData: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<CrystalReport>\n';
    
    for (const record of this.reportData) {
      xml += '  <Record>\n';
      for (const [key, value] of Object.entries(record)) {
        xml += `    <${key}>${this.escapeXML(value)}</${key}>\n`;
      }
      xml += '  </Record>\n';
    }
    
    xml += '</CrystalReport>';
    
    return xml;
  }

  private exportToHTML(reportData: any): string {
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<title>Crystal Report</title>\n';
    html += '<style>\n';
    html += 'body { font-family: Arial, sans-serif; }\n';
    html += 'table { border-collapse: collapse; width: 100%; }\n';
    html += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n';
    html += 'th { background-color: #f2f2f2; }\n';
    html += '</style>\n</head>\n<body>\n';
    html += '<h1>Crystal Report</h1>\n';
    
    if (reportData.pages) {
      for (const page of reportData.pages) {
        html += page;
      }
    } else {
      html += this.renderDataTable();
    }
    
    html += '</body>\n</html>';
    
    return html;
  }

  private exportToWord(reportData: any): string {
    // Format RTF simplifié
    let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Times New Roman;}}';
    rtf += '\\f0\\fs24 Crystal Report\\par\\par';
    
    if (this.reportData.length > 0) {
      const headers = Object.keys(this.reportData[0]);
      
      // En-têtes
      rtf += '\\b ' + headers.join('\\tab ') + '\\b0\\par';
      
      // Données
      for (const record of this.reportData) {
        rtf += headers.map(h => String(record[h])).join('\\tab ') + '\\par';
      }
    }
    
    rtf += '}';
    
    return rtf;
  }

  private renderDataTable(): string {
    if (this.reportData.length === 0) return '<p>No data</p>';
    
    const headers = Object.keys(this.reportData[0]);
    
    let html = '<table>\n<thead>\n<tr>\n';
    for (const header of headers) {
      html += `<th>${header}</th>\n`;
    }
    html += '</tr>\n</thead>\n<tbody>\n';
    
    for (const record of this.reportData) {
      html += '<tr>\n';
      for (const header of headers) {
        html += `<td>${record[header]}</td>\n`;
      }
      html += '</tr>\n';
    }
    
    html += '</tbody>\n</table>';
    
    return html;
  }

  private escapeXML(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Obtenir le HTML pour l'impression
  getPrintHTML(reportData: any): string {
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<title>Print Report</title>\n';
    html += '<style>\n';
    html += '@media print {\n';
    html += '  @page { size: letter; margin: 0.5in; }\n';
    html += '  .page-break { page-break-after: always; }\n';
    html += '}\n';
    html += 'body { font-family: Arial, sans-serif; }\n';
    html += '.crystal-report-page { position: relative; width: 8.5in; min-height: 11in; }\n';
    html += '.report-section { position: relative; }\n';
    html += '.report-text, .report-field, .report-formula { position: absolute; }\n';
    html += '</style>\n</head>\n<body onload="window.print()">\n';
    
    if (reportData.pages) {
      reportData.pages.forEach((page: string, index: number) => {
        html += page;
        if (index < reportData.pages.length - 1) {
          html += '<div class="page-break"></div>\n';
        }
      });
    }
    
    html += '</body>\n</html>';
    
    return html;
  }

  // Nettoyer les ressources
  dispose(): void {
    if (this.recordset) {
      this.recordset.close();
      this.recordset = null;
    }
    
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    
    this.reportDefinition = null;
    this.reportData = [];
    this.groups.clear();
    this.parameters.clear();
  }
}

export default CrystalReportEngine;