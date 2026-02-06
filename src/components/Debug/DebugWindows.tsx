import React, { useState, useCallback } from 'react';
import { useVB6 } from '../../context/VB6Context';
import {
  Play,
  Square,
  StepBack as StepInto,
  StepBack as StepOver,
  StepBack as StepOut,
} from 'lucide-react';

interface BreakpointInfo {
  file: string;
  line: number;
  condition?: string;
  enabled: boolean;
}

interface WatchVariable {
  id: string;
  expression: string;
  value: any;
  type: string;
}

interface CallStackFrame {
  procedure: string;
  module: string;
  line: number;
  arguments: { [key: string]: any };
}

export const WatchWindow: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose,
}) => {
  const { state } = useVB6();
  const [watchVariables, setWatchVariables] = useState<WatchVariable[]>([
    { id: '1', expression: 'Text1.Text', value: '""', type: 'String' },
    { id: '2', expression: 'i', value: '0', type: 'Integer' },
    { id: '3', expression: 'Now()', value: new Date().toLocaleString(), type: 'Date' },
  ]);
  const [newExpression, setNewExpression] = useState('');

  const addWatch = useCallback(() => {
    if (newExpression.trim()) {
      const newWatch: WatchVariable = {
        id: Date.now().toString(),
        expression: newExpression.trim(),
        value: '<Not evaluated>',
        type: 'Variant',
      };
      setWatchVariables([...watchVariables, newWatch]);
      setNewExpression('');
    }
  }, [newExpression, watchVariables]);

  const removeWatch = useCallback(
    (id: string) => {
      setWatchVariables(watchVariables.filter(w => w.id !== id));
    },
    [watchVariables]
  );

  if (!visible) return null;

  return (
    <div className="w-80 bg-white border border-gray-400 flex flex-col">
      <div className="bg-blue-600 text-white text-xs font-bold p-1 flex items-center justify-between">
        <span>Watch</span>
        <button onClick={onClose} className="hover:bg-blue-700 px-1">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-1 border-b">Expression</th>
              <th className="text-left p-1 border-b">Value</th>
              <th className="text-left p-1 border-b">Type</th>
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody>
            {watchVariables.map(watch => (
              <tr key={watch.id} className="hover:bg-gray-50">
                <td className="p-1 border-b font-mono">{watch.expression}</td>
                <td className="p-1 border-b font-mono">{String(watch.value)}</td>
                <td className="p-1 border-b">{watch.type}</td>
                <td className="p-1 border-b">
                  <button
                    onClick={() => removeWatch(watch.id)}
                    className="text-red-600 hover:bg-red-100 px-1"
                    title="Remove watch"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t p-2">
        <div className="flex gap-1">
          <input
            type="text"
            value={newExpression}
            onChange={e => setNewExpression(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && addWatch()}
            placeholder="Enter expression to watch"
            className="flex-1 px-1 text-xs border border-gray-300"
          />
          <button
            onClick={addWatch}
            className="px-2 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export const LocalsWindow: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose,
}) => {
  const localVariables = [
    { name: 'Me', value: 'Form1', type: 'Form' },
    { name: 'i', value: '5', type: 'Integer' },
    { name: 'strName', value: '"John Doe"', type: 'String' },
    { name: 'blnFlag', value: 'True', type: 'Boolean' },
  ];

  if (!visible) return null;

  return (
    <div className="w-80 bg-white border border-gray-400 flex flex-col">
      <div className="bg-blue-600 text-white text-xs font-bold p-1 flex items-center justify-between">
        <span>Locals</span>
        <button onClick={onClose} className="hover:bg-blue-700 px-1">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-1 border-b">Name</th>
              <th className="text-left p-1 border-b">Value</th>
              <th className="text-left p-1 border-b">Type</th>
            </tr>
          </thead>
          <tbody>
            {localVariables.map((variable, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-1 border-b font-mono">{variable.name}</td>
                <td className="p-1 border-b font-mono">{variable.value}</td>
                <td className="p-1 border-b">{variable.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CallStackWindow: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose,
}) => {
  const callStack: CallStackFrame[] = [
    { procedure: 'Command1_Click', module: 'Form1', line: 15, arguments: {} },
    { procedure: 'ProcessData', module: 'Module1', line: 42, arguments: { strInput: '"test"' } },
    { procedure: 'ValidateInput', module: 'Module1', line: 78, arguments: { value: '123' } },
  ];

  if (!visible) return null;

  return (
    <div className="w-80 bg-white border border-gray-400 flex flex-col">
      <div className="bg-blue-600 text-white text-xs font-bold p-1 flex items-center justify-between">
        <span>Call Stack</span>
        <button onClick={onClose} className="hover:bg-blue-700 px-1">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {callStack.map((frame, index) => (
          <div key={index} className="p-2 border-b hover:bg-gray-50 cursor-pointer text-xs">
            <div className="font-mono font-semibold">{frame.procedure}</div>
            <div className="text-gray-600">
              {frame.module}, line {frame.line}
            </div>
            {Object.keys(frame.arguments).length > 0 && (
              <div className="text-gray-500 text-xs">
                {Object.entries(frame.arguments).map(([key, value]) => (
                  <span key={key}>
                    {key}={String(value)}{' '}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DebugToolbar: React.FC = () => {
  const { state, dispatch } = useVB6();
  const [debugMode, setDebugMode] = useState<'design' | 'run' | 'break'>('design');

  const handleRun = useCallback(() => {
    setDebugMode('run');
    dispatch({ type: 'SET_EXECUTION_MODE', payload: { mode: 'run' } });
  }, [dispatch]);

  const handleStop = useCallback(() => {
    setDebugMode('design');
    dispatch({ type: 'SET_EXECUTION_MODE', payload: { mode: 'design' } });
  }, [dispatch]);

  const handleBreak = useCallback(() => {
    setDebugMode('break');
    dispatch({ type: 'SET_EXECUTION_MODE', payload: { mode: 'break' } });
  }, [dispatch]);

  const handleStep = useCallback((type: 'into' | 'over' | 'out') => {
    if (process.env.NODE_ENV === 'development') {
      // noop
    }
  }, []);

  return (
    <div className="bg-gray-200 border-b border-gray-400 p-1 flex items-center gap-1">
      <button
        onClick={handleRun}
        disabled={debugMode === 'run'}
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50 flex items-center gap-1"
        title="Start (F5)"
      >
        <Play size={16} />
        <span className="text-xs">Start</span>
      </button>

      <button
        onClick={handleStop}
        disabled={debugMode === 'design'}
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50 flex items-center gap-1"
        title="End"
      >
        <Square size={16} />
        <span className="text-xs">End</span>
      </button>

      <button
        onClick={handleBreak}
        disabled={debugMode !== 'run'}
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50 flex items-center gap-1"
        title="Break"
      >
        <Square size={16} />
        <span className="text-xs">Break</span>
      </button>

      <div className="w-px h-6 bg-gray-400 mx-1" />

      <button
        onClick={() => handleStep('into')}
        disabled={debugMode !== 'break'}
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
        title="Step Into (F8)"
      >
        <StepInto size={16} />
      </button>

      <button
        onClick={() => handleStep('over')}
        disabled={debugMode !== 'break'}
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
        title="Step Over (Shift+F8)"
      >
        <StepOver size={16} />
      </button>

      <button
        onClick={() => handleStep('out')}
        disabled={debugMode !== 'break'}
        className="p-1 border border-gray-400 bg-gray-100 hover:bg-gray-300 disabled:opacity-50"
        title="Step Out (Ctrl+Shift+F8)"
      >
        <StepOut size={16} />
      </button>

      <div className="ml-auto text-xs text-gray-600">
        Mode: {debugMode === 'design' ? 'Design' : debugMode === 'run' ? 'Run' : 'Break'}
      </div>
    </div>
  );
};
