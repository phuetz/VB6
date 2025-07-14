import React, { useState } from 'react';
import { DragDropProvider } from './components/DragDrop/DragDropProvider';
import { VB6Provider } from './context/VB6Context';
import TitleBar from './components/Layout/TitleBar';
import EnhancedMenuBar from './components/Layout/EnhancedMenuBar';
import { EnhancedToolbar } from './components/Layout/EnhancedToolbar';
import StatusBar from './components/Layout/StatusBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import DialogManager from './components/Dialogs/DialogManager';
import { EnhancedToolbox } from './components/Panels/Toolbox/EnhancedToolbox';
import { AdvancedDragDropCanvas } from './components/DragDrop/AdvancedDragDropCanvas';
import MonacoCodeEditor from './components/Editor/MonacoCodeEditor';
import ProjectExplorer from './components/Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from './components/Panels/PropertiesWindow/PropertiesWindow';
import ControlTree from './components/Panels/ControlTree/ControlTree';
import ImmediateWindow from './components/Panels/ImmediateWindow/ImmediateWindow';
import { useVB6Store } from './stores/vb6Store';
import { EnhancedIntelliSense } from './components/Editor/EnhancedIntelliSense';
import { CodeAnalyzer } from './components/Analysis/CodeAnalyzer';
import { RefactorTools } from './components/Refactoring/RefactorTools';
import { SnippetManager } from './components/Snippets/SnippetManager';
import { TodoList } from './components/Todo/TodoList';
import { BreakpointManager } from './components/Debugging/BreakpointManager';
import { ProjectTemplateManager } from './components/Templates/ProjectTemplateManager';
import { PerformanceMonitor } from './components/Performance/PerformanceMonitor';
import { ProjectSetupWizard } from './components/ProjectWizard/ProjectSetupWizard';
import { EnhancedErrorList } from './components/ErrorList/EnhancedErrorList';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { ExportDialog } from './components/Export/ExportDialog';
import { LogPanel } from './components/Debug/LogPanel';
import { CodeFormatter } from './components/Formatting/CodeFormatter';
import { CodeConverter } from './components/Converter/CodeConverter';
import OptionsDialog from './components/Dialogs/OptionsDialog';
import './index.css';

const MainContent: React.FC = () => {
  const {
    showToolbox,
    showCodeEditor,
    showProjectExplorer,
    showPropertiesWindow,
    showControlTree,
    showImmediateWindow,
    formProperties,
  } = useVB6Store();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Enhanced Toolbox */}
      {showToolbox && <EnhancedToolbox />}

      {/* Center Panel - Advanced Canvas or Code Editor */}
      <div className="flex-1 flex flex-col bg-gray-300 overflow-hidden">
        {showCodeEditor ? (
          <MonacoCodeEditor />
        ) : (
          <div className="flex-1 p-4 overflow-auto">
            <div className="mx-auto shadow-2xl">
              <AdvancedDragDropCanvas
                width={formProperties.Width}
                height={formProperties.Height}
                backgroundColor={formProperties.BackColor}
              />
            </div>
          </div>
        )}

        {/* Bottom Panel - Immediate Window */}
        {showImmediateWindow && <ImmediateWindow />}
      </div>

      {/* Right Panel - Project Explorer and Properties */}
      <div className="w-80 bg-gray-100 border-l border-gray-400 flex flex-col">
        {showProjectExplorer && <ProjectExplorer />}
        {showControlTree && <ControlTree />}
        {showPropertiesWindow && <PropertiesWindow />}
      </div>
    </div>
  );
};

function App() {
  // State for all dialog components
  const {
    showTemplateManager,
    showPerformanceMonitor,
    showOptionsDialog,
    showDialog,
    toggleWindow,
    snippets,
    showSnippetManager,
    insertSnippet,
    showTodoList,
  } = useVB6Store();
  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const [showCodeAnalyzer, setShowCodeAnalyzer] = useState(false);
  const [showRefactorTools, setShowRefactorTools] = useState(false);
  const [showBreakpointManager, setShowBreakpointManager] = useState(false);
  const [showErrorList, setShowErrorList] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCodeFormatter, setShowCodeFormatter] = useState(false);
  const [showCodeConverter, setShowCodeConverter] = useState(false);

  return (
    <VB6Provider>
      <DragDropProvider>
        <div
          className="h-screen bg-gray-200 flex flex-col overflow-hidden"
          style={{ fontFamily: 'MS Sans Serif, sans-serif' }}
        >
          <TitleBar />
          <EnhancedMenuBar />
          <EnhancedToolbar />
          <ErrorBoundary>
            <MainContent />
          </ErrorBoundary>
          <StatusBar />
          <DialogManager />

          {/* Debug Log Panel */}
          <LogPanel />

          {/* Template Manager */}
          <ProjectTemplateManager
            visible={showTemplateManager}
            onClose={() => showDialog('showTemplateManager', false)}
            onCreateProject={template => {
              console.log('Creating project from template:', template);
              showDialog('showTemplateManager', false);
            }}
          />

          {/* Performance Monitor */}
          <PerformanceMonitor
            visible={showPerformanceMonitor}
            onClose={() => toggleWindow('showPerformanceMonitor')}
          />

          {/* Project Setup Wizard */}
          <ProjectSetupWizard
            visible={showProjectWizard}
            onClose={() => setShowProjectWizard(false)}
            onComplete={config => {
              console.log('Project configuration:', config);
              setShowProjectWizard(false);
            }}
          />

          {/* Code Analysis and Refactoring Tools */}
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

          <RefactorTools
            visible={showRefactorTools}
            onClose={() => setShowRefactorTools(false)}
            onApplyRefactoring={(type, options) => {
              console.log('Applying refactoring:', type, options);
            }}
          />

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

          {/* Error List */}
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

          {/* Command Palette */}
          <CommandPalette
            visible={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
          />

          {/* Export Dialog */}
          <ExportDialog
            visible={showExportDialog}
            onClose={() => setShowExportDialog(false)}
            onExport={(format, options) => {
              console.log('Exporting to', format, 'with options', options);
            }}
          />

          {/* Snippet Manager */}
          <SnippetManager
            visible={showSnippetManager}
            onClose={() => showDialog('showSnippetManager', false)}
            onInsertSnippet={insertSnippet}
            snippets={snippets}
          />

          {/* Code Formatter */}
          <CodeFormatter
            visible={showCodeFormatter}
            onClose={() => setShowCodeFormatter(false)}
            onApplyFormatting={formattedCode => {
              console.log('Apply formatting:', formattedCode);
            }}
          />

          {/* Code Converter */}
          <CodeConverter
            visible={showCodeConverter}
            onClose={() => setShowCodeConverter(false)}
            onConvertCode={(code, targetLanguage, options) => {
              console.log('Convert code to', targetLanguage, 'with options', options);
            }}
          />

          {/* Options Dialog */}
          <OptionsDialog
            visible={showOptionsDialog}
            onClose={() => showDialog('showOptionsDialog', false)}
          />

          {/* Todo List */}
          <TodoList visible={showTodoList} onClose={() => toggleWindow('showTodoList')} />
        </div>
      </DragDropProvider>
    </VB6Provider>
  );
}

export default App;
