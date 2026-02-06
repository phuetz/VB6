import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  Settings,
  FileText,
  Eye,
} from 'lucide-react';
import {
  vb6ReportEngine,
  ReportDefinition,
  ReportOutput,
  ReportPage,
  ReportPageElement,
  ReportFieldType,
} from '../../services/VB6ReportEngine';
import { sanitizeHTML } from '../../utils/htmlSanitizer';

interface ReportViewerProps {
  visible: boolean;
  onClose: () => void;
  reportId?: string;
  reportOutput?: ReportOutput;
  parameters?: { [key: string]: any };
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  visible,
  onClose,
  reportId,
  reportOutput: initialReportOutput,
  parameters = {},
}) => {
  const [reportOutput, setReportOutput] = useState<ReportOutput | null>(
    initialReportOutput || null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const viewerRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Load report when component mounts or reportId changes
  useEffect(() => {
    if (visible && reportId && !initialReportOutput) {
      loadReport();
    }
  }, [visible, reportId, initialReportOutput]);

  const loadReport = async () => {
    if (!reportId) return;

    setIsLoading(true);
    setError(null);

    try {
      const output = await vb6ReportEngine.generateReport(reportId, parameters);
      setReportOutput(output);
      setCurrentPage(1);
    } catch (err: any) {
      setError(`Failed to generate report: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () =>
    setCurrentPage(Math.min(reportOutput?.totalPages || 1, currentPage + 1));
  const goToLastPage = () => setCurrentPage(reportOutput?.totalPages || 1);

  // Zoom functions
  const zoomIn = () => setZoom(Math.min(zoom + 25, 400));
  const zoomOut = () => setZoom(Math.max(zoom - 25, 25));
  const zoomToFit = () => {
    if (viewerRef.current && reportOutput) {
      const containerWidth = viewerRef.current.clientWidth - 40; // Account for padding
      const pageWidth = reportOutput.pages[0]?.width || 595;
      const newZoom = Math.floor((containerWidth / pageWidth) * 100);
      setZoom(Math.min(Math.max(newZoom, 25), 400));
    }
  };

  // Print function
  const printReport = () => {
    if (!reportOutput) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = generatePrintHTML();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Export to PDF function
  const exportToPDF = () => {
    if (!reportOutput) return;

    // In a real implementation, this would use a PDF library like jsPDF
  };

  // Generate HTML for printing
  const generatePrintHTML = (): string => {
    if (!reportOutput) return '';

    const pagesHTML = reportOutput.pages
      .map(
        (page, index) =>
          `<div class="print-page" style="
        width: ${page.width}px;
        height: ${page.height}px;
        position: relative;
        page-break-after: ${index < reportOutput.pages.length - 1 ? 'always' : 'auto'};
        margin: 0;
        padding: 0;
        background: white;
      ">
        ${renderPageElementsHTML(page)}
      </div>`
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportOutput.report.title}</title>
          <style>
            @page { 
              margin: 0; 
              size: ${reportOutput.report.pageSettings.orientation === 'landscape' ? 'landscape' : 'portrait'};
            }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: Arial, sans-serif; 
            }
            .print-page { 
              background: white;
            }
            .element {
              position: absolute;
              overflow: hidden;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          ${pagesHTML}
        </body>
      </html>
    `;
  };

  // Render page elements as HTML
  const renderPageElementsHTML = (page: ReportPage): string => {
    return page.elements
      .map(
        element => `
      <div class="element" style="
        left: ${element.x}px;
        top: ${element.y}px;
        width: ${element.width}px;
        height: ${element.height}px;
        font-family: ${element.formatting.fontFamily};
        font-size: ${element.formatting.fontSize}px;
        font-weight: ${element.formatting.fontWeight};
        font-style: ${element.formatting.fontStyle};
        text-decoration: ${element.formatting.textDecoration};
        color: ${element.formatting.color};
        background-color: ${element.formatting.backgroundColor !== 'transparent' ? element.formatting.backgroundColor : 'transparent'};
        text-align: ${element.formatting.alignment};
        border-style: ${element.formatting.borderStyle};
        border-color: ${element.formatting.borderColor};
        border-width: ${element.formatting.borderWidth}px;
        padding: ${element.formatting.padding}px;
      ">
        ${escapeHTML(element.value)}
      </div>
    `
      )
      .join('');
  };

  // Escape HTML for safe rendering - using safer approach
  const escapeHTML = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  // Render page element
  const renderPageElement = (element: ReportPageElement) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x * (zoom / 100)}px`,
      top: `${element.y * (zoom / 100)}px`,
      width: `${element.width * (zoom / 100)}px`,
      height: `${element.height * (zoom / 100)}px`,
      fontFamily: element.formatting.fontFamily,
      fontSize: `${element.formatting.fontSize * (zoom / 100)}px`,
      fontWeight: element.formatting.fontWeight,
      fontStyle: element.formatting.fontStyle,
      textDecoration: element.formatting.textDecoration,
      color: element.formatting.color,
      backgroundColor:
        element.formatting.backgroundColor !== 'transparent'
          ? element.formatting.backgroundColor
          : undefined,
      textAlign: element.formatting.alignment,
      borderStyle: element.formatting.borderStyle,
      borderColor: element.formatting.borderColor,
      borderWidth: `${element.formatting.borderWidth}px`,
      padding: `${element.formatting.padding * (zoom / 100)}px`,
      overflow: 'hidden',
      wordWrap: element.formatting.wordWrap ? 'break-word' : 'normal',
    };

    const content = element.value;

    // Highlight search results
    if (searchTerm && content.toLowerCase().includes(searchTerm.toLowerCase())) {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      const highlightedContent = content.replace(regex, '<mark>$1</mark>');

      // SECURITY: HTML sanitizé via DOMPurify (TASK-004)
      return (
        <div
          key={element.id}
          style={style}
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(highlightedContent) }}
        />
      );
    }

    // Render different field types
    switch (element.type) {
      case ReportFieldType.Image:
        return (
          <div key={element.id} style={style}>
            <img
              src={content}
              alt="Report Image"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiLz4KPHA+Tm8gSW1hZ2U8L3A+Cjwvc3ZnPgo=';
              }}
            />
          </div>
        );

      case ReportFieldType.Barcode:
        return (
          <div key={element.id} style={style} className="flex items-center justify-center">
            <div className="text-xs text-gray-500">[Barcode: {content}]</div>
          </div>
        );

      case ReportFieldType.Line:
        return (
          <div
            key={element.id}
            style={{
              ...style,
              borderTop: `${element.formatting.borderWidth}px ${element.formatting.borderStyle} ${element.formatting.borderColor}`,
              height: '0px',
            }}
          />
        );

      case ReportFieldType.Box:
        return (
          <div
            key={element.id}
            style={{
              ...style,
              border: `${element.formatting.borderWidth}px ${element.formatting.borderStyle} ${element.formatting.borderColor}`,
              backgroundColor:
                element.formatting.backgroundColor !== 'transparent'
                  ? element.formatting.backgroundColor
                  : 'transparent',
            }}
          />
        );

      default:
        return (
          <div key={element.id} style={style}>
            {content}
          </div>
        );
    }
  };

  // Render current page
  const renderPage = () => {
    if (!reportOutput || !reportOutput.pages[currentPage - 1]) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          No page to display
        </div>
      );
    }

    const page = reportOutput.pages[currentPage - 1];

    return (
      <div className="flex justify-center p-8">
        <div
          className="bg-white shadow-lg relative"
          style={{
            width: `${page.width * (zoom / 100)}px`,
            height: `${page.height * (zoom / 100)}px`,
            minHeight: '400px',
          }}
        >
          {page.elements.map(renderPageElement)}
        </div>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl w-[1000px] h-[700px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              Report Viewer - {reportOutput?.report.title || 'Report'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={printReport}
              disabled={!reportOutput}
              className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={exportToPDF}
              disabled={!reportOutput}
              className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
            >
              <Download size={14} />
              PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
              title="First Page"
            >
              <ChevronLeft size={16} />
              <ChevronLeft size={16} className="-ml-2" />
            </button>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm text-gray-600 mx-2">
              Page {currentPage} of {reportOutput?.totalPages || 0}
            </span>

            <button
              onClick={goToNextPage}
              disabled={currentPage === (reportOutput?.totalPages || 0)}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={goToLastPage}
              disabled={currentPage === (reportOutput?.totalPages || 0)}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
              title="Last Page"
            >
              <ChevronRight size={16} />
              <ChevronRight size={16} className="-ml-2" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <button onClick={zoomOut} className="p-1 hover:bg-gray-200 rounded" title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">{zoom}%</span>
            <button onClick={zoomIn} className="p-1 hover:bg-gray-200 rounded" title="Zoom In">
              <ZoomIn size={16} />
            </button>
            <button
              onClick={zoomToFit}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Fit to Width"
            >
              Fit
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search in report..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Report Info */}
          {reportOutput && (
            <div className="text-xs text-gray-500">
              {reportOutput.totalRecords} records • Generated{' '}
              {reportOutput.generatedAt.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-600">Generating report...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 mb-2">Error</div>
                <div className="text-sm text-gray-600">{error}</div>
                <button
                  onClick={loadReport}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div ref={viewerRef} className="h-full overflow-auto bg-gray-100">
              {renderPage()}
            </div>
          )}
        </div>

        {/* Status Bar */}
        {reportOutput && (
          <div className="px-6 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            {reportOutput.report.name} • {reportOutput.pages.length} pages •{' '}
            {reportOutput.totalRecords} records
          </div>
        )}
      </div>

      {/* Hidden print div for better print formatting */}
      <div ref={printRef} className="hidden">
        {reportOutput &&
          reportOutput.pages.map((page, index) => (
            <div
              key={index}
              style={{
                width: `${page.width}px`,
                height: `${page.height}px`,
                position: 'relative',
                pageBreakAfter: index < reportOutput.pages.length - 1 ? 'always' : 'auto',
                background: 'white',
              }}
            >
              {page.elements.map(element => (
                <div
                  key={element.id}
                  style={{
                    position: 'absolute',
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${element.width}px`,
                    height: `${element.height}px`,
                    fontFamily: element.formatting.fontFamily,
                    fontSize: `${element.formatting.fontSize}px`,
                    fontWeight: element.formatting.fontWeight,
                    fontStyle: element.formatting.fontStyle,
                    textDecoration: element.formatting.textDecoration,
                    color: element.formatting.color,
                    backgroundColor:
                      element.formatting.backgroundColor !== 'transparent'
                        ? element.formatting.backgroundColor
                        : undefined,
                    textAlign: element.formatting.alignment,
                    borderStyle: element.formatting.borderStyle,
                    borderColor: element.formatting.borderColor,
                    borderWidth: `${element.formatting.borderWidth}px`,
                    padding: `${element.formatting.padding}px`,
                    overflow: 'hidden',
                  }}
                >
                  {element.value}
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

export default ReportViewer;
