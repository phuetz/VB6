import React from 'react';
import { useVB6 } from '../../../context/VB6Context';

const PropertiesWindow: React.FC = () => {
  const { state, dispatch, updateControl } = useVB6();
  const activeForm = state.forms.find(f => f.id === state.activeFormId) || state.forms[0];

  const updateControlProperty = (property: string, value: any) => {
    if (state.selectedControls.length === 0 || state.executionMode === 'run') return;
    
    state.selectedControls.forEach(control => {
      updateControl(control.id, property, value);
    });
  };

  const updateFormProperty = (property: string, value: any) => {
    dispatch({
      type: 'UPDATE_FORM_PROPERTY',
      payload: { property, value }
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-blue-600 text-white text-xs font-bold p-1 flex items-center justify-between">
        <span>
          Properties - {
            state.selectedControls.length === 1 ? state.selectedControls[0].name : 
            state.selectedControls.length > 1 ? 'Multiple Selection' : 
            activeForm.name
          }
        </span>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showPropertiesWindow' } })}
          className="hover:bg-blue-700 px-1"
        >
          ×
        </button>
      </div>
      
      <div className="bg-white border border-gray-300 m-1 px-2 py-1 text-xs">
        <select
          className="w-full text-xs"
          value={
            state.selectedControls.length === 1 ? state.selectedControls[0].name : 
            state.selectedControls.length > 1 ? 'Multiple' : 
            activeForm.name
          }
          onChange={(e) => {
            if (e.target.value === activeForm.name) {
              dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: [] } });
            } else if (e.target.value !== 'Multiple') {
              const control = state.controls.find(c => c.name === e.target.value);
              if (control) {
                dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: [control.id] } });
              }
            }
          }}
        >
          <option value={activeForm.name}>{activeForm.name} Form</option>
          {state.selectedControls.length > 1 && (
            <option value="Multiple">Multiple Selection</option>
          )}
          {state.controls.map(control => (
            <option key={control.id} value={control.name}>
              {control.name} {control.type}
            </option>
          ))}
        </select>
      </div>
      
      <div className="bg-gray-200 px-2 py-1 text-xs flex">
        <button className="flex-1 border-r border-gray-400">Alphabetic</button>
        <button className="flex-1">Categorized</button>
      </div>
      
      <div className="flex-1 bg-white m-1 border border-gray-300 overflow-y-auto">
        <table className="w-full text-xs">
          <tbody>
            {state.selectedControls.length === 1 ? (
              // Single control properties
              <>
                <PropertyRow
                  label="(Name)"
                  value={state.selectedControls[0].name}
                  onChange={(value) => updateControlProperty('name', value)}
                  type="text"
                  bold
                />
                {state.selectedControls[0].caption !== undefined && (
                  <PropertyRow
                    label="Caption"
                    value={state.selectedControls[0].caption}
                    onChange={(value) => updateControlProperty('caption', value)}
                    type="text"
                  />
                )}
                <PropertyRow
                  label="Left"
                  value={state.selectedControls[0].x}
                  onChange={(value) => updateControlProperty('x', parseInt(value) || 0)}
                  type="number"
                />
                <PropertyRow
                  label="Top"
                  value={state.selectedControls[0].y}
                  onChange={(value) => updateControlProperty('y', parseInt(value) || 0)}
                  type="number"
                />
                <PropertyRow
                  label="Width"
                  value={state.selectedControls[0].width}
                  onChange={(value) => updateControlProperty('width', parseInt(value) || 0)}
                  type="number"
                />
                <PropertyRow
                  label="Height"
                  value={state.selectedControls[0].height}
                  onChange={(value) => updateControlProperty('height', parseInt(value) || 0)}
                  type="number"
                />
                <PropertyRow
                  label="TabIndex"
                  value={state.selectedControls[0].tabIndex}
                  onChange={(value) => updateControlProperty('tabIndex', parseInt(value) || 0)}
                  type="number"
                />
                <PropertyRow
                  label="TabStop"
                  value={state.selectedControls[0].tabStop.toString()}
                  onChange={(value) => updateControlProperty('tabStop', value === 'true')}
                  type="select"
                  options={[
                    { value: 'true', label: 'True' },
                    { value: 'false', label: 'False' }
                  ]}
                />
                <PropertyRow
                  label="Tag"
                  value={state.selectedControls[0].tag}
                  onChange={(value) => updateControlProperty('tag', value)}
                  type="text"
                />
                <PropertyRow
                  label="ToolTipText"
                  value={state.selectedControls[0].toolTipText}
                  onChange={(value) => updateControlProperty('toolTipText', value)}
                  type="text"
                />
                <PropertyRow
                  label="Enabled"
                  value={state.selectedControls[0].enabled}
                  onChange={(value) => updateControlProperty('enabled', value === 'true')}
                  type="select"
                  options={[
                    { value: 'true', label: 'True' },
                    { value: 'false', label: 'False' }
                  ]}
                />
                <PropertyRow
                  label="Visible"
                  value={state.selectedControls[0].visible}
                  onChange={(value) => updateControlProperty('visible', value === 'true')}
                  type="select"
                  options={[
                    { value: 'true', label: 'True' },
                    { value: 'false', label: 'False' }
                  ]}
                />
              </>
            ) : state.selectedControls.length > 1 ? (
              // Multiple controls properties
              <>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td colSpan={2} className="px-2 py-1 text-center font-bold">
                    {state.selectedControls.length} controls selected
                  </td>
                </tr>
                <PropertyRow
                  label="Enabled"
                  value=""
                  onChange={(value) => updateControlProperty('enabled', value === 'true')}
                  type="select"
                  options={[
                    { value: '', label: '-- Mixed --' },
                    { value: 'true', label: 'True' },
                    { value: 'false', label: 'False' }
                  ]}
                />
              </>
            ) : (
              // Form properties
              <>
                <PropertyRow
                  label="(Name)"
                  value={activeForm.name}
                  onChange={(value) => {
                    dispatch({ type: 'RENAME_FORM', payload: { id: activeForm.id, name: value } });
                  }}
                  type="text"
                  bold
                />
                <PropertyRow
                  label="Caption"
                  value={state.formProperties.Caption}
                  onChange={(value) => updateFormProperty('Caption', value)}
                  type="text"
                />
                <PropertyRow
                  label="BackColor"
                  value={state.formProperties.BackColor}
                  onChange={(value) => updateFormProperty('BackColor', value)}
                  type="color"
                />
                <PropertyRow
                  label="Width"
                  value={state.formProperties.Width}
                  onChange={(value) => updateFormProperty('Width', parseInt(value) || 640)}
                  type="number"
                />
                <PropertyRow
                  label="Height"
                  value={state.formProperties.Height}
                  onChange={(value) => updateFormProperty('Height', parseInt(value) || 480)}
                  type="number"
                />
                <PropertyRow
                  label="StartUpPosition"
                  value={state.formProperties.StartUpPosition}
                  onChange={(value) => updateFormProperty('StartUpPosition', value)}
                  type="select"
                  options={[
                    { value: '0 - Manual', label: '0 - Manual' },
                    { value: '1 - CenterOwner', label: '1 - CenterOwner' },
                    { value: '2 - CenterScreen', label: '2 - CenterScreen' }
                  ]}
                />
                <PropertyRow
                  label="BorderStyle"
                  value={state.formProperties.BorderStyle}
                  onChange={(value) => updateFormProperty('BorderStyle', value)}
                  type="select"
                  options={[
                    { value: '0 - None', label: '0 - None' },
                    { value: '1 - Fixed Single', label: '1 - Fixed Single' },
                    { value: '2 - Sizable', label: '2 - Sizable' }
                  ]}
                />
                <PropertyRow
                  label="MaxButton"
                  value={state.formProperties.MaxButton.toString()}
                  onChange={(value) => updateFormProperty('MaxButton', value === 'true')}
                  type="select"
                  options={[{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }]}
                />
                <PropertyRow
                  label="MinButton"
                  value={state.formProperties.MinButton.toString()}
                  onChange={(value) => updateFormProperty('MinButton', value === 'true')}
                  type="select"
                  options={[{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }]}
                />
                <PropertyRow
                  label="ControlBox"
                  value={state.formProperties.ControlBox.toString()}
                  onChange={(value) => updateFormProperty('ControlBox', value === 'true')}
                  type="select"
                  options={[{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }]}
                />
                <PropertyRow
                  label="ShowInTaskbar"
                  value={state.formProperties.ShowInTaskbar.toString()}
                  onChange={(value) => updateFormProperty('ShowInTaskbar', value === 'true')}
                  type="select"
                  options={[{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }]}
                />
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface PropertyRowProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type: 'text' | 'number' | 'color' | 'select';
  options?: { value: string; label: string }[];
  bold?: boolean;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ 
  label, 
  value, 
  onChange, 
  type, 
  options, 
  bold 
}) => {
  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-1 border border-gray-300"
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'color':
        return (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-5 border border-gray-300"
          />
        );
      default:
        return (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-1 border border-gray-300"
          />
        );
    }
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-100">
      <td className={`px-2 py-1 w-1/2 ${bold ? 'font-bold' : ''}`}>
        {label}
      </td>
      <td className="px-2 py-1">
        {renderInput()}
      </td>
    </tr>
  );
};

export default PropertiesWindow;