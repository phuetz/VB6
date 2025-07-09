import React from 'react';
import { useVB6 } from '../../context/VB6Context';
import AdvancedToolbox from '../Panels/Toolbox/AdvancedToolbox';
import FormDesigner from '../Designer/FormDesigner';
import AdvancedCodeEditor from '../Editor/AdvancedCodeEditor';
import ProjectExplorer from '../Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from '../Panels/PropertiesWindow/PropertiesWindow';
import ImmediateWindow from '../Panels/ImmediateWindow/ImmediateWindow';
import { WatchWindow, LocalsWindow, CallStackWindow, DebugToolbar } from '../Debug/DebugWindows';

const MainContent: React.FC = () => {
  const { state } = useVB6();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Toolbox */}
      {state.showToolbox && <AdvancedToolbox />}

      {/* Center Panel - Form Designer or Code Editor */}
      <div className="flex-1 flex flex-col bg-gray-300 overflow-hidden">
        {/* Debug Toolbar */}
        {(state.executionMode === 'break' || state.executionMode === 'run') && <DebugToolbar />}
        
        {state.showCodeEditor ? <AdvancedCodeEditor /> : <FormDesigner />}
        
        {/* Bottom Panel - Immediate Window */}
        {state.showImmediateWindow && <ImmediateWindow />}
      </div>

      {/* Right Panel - Project Explorer and Properties */}
      <div className="w-80 bg-gray-100 border-l border-gray-400 flex flex-col">
        {state.showProjectExplorer && <ProjectExplorer />}
        {state.showPropertiesWindow && <PropertiesWindow />}
        
        {/* Debug Windows */}
        {state.showWatchWindow && (
          <WatchWindow
            visible={state.showWatchWindow}
            onClose={() => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showWatchWindow' } })}
          />
        )}
        {state.showLocalsWindow && (
          <LocalsWindow
            visible={state.showLocalsWindow}
            onClose={() => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showLocalsWindow' } })}
          />
        )}
        {state.showCallStack && (
          <CallStackWindow
            visible={state.showCallStack}
            onClose={() => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showCallStack' } })}
          />
        )}
      </div>
    </div>
  );
};

export default MainContent;