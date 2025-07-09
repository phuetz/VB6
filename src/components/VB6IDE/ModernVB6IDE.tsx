import React from 'react';
import { VB6Provider } from '../../context/VB6Context';
import TitleBar from '../Layout/TitleBar';
import MenuBar from '../Layout/MenuBar';
import Toolbar from '../Layout/Toolbar';
import StatusBar from '../Layout/StatusBar';
import DialogManager from '../Dialogs/DialogManager';
import ModernToolbox from '../Panels/Toolbox/ModernToolbox';
import DragDropCanvas from '../Designer/DragDropCanvas';
import MonacoCodeEditor from '../Editor/MonacoCodeEditor';
import ProjectExplorer from '../Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from '../Panels/PropertiesWindow/PropertiesWindow';
import ImmediateWindow from '../Panels/ImmediateWindow/ImmediateWindow';
import { useVB6Store } from '../../stores/vb6Store';

const ModernMainContent: React.FC = () => {
  const { 
    showToolbox, 
    showCodeEditor, 
    showProjectExplorer, 
    showPropertiesWindow, 
    showImmediateWindow 
  } = useVB6Store();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Toolbox */}
      {showToolbox && <ModernToolbox />}

      {/* Center Panel - Form Designer or Code Editor */}
      <div className="flex-1 flex flex-col bg-gray-300 overflow-hidden">
        {showCodeEditor ? <MonacoCodeEditor /> : <DragDropCanvas />}
        
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

const ModernVB6IDE: React.FC = () => {
  return (
    <VB6Provider>
      <div className="h-screen bg-gray-200 flex flex-col overflow-hidden" style={{ fontFamily: 'MS Sans Serif, sans-serif' }}>
        <TitleBar />
        <MenuBar />
        <Toolbar />
        <ModernMainContent />
        <StatusBar />
        <DialogManager />
      </div>
    </VB6Provider>
  );
};

export default ModernVB6IDE;