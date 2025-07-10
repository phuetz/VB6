import React, { useState } from 'react';
import { X, Edit, CheckCircle, Play, Trash2, FileText, Plus, AlertOctagon } from 'lucide-react';

interface Breakpoint {
  id: string;
  file: string;
  line: number;
  column: number;
  condition?: string;
  hitCount?: number;
  enabled: boolean;
  hitCountCondition?: {
    type: 'equals' | 'greaterThan' | 'multiplier';
    value: number;
  };
  logMessage?: string;
}

interface BreakpointManagerProps {
  visible: boolean;
  onClose: () => void;
  breakpoints: Breakpoint[];
  onAddBreakpoint: (breakpoint: Breakpoint) => void;
  onRemoveBreakpoint: (id: string) => void;
  onUpdateBreakpoint: (id: string, breakpoint: Partial<Breakpoint>) => void;
  onNavigateToBreakpoint: (file: string, line: number, column: number) => void;
}

export const BreakpointManager: React.FC<BreakpointManagerProps> = ({
  visible,
  onClose,
  breakpoints,
  onAddBreakpoint,
  onRemoveBreakpoint,
  onUpdateBreakpoint,
  onNavigateToBreakpoint
}) => {
  const [editingBreakpoint, setEditingBreakpoint] = useState<string | null>(null);
  const [conditionText, setConditionText] = useState('');
  const [hitConditionType, setHitConditionType] = useState<'equals' | 'greaterThan' | 'multiplier'>('equals');
  const [hitConditionValue, setHitConditionValue] = useState(0);
  const [logMessage, setLogMessage] = useState('');

  const handleStartEditing = (breakpoint: Breakpoint) => {
    setEditingBreakpoint(breakpoint.id);
    setConditionText(breakpoint.condition || '');
    setHitConditionType(breakpoint.hitCountCondition?.type || 'equals');
    setHitConditionValue(breakpoint.hitCountCondition?.value || 0);
    setLogMessage(breakpoint.logMessage || '');
  };

  const handleSaveEditing = (id: string) => {
    const updates: Partial<Breakpoint> = {};
    
    if (conditionText.trim()) {
      updates.condition = conditionText.trim();
    } else {
      updates.condition = undefined;
    }
    
    if (hitConditionValue > 0) {
      updates.hitCountCondition = {
        type: hitConditionType,
        value: hitConditionValue
      };
    } else {
      updates.hitCountCondition = undefined;
    }
    
    if (logMessage.trim()) {
      updates.logMessage = logMessage.trim();
    } else {
      updates.logMessage = undefined;
    }
    
    onUpdateBreakpoint(id, updates);
    setEditingBreakpoint(null);
  };

  const formatHitCondition = (bp: Breakpoint) => {
    if (!bp.hitCountCondition) return 'None';
    
    switch (bp.hitCountCondition.type) {
      case 'equals':
        return `Equals ${bp.hitCountCondition.value}`;
      case 'greaterThan':
        return `> ${bp.hitCountCondition.value}`;
      case 'multiplier':
        return `Multiple of ${bp.hitCountCondition.value}`;
      default:
        return 'Unknown';
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '800px', height: '600px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon size={16} />
            <span>Breakpoint Manager</span>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">×</button>
        </div>

        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm">
              {breakpoints.length} breakpoint{breakpoints.length !== 1 ? 's' : ''} set
            </div>
            <div className="space-x-2">
              <button 
                className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded flex items-center gap-1"
                onClick={() => {
                  // Open add breakpoint dialog - would normally use a form
                  const newBp: Breakpoint = {
                    id: Date.now().toString(),
                    file: 'Form1.frm',
                    line: 1,
                    column: 1,
                    enabled: true
                  };
                  onAddBreakpoint(newBp);
                }}
              >
                <Plus size={12} />
                Add
              </button>
              
              <button 
                className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded disabled:opacity-50"
                disabled={breakpoints.length === 0}
                onClick={() => {
                  if (confirm('Are you sure you want to remove all breakpoints?')) {
                    breakpoints.forEach(bp => onRemoveBreakpoint(bp.id));
                  }
                }}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 bg-white border border-gray-400 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr className="border-b border-gray-300">
                    <th className="text-left p-2 w-12">Status</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Condition</th>
                    <th className="text-left p-2">Hit Count</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {breakpoints.length > 0 ? (
                    breakpoints.map(bp => (
                      <React.Fragment key={bp.id}>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={bp.enabled}
                              onChange={() => onUpdateBreakpoint(bp.id, { enabled: !bp.enabled })}
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="p-2 font-mono">
                            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                                 onClick={() => onNavigateToBreakpoint(bp.file, bp.line, bp.column)}>
                              <FileText size={12} />
                              {bp.file}:{bp.line}
                            </div>
                          </td>
                          <td className="p-2">{bp.condition || 'None'}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <span>{bp.hitCount || 0}</span>
                              {bp.hitCountCondition && (
                                <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                  {formatHitCondition(bp)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <button
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                onClick={() => handleStartEditing(bp)}
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                onClick={() => onRemoveBreakpoint(bp.id)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {editingBreakpoint === bp.id && (
                          <tr className="bg-blue-50">
                            <td colSpan={5} className="p-3 space-y-2">
                              <div>
                                <label className="block text-xs font-semibold mb-1">Condition (optional)</label>
                                <input
                                  type="text"
                                  value={conditionText}
                                  onChange={(e) => setConditionText(e.target.value)}
                                  placeholder="e.g. x > 5 && y < 10"
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                  Enter an expression that must be true for the breakpoint to be hit
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold mb-1">Hit Condition Type</label>
                                  <select
                                    value={hitConditionType}
                                    onChange={(e) => setHitConditionType(e.target.value as any)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                  >
                                    <option value="equals">Break when hits equals</option>
                                    <option value="greaterThan">Break when hits greater than</option>
                                    <option value="multiplier">Break when hits is multiple of</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold mb-1">Hit Count Value</label>
                                  <input
                                    type="number"
                                    value={hitConditionValue}
                                    onChange={(e) => setHitConditionValue(parseInt(e.target.value) || 0)}
                                    min={0}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-semibold mb-1">Log Message (optional)</label>
                                <input
                                  type="text"
                                  value={logMessage}
                                  onChange={(e) => setLogMessage(e.target.value)}
                                  placeholder="Message to log when breakpoint is hit"
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                  Log without breaking execution. Use {'{varName}'} to include variable values.
                                </div>
                              </div>
                              
                              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-300">
                                <button 
                                  className="px-3 py-1 bg-gray-300 text-gray-800 text-xs rounded hover:bg-gray-400"
                                  onClick={() => setEditingBreakpoint(null)}
                                >
                                  Cancel
                                </button>
                                <button 
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                  onClick={() => handleSaveEditing(bp.id)}
                                >
                                  Save
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        No breakpoints set. Click the "Add" button to create a new breakpoint.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-300 flex flex-col">
            <div className="mb-2 text-sm font-semibold">Breakpoint Tips</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-1">
                <CheckCircle size={12} className="text-green-600" />
                <span>Use conditional breakpoints to pause execution only when specific conditions are met.</span>
              </div>
              <div className="flex items-center gap-1">
                <Play size={12} className="text-blue-600" />
                <span>Hit count conditions can help debug loop-related issues.</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText size={12} className="text-purple-600" />
                <span>Log messages let you output values without stopping execution.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};