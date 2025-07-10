import React from 'react';
import { DragDropProvider } from './components/DragDrop/DragDropProvider';
import { VB6Provider } from './context/VB6Context';
import TitleBar from './components/Layout/TitleBar';
import EnhancedMenuBar from './components/Layout/EnhancedMenuBar';
import { EnhancedToolbar } from './components/Layout/EnhancedToolbar';
import StatusBar from './components/Layout/StatusBar';
import DialogManager from './components/Dialogs/DialogManager';
import { EnhancedToolbox } from './components/Panels/Toolbox/EnhancedToolbox';
import { AdvancedDragDropCanvas } from './components/DragDrop/AdvancedDragDropCanvas';
import MonacoCodeEditor from './components/Editor/MonacoCodeEditor';
import ProjectExplorer from './components/Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from './components/Panels/PropertiesWindow/PropertiesWindow';
import ImmediateWindow from './components/Panels/ImmediateWindow/ImmediateWindow';
import { useVB6Store } from './stores/vb6Store';
import { EnhancedIntelliSense } from './components/Editor/EnhancedIntelliSense';
import { CodeAnalyzer } from './components/Analysis/CodeAnalyzer';
import { RefactorTools } from './components/Refactoring/RefactorTools';
import { BreakpointManager } from './components/Debugging/BreakpointManager';
import { ProjectTemplateManager } from './components/Templates/ProjectTemplateManager';
import { PerformanceMonitor } from './components/Performance/PerformanceMonitor';
import { ProjectSetupWizard } from './components/ProjectWizard/ProjectSetupWizard';
import './index.css';

const MainContent: React.FC = () => {
  const { 
    showToolbox, 
    showCodeEditor, 
    showProjectExplorer, 
    showPropertiesWindow, 
    showImmediateWindow,
    formProperties,
    showDialog
  } = useVB6Store();

  const [showTemplateManager, setShowTemplateManager] = React.useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = React.useState(false);
  const [showProjectWizard, setShowProjectWizard] = React.useState(false);
  const [showCodeAnalyzer, setShowCodeAnalyzer] = React.useState(false);
  const [showRefactorTools, setShowRefactorTools] = React.useState(false);
  const [showBreakpointManager, setShowBreakpointManager] = React.useState(false);

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
        {showPropertiesWindow && <PropertiesWindow />}
      </div>
    </div>
  );
};

function App() {
  return (
    <VB6Provider>
      <DragDropProvider>
        <div className="h-screen bg-gray-200 flex flex-col overflow-hidden" style={{ fontFamily: 'MS Sans Serif, sans-serif' }}>
          <TitleBar />
          <EnhancedMenuBar />
          <EnhancedToolbar />
          <MainContent />
          <StatusBar />
          <DialogManager />
          
          {/* Template Manager */}
          <ProjectTemplateManager
            visible={showTemplateManager}
            onClose={() => setShowTemplateManager(false)}
            onCreateProject={(template) => {
              console.log('Creating project from template:', template);
              setShowTemplateManager(false);
            }}
          />
          
          {/* Performance Monitor */}
           <PerformanceMonitor
            visible={showPerformanceMonitor}
            onClose={() => setShowPerformanceMonitor(false)}
          />
          
          <ProjectSetupWizard
            visible={showProjectWizard}
            onClose={() => setShowProjectWizard(false)}
            onComplete={(config) => {
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
              // In a real implementation, this would open the file and position the cursor
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
            onAddBreakpoint={(bp) => {
              console.log('Adding breakpoint:', bp);
            }}
            onRemoveBreakpoint={(id) => {
              console.log('Removing breakpoint:', id);
            }}
            onUpdateBreakpoint={(id, updates) => {
              console.log('Updating breakpoint:', id, updates);
            }}
            onNavigateToBreakpoint={(file, line, column) => {
              console.log('Project configuration:', config);
              setShowProjectWizard(false);
            }}
          />
        </div>
      </DragDropProvider>
    </VB6Provider>
  );
}

export default App;