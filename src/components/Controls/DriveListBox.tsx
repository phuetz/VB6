import React, { useState, useEffect, useCallback } from 'react';
import { Control } from '../../context/types';

interface DriveListBoxProps {
  control: Control;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
}

export const DriveListBox: React.FC<DriveListBoxProps> = ({ 
  control, 
  isDesignMode = false,
  onPropertyChange 
}) => {
  // VB6 DriveListBox properties
  const {
    x = 0,
    y = 0,
    width = 145,
    height = 21,
    drive = 'C:',
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font = { name: 'MS Sans Serif', size: 8 },
    enabled = true,
    visible = true,
    toolTipText = '',
    tag = '',
    index,
  } = control;

  const [selectedDrive, setSelectedDrive] = useState(drive);
  const [availableDrives, setAvailableDrives] = useState<string[]>([]);

  // Simulate available drives in browser environment
  useEffect(() => {
    // In a real VB6 environment, this would query actual system drives
    // For web simulation, we'll provide mock drives
    const mockDrives = ['C:', 'D:', 'E:', 'F:'];
    setAvailableDrives(mockDrives);
    
    // Add some realistic drive labels
    const driveLabels: { [key: string]: string } = {
      'C:': 'System (C:)',
      'D:': 'Data (D:)',
      'E:': 'Backup (E:)',
      'F:': 'USB Drive (F:)'
    };
  }, []);

  const handleDriveChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDrive = e.target.value;
    setSelectedDrive(newDrive);
    onPropertyChange?.('drive', newDrive);
    
    // Fire VB6 Change event
    if (window.VB6Runtime?.fireEvent) {
      window.VB6Runtime.fireEvent(control.name, 'Change');
    }
  }, [control.name, onPropertyChange]);

  if (!visible) return null;

  const selectStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: width,
    height: height,
    backgroundColor: backColor,
    color: foreColor,
    fontFamily: font.name,
    fontSize: `${font.size}pt`,
    fontWeight: font.bold ? 'bold' : 'normal',
    fontStyle: font.italic ? 'italic' : 'normal',
    textDecoration: font.underline ? 'underline' : 'none',
    border: '2px inset #FFFFFF',
    opacity: enabled ? 1 : 0.5,
    cursor: enabled ? 'pointer' : 'default',
    pointerEvents: enabled ? 'auto' : 'none',
  };

  return (
    <>
      <select
        style={selectStyle}
        value={selectedDrive}
        onChange={handleDriveChange}
        disabled={!enabled || isDesignMode}
        title={toolTipText}
        data-control-type="DriveListBox"
        data-control-name={control.name}
        data-control-index={index}
      >
        {availableDrives.map(drv => (
          <option key={drv} value={drv}>
            {drv} [{drv === 'C:' ? 'System' : drv === 'D:' ? 'Data' : 'Local Disk'}]
          </option>
        ))}
      </select>
      
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

// VB6 DriveListBox events
export const DriveListBoxEvents = {
  Change: 'Change',
  GotFocus: 'GotFocus',
  LostFocus: 'LostFocus',
  KeyDown: 'KeyDown',
  KeyPress: 'KeyPress',
  KeyUp: 'KeyUp',
  MouseDown: 'MouseDown',
  MouseMove: 'MouseMove',
  MouseUp: 'MouseUp',
};

// VB6 DriveListBox default properties
export const getDriveListBoxDefaults = (id: number) => ({
  id,
  type: 'DriveListBox',
  name: `Drive${id}`,
  x: 100,
  y: 100,
  width: 145,
  height: 21,
  drive: 'C:',
  backColor: '#FFFFFF',
  foreColor: '#000000',
  font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
  enabled: true,
  visible: true,
  toolTipText: '',
  tag: '',
  tabIndex: id,
  tabStop: true,
});

export default DriveListBox;