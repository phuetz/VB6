import React, { useState } from 'react';
import VB6PropertiesWindow from './VB6PropertiesWindow';
import { sampleTextBox, sampleCommandButton, sampleFormProperties } from './PropertyTestData';

/**
 * Demo component to test the VB6 Properties Window
 * Shows how the property editor works with different control types
 */
const PropertyDemo: React.FC = () => {
  const [selectedControl, setSelectedControl] = useState<'form' | 'textbox' | 'button'>('form');
  const [mockStore, setMockStore] = useState({
    selectedControls: [],
    formProperties: sampleFormProperties,
  });

  // Simulate store updates
  const updateMockStore = (controlType: 'form' | 'textbox' | 'button') => {
    switch (controlType) {
      case 'form':
        setMockStore({
          selectedControls: [],
          formProperties: sampleFormProperties,
        });
        break;
      case 'textbox':
        setMockStore({
          selectedControls: [sampleTextBox],
          formProperties: sampleFormProperties,
        });
        break;
      case 'button':
        setMockStore({
          selectedControls: [sampleCommandButton],
          formProperties: sampleFormProperties,
        });
        break;
    }
    setSelectedControl(controlType);
  };

  return (
    <div className="h-screen flex">
      {/* Demo Controls */}
      <div className="w-64 bg-gray-100 border-r border-gray-400 p-4">
        <h3 className="font-bold text-sm mb-4">Property Editor Demo</h3>

        <div className="space-y-2">
          <button
            onClick={() => updateMockStore('form')}
            className={`w-full p-2 text-left text-sm border ${
              selectedControl === 'form'
                ? 'bg-blue-100 border-blue-400'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
          >
            📋 Form Properties
          </button>

          <button
            onClick={() => updateMockStore('textbox')}
            className={`w-full p-2 text-left text-sm border ${
              selectedControl === 'textbox'
                ? 'bg-blue-100 border-blue-400'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
          >
            📝 TextBox Properties
          </button>

          <button
            onClick={() => updateMockStore('button')}
            className={`w-full p-2 text-left text-sm border ${
              selectedControl === 'button'
                ? 'bg-blue-100 border-blue-400'
                : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}
          >
            🔘 CommandButton Properties
          </button>
        </div>

        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div className="font-bold mb-1">Features Demonstrated:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Categorized property view</li>
            <li>Property type icons</li>
            <li>Color picker dialog</li>
            <li>Font editor dialog</li>
            <li>Enum dropdowns</li>
            <li>Boolean toggles</li>
            <li>Number validation</li>
            <li>String editing</li>
            <li>Property descriptions</li>
            <li>VB6 authentic styling</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-bold mb-1">VB6 Compatibility:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Exact property names</li>
            <li>VB6 color formats (&H)</li>
            <li>Enum value formats</li>
            <li>Property categories</li>
            <li>Visual appearance</li>
            <li>Behavior patterns</li>
          </ul>
        </div>
      </div>

      {/* Properties Window */}
      <div className="flex-1">
        <VB6PropertiesWindow />
      </div>
    </div>
  );
};

export default PropertyDemo;
