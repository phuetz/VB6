/**
 * VB6 Print Preview Component
 * Provides print preview functionality for forms and reports
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PrintableElement {
  type: 'text' | 'line' | 'rectangle' | 'circle' | 'image' | 'control';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  fontSize?: number;
  fontName?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  fontUnderline?: boolean;
  foreColor?: string;
  backColor?: string;
  fillColor?: string;
  fillStyle?: number;
  borderWidth?: number;
  borderColor?: string;
  alignment?: 'left' | 'center' | 'right';
  imageData?: string;
  radius?: number;
}

export interface PrintPage {
  elements: PrintableElement[];
  pageNumber: number;
  orientation: 'portrait' | 'landscape';
}

export interface PrintDocumentOptions {
  title?: string;
  copies?: number;
  orientation?: 'portrait' | 'landscape';
  paperSize?: PaperSize;
  margins?: PrintMargins;
  scaleMode?: 'twips' | 'points' | 'pixels' | 'inches' | 'millimeters';
  colorMode?: 'color' | 'monochrome';
}

export interface PrintMargins {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type PaperSize =
  | 'letter'      // 8.5" x 11"
  | 'legal'       // 8.5" x 14"
  | 'a4'          // 210mm x 297mm
  | 'a3'          // 297mm x 420mm
  | 'a5'          // 148mm x 210mm
  | 'b5'          // 176mm x 250mm
  | 'executive'   // 7.25" x 10.5"
  | 'tabloid';    // 11" x 17"

interface PaperDimensions {
  width: number;  // in points (72 points = 1 inch)
  height: number;
}

const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
  a4: { width: 595, height: 842 },
  a3: { width: 842, height: 1190 },
  a5: { width: 420, height: 595 },
  b5: { width: 499, height: 709 },
  executive: { width: 522, height: 756 },
  tabloid: { width: 792, height: 1224 }
};

// ============================================================================
// VB6 Printer Object Emulation
// ============================================================================

export class VB6Printer {
  private _elements: PrintableElement[] = [];
  private _pages: PrintPage[] = [];
  private _currentX: number = 0;
  private _currentY: number = 0;
  private _scaleMode: number = 1; // 1 = twips
  private _font: {
    name: string;
    size: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  } = {
    name: 'Arial',
    size: 12,
    bold: false,
    italic: false,
    underline: false
  };
  private _foreColor: string = '#000000';
  private _fillColor: string = '#FFFFFF';
  private _fillStyle: number = 0; // 0 = solid, 1 = transparent
  private _drawWidth: number = 1;
  private _drawStyle: number = 0;
  private _orientation: 'portrait' | 'landscape' = 'portrait';
  private _paperSize: PaperSize = 'letter';
  private _margins: PrintMargins = { left: 72, top: 72, right: 72, bottom: 72 };

  // Scale factors (twips to points)
  private get scaleFactor(): number {
    switch (this._scaleMode) {
      case 0: return 1; // User-defined
      case 1: return 1 / 20; // Twips (1440 twips/inch, 72 points/inch)
      case 2: return 1; // Points
      case 3: return 1; // Pixels (approximate)
      case 4: return 72; // Characters
      case 5: return 72; // Inches
      case 6: return 72 / 25.4; // Millimeters
      case 7: return 72 / 2.54; // Centimeters
      default: return 1;
    }
  }

  // Properties
  get CurrentX(): number { return this._currentX; }
  set CurrentX(value: number) { this._currentX = value; }

  get CurrentY(): number { return this._currentY; }
  set CurrentY(value: number) { this._currentY = value; }

  get ScaleMode(): number { return this._scaleMode; }
  set ScaleMode(value: number) { this._scaleMode = value; }

  get FontName(): string { return this._font.name; }
  set FontName(value: string) { this._font.name = value; }

  get FontSize(): number { return this._font.size; }
  set FontSize(value: number) { this._font.size = value; }

  get FontBold(): boolean { return this._font.bold; }
  set FontBold(value: boolean) { this._font.bold = value; }

  get FontItalic(): boolean { return this._font.italic; }
  set FontItalic(value: boolean) { this._font.italic = value; }

  get FontUnderline(): boolean { return this._font.underline; }
  set FontUnderline(value: boolean) { this._font.underline = value; }

  get ForeColor(): string { return this._foreColor; }
  set ForeColor(value: string) { this._foreColor = value; }

  get FillColor(): string { return this._fillColor; }
  set FillColor(value: string) { this._fillColor = value; }

  get FillStyle(): number { return this._fillStyle; }
  set FillStyle(value: number) { this._fillStyle = value; }

  get DrawWidth(): number { return this._drawWidth; }
  set DrawWidth(value: number) { this._drawWidth = value; }

  get DrawStyle(): number { return this._drawStyle; }
  set DrawStyle(value: number) { this._drawStyle = value; }

  get Orientation(): number { return this._orientation === 'portrait' ? 1 : 2; }
  set Orientation(value: number) { this._orientation = value === 1 ? 'portrait' : 'landscape'; }

  get PaperSize(): PaperSize { return this._paperSize; }
  set PaperSize(value: PaperSize) { this._paperSize = value; }

  get Page(): number { return this._pages.length + 1; }

  get ScaleWidth(): number {
    const paper = PAPER_SIZES[this._paperSize];
    const width = this._orientation === 'portrait' ? paper.width : paper.height;
    return (width - this._margins.left - this._margins.right) / this.scaleFactor;
  }

  get ScaleHeight(): number {
    const paper = PAPER_SIZES[this._paperSize];
    const height = this._orientation === 'portrait' ? paper.height : paper.width;
    return (height - this._margins.top - this._margins.bottom) / this.scaleFactor;
  }

  // ============================================================================
  // Drawing Methods
  // ============================================================================

  /**
   * Print text at current position
   */
  Print(...args: any[]): void {
    const text = args.map(arg => String(arg ?? '')).join('');

    this._elements.push({
      type: 'text',
      x: this._currentX * this.scaleFactor + this._margins.left,
      y: this._currentY * this.scaleFactor + this._margins.top,
      content: text,
      fontSize: this._font.size,
      fontName: this._font.name,
      fontBold: this._font.bold,
      fontItalic: this._font.italic,
      fontUnderline: this._font.underline,
      foreColor: this._foreColor
    });

    // Move to next line
    this._currentY += this._font.size * 1.2 / this.scaleFactor;
    this._currentX = 0;
  }

  /**
   * Draw a line
   */
  Line(x1: number, y1: number, x2: number, y2: number, color?: string, boxMode?: string): void {
    const scaledX1 = x1 * this.scaleFactor + this._margins.left;
    const scaledY1 = y1 * this.scaleFactor + this._margins.top;
    const scaledX2 = x2 * this.scaleFactor + this._margins.left;
    const scaledY2 = y2 * this.scaleFactor + this._margins.top;

    if (boxMode === 'B' || boxMode === 'BF') {
      this._elements.push({
        type: 'rectangle',
        x: scaledX1,
        y: scaledY1,
        width: scaledX2 - scaledX1,
        height: scaledY2 - scaledY1,
        borderColor: color || this._foreColor,
        borderWidth: this._drawWidth,
        fillColor: boxMode === 'BF' ? this._fillColor : 'transparent',
        fillStyle: this._fillStyle
      });
    } else {
      this._elements.push({
        type: 'line',
        x: scaledX1,
        y: scaledY1,
        width: scaledX2 - scaledX1,
        height: scaledY2 - scaledY1,
        borderColor: color || this._foreColor,
        borderWidth: this._drawWidth
      });
    }

    this._currentX = x2;
    this._currentY = y2;
  }

  /**
   * Draw a circle or arc
   */
  Circle(x: number, y: number, radius: number, color?: string): void {
    this._elements.push({
      type: 'circle',
      x: x * this.scaleFactor + this._margins.left,
      y: y * this.scaleFactor + this._margins.top,
      radius: radius * this.scaleFactor,
      borderColor: color || this._foreColor,
      borderWidth: this._drawWidth,
      fillColor: this._fillStyle === 0 ? this._fillColor : 'transparent'
    });
  }

  /**
   * Draw a point
   */
  PSet(x: number, y: number, color?: string): void {
    this._elements.push({
      type: 'circle',
      x: x * this.scaleFactor + this._margins.left,
      y: y * this.scaleFactor + this._margins.top,
      radius: this._drawWidth / 2,
      fillColor: color || this._foreColor
    });
  }

  /**
   * Print image
   */
  PaintPicture(imageData: string, x: number, y: number, width?: number, height?: number): void {
    this._elements.push({
      type: 'image',
      x: x * this.scaleFactor + this._margins.left,
      y: y * this.scaleFactor + this._margins.top,
      width: width ? width * this.scaleFactor : undefined,
      height: height ? height * this.scaleFactor : undefined,
      imageData
    });
  }

  /**
   * Get text width in current font
   */
  TextWidth(text: string): number {
    // Approximate text width calculation
    const avgCharWidth = this._font.size * 0.6;
    return (text.length * avgCharWidth) / this.scaleFactor;
  }

  /**
   * Get text height in current font
   */
  TextHeight(text: string): number {
    return this._font.size * 1.2 / this.scaleFactor;
  }

  // ============================================================================
  // Page Control
  // ============================================================================

  /**
   * Start a new page
   */
  NewPage(): void {
    if (this._elements.length > 0) {
      this._pages.push({
        elements: [...this._elements],
        pageNumber: this._pages.length + 1,
        orientation: this._orientation
      });
      this._elements = [];
    }
    this._currentX = 0;
    this._currentY = 0;
  }

  /**
   * End the document (finish last page)
   */
  EndDoc(): PrintPage[] {
    if (this._elements.length > 0) {
      this._pages.push({
        elements: [...this._elements],
        pageNumber: this._pages.length + 1,
        orientation: this._orientation
      });
    }

    const pages = [...this._pages];
    this._pages = [];
    this._elements = [];
    this._currentX = 0;
    this._currentY = 0;

    return pages;
  }

  /**
   * Cancel printing
   */
  KillDoc(): void {
    this._pages = [];
    this._elements = [];
    this._currentX = 0;
    this._currentY = 0;
  }

  /**
   * Get paper dimensions
   */
  GetPaperDimensions(): PaperDimensions {
    const paper = PAPER_SIZES[this._paperSize];
    if (this._orientation === 'landscape') {
      return { width: paper.height, height: paper.width };
    }
    return paper;
  }

  /**
   * Set margins
   */
  SetMargins(left: number, top: number, right: number, bottom: number): void {
    this._margins = { left, top, right, bottom };
  }
}

// ============================================================================
// Print Preview Component Props
// ============================================================================

interface VB6PrintPreviewProps {
  pages: PrintPage[];
  paperSize?: PaperSize;
  onPrint?: () => void;
  onClose?: () => void;
  title?: string;
}

// ============================================================================
// Print Preview Component
// ============================================================================

export const VB6PrintPreview: React.FC<VB6PrintPreviewProps> = ({
  pages,
  paperSize = 'letter',
  onPrint,
  onClose,
  title = 'Print Preview'
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const paperDimensions = useMemo(() => {
    const dimensions = PAPER_SIZES[paperSize];
    const page = pages[currentPage - 1];
    if (page?.orientation === 'landscape') {
      return { width: dimensions.height, height: dimensions.width };
    }
    return dimensions;
  }, [paperSize, pages, currentPage]);

  const renderPage = useCallback((ctx: CanvasRenderingContext2D, page: PrintPage) => {
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const scale = zoom / 100;

    for (const element of page.elements) {
      const x = element.x * scale;
      const y = element.y * scale;

      switch (element.type) {
        case 'text':
          ctx.save();
          ctx.fillStyle = element.foreColor || '#000000';

          let fontStyle = '';
          if (element.fontBold) fontStyle += 'bold ';
          if (element.fontItalic) fontStyle += 'italic ';
          ctx.font = `${fontStyle}${(element.fontSize || 12) * scale}px ${element.fontName || 'Arial'}`;

          ctx.fillText(element.content || '', x, y + (element.fontSize || 12) * scale);

          if (element.fontUnderline) {
            const textWidth = ctx.measureText(element.content || '').width;
            ctx.beginPath();
            ctx.moveTo(x, y + (element.fontSize || 12) * scale + 2);
            ctx.lineTo(x + textWidth, y + (element.fontSize || 12) * scale + 2);
            ctx.stroke();
          }
          ctx.restore();
          break;

        case 'line':
          ctx.save();
          ctx.strokeStyle = element.borderColor || '#000000';
          ctx.lineWidth = (element.borderWidth || 1) * scale;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + (element.width || 0) * scale, y + (element.height || 0) * scale);
          ctx.stroke();
          ctx.restore();
          break;

        case 'rectangle':
          ctx.save();
          if (element.fillColor && element.fillColor !== 'transparent') {
            ctx.fillStyle = element.fillColor;
            ctx.fillRect(x, y, (element.width || 0) * scale, (element.height || 0) * scale);
          }
          if (element.borderColor) {
            ctx.strokeStyle = element.borderColor;
            ctx.lineWidth = (element.borderWidth || 1) * scale;
            ctx.strokeRect(x, y, (element.width || 0) * scale, (element.height || 0) * scale);
          }
          ctx.restore();
          break;

        case 'circle':
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, (element.radius || 10) * scale, 0, Math.PI * 2);
          if (element.fillColor && element.fillColor !== 'transparent') {
            ctx.fillStyle = element.fillColor;
            ctx.fill();
          }
          if (element.borderColor) {
            ctx.strokeStyle = element.borderColor;
            ctx.lineWidth = (element.borderWidth || 1) * scale;
            ctx.stroke();
          }
          ctx.restore();
          break;

        case 'image':
          if (element.imageData) {
            const img = new Image();
            img.src = element.imageData;
            img.onload = () => {
              const imgWidth = element.width ? element.width * scale : img.width * scale;
              const imgHeight = element.height ? element.height * scale : img.height * scale;
              ctx.drawImage(img, x, y, imgWidth, imgHeight);
            };
          }
          break;
      }
    }

    // Draw page border
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pages.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const page = pages[currentPage - 1];
    if (!page) return;

    // Set canvas size based on paper and zoom
    canvas.width = paperDimensions.width * (zoom / 100);
    canvas.height = paperDimensions.height * (zoom / 100);

    renderPage(ctx, page);
  }, [currentPage, pages, zoom, paperDimensions, renderPage]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: ${paperSize}; margin: 0; }
          @media print {
            body { margin: 0; padding: 0; }
            .page { page-break-after: always; }
            .page:last-child { page-break-after: auto; }
          }
          body { font-family: Arial, sans-serif; }
          .page { position: relative; width: ${paperDimensions.width}pt; height: ${paperDimensions.height}pt; }
        </style>
      </head>
      <body>
    `);

    for (const page of pages) {
      printWindow.document.write('<div class="page">');
      for (const element of page.elements) {
        if (element.type === 'text') {
          let style = `position:absolute;left:${element.x}pt;top:${element.y}pt;`;
          style += `font-size:${element.fontSize || 12}pt;`;
          style += `font-family:${element.fontName || 'Arial'};`;
          style += `color:${element.foreColor || '#000000'};`;
          if (element.fontBold) style += 'font-weight:bold;';
          if (element.fontItalic) style += 'font-style:italic;';
          if (element.fontUnderline) style += 'text-decoration:underline;';
          printWindow.document.write(`<div style="${style}">${element.content || ''}</div>`);
        }
      }
      printWindow.document.write('</div>');
    }

    printWindow.document.write('</body></html>');
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    onPrint?.();
  }, [pages, paperDimensions, paperSize, title, onPrint]);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#F0F0F0',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: '#E8E8E8',
      borderBottom: '1px solid #CCCCCC'
    },
    toolbarButton: {
      padding: '4px 12px',
      border: '1px solid #999999',
      borderRadius: '2px',
      backgroundColor: '#FFFFFF',
      cursor: 'pointer',
      fontSize: '12px'
    },
    toolbarSeparator: {
      width: '1px',
      height: '24px',
      backgroundColor: '#CCCCCC',
      margin: '0 8px'
    },
    pageInfo: {
      fontSize: '12px',
      color: '#333333'
    },
    zoomSelect: {
      padding: '4px 8px',
      border: '1px solid #999999',
      borderRadius: '2px',
      backgroundColor: '#FFFFFF',
      fontSize: '12px'
    },
    previewArea: {
      flex: 1,
      overflow: 'auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '20px',
      backgroundColor: '#808080'
    },
    canvasContainer: {
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      backgroundColor: '#FFFFFF'
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: '#E8E8E8',
      borderTop: '1px solid #CCCCCC'
    },
    footerButton: {
      padding: '6px 20px',
      border: '1px solid #999999',
      borderRadius: '2px',
      backgroundColor: '#FFFFFF',
      cursor: 'pointer',
      fontSize: '12px',
      minWidth: '80px'
    },
    printButton: {
      backgroundColor: '#0078D7',
      color: '#FFFFFF',
      border: '1px solid #0078D7'
    }
  };

  if (pages.length === 0) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.previewArea, justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#FFFFFF' }}>No pages to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <button
          style={styles.toolbarButton}
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          |◀
        </button>
        <button
          style={styles.toolbarButton}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ◀
        </button>
        <span style={styles.pageInfo}>
          Page {currentPage} of {pages.length}
        </span>
        <button
          style={styles.toolbarButton}
          onClick={() => setCurrentPage(p => Math.min(pages.length, p + 1))}
          disabled={currentPage === pages.length}
        >
          ▶
        </button>
        <button
          style={styles.toolbarButton}
          onClick={() => setCurrentPage(pages.length)}
          disabled={currentPage === pages.length}
        >
          ▶|
        </button>

        <div style={styles.toolbarSeparator} />

        <label style={styles.pageInfo}>Zoom:</label>
        <select
          style={styles.zoomSelect}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        >
          <option value={50}>50%</option>
          <option value={75}>75%</option>
          <option value={100}>100%</option>
          <option value={125}>125%</option>
          <option value={150}>150%</option>
          <option value={200}>200%</option>
        </select>
      </div>

      {/* Preview Area */}
      <div style={styles.previewArea}>
        <div style={styles.canvasContainer}>
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button
          style={{ ...styles.footerButton, ...styles.printButton }}
          onClick={handlePrint}
        >
          Print
        </button>
        {onClose && (
          <button style={styles.footerButton} onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Print Preview Dialog Component
// ============================================================================

interface VB6PrintPreviewDialogProps {
  isOpen: boolean;
  pages: PrintPage[];
  paperSize?: PaperSize;
  title?: string;
  onPrint?: () => void;
  onClose: () => void;
}

export const VB6PrintPreviewDialog: React.FC<VB6PrintPreviewDialogProps> = ({
  isOpen,
  pages,
  paperSize,
  title,
  onPrint,
  onClose
}) => {
  if (!isOpen) return null;

  const dialogStyles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    },
    dialog: {
      width: '90vw',
      height: '90vh',
      backgroundColor: '#F0F0F0',
      border: '2px solid #333333',
      display: 'flex',
      flexDirection: 'column'
    },
    titleBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 8px',
      backgroundColor: '#000080',
      color: '#FFFFFF',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontSize: '16px',
      padding: '0 4px'
    },
    content: {
      flex: 1,
      overflow: 'hidden'
    }
  };

  return (
    <div style={dialogStyles.overlay} onClick={onClose}>
      <div style={dialogStyles.dialog} onClick={e => e.stopPropagation()}>
        <div style={dialogStyles.titleBar}>
          <span>{title || 'Print Preview'}</span>
          <button style={dialogStyles.closeButton} onClick={onClose}>✕</button>
        </div>
        <div style={dialogStyles.content}>
          <VB6PrintPreview
            pages={pages}
            paperSize={paperSize}
            title={title}
            onPrint={onPrint}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Report Builder Helper
// ============================================================================

export class VB6ReportBuilder {
  private printer: VB6Printer;
  private _headerCallback?: () => void;
  private _footerCallback?: () => void;
  private _pageHeight: number;
  private _contentStartY: number = 72;
  private _footerHeight: number = 72;

  constructor() {
    this.printer = new VB6Printer();
    this._pageHeight = this.printer.GetPaperDimensions().height;
  }

  get Printer(): VB6Printer {
    return this.printer;
  }

  /**
   * Set page header callback
   */
  SetHeader(callback: () => void): void {
    this._headerCallback = callback;
  }

  /**
   * Set page footer callback
   */
  SetFooter(callback: () => void, height: number = 72): void {
    this._footerCallback = callback;
    this._footerHeight = height;
  }

  /**
   * Print header on current page
   */
  PrintHeader(): void {
    if (this._headerCallback) {
      this.printer.CurrentX = 0;
      this.printer.CurrentY = 0;
      this._headerCallback();
      this._contentStartY = this.printer.CurrentY;
    }
  }

  /**
   * Print footer on current page
   */
  PrintFooter(): void {
    if (this._footerCallback) {
      this.printer.CurrentY = this._pageHeight - this._footerHeight;
      this._footerCallback();
    }
  }

  /**
   * Check if new page is needed
   */
  CheckNewPage(requiredHeight: number): boolean {
    const maxY = this._pageHeight - this._footerHeight;
    if (this.printer.CurrentY + requiredHeight > maxY) {
      this.PrintFooter();
      this.printer.NewPage();
      this.PrintHeader();
      return true;
    }
    return false;
  }

  /**
   * Begin report
   */
  BeginReport(): void {
    this.printer.KillDoc();
    this.PrintHeader();
  }

  /**
   * End report and get pages
   */
  EndReport(): PrintPage[] {
    this.PrintFooter();
    return this.printer.EndDoc();
  }
}

// ============================================================================
// Global Printer Instance
// ============================================================================

export const Printer = new VB6Printer();

// ============================================================================
// Export
// ============================================================================

export default {
  VB6Printer,
  VB6PrintPreview,
  VB6PrintPreviewDialog,
  VB6ReportBuilder,
  Printer,
  PAPER_SIZES
};
