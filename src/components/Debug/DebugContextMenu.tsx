import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Target, Eye, EyeOff, Settings, 
  ArrowDown, ArrowRight, SkipForward, Info,
  Clock, MessageCircle, AlertTriangle, Zap
} from 'lucide-react';
import { vb6Debugger, Breakpoint } from '../../services/VB6DebuggerService';

interface DebugContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  file: string;
  line: number;
  selectedText?: string;
  onClose: () => void;
  onAddWatch?: (expression: string) => void;
}

export const DebugContextMenu: React.FC<DebugContextMenuProps> = ({
  visible,
  x,
  y,
  file,
  line,
  selectedText,
  onClose,
  onAddWatch
}) => {
  const [debuggerState, setDebuggerState] = useState(vb6Debugger.getState());
  const [existingBreakpoint, setExistingBreakpoint] = useState<Breakpoint | null>(null);
  const [showConditionDialog, setShowConditionDialog] = useState(false);
  const [showLogPointDialog, setShowLogPointDialog] = useState(false);
  const [condition, setCondition] = useState('');
  const [logMessage, setLogMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setDebuggerState(vb6Debugger.getState());
      const bp = vb6Debugger.getBreakpoints().find(bp => bp.file === file && bp.line === line);
      setExistingBreakpoint(bp || null);
    }
  }, [visible, file, line]);

  // Handle clicks outside to close
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.debug-context-menu')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible, onClose]);

  if (!visible) return null;

  const menuItems = [
    // Breakpoint actions
    {
      label: existingBreakpoint ? 'Remove Breakpoint' : 'Add Breakpoint',
      icon: Target,
      action: () => {
        if (existingBreakpoint) {
          vb6Debugger.removeBreakpoint(existingBreakpoint.id);
        } else {
          vb6Debugger.addBreakpoint(file, line);
        }
        onClose();
      },
      shortcut: 'F9'
    },
    
    {
      label: existingBreakpoint?.enabled ? 'Disable Breakpoint' : 'Enable Breakpoint',
      icon: existingBreakpoint?.enabled ? EyeOff : Eye,
      action: () => {
        if (existingBreakpoint) {
          vb6Debugger.toggleBreakpoint(existingBreakpoint.id);
        }
        onClose();
      },
      disabled: !existingBreakpoint
    },

    { separator: true },

    // Conditional breakpoint
    {
      label: 'Conditional Breakpoint...',
      icon: Settings,
      action: () => {
        setCondition(existingBreakpoint?.condition || '');
        setShowConditionDialog(true);
      },
      shortcut: 'Ctrl+F9'
    },

    // Log point
    {
      label: 'Log Point...',
      icon: MessageCircle,
      action: () => {
        setLogMessage(existingBreakpoint?.logMessage || '');
        setShowLogPointDialog(true);
      }
    },

    { separator: true },

    // Run to cursor
    {
      label: 'Run to Cursor',
      icon: Play,
      action: async () => {
        // Add temporary breakpoint and continue
        const tempBp = vb6Debugger.addBreakpoint(file, line, { temporary: true });
        if (debuggerState.status === 'paused') {
          await vb6Debugger.resume();
        }
        onClose();
      },
      disabled: debuggerState.status === 'idle',
      shortcut: 'Ctrl+F10'
    },

    // Step actions (only when paused)
    ...(debuggerState.status === 'paused' ? [
      { separator: true },
      {
        label: 'Step Into',
        icon: ArrowDown,
        action: () => {
          vb6Debugger.step('stepInto' as any);
          onClose();
        },
        shortcut: 'F8'
      },
      {
        label: 'Step Over',
        icon: ArrowRight,
        action: () => {
          vb6Debugger.step('stepOver' as any);
          onClose();
        },
        shortcut: 'Shift+F8'
      },
      {
        label: 'Step Out',
        icon: SkipForward,
        action: () => {
          vb6Debugger.step('stepOut' as any);
          onClose();
        },
        shortcut: 'Ctrl+Shift+F8'
      }
    ] : []),

    { separator: true },

    // Watch expressions
    ...(selectedText ? [
      {
        label: `Add Watch: "${selectedText}"`,
        icon: Eye,
        action: () => {
          vb6Debugger.addWatch(selectedText);
          onAddWatch?.(selectedText);
          onClose();
        }
      },
      {
        label: `Evaluate: "${selectedText}"`,
        icon: Zap,
        action: async () => {
          try {
            const result = await vb6Debugger.evaluateExpression(selectedText);
            console.log(`Evaluation result: ${selectedText} = ${result.value} (${result.type})`);
            // Could show a popup with the result
          } catch (error: any) {
            console.error(`Evaluation error: ${error.message}`);
          }
          onClose();
        },
        disabled: debuggerState.status !== 'paused'
      },
      { separator: true }
    ] : []),

    // Performance profiling
    {
      label: 'Set Performance Marker',
      icon: Clock,
      action: () => {
        // Add a performance marker at this line
        console.log(`Performance marker set at ${file}:${line}`);
        onClose();
      }
    },

    // Show info
    {
      label: 'Breakpoint Info...',
      icon: Info,
      action: () => {
        if (existingBreakpoint) {
          // Show detailed breakpoint info
          console.log('Breakpoint info:', existingBreakpoint);
        }
        onClose();
      },
      disabled: !existingBreakpoint
    }
  ].filter(item => item); // Remove null/undefined items

  const handleConditionSubmit = () => {
    if (existingBreakpoint) {
      vb6Debugger.updateBreakpoint(existingBreakpoint.id, { condition: condition || undefined });
    } else {
      vb6Debugger.addBreakpoint(file, line, { condition: condition || undefined });
    }
    setShowConditionDialog(false);
    onClose();
  };

  const handleLogPointSubmit = () => {
    if (existingBreakpoint) {
      vb6Debugger.updateBreakpoint(existingBreakpoint.id, { logMessage: logMessage || undefined });
    } else {
      vb6Debugger.addBreakpoint(file, line, { logMessage: logMessage || undefined });
    }
    setShowLogPointDialog(false);
    onClose();
  };

  return (
    <>
      {/* Context Menu */}
      <div
        className="debug-context-menu fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-[10000] min-w-48"
        style={{ left: x, top: y }}
      >
        {menuItems.map((item, index) => {
          if ('separator' in item && item.separator) {
            return <div key={index} className="border-t border-gray-200 my-1" />;
          }

          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.action}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                item.disabled ? '' : 'cursor-pointer'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-gray-500">{item.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Condition Dialog */}
      {showConditionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Conditional Breakpoint</h3>
            <p className="text-sm text-gray-600 mb-4">
              Breakpoint will only trigger when this condition is true:
            </p>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g., x > 10 And y <> 0"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleConditionSubmit()}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConditionDialog(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConditionSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Point Dialog */}
      {showLogPointDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Log Point</h3>
            <p className="text-sm text-gray-600 mb-4">
              Message to log when this line is reached (use {'{expression}'} to include values):
            </p>
            <input
              type="text"
              value={logMessage}
              onChange={(e) => setLogMessage(e.target.value)}
              placeholder="e.g., Value of x is {x}"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleLogPointSubmit()}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogPointDialog(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleLogPointSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DebugContextMenu;