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
  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0;
    onPropertyChange(axis, Math.max(0, numValue));
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 0;
    onPropertyChange(dimension, Math.max(1, numValue));
  };

  return (
    <div className="bg-white border border-gray-400 rounded p-3 space-y-3">
      <h3 className="font-bold text-sm border-b border-gray-300 pb-1">
        Position & Size
      </h3>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Left (X)
          </label>
          <input
            type="number"
            value={control.x}
            onChange={(e) => handlePositionChange('x', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            min="0"
            step="1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Top (Y)
          </label>
          <input
            type="number"
            value={control.y}
            onChange={(e) => handlePositionChange('y', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            min="0"
            step="1"
          />
        </div>
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Width
          </label>
          <input
            type="number"
            value={control.width}
            onChange={(e) => handleSizeChange('width', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            min="1"
            step="1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Height
          </label>
          <input
            type="number"
            value={control.height}
            onChange={(e) => handleSizeChange('height', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            min="1"
            step="1"
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-300">
        <button
          onClick={() => {
            onPropertyChange('x', 0);
            onPropertyChange('y', 0);
          }}
          className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
        >
          Reset Position
        </button>
        <button
          onClick={() => {
            onPropertyChange('width', 100);
            onPropertyChange('height', 30);
          }}
          className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
        >
          Reset Size
        </button>
      </div>

      {/* Constraints */}
      <div className="space-y-2">
        <label className="flex items-center text-xs">
          <input
            type="checkbox"
            checked={control.locked || false}
            onChange={(e) => onPropertyChange('locked', e.target.checked)}
            className="mr-2"
          />
          Lock position and size
        </label>
      </div>
    </div>
  );
};