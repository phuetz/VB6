import React, { useState, useCallback, useMemo } from 'react';
import { useVB6Store } from '../../../stores/vb6Store';
import { Control } from '../../../context/types';
import { 
  Type, 
  Grid,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import PropertyGrid from './PropertyGrid';
import PropertyManager from './PropertyManager';
import './VB6PropertiesWindow.css';

const VB6PropertiesWindow: React.FC = () => {
  const { selectedControls, updateControl, formProperties, updateFormProperty } = useVB6Store();
  const [viewMode, setViewMode] = useState<'categorized' | 'alphabetic'>('categorized');
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showValidation, setShowValidation] = useState(true);
  const [showIcons, setShowIcons] = useState(true);
  const [selectedObject, setSelectedObject] = useState<string>('');

  // Determine current object and its properties
  const currentObject = useMemo(() => {
    if (selectedControls.length === 1) {
      return selectedControls[0];
    } else if (selectedControls.length === 0) {
      return { ...formProperties, Name: 'Form1', type: 'Form' };
    } else {
      // Multiple selection - show common properties only
      return null;
    }
  }, [selectedControls, formProperties]);

  // Get properties for current object type
  const availableProperties = useMemo(() => {
    if (!currentObject) return [];
    
    const objectType = currentObject.type || 'Form';
    return PropertyManager.getControlProperties(objectType);
  }, [currentObject]);

  // Get current property values
  const propertyValues = useMemo(() => {
    if (!currentObject) return {};
    
    const values: Record<string, any> = {};
    availableProperties.forEach(propDef => {
      if (currentObject.properties && propDef.name in currentObject.properties) {
        values[propDef.name] = currentObject.properties[propDef.name];
      } else if (propDef.name in currentObject) {
        values[propDef.name] = currentObject[propDef.name as keyof typeof currentObject];
      } else {
        values[propDef.name] = propDef.defaultValue;
      }
    });
    
    return values;
  }, [currentObject, availableProperties]);

  // Handle property changes
  const handlePropertyChange = useCallback((propertyName: string, value: any) => {
    if (selectedControls.length === 1) {
      // Single control selected
      updateControl(selectedControls[0].id, propertyName, value);
    } else if (selectedControls.length === 0) {
      // Form selected
      updateFormProperty(propertyName, value);
    }
    // Multiple selection handled by PropertyGrid internally
  }, [selectedControls, updateControl, updateFormProperty]);

  // Handle validation errors
  const handleValidationError = useCallback((propertyName: string, error: string) => {
    console.warn(`Validation error for ${propertyName}: ${error}`);
    // Could show toast notification or status bar message
  }, []);

  // Object selection options
  const objectOptions = useMemo(() => {
    const options = [
      { 
        value: 'form', 
        label: formProperties.Name || 'Form1',
        type: 'Form'
      }
    ];

    // Add all controls
    selectedControls.forEach(control => {
      options.push({
        value: control.id.toString(),
        label: control.name,
        type: control.type
      });
    });

    return options;
  }, [selectedControls, formProperties]);

  // Get display name for current object
  const objectDisplayName = useMemo(() => {
    if (selectedControls.length === 1) {
      return selectedControls[0].name;
    } else if (selectedControls.length === 0) {
      return formProperties.Name || 'Form1';
    } else {
      return `${selectedControls.length} objects selected`;
    }
  }, [selectedControls, formProperties]);

  // Refresh properties (useful for debugging)
  const refreshProperties = useCallback(() => {
    // Force re-render by updating a dummy state
    setSelectedObject(prev => prev + '_refresh');
  }, []);

  return (
    <div className="vb6-properties">
      {/* Title Bar */}
      <div className="vb6-properties-titlebar">
        Properties
      </div>

      {/* Object Selection */}
      <div className="vb6-object-selector">
        <div className="flex items-center">
          <select className="vb6-object-combo flex-1">
            <option value="">{objectDisplayName}</option>
            {objectOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.type})
              </option>
            ))}
          </select>
          <button 
            onClick={refreshProperties}
            className="ml-1 vb6-toolbar-button"
            title="Refresh Properties"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="vb6-properties-toolbar">
        <button 
          onClick={() => setViewMode('categorized')}
          className={`vb6-toolbar-button ${viewMode === 'categorized' ? 'pressed' : ''}`}
          title="Categorized View"
        >
          <Grid size={12} />
        </button>
        <button 
          onClick={() => setViewMode('alphabetic')}
          className={`vb6-toolbar-button ${viewMode === 'alphabetic' ? 'pressed' : ''}`}
          title="Alphabetic View"
        >
          <Type size={12} />
        </button>
        
        <div className="flex-1" />
        
        <button 
          onClick={() => setShowIcons(!showIcons)}
          className={`vb6-toolbar-button ${showIcons ? 'pressed' : ''}`}
          title="Show Property Icons"
        >
          <Settings size={12} />
        </button>
        <button 
          onClick={() => setShowValidation(!showValidation)}
          className={`vb6-toolbar-button ${showValidation ? 'pressed' : ''}`}
          title="Show Validation"
        >
          {showValidation ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        <button 
          onClick={() => setShowDescriptions(!showDescriptions)}
          className={`vb6-toolbar-button ${showDescriptions ? 'pressed' : ''}`}
          title="Show Descriptions"
        >
          {showDescriptions ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
      </div>

      {/* Property Grid */}
      <div className="flex-1 overflow-hidden">
        {currentObject ? (
          <PropertyGrid
            properties={availableProperties}
            values={propertyValues}
            onChange={handlePropertyChange}
            onValidationError={handleValidationError}
            showCategories={viewMode === 'categorized'}
            showDescriptions={showDescriptions}
            showIcons={showIcons}
            showValidation={showValidation}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
            <div className="text-center">
              <Settings size={32} className="mx-auto mb-2 opacity-50" />
              <div>Multiple objects selected</div>
              <div className="mt-1">Common properties will be shown</div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-400 bg-gray-100 px-2 py-1 text-xs text-gray-600">
        {currentObject ? (
          <div className="flex justify-between">
            <span>
              {availableProperties.length} properties | {Object.keys(propertyValues).length} values
            </span>
            <span>
              {currentObject.type || 'Form'} object
            </span>
          </div>
        ) : (
          <span>Multiple selection</span>
        )}
      </div>
    </div>
  );
};

export default VB6PropertiesWindow;