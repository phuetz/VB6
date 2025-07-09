import React from 'react';
import { useVB6 } from '../../../context/VB6Context';

interface ControlDefinition {
  type: string;
  icon: string;
  name: string;
  description: string;
  category: string;
  defaultSize: { width: number; height: number };
}

const VB6_CONTROLS: ControlDefinition[] = [
  // Standard Controls
  { type: 'Pointer', icon: '🖱️', name: 'Pointer', description: 'Selection tool', category: 'General', defaultSize: { width: 20, height: 20 } },
  { type: 'PictureBox', icon: '🖼️', name: 'PictureBox', description: 'Container for graphics', category: 'General', defaultSize: { width: 121, height: 97 } },
  { type: 'Label', icon: '🏷️', name: 'Label', description: 'Display text', category: 'General', defaultSize: { width: 65, height: 17 } },
  { type: 'TextBox', icon: '📝', name: 'TextBox', description: 'Text input', category: 'General', defaultSize: { width: 121, height: 21 } },
  { type: 'Frame', icon: '📦', name: 'Frame', description: 'Group controls', category: 'General', defaultSize: { width: 121, height: 97 } },
  { type: 'CommandButton', icon: '🔘', name: 'CommandButton', description: 'Button control', category: 'General', defaultSize: { width: 89, height: 25 } },
  { type: 'CheckBox', icon: '☑️', name: 'CheckBox', description: 'Checkbox control', category: 'General', defaultSize: { width: 121, height: 17 } },
  { type: 'OptionButton', icon: '⚪', name: 'OptionButton', description: 'Radio button', category: 'General', defaultSize: { width: 121, height: 17 } },
  { type: 'ComboBox', icon: '📋', name: 'ComboBox', description: 'Dropdown list', category: 'General', defaultSize: { width: 121, height: 21 } },
  { type: 'ListBox', icon: '📜', name: 'ListBox', description: 'List of items', category: 'General', defaultSize: { width: 121, height: 97 } },
  { type: 'HScrollBar', icon: '↔️', name: 'HScrollBar', description: 'Horizontal scrollbar', category: 'General', defaultSize: { width: 121, height: 17 } },
  { type: 'VScrollBar', icon: '↕️', name: 'VScrollBar', description: 'Vertical scrollbar', category: 'General', defaultSize: { width: 17, height: 121 } },
  { type: 'Timer', icon: '⏱️', name: 'Timer', description: 'Timer control', category: 'General', defaultSize: { width: 32, height: 32 } },
  { type: 'DriveListBox', icon: '💾', name: 'DriveListBox', description: 'Drive selection', category: 'General', defaultSize: { width: 121, height: 21 } },
  { type: 'DirListBox', icon: '📁', name: 'DirListBox', description: 'Directory list', category: 'General', defaultSize: { width: 121, height: 97 } },
  { type: 'FileListBox', icon: '📄', name: 'FileListBox', description: 'File list', category: 'General', defaultSize: { width: 121, height: 97 } },
  { type: 'Shape', icon: '🔵', name: 'Shape', description: 'Geometric shape', category: 'General', defaultSize: { width: 65, height: 65 } },
  { type: 'Line', icon: '📏', name: 'Line', description: 'Line control', category: 'General', defaultSize: { width: 100, height: 2 } },
  { type: 'Image', icon: '🖼️', name: 'Image', description: 'Image display', category: 'General', defaultSize: { width: 121, height: 97 } },
  { type: 'Data', icon: '🗄️', name: 'Data', description: 'Data control', category: 'General', defaultSize: { width: 121, height: 21 } },
  { type: 'OLE', icon: '🔗', name: 'OLE', description: 'OLE container', category: 'General', defaultSize: { width: 121, height: 97 } },

  // ActiveX Controls
  { type: 'TabStrip', icon: '📑', name: 'TabStrip', description: 'Tab container', category: 'ActiveX', defaultSize: { width: 241, height: 145 } },
  { type: 'Toolbar', icon: '🔧', name: 'Toolbar', description: 'Toolbar control', category: 'ActiveX', defaultSize: { width: 241, height: 25 } },
  { type: 'StatusBar', icon: '📊', name: 'StatusBar', description: 'Status bar', category: 'ActiveX', defaultSize: { width: 241, height: 21 } },
  { type: 'ProgressBar', icon: '📶', name: 'ProgressBar', description: 'Progress indicator', category: 'ActiveX', defaultSize: { width: 121, height: 21 } },
  { type: 'TreeView', icon: '🌳', name: 'TreeView', description: 'Tree view control', category: 'ActiveX', defaultSize: { width: 121, height: 97 } },
  { type: 'ListView', icon: '📋', name: 'ListView', description: 'List view control', category: 'ActiveX', defaultSize: { width: 121, height: 97 } },
  { type: 'ImageList', icon: '🖼️', name: 'ImageList', description: 'Image collection', category: 'ActiveX', defaultSize: { width: 32, height: 32 } },
  { type: 'Slider', icon: '🎚️', name: 'Slider', description: 'Slider control', category: 'ActiveX', defaultSize: { width: 121, height: 21 } },
  { type: 'ImageCombo', icon: '📷', name: 'ImageCombo', description: 'Image combo box', category: 'ActiveX', defaultSize: { width: 121, height: 21 } },
  { type: 'MonthView', icon: '📅', name: 'MonthView', description: 'Calendar control', category: 'ActiveX', defaultSize: { width: 161, height: 161 } },
  { type: 'DateTimePicker', icon: '🗓️', name: 'DateTimePicker', description: 'Date/time picker', category: 'ActiveX', defaultSize: { width: 121, height: 21 } },
  { type: 'FlatScrollBar', icon: '📜', name: 'FlatScrollBar', description: 'Flat scroll bar', category: 'ActiveX', defaultSize: { width: 121, height: 17 } },
  { type: 'UpDown', icon: '🔼', name: 'UpDown', description: 'Spin button', category: 'ActiveX', defaultSize: { width: 17, height: 21 } },
  { type: 'Animation', icon: '🎬', name: 'Animation', description: 'Animation control', category: 'ActiveX', defaultSize: { width: 121, height: 97 } },
  { type: 'RichTextBox', icon: '📝', name: 'RichTextBox', description: 'Rich text editor', category: 'ActiveX', defaultSize: { width: 121, height: 97 } },
  { type: 'MaskedEdit', icon: '🎭', name: 'MaskedEdit', description: 'Masked text input', category: 'ActiveX', defaultSize: { width: 121, height: 21 } },

  // Internet Controls
  { type: 'WebBrowser', icon: '🌐', name: 'WebBrowser', description: 'Web browser control', category: 'Internet', defaultSize: { width: 241, height: 181 } },
  { type: 'Inet', icon: '🌍', name: 'Inet', description: 'Internet transfer', category: 'Internet', defaultSize: { width: 32, height: 32 } },
  { type: 'Winsock', icon: '🔌', name: 'Winsock', description: 'Network socket', category: 'Internet', defaultSize: { width: 32, height: 32 } },

  // Data Controls
  { type: 'DataGrid', icon: '📊', name: 'DataGrid', description: 'Data grid', category: 'Data', defaultSize: { width: 241, height: 145 } },
  { type: 'DataList', icon: '📋', name: 'DataList', description: 'Data list', category: 'Data', defaultSize: { width: 121, height: 97 } },
  { type: 'DataCombo', icon: '📝', name: 'DataCombo', description: 'Data combo box', category: 'Data', defaultSize: { width: 121, height: 21 } },
  { type: 'DataRepeater', icon: '🔁', name: 'DataRepeater', description: 'Data repeater', category: 'Data', defaultSize: { width: 241, height: 145 } },
  { type: 'DataEnvironment', icon: '🏢', name: 'DataEnvironment', description: 'Data environment', category: 'Data', defaultSize: { width: 32, height: 32 } },
  { type: 'DataReport', icon: '📄', name: 'DataReport', description: 'Data report', category: 'Data', defaultSize: { width: 241, height: 181 } },

  // Crystal Reports
  { type: 'CrystalReport', icon: '💎', name: 'CrystalReport', description: 'Crystal Reports', category: 'Reports', defaultSize: { width: 32, height: 32 } },

  // Multimedia
  { type: 'MediaPlayer', icon: '🎵', name: 'MediaPlayer', description: 'Media player', category: 'Multimedia', defaultSize: { width: 241, height: 181 } },
  { type: 'MMControl', icon: '🎮', name: 'MMControl', description: 'Multimedia control', category: 'Multimedia', defaultSize: { width: 241, height: 25 } }
];

const CONTROL_CATEGORIES = ['General', 'ActiveX', 'Internet', 'Data', 'Reports', 'Multimedia'];

const AdvancedToolbox: React.FC = () => {
  const { state, dispatch, createControl } = useVB6();
  const [selectedCategory, setSelectedCategory] = React.useState('General');
  const [selectedTool, setSelectedTool] = React.useState('Pointer');

  const handleToolboxDragStart = (e: React.DragEvent, controlDef: ControlDefinition) => {
    if (state.executionMode === 'run') return;
    
    setSelectedTool(controlDef.type);
    
    dispatch({
      type: 'SET_DRAG_STATE',
      payload: { isDragging: true, controlType: controlDef.type }
    });
    
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('controlType', controlDef.type);
    e.dataTransfer.setData('controlData', JSON.stringify(controlDef));
  };

  const handleToolClick = (controlDef: ControlDefinition) => {
    if (state.executionMode === 'run') return;
    
    setSelectedTool(controlDef.type);
    
    if (controlDef.type === 'Pointer') {
      // Reset to pointer mode
      dispatch({ type: 'SET_DRAG_STATE', payload: { isDragging: false } });
    } else {
      // Create control at default position
      createControl(controlDef.type, 100, 100);
    }
  };

  const filteredControls = VB6_CONTROLS.filter(control => 
    control.category === selectedCategory
  );

  return (
    <div className="w-64 bg-gray-100 border-r border-gray-400 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white text-xs font-bold p-2 flex items-center justify-between">
        <span>Toolbox</span>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showToolbox' } })}
          className="hover:bg-blue-700 px-1"
        >
          ×
        </button>
      </div>
      
      {/* Category Tabs */}
      <div className="border-b border-gray-300">
        <div className="flex flex-wrap">
          {CONTROL_CATEGORIES.map((category, index) => (
            <button
              key={category}
              className={`text-xs p-1 border-r border-gray-300 ${
                selectedCategory === category 
                  ? 'bg-white border-b-2 border-blue-600 font-semibold' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedCategory(category)}
              style={{ minWidth: '50px' }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tools Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-1">
          {filteredControls.map((controlDef) => (
            <div
              key={controlDef.type}
              className={`relative bg-gray-200 border border-gray-400 p-2 text-center cursor-pointer hover:bg-gray-300 text-xs select-none transition-colors ${
                selectedTool === controlDef.type ? 'bg-blue-200 border-blue-500' : ''
              }`}
              draggable={state.executionMode === 'design' && controlDef.type !== 'Pointer'}
              onDragStart={(e) => handleToolboxDragStart(e, controlDef)}
              onDragEnd={() => dispatch({ 
                type: 'SET_DRAG_STATE', 
                payload: { isDragging: false } 
              })}
              onClick={() => handleToolClick(controlDef)}
              title={`${controlDef.name}\n${controlDef.description}\nSize: ${controlDef.defaultSize.width}×${controlDef.defaultSize.height}`}
            >
              <div className="text-lg mb-1">{controlDef.icon}</div>
              <div className="text-xs leading-tight">{controlDef.name}</div>
              
              {/* Selection indicator */}
              {selectedTool === controlDef.type && (
                <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Info Panel */}
      <div className="border-t border-gray-300 p-2 bg-gray-50">
        <div className="text-xs">
          <div className="font-semibold mb-1">
            {VB6_CONTROLS.find(c => c.type === selectedTool)?.name || 'Pointer'}
          </div>
          <div className="text-gray-600 mb-2">
            {VB6_CONTROLS.find(c => c.type === selectedTool)?.description || 'Selection tool'}
          </div>
          {selectedTool !== 'Pointer' && (
            <div className="text-gray-500">
              Default size: {VB6_CONTROLS.find(c => c.type === selectedTool)?.defaultSize.width}×
              {VB6_CONTROLS.find(c => c.type === selectedTool)?.defaultSize.height}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="border-t border-gray-300 p-2 bg-white">
        <div className="text-xs space-y-1">
          <button
            className="w-full text-left hover:bg-gray-100 p-1 rounded"
            onClick={() => setSelectedTool('Pointer')}
          >
            📌 Select pointer tool
          </button>
          <button
            className="w-full text-left hover:bg-gray-100 p-1 rounded"
            onClick={() => {
              // Show all categories
              setSelectedCategory('General');
            }}
          >
            📂 Show all categories
          </button>
          <button
            className="w-full text-left hover:bg-gray-100 p-1 rounded"
            onClick={() => {
              // Toggle toolbox visibility
              dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showToolbox' } });
            }}
          >
            👁️ Toggle toolbox
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedToolbox;