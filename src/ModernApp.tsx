import React, { useState, useEffect } from 'react';
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
import MonacoCodeEditor from './components/Editor/MonacoCodeEditor';
import ProjectExplorer from './components/Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from './components/Panels/PropertiesWindow/PropertiesWindow';
import ControlTree from './components/Panels/ControlTree/ControlTree';
import ImmediateWindow from './components/Panels/ImmediateWindow/ImmediateWindow';
import { useVB6Store } from './stores/vb6Store';
import SplashScreen from './components/SplashScreen/SplashScreen';
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
// Import new revolutionary components
import { AIAssistant } from './components/AI/AIAssistant';
import { CollaborationManager } from './components/Collaboration/CollaborationManager';
import { TimeTravelDebugger } from './components/Debugging/TimeTravelDebugger';
import { AdvancedCodeConverter } from './components/Converter/AdvancedCodeConverter';
import { Marketplace } from './components/Marketplace/Marketplace';
import AuthModal from './components/Auth/AuthModal';
import { useAuth } from './hooks/useAuth';
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
    <div className="flex-1 flex overflow-hidden bg-gray-50">
      {/* Left Panel - Enhanced Toolbox with modern styling */}
      {showToolbox && (
        <div className="w-56 bg-white border-r border-gray-200 shadow-sm animate-slideIn">
          <EnhancedToolbox />
        </div>
      )}

      {/* Center Panel - Advanced Canvas or Code Editor */}
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
        {showCodeEditor ? (
          <div className="flex-1 bg-white shadow-inner">
            <MonacoCodeEditor />
          </div>
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
  const [showSplash, setShowSplash] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { showAuthModal, requiredFeature, closeAuthModal, user } = useAuth();

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
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    localStorage.setItem('hasSeenSplash', 'true');
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <VB6Provider>
      <DragDropProvider>
        <div
          className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
            darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
          }`}
        >
          <TitleBar />
          <EnhancedMenuBar />
          <ModernToolbar />
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

          {/* Revolutionary New Components */}
          {/* AI Assistant - Always available */}
          <AIAssistant />

          {/* Collaboration Manager - Always available */}
          <CollaborationManager />

          {/* Time Travel Debugger - Always available */}
          <TimeTravelDebugger />

          {/* Advanced Code Converter - Always available */}
          <AdvancedCodeConverter />

          {/* Marketplace - Always available */}
          <Marketplace />

          {/* Authentication Modal */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={closeAuthModal}
            requiredFeature={requiredFeature}
            onSuccess={(user) => {
              console.log('User authenticated:', user);
            }}
          />
        </div>
      </DragDropProvider>
    </VB6Provider>
  );
}

export default ModernApp;
