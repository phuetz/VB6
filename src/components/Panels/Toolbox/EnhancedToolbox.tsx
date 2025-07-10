import React, { useState, useCallback } from 'react';
import { DraggableItem } from '../../DragDrop/DraggableItem';
import { PulseHighlight } from '../../DragDrop/AnimatedTransitions';
import { useVB6Store } from '../../../stores/vb6Store';

interface ControlDefinition {
  type: string;
  icon: string;
  name: string;
  description: string;
  category: string;
  defaultSize: { width: number; height: number };
  keywords: string[];
}

const VB6_CONTROLS: ControlDefinition[] = [
  {
    type: 'Pointer',
    icon: '🖱️',
    name: 'Pointer',
    description: 'Selection tool',
    category: 'General',
    defaultSize: { width: 20, height: 20 },
    keywords: ['select', 'pointer', 'cursor']
  },
  {
    type: 'CommandButton',
    icon: '🔘',
    name: 'CommandButton',
    description: 'Button control for user interaction',
    category: 'General',
    defaultSize: { width: 89, height: 25 },
    keywords: ['button', 'click', 'action']
  },
  {
    type: 'Label',
    icon: '🏷️',
    name: 'Label',
    description: 'Display text and captions',
    category: 'General',
    defaultSize: { width: 65, height: 17 },
    keywords: ['text', 'caption', 'display']
  },
  {
    type: 'TextBox',
    icon: '📝',
    name: 'TextBox',
    description: 'Text input and editing',
    category: 'General',
    defaultSize: { width: 121, height: 21 },
    keywords: ['input', 'text', 'edit', 'type']
  },
  {
    type: 'Frame',
    icon: '📦',
    name: 'Frame',
    description: 'Group and organize controls',
    category: 'General',
    defaultSize: { width: 121, height: 97 },
    keywords: ['group', 'container', 'organize']
  },
  {
    type: 'CheckBox',
    icon: '☑️',
    name: 'CheckBox',
    description: 'Boolean selection control',
    category: 'General',
    defaultSize: { width: 121, height: 17 },
    keywords: ['check', 'boolean', 'option']
  },
  {
    type: 'OptionButton',
    icon: '⚪',
    name: 'OptionButton',
    description: 'Radio button for exclusive selection',
    category: 'General',
    defaultSize: { width: 121, height: 17 },
    keywords: ['radio', 'option', 'choice']
  },
  {
    type: 'ComboBox',
    icon: '📋',
    name: 'ComboBox',
    description: 'Dropdown selection list',
    category: 'General',
    defaultSize: { width: 121, height: 21 },
    keywords: ['dropdown', 'select', 'list']
  },
  {
    type: 'ListBox',
    icon: '📜',
    name: 'ListBox',
    description: 'Scrollable list of items',
    category: 'General',
    defaultSize: { width: 121, height: 97 },
    keywords: ['list', 'items', 'scroll']
  },
  {
    type: 'Timer',
    icon: '⏱️',
    name: 'Timer',
    description: 'Interval-based event trigger',
    category: 'General',
    defaultSize: { width: 32, height: 32 },
    keywords: ['timer', 'interval', 'event']
  },
  // ActiveX Controls
  {
    type: 'TreeView',
    icon: '🌳',
    name: 'TreeView',
    description: 'Hierarchical data display',
    category: 'ActiveX',
    defaultSize: { width: 121, height: 97 },
    keywords: ['tree', 'hierarchy', 'nodes']
  },
  {
    type: 'ListView',
    icon: '📋',
    name: 'ListView',
    description: 'Detailed list with columns',
    category: 'ActiveX',
    defaultSize: { width: 121, height: 97 },
    keywords: ['list', 'details', 'columns']
  },
  {
    type: 'ProgressBar',
    icon: '📶',
    name: 'ProgressBar',
    description: 'Visual progress indicator',
    category: 'ActiveX',
    defaultSize: { width: 121, height: 21 },
    keywords: ['progress', 'bar', 'indicator']
  },
  {
    type: 'TabStrip',
    icon: '📑',
    name: 'TabStrip',
    description: 'Tabbed interface container',
    category: 'ActiveX',
    defaultSize: { width: 241, height: 145 },
    keywords: ['tab', 'pages', 'interface']
  },
];

const CONTROL_CATEGORIES = ['General', 'ActiveX', 'Data', 'Internet', 'Multimedia'];

interface EnhancedToolboxProps {
  className?: string;
}

export const EnhancedToolbox: React.FC<EnhancedToolboxProps> = ({ className = '' }) => {
  const { executionMode, toggleWindow } = useVB6Store(state => ({
    executionMode: state.executionMode,
    toggleWindow: state.toggleWindow
  }));
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [selectedTool, setSelectedTool] = useState('Pointer');
  const [searchTerm, setSearchTerm] = useState('');

  const handleToolSelect = useCallback((controlDef: ControlDefinition) => {
    setSelectedTool(controlDef.type);
  }, []);


  // Filtrage des contrôles
  const filteredControls = VB6_CONTROLS.filter(control => {
    const matchesCategory = control.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`w-64 bg-gray-100 border-r border-gray-400 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white text-xs font-bold p-2 flex items-center justify-between">
        <span>Enhanced Toolbox</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleWindow('showToolbox')}
            className="hover:bg-blue-700 px-1"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Search */}
      <div className="p-2 border-b border-gray-300">
        <input
          type="text"
          placeholder="Search controls..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        />
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
              style={{ minWidth: '45px' }}
            >
              {category.substr(0, 4)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tools Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-1">
          {filteredControls.map((controlDef) => (
            <DraggableItem
              key={controlDef.type}
              id={`toolbox-${controlDef.type}`}
              data={{
                type: 'new-control',
                controlType: controlDef.type,
                name: controlDef.name,
                icon: controlDef.icon,
                defaultSize: controlDef.defaultSize,
                allowCopy: true
              }}
              disabled={executionMode === 'run' || controlDef.type === 'Pointer'}
              className={`relative bg-gray-200 border border-gray-400 p-2 text-center text-xs select-none transition-all duration-200 hover:bg-gray-300 hover:shadow-md ${
                selectedTool === controlDef.type ? 'bg-blue-200 border-blue-500 shadow-md' : ''
              }`}
              onDragStart={() => handleToolSelect(controlDef)}
            >
              <PulseHighlight isActive={selectedTool === controlDef.type} color="rgb(59, 130, 246)">
                <div className="relative">
                  <div className="text-lg mb-1">{controlDef.icon}</div>
                  <div className="text-xs leading-tight font-medium">{controlDef.name}</div>
                  
                  {/* Drag indicator */}
                  <div className="absolute bottom-0 right-0 text-xs text-gray-500 opacity-50">
                    ⋮⋮
                  </div>
                </div>
              </PulseHighlight>
            </DraggableItem>
          ))}
        </div>
        
        {filteredControls.length === 0 && (
          <div className="text-center text-gray-500 text-xs mt-4">
            <div className="mb-2">🔍</div>
            <div>No controls found</div>
            <div className="text-xs mt-1">Try adjusting your search or category</div>
          </div>
        )}
      </div>
      
      {/* Info Panel */}
      <div className="border-t border-gray-300 p-2 bg-gray-50">
        {selectedTool && VB6_CONTROLS.find(c => c.type === selectedTool) && (
          <div className="text-xs">
            <div className="font-semibold mb-1 flex items-center gap-1">
              <span>{VB6_CONTROLS.find(c => c.type === selectedTool)?.icon}</span>
              <span>{VB6_CONTROLS.find(c => c.type === selectedTool)?.name}</span>
            </div>
            <div className="text-gray-600 mb-2 line-clamp-2">
              {VB6_CONTROLS.find(c => c.type === selectedTool)?.description}
            </div>
            {selectedTool !== 'Pointer' && (
              <div className="text-gray-500 text-xs">
                Size: {VB6_CONTROLS.find(c => c.type === selectedTool)?.defaultSize.width}×
                {VB6_CONTROLS.find(c => c.type === selectedTool)?.defaultSize.height}
              </div>
            )}
            
            {/* Usage tip */}
            <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
              <div className="text-gray-600">
                💡 <strong>Tip:</strong> Hold Ctrl while dragging to copy
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick Stats */}
      <div className="border-t border-gray-300 p-2 bg-white text-xs">
        <div className="flex justify-between items-center">
          <span>{filteredControls.length} controls</span>
        </div>
      </div>
    </div>
  );
};