import React from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { shallow } from 'zustand/shallow';
import AdvancedToolbox from '../Panels/Toolbox/AdvancedToolbox';
import FormDesigner from '../Designer/FormDesigner';
import AdvancedCodeEditor from '../Editor/AdvancedCodeEditor';
import ProjectExplorer from '../Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from '../Panels/PropertiesWindow/PropertiesWindow';
import ControlTree from '../Panels/ControlTree/ControlTree';
import ImmediateWindow from '../Panels/ImmediateWindow/ImmediateWindow';
import { WatchWindow, LocalsWindow, CallStackWindow, DebugToolbar } from '../Debug/DebugWindows';
import AdvancedDebugPanel from '../Debug/AdvancedDebugPanel';
import GitPanel from '../Panels/GitPanel';
import MemoryProfiler from '../Debug/MemoryProfiler';
import TestRunner from '../Testing/TestRunner';

const MainContent: React.FC = () => {
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const {
    showToolbox,
    showCodeEditor,
    showProjectExplorer,
    showPropertiesWindow,
    showControlTree,
    showImmediateWindow,
    showWatchWindow,
    showLocalsWindow,
    showCallStack,
    executionMode,
    toggleWindow,
    showGitPanel,
    showMemoryProfiler,
    showTestRunner,
  } = useVB6Store(
    (state) => ({
      showToolbox: state.showToolbox,
      showCodeEditor: state.showCodeEditor,
      showProjectExplorer: state.showProjectExplorer,
      showPropertiesWindow: state.showPropertiesWindow,
      showControlTree: state.showControlTree,
      showImmediateWindow: state.showImmediateWindow,
      showWatchWindow: state.showWatchWindow,
      showLocalsWindow: state.showLocalsWindow,
      showCallStack: state.showCallStack,
      executionMode: state.executionMode,
      toggleWindow: state.toggleWindow,
      showGitPanel: state.showGitPanel,
      showMemoryProfiler: state.showMemoryProfiler,
      showTestRunner: state.showTestRunner,
    }),
    shallow
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Toolbox */}
      {showToolbox && <AdvancedToolbox />}

      {/* Center Panel - Form Designer or Code Editor */}
      <div className="flex-1 flex flex-col bg-gray-300 overflow-hidden">
        {/* Debug Toolbar */}
        {(executionMode === 'break' || executionMode === 'run') && <DebugToolbar />}

        {showCodeEditor ? <AdvancedCodeEditor /> : <FormDesigner />}

        {/* Bottom Panel - Immediate Window and Advanced Debug Panel */}
        <div className="flex flex-col">
          {showImmediateWindow && <ImmediateWindow />}
          {(executionMode === 'break' || executionMode === 'run' || executionMode === 'design') && (
            <AdvancedDebugPanel className="h-80 border-t border-gray-400" />
          )}
        </div>
      </div>

      {/* Right Panel - Project Explorer and Properties */}
      <div className="w-80 bg-gray-100 border-l border-gray-400 flex flex-col">
        {showProjectExplorer && <ProjectExplorer />}
        {showControlTree && <ControlTree />}
        {showPropertiesWindow && <PropertiesWindow />}

        {/* Debug Windows */}
        {showWatchWindow && (
          <WatchWindow visible={showWatchWindow} onClose={() => toggleWindow('showWatchWindow')} />
        )}
        {showLocalsWindow && (
          <LocalsWindow
            visible={showLocalsWindow}
            onClose={() => toggleWindow('showLocalsWindow')}
          />
        )}
        {showCallStack && (
          <CallStackWindow visible={showCallStack} onClose={() => toggleWindow('showCallStack')} />
        )}
        
        {/* Git Panel */}
        {showGitPanel && (
          <GitPanel className="h-96 border-t border-gray-400" />
        )}
        
        {/* Memory Profiler */}
        {showMemoryProfiler && (
          <MemoryProfiler className="w-80 h-96 absolute bottom-4 right-4 shadow-lg" />
        )}
        
        {/* Test Runner */}
        {showTestRunner && (
          <TestRunner className="h-96 border-t border-gray-400" />
        )}
      </div>
    </div>
  );
};

export default MainContent;
