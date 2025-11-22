import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Output Window Types
export enum OutputType {
  Build = 'Build',
  Debug = 'Debug',
  General = 'General',
  Find = 'Find',
  Error = 'Error',
  Warning = 'Warning',
  Information = 'Information',
  Compiler = 'Compiler',
  Linker = 'Linker',
  Deploy = 'Deploy',
  Custom = 'Custom'
}

export enum MessageLevel {
  Error = 'Error',
  Warning = 'Warning',
  Info = 'Info',
  Success = 'Success',
  Debug = 'Debug',
  Verbose = 'Verbose'
}

export interface OutputMessage {
  id: string;
  type: OutputType;
  level: MessageLevel;
  timestamp: Date;
  message: string;
  details?: string;
  source?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  errorCode?: string;
  category?: string;
  canNavigate: boolean;
  isCollapsible: boolean;
  children?: OutputMessage[];
  expanded?: boolean;
}

export interface OutputPane {
  id: string;
  name: string;
  type: OutputType;
  icon: string;
  color: string;
  isActive: boolean;
  messageCount: number;
  errorCount: number;
  warningCount: number;
  autoScroll: boolean;
  wordWrap: boolean;
  showTimestamps: boolean;
  showLineNumbers: boolean;
}

export interface OutputSettings {
  fontSize: number;
  fontFamily: string;
  maxMessages: number;
  autoScroll: boolean;
  wordWrap: boolean;
  showTimestamps: boolean;
  showLineNumbers: boolean;
  showMessageDetails: boolean;
  groupSimilarMessages: boolean;
  highlightErrors: boolean;
  enableFiltering: boolean;
  timestampFormat: 'HH:mm:ss' | 'HH:mm:ss.fff' | 'yyyy-MM-dd HH:mm:ss';
}

interface OutputWindowProps {
  onNavigateToFile?: (fileName: string, lineNumber?: number, columnNumber?: number) => void;
  onClearOutput?: (paneId: string) => void;
  onExportOutput?: (paneId: string, messages: OutputMessage[]) => void;
  onMessageClick?: (message: OutputMessage) => void;
}

export const OutputWindow: React.FC<OutputWindowProps> = ({
  onNavigateToFile,
  onClearOutput,
  onExportOutput,
  onMessageClick
}) => {
  const [panes, setPanes] = useState<OutputPane[]>([]);
  const [activePane, setActivePane] = useState<OutputPane | null>(null);
  const [messages, setMessages] = useState<Record<string, OutputMessage[]>>({});
  const [searchText, setSearchText] = useState('');
  const [filterLevel, setFilterLevel] = useState<MessageLevel | 'All'>('All');
  const [settings, setSettings] = useState<OutputSettings>({
    fontSize: 11,
    fontFamily: 'Consolas, Monaco, monospace',
    maxMessages: 1000,
    autoScroll: true,
    wordWrap: false,
    showTimestamps: true,
    showLineNumbers: false,
    showMessageDetails: true,
    groupSimilarMessages: false,
    highlightErrors: true,
    enableFiltering: true,
    timestampFormat: 'HH:mm:ss'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<OutputMessage | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  
  const eventEmitter = useRef(new EventEmitter());
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize panes
  useEffect(() => {
    const defaultPanes: OutputPane[] = [
      {
        id: 'build',
        name: 'Build',
        type: OutputType.Build,
        icon: '🔨',
        color: '#007acc',
        isActive: true,
        messageCount: 0,
        errorCount: 0,
        warningCount: 0,
        autoScroll: true,
        wordWrap: false,
        showTimestamps: true,
        showLineNumbers: false
      },
      {
        id: 'debug',
        name: 'Debug',
        type: OutputType.Debug,
        icon: '🐛',
        color: '#28a745',
        isActive: false,
        messageCount: 0,
        errorCount: 0,
        warningCount: 0,
        autoScroll: true,
        wordWrap: false,
        showTimestamps: true,
        showLineNumbers: false
      },
      {
        id: 'general',
        name: 'General',
        type: OutputType.General,
        icon: '📄',
        color: '#6c757d',
        isActive: false,
        messageCount: 0,
        errorCount: 0,
        warningCount: 0,
        autoScroll: true,
        wordWrap: false,
        showTimestamps: true,
        showLineNumbers: false
      },
      {
        id: 'find',
        name: 'Find Results',
        type: OutputType.Find,
        icon: '🔍',
        color: '#ffc107',
        isActive: false,
        messageCount: 0,
        errorCount: 0,
        warningCount: 0,
        autoScroll: true,
        wordWrap: false,
        showTimestamps: false,
        showLineNumbers: true
      }
    ];

    setPanes(defaultPanes);
    setActivePane(defaultPanes[0]);
    
    // Initialize with sample messages
    const sampleMessages = generateSampleMessages();
    const messagesByPane: Record<string, OutputMessage[]> = {};
    
    defaultPanes.forEach(pane => {
      messagesByPane[pane.id] = sampleMessages.filter(msg => 
        (pane.type === OutputType.Build && [OutputType.Build, OutputType.Compiler, OutputType.Linker].includes(msg.type)) ||
        (pane.type === OutputType.Debug && msg.type === OutputType.Debug) ||
        (pane.type === OutputType.General && [OutputType.General, OutputType.Information].includes(msg.type)) ||
        (pane.type === OutputType.Find && msg.type === OutputType.Find)
      );
    });
    
    setMessages(messagesByPane);
    
    // Update message counts
    updatePaneCounts(defaultPanes, messagesByPane);
  }, []);

  // Generate sample messages
  const generateSampleMessages = (): OutputMessage[] => [
    {
      id: 'msg1',
      type: OutputType.Build,
      level: MessageLevel.Info,
      timestamp: new Date(Date.now() - 60000),
      message: '------ Build started: Project: MyProject, Configuration: Debug ------',
      source: 'Build',
      canNavigate: false,
      isCollapsible: false
    },
    {
      id: 'msg2',
      type: OutputType.Compiler,
      level: MessageLevel.Info,
      timestamp: new Date(Date.now() - 55000),
      message: 'Compiling Form1.frm...',
      source: 'VB6 Compiler',
      fileName: 'Form1.frm',
      canNavigate: true,
      isCollapsible: false
    },
    {
      id: 'msg3',
      type: OutputType.Compiler,
      level: MessageLevel.Warning,
      timestamp: new Date(Date.now() - 50000),
      message: 'Variable "intUnused" is declared but never used',
      details: 'Consider removing unused variables to improve code quality',
      source: 'VB6 Compiler',
      fileName: 'Form1.frm',
      lineNumber: 15,
      columnNumber: 8,
      errorCode: 'VB40014',
      canNavigate: true,
      isCollapsible: true
    },
    {
      id: 'msg4',
      type: OutputType.Compiler,
      level: MessageLevel.Error,
      timestamp: new Date(Date.now() - 45000),
      message: 'Compile error: Variable not defined',
      details: 'The variable "strUndefinedVar" has not been declared. Add "Dim strUndefinedVar As String" or enable "Option Explicit"',
      source: 'VB6 Compiler',
      fileName: 'Module1.bas',
      lineNumber: 42,
      columnNumber: 12,
      errorCode: 'VB91003',
      canNavigate: true,
      isCollapsible: true
    },
    {
      id: 'msg5',
      type: OutputType.Build,
      level: MessageLevel.Error,
      timestamp: new Date(Date.now() - 40000),
      message: 'Build FAILED',
      details: '1 error(s), 1 warning(s)',
      source: 'Build',
      canNavigate: false,
      isCollapsible: false
    },
    {
      id: 'msg6',
      type: OutputType.Debug,
      level: MessageLevel.Debug,
      timestamp: new Date(Date.now() - 30000),
      message: 'Debug session started',
      source: 'Debugger',
      canNavigate: false,
      isCollapsible: false
    },
    {
      id: 'msg7',
      type: OutputType.Debug,
      level: MessageLevel.Info,
      timestamp: new Date(Date.now() - 25000),
      message: 'Breakpoint hit at Form1.Button1_Click',
      source: 'Debugger',
      fileName: 'Form1.frm',
      lineNumber: 28,
      canNavigate: true,
      isCollapsible: false
    },
    {
      id: 'msg8',
      type: OutputType.General,
      level: MessageLevel.Info,
      timestamp: new Date(Date.now() - 20000),
      message: 'Ready',
      source: 'IDE',
      canNavigate: false,
      isCollapsible: false
    },
    {
      id: 'msg9',
      type: OutputType.Find,
      level: MessageLevel.Info,
      timestamp: new Date(Date.now() - 15000),
      message: 'Find "Button1_Click" (3 matches in 2 files)',
      source: 'Find',
      canNavigate: false,
      isCollapsible: true,
      children: [
        {
          id: 'msg9a',
          type: OutputType.Find,
          level: MessageLevel.Info,
          timestamp: new Date(Date.now() - 15000),
          message: 'Form1.frm(28): Private Sub Button1_Click()',
          fileName: 'Form1.frm',
          lineNumber: 28,
          source: 'Find',
          canNavigate: true,
          isCollapsible: false
        },
        {
          id: 'msg9b',
          type: OutputType.Find,
          level: MessageLevel.Info,
          timestamp: new Date(Date.now() - 15000),
          message: 'Form1.frm(45): Call Button1_Click',
          fileName: 'Form1.frm',
          lineNumber: 45,
          source: 'Find',
          canNavigate: true,
          isCollapsible: false
        },
        {
          id: 'msg9c',
          type: OutputType.Find,
          level: MessageLevel.Info,
          timestamp: new Date(Date.now() - 15000),
          message: 'Documentation.txt(12): Button1_Click event handler',
          fileName: 'Documentation.txt',
          lineNumber: 12,
          source: 'Find',
          canNavigate: true,
          isCollapsible: false
        }
      ],
      expanded: false
    }
  ];

  // Update pane message counts
  const updatePaneCounts = useCallback((paneList: OutputPane[], messagesByPane: Record<string, OutputMessage[]>) => {
    const updatedPanes = paneList.map(pane => {
      const paneMessages = messagesByPane[pane.id] || [];
      return {
        ...pane,
        messageCount: paneMessages.length,
        errorCount: paneMessages.filter(m => m.level === MessageLevel.Error).length,
        warningCount: paneMessages.filter(m => m.level === MessageLevel.Warning).length
      };
    });
    setPanes(updatedPanes);
  }, []);

  // Add message to pane
  const addMessage = useCallback((paneId: string, message: OutputMessage) => {
    setMessages(prev => {
      const paneMessages = prev[paneId] || [];
      const newMessages = {
        ...prev,
        [paneId]: [...paneMessages.slice(-(settings.maxMessages - 1)), message]
      };
      
      // Update counts
      updatePaneCounts(panes, newMessages);
      
      return newMessages;
    });

    // Auto-scroll if enabled
    if (activePane?.id === paneId && settings.autoScroll) {
      setTimeout(() => {
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      }, 10);
    }
  }, [settings.maxMessages, settings.autoScroll, activePane, panes, updatePaneCounts]);

  // Clear pane messages
  const clearPane = useCallback((paneId: string) => {
    setMessages(prev => ({
      ...prev,
      [paneId]: []
    }));
    
    onClearOutput?.(paneId);
    
    // Update counts
    const newMessages = { ...messages, [paneId]: [] };
    updatePaneCounts(panes, newMessages);
  }, [messages, panes, updatePaneCounts, onClearOutput]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    if (!activePane) return [];
    
    let paneMessages = messages[activePane.id] || [];
    
    // Apply level filter
    if (filterLevel !== 'All') {
      paneMessages = paneMessages.filter(msg => msg.level === filterLevel);
    }
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      paneMessages = paneMessages.filter(msg =>
        msg.message.toLowerCase().includes(searchLower) ||
        (msg.source && msg.source.toLowerCase().includes(searchLower)) ||
        (msg.fileName && msg.fileName.toLowerCase().includes(searchLower)) ||
        (msg.details && msg.details.toLowerCase().includes(searchLower))
      );
    }
    
    return paneMessages;
  }, [activePane, messages, filterLevel, searchText]);

  // Toggle message expansion
  const toggleMessageExpansion = useCallback((messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  // Navigate to file location
  const navigateToFile = useCallback((message: OutputMessage) => {
    if (message.canNavigate && message.fileName) {
      onNavigateToFile?.(message.fileName, message.lineNumber, message.columnNumber);
    }
  }, [onNavigateToFile]);

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    switch (settings.timestampFormat) {
      case 'HH:mm:ss':
        return date.toLocaleTimeString('en-US', { hour12: false });
      case 'HH:mm:ss.fff':
        return date.toLocaleTimeString('en-US', { hour12: false }) + '.' + 
               date.getMilliseconds().toString().padStart(3, '0');
      case 'yyyy-MM-dd HH:mm:ss':
        return date.toISOString().slice(0, 19).replace('T', ' ');
      default:
        return date.toLocaleTimeString();
    }
  };

  // Get message level icon and color
  const getMessageLevelStyle = (level: MessageLevel): { icon: string; color: string } => {
    switch (level) {
      case MessageLevel.Error:
        return { icon: '❌', color: 'text-red-600' };
      case MessageLevel.Warning:
        return { icon: '⚠️', color: 'text-yellow-600' };
      case MessageLevel.Success:
        return { icon: '✅', color: 'text-green-600' };
      case MessageLevel.Debug:
        return { icon: '🐛', color: 'text-blue-600' };
      case MessageLevel.Verbose:
        return { icon: '📝', color: 'text-gray-500' };
      case MessageLevel.Info:
      default:
        return { icon: 'ℹ️', color: 'text-gray-700' };
    }
  };

  // Render message with children
  const renderMessage = (message: OutputMessage, depth: number = 0): React.ReactNode => {
    const levelStyle = getMessageLevelStyle(message.level);
    const isExpanded = expandedMessages.has(message.id);
    const isSelected = selectedMessage?.id === message.id;

    return (
      <React.Fragment key={message.id}>
        <div
          className={`flex items-start py-1 px-2 hover:bg-gray-100 cursor-pointer ${
            isSelected ? 'bg-blue-100' : ''
          } ${settings.highlightErrors && message.level === MessageLevel.Error ? 'bg-red-50' : ''}`}
          style={{ 
            paddingLeft: `${8 + depth * 16}px`,
            fontSize: `${settings.fontSize}px`,
            fontFamily: settings.fontFamily
          }}
          onClick={() => {
            setSelectedMessage(message);
            onMessageClick?.(message);
            if (message.canNavigate) {
              navigateToFile(message);
            }
          }}
        >
          {/* Expansion toggle */}
          <div className="w-4 flex-shrink-0">
            {message.isCollapsible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMessageExpansion(message.id);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
          </div>

          {/* Timestamp */}
          {settings.showTimestamps && (
            <div className="w-20 flex-shrink-0 text-xs text-gray-500 mr-2">
              {formatTimestamp(message.timestamp)}
            </div>
          )}

          {/* Level icon */}
          <span className="w-6 flex-shrink-0 text-center">{levelStyle.icon}</span>

          {/* Message content */}
          <div className="flex-1 min-w-0">
            <div className={`${levelStyle.color} ${settings.wordWrap ? 'break-words' : 'truncate'}`}>
              {message.message}
            </div>
            
            {/* Source and location */}
            {(message.source || message.fileName) && (
              <div className="text-xs text-gray-500 mt-1">
                {message.source && <span>Source: {message.source}</span>}
                {message.source && message.fileName && <span> | </span>}
                {message.fileName && (
                  <span>
                    File: {message.fileName}
                    {message.lineNumber && `:${message.lineNumber}`}
                    {message.columnNumber && `:${message.columnNumber}`}
                  </span>
                )}
                {message.errorCode && (
                  <span> | Code: {message.errorCode}</span>
                )}
              </div>
            )}
            
            {/* Details (when expanded) */}
            {isExpanded && message.details && (
              <div className="mt-2 p-2 bg-gray-50 border-l-2 border-gray-300 text-sm text-gray-600">
                {message.details}
              </div>
            )}
          </div>

          {/* Navigation indicator */}
          {message.canNavigate && (
            <span className="w-4 flex-shrink-0 text-blue-600 text-center" title="Click to navigate">
              🔗
            </span>
          )}
        </div>

        {/* Render children if expanded */}
        {isExpanded && message.children && 
          message.children.map(child => renderMessage(child, depth + 1))
        }
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header with tabs */}
      <div className="flex items-center justify-between border-b border-gray-300">
        <div className="flex">
          {panes.map(pane => (
            <button
              key={pane.id}
              onClick={() => setActivePane(pane)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 ${
                activePane?.id === pane.id
                  ? 'border-blue-500 bg-white text-blue-600'
                  : 'border-transparent bg-gray-100 text-gray-600 hover:text-gray-800'
              }`}
            >
              <span>{pane.icon}</span>
              <span>{pane.name}</span>
              {pane.messageCount > 0 && (
                <span className="px-1 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                  {pane.messageCount}
                </span>
              )}
              {pane.errorCount > 0 && (
                <span className="px-1 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                  {pane.errorCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 p-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded w-24"
          />
          
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as MessageLevel | 'All')}
            className="px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value="All">All Levels</option>
            {Object.values(MessageLevel).map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          
          <button
            onClick={() => activePane && clearPane(activePane.id)}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            title="Clear"
          >
            🗑️
          </button>
          
          <button
            onClick={() => activePane && onExportOutput?.(activePane.id, filteredMessages)}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Export"
          >
            💾
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-2 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.autoScroll}
                onChange={(e) => setSettings(prev => ({ ...prev, autoScroll: e.target.checked }))}
              />
              Auto Scroll
            </label>
            
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.wordWrap}
                onChange={(e) => setSettings(prev => ({ ...prev, wordWrap: e.target.checked }))}
              />
              Word Wrap
            </label>
            
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.showTimestamps}
                onChange={(e) => setSettings(prev => ({ ...prev, showTimestamps: e.target.checked }))}
              />
              Timestamps
            </label>
            
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={settings.highlightErrors}
                onChange={(e) => setSettings(prev => ({ ...prev, highlightErrors: e.target.checked }))}
              />
              Highlight Errors
            </label>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto bg-white"
      >
        {activePane ? (
          filteredMessages.length > 0 ? (
            filteredMessages.map(message => renderMessage(message))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">{activePane.icon}</div>
                <p className="text-lg">No messages in {activePane.name}</p>
                {searchText || filterLevel !== 'All' ? (
                  <p className="text-sm mt-2">Try adjusting filters or search criteria</p>
                ) : (
                  <p className="text-sm mt-2">Messages will appear here during build, debug, and other operations</p>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select an output pane</p>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between p-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          {activePane && (
            <>
              <span>Messages: {filteredMessages.length}/{activePane.messageCount}</span>
              <span>Errors: {activePane.errorCount}</span>
              <span>Warnings: {activePane.warningCount}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {settings.autoScroll && <span className="text-green-600">Auto-scroll</span>}
          {settings.wordWrap && <span className="text-blue-600">Word wrap</span>}
          <span>Font: {settings.fontSize}px</span>
        </div>
      </div>
    </div>
  );
};

export default OutputWindow;