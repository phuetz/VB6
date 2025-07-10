import React from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import AdvancedToolbox from '../Panels/Toolbox/AdvancedToolbox';
import FormDesigner from '../Designer/FormDesigner';
import AdvancedCodeEditor from '../Editor/AdvancedCodeEditor';
import ProjectExplorer from '../Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from '../Panels/PropertiesWindow/PropertiesWindow';
import ImmediateWindow from '../Panels/ImmediateWindow/ImmediateWindow';
import { WatchWindow, LocalsWindow, CallStackWindow, DebugToolbar } from '../Debug/DebugWindows';

const MainContent: React.FC = () => {
  const { 
    showToolbox, 
    showCodeEditor, 
    showProjectExplorer, 
    showPropertiesWindow, 
    showImmediateWindow,
    showWatchWindow,
    showLocalsWindow,
    showCallStack,
    executionMode,
    toggleWindow
  } = useVB6Store();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Toolbox */}
      {showToolbox && <AdvancedToolbox />}

      {/* Center Panel - Form Designer or Code Editor */}
      <div className="flex-1 flex flex-col bg-gray-300 overflow-hidden">
        {/* Debug Toolbar */}
        {(executionMode === 'break' || executionMode === 'run') && <DebugToolbar />}
        
        {showCodeEditor ? <AdvancedCodeEditor /> : <FormDesigner />}
        
        {/* Bottom Panel - Immediate Window */}
        {showImmediateWindow && <ImmediateWindow />}
      </div>

      {/* Right Panel - Project Explorer and Properties */}
      <div className="w-80 bg-gray-100 border-l border-gray-400 flex flex-col">
        {showProjectExplorer && <ProjectExplorer />}
        {showPropertiesWindow && <PropertiesWindow />}
        
        {/* Debug Windows */}
        {showWatchWindow && (
          <WatchWindow
            visible={showWatchWindow}
            onClose={() => toggleWindow('showWatchWindow')}
          />
        )}
        {showLocalsWindow && (
          <LocalsWindow
            visible={showLocalsWindow}
            onClose={() => toggleWindow('showLocalsWindow')}
          />
        )}
        {showCallStack && (
          <CallStackWindow
            visible={showCallStack}
            onClose={() => toggleWindow('showCallStack')}
          />
        )}
      </div>
    </div>
  );
};

export default MainContent;