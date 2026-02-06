import React, { useState, useEffect, lazy, Suspense } from 'react';
import { DragDropProvider } from './components/DragDrop/DragDropProvider';
import { VB6Provider } from './context/VB6Context';
import TitleBar from './components/Layout/TitleBar';
import EnhancedMenuBar from './components/Layout/EnhancedMenuBar';
import Toolbar from './components/Layout/Toolbar';
import StatusBar from './components/Layout/StatusBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import DialogManager from './components/Dialogs/DialogManager';
import Toolbox from './components/Panels/Toolbox/Toolbox';
import { AdvancedDragDropCanvas } from './components/DragDrop/AdvancedDragDropCanvas';
import ProjectExplorer from './components/Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from './components/Panels/PropertiesWindow/PropertiesWindow';
import ControlTree from './components/Panels/ControlTree/ControlTree';
import ImmediateWindow from './components/Panels/ImmediateWindow/ImmediateWindow';
import { useVB6Store } from './stores/vb6Store';
import { useWindowStore } from './stores/windowStore';
import { useDialogStore } from './stores/dialogStore';
import { shallow } from 'zustand/shallow';
import SplashScreen from './components/SplashScreen/SplashScreen';
import { LogPanel } from './components/Debug/LogPanel';
import LazyDialogs from './components/LazyDialogs';
import './index.css';

// Lazy load code editor (heavy Monaco dependency)
const MonacoCodeEditor = lazy(() => import('./components/Editor/MonacoCodeEditor'));

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
  const {
    showToolbox,
    showCodeEditor,
    showProjectExplorer,
    showPropertiesWindow,
    showControlTree,
    showImmediateWindow,
  } = useWindowStore(
    state => ({
      showToolbox: state.showToolbox,
      showCodeEditor: state.showCodeEditor,
      showProjectExplorer: state.showProjectExplorer,
      showPropertiesWindow: state.showPropertiesWindow,
      showControlTree: state.showControlTree,
      showImmediateWindow: state.showImmediateWindow,
    }),
    shallow
  );

  const { formProperties } = useVB6Store(
    state => ({
      formProperties: state.formProperties,
    }),
    shallow
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50">
      {/* Left Panel - Toolbox */}
      {showToolbox && (
        <div className="w-56 bg-white border-r border-gray-200 shadow-sm animate-slideIn">
          <Toolbox onShowActiveXManager={onShowActiveXManager} />
        </div>
      )}

      {/* Center Panel - Canvas or Code Editor */}
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

        {/* Bottom Panel - Immediate Window */}
        {showImmediateWindow && (
          <div className="border-t border-gray-200 bg-white shadow-lg animate-slideIn">
            <ImmediateWindow />
          </div>
        )}
      </div>

      {/* Right Panel - Project Explorer and Properties */}
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
  const { openDialog, setImportExportMode } = useDialogStore();

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
          <EnhancedMenuBar
            onShowProjectTemplates={() => openDialog('projectTemplateWizard')}
            onImportForm={() => {
              setImportExportMode('import');
              openDialog('importExportDialog');
            }}
            onExportForm={() => {
              setImportExportMode('export');
              openDialog('importExportDialog');
            }}
            onShowDatabaseManager={() => openDialog('databaseManager')}
            onShowReportDesigner={() => openDialog('reportDesigner')}
            onShowDebugPanel={() => openDialog('debugPanel')}
            onShowHotReloadDashboard={() => openDialog('hotReloadDashboard')}
          />
          <Toolbar />
          <ErrorBoundary name="Main Content">
            <MainContent onShowActiveXManager={() => openDialog('activeXManager')} />
          </ErrorBoundary>
          <StatusBar />
          <DialogManager />
          <LogPanel />
          <LazyDialogs />
        </div>
      </DragDropProvider>
    </VB6Provider>
  );
}

export default ModernApp;
