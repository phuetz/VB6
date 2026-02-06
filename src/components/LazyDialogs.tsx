import React, { lazy, Suspense } from 'react';
import { useDialogStore } from '../stores/dialogStore';
import { useWindowStore } from '../stores/windowStore';
import { shallow } from 'zustand/shallow';
import { useAuth } from '../hooks/useAuth';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Lazy-loaded dialog and tool components
const CodeAnalyzer = lazy(() =>
  import('./Analysis/CodeAnalyzer').then(m => ({ default: m.CodeAnalyzer }))
);
const RefactorTools = lazy(() =>
  import('./Refactoring/RefactorTools').then(m => ({ default: m.RefactorTools }))
);
const VB6SnippetManager = lazy(() =>
  import('./Snippets/VB6SnippetManager').then(m => ({ default: m.VB6SnippetManager }))
);
const BreakpointManager = lazy(() =>
  import('./Debug/BreakpointManager').then(m => ({ default: m.BreakpointManager }))
);
const ProjectTemplateManager = lazy(() =>
  import('./Templates/ProjectTemplateManager').then(m => ({
    default: m.ProjectTemplateManager,
  }))
);
const PerformanceMonitor = lazy(() =>
  import('./Performance/PerformanceMonitor').then(m => ({
    default: m.PerformanceMonitor,
  }))
);
const ProjectSetupWizard = lazy(() =>
  import('./ProjectWizard/ProjectSetupWizard').then(m => ({
    default: m.ProjectSetupWizard,
  }))
);
const ProjectTemplateWizard = lazy(() =>
  import('./ProjectWizard/ProjectTemplateWizard').then(m => ({
    default: m.ProjectTemplateWizard,
  }))
);
const EnhancedErrorList = lazy(() =>
  import('./ErrorList/EnhancedErrorList').then(m => ({ default: m.EnhancedErrorList }))
);
const CommandPalette = lazy(() =>
  import('./CommandPalette/CommandPalette').then(m => ({ default: m.CommandPalette }))
);
const ExportDialog = lazy(() =>
  import('./Export/ExportDialog').then(m => ({ default: m.ExportDialog }))
);
const CodeFormatter = lazy(() =>
  import('./Formatting/CodeFormatter').then(m => ({ default: m.CodeFormatter }))
);
const CodeConverter = lazy(() =>
  import('./Converter/CodeConverter').then(m => ({ default: m.CodeConverter }))
);
const ImportExportDialog = lazy(() =>
  import('./Dialogs/ImportExportDialog').then(m => ({ default: m.ImportExportDialog }))
);
const DatabaseManager = lazy(() =>
  import('./Database/DatabaseManager').then(m => ({ default: m.default }))
);
const ReportDesigner = lazy(() =>
  import('./Reports/ReportDesigner').then(m => ({ default: m.ReportDesigner }))
);
const ReportViewer = lazy(() =>
  import('./Reports/ReportViewer').then(m => ({ default: m.ReportViewer }))
);
const ActiveXManager = lazy(() =>
  import('./Dialogs/ActiveXManager').then(m => ({ default: m.ActiveXManager }))
);
const AIAssistant = lazy(() => import('./AI/AIAssistant').then(m => ({ default: m.AIAssistant })));
const CollaborationManager = lazy(() =>
  import('./Collaboration/CollaborationManager').then(m => ({
    default: m.CollaborationManager,
  }))
);
const TimeTravelDebugger = lazy(() =>
  import('./Debug/TimeTravelDebugger').then(m => ({ default: m.TimeTravelDebugger }))
);
const AdvancedCodeConverter = lazy(() =>
  import('./Converter/AdvancedCodeConverter').then(m => ({
    default: m.AdvancedCodeConverter,
  }))
);
const Marketplace = lazy(() =>
  import('./Marketplace/Marketplace').then(m => ({ default: m.Marketplace }))
);
const AuthModal = lazy(() => import('./Auth/AuthModal').then(m => ({ default: m.default })));
const DiagnosticDashboard = lazy(() =>
  import('./Diagnostic/DiagnosticDashboard').then(m => ({ default: m.default }))
);
const RecoveryPanel = lazy(() =>
  import('./Recovery/RecoveryPanel').then(m => ({ default: m.default }))
);
const DebugPanel = lazy(() => import('./Debug/DebugPanel').then(m => ({ default: m.default })));
const HotReloadDashboard = lazy(() =>
  import('./HotReload/HotReloadDashboard').then(m => ({ default: m.HotReloadDashboard }))
);
const ASTDiffVisualizer = lazy(() =>
  import('./HotReload/ASTDiffVisualizer').then(m => ({ default: m.ASTDiffVisualizer }))
);

const LazyDialogs: React.FC = () => {
  const { isOpen, openDialog, closeDialog, importExportMode, currentReportId, astDiffs } =
    useDialogStore();

  // Dialog state managed by windowStore
  const { showTemplateManager, showPerformanceMonitor, showSnippetManager } = useWindowStore(
    state => ({
      showTemplateManager: state.showTemplateManager,
      showPerformanceMonitor: state.showPerformanceMonitor,
      showSnippetManager: state.showSnippetManager,
    }),
    shallow
  );
  const vb6ShowDialog = useWindowStore(state => state.showDialog);
  const toggleWindow = useWindowStore(state => state.toggleWindow);

  // Auth state
  const { showAuthModal, requiredFeature, closeAuthModal } = useAuth();

  // Dialog keyboard shortcuts
  useKeyboardShortcuts([
    {
      keys: ['n'],
      ctrlKey: true,
      shiftKey: true,
      action: () => openDialog('projectTemplateWizard'),
      description: 'New from Template',
    },
    {
      keys: ['d'],
      ctrlKey: true,
      shiftKey: true,
      action: () => openDialog('databaseManager'),
      description: 'Database Manager',
    },
    {
      keys: ['r'],
      ctrlKey: true,
      action: () => openDialog('reportDesigner'),
      description: 'Report Designer',
    },
    { keys: ['F5'], action: () => openDialog('debugPanel'), description: 'Start Debugging' },
    { keys: ['F9'], action: () => openDialog('debugPanel'), description: 'Toggle Breakpoint' },
    { keys: ['F8'], action: () => openDialog('debugPanel'), description: 'Step Into' },
    {
      keys: ['h'],
      ctrlKey: true,
      shiftKey: true,
      action: () => openDialog('hotReloadDashboard'),
      description: 'Hot-Reload Dashboard',
    },
    {
      keys: ['a'],
      ctrlKey: true,
      shiftKey: true,
      action: () => openDialog('astDiffVisualizer'),
      description: 'AST Diff Visualizer',
    },
  ]);

  return (
    <>
      {/* Template Manager */}
      <Suspense fallback={null}>
        <ProjectTemplateManager
          visible={showTemplateManager}
          onClose={() => vb6ShowDialog('showTemplateManager', false)}
          onCreateProject={() => vb6ShowDialog('showTemplateManager', false)}
        />
      </Suspense>

      {/* Performance Monitor */}
      <Suspense fallback={null}>
        <PerformanceMonitor
          visible={showPerformanceMonitor}
          onClose={() => toggleWindow('showPerformanceMonitor')}
        />
      </Suspense>

      {/* Project Setup Wizard */}
      <Suspense fallback={null}>
        <ProjectSetupWizard
          visible={isOpen('projectWizard')}
          onClose={() => closeDialog('projectWizard')}
          onComplete={() => closeDialog('projectWizard')}
        />
      </Suspense>

      {/* Project Template Wizard */}
      <Suspense fallback={null}>
        <ProjectTemplateWizard
          visible={isOpen('projectTemplateWizard')}
          onClose={() => closeDialog('projectTemplateWizard')}
          onCreateProject={() => closeDialog('projectTemplateWizard')}
        />
      </Suspense>

      {/* Code Analyzer */}
      <Suspense fallback={null}>
        <CodeAnalyzer
          visible={isOpen('codeAnalyzer')}
          onClose={() => closeDialog('codeAnalyzer')}
          onFixIssue={() => {}}
          onNavigateToIssue={() => {}}
        />
      </Suspense>

      {/* Refactor Tools */}
      <Suspense fallback={null}>
        <RefactorTools
          visible={isOpen('refactorTools')}
          onClose={() => closeDialog('refactorTools')}
          onApplyRefactoring={() => {}}
        />
      </Suspense>

      {/* Breakpoint Manager */}
      <Suspense fallback={null}>
        <BreakpointManager
          visible={isOpen('breakpointManager')}
          onClose={() => closeDialog('breakpointManager')}
          breakpoints={[]}
          onAddBreakpoint={() => {}}
          onRemoveBreakpoint={() => {}}
          onUpdateBreakpoint={() => {}}
          onNavigateToBreakpoint={() => {}}
        />
      </Suspense>

      {/* Error List */}
      <Suspense fallback={null}>
        <EnhancedErrorList
          visible={isOpen('errorList')}
          onClose={() => closeDialog('errorList')}
          onNavigateToError={() => {}}
          onFixError={() => {}}
          onClearErrors={() => {}}
        />
      </Suspense>

      {/* Command Palette */}
      <Suspense fallback={null}>
        <CommandPalette
          visible={isOpen('commandPalette')}
          onClose={() => closeDialog('commandPalette')}
        />
      </Suspense>

      {/* Export Dialog */}
      <Suspense fallback={null}>
        <ExportDialog
          visible={isOpen('exportDialog')}
          onClose={() => closeDialog('exportDialog')}
          onExport={() => {}}
        />
      </Suspense>

      {/* Snippet Manager */}
      <Suspense fallback={null}>
        <VB6SnippetManager
          visible={showSnippetManager}
          onClose={() => vb6ShowDialog('showSnippetManager', false)}
          onInsertSnippet={() => vb6ShowDialog('showSnippetManager', false)}
        />
      </Suspense>

      {/* Code Formatter */}
      <Suspense fallback={null}>
        <CodeFormatter
          visible={isOpen('codeFormatter')}
          onClose={() => closeDialog('codeFormatter')}
          onApplyFormatting={() => {}}
        />
      </Suspense>

      {/* Code Converter */}
      <Suspense fallback={null}>
        <CodeConverter
          visible={isOpen('codeConverter')}
          onClose={() => closeDialog('codeConverter')}
          onConvertCode={() => {}}
        />
      </Suspense>

      {/* Import/Export Dialog */}
      <Suspense fallback={null}>
        <ImportExportDialog
          visible={isOpen('importExportDialog')}
          onClose={() => closeDialog('importExportDialog')}
          mode={importExportMode}
        />
      </Suspense>

      {/* Database Manager */}
      <Suspense fallback={null}>
        <DatabaseManager
          visible={isOpen('databaseManager')}
          onClose={() => closeDialog('databaseManager')}
        />
      </Suspense>

      {/* Report Designer */}
      <Suspense fallback={null}>
        <ReportDesigner
          visible={isOpen('reportDesigner')}
          onClose={() => closeDialog('reportDesigner')}
          reportId={currentReportId}
          onSave={() => closeDialog('reportDesigner')}
        />
      </Suspense>

      {/* Report Viewer */}
      <Suspense fallback={null}>
        <ReportViewer
          visible={isOpen('reportViewer')}
          onClose={() => closeDialog('reportViewer')}
          reportId={currentReportId}
        />
      </Suspense>

      {/* ActiveX Manager */}
      <Suspense fallback={null}>
        <ActiveXManager
          visible={isOpen('activeXManager')}
          onClose={() => closeDialog('activeXManager')}
          onInsertControl={() => {}}
        />
      </Suspense>

      {/* Always-rendered lazy components */}
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

      {/* Auth Modal */}
      <Suspense fallback={null}>
        <AuthModal
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          requiredFeature={requiredFeature}
          onSuccess={() => {}}
        />
      </Suspense>

      {/* Diagnostic and Recovery */}
      <Suspense fallback={null}>
        <DiagnosticDashboard />
      </Suspense>
      <Suspense fallback={null}>
        <RecoveryPanel />
      </Suspense>

      {/* Hot-Reload Dashboard */}
      <Suspense fallback={null}>
        <HotReloadDashboard
          visible={isOpen('hotReloadDashboard')}
          onClose={() => closeDialog('hotReloadDashboard')}
          position="bottom-right"
          compact={false}
        />
      </Suspense>

      {/* AST Diff Visualizer */}
      <Suspense fallback={null}>
        <ASTDiffVisualizer
          visible={isOpen('astDiffVisualizer')}
          onClose={() => closeDialog('astDiffVisualizer')}
          diffs={astDiffs}
          onDiffSelect={() => {}}
          onNodeSelect={() => {}}
        />
      </Suspense>

      {/* Debug Panel */}
      <Suspense fallback={null}>
        <DebugPanel
          visible={isOpen('debugPanel')}
          onClose={() => closeDialog('debugPanel')}
          onNavigateToLine={() => {}}
        />
      </Suspense>
    </>
  );
};

export default LazyDialogs;
