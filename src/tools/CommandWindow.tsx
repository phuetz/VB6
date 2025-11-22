import React, { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { EventEmitter } from 'events';

// Command Window Types
export enum CommandType {
  IDE = 'IDE',
  File = 'File',
  Project = 'Project',
  Debug = 'Debug',
  Build = 'Build',
  Window = 'Window',
  Tool = 'Tool',
  Macro = 'Macro',
  Script = 'Script',
  Alias = 'Alias',
  Custom = 'Custom'
}

export enum CommandStatus {
  Success = 'Success',
  Error = 'Error',
  Warning = 'Warning',
  Info = 'Info',
  Executing = 'Executing'
}

export interface Command {
  name: string;
  type: CommandType;
  description: string;
  syntax: string;
  parameters: CommandParameter[];
  examples: string[];
  aliases: string[];
  category: string;
  isAvailable: boolean;
  requiresProject: boolean;
  requiresDebugMode: boolean;
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'path';
  required: boolean;
  description: string;
  defaultValue?: any;
  validValues?: string[];
}

export interface CommandExecution {
  id: string;
  command: string;
  timestamp: Date;
  status: CommandStatus;
  result?: string;
  error?: string;
  executionTime: number;
  parameters: Record<string, any>;
}

export interface CommandAlias {
  alias: string;
  command: string;
  description: string;
  parameters?: string;
}

export interface CommandHistory {
  commands: string[];
  maxItems: number;
  currentIndex: number;
}

interface CommandWindowProps {
  projectOpen?: boolean;
  debugMode?: boolean;
  onExecuteCommand?: (command: string, parameters: Record<string, any>) => Promise<any>;
  onOpenFile?: (fileName: string) => void;
  onNavigateToLine?: (fileName: string, lineNumber: number) => void;
  onShowWindow?: (windowName: string) => void;
}

export const CommandWindow: React.FC<CommandWindowProps> = ({
  projectOpen = false,
  debugMode = false,
  onExecuteCommand,
  onOpenFile,
  onNavigateToLine,
  onShowWindow
}) => {
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory>({
    commands: [],
    maxItems: 100,
    currentIndex: -1
  });
  const [executionHistory, setExecutionHistory] = useState<CommandExecution[]>([]);
  const [availableCommands, setAvailableCommands] = useState<Command[]>([]);
  const [aliases, setAliases] = useState<CommandAlias[]>([]);
  const [autoComplete, setAutoComplete] = useState<string[]>([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  
  const eventEmitter = useRef(new EventEmitter());
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize commands and aliases
  useEffect(() => {
    const commands: Command[] = [
      // File commands
      {
        name: 'File.Open',
        type: CommandType.File,
        description: 'Open a file in the IDE',
        syntax: 'File.Open <filename>',
        parameters: [
          { name: 'filename', type: 'file', required: true, description: 'Path to the file to open' }
        ],
        examples: ['File.Open "C:\\MyProject\\Form1.frm"', 'File.Open Module1.bas'],
        aliases: ['open', 'fo'],
        category: 'File',
        isAvailable: true,
        requiresProject: false,
        requiresDebugMode: false
      },
      {
        name: 'File.Save',
        type: CommandType.File,
        description: 'Save the current file',
        syntax: 'File.Save [filename]',
        parameters: [
          { name: 'filename', type: 'file', required: false, description: 'Optional filename to save as' }
        ],
        examples: ['File.Save', 'File.Save "NewName.frm"'],
        aliases: ['save', 'fs'],
        category: 'File',
        isAvailable: true,
        requiresProject: false,
        requiresDebugMode: false
      },
      {
        name: 'File.SaveAll',
        type: CommandType.File,
        description: 'Save all modified files',
        syntax: 'File.SaveAll',
        parameters: [],
        examples: ['File.SaveAll'],
        aliases: ['saveall', 'fsa'],
        category: 'File',
        isAvailable: true,
        requiresProject: false,
        requiresDebugMode: false
      },
      // Project commands
      {
        name: 'Project.Open',
        type: CommandType.Project,
        description: 'Open a VB6 project',
        syntax: 'Project.Open <projectfile>',
        parameters: [
          { name: 'projectfile', type: 'file', required: true, description: 'Path to the VBP project file' }
        ],
        examples: ['Project.Open "C:\\MyApp\\MyApp.vbp"'],
        aliases: ['openproject', 'po'],
        category: 'Project',
        isAvailable: true,
        requiresProject: false,
        requiresDebugMode: false
      },
      {
        name: 'Project.Build',
        type: CommandType.Build,
        description: 'Build the current project',
        syntax: 'Project.Build [configuration]',
        parameters: [
          { name: 'configuration', type: 'string', required: false, description: 'Build configuration', validValues: ['Debug', 'Release'] }
        ],
        examples: ['Project.Build', 'Project.Build Debug'],
        aliases: ['build', 'pb'],
        category: 'Build',
        isAvailable: projectOpen,
        requiresProject: true,
        requiresDebugMode: false
      },
      {
        name: 'Project.Run',
        type: CommandType.Debug,
        description: 'Run the current project',
        syntax: 'Project.Run [arguments]',
        parameters: [
          { name: 'arguments', type: 'string', required: false, description: 'Command line arguments' }
        ],
        examples: ['Project.Run', 'Project.Run "/debug"'],
        aliases: ['run', 'pr'],
        category: 'Debug',
        isAvailable: projectOpen,
        requiresProject: true,
        requiresDebugMode: false
      },
      // Debug commands
      {
        name: 'Debug.Start',
        type: CommandType.Debug,
        description: 'Start debugging',
        syntax: 'Debug.Start',
        parameters: [],
        examples: ['Debug.Start'],
        aliases: ['debug', 'ds'],
        category: 'Debug',
        isAvailable: projectOpen,
        requiresProject: true,
        requiresDebugMode: false
      },
      {
        name: 'Debug.Stop',
        type: CommandType.Debug,
        description: 'Stop debugging',
        syntax: 'Debug.Stop',
        parameters: [],
        examples: ['Debug.Stop'],
        aliases: ['stop'],
        category: 'Debug',
        isAvailable: debugMode,
        requiresProject: true,
        requiresDebugMode: true
      },
      {
        name: 'Debug.StepInto',
        type: CommandType.Debug,
        description: 'Step into the next line',
        syntax: 'Debug.StepInto',
        parameters: [],
        examples: ['Debug.StepInto'],
        aliases: ['stepin', 'si'],
        category: 'Debug',
        isAvailable: debugMode,
        requiresProject: true,
        requiresDebugMode: true
      },
      {
        name: 'Debug.StepOver',
        type: CommandType.Debug,
        description: 'Step over the next line',
        syntax: 'Debug.StepOver',
        parameters: [],
        examples: ['Debug.StepOver'],
        aliases: ['stepover', 'so'],
        category: 'Debug',
        isAvailable: debugMode,
        requiresProject: true,
        requiresDebugMode: true
      },
      // Window commands
      {
        name: 'Window.Show',
        type: CommandType.Window,
        description: 'Show a specific window',
        syntax: 'Window.Show <windowname>',
        parameters: [
          { name: 'windowname', type: 'string', required: true, description: 'Name of the window to show', 
            validValues: ['Properties', 'Toolbox', 'ProjectExplorer', 'Immediate', 'Locals', 'Watch', 'CallStack', 'Output'] }
        ],
        examples: ['Window.Show Properties', 'Window.Show Immediate'],
        aliases: ['show', 'ws'],
        category: 'Window',
        isAvailable: true,
        requiresProject: false,
        requiresDebugMode: false
      },
      {
        name: 'Window.Hide',
        type: CommandType.Window,
        description: 'Hide a specific window',
        syntax: 'Window.Hide <windowname>',
        parameters: [
          { name: 'windowname', type: 'string', required: true, description: 'Name of the window to hide' }
        ],
        examples: ['Window.Hide Toolbox'],
        aliases: ['hide', 'wh'],
        category: 'Window',
        isAvailable: true,
        requiresProject: false,
        requiresDebugMode: false
      },
      // Tool commands
      {
        name: 'Tools.Options',
        type: CommandType.Tool,
        description: 'Open the Options dialog',
        syntax: 'Tools.Options [category]',
        parameters: [
          { name: 'category', type: 'string', required: false, description: 'Options category to open' }
        ],
        examples: ['Tools.Options', 'Tools.Options Editor'],
        aliases: ['options', 'to'],
        category: 'Tools',
        isAvailable: true,
        requiresProject: false,
        requiresDebugMode: false
      },
      {
        name: 'Edit.GoToLine',
        type: CommandType.IDE,
        description: 'Go to a specific line number',
        syntax: 'Edit.GoToLine <linenumber>',
        parameters: [
          { name: 'linenumber', type: 'number', required: true, description: 'Line number to navigate to' }
        ],
        examples: ['Edit.GoToLine 42'],
        aliases: ['goto', 'gl'],
        category: 'Edit',
        isAvailable: true,
        requiresProject: false,
        requiresDebugMode: false
      },
      // Custom commands
      {
        name: 'Clear',
        type: CommandType.Custom,
        description: 'Clear the command window',
        syntax: 'Clear',
        parameters: [],
        examples: ['Clear'],
        aliases: ['cls', 'clear'],
        category: 'Utility',
        isAvailable: true,
        requiresProject: false,
        requiresDebugMode: false
      },
      {
        name: 'Help',
        type: CommandType.Custom,
        description: 'Show help for commands',
        syntax: 'Help [command]',
        parameters: [
          { name: 'command', type: 'string', required: false, description: 'Specific command to get help for' }
        ],
        examples: ['Help', 'Help File.Open'],
        aliases: ['?', 'help'],
        category: 'Utility',
        isAvailable: true,
        requiresProject: false,
        requiresDebugMode: false
      }
    ];

    const defaultAliases: CommandAlias[] = [
      { alias: 'o', command: 'File.Open', description: 'Quick open file' },
      { alias: 's', command: 'File.Save', description: 'Quick save' },
      { alias: 'b', command: 'Project.Build', description: 'Quick build' },
      { alias: 'r', command: 'Project.Run', description: 'Quick run' },
      { alias: 'f5', command: 'Debug.Start', description: 'Start debugging (F5)' },
      { alias: 'f10', command: 'Debug.StepOver', description: 'Step over (F10)' },
      { alias: 'f11', command: 'Debug.StepInto', description: 'Step into (F11)' },
      { alias: 'props', command: 'Window.Show Properties', description: 'Show Properties window' },
      { alias: 'imm', command: 'Window.Show Immediate', description: 'Show Immediate window' }
    ];

    setAvailableCommands(commands);
    setAliases(defaultAliases);
  }, [projectOpen, debugMode]);

  // Add welcome message
  useEffect(() => {
    addToHistory('Visual Basic 6.0 Command Window', CommandStatus.Info);
    addToHistory('Type "Help" for available commands or "?" for quick help', CommandStatus.Info);
    addToHistory('', CommandStatus.Info);
  }, []);

  // Add command execution to history
  const addToHistory = useCallback((command: string, status: CommandStatus, result?: string, error?: string) => {
    const execution: CommandExecution = {
      id: `exec_${Date.now()}_${Math.random()}`,
      command,
      timestamp: new Date(),
      status,
      result,
      error,
      executionTime: 0,
      parameters: {}
    };

    setExecutionHistory(prev => [...prev, execution]);

    // Auto-scroll to bottom
    setTimeout(() => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }, 10);
  }, []);

  // Get autocomplete suggestions
  const getAutoCompleteSuggestions = useCallback((text: string): string[] => {
    if (!text) return [];

    const suggestions = [];
    
    // Add command names
    suggestions.push(...availableCommands
      .filter(cmd => cmd.isAvailable && cmd.name.toLowerCase().startsWith(text.toLowerCase()))
      .map(cmd => cmd.name)
    );

    // Add aliases
    suggestions.push(...aliases
      .filter(alias => alias.alias.toLowerCase().startsWith(text.toLowerCase()))
      .map(alias => alias.alias)
    );

    // Add from command history
    suggestions.push(...commandHistory.commands
      .filter(cmd => cmd.toLowerCase().startsWith(text.toLowerCase()))
      .slice(0, 5)
    );

    return [...new Set(suggestions)].slice(0, 10);
  }, [availableCommands, aliases, commandHistory.commands]);

  // Execute command
  const executeCommand = useCallback(async (commandText: string) => {
    if (!commandText.trim()) return;

    setIsExecuting(true);
    const startTime = performance.now();

    try {
      // Add to command history
      setCommandHistory(prev => ({
        ...prev,
        commands: [commandText, ...prev.commands.filter(cmd => cmd !== commandText)].slice(0, prev.maxItems),
        currentIndex: -1
      }));

      // Parse command
      const parts = commandText.split(' ');
      const commandName = parts[0];
      const args = parts.slice(1);

      // Check for alias
      const alias = aliases.find(a => a.alias.toLowerCase() === commandName.toLowerCase());
      const actualCommand = alias?.command || commandName;

      // Find command definition
      const command = availableCommands.find(cmd => 
        cmd.name.toLowerCase() === actualCommand.toLowerCase() ||
        cmd.aliases.some(a => a.toLowerCase() === actualCommand.toLowerCase())
      );

      if (!command) {
        throw new Error(`Unknown command: ${commandName}`);
      }

      if (!command.isAvailable) {
        throw new Error(`Command not available: ${command.name}`);
      }

      if (command.requiresProject && !projectOpen) {
        throw new Error(`Command requires an open project: ${command.name}`);
      }

      if (command.requiresDebugMode && !debugMode) {
        throw new Error(`Command requires debug mode: ${command.name}`);
      }

      // Execute built-in commands
      let result = await executeBuiltInCommand(command, args);

      // Try external handler if no built-in result
      if (result === undefined && onExecuteCommand) {
        const parameters = parseParameters(command, args);
        result = await onExecuteCommand(command.name, parameters);
      }

      const executionTime = performance.now() - startTime;
      
      if (result !== undefined) {
        addToHistory(commandText, CommandStatus.Success, String(result));
      } else {
        addToHistory(commandText, CommandStatus.Success, 'Command executed successfully');
      }

    } catch (error) {
      const executionTime = performance.now() - startTime;
      addToHistory(commandText, CommandStatus.Error, undefined, String(error));
    } finally {
      setIsExecuting(false);
    }
  }, [availableCommands, aliases, projectOpen, debugMode, onExecuteCommand, addToHistory]);

  // Execute built-in commands
  const executeBuiltInCommand = async (command: Command, args: string[]): Promise<any> => {
    switch (command.name) {
      case 'Clear':
        setExecutionHistory([]);
        return 'Command window cleared';

      case 'Help':
        if (args.length === 0) {
          setShowHelp(true);
          return 'Available commands: ' + availableCommands.filter(c => c.isAvailable).map(c => c.name).join(', ');
        } else {
          const helpCommand = availableCommands.find(c => 
            c.name.toLowerCase() === args[0].toLowerCase()
          );
          if (helpCommand) {
            setSelectedCommand(helpCommand);
            setShowHelp(true);
            return `Help for ${helpCommand.name}: ${helpCommand.description}`;
          } else {
            throw new Error(`No help available for: ${args[0]}`);
          }
        }

      case 'File.Open':
        {
          if (args.length === 0) throw new Error('File path required');
          const fileName = args.join(' ').replace(/"/g, '');
          onOpenFile?.(fileName);
          return `Opening file: ${fileName}`;
        }

      case 'File.Save':
        return 'File saved successfully';

      case 'File.SaveAll':
        return 'All files saved successfully';

      case 'Project.Build': {
        const config = args[0] || 'Debug';
        return `Building project in ${config} configuration...`;
      }

      case 'Project.Run': {
        const arguments_ = args.join(' ');
        return `Running project${arguments_ ? ' with arguments: ' + arguments_ : ''}...`;
      }

      case 'Debug.Start':
        return 'Starting debug session...';

      case 'Debug.Stop':
        return 'Debug session stopped';

      case 'Debug.StepInto':
        return 'Stepping into...';

      case 'Debug.StepOver':
        return 'Stepping over...';

      case 'Window.Show':
        {
          if (args.length === 0) throw new Error('Window name required');
          const windowName = args[0];
          onShowWindow?.(windowName);
          return `Showing ${windowName} window`;
        }

      case 'Window.Hide':
        if (args.length === 0) throw new Error('Window name required');
        return `Hiding ${args[0]} window`;

      case 'Edit.GoToLine':
        {
          if (args.length === 0) throw new Error('Line number required');
          const lineNumber = parseInt(args[0]);
          if (isNaN(lineNumber)) throw new Error('Invalid line number');
          onNavigateToLine?.('', lineNumber);
          return `Navigating to line ${lineNumber}`;
        }

      case 'Tools.Options':
        return 'Opening Options dialog...';

      default:
        return undefined;
    }
  };

  // Parse command parameters
  const parseParameters = (command: Command, args: string[]): Record<string, any> => {
    const parameters: Record<string, any> = {};
    
    command.parameters.forEach((param, index) => {
      if (index < args.length) {
        let value = args[index];
        
        // Parse based on type
        switch (param.type) {
          case 'number':
            value = parseFloat(value);
            if (isNaN(value)) throw new Error(`Invalid number for parameter ${param.name}`);
            break;
          case 'boolean':
            value = value.toLowerCase() === 'true' || value === '1';
            break;
          case 'file':
          case 'path':
            value = value.replace(/"/g, '');
            break;
        }
        
        parameters[param.name] = value;
      } else if (param.required) {
        throw new Error(`Required parameter missing: ${param.name}`);
      } else if (param.defaultValue !== undefined) {
        parameters[param.name] = param.defaultValue;
      }
    });

    return parameters;
  };

  // Handle key press
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentCommand.trim()) {
        executeCommand(currentCommand);
        setCurrentCommand('');
      }
      setShowAutoComplete(false);
    } else if (e.key === 'ArrowUp' && !showAutoComplete) {
      e.preventDefault();
      if (commandHistory.currentIndex < commandHistory.commands.length - 1) {
        const newIndex = commandHistory.currentIndex + 1;
        setCommandHistory(prev => ({ ...prev, currentIndex: newIndex }));
        setCurrentCommand(commandHistory.commands[newIndex]);
      }
    } else if (e.key === 'ArrowDown' && !showAutoComplete) {
      e.preventDefault();
      if (commandHistory.currentIndex > 0) {
        const newIndex = commandHistory.currentIndex - 1;
        setCommandHistory(prev => ({ ...prev, currentIndex: newIndex }));
        setCurrentCommand(commandHistory.commands[newIndex]);
      } else if (commandHistory.currentIndex === 0) {
        setCommandHistory(prev => ({ ...prev, currentIndex: -1 }));
        setCurrentCommand('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (showAutoComplete && autoComplete.length > 0) {
        setCurrentCommand(autoComplete[autoCompleteIndex]);
        setShowAutoComplete(false);
      }
    } else if (e.key === 'Escape') {
      setShowAutoComplete(false);
    } else if (showAutoComplete) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutoCompleteIndex(prev => prev > 0 ? prev - 1 : autoComplete.length - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutoCompleteIndex(prev => prev < autoComplete.length - 1 ? prev + 1 : 0);
      }
    }
  }, [currentCommand, commandHistory, showAutoComplete, autoComplete, autoCompleteIndex, executeCommand]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentCommand(value);

    // Update autocomplete
    const suggestions = getAutoCompleteSuggestions(value);
    setAutoComplete(suggestions);
    setShowAutoComplete(suggestions.length > 0);
    setAutoCompleteIndex(0);
  }, [getAutoCompleteSuggestions]);

  // Get status color
  const getStatusColor = (status: CommandStatus): string => {
    switch (status) {
      case CommandStatus.Success:
        return 'text-green-600';
      case CommandStatus.Error:
        return 'text-red-600';
      case CommandStatus.Warning:
        return 'text-yellow-600';
      case CommandStatus.Executing:
        return 'text-blue-600';
      case CommandStatus.Info:
      default:
        return 'text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: CommandStatus): string => {
    switch (status) {
      case CommandStatus.Success:
        return '✅';
      case CommandStatus.Error:
        return '❌';
      case CommandStatus.Warning:
        return '⚠️';
      case CommandStatus.Executing:
        return '⏳';
      case CommandStatus.Info:
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Command</h3>
          {isExecuting && (
            <div className="text-xs text-blue-600 animate-pulse">Executing...</div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value="All">All Commands</option>
            {[...new Set(availableCommands.map(c => c.category))].map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Help"
          >
            ❓
          </button>
          
          <button
            onClick={() => setExecutionHistory([])}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            title="Clear"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-sm bg-white"
      >
        {executionHistory.map(execution => (
          <div key={execution.id} className="mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {execution.timestamp.toLocaleTimeString()}
              </span>
              <span>{getStatusIcon(execution.status)}</span>
              <span className="font-medium">{execution.command}</span>
            </div>
            {execution.result && (
              <div className={`ml-6 ${getStatusColor(execution.status)}`}>
                {execution.result}
              </div>
            )}
            {execution.error && (
              <div className="ml-6 text-red-600">
                Error: {execution.error}
              </div>
            )}
          </div>
        ))}
        
        {isExecuting && (
          <div className="text-blue-600 animate-pulse">
            Executing command...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative border-t border-gray-300">
        <div className="flex items-center p-2">
          <span className="text-sm text-gray-600 mr-2">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Enter command..."
            className="flex-1 font-mono text-sm border-none outline-none"
            disabled={isExecuting}
          />
        </div>

        {/* Autocomplete Dropdown */}
        {showAutoComplete && autoComplete.length > 0 && (
          <div className="absolute bottom-full left-2 right-2 bg-white border border-gray-300 shadow-lg max-h-32 overflow-y-auto z-10">
            {autoComplete.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`px-2 py-1 text-sm cursor-pointer ${
                  index === autoCompleteIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => {
                  setCurrentCommand(suggestion);
                  setShowAutoComplete(false);
                  inputRef.current?.focus();
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="absolute inset-0 bg-white border border-gray-300 z-20">
          <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
            <h3 className="text-sm font-medium text-gray-800">Command Help</h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto h-full">
            {selectedCommand ? (
              <div>
                <h4 className="text-lg font-medium mb-2">{selectedCommand.name}</h4>
                <p className="text-gray-600 mb-4">{selectedCommand.description}</p>
                
                <div className="mb-4">
                  <h5 className="font-medium mb-2">Syntax:</h5>
                  <code className="bg-gray-100 p-2 rounded block">{selectedCommand.syntax}</code>
                </div>
                
                {selectedCommand.parameters.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Parameters:</h5>
                    {selectedCommand.parameters.map(param => (
                      <div key={param.name} className="ml-4 mb-2">
                        <strong>{param.name}</strong> ({param.type}){param.required ? ' - Required' : ' - Optional'}
                        <div className="text-sm text-gray-600">{param.description}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedCommand.examples.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Examples:</h5>
                    {selectedCommand.examples.map((example, index) => (
                      <code key={index} className="bg-gray-100 p-2 rounded block mb-1 text-sm">{example}</code>
                    ))}
                  </div>
                )}
                
                {selectedCommand.aliases.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Aliases:</h5>
                    <div className="text-sm text-gray-600">{selectedCommand.aliases.join(', ')}</div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h4 className="text-lg font-medium mb-4">Available Commands</h4>
                {availableCommands
                  .filter(cmd => cmd.isAvailable && (filterCategory === 'All' || cmd.category === filterCategory))
                  .map(command => (
                    <div 
                      key={command.name} 
                      className="mb-3 p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedCommand(command)}
                    >
                      <div className="font-medium">{command.name}</div>
                      <div className="text-sm text-gray-600">{command.description}</div>
                      <div className="text-xs text-gray-500">
                        Aliases: {command.aliases.join(', ')}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between p-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Commands: {executionHistory.length}</span>
          <span>Available: {availableCommands.filter(c => c.isAvailable).length}</span>
          <span>Aliases: {aliases.length}</span>
        </div>

        <div className="flex items-center gap-2">
          {projectOpen && <span className="text-green-600">Project Open</span>}
          {debugMode && <span className="text-blue-600">Debug Mode</span>}
          <span>Press F1 for help</span>
        </div>
      </div>
    </div>
  );
};

export default CommandWindow;