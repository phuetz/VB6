import React from 'react';
import { Control } from '../../context/types';

interface PropertyPanelProps {
  control: Control;
  onPropertyChange: (property: string, value: any) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  control,
  onPropertyChange
}) => {
  const renderInput = (property: string, value: any) => {
    if (typeof value === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={e =>
            onPropertyChange(property, parseFloat(e.target.value) || 0)
          }
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      );
    }
    if (typeof value === 'boolean') {
      return (
        <input
          type="checkbox"
          checked={value}
          onChange={e => onPropertyChange(property, e.target.checked)}
          className="mr-2"
        />
      );
    }
    if (typeof value === 'string') {
      return (
        <input
          type="text"
          value={value}
          onChange={e => onPropertyChange(property, e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      );
    }
    if (typeof value === 'object' && value !== null && property === 'font') {
      return (
        <div className="space-y-1">
          {Object.keys(value).map(key => (
            <div key={key} className="flex items-center gap-1 text-xs">
              <span className="w-16 capitalize">{key}</span>
              {renderInput(`${property}.${key}`, value[key])}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const properties = Object.keys(control).filter(
    p => !['id', 'type'].includes(p)
  );

  return (
    <div className="bg-white border border-gray-400 rounded p-3 space-y-2 overflow-auto" style={{ maxHeight: '100%' }}>
      {properties.map(prop => (
        <div key={prop} className="text-xs flex flex-col gap-1 mb-1">
          <label className="font-medium capitalize">{prop}</label>
          {renderInput(prop, (control as any)[prop])}
        </div>
      ))}
    </div>
  );
};