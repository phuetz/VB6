import React from 'react';
import { DragDropProvider } from './components/DragDrop/DragDropProvider';
import { VB6Provider } from './context/VB6Context';
import TitleBar from './components/Layout/TitleBar';
import MenuBar from './components/Layout/MenuBar';
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
import './index.css';

const MainContent: React.FC = () => {
  const { 
    showToolbox, 
    showCodeEditor, 
    showProjectExplorer, 
    showPropertiesWindow, 
    showImmediateWindow,
    formProperties
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
          <MenuBar />
          <EnhancedToolbar />
          <MainContent />
          <StatusBar />
          <DialogManager />
        </div>
      </DragDropProvider>
    </VB6Provider>
  );
}

export default App;