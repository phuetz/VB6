import React, { useState, useCallback, useMemo } from 'react';
import { DraggableItem } from '../../DragDrop/DraggableItem';
import { PulseHighlight } from '../../DragDrop/AnimatedTransitions';
import { useVB6Store } from '../../../stores/vb6Store';
import { useWindowStore } from '../../../stores/windowStore';
import { controlCategories } from '../../../data/controlCategories';

interface ToolboxProps {
  className?: string;
  onShowActiveXManager?: () => void;
}

const CATEGORY_NAMES = Object.keys(controlCategories);

const Toolbox: React.FC<ToolboxProps> = ({ className = '', onShowActiveXManager }) => {
  const executionMode = useVB6Store(state => state.executionMode);
  const toggleWindow = useWindowStore(state => state.toggleWindow);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_NAMES[0]);
  const [selectedTool, setSelectedTool] = useState('Pointer');
  const [searchTerm, setSearchTerm] = useState('');

  const handleToolSelect = useCallback((controlType: string) => {
    setSelectedTool(controlType);
  }, []);

  const currentControls =
    controlCategories[selectedCategory as keyof typeof controlCategories] || [];

  const filteredControls = useMemo(() => {
    if (!searchTerm) return currentControls;
    const term = searchTerm.toLowerCase();
    return currentControls.filter(
      control =>
        control.name.toLowerCase().includes(term) || control.type.toLowerCase().includes(term)
    );
  }, [currentControls, searchTerm]);

  return (
    <div
      className={`w-64 bg-gray-100 border-r border-gray-400 flex flex-col ${className}`}
      role="region"
      aria-label="Control Toolbox"
    >
      {/* Header */}
      <div className="bg-blue-600 text-white text-xs font-bold p-2 flex items-center justify-between">
        <span>Toolbox</span>
        <button
          onClick={() => toggleWindow('showToolbox')}
          className="hover:bg-blue-700 px-1"
          aria-label="Close Toolbox"
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-300">
        <input
          type="text"
          placeholder="Search controls..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          aria-label="Search controls"
        />
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-300">
        <div className="flex flex-wrap" role="tablist" aria-label="Control categories">
          {CATEGORY_NAMES.map(category => (
            <button
              key={category}
              role="tab"
              aria-selected={selectedCategory === category}
              className={`text-xs p-1 border-r border-gray-300 ${
                selectedCategory === category
                  ? 'bg-white border-b-2 border-blue-600 font-semibold'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedCategory(category)}
              style={{ minWidth: '45px' }}
            >
              {category.length > 7 ? category.substring(0, 5) + '.' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="flex-1 overflow-y-auto p-2" role="tabpanel">
        <div
          className="grid grid-cols-2 gap-1"
          role="listbox"
          aria-label={`${selectedCategory} controls`}
        >
          {filteredControls.map(control => (
            <DraggableItem
              key={control.type}
              id={`toolbox-${control.type}`}
              data={{
                type: 'new-control',
                controlType: control.type,
                name: control.name,
                icon: control.icon,
                allowCopy: true,
              }}
              disabled={
                executionMode === 'run' ||
                ('special' in control && control.special === 'activex-manager')
              }
              role="option"
              aria-selected={selectedTool === control.type}
              aria-label={control.name}
              tabIndex={0}
              className={`relative bg-gray-200 border border-gray-400 p-2 text-center text-xs select-none transition-all duration-200 hover:bg-gray-300 hover:shadow-md ${
                selectedTool === control.type ? 'bg-blue-200 border-blue-500 shadow-md' : ''
              }`}
              onDragStart={() => handleToolSelect(control.type)}
              onClick={() => {
                if ('special' in control && control.special === 'activex-manager') {
                  onShowActiveXManager?.();
                } else {
                  handleToolSelect(control.type);
                }
              }}
            >
              <PulseHighlight isActive={selectedTool === control.type} color="rgb(59, 130, 246)">
                <div className="relative">
                  <div className="text-lg mb-1">{control.icon}</div>
                  <div className="text-xs leading-tight font-medium">{control.name}</div>
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
            <div className="mb-2">No controls found</div>
            <div className="text-xs mt-1">Try adjusting your search or category</div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="border-t border-gray-300 p-2 bg-gray-50">
        <div className="text-xs">
          <div className="font-semibold mb-1">
            {currentControls.find(c => c.type === selectedTool)?.name || selectedTool}
          </div>
          <div className="flex justify-between items-center text-gray-500">
            <span>{filteredControls.length} controls</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Toolbox };
export default Toolbox;
