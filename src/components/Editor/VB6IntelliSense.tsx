import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Code, FileText, Function, Variable, Database, Zap, Package, Repeat, GitBranch, AlertCircle } from 'lucide-react';
import { vb6Keywords, vb6Functions, vb6Properties, vb6Events } from '../../data/vb6Syntax';
import { vb6Snippets, VB6Snippet, expandSnippet } from '../../data/vb6Snippets';
import { useVB6Store } from '../../stores/vb6Store';

interface IntelliSenseProps {
  visible: boolean;
  position: { x: number; y: number };
  currentWord: string;
  onSelect: (value: string, isSnippet?: boolean, snippet?: VB6Snippet) => void;
  onClose: () => void;
  context?: 'general' | 'object' | 'event';
  targetObject?: string;
}

interface IntelliSenseItem {
  label: string;
  kind: 'keyword' | 'function' | 'property' | 'event' | 'variable' | 'snippet' | 'object' | 'method';
  detail?: string;
  documentation?: string;
  insertText?: string;
  snippet?: VB6Snippet;
}

const kindIcons = {
  keyword: <Code size={16} className="text-blue-500" />,
  function: <Function size={16} className="text-green-500" />,
  property: <Package size={16} className="text-orange-500" />,
  event: <Zap size={16} className="text-purple-500" />,
  variable: <Variable size={16} className="text-cyan-500" />,
  snippet: <FileText size={16} className="text-pink-500" />,
  object: <Database size={16} className="text-indigo-500" />,
  method: <GitBranch size={16} className="text-teal-500" />
};

const kindColors = {
  keyword: 'bg-blue-50 text-blue-700',
  function: 'bg-green-50 text-green-700',
  property: 'bg-orange-50 text-orange-700',
  event: 'bg-purple-50 text-purple-700',
  variable: 'bg-cyan-50 text-cyan-700',
  snippet: 'bg-pink-50 text-pink-700',
  object: 'bg-indigo-50 text-indigo-700',
  method: 'bg-teal-50 text-teal-700'
};

export const VB6IntelliSense: React.FC<IntelliSenseProps> = ({
  visible,
  position,
  currentWord,
  onSelect,
  onClose,
  context = 'general',
  targetObject
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  const { controls } = useVB6Store();

  // Get suggestions based on context
  const suggestions = useMemo(() => {
    const items: IntelliSenseItem[] = [];
    const word = currentWord.toLowerCase();

    if (context === 'object' && targetObject) {
      // Object-specific suggestions
      const control = controls.find(c => c.Name === targetObject);
      if (control) {
        // Add properties
        const controlProperties = vb6Properties[control.type] || vb6Properties.common || [];
        controlProperties.forEach(prop => {
          if (prop.toLowerCase().includes(word)) {
            items.push({
              label: prop,
              kind: 'property',
              detail: `${control.type}.${prop}`,
              documentation: `Property of ${control.type} control`
            });
          }
        });

        // Add methods
        const methods = ['SetFocus', 'Refresh', 'Move', 'ZOrder'];
        methods.forEach(method => {
          if (method.toLowerCase().includes(word)) {
            items.push({
              label: method,
              kind: 'method',
              detail: `${control.type}.${method}`,
              documentation: `Method of ${control.type} control`
            });
          }
        });
      }
    } else if (context === 'event') {
      // Event suggestions
      vb6Events.forEach(event => {
        if (event.toLowerCase().includes(word)) {
          items.push({
            label: event,
            kind: 'event',
            detail: 'Event',
            documentation: `${event} event handler`
          });
        }
      });
    } else {
      // General context
      
      // Add snippets first (highest priority)
      vb6Snippets.forEach(snippet => {
        if (snippet.prefix.toLowerCase().startsWith(word) || 
            snippet.name.toLowerCase().includes(word)) {
          items.push({
            label: snippet.prefix,
            kind: 'snippet',
            detail: snippet.name,
            documentation: snippet.description,
            insertText: snippet.body,
            snippet: snippet
          });
        }
      });

      // Add keywords
      vb6Keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(word)) {
          items.push({
            label: keyword,
            kind: 'keyword',
            detail: 'Keyword',
            documentation: `VB6 keyword: ${keyword}`
          });
        }
      });

      // Add functions
      vb6Functions.forEach(func => {
        if (func.name.toLowerCase().includes(word)) {
          items.push({
            label: func.name,
            kind: 'function',
            detail: func.syntax,
            documentation: func.description
          });
        }
      });

      // Add control names as objects
      controls.forEach(control => {
        if (control.Name.toLowerCase().includes(word)) {
          items.push({
            label: control.Name,
            kind: 'object',
            detail: control.type,
            documentation: `${control.type} control`
          });
        }
      });

      // Add common objects
      const commonObjects = ['Me', 'App', 'Screen', 'Printer', 'Clipboard', 'Err'];
      commonObjects.forEach(obj => {
        if (obj.toLowerCase().includes(word)) {
          items.push({
            label: obj,
            kind: 'object',
            detail: 'Built-in Object',
            documentation: `VB6 built-in object: ${obj}`
          });
        }
      });
    }

    // Sort by relevance
    return items.sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.label.toLowerCase() === word;
      const bExact = b.label.toLowerCase() === word;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Then by start match
      const aStarts = a.label.toLowerCase().startsWith(word);
      const bStarts = b.label.toLowerCase().startsWith(word);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Then by kind priority
      const kindPriority = ['snippet', 'object', 'function', 'property', 'method', 'keyword', 'event', 'variable'];
      const aPriority = kindPriority.indexOf(a.kind);
      const bPriority = kindPriority.indexOf(b.kind);
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Finally alphabetically
      return a.label.localeCompare(b.label);
    });
  }, [currentWord, context, targetObject, controls]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            const item = suggestions[selectedIndex];
            onSelect(
              item.insertText || item.label, 
              item.kind === 'snippet',
              item.snippet
            );
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case ' ':
          if (e.ctrlKey) {
            e.preventDefault();
            setShowDetails(!showDetails);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, suggestions, selectedIndex, onSelect, onClose, showDetails]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      const listRect = listRef.current.getBoundingClientRect();
      const itemRect = selectedRef.current.getBoundingClientRect();

      if (itemRect.bottom > listRect.bottom) {
        selectedRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
      } else if (itemRect.top < listRect.top) {
        selectedRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  if (!visible || suggestions.length === 0) return null;

  const selectedItem = suggestions[selectedIndex];

  return (
    <div
      className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn"
      style={{
        left: position.x,
        top: position.y,
        maxHeight: '400px',
        width: showDetails ? '600px' : '300px',
        display: 'flex'
      }}
    >
      {/* Suggestions List */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto"
        style={{ maxWidth: showDetails ? '300px' : '100%' }}
      >
        {suggestions.map((item, index) => (
          <div
            key={`${item.kind}-${item.label}`}
            ref={index === selectedIndex ? selectedRef : null}
            className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
              index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              setSelectedIndex(index);
              onSelect(
                item.insertText || item.label,
                item.kind === 'snippet',
                item.snippet
              );
            }}
          >
            {kindIcons[item.kind]}
            <span className="flex-1 font-mono text-sm">{item.label}</span>
            {item.kind === 'snippet' && (
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">
                snippet
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Details Panel */}
      {showDetails && selectedItem && (
        <div className="w-[300px] border-l border-gray-200 p-4 bg-gray-50">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              {kindIcons[selectedItem.kind]}
              <span className="font-mono font-semibold">{selectedItem.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${kindColors[selectedItem.kind]}`}>
                {selectedItem.kind}
              </span>
            </div>

            {/* Detail */}
            {selectedItem.detail && (
              <div className="text-sm text-gray-600 font-mono bg-white p-2 rounded">
                {selectedItem.detail}
              </div>
            )}

            {/* Documentation */}
            {selectedItem.documentation && (
              <div className="text-sm text-gray-700">
                {selectedItem.documentation}
              </div>
            )}

            {/* Snippet Preview */}
            {selectedItem.snippet && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-semibold">Preview:</div>
                <pre className="text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto">
                  {selectedItem.snippet.body}
                </pre>
                {selectedItem.snippet.placeholders && (
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold">Tab stops:</span>
                    {selectedItem.snippet.placeholders.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && ', '}
                        {p.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Keyboard hints */}
            <div className="text-xs text-gray-500 border-t pt-2">
              <div>↑↓ Navigate • Enter/Tab Accept • Esc Cancel</div>
              {showDetails && <div>Ctrl+Space Toggle details</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VB6IntelliSense;