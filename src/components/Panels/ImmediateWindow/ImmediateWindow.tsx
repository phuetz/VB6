import React from 'react';
import { useVB6 } from '../../../context/VB6Context';
import { safeEvaluator } from '../../../utils/safeExpressionEvaluator';

const ImmediateWindow: React.FC = () => {
  const { state, dispatch } = useVB6();

  const executeImmediateCommand = () => {
    if (!state.immediateCommand) return;

    try {
      // Build context from current state (you can extend this with actual variables)
      const context = {
        // Add any project variables or form controls here
        // For now, we'll use an empty context
      };

      const result = safeEvaluator.evaluate(state.immediateCommand, context);
      dispatch({ type: 'ADD_CONSOLE_OUTPUT', payload: { message: `> ${state.immediateCommand}` } });
      if (result !== undefined) {
        dispatch({ type: 'ADD_CONSOLE_OUTPUT', payload: { message: String(result) } });
      }
      dispatch({ type: 'SET_IMMEDIATE_COMMAND', payload: { command: '' } });
    } catch (error) {
      dispatch({
        type: 'ADD_CONSOLE_OUTPUT',
        payload: { message: `Error: ${(error as Error).message}` },
      });
    }
  };

  return (
    <div className="h-40 bg-white border-t border-gray-400 flex flex-col">
      <div className="bg-gray-200 px-2 py-1 text-xs font-bold flex items-center justify-between">
        <span>Immediate</span>
        <div className="flex gap-2">
          <button
            onClick={() => dispatch({ type: 'CLEAR_CONSOLE' })}
            className="hover:bg-gray-300 px-2"
            title="Clear"
          >
            Clear
          </button>
          <button
            onClick={() =>
              dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showImmediateWindow' } })
            }
            className="hover:bg-gray-300 px-1"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 p-1 font-mono text-xs overflow-y-auto bg-white">
        {state.consoleOutput.map((line, index) => (
          <div key={index} className="hover:bg-gray-100">
            {line}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-300 p-1">
        <input
          type="text"
          value={state.immediateCommand}
          onChange={e =>
            dispatch({ type: 'SET_IMMEDIATE_COMMAND', payload: { command: e.target.value } })
          }
          onKeyPress={e => {
            if (e.key === 'Enter') {
              executeImmediateCommand();
            }
          }}
          className="w-full font-mono text-xs border border-gray-300 px-1"
          placeholder="? Debug.Print or execute immediate commands..."
        />
      </div>
    </div>
  );
};

export default ImmediateWindow;
