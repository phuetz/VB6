import React, { useCallback } from 'react';
import { useVB6 } from '../../context/VB6Context';

const CodeEditor: React.FC = () => {
  const { state, dispatch } = useVB6();

  const getAvailableEvents = (controlType: string) => {
    const commonEvents = ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove', 'KeyDown', 'KeyUp', 'KeyPress'];
    const formEvents = ['Load', 'Unload', 'Activate', 'Deactivate', 'Initialize', 'Paint', 'QueryUnload', 'Resize'];
    
    const specificEvents: { [key: string]: string[] } = {
      'Form': [...formEvents, ...commonEvents],
      'CommandButton': [...commonEvents, 'GotFocus', 'LostFocus'],
      'TextBox': [...commonEvents, 'Change', 'GotFocus', 'LostFocus', 'Validate'],
      'Label': ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove'],
      'CheckBox': [...commonEvents, 'Click', 'GotFocus', 'LostFocus'],
      'OptionButton': [...commonEvents, 'Click', 'GotFocus', 'LostFocus'],
      'ComboBox': [...commonEvents, 'Change', 'DropDown', 'GotFocus', 'LostFocus', 'Validate'],
      'ImageCombo': [...commonEvents, 'Change', 'DropDown', 'GotFocus', 'LostFocus', 'Validate'],
      'RichTextBox': [...commonEvents, 'Change', 'GotFocus', 'LostFocus', 'Validate'],
      'Timer': ['Timer'],
      'DriveListBox': [...commonEvents, 'Change'],
      'DirListBox': [...commonEvents, 'Change'],
      'FileListBox': [...commonEvents, 'Change'],
      'ImageList': [...commonEvents],
      'ListView': [...commonEvents, 'ItemClick', 'ColumnClick', 'ItemCheck'],
      'DateTimePicker': [...commonEvents, 'Change'],
      'MonthView': [...commonEvents, 'DateClick'],
      'Shape': ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove'],
      'Line': ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove'],
      'Image': [...commonEvents, 'GotFocus', 'LostFocus'],
      'TreeView': [...commonEvents, 'NodeClick', 'Expand', 'Collapse']
    };
    
    return specificEvents[controlType] || commonEvents;
  };

  const saveEventCode = useCallback(() => {
    if (state.selectedControls.length !== 1 || !state.selectedEvent) return;
    
    const control = state.selectedControls[0];
    const eventKey = `${control.name}_${state.selectedEvent}`;
    const codeEditor = document.getElementById('codeEditor') as HTMLTextAreaElement;
    
    if (codeEditor) {
      dispatch({
        type: 'UPDATE_EVENT_CODE',
        payload: { eventKey, code: codeEditor.value }
      });
    }
  }, [state.selectedControls, state.selectedEvent, dispatch]);

  const loadEventCode = useCallback(() => {
    if (state.selectedControls.length !== 1 || !state.selectedEvent) return;
    
    const control = state.selectedControls[0];
    const eventKey = `${control.name}_${state.selectedEvent}`;
    const code = state.eventCode[eventKey] || '';
    const codeEditor = document.getElementById('codeEditor') as HTMLTextAreaElement;
    
    if (codeEditor) {
      codeEditor.value = code;
    }
  }, [state.selectedControls, state.selectedEvent, state.eventCode]);

  React.useEffect(() => {
    loadEventCode();
  }, [state.selectedEvent, state.selectedControls, loadEventCode]);

  return (
    <div className="flex-1 bg-white overflow-hidden flex flex-col">
      <div className="bg-gray-200 px-2 py-1 border-b border-gray-400 flex items-center gap-2">
        <select
          className="text-xs border border-gray-300 px-2 py-1"
          value={state.selectedControls.length === 1 ? state.selectedControls[0].name : '(General)'}
          onChange={(e) => {
            if (e.target.value === '(General)') {
              dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: [] } });
            } else {
              const control = state.controls.find(c => c.name === e.target.value);
              if (control) {
                dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: [control.id] } });
              }
            }
          }}
        >
          <option value="(General)">(General)</option>
          <option value="Form">Form</option>
          {state.controls.map(control => (
            <option key={control.id} value={control.name}>{control.name}</option>
          ))}
        </select>
        
        <select
          className="text-xs border border-gray-300 px-2 py-1"
          value={state.selectedEvent}
          onChange={(e) => dispatch({ type: 'SET_SELECTED_EVENT', payload: { eventName: e.target.value } })}
          disabled={state.selectedControls.length !== 1}
        >
          {state.selectedControls.length === 1 ? 
            getAvailableEvents(state.selectedControls[0].type).map(event => (
              <option key={event} value={event}>{event}</option>
            )) : (
              <option value="">(Declarations)</option>
            )
          }
        </select>
      </div>
      
      <div className="flex-1 p-2 font-mono text-xs overflow-auto bg-white">
        {state.selectedControls.length === 1 ? (
          <div className="relative">
            <div className="text-blue-600 mb-1">
              Private Sub {state.selectedControls[0].name}_{state.selectedEvent}()
            </div>
            <textarea
              id="codeEditor"
              className="w-full h-64 border border-gray-300 p-2 font-mono text-xs bg-white"
              placeholder="' Write your VB6 code here
' Use 'BREAKPOINT or 'BP to add breakpoints
' Press Ctrl+Space for IntelliSense"
              onChange={saveEventCode}
              spellCheck={false}
              style={{ 
                resize: 'none',
                fontFamily: 'Consolas, monospace',
                lineHeight: '1.4'
              }}
            />
            <div className="text-blue-600 mt-1">End Sub</div>
          </div>
        ) : (
          <div className="text-gray-500">
            <div className="mb-4">Option Explicit</div>
            <div className="mb-2">' General declarations</div>
            <div className="mb-2">' Add global variables and constants here</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;