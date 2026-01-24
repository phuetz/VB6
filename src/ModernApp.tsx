import React, { useState, useEffect, lazy, Suspense } from 'react';
import { DragDropProvider } from './components/DragDrop/DragDropProvider';
import { VB6Provider } from './context/VB6Context';
import TitleBar from './components/Layout/TitleBar';
import EnhancedMenuBar from './components/Layout/EnhancedMenuBar';
import ModernToolbar from './components/Layout/ModernToolbar';
import StatusBar from './components/Layout/StatusBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import DialogManager from './components/Dialogs/DialogManager';
import { EnhancedToolbox } from './components/Panels/Toolbox/EnhancedToolbox';
import { AdvancedDragDropCanvas } from './components/DragDrop/AdvancedDragDropCanvas';
import ProjectExplorer from './components/Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from './components/Panels/PropertiesWindow/PropertiesWindow';
import ControlTree from './components/Panels/ControlTree/ControlTree';
import ImmediateWindow from './components/Panels/ImmediateWindow/ImmediateWindow';
import { useVB6Store } from './stores/vb6Store';
import { shallow } from 'zustand/shallow';
import SplashScreen from './components/SplashScreen/SplashScreen';
import { TodoList } from './components/Todo/TodoList';
import { LogPanel } from './components/Debug/LogPanel';
import OptionsDialog from './components/Dialogs/OptionsDialog';
import { useAuth } from './hooks/useAuth';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './index.css';

// ULTRA-OPTIMIZE: Lazy load code editor (heavy dependencies like parser, refactoring, intellisense)
const MonacoCodeEditor = lazy(() => import('./components/Editor/MonacoCodeEditor'));
const EnhancedIntelliSense = lazy(() => import('./components/Editor/EnhancedIntelliSense').then(m => ({ default: m.EnhancedIntelliSense })));

// ULTRA-OPTIMIZE: Lazy load heavy/advanced components
// These are NOT needed for initial app startup
const CodeAnalyzer = lazy(() => import('./components/Analysis/CodeAnalyzer').then(m => ({ default: m.CodeAnalyzer })));
const RefactorTools = lazy(() => import('./components/Refactoring/RefactorTools').then(m => ({ default: m.RefactorTools })));
const VB6SnippetManager = lazy(() => import('./components/Snippets/VB6SnippetManager').then(m => ({ default: m.VB6SnippetManager })));
const BreakpointManager = lazy(() => import('./components/Debugging/BreakpointManager').then(m => ({ default: m.BreakpointManager })));
const ProjectTemplateManager = lazy(() => import('./components/Templates/ProjectTemplateManager').then(m => ({ default: m.ProjectTemplateManager })));
const PerformanceMonitor = lazy(() => import('./components/Performance/PerformanceMonitor').then(m => ({ default: m.PerformanceMonitor })));
const ProjectSetupWizard = lazy(() => import('./components/ProjectWizard/ProjectSetupWizard').then(m => ({ default: m.ProjectSetupWizard })));
const ProjectTemplateWizard = lazy(() => import('./components/ProjectWizard/ProjectTemplateWizard').then(m => ({ default: m.ProjectTemplateWizard })));
const EnhancedErrorList = lazy(() => import('./components/ErrorList/EnhancedErrorList').then(m => ({ default: m.EnhancedErrorList })));
const CommandPalette = lazy(() => import('./components/CommandPalette/CommandPalette').then(m => ({ default: m.CommandPalette })));
const ExportDialog = lazy(() => import('./components/Export/ExportDialog').then(m => ({ default: m.ExportDialog })));
const CodeFormatter = lazy(() => import('./components/Formatting/CodeFormatter').then(m => ({ default: m.CodeFormatter })));
const CodeConverter = lazy(() => import('./components/Converter/CodeConverter').then(m => ({ default: m.CodeConverter })));
const ImportExportDialog = lazy(() => import('./components/Dialogs/ImportExportDialog').then(m => ({ default: m.ImportExportDialog })));
const DatabaseManager = lazy(() => import('./components/Database/DatabaseManager').then(m => ({ default: m.default })));
const ReportDesigner = lazy(() => import('./components/Reports/ReportDesigner').then(m => ({ default: m.ReportDesigner })));
const ReportViewer = lazy(() => import('./components/Reports/ReportViewer').then(m => ({ default: m.ReportViewer })));
const ActiveXManager = lazy(() => import('./components/Dialogs/ActiveXManager').then(m => ({ default: m.ActiveXManager })));
const AIAssistant = lazy(() => import('./components/AI/AIAssistant').then(m => ({ default: m.AIAssistant })));
const CollaborationManager = lazy(() => import('./components/Collaboration/CollaborationManager').then(m => ({ default: m.CollaborationManager })));
const TimeTravelDebugger = lazy(() => import('./components/Debugging/TimeTravelDebugger').then(m => ({ default: m.TimeTravelDebugger })));
const AdvancedCodeConverter = lazy(() => import('./components/Converter/AdvancedCodeConverter').then(m => ({ default: m.AdvancedCodeConverter })));
const Marketplace = lazy(() => import('./components/Marketplace/Marketplace').then(m => ({ default: m.Marketplace })));
const AuthModal = lazy(() => import('./components/Auth/AuthModal').then(m => ({ default: m.default })));
const DiagnosticDashboard = lazy(() => import('./components/Diagnostic/DiagnosticDashboard').then(m => ({ default: m.default })));
const RecoveryPanel = lazy(() => import('./components/Recovery/RecoveryPanel').then(m => ({ default: m.default })));
const VisualDebugger = lazy(() => import('./components/Debug/VisualDebugger').then(m => ({ default: m.default })));
const DebugPanel = lazy(() => import('./components/Debug/DebugPanel').then(m => ({ default: m.default })));
const HotReloadDashboard = lazy(() => import('./components/HotReload/HotReloadDashboard').then(m => ({ default: m.HotReloadDashboard })));
const ASTDiffVisualizer = lazy(() => import('./components/HotReload/ASTDiffVisualizer').then(m => ({ default: m.ASTDiffVisualizer })));

// Simple loading fallback
const LazyComponentFallback = () => (
  <div className="flex items-center justify-center w-full h-full">
    <div className="animate-spin rounded-full h-5 w-5 border border-gray-300 border-t-blue-600"></div>
  </div>
);

interface MainContentProps {
  onShowActiveXManager: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onShowActiveXManager }) => {
  console.log('🔄 MainContent component rendering...');
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const {
    showToolbox,
    showCodeEditor,
    showProjectExplorer,
    showPropertiesWindow,
    showControlTree,
    showImmediateWindow,
    formProperties,
    selectedControls,
  } = useVB6Store(
    (state) => ({
      showToolbox: state.showToolbox,
      showCodeEditor: state.showCodeEditor,
      showProjectExplorer: state.showProjectExplorer,
      showPropertiesWindow: state.showPropertiesWindow,
      showControlTree: state.showControlTree,
      showImmediateWindow: state.showImmediateWindow,
      formProperties: state.formProperties,
      selectedControls: state.selectedControls,
    }),
    shallow
  );
  const updateControls = useVB6Store((state) => state.updateControls);

  const [showLayoutToolbar, setShowLayoutToolbar] = useState(true);

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50">
      {/* Left Panel - Enhanced Toolbox with modern styling */}
      {showToolbox && (
        <div className="w-56 bg-white border-r border-gray-200 shadow-sm animate-slideIn">
          <EnhancedToolbox onShowActiveXManager={onShowActiveXManager} />
        </div>
      )}

      {/* Center Panel - Advanced Canvas or Code Editor */}
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
        {showCodeEditor ? (
          <Suspense fallback={<LazyComponentFallback />}>
            <div className="flex-1 bg-white shadow-inner">
              <MonacoCodeEditor />
            </div>
          </Suspense>
        ) : (
          <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="mx-auto rounded-lg overflow-hidden shadow-2xl animate-scaleIn">
              <AdvancedDragDropCanvas
                width={formProperties.Width}
                height={formProperties.Height}
                backgroundColor={formProperties.BackColor}
              />
            </div>
          </div>
        )}

        {/* Bottom Panel - Immediate Window with modern styling */}
        {showImmediateWindow && (
          <div className="border-t border-gray-200 bg-white shadow-lg animate-slideIn">
            <ImmediateWindow />
          </div>
        )}
      </div>

      {/* Layout Toolbar - Only show when not in code editor mode - will be lazy loaded when needed */}
      {/* Intentionally not shown initially to reduce bundle size */}

      {/* Right Panel - Project Explorer and Properties with modern styling */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-sm animate-slideIn">
        {showProjectExplorer && (
          <div className="border-b border-gray-200">
            <ProjectExplorer />
          </div>
        )}
        {showControlTree && (
          <div className="border-b border-gray-200">
            <ControlTree />
          </div>
        )}
        {showPropertiesWindow && (
          <div className="flex-1">
            <PropertiesWindow />
          </div>
        )}
      </div>
    </div>
  );
};

function ModernApp() {
  console.log('🔄 ModernApp component initializing...');
  const [showSplash, setShowSplash] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  console.log('🔄 Initializing auth hook...');
  const { showAuthModal, requiredFeature, closeAuthModal, user } = useAuth();
  console.log('✅ Auth hook initialized');

  // State for all dialog components
  console.log('🔄 Initializing VB6 store...');
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const {
    showTemplateManager,
    showPerformanceMonitor,
    showOptionsDialog,
    showSnippetManager,
    showTodoList,
  } = useVB6Store(
    (state) => ({
      showTemplateManager: state.showTemplateManager,
      showPerformanceMonitor: state.showPerformanceMonitor,
      showOptionsDialog: state.showOptionsDialog,
      showSnippetManager: state.showSnippetManager,
      showTodoList: state.showTodoList,
    }),
    shallow
  );
  const showDialog = useVB6Store((state) => state.showDialog);
  const toggleWindow = useVB6Store((state) => state.toggleWindow);
  console.log('✅ VB6 store initialized');

  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const [showProjectTemplateWizard, setShowProjectTemplateWizard] = useState(false);
  const [showCodeAnalyzer, setShowCodeAnalyzer] = useState(false);
  const [showRefactorTools, setShowRefactorTools] = useState(false);
  const [showBreakpointManager, setShowBreakpointManager] = useState(false);
  const [showErrorList, setShowErrorList] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCodeFormatter, setShowCodeFormatter] = useState(false);
  const [showCodeConverter, setShowCodeConverter] = useState(false);
  const [showImportExportDialog, setShowImportExportDialog] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export'>('import');
  const [showDatabaseManager, setShowDatabaseManager] = useState(false);
  const [showReportDesigner, setShowReportDesigner] = useState(false);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | undefined>(undefined);
  const [showActiveXManager, setShowActiveXManager] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showHotReloadDashboard, setShowHotReloadDashboard] = useState(false);
  const [showASTDiffVisualizer, setShowASTDiffVisualizer] = useState(false);
  const [astDiffs, setAstDiffs] = useState([]);

  // Hot-reload integration
  const [hotReloadStatus, hotReloadActions] = useHotReload({
    enabled: true,
    autoWatch: true,
    preserveState: true,
    onReloadComplete: (patch) => {
      console.log('🔥 Hot-reload completed:', patch.id);
      setAstDiffs(patch.changes);
      // Auto-show AST diff visualizer for significant changes
      if (patch.changes.length > 5) {
        setShowASTDiffVisualizer(true);
      }
    },
    onReloadError: (error) => {
      console.error('🔥 Hot-reload error:', error);
    }
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      keys: ['n'],
      ctrlKey: true,
      shiftKey: true,
      action: () => setShowProjectTemplateWizard(true),
      description: 'New from Template'
    },
    {
      keys: ['d'],
      ctrlKey: true,
      shiftKey: true,
      action: () => setShowDatabaseManager(true),
      description: 'Database Manager'
    },
    {
      keys: ['r'],
      ctrlKey: true,
      action: () => setShowReportDesigner(true),
      description: 'Report Designer'
    },
    {
      keys: ['F5'],
      action: () => setShowDebugPanel(true),
      description: 'Start Debugging'
    },
    {
      keys: ['F9'],
      action: () => setShowDebugPanel(true),
      description: 'Toggle Breakpoint'
    },
    {
      keys: ['F8'],
      action: () => setShowDebugPanel(true),
      description: 'Step Into'
    },
    {
      keys: ['h'],
      ctrlKey: true,
      shiftKey: true,
      action: () => setShowHotReloadDashboard(true),
      description: 'Hot-Reload Dashboard'
    },
    {
      keys: ['a'],
      ctrlKey: true,
      shiftKey: true,
      action: () => setShowASTDiffVisualizer(true),
      description: 'AST Diff Visualizer'
    }
  ]);

  // Handle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Show splash screen only on first load
  useEffect(() => {
    console.log('🔄 ModernApp checking splash screen state...');
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    console.log('🔄 hasSeenSplash:', hasSeenSplash);
    if (hasSeenSplash) {
      console.log('🔄 Skipping splash screen');
      setShowSplash(false);
    } else {
      console.log('🔄 Will show splash screen');
    }
  }, []);

  const handleSplashComplete = () => {
    console.log('🔄 ModernApp handleSplashComplete called');
    setShowSplash(false);
    localStorage.setItem('hasSeenSplash', 'true');
    console.log('🔄 Splash screen complete, rendering main app');
  };

  if (showSplash) {
    console.log('🔄 Showing splash screen...');
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  console.log('🔄 Rendering main app...');
  return (
    <VB6Provider>
      <DragDropProvider>
        <div
          className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
            darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
          }`}
        >
          <TitleBar />
          <EnhancedMenuBar 
            onShowProjectTemplates={() => setShowProjectTemplateWizard(true)}
            onImportForm={() => {
              setImportExportMode('import');
              setShowImportExportDialog(true);
            }}
            onExportForm={() => {
              setImportExportMode('export');
              setShowImportExportDialog(true);
            }}
            onShowDatabaseManager={() => setShowDatabaseManager(true)}
            onShowReportDesigner={() => setShowReportDesigner(true)}
            onShowDebugPanel={() => setShowDebugPanel(true)}
            onShowHotReloadDashboard={() => setShowHotReloadDashboard(true)}
          />
          <ModernToolbar />
          <ErrorBoundary>
            <MainContent onShowActiveXManager={() => setShowActiveXManager(true)} />
          </ErrorBoundary>
          <StatusBar />
          <DialogManager />

          {/* Debug Log Panel */}
          <LogPanel />

          {/* Template Manager - Lazy loaded */}
          <Suspense fallback={null}>
            <ProjectTemplateManager
              visible={showTemplateManager}
              onClose={() => showDialog('showTemplateManager', false)}
              onCreateProject={template => {
                console.log('Creating project from template:', template);
                showDialog('showTemplateManager', false);
              }}
            />
          </Suspense>

          {/* Performance Monitor - Lazy loaded */}
          <Suspense fallback={null}>
            <PerformanceMonitor
              visible={showPerformanceMonitor}
              onClose={() => toggleWindow('showPerformanceMonitor')}
            />
          </Suspense>

          {/* Project Setup Wizard - Lazy loaded */}
          <Suspense fallback={null}>
            <ProjectSetupWizard
              visible={showProjectWizard}
              onClose={() => setShowProjectWizard(false)}
              onComplete={config => {
                console.log('Project configuration:', config);
                setShowProjectWizard(false);
              }}
            />
          </Suspense>

          {/* Project Template Wizard - Lazy loaded */}
          <Suspense fallback={null}>
            <ProjectTemplateWizard
              visible={showProjectTemplateWizard}
              onClose={() => setShowProjectTemplateWizard(false)}
              onCreateProject={template => {
                console.log('Creating project from template:', template);
                setShowProjectTemplateWizard(false);
              }}
            />
          </Suspense>

          {/* Code Analysis and Refactoring Tools - Lazy loaded */}
          <Suspense fallback={null}>
            <CodeAnalyzer
              visible={showCodeAnalyzer}
              onClose={() => setShowCodeAnalyzer(false)}
              onFixIssue={(issue, fixIndex) => {
                console.log('Applying fix for issue:', issue, 'fix index:', fixIndex);
              }}
              onNavigateToIssue={(file, line, column) => {
                console.log('Navigating to issue:', file, line, column);
              }}
            />
          </Suspense>

          <Suspense fallback={null}>
            <RefactorTools
              visible={showRefactorTools}
              onClose={() => setShowRefactorTools(false)}
              onApplyRefactoring={(type, options) => {
                console.log('Applying refactoring:', type, options);
              }}
            />
          </Suspense>

          <Suspense fallback={null}>
            <BreakpointManager
              visible={showBreakpointManager}
              onClose={() => setShowBreakpointManager(false)}
              breakpoints={[]}
              onAddBreakpoint={bp => {
                console.log('Adding breakpoint:', bp);
              }}
              onRemoveBreakpoint={id => {
                console.log('Removing breakpoint:', id);
              }}
              onUpdateBreakpoint={(id, updates) => {
                console.log('Updating breakpoint:', id, updates);
              }}
              onNavigateToBreakpoint={(file, line) => {
                console.log('Navigating to breakpoint:', file, line);
              }}
            />
          </Suspense>

          {/* Error List - Lazy loaded */}
          <Suspense fallback={null}>
            <EnhancedErrorList
              visible={showErrorList}
              onClose={() => setShowErrorList(false)}
              onNavigateToError={(file, line, column) => {
                console.log('Navigating to error:', file, line, column);
              }}
              onFixError={errorId => {
                console.log('Fix error:', errorId);
              }}
              onClearErrors={() => {
                console.log('Clear all errors');
              }}
            />
          </Suspense>

          {/* Command Palette - Lazy loaded */}
          <Suspense fallback={null}>
            <CommandPalette
              visible={showCommandPalette}
              onClose={() => setShowCommandPalette(false)}
            />
          </Suspense>

          {/* Export Dialog - Lazy loaded */}
          <Suspense fallback={null}>
            <ExportDialog
              visible={showExportDialog}
              onClose={() => setShowExportDialog(false)}
              onExport={(format, options) => {
                console.log('Exporting to', format, 'with options', options);
              }}
            />
          </Suspense>

          {/* Snippet Manager - Lazy loaded */}
          <Suspense fallback={null}>
            <VB6SnippetManager
              visible={showSnippetManager}
              onClose={() => showDialog('showSnippetManager', false)}
              onInsertSnippet={(snippet) => {
                console.log('Insert snippet:', snippet);
                showDialog('showSnippetManager', false);
              }}
            />
          </Suspense>

          {/* Code Formatter - Lazy loaded */}
          <Suspense fallback={null}>
            <CodeFormatter
              visible={showCodeFormatter}
              onClose={() => setShowCodeFormatter(false)}
              onApplyFormatting={formattedCode => {
                console.log('Apply formatting:', formattedCode);
              }}
            />
          </Suspense>

          {/* Code Converter - Lazy loaded */}
          <Suspense fallback={null}>
            <CodeConverter
              visible={showCodeConverter}
              onClose={() => setShowCodeConverter(false)}
              onConvertCode={(code, targetLanguage, options) => {
                console.log('Convert code to', targetLanguage, 'with options', options);
              }}
            />
          </Suspense>

          {/* Import/Export Dialog - Lazy loaded */}
          <Suspense fallback={null}>
            <ImportExportDialog
              visible={showImportExportDialog}
              onClose={() => setShowImportExportDialog(false)}
              mode={importExportMode}
            />
          </Suspense>

          {/* Database Manager - Lazy loaded */}
          <Suspense fallback={null}>
            <DatabaseManager
              visible={showDatabaseManager}
              onClose={() => setShowDatabaseManager(false)}
            />
          </Suspense>

          {/* Report Designer - Lazy loaded */}
          <Suspense fallback={null}>
            <ReportDesigner
              visible={showReportDesigner}
              onClose={() => setShowReportDesigner(false)}
              reportId={currentReportId}
              onSave={(report) => {
                console.log('Report saved:', report);
                setShowReportDesigner(false);
              }}
            />
          </Suspense>

          {/* Report Viewer - Lazy loaded */}
          <Suspense fallback={null}>
            <ReportViewer
              visible={showReportViewer}
              onClose={() => setShowReportViewer(false)}
              reportId={currentReportId}
            />
          </Suspense>

          {/* ActiveX Manager - Lazy loaded */}
          <Suspense fallback={null}>
            <ActiveXManager
              visible={showActiveXManager}
              onClose={() => setShowActiveXManager(false)}
              onInsertControl={(progId, properties) => {
                console.log('Insert ActiveX control:', progId, properties);
              }}
            />
          </Suspense>

          {/* Revolutionary New Components - Lazy loaded */}
          <Suspense fallback={null}>
            <AIAssistant />
          </Suspense>

          <Suspense fallback={null}>
            <CollaborationManager />
          </Suspense>

          <Suspense fallback={null}>
            <TimeTravelDebugger />
          </Suspense>

          <Suspense fallback={null}>
            <AdvancedCodeConverter />
          </Suspense>

          <Suspense fallback={null}>
            <Marketplace />
          </Suspense>

          {/* Authentication Modal - Lazy loaded */}
          <Suspense fallback={null}>
            <AuthModal
              isOpen={showAuthModal}
              onClose={closeAuthModal}
              requiredFeature={requiredFeature}
              onSuccess={(user) => {
                console.log('User authenticated:', user);
              }}
            />
          </Suspense>

          {/* Diagnostic Dashboard - Lazy loaded */}
          <Suspense fallback={null}>
            <DiagnosticDashboard />
          </Suspense>

          {/* Recovery Panel - Lazy loaded */}
          <Suspense fallback={null}>
            <RecoveryPanel />
          </Suspense>

          {/* Visual Debugger - Lazy loaded */}
          <Suspense fallback={null}>
            <VisualDebugger />
          </Suspense>

          {/* Hot-Reload Dashboard - Lazy loaded */}
          <Suspense fallback={null}>
            <HotReloadDashboard
              visible={showHotReloadDashboard}
              onClose={() => setShowHotReloadDashboard(false)}
              position="bottom-right"
              compact={false}
            />
          </Suspense>

          {/* AST Diff Visualizer - Lazy loaded */}
          <Suspense fallback={null}>
            <ASTDiffVisualizer
              visible={showASTDiffVisualizer}
              onClose={() => setShowASTDiffVisualizer(false)}
              diffs={astDiffs}
              onDiffSelect={(diff) => {
                console.log('🔍 Selected AST diff:', diff);
              }}
              onNodeSelect={(node) => {
                console.log('🔍 Selected AST node:', node);
              }}
            />
          </Suspense>

          {/* Debug Panel - Lazy loaded */}
          <Suspense fallback={null}>
            <DebugPanel
              visible={showDebugPanel}
              onClose={() => setShowDebugPanel(false)}
              onNavigateToLine={(file, line) => {
                console.log('Navigate to line:', file, line);
              }}
            />
          </Suspense>
        </div>
      </DragDropProvider>
    </VB6Provider>
  );
}

export default ModernApp;
