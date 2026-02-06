import React from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { useWindowStore } from '../../stores/windowStore';
import { shallow } from 'zustand/shallow';
import Toolbox from '../Panels/Toolbox/Toolbox';
import FormDesigner from '../Designer/FormDesigner';
import LazyMonacoEditor from '../Editor/LazyMonacoEditor';
import ImmediateWindow from '../Panels/ImmediateWindow/ImmediateWindow';
import { DebugToolbar } from '../Debug/DebugWindows';
import AdvancedDebugPanel from '../Debug/AdvancedDebugPanel';
import ProjectExplorer from '../Panels/ProjectExplorer/ProjectExplorer';
import PropertiesWindow from '../Panels/PropertiesWindow/PropertiesWindow';
import ControlTree from '../Panels/ControlTree/ControlTree';
import { WatchWindow, LocalsWindow, CallStackWindow } from '../Debug/DebugWindows';
import GitPanel from '../Panels/GitPanel';
import MemoryProfiler from '../Debug/MemoryProfiler';
import TestRunner from '../Testing/TestRunner';
import {
  ToolboxErrorBoundary,
  EditorErrorBoundary,
  DesignerErrorBoundary,
  DebugErrorBoundary,
} from '../ErrorBoundary';
import WindowManager from './WindowManager';
import type { PanelConfig } from './windowTypes';

const rightPanels: PanelConfig[] = [
  {
    id: 'projectExplorer',
    storeKey: 'showProjectExplorer',
    component: ProjectExplorer,
    boundaryType: 'panel',
    panelName: 'Project Explorer',
  },
  {
    id: 'controlTree',
    storeKey: 'showControlTree',
    component: ControlTree,
    boundaryType: 'panel',
    panelName: 'Control Tree',
  },
  {
    id: 'propertiesWindow',
    storeKey: 'showPropertiesWindow',
    component: PropertiesWindow,
    boundaryType: 'panel',
    panelName: 'Properties Window',
  },
  {
    id: 'watchWindow',
    storeKey: 'showWatchWindow',
    component: WatchWindow,
    boundaryType: 'debug',
    visibilityControlled: true,
  },
  {
    id: 'localsWindow',
    storeKey: 'showLocalsWindow',
    component: LocalsWindow,
    boundaryType: 'debug',
    visibilityControlled: true,
  },
  {
    id: 'callStack',
    storeKey: 'showCallStack',
    component: CallStackWindow,
    boundaryType: 'debug',
    visibilityControlled: true,
  },
  {
    id: 'gitPanel',
    storeKey: 'showGitPanel',
    component: GitPanel,
    boundaryType: 'panel',
    panelName: 'Git Panel',
    className: 'h-96 border-t border-gray-400',
  },
  {
    id: 'memoryProfiler',
    storeKey: 'showMemoryProfiler',
    component: MemoryProfiler,
    boundaryType: 'panel',
    panelName: 'Memory Profiler',
    className: 'w-80 h-96 absolute bottom-4 right-4 shadow-lg',
  },
  {
    id: 'testRunner',
    storeKey: 'showTestRunner',
    component: TestRunner,
    boundaryType: 'panel',
    panelName: 'Test Runner',
    className: 'h-96 border-t border-gray-400',
  },
];

const MainContent: React.FC = () => {
  const { showToolbox, showCodeEditor, showImmediateWindow } = useWindowStore(
    state => ({
      showToolbox: state.showToolbox,
      showCodeEditor: state.showCodeEditor,
      showImmediateWindow: state.showImmediateWindow,
    }),
    shallow
  );

  const { executionMode } = useVB6Store(
    state => ({
      executionMode: state.executionMode,
    }),
    shallow
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Toolbox */}
      {showToolbox && (
        <ToolboxErrorBoundary>
          <Toolbox />
        </ToolboxErrorBoundary>
      )}

      {/* Center Panel - Form Designer or Code Editor */}
      <div className="flex-1 flex flex-col bg-gray-300 overflow-hidden">
        {(executionMode === 'break' || executionMode === 'run') && <DebugToolbar />}

        {showCodeEditor ? (
          <EditorErrorBoundary>
            <LazyMonacoEditor />
          </EditorErrorBoundary>
        ) : (
          <DesignerErrorBoundary>
            <FormDesigner />
          </DesignerErrorBoundary>
        )}

        {/* Bottom Panel */}
        <div className="flex flex-col">
          {showImmediateWindow && (
            <DebugErrorBoundary>
              <ImmediateWindow />
            </DebugErrorBoundary>
          )}
          {(executionMode === 'break' || executionMode === 'run' || executionMode === 'design') && (
            <DebugErrorBoundary>
              <AdvancedDebugPanel className="h-80 border-t border-gray-400" />
            </DebugErrorBoundary>
          )}
        </div>
      </div>

      {/* Right Panel - data-driven via WindowManager */}
      <div className="w-80 bg-gray-100 border-l border-gray-400 flex flex-col">
        <WindowManager panels={rightPanels} />
      </div>
    </div>
  );
};

export default MainContent;
