import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useVB6Store } from '../../../stores/vb6Store';

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
  { type: 'CommandButton', icon: '🔘', name: 'CommandButton', description: 'Button control', category: 'General', defaultSize: { width: 89, height: 25 } },
  { type: 'Label', icon: '🏷️', name: 'Label', description: 'Display text', category: 'General', defaultSize: { width: 65, height: 17 } },
  { type: 'TextBox', icon: '📝', name: 'TextBox', description: 'Text input', category: 'General', defaultSize: { width: 121, height: 21 } },
  { type: 'Frame', icon: '📦', name: 'Frame', description: 'Group controls', category: 'General', defaultSize: { width: 121, height: 97 } },
  { type: 'CheckBox', icon: '☑️', name: 'CheckBox', description: 'Checkbox control', category: 'General', defaultSize: { width: 121, height: 17 } },
  { type: 'OptionButton', icon: '⚪', name: 'OptionButton', description: 'Radio button', category: 'General', defaultSize: { width: 121, height: 17 } },
  { type: 'ComboBox', icon: '📋', name: 'ComboBox', description: 'Dropdown list', category: 'General', defaultSize: { width: 121, height: 21 } },
  { type: 'ListBox', icon: '📜', name: 'ListBox', description: 'List of items', category: 'General', defaultSize: { width: 121, height: 97 } },
  { type: 'Timer', icon: '⏱️', name: 'Timer', description: 'Timer control', category: 'General', defaultSize: { width: 32, height: 32 } },
  
  // ActiveX Controls
  { type: 'TabStrip', icon: '📑', name: 'TabStrip', description: 'Tab container', category: 'ActiveX', defaultSize: { width: 241, height: 145 } },
  { type: 'TreeView', icon: '🌳', name: 'TreeView', description: 'Tree view control', category: 'ActiveX', defaultSize: { width: 121, height: 97 } },
  { type: 'ListView', icon: '📋', name: 'ListView', description: 'List view control', category: 'ActiveX', defaultSize: { width: 121, height: 97 } },
  { type: 'ProgressBar', icon: '📶', name: 'ProgressBar', description: 'Progress indicator', category: 'ActiveX', defaultSize: { width: 121, height: 21 } },
];

const CONTROL_CATEGORIES = ['General', 'ActiveX', 'Data', 'Internet'];

interface DraggableControlProps {
  control: ControlDefinition;
  isSelected: boolean;
  onSelect: () => void;
}

const DraggableControl: React.FC<DraggableControlProps> = ({ control, isSelected, onSelect }) => {
  const { executionMode } = useVB6Store();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `toolbox-${control.type}`,
    data: {
      type: 'toolbox-control',
      controlType: control.type,
    },
    disabled: executionMode === 'run' || control.type === 'Pointer',
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative bg-gray-200 border border-gray-400 p-2 text-center cursor-pointer hover:bg-gray-300 text-xs select-none transition-all ${
        isSelected ? 'bg-blue-200 border-blue-500' : ''
      } ${isDragging ? 'shadow-lg' : ''}`}
      onClick={onSelect}
      title={`${control.name}\n${control.description}\nSize: ${control.defaultSize.width}×${control.defaultSize.height}`}
    >
      <div className="text-lg mb-1">{control.icon}</div>
      <div className="text-xs leading-tight">{control.name}</div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
      )}
      
      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 pointer-events-none" />
      )}
    </div>
  );
};

const ModernToolbox: React.FC = () => {
  const { toggleWindow } = useVB6Store();
  const [selectedCategory, setSelectedCategory] = React.useState('General');
  const [selectedTool, setSelectedTool] = React.useState('Pointer');

  const handleToolSelect = (controlDef: ControlDefinition) => {
    setSelectedTool(controlDef.type);
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
          onClick={() => toggleWindow('showToolbox')}
          className="hover:bg-blue-700 px-1"
        >
          ×
        </button>
      </div>
      
      {/* Category Tabs */}
      <div className="border-b border-gray-300">
        <div className="flex flex-wrap">
          {CONTROL_CATEGORIES.map((category) => (
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
            <DraggableControl
              key={controlDef.type}
              control={controlDef}
              isSelected={selectedTool === controlDef.type}
              onSelect={() => handleToolSelect(controlDef)}
            />
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
    </div>
  );
};

export default ModernToolbox;