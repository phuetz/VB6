import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Settings, Play, ArrowRight, FileText, Star } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  action: () => void;
  shortcut?: string;
  icon?: React.ReactNode;
  tags?: string[];
  description?: string;
  favorite?: boolean;
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ visible, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'all' | 'favorites' | 'recent'>('all');

  const inputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  // Sample commands
  useEffect(() => {
    const sampleCommands: CommandItem[] = [
      {
        id: 'new-project',
        title: 'New Project',
        category: 'File',
        action: () => console.log('New Project'),
        shortcut: 'Ctrl+N',
        icon: <FileText size={16} />,
        tags: ['create', 'project', 'new', 'file'],
        description: 'Create a new VB6 project',
      },
      {
        id: 'open-project',
        title: 'Open Project',
        category: 'File',
        action: () => console.log('Open Project'),
        shortcut: 'Ctrl+O',
        icon: <FileText size={16} />,
        tags: ['open', 'project', 'file'],
        description: 'Open an existing VB6 project',
      },
      {
        id: 'save-project',
        title: 'Save Project',
        category: 'File',
        action: () => console.log('Save Project'),
        shortcut: 'Ctrl+S',
        icon: <FileText size={16} />,
        favorite: true,
        tags: ['save', 'project', 'file'],
        description: 'Save the current project',
      },
      {
        id: 'run-project',
        title: 'Run Project',
        category: 'Debug',
        action: () => console.log('Run Project'),
        shortcut: 'F5',
        icon: <Play size={16} />,
        favorite: true,
        tags: ['run', 'execute', 'debug'],
        description: 'Run the current project',
      },
      {
        id: 'settings',
        title: 'Open Settings',
        category: 'Tools',
        action: () => console.log('Open Settings'),
        icon: <Settings size={16} />,
        tags: ['settings', 'options', 'preferences'],
        description: 'Open the IDE settings',
      },
      {
        id: 'code-analyzer',
        title: 'Analyze Code',
        category: 'Tools',
        action: () => console.log('Analyze Code'),
        icon: <ArrowRight size={16} />,
        tags: ['analyze', 'lint', 'check'],
        description: 'Run code analysis on the current project',
      },
      {
        id: 'format-code',
        title: 'Format Code',
        category: 'Edit',
        action: () => console.log('Format Code'),
        shortcut: 'Shift+Alt+F',
        tags: ['format', 'beautify', 'indent'],
        description: 'Format the current document',
      },
      {
        id: 'toggle-breakpoint',
        title: 'Toggle Breakpoint',
        category: 'Debug',
        action: () => console.log('Toggle Breakpoint'),
        shortcut: 'F9',
        tags: ['debug', 'breakpoint'],
        description: 'Toggle a breakpoint on the current line',
      },
    ];

    setCommands(sampleCommands);
    setRecentCommands(['run-project', 'save-project', 'format-code']);
  }, []);

  useEffect(() => {
    if (visible && inputRef.current) {
      // Focus input when palette becomes visible
      inputRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm, activeView]);

  // Define executeCommand before using it in useEffect
  const executeCommand = useCallback((command: CommandItem) => {
    command.action();

    // Add to recent commands
    setRecentCommands(prev => {
      const newRecent = prev.filter(id => id !== command.id);
      return [command.id, ...newRecent].slice(0, 5);
    });

    onClose();
  }, [onClose]);

  // Filter commands based on search and active view
  const filteredCommands = commands.filter(cmd => {
    const matchesSearch =
      searchTerm === '' ||
      cmd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesView =
      activeView === 'all' ||
      (activeView === 'favorites' && cmd.favorite) ||
      (activeView === 'recent' && recentCommands.includes(cmd.id));

    return matchesSearch && matchesView;
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case '1':
          if (e.ctrlKey) {
            e.preventDefault();
            setActiveView('all');
          }
          break;
        case '2':
          if (e.ctrlKey) {
            e.preventDefault();
            setActiveView('favorites');
          }
          break;
        case '3':
          if (e.ctrlKey) {
            e.preventDefault();
            setActiveView('recent');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, selectedIndex, activeView, filteredCommands, executeCommand, onClose]);

  // Scroll to selected item
  useEffect(() => {
    if (commandListRef.current) {
      const selectedElement = commandListRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const toggleFavorite = (commandId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommands(prev =>
      prev.map(cmd => (cmd.id === commandId ? { ...cmd, favorite: !cmd.favorite } : cmd))
    );
  };

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-start justify-center pt-32 z-50">
      <div
        className="bg-white rounded-lg shadow-2xl border border-gray-300"
        style={{ width: '600px' }}
      >
        {/* Search input */}
        <div className="flex items-center p-3 border-b border-gray-300">
          <Command size={18} className="text-gray-400 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 outline-none text-sm"
          />
        </div>

        {/* Views switcher */}
        <div className="flex border-b border-gray-300">
          <button
            className={`flex-1 py-1.5 text-xs font-medium ${activeView === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveView('all')}
          >
            All Commands
          </button>
          <button
            className={`flex-1 py-1.5 text-xs font-medium ${activeView === 'favorites' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveView('favorites')}
          >
            Favorites
          </button>
          <button
            className={`flex-1 py-1.5 text-xs font-medium ${activeView === 'recent' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveView('recent')}
          >
            Recent
          </button>
        </div>

        {/* Commands list */}
        <div
          ref={commandListRef}
          className="max-h-80 overflow-y-auto"
          style={{ scrollbarWidth: 'thin' }}
        >
          {Object.entries(groupedCommands).length > 0 ? (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category}>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                  {category}
                </div>
                {commands.map((command, index) => {
                  const commandIndex = filteredCommands.indexOf(command);
                  return (
                    <div
                      key={command.id}
                      data-index={commandIndex}
                      className={`px-3 py-2 flex items-center justify-between cursor-pointer ${
                        commandIndex === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => executeCommand(command)}
                    >
                      <div className="flex items-center">
                        {command.icon && <span className="mr-2 text-gray-500">{command.icon}</span>}
                        <div>
                          <div className="text-sm">{command.title}</div>
                          {command.description && (
                            <div className="text-xs text-gray-500">{command.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button
                          className={`mr-2 p-1 rounded hover:bg-gray-200 ${command.favorite ? 'text-yellow-500' : 'text-gray-400'}`}
                          onClick={e => toggleFavorite(command.id, e)}
                          title={command.favorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star size={14} fill={command.favorite ? 'currentColor' : 'none'} />
                        </button>
                        {command.shortcut && (
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            {command.shortcut}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No commands match your search.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-gray-300 bg-gray-50 flex justify-between text-xs text-gray-500">
          <div>
            <span className="mr-4">↑↓ to navigate</span>
            <span className="mr-4">↵ to execute</span>
            <span>Esc to close</span>
          </div>
          <div>
            <span className="mr-2">Ctrl+1: All</span>
            <span className="mr-2">Ctrl+2: Favorites</span>
            <span>Ctrl+3: Recent</span>
          </div>
        </div>
      </div>
    </div>
  );
};
