import React from 'react';
import { useVB6 } from '../../context/VB6Context';

const MenuBar: React.FC = () => {
  const { state, dispatch, saveProject } = useVB6();

  const handleNewProject = () => {
    dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showNewProjectDialog', show: true } });
  };

  const handleToggleWindow = (windowName: string) => {
    dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName } });
  };

  return (
    <div className="h-6 bg-gray-200 border-b border-gray-400 flex items-center px-2 text-xs">
      <div className="relative group">
        <span className="px-2 hover:bg-gray-300 cursor-pointer">File</span>
        <div className="absolute left-0 top-full bg-gray-200 border border-gray-400 shadow-md hidden group-hover:block z-50">
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" onClick={handleNewProject}>
            New Project...
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap">
            Open Project...
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" onClick={saveProject}>
            Save Project
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap">
            Save Project As...
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap">
            Make {state.projectName}.exe...
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap">
            Exit
          </div>
        </div>
      </div>

      <div className="relative group">
        <span className="px-2 hover:bg-gray-300 cursor-pointer">Edit</span>
        <div className="absolute left-0 top-full bg-gray-200 border border-gray-400 shadow-md hidden group-hover:block z-50">
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap flex justify-between">
            <span>Undo</span><span className="ml-8 text-gray-500">Ctrl+Z</span>
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap flex justify-between">
            <span>Redo</span><span className="ml-8 text-gray-500">Ctrl+Y</span>
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap flex justify-between">
            <span>Cut</span><span className="ml-8 text-gray-500">Ctrl+X</span>
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap flex justify-between">
            <span>Copy</span><span className="ml-8 text-gray-500">Ctrl+C</span>
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap flex justify-between">
            <span>Paste</span><span className="ml-8 text-gray-500">Ctrl+V</span>
          </div>
        </div>
      </div>

      <div className="relative group">
        <span className="px-2 hover:bg-gray-300 cursor-pointer">View</span>
        <div className="absolute left-0 top-full bg-gray-200 border border-gray-400 shadow-md hidden group-hover:block z-50">
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showCodeEditor' } })}>
            Code
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showCodeEditor' } })}>
            Object
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => handleToggleWindow('showProjectExplorer')}>
            {state.showProjectExplorer ? '✓ ' : ''}Project Explorer
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => handleToggleWindow('showPropertiesWindow')}>
            {state.showPropertiesWindow ? '✓ ' : ''}Properties Window
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => handleToggleWindow('showToolbox')}>
            {state.showToolbox ? '✓ ' : ''}Toolbox
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => handleToggleWindow('showImmediateWindow')}>
            {state.showImmediateWindow ? '✓ ' : ''}Immediate Window
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => handleToggleWindow('showWatchWindow')}>
            {state.showWatchWindow ? '✓ ' : ''}Watch Window
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => handleToggleWindow('showLocalsWindow')}>
            {state.showLocalsWindow ? '✓ ' : ''}Locals Window
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => handleToggleWindow('showCallStack')}>
            {state.showCallStack ? '✓ ' : ''}Call Stack
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showObjectBrowser', show: true } })}>
            Object Browser
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showFormLayout', show: true } })}>
            Form Layout Window
          </div>
        </div>
      </div>

      <div className="relative group">
        <span className="px-2 hover:bg-gray-300 cursor-pointer">Project</span>
        <div className="absolute left-0 top-full bg-gray-200 border border-gray-400 shadow-md hidden group-hover:block z-50">
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap">
            Add Form
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap">
            Add Module
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showReferences', show: true } })}>
            References...
          </div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap" 
               onClick={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showComponents', show: true } })}>
            Components...
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap"
               onClick={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showMenuEditor', show: true } })}>
            Menu Editor...
          </div>
          <div className="border-t border-gray-400 my-1"></div>
          <div className="hover:bg-blue-600 hover:text-white px-4 py-1 cursor-pointer whitespace-nowrap"
               onClick={() => dispatch({ type: 'SHOW_DIALOG', payload: { dialogName: 'showUserControlDesigner', show: true } })}>
            Add User Control...
          </div>
        </div>
      </div>

      <span className="px-2 hover:bg-gray-300 cursor-pointer">Format</span>
      <span className="px-2 hover:bg-gray-300 cursor-pointer">Debug</span>
      <span className="px-2 hover:bg-gray-300 cursor-pointer">Run</span>
      <span className="px-2 hover:bg-gray-300 cursor-pointer">Tools</span>
      <span className="px-2 hover:bg-gray-300 cursor-pointer">Help</span>
    </div>
  );
};

export default MenuBar;