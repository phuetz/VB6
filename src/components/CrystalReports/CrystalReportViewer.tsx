/**
 * Crystal Reports Viewer Component
 * Complete implementation for VB6 Crystal Reports compatibility
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Printer,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  Play,
  Square
} from 'lucide-react';
import { useVB6Store } from '../../stores/vb6Store';
import { VB6ControlPropsEnhanced } from '../Controls/VB6ControlsEnhanced';
import { sanitizeReport } from '../../utils/htmlSanitizer';
import AnimatedButton from '../UI/AnimatedButton';

interface ReportParameter {
  name: string;
  value: any;
  type: 'string' | 'number' | 'date' | 'boolean';
  promptText?: string;
}

interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'word' | 'html' | 'csv' | 'xml' | 'rtf' | 'txt';
  fileName: string;
  includePageHeaders?: boolean;
  includePageFooters?: boolean;
}

interface CrystalReportProps extends VB6ControlPropsEnhanced {
  // Report Properties
  reportFileName: string;
  reportSource: 0 | 1; // 0=crptReport, 1=crptCrystal
  destination: 0 | 1 | 2; // 0=crptToWindow, 1=crptToPrinter, 2=crptToFile
  printFileName?: string;
  printFileType?: number;
  
  // Window Properties
  windowTitle?: string;
  windowLeft?: number;
  windowTop?: number;
  windowWidth?: number;
  windowHeight?: number;
  windowState?: 0 | 1 | 2; // 0=Normal, 1=Minimized, 2=Maximized
  windowBorderStyle?: 0 | 1 | 2; // 0=NoBorder, 1=FixedSingle, 2=Sizable
  windowControlBox?: boolean;
  windowMaxButton?: boolean;
  windowMinButton?: boolean;
  windowShowCloseButton?: boolean;
  windowShowNavigationControls?: boolean;
  windowShowCancelButton?: boolean;
  windowShowPrintButton?: boolean;
  windowShowExportButton?: boolean;
  windowShowZoomControl?: boolean;
  windowShowProgressControls?: boolean;
  windowShowSearchButton?: boolean;
  windowShowPrintSetupButton?: boolean;
  windowShowRefreshButton?: boolean;
  windowShowGroupTree?: boolean;
  
  // Data Properties
  selectionFormula?: string;
  groupSelectionFormula?: string;
  formulas?: string[];
  sortFields?: string[];
  groupSortFields?: string[];
  sqlQuery?: string;
  connect?: string;
  userName?: string;
  password?: string;
  
  // Report Properties
  reportTitle?: string;
  reportSubject?: string;
  reportAuthor?: string;
  reportKeywords?: string;
  reportComments?: string;
  reportTemplate?: string;
  parameterFields?: ReportParameter[];
  storedProcParams?: any[];
  logonInfo?: any[];
  databaseLogonTimeout?: number;
  discardSavedData?: boolean;
  
  // Printer Properties
  printerName?: string;
  printerDriver?: string;
  printerPort?: string;
  copiesToPrinter?: number;
  printerCollation?: boolean;
  printerStartPage?: number;
  printerStopPage?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  
  // Action Property
  action?: number;
  dataFiles?: string[];
  pageZoom?: number | string;
  pageNumber?: number;
  progressDialog?: boolean;
  
  // Status Properties (readonly)
  status?: 0 | 1 | 2 | 3; // 0=Busy, 1=Cancelled, 2=Error, 3=JobCompleted
  recordsPrinted?: number;
  recordsSelected?: number;
  recordsProcessed?: number;
  recordsRead?: number;
  
  // Print Options
  printerDuplex?: 0 | 1 | 2 | 3; // 0=Default, 1=Simplex, 2=Horizontal, 3=Vertical
  printerOrientation?: 0 | 1 | 2; // 0=Default, 1=Portrait, 2=Landscape
  printerPaperSize?: number;
  printerPaperSource?: number;
  printerTray?: string;
  
  // Advanced Properties
  sessionHandle?: number;
  boundReportFooter?: boolean;
  boundReportHeading?: string;
  maxLinesPerPage?: number;
}

export const CrystalReportViewer = forwardRef<HTMLDivElement, CrystalReportProps>((props, ref) => {
  const {
    id, name, left, top, width, height, visible, enabled,
    reportFileName = '',
    reportSource = 0,
    destination = 0,
    printFileName = '',
    printFileType = 0,
    windowTitle = 'Crystal Report Viewer',
    windowLeft = 0,
    windowTop = 0,
    windowWidth = 800,
    windowHeight = 600,
    windowState = 0,
    windowBorderStyle = 2,
    windowControlBox = true,
    windowMaxButton = true,
    windowMinButton = true,
    windowShowCloseButton = true,
    windowShowNavigationControls = true,
    windowShowCancelButton = true,
    windowShowPrintButton = true,
    windowShowExportButton = true,
    windowShowZoomControl = true,
    windowShowProgressControls = true,
    windowShowSearchButton = true,
    windowShowPrintSetupButton = true,
    windowShowRefreshButton = true,
    windowShowGroupTree = true,
    selectionFormula = '',
    groupSelectionFormula = '',
    formulas = [],
    sortFields = [],
    groupSortFields = [],
    sqlQuery = '',
    connect = '',
    userName = '',
    password = '',
    reportTitle = '',
    reportSubject = '',
    reportAuthor = '',
    reportKeywords = '',
    reportComments = '',
    reportTemplate = '',
    parameterFields = [],
    storedProcParams = [],
    logonInfo = [],
    databaseLogonTimeout = 15,
    discardSavedData = false,
    printerName = '',
    printerDriver = '',
    printerPort = '',
    copiesToPrinter = 1,
    printerCollation = true,
    printerStartPage = 1,
    printerStopPage = 999999,
    marginLeft = 0,
    marginRight = 0,
    marginTop = 0,
    marginBottom = 0,
    action = 0,
    dataFiles = [],
    pageZoom = 100,
    pageNumber = 1,
    progressDialog = true,
    status = 0,
    recordsPrinted = 0,
    recordsSelected = 0,
    recordsProcessed = 0,
    recordsRead = 0,
    printerDuplex = 0,
    printerOrientation = 0,
    printerPaperSize = 0,
    printerPaperSource = 0,
    printerTray = '',
    sessionHandle = 0,
    boundReportFooter = false,
    boundReportHeading = '',
    maxLinesPerPage = 0,
    tag = '',
    toolTipText = '',
    ...rest
  } = props;

  const [reportData, setReportData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(typeof pageZoom === 'number' ? pageZoom : 100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGroupTree, setShowGroupTree] = useState(windowShowGroupTree);
  const [showParameterDialog, setShowParameterDialog] = useState(false);
  const [currentParameters, setCurrentParameters] = useState<ReportParameter[]>(parameterFields);
  const [searchText, setSearchText] = useState('');
  const [exportOptions, setExportOptions] = useState<ReportExportOptions>({
    format: 'pdf',
    fileName: 'report',
  });

  const viewerRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // Load report
  useEffect(() => {
    if (reportFileName && action === 1) { // crptPrintReport
      loadReport();
    }
  }, [reportFileName, action]);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    updateControl(id, 'status', 0); // Busy
    
    try {
      fireEvent(name, 'ReadingRecords', { recordsRead: 0 });
      
      const response = await fetch('/api/reports/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportFileName,
          reportSource,
          selectionFormula,
          groupSelectionFormula,
          formulas,
          sortFields,
          groupSortFields,
          sqlQuery,
          connect,
          userName,
          password,
          parameters: currentParameters,
          dataFiles,
          discardSavedData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load report');
      }

      const data = await response.json();
      setReportData(data);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(1);
      
      updateControl(id, 'recordsRead', data.recordsRead || 0);
      updateControl(id, 'recordsSelected', data.recordsSelected || 0);
      updateControl(id, 'status', 3); // JobCompleted
      
      fireEvent(name, 'LoadComplete', { 
        recordsRead: data.recordsRead,
        recordsSelected: data.recordsSelected,
      });
      
    } catch (err) {
      setError(err.message);
      updateControl(id, 'status', 2); // Error
      fireEvent(name, 'Error', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshReport = useCallback(() => {
    if (action === 6) { // crptRefresh
      loadReport();
    }
  }, [action]);

  const printReport = useCallback(async () => {
    if (!reportData) return;
    
    try {
      if (destination === 0) { // To Window
        window.print();
      } else if (destination === 1) { // To Printer
        const response = await fetch('/api/reports/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportData,
            printerName,
            printerDriver,
            printerPort,
            copies: copiesToPrinter,
            collation: printerCollation,
            startPage: printerStartPage,
            stopPage: printerStopPage,
            duplex: printerDuplex,
            orientation: printerOrientation,
            paperSize: printerPaperSize,
            paperSource: printerPaperSource,
            tray: printerTray,
            margins: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
          }),
        });
        
        if (response.ok) {
          fireEvent(name, 'PrintComplete', { pages: printerStopPage - printerStartPage + 1 });
        }
      } else if (destination === 2) { // To File
        exportReport({ format: 'pdf', fileName: printFileName });
      }
    } catch (err) {
      fireEvent(name, 'PrintError', { error: err.message });
    }
  }, [reportData, destination, printerName, copiesToPrinter]);

  const exportReport = useCallback(async (options: ReportExportOptions) => {
    if (!reportData) return;
    
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData,
          format: options.format,
          fileName: options.fileName,
          options,
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${options.fileName}.${options.format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        fireEvent(name, 'ExportComplete', { format: options.format });
      }
    } catch (err) {
      fireEvent(name, 'ExportError', { error: err.message });
    }
  }, [reportData, name, fireEvent]);

  const navigateToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateControl(id, 'pageNumber', page);
      fireEvent(name, 'NavigateToPage', { page });
    }
  }, [totalPages, id, name, fireEvent, updateControl]);

  const handleZoom = useCallback((zoom: number | string) => {
    if (typeof zoom === 'number') {
      setZoomLevel(Math.max(25, Math.min(400, zoom)));
    } else if (zoom === 'FitWidth') {
      // Calculate zoom to fit width
      if (viewerRef.current) {
        const viewerWidth = viewerRef.current.clientWidth;
        const pageWidth = 816; // Standard page width in pixels
        setZoomLevel(Math.floor((viewerWidth / pageWidth) * 100));
      }
    } else if (zoom === 'FitPage') {
      // Calculate zoom to fit page
      if (viewerRef.current) {
        const viewerHeight = viewerRef.current.clientHeight;
        const pageHeight = 1056; // Standard page height in pixels
        setZoomLevel(Math.floor((viewerHeight / pageHeight) * 100));
      }
    }
    updateControl(id, 'pageZoom', zoom);
  }, [id, updateControl]);

  const searchInReport = useCallback((text: string) => {
    setSearchText(text);
    // Implement search logic
    fireEvent(name, 'Search', { searchText: text });
  }, [name, fireEvent]);

  const handleParameterChange = (paramName: string, value: any) => {
    const updatedParams = currentParameters.map(p => 
      p.name === paramName ? { ...p, value } : p
    );
    setCurrentParameters(updatedParams);
  };

  const applyParameters = () => {
    setShowParameterDialog(false);
    updateControl(id, 'parameterFields', currentParameters);
    loadReport();
  };

  // Render toolbar
  const renderToolbar = () => (
    <div style={toolbarStyle}>
      {windowShowNavigationControls && (
        <>
          <AnimatedButton
            onClick={() => navigateToPage(1)}
            disabled={currentPage === 1}
            variant="ghost"
            size="sm"
            icon={ChevronsLeft}
            className="!p-2"
          />
          <AnimatedButton
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="ghost"
            size="sm"
            icon={ChevronLeft}
            className="!p-2"
          />
          <input
            type="number"
            value={currentPage}
            onChange={(e) => navigateToPage(parseInt(e.target.value) || 1)}
            style={pageInputStyle}
            min={1}
            max={totalPages}
          />
          <span style={{ margin: '0 8px' }}>of {totalPages}</span>
          <AnimatedButton
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="ghost"
            size="sm"
            icon={ChevronRight}
            className="!p-2"
          />
          <AnimatedButton
            onClick={() => navigateToPage(totalPages)}
            disabled={currentPage === totalPages}
            variant="ghost"
            size="sm"
            icon={ChevronsRight}
            className="!p-2"
          />
        </>
      )}
      
      {windowShowZoomControl && (
        <>
          <select value={zoomLevel} onChange={(e) => handleZoom(parseInt(e.target.value))} style={selectStyle}>
            <option value={25}>25%</option>
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
            <option value={200}>200%</option>
            <option value={400}>400%</option>
          </select>
          <AnimatedButton
            onClick={() => handleZoom('FitWidth')}
            variant="ghost"
            size="sm"
            icon={ZoomIn}
            className="!p-2"
          >
            Fit Width
          </AnimatedButton>
          <AnimatedButton
            onClick={() => handleZoom('FitPage')}
            variant="ghost"
            size="sm"
            icon={Maximize2}
            className="!p-2"
          >
            Fit Page
          </AnimatedButton>
        </>
      )}
      
      {windowShowSearchButton && (
        <>
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchInReport(searchText)}
            style={searchInputStyle}
          />
          <AnimatedButton
            onClick={() => searchInReport(searchText)}
            variant="ghost"
            size="sm"
            icon={Search}
            className="!p-2"
          />
        </>
      )}
      
      {windowShowPrintButton && (
        <AnimatedButton
          onClick={printReport}
          variant="ghost"
          size="sm"
          icon={Printer}
          className="!p-2"
        />
      )}
      
      {windowShowExportButton && (
        <AnimatedButton
          onClick={() => setExportOptions({ ...exportOptions })}
          variant="ghost"
          size="sm"
          icon={Download}
          className="!p-2"
        />
      )}
      
      {windowShowRefreshButton && (
        <AnimatedButton
          onClick={refreshReport}
          variant="ghost"
          size="sm"
          icon={RefreshCw}
          className="!p-2"
        />
      )}
      
      {windowShowPrintSetupButton && (
        <AnimatedButton
          onClick={() => fireEvent(name, 'PrintSetup', {})}
          variant="ghost"
          size="sm"
          icon={Settings}
          className="!p-2"
        />
      )}
      
      {parameterFields.length > 0 && (
        <AnimatedButton
          onClick={() => setShowParameterDialog(true)}
          variant="ghost"
          size="sm"
          icon={BarChart3}
          className="!p-2"
        >
          Parameters
        </AnimatedButton>
      )}
    </div>
  );

  // Render parameter dialog
  const renderParameterDialog = () => (
    <div style={dialogOverlayStyle}>
      <div style={dialogStyle}>
        <h3>Report Parameters</h3>
        {currentParameters.map((param) => (
          <div key={param.name} style={parameterRowStyle}>
            <label>{param.promptText || param.name}:</label>
            {param.type === 'boolean' ? (
              <input
                type="checkbox"
                checked={param.value || false}
                onChange={(e) => handleParameterChange(param.name, e.target.checked)}
              />
            ) : param.type === 'date' ? (
              <input
                type="date"
                value={param.value || ''}
                onChange={(e) => handleParameterChange(param.name, e.target.value)}
              />
            ) : param.type === 'number' ? (
              <input
                type="number"
                value={param.value || 0}
                onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
              />
            ) : (
              <input
                type="text"
                value={param.value || ''}
                onChange={(e) => handleParameterChange(param.name, e.target.value)}
              />
            )}
          </div>
        ))}
        <div style={dialogButtonsStyle}>
          <AnimatedButton onClick={applyParameters} variant="primary" size="sm">
            Apply
          </AnimatedButton>
          <AnimatedButton onClick={() => setShowParameterDialog(false)} variant="secondary" size="sm">
            Cancel
          </AnimatedButton>
        </div>
      </div>
    </div>
  );

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    display: visible ? 'flex' : 'none',
    flexDirection: 'column',
    backgroundColor: '#F0F0F0',
    border: windowBorderStyle === 0 ? 'none' : windowBorderStyle === 1 ? '1px solid #808080' : '2px solid #0078D7',
    overflow: 'hidden',
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px',
    backgroundColor: '#E0E0E0',
    borderBottom: '1px solid #C0C0C0',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  };

  const groupTreeStyle: React.CSSProperties = {
    width: '200px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #C0C0C0',
    overflow: 'auto',
    padding: '8px',
  };

  const viewerStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#808080',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  };

  const pageStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    transform: `scale(${zoomLevel / 100})`,
    transformOrigin: 'top center',
    minWidth: '816px',
    minHeight: '1056px',
    padding: '40px',
  };

  const pageInputStyle: React.CSSProperties = {
    width: '50px',
    padding: '2px 4px',
    textAlign: 'center',
  };

  const selectStyle: React.CSSProperties = {
    padding: '2px 4px',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '150px',
    padding: '2px 4px',
  };

  const dialogOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    borderRadius: '4px',
    minWidth: '400px',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
  };

  const parameterRowStyle: React.CSSProperties = {
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const dialogButtonsStyle: React.CSSProperties = {
    marginTop: '20px',
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  };

  return (
    <div ref={ref} style={containerStyle} title={toolTipText} data-name={name} data-tag={tag} {...rest}>
      {windowControlBox && renderToolbar()}
      
      <div style={contentStyle}>
        {showGroupTree && windowShowGroupTree && (
          <div style={groupTreeStyle}>
            <h4>Report Groups</h4>
            {/* Render group tree here */}
          </div>
        )}
        
        <div ref={viewerRef} style={viewerStyle}>
          {isLoading && (
            <div>Loading report...</div>
          )}
          
          {error && (
            <div style={{ color: 'red' }}>Error: {error}</div>
          )}
          
          {reportData && !isLoading && !error && (
            <div style={pageStyle}>
              {/* Render report content here */}
              {/* SECURITY: HTML sanitizé via DOMPurify (TASK-004) */}
              <div dangerouslySetInnerHTML={{
                __html: sanitizeReport(reportData.pages?.[currentPage - 1] || '')
              }} />
            </div>
          )}
        </div>
      </div>
      
      {showParameterDialog && renderParameterDialog()}
      
      {progressDialog && isLoading && (
        <div style={dialogOverlayStyle}>
          <div style={{ ...dialogStyle, textAlign: 'center' }}>
            <h3>Processing Report...</h3>
            <p>Records Read: {recordsRead}</p>
            <p>Records Selected: {recordsSelected}</p>
            {windowShowCancelButton && (
              <AnimatedButton 
                onClick={() => updateControl(id, 'status', 1)} 
                variant="danger" 
                size="sm"
                icon={Square}
              >
                Cancel
              </AnimatedButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default CrystalReportViewer;