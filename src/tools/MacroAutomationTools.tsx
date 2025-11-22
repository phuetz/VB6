import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Macro Action Types
export enum MacroActionType {
  // File Operations
  FileNew = 'File.New',
  FileOpen = 'File.Open',
  FileSave = 'File.Save',
  FileSaveAs = 'File.SaveAs',
  FileClose = 'File.Close',
  
  // Edit Operations
  EditCut = 'Edit.Cut',
  EditCopy = 'Edit.Copy',
  EditPaste = 'Edit.Paste',
  EditUndo = 'Edit.Undo',
  EditRedo = 'Edit.Redo',
  EditFind = 'Edit.Find',
  EditReplace = 'Edit.Replace',
  EditSelectAll = 'Edit.SelectAll',
  
  // Code Operations
  CodeComment = 'Code.Comment',
  CodeUncomment = 'Code.Uncomment',
  CodeIndent = 'Code.Indent',
  CodeOutdent = 'Code.Outdent',
  CodeFormat = 'Code.Format',
  CodeComplete = 'Code.Complete',
  
  // Debug Operations
  DebugStart = 'Debug.Start',
  DebugStop = 'Debug.Stop',
  DebugStepInto = 'Debug.StepInto',
  DebugStepOver = 'Debug.StepOver',
  DebugToggleBreakpoint = 'Debug.ToggleBreakpoint',
  
  // Build Operations
  BuildCompile = 'Build.Compile',
  BuildMakeExe = 'Build.MakeExe',
  BuildRun = 'Build.Run',
  
  // UI Operations
  UINavigate = 'UI.Navigate',
  UIClick = 'UI.Click',
  UIType = 'UI.Type',
  UISelect = 'UI.Select',
  UIWait = 'UI.Wait',
  
  // Custom Operations
  CustomScript = 'Custom.Script',
  CustomCommand = 'Custom.Command',
  CustomFunction = 'Custom.Function'
}

// Macro Action
export interface MacroAction {
  id: string;
  type: MacroActionType;
  description: string;
  parameters: Record<string, any>;
  delay?: number;
  condition?: string;
  errorHandling?: 'stop' | 'continue' | 'retry';
}

// Macro
export interface Macro {
  id: string;
  name: string;
  description: string;
  category: string;
  actions: MacroAction[];
  variables: Record<string, any>;
  hotkey?: string;
  icon?: string;
  isRecording?: boolean;
  lastRun?: Date;
  runCount: number;
  createdDate: Date;
  modifiedDate: Date;
  author: string;
  tags: string[];
}

// Macro Recording State
export interface RecordingState {
  isRecording: boolean;
  startTime: Date;
  actions: MacroAction[];
  pausedTime?: number;
}

// Macro Execution State
export interface ExecutionState {
  isRunning: boolean;
  currentAction: number;
  startTime: Date;
  variables: Record<string, any>;
  output: string[];
  errors: string[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
}

// Automation Template
export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  macro: Partial<Macro>;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'file' | 'folder';
    description: string;
    defaultValue?: any;
    required: boolean;
  }>;
}

interface MacroAutomationToolsProps {
  onMacroRun?: (macro: Macro) => void;
  onMacroRecord?: (actions: MacroAction[]) => void;
  onAutomationComplete?: (result: any) => void;
}

export const MacroAutomationTools: React.FC<MacroAutomationToolsProps> = ({
  onMacroRun,
  onMacroRecord,
  onAutomationComplete
}) => {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [selectedMacro, setSelectedMacro] = useState<Macro | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    startTime: new Date(),
    actions: []
  });
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isRunning: false,
    currentAction: 0,
    startTime: new Date(),
    variables: {},
    output: [],
    errors: [],
    status: 'idle'
  });
  const [selectedTab, setSelectedTab] = useState<'macros' | 'recorder' | 'editor' | 'templates'>('macros');
  const [showMacroDialog, setShowMacroDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [editingMacro, setEditingMacro] = useState<Partial<Macro>>({
    name: '',
    description: '',
    category: 'General',
    actions: [],
    variables: {},
    tags: []
  });
  const [editingAction, setEditingAction] = useState<Partial<MacroAction>>({
    type: MacroActionType.FileOpen,
    description: '',
    parameters: {},
    delay: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showVariableDialog, setShowVariableDialog] = useState(false);
  const [variableForm, setVariableForm] = useState({ name: '', value: '', type: 'string' });

  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Generate unique ID
  const generateId = useCallback(() => `macro_${nextId.current++}`, []);

  // Sample macros
  const sampleMacros: Macro[] = [
    {
      id: generateId(),
      name: 'New Project Setup',
      description: 'Creates a new VB6 project with standard modules and forms',
      category: 'Project',
      actions: [
        {
          id: generateId(),
          type: MacroActionType.FileNew,
          description: 'Create new project',
          parameters: { projectType: 'Standard EXE' }
        },
        {
          id: generateId(),
          type: MacroActionType.FileNew,
          description: 'Add new module',
          parameters: { itemType: 'Module', name: 'modMain' }
        },
        {
          id: generateId(),
          type: MacroActionType.CodeComment,
          description: 'Add header comment',
          parameters: { 
            text: '\'=================================\n\' Project: ${ProjectName}\n\' Created: ${Date}\n\'================================='
          }
        }
      ],
      variables: {
        ProjectName: 'MyProject',
        Date: new Date().toLocaleDateString()
      },
      hotkey: 'Ctrl+Shift+N',
      icon: '📁',
      runCount: 15,
      createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      modifiedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      author: 'Developer',
      tags: ['project', 'setup', 'template']
    },
    {
      id: generateId(),
      name: 'Code Cleanup',
      description: 'Formats and cleans up the current code file',
      category: 'Code',
      actions: [
        {
          id: generateId(),
          type: MacroActionType.EditSelectAll,
          description: 'Select all code',
          parameters: {}
        },
        {
          id: generateId(),
          type: MacroActionType.CodeFormat,
          description: 'Format code',
          parameters: { style: 'default' }
        },
        {
          id: generateId(),
          type: MacroActionType.EditFind,
          description: 'Remove trailing spaces',
          parameters: { 
            find: ' +$', 
            replace: '', 
            useRegex: true,
            replaceAll: true
          }
        }
      ],
      variables: {},
      hotkey: 'Ctrl+Shift+F',
      icon: '🧹',
      runCount: 42,
      createdDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      modifiedDate: new Date(),
      author: 'Developer',
      tags: ['code', 'format', 'cleanup']
    },
    {
      id: generateId(),
      name: 'Build and Deploy',
      description: 'Compiles project and copies to deployment folder',
      category: 'Build',
      actions: [
        {
          id: generateId(),
          type: MacroActionType.FileSave,
          description: 'Save all files',
          parameters: { saveAll: true }
        },
        {
          id: generateId(),
          type: MacroActionType.BuildCompile,
          description: 'Compile project',
          parameters: { configuration: 'Release' }
        },
        {
          id: generateId(),
          type: MacroActionType.CustomCommand,
          description: 'Copy to deployment',
          parameters: { 
            command: 'xcopy /Y "${OutputFile}" "${DeployPath}"'
          }
        }
      ],
      variables: {
        OutputFile: 'bin\\Release\\MyApp.exe',
        DeployPath: 'C:\\Deploy\\'
      },
      hotkey: 'F6',
      icon: '🚀',
      runCount: 8,
      createdDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      modifiedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      author: 'Developer',
      tags: ['build', 'deploy', 'release']
    }
  ];

  // Automation templates
  const automationTemplates: AutomationTemplate[] = [
    {
      id: 'template_1',
      name: 'Add Error Handling',
      description: 'Adds standard error handling to selected procedure',
      category: 'Code',
      macro: {
        actions: [
          {
            id: generateId(),
            type: MacroActionType.CustomScript,
            description: 'Add error handling code',
            parameters: {
              script: `
On Error GoTo ErrorHandler

' [Existing code here]

Exit Sub
ErrorHandler:
    MsgBox "Error " & Err.Number & ": " & Err.Description, vbCritical, "${ProcedureName}"
    Resume Next`
            }
          }
        ]
      },
      parameters: [
        {
          name: 'ProcedureName',
          type: 'string',
          description: 'Name of the procedure',
          required: true
        }
      ]
    },
    {
      id: 'template_2',
      name: 'Create Property',
      description: 'Creates a property with getter and setter',
      category: 'Code',
      macro: {
        actions: [
          {
            id: generateId(),
            type: MacroActionType.CustomScript,
            description: 'Create property code',
            parameters: {
              script: `
Private m_${PropertyName} As ${PropertyType}

Public Property Get ${PropertyName}() As ${PropertyType}
    ${PropertyName} = m_${PropertyName}
End Property

Public Property Let ${PropertyName}(ByVal value As ${PropertyType})
    m_${PropertyName} = value
End Property`
            }
          }
        ]
      },
      parameters: [
        {
          name: 'PropertyName',
          type: 'string',
          description: 'Property name',
          required: true
        },
        {
          name: 'PropertyType',
          type: 'string',
          description: 'Property data type',
          defaultValue: 'String',
          required: true
        }
      ]
    }
  ];

  // Initialize with sample macros
  useEffect(() => {
    setMacros(sampleMacros);
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    setRecordingState({
      isRecording: true,
      startTime: new Date(),
      actions: []
    });

    // Simulate recording timer
    recordingInterval.current = setInterval(() => {
      setRecordingState(prev => ({
        ...prev,
        actions: [...prev.actions]
      }));
    }, 1000);

    eventEmitter.current.emit('recordingStarted');
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }

    const actions = recordingState.actions;
    setRecordingState({
      isRecording: false,
      startTime: new Date(),
      actions: []
    });

    if (actions.length > 0) {
      // Create new macro from recording
      const newMacro: Partial<Macro> = {
        name: `Recorded Macro ${new Date().toLocaleTimeString()}`,
        description: 'Macro recorded from user actions',
        category: 'Recorded',
        actions: actions,
        variables: {},
        tags: ['recorded']
      };
      setEditingMacro(newMacro);
      setShowMacroDialog(true);
    }

    onMacroRecord?.(actions);
    eventEmitter.current.emit('recordingStopped', actions);
  }, [recordingState.actions, onMacroRecord]);

  // Add recorded action
  const addRecordedAction = useCallback((action: Partial<MacroAction>) => {
    if (!recordingState.isRecording) return;

    const newAction: MacroAction = {
      id: generateId(),
      type: action.type || MacroActionType.CustomCommand,
      description: action.description || '',
      parameters: action.parameters || {},
      delay: action.delay
    };

    setRecordingState(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  }, [recordingState.isRecording, generateId]);

  // Run macro
  const runMacro = useCallback(async (macro: Macro) => {
    setExecutionState({
      isRunning: true,
      currentAction: 0,
      startTime: new Date(),
      variables: { ...macro.variables },
      output: [`Starting macro: ${macro.name}`],
      errors: [],
      status: 'running'
    });

    // Simulate macro execution
    for (let i = 0; i < macro.actions.length; i++) {
      const action = macro.actions[i];
      
      setExecutionState(prev => ({
        ...prev,
        currentAction: i,
        output: [...prev.output, `Executing: ${action.description}`]
      }));

      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, action.delay || 500));

      // Simulate random errors for demo
      if (Math.random() < 0.1) {
        setExecutionState(prev => ({
          ...prev,
          errors: [...prev.errors, `Error in action ${i + 1}: Simulated error`],
          status: action.errorHandling === 'stop' ? 'failed' : 'running'
        }));
        
        if (action.errorHandling === 'stop') break;
      }
    }

    // Update macro run count
    const updatedMacro = { ...macro, runCount: macro.runCount + 1, lastRun: new Date() };
    setMacros(prev => prev.map(m => m.id === macro.id ? updatedMacro : m));

    setExecutionState(prev => ({
      ...prev,
      isRunning: false,
      status: prev.errors.length > 0 ? 'failed' : 'completed',
      output: [...prev.output, `Macro completed: ${macro.name}`]
    }));

    onMacroRun?.(macro);
    onAutomationComplete?.({ macro, status: 'completed' });
    eventEmitter.current.emit('macroCompleted', macro);
  }, [onMacroRun, onAutomationComplete]);

  // Save macro
  const saveMacro = useCallback(() => {
    if (!editingMacro.name) return;

    const newMacro: Macro = {
      id: selectedMacro?.id || generateId(),
      name: editingMacro.name,
      description: editingMacro.description || '',
      category: editingMacro.category || 'General',
      actions: editingMacro.actions || [],
      variables: editingMacro.variables || {},
      hotkey: editingMacro.hotkey,
      icon: editingMacro.icon || '📌',
      runCount: selectedMacro?.runCount || 0,
      createdDate: selectedMacro?.createdDate || new Date(),
      modifiedDate: new Date(),
      author: 'Developer',
      tags: editingMacro.tags || []
    };

    if (selectedMacro) {
      setMacros(prev => prev.map(m => m.id === selectedMacro.id ? newMacro : m));
    } else {
      setMacros(prev => [...prev, newMacro]);
    }

    setShowMacroDialog(false);
    setEditingMacro({
      name: '',
      description: '',
      category: 'General',
      actions: [],
      variables: {},
      tags: []
    });
    setSelectedMacro(null);

    eventEmitter.current.emit('macroSaved', newMacro);
  }, [editingMacro, selectedMacro, generateId]);

  // Delete macro
  const deleteMacro = useCallback((macro: Macro) => {
    if (!window.confirm(`Delete macro "${macro.name}"?`)) return;

    setMacros(prev => prev.filter(m => m.id !== macro.id));
    if (selectedMacro?.id === macro.id) {
      setSelectedMacro(null);
    }

    eventEmitter.current.emit('macroDeleted', macro);
  }, [selectedMacro]);

  // Add action to macro
  const addAction = useCallback(() => {
    if (!editingAction.type) return;

    const newAction: MacroAction = {
      id: generateId(),
      type: editingAction.type,
      description: editingAction.description || '',
      parameters: editingAction.parameters || {},
      delay: editingAction.delay,
      condition: editingAction.condition,
      errorHandling: editingAction.errorHandling
    };

    setEditingMacro(prev => ({
      ...prev,
      actions: [...(prev.actions || []), newAction]
    }));

    setShowActionDialog(false);
    setEditingAction({
      type: MacroActionType.FileOpen,
      description: '',
      parameters: {},
      delay: 0
    });
  }, [editingAction, generateId]);

  // Filter macros
  const filteredMacros = macros.filter(macro => {
    const matchesSearch = !searchTerm || 
      macro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      macro.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      macro.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || macro.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get categories
  const categories = ['All', ...new Set(macros.map(m => m.category))];

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Get action icon
  const getActionIcon = (type: MacroActionType): string => {
    const iconMap: Record<string, string> = {
      [MacroActionType.FileNew]: '📄',
      [MacroActionType.FileOpen]: '📂',
      [MacroActionType.FileSave]: '💾',
      [MacroActionType.EditCut]: '✂️',
      [MacroActionType.EditCopy]: '📋',
      [MacroActionType.EditPaste]: '📌',
      [MacroActionType.CodeComment]: '💬',
      [MacroActionType.CodeFormat]: '🎨',
      [MacroActionType.DebugStart]: '▶️',
      [MacroActionType.BuildCompile]: '🔨',
      [MacroActionType.UIClick]: '👆',
      [MacroActionType.UIType]: '⌨️',
      [MacroActionType.CustomScript]: '📜'
    };
    return iconMap[type] || '⚡';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Macro & Automation Tools</h1>
          <div className="flex items-center gap-2">
            {recordingState.isRecording ? (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
              >
                <span className="animate-pulse">●</span> Stop Recording
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Record Macro
              </button>
            )}
            <button
              onClick={() => {
                setEditingMacro({
                  name: '',
                  description: '',
                  category: 'General',
                  actions: [],
                  variables: {},
                  tags: []
                });
                setSelectedMacro(null);
                setShowMacroDialog(true);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              New Macro
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setSelectedTab('macros')}
            className={`px-4 py-2 border-b-2 ${
              selectedTab === 'macros'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Macros ({macros.length})
          </button>
          <button
            onClick={() => setSelectedTab('recorder')}
            className={`px-4 py-2 border-b-2 ${
              selectedTab === 'recorder'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Recorder
          </button>
          <button
            onClick={() => setSelectedTab('editor')}
            className={`px-4 py-2 border-b-2 ${
              selectedTab === 'editor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setSelectedTab('templates')}
            className={`px-4 py-2 border-b-2 ${
              selectedTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedTab === 'macros' && (
          <div className="flex h-full">
            {/* Macro List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Search and Filter */}
              <div className="p-4 border-b border-gray-200">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search macros..."
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Macro Items */}
              <div className="flex-1 overflow-y-auto p-2">
                {filteredMacros.map(macro => (
                  <div
                    key={macro.id}
                    className={`p-3 mb-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 ${
                      selectedMacro?.id === macro.id ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => setSelectedMacro(macro)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{macro.icon}</span>
                        <div>
                          <h3 className="font-medium">{macro.name}</h3>
                          <p className="text-sm text-gray-600">{macro.description}</p>
                        </div>
                      </div>
                      {macro.hotkey && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {macro.hotkey}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{macro.actions.length} actions</span>
                      <span>Run {macro.runCount} times</span>
                      {macro.lastRun && (
                        <span>Last: {macro.lastRun.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Macro Details */}
            <div className="flex-1 flex flex-col">
              {selectedMacro ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-medium flex items-center gap-2">
                          <span className="text-2xl">{selectedMacro.icon}</span>
                          {selectedMacro.name}
                        </h2>
                        <p className="text-sm text-gray-600">{selectedMacro.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => runMacro(selectedMacro)}
                          disabled={executionState.isRunning}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                        >
                          Run
                        </button>
                        <button
                          onClick={() => {
                            setEditingMacro(selectedMacro);
                            setShowMacroDialog(true);
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMacro(selectedMacro)}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {/* Actions */}
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">Actions</h3>
                      <div className="space-y-2">
                        {selectedMacro.actions.map((action, index) => (
                          <div
                            key={action.id}
                            className={`flex items-center gap-3 p-3 border border-gray-200 rounded ${
                              executionState.isRunning && executionState.currentAction === index
                                ? 'bg-blue-50 border-blue-300'
                                : ''
                            }`}
                          >
                            <span className="text-xl">{getActionIcon(action.type)}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{action.description}</div>
                              <div className="text-xs text-gray-500">{action.type}</div>
                            </div>
                            {action.delay && (
                              <span className="text-xs text-gray-500">
                                Delay: {action.delay}ms
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Variables */}
                    {Object.keys(selectedMacro.variables).length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-medium mb-3">Variables</h3>
                        <div className="space-y-1">
                          {Object.entries(selectedMacro.variables).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                ${key}
                              </span>
                              <span className="text-gray-600">=</span>
                              <span className="text-gray-700">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Category: {selectedMacro.category}</div>
                      <div>Author: {selectedMacro.author}</div>
                      <div>Created: {selectedMacro.createdDate.toLocaleDateString()}</div>
                      <div>Modified: {selectedMacro.modifiedDate.toLocaleDateString()}</div>
                      {selectedMacro.tags.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <span>Tags:</span>
                          {selectedMacro.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Execution Output */}
                  {executionState.output.length > 0 && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <h3 className="font-medium mb-2">Execution Output</h3>
                      <div className="text-sm font-mono space-y-1 max-h-32 overflow-y-auto">
                        {executionState.output.map((line, index) => (
                          <div key={index} className="text-gray-700">{line}</div>
                        ))}
                        {executionState.errors.map((error, index) => (
                          <div key={index} className="text-red-600">{error}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <p className="text-lg">Select a macro to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'recorder' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              {recordingState.isRecording ? (
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-pulse">⏺️</div>
                  <h2 className="text-2xl font-medium mb-2">Recording...</h2>
                  <p className="text-gray-600 mb-6">
                    Perform actions in the IDE to record them
                  </p>
                  
                  <div className="mb-6">
                    <div className="text-4xl font-mono">
                      {formatDuration(Date.now() - recordingState.startTime.getTime())}
                    </div>
                    <div className="text-sm text-gray-500">
                      {recordingState.actions.length} actions recorded
                    </div>
                  </div>

                  {/* Recorded Actions */}
                  {recordingState.actions.length > 0 && (
                    <div className="mt-6 text-left">
                      <h3 className="font-medium mb-3">Recorded Actions</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {recordingState.actions.map((action, index) => (
                          <div key={action.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <span className="text-sm font-mono">#{index + 1}</span>
                            <span>{getActionIcon(action.type)}</span>
                            <span className="text-sm">{action.description || action.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={stopRecording}
                    className="mt-6 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Stop Recording
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎙️</div>
                  <h2 className="text-2xl font-medium mb-2">Macro Recorder</h2>
                  <p className="text-gray-600 mb-6">
                    Record your actions to create reusable macros
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="font-medium mb-3">How it works:</h3>
                    <ol className="text-left space-y-2 text-sm">
                      <li>1. Click "Start Recording" to begin</li>
                      <li>2. Perform actions in the IDE (open files, edit code, etc.)</li>
                      <li>3. Click "Stop Recording" when finished</li>
                      <li>4. Name and save your macro for future use</li>
                    </ol>
                  </div>

                  <button
                    onClick={startRecording}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Start Recording
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'editor' && (
          <div className="p-6">
            {editingMacro && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xl font-medium mb-4">Macro Editor</h2>
                
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editingMacro.name || ''}
                        onChange={(e) => setEditingMacro(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={editingMacro.category || ''}
                        onChange={(e) => setEditingMacro(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingMacro.description || ''}
                      onChange={(e) => setEditingMacro(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hotkey
                      </label>
                      <input
                        type="text"
                        value={editingMacro.hotkey || ''}
                        onChange={(e) => setEditingMacro(prev => ({ ...prev, hotkey: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="e.g., Ctrl+Shift+M"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon
                      </label>
                      <input
                        type="text"
                        value={editingMacro.icon || ''}
                        onChange={(e) => setEditingMacro(prev => ({ ...prev, icon: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="e.g., 📁"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Actions</h3>
                      <button
                        onClick={() => setShowActionDialog(true)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Add Action
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editingMacro.actions?.map((action, index) => (
                        <div key={action.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded">
                          <span className="text-xl">{getActionIcon(action.type)}</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{action.description}</div>
                            <div className="text-xs text-gray-500">{action.type}</div>
                          </div>
                          <button
                            onClick={() => {
                              setEditingMacro(prev => ({
                                ...prev,
                                actions: prev.actions?.filter(a => a.id !== action.id)
                              }));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Variables */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Variables</h3>
                      <button
                        onClick={() => setShowVariableDialog(true)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Add Variable
                      </button>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(editingMacro.variables || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            ${key}
                          </span>
                          <span className="text-gray-600">=</span>
                          <span className="text-gray-700">{String(value)}</span>
                          <button
                            onClick={() => {
                              const vars = { ...editingMacro.variables };
                              delete vars[key];
                              setEditingMacro(prev => ({ ...prev, variables: vars }));
                            }}
                            className="ml-auto text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      onClick={() => {
                        setEditingMacro({
                          name: '',
                          description: '',
                          category: 'General',
                          actions: [],
                          variables: {},
                          tags: []
                        });
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Clear
                    </button>
                    <button
                      onClick={saveMacro}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save Macro
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'templates' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {automationTemplates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <h3 className="font-medium mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Category: {template.category}
                  </div>

                  {template.parameters.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Parameters:</h4>
                      <div className="space-y-1">
                        {template.parameters.map(param => (
                          <div key={param.name} className="text-xs text-gray-600">
                            • {param.name} ({param.type})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setEditingMacro({
                        ...template.macro,
                        name: template.name,
                        description: template.description,
                        category: template.category
                      });
                      setSelectedTab('editor');
                    }}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Macro Dialog */}
      {showMacroDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">
              {selectedMacro ? 'Edit Macro' : 'New Macro'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingMacro.name || ''}
                  onChange={(e) => setEditingMacro(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingMacro.description || ''}
                  onChange={(e) => setEditingMacro(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editingMacro.category || ''}
                    onChange={(e) => setEditingMacro(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hotkey
                  </label>
                  <input
                    type="text"
                    value={editingMacro.hotkey || ''}
                    onChange={(e) => setEditingMacro(prev => ({ ...prev, hotkey: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="e.g., Ctrl+Shift+M"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingMacro.tags?.join(', ') || ''}
                  onChange={(e) => setEditingMacro(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowMacroDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveMacro}
                disabled={!editingMacro.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog */}
      {showActionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-lg font-medium mb-4">Add Action</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  value={editingAction.type}
                  onChange={(e) => setEditingAction(prev => ({ ...prev, type: e.target.value as MacroActionType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.entries(MacroActionType).map(([key, value]) => (
                    <option key={key} value={value}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editingAction.description || ''}
                  onChange={(e) => setEditingAction(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay (ms)
                </label>
                <input
                  type="number"
                  value={editingAction.delay || 0}
                  onChange={(e) => setEditingAction(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Error Handling
                </label>
                <select
                  value={editingAction.errorHandling || 'stop'}
                  onChange={(e) => setEditingAction(prev => ({ ...prev, errorHandling: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="stop">Stop on Error</option>
                  <option value="continue">Continue on Error</option>
                  <option value="retry">Retry on Error</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowActionDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addAction}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variable Dialog */}
      {showVariableDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h2 className="text-lg font-medium mb-4">Add Variable</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={variableForm.name}
                  onChange={(e) => setVariableForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="VariableName"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={variableForm.value}
                  onChange={(e) => setVariableForm(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowVariableDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (variableForm.name) {
                    setEditingMacro(prev => ({
                      ...prev,
                      variables: {
                        ...prev.variables,
                        [variableForm.name]: variableForm.value
                      }
                    }));
                    setVariableForm({ name: '', value: '', type: 'string' });
                    setShowVariableDialog(false);
                  }
                }}
                disabled={!variableForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MacroAutomationTools;