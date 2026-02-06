import React, { useState, useEffect, useCallback } from 'react';
import { Control } from '../../context/types';

interface DirListBoxProps {
  control: Control;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
}

interface DirectoryItem {
  name: string;
  path: string;
  hasChildren: boolean;
  level: number;
}

export const DirListBox: React.FC<DirListBoxProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
}) => {
  // VB6 DirListBox properties
  const {
    x = 0,
    y = 0,
    width = 145,
    height = 135,
    path = 'C:\\',
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font = { name: 'MS Sans Serif', size: 8 },
    enabled = true,
    visible = true,
    toolTipText = '',
    tag = '',
    index,
  } = control;

  const [selectedPath, setSelectedPath] = useState(path);
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  // Simulate directory structure in browser environment
  useEffect(() => {
    // Mock directory structure
    const mockDirs: DirectoryItem[] = [
      { name: 'C:\\', path: 'C:\\', hasChildren: true, level: 0 },
      { name: 'Program Files', path: 'C:\\Program Files', hasChildren: true, level: 1 },
      {
        name: 'Common Files',
        path: 'C:\\Program Files\\Common Files',
        hasChildren: false,
        level: 2,
      },
      { name: 'Windows', path: 'C:\\Windows', hasChildren: true, level: 1 },
      { name: 'System32', path: 'C:\\Windows\\System32', hasChildren: false, level: 2 },
      { name: 'Users', path: 'C:\\Users', hasChildren: true, level: 1 },
      { name: 'Public', path: 'C:\\Users\\Public', hasChildren: false, level: 2 },
      { name: 'Documents', path: 'C:\\Documents', hasChildren: false, level: 1 },
    ];

    setDirectories(mockDirs);
    setExpandedDirs(new Set(['C:\\']));
  }, []);

  const handleDirectoryClick = useCallback(
    (dir: DirectoryItem) => {
      if (!enabled) return;

      setSelectedPath(dir.path);
      onPropertyChange?.('path', dir.path);

      // Toggle expansion for directories with children
      if (dir.hasChildren) {
        const newExpanded = new Set(expandedDirs);
        if (newExpanded.has(dir.path)) {
          newExpanded.delete(dir.path);
        } else {
          newExpanded.add(dir.path);
        }
        setExpandedDirs(newExpanded);
      }

      // Fire VB6 Change event
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'Change');
        window.VB6Runtime.fireEvent(control.name, 'PathChange');
      }
    },
    [control.name, enabled, expandedDirs, onPropertyChange]
  );

  const renderDirectory = (dir: DirectoryItem) => {
    const isExpanded = expandedDirs.has(dir.path);
    const isSelected = selectedPath === dir.path;

    return (
      <div
        key={dir.path}
        onClick={() => handleDirectoryClick(dir)}
        style={{
          paddingLeft: `${dir.level * 16 + 4}px`,
          paddingTop: '2px',
          paddingBottom: '2px',
          backgroundColor: isSelected ? '#0A246A' : 'transparent',
          color: isSelected ? '#FFFFFF' : foreColor,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {dir.hasChildren && <span style={{ marginRight: '4px' }}>{isExpanded ? '📂' : '📁'}</span>}
        {dir.name}
      </div>
    );
  };

  if (!visible) return null;

  const containerStyle: React.CSSProperties = {
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
    overflowY: 'auto',
    overflowX: 'hidden',
    opacity: enabled ? 1 : 0.5,
    pointerEvents: enabled ? 'auto' : 'none',
  };

  // Filter directories based on expansion state
  const visibleDirs = directories.filter(dir => {
    if (dir.level === 0) return true;

    // Check if parent is expanded
    const parentPath = dir.path.substring(0, dir.path.lastIndexOf('\\'));
    return expandedDirs.has(parentPath);
  });

  return (
    <>
      <div
        style={containerStyle}
        title={toolTipText}
        data-control-type="DirListBox"
        data-control-name={control.name}
        data-control-index={index}
      >
        {visibleDirs.map(dir => renderDirectory(dir))}
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

// VB6 DirListBox events
export const DirListBoxEvents = {
  Change: 'Change',
  Click: 'Click',
  DblClick: 'DblClick',
  GotFocus: 'GotFocus',
  LostFocus: 'LostFocus',
  KeyDown: 'KeyDown',
  KeyPress: 'KeyPress',
  KeyUp: 'KeyUp',
  MouseDown: 'MouseDown',
  MouseMove: 'MouseMove',
  MouseUp: 'MouseUp',
  PathChange: 'PathChange',
};

// VB6 DirListBox default properties
export const getDirListBoxDefaults = (id: number) => ({
  id,
  type: 'DirListBox',
  name: `Dir${id}`,
  x: 100,
  y: 100,
  width: 145,
  height: 135,
  path: 'C:\\',
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

// Declare global VB6Runtime interface
declare global {
  interface Window {
    VB6Runtime?: {
      fireEvent: (controlName: string, eventName: string, eventData?: any) => void;
    };
  }
}

export default DirListBox;
