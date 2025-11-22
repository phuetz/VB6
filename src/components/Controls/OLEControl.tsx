import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Control } from '../../context/types';

interface OLEControlProps {
  control: Control;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
}

export const OLEControl: React.FC<OLEControlProps> = ({ 
  control, 
  isDesignMode = false,
  onPropertyChange 
}) => {
  // VB6 OLE control properties
  const {
    x = 0,
    y = 0,
    width = 193,
    height = 121,
    class: oleClass = '',
    sourceDoc = '',
    sourceItem = '',
    displayType = 0, // 0=Content, 1=Icon
    autoActivate = 0, // 0=Manual, 1=GetFocus, 2=DoubleClick, 3=Automatic
    autoVerbMenu = true,
    updateOptions = 0, // 0=Automatic, 1=Frozen, 2=Manual
    sizeMode = 0, // 0=Clip, 1=Stretch, 2=AutoSize, 3=Zoom
    oleType = 0, // 0=Linked, 1=Embedded, 2=None
    oleTypeAllowed = 2, // 0=Linked, 1=Embedded, 2=Either
    backColor = '#C0C0C0',
    backStyle = 1, // 0=Transparent, 1=Opaque
    borderStyle = 1, // 0=None, 1=Fixed Single
    enabled = true,
    visible = true,
    toolTipText = '',
    tag = '',
    index,
  } = control;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [objectData, setObjectData] = useState<any>(null);
  const [objectType, setObjectType] = useState('');

  // Simulate OLE object types
  const oleObjects = {
    'Excel.Sheet': { icon: '📊', name: 'Microsoft Excel Worksheet' },
    'Word.Document': { icon: '📄', name: 'Microsoft Word Document' },
    'PowerPoint.Slide': { icon: '📊', name: 'Microsoft PowerPoint Slide' },
    'Paint.Picture': { icon: '🎨', name: 'Bitmap Image' },
    'Package': { icon: '📦', name: 'Package' },
  };

  // Initialize OLE object
  useEffect(() => {
    if (oleClass && !isDesignMode) {
      console.log(`OLE: Creating object of class ${oleClass}`);
      setObjectType(oleClass);
      
      // Simulate object creation
      if (oleType === 0 && sourceDoc) {
        // Linked object
        setObjectData({ type: 'linked', source: sourceDoc, item: sourceItem });
      } else if (oleType === 1) {
        // Embedded object
        setObjectData({ type: 'embedded', class: oleClass });
      }
      
      // Fire VB6 events
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'ObjectMove');
      }
    }
  }, [control.name, isDesignMode, oleClass, oleType, sourceDoc, sourceItem]);

  // Handle activation
  const handleActivation = useCallback(() => {
    if (!enabled || isDesignMode) return;
    
    setIsActivated(true);
    onPropertyChange?.('activated', true);
    
    // Fire VB6 events
    if (window.VB6Runtime?.fireEvent) {
      window.VB6Runtime.fireEvent(control.name, 'GotFocus');
      window.VB6Runtime.fireEvent(control.name, 'Updated');
    }
    
    // Simulate in-place activation
    console.log(`OLE: Activating ${objectType || 'object'}`);
  }, [control.name, enabled, isDesignMode, objectType, onPropertyChange]);

  // Handle different activation modes
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (autoActivate === 1 || autoActivate === 3) {
      // GetFocus or Automatic
      handleActivation();
    }
    
    if (window.VB6Runtime?.fireEvent) {
      window.VB6Runtime.fireEvent(control.name, 'Click');
    }
  }, [autoActivate, control.name, handleActivation]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (autoActivate === 2 || autoActivate === 3) {
      // DoubleClick or Automatic
      handleActivation();
    }
    
    if (window.VB6Runtime?.fireEvent) {
      window.VB6Runtime.fireEvent(control.name, 'DblClick');
    }
  }, [autoActivate, control.name, handleActivation]);

  // Handle context menu for OLE verbs
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!autoVerbMenu || isDesignMode) return;
    
    e.preventDefault();
    console.log('OLE: Showing verb menu');
    
    // In a real implementation, this would show OLE verbs like Edit, Open, etc.
  }, [autoVerbMenu, isDesignMode]);

  if (!visible) return null;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: width,
    height: height,
    backgroundColor: backStyle === 1 ? backColor : 'transparent',
    border: borderStyle === 1 ? '1px solid #000000' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    opacity: enabled ? 1 : 0.5,
    cursor: enabled ? 'pointer' : 'not-allowed',
    userSelect: 'none',
  };

  const contentStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '8px',
  };

  // Render content based on display type and state
  const renderContent = () => {
    if (isActivated) {
      // Show activated state
      return (
        <div style={contentStyle}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>✏️</div>
          <div style={{ fontSize: '12px', color: '#333' }}>
            {objectType || 'OLE Object'} - Active
          </div>
        </div>
      );
    }
    
    if (displayType === 1 || !objectData) {
      // Icon display or no object
      const oleInfo = oleObjects[objectType as keyof typeof oleObjects];
      return (
        <div style={contentStyle}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>
            {oleInfo?.icon || '📄'}
          </div>
          <div style={{ fontSize: '12px', color: '#333' }}>
            {oleInfo?.name || objectType || 'Insert Object'}
          </div>
          {oleType === 0 && sourceDoc && (
            <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
              Linked: {sourceDoc}
            </div>
          )}
        </div>
      );
    } else {
      // Content display (simulated)
      return (
        <div style={contentStyle}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#FFFFFF',
            border: '1px solid #E0E0E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#666',
          }}>
            {objectType} Content
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        style={containerStyle}
        title={toolTipText || `OLE: ${objectType || 'Empty'}`}
        data-control-type="OLE"
        data-control-name={control.name}
        data-control-index={index}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onBlur={() => setIsActivated(false)}
        tabIndex={enabled ? 0 : -1}
      >
        {renderContent()}
      </div>
      
      {/* Design mode indicator */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            left: x - 1,
            top: y - 1,
            width: width + 2,
            height: height + 2,
            border: '1px dashed #0066cc',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

// VB6 OLE control events
export const OLEControlEvents = {
  Click: 'Click',
  DblClick: 'DblClick',
  GotFocus: 'GotFocus',
  LostFocus: 'LostFocus',
  MouseDown: 'MouseDown',
  MouseMove: 'MouseMove',
  MouseUp: 'MouseUp',
  KeyDown: 'KeyDown',
  KeyPress: 'KeyPress',
  KeyUp: 'KeyUp',
  ObjectMove: 'ObjectMove',
  Resize: 'Resize',
  Updated: 'Updated',
};

// VB6 OLE control methods
export const OLEControlMethods = {
  CreateEmbed: 'CreateEmbed',
  CreateLink: 'CreateLink',
  Delete: 'Delete',
  DoVerb: 'DoVerb',
  FetchVerbs: 'FetchVerbs',
  InsertObjDlg: 'InsertObjDlg',
  PasteSpecialDlg: 'PasteSpecialDlg',
  ReadFromFile: 'ReadFromFile',
  SaveToFile: 'SaveToFile',
  SaveToOle1File: 'SaveToOle1File',
  Update: 'Update',
};

// VB6 OLE constants
export const OLEConstants = {
  // OLE Type
  vbOLELinked: 0,
  vbOLEEmbedded: 1,
  vbOLENone: 3,
  
  // Auto Activate
  vbOLEActivateManual: 0,
  vbOLEActivateGetFocus: 1,
  vbOLEActivateDoubleclick: 2,
  vbOLEActivateAuto: 3,
  
  // Display Type
  vbOLEDisplayContent: 0,
  vbOLEDisplayIcon: 1,
  
  // Size Mode
  vbOLESizeClip: 0,
  vbOLESizeStretch: 1,
  vbOLESizeAutoSize: 2,
  vbOLESizeZoom: 3,
  
  // Update Options
  vbOLEAutomatic: 0,
  vbOLEFrozen: 1,
  vbOLEManual: 2,
};

// VB6 OLE control default properties
export const getOLEControlDefaults = (id: number) => ({
  id,
  type: 'OLE',
  name: `OLE${id}`,
  x: 100,
  y: 100,
  width: 193,
  height: 121,
  class: '',
  sourceDoc: '',
  sourceItem: '',
  displayType: 0,
  autoActivate: 0,
  autoVerbMenu: true,
  updateOptions: 0,
  sizeMode: 0,
  oleType: 2,
  oleTypeAllowed: 2,
  backColor: '#C0C0C0',
  backStyle: 1,
  borderStyle: 1,
  enabled: true,
  visible: true,
  toolTipText: '',
  tag: '',
  tabIndex: id,
});

export default OLEControl;