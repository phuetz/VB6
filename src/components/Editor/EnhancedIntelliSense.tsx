import React, { useEffect, useState, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

interface IntelliSenseItem {
  label: string;
  type: 'keyword' | 'function' | 'property' | 'method' | 'variable' | 'constant' | 'class' | 'event';
  description: string;
  snippet?: string;
  documentation?: string;
  icon?: string;
  insertText?: string;
}

interface EnhancedIntelliSenseProps {
  visible: boolean;
  items: IntelliSenseItem[];
  position: { x: number; y: number };
  onSelect: (item: IntelliSenseItem) => void;
  onClose: () => void;
  filterText?: string;
  darkMode?: boolean;
}

export const EnhancedIntelliSense: React.FC<EnhancedIntelliSenseProps> = ({
  visible,
  items,
  position,
  onSelect,
  onClose,
  filterText = '',
  darkMode = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredItems, setFilteredItems] = useState<IntelliSenseItem[]>(items);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Filter items based on filterText
  useEffect(() => {
    if (!filterText) {
      setFilteredItems(items);
      return;
    }
    
    const filtered = items.filter(item => 
      item.label.toLowerCase().includes(filterText.toLowerCase())
    );
    
    setFilteredItems(filtered);
    setSelectedIndex(0); // Reset selection when filter changes
  }, [items, filterText]);
  
  // Handle key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredItems.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            onSelect(filteredItems[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'F1':
          e.preventDefault();
          setShowDocumentation(prev => !prev);
          break;
        case 'ArrowRight':
          if (e.ctrlKey) {
            e.preventDefault();
            setShowDocumentation(true);
          }
          break;
        case 'ArrowLeft':
          if (e.ctrlKey) {
            e.preventDefault();
            setShowDocumentation(false);
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, filteredItems, selectedIndex, onSelect, onClose]);
  
  // Ensure selected item is visible in the list
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const selectedElement = container.querySelector(`[data-index="${selectedIndex}"]`);
    
    if (selectedElement) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = selectedElement.getBoundingClientRect();
      
      if (elementRect.bottom > containerRect.bottom) {
        container.scrollTop += (elementRect.bottom - containerRect.bottom);
      } else if (elementRect.top < containerRect.top) {
        container.scrollTop -= (containerRect.top - elementRect.top);
      }
    }
  }, [selectedIndex]);
  
  if (!visible || filteredItems.length === 0) return null;
  
  const getIconForType = (type: string) => {
    switch (type) {
      case 'keyword': return 'K';
      case 'function': return 'F';
      case 'property': return 'P';
      case 'method': return 'M';
      case 'variable': return 'V';
      case 'constant': return 'C';
      case 'class': return 'L';
      case 'event': return 'E';
      default: return '?';
    }
  };
  
  const getColorForType = (type: string) => {
    switch (type) {
      case 'keyword': return 'bg-blue-200 text-blue-800';
      case 'function': return 'bg-green-200 text-green-800';
      case 'property': return 'bg-orange-200 text-orange-800';
      case 'method': return 'bg-purple-200 text-purple-800';
      case 'variable': return 'bg-gray-200 text-gray-800';
      case 'constant': return 'bg-red-200 text-red-800';
      case 'class': return 'bg-teal-200 text-teal-800';
      case 'event': return 'bg-yellow-200 text-yellow-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };
  
  const selectedItem = filteredItems[selectedIndex];

  return (
    <div 
      className="fixed z-50 flex"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {/* Main list */}
      <div
        ref={containerRef} 
        className={`border shadow-lg max-h-64 w-64 overflow-y-auto ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-400'
        }`}
      >
        {filteredItems.map((item, index) => (
          <div
            key={index}
            data-index={index}
            className={`px-2 py-1 cursor-pointer text-xs flex items-center ${
              index === selectedIndex 
                ? darkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-500 text-white' 
                : darkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-800'
            }`}
            onClick={() => onSelect(item)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center mr-2 ${getColorForType(item.type)}`}>
              {item.icon || getIconForType(item.type)}
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center">
                <span className="font-medium truncate">{item.label}</span>
                {item.snippet && <ChevronRight size={12} className="ml-1 opacity-70" />}
              </div>
              <div className={`text-xs truncate ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {item.description}
              </div>
            </div>
            
            {showDocumentation && (
              <button 
                className="ml-2 w-5 h-5 flex items-center justify-center hover:bg-blue-300 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDocumentation(true);
                }}
              >
                ?
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Documentation panel */}
      {showDocumentation && selectedItem && (
        <div 
          className={`border shadow-lg w-64 ml-1 p-3 ${
            darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-400 text-gray-800'
          }`}
        >
          <div className={`text-sm font-bold mb-1 flex items-center gap-1 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <div className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center mr-1 ${getColorForType(selectedItem.type)}`}>
              {selectedItem.icon || getIconForType(selectedItem.type)}
            </div>
            {selectedItem.label}
          </div>
          
          <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}
          </div>
          
          <div className="text-xs mb-3">
            {selectedItem.description}
          </div>
          
          {selectedItem.documentation && (
            <div className="text-xs mb-2">
              <div className={`font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Documentation:
              </div>
              <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedItem.documentation}
              </div>
            </div>
          )}
          
          {selectedItem.snippet && (
            <div className="text-xs">
              <div className={`font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Snippet:
              </div>
              <div className={`p-2 rounded font-mono text-xs whitespace-pre ${
                darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedItem.snippet}
              </div>
            </div>
          )}
          
          <div className="text-xs mt-3 pt-2 border-t border-gray-300 text-gray-500">
            Press F1 to toggle documentation panel
          </div>
        </div>
      )}
    </div>
  );
};