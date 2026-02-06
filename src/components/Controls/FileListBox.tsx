import React, { useState, useEffect, useCallback } from 'react';
import { Control } from '../../context/types';

interface FileListBoxProps {
  control: Control;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
}

interface FileItem {
  name: string;
  size: number;
  modified: Date;
  attributes: string; // 'R' = ReadOnly, 'H' = Hidden, 'S' = System, 'A' = Archive
}

export const FileListBox: React.FC<FileListBoxProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
}) => {
  // VB6 FileListBox properties
  const {
    x = 0,
    y = 0,
    width = 145,
    height = 135,
    path = 'C:\\',
    pattern = '*.*',
    fileName = '',
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font = { name: 'MS Sans Serif', size: 8 },
    enabled = true,
    visible = true,
    multiSelect = 0, // 0=None, 1=Simple, 2=Extended
    archive = true,
    hidden = false,
    normal = true,
    readOnly = true,
    system = false,
    toolTipText = '',
    tag = '',
    index,
  } = control;

  const [selectedFile, setSelectedFile] = useState(fileName);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<FileItem[]>([]);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Simulate file listing in browser environment
  useEffect(() => {
    // Mock files based on current path
    const mockFiles: FileItem[] = [
      { name: 'document.txt', size: 1024, modified: new Date('2024-01-15'), attributes: 'A' },
      { name: 'image.jpg', size: 245760, modified: new Date('2024-01-20'), attributes: 'A' },
      { name: 'data.xlsx', size: 32768, modified: new Date('2024-01-25'), attributes: 'A' },
      { name: 'readme.txt', size: 2048, modified: new Date('2024-01-10'), attributes: 'R' },
      { name: 'config.ini', size: 512, modified: new Date('2024-01-05'), attributes: 'H' },
      { name: 'program.exe', size: 1048576, modified: new Date('2024-01-01'), attributes: 'A' },
      { name: 'backup.zip', size: 5242880, modified: new Date('2024-01-30'), attributes: 'A' },
    ];

    // Filter files based on pattern
    const filteredFiles = mockFiles.filter(file => {
      // Check attributes
      const attrs = file.attributes;
      if (!archive && attrs.includes('A')) return false;
      if (!hidden && attrs.includes('H')) return false;
      if (!system && attrs.includes('S')) return false;
      if (!readOnly && attrs.includes('R')) return false;
      if (!normal && !attrs) return false;

      // Check pattern
      if (pattern === '*.*') return true;

      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
      return regex.test(file.name);
    });

    setFiles(filteredFiles);
  }, [path, pattern, archive, hidden, normal, readOnly, system]);

  const handleFileClick = useCallback(
    (file: FileItem, e: React.MouseEvent) => {
      if (!enabled) return;

      const currentTime = Date.now();
      const isDoubleClick = currentTime - lastClickTime < 300;
      setLastClickTime(currentTime);

      if (multiSelect === 0) {
        // No multi-select
        setSelectedFile(file.name);
        setSelectedFiles(new Set([file.name]));
        onPropertyChange?.('fileName', file.name);
      } else if (multiSelect === 1) {
        // Simple multi-select (click to toggle)
        const newSelection = new Set(selectedFiles);
        if (newSelection.has(file.name)) {
          newSelection.delete(file.name);
        } else {
          newSelection.add(file.name);
        }
        setSelectedFiles(newSelection);
        setSelectedFile(file.name);
      } else if (multiSelect === 2) {
        // Extended multi-select (Ctrl/Shift support)
        if (e.ctrlKey) {
          const newSelection = new Set(selectedFiles);
          if (newSelection.has(file.name)) {
            newSelection.delete(file.name);
          } else {
            newSelection.add(file.name);
          }
          setSelectedFiles(newSelection);
        } else if (e.shiftKey && selectedFile) {
          // Select range
          const startIndex = files.findIndex(f => f.name === selectedFile);
          const endIndex = files.findIndex(f => f.name === file.name);
          const newSelection = new Set<string>();
          for (let i = Math.min(startIndex, endIndex); i <= Math.max(startIndex, endIndex); i++) {
            newSelection.add(files[i].name);
          }
          setSelectedFiles(newSelection);
        } else {
          setSelectedFiles(new Set([file.name]));
        }
        setSelectedFile(file.name);
      }

      // Fire VB6 events
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'Click');

        if (isDoubleClick) {
          window.VB6Runtime.fireEvent(control.name, 'DblClick');
        }
      }
    },
    [
      control.name,
      enabled,
      files,
      lastClickTime,
      multiSelect,
      onPropertyChange,
      selectedFile,
      selectedFiles,
    ]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
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
    userSelect: 'none',
  };

  return (
    <>
      <div
        style={containerStyle}
        title={toolTipText}
        data-control-type="FileListBox"
        data-control-name={control.name}
        data-control-index={index}
      >
        {files.map(file => {
          const isSelected =
            multiSelect === 0 ? selectedFile === file.name : selectedFiles.has(file.name);

          return (
            <div
              key={file.name}
              onClick={e => handleFileClick(file, e)}
              style={{
                padding: '2px 4px',
                backgroundColor: isSelected ? '#0A246A' : 'transparent',
                color: isSelected ? '#FFFFFF' : foreColor,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {file.name}
            </div>
          );
        })}
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

// VB6 FileListBox events
export const FileListBoxEvents = {
  Click: 'Click',
  DblClick: 'DblClick',
  PathChange: 'PathChange',
  PatternChange: 'PatternChange',
  GotFocus: 'GotFocus',
  LostFocus: 'LostFocus',
  KeyDown: 'KeyDown',
  KeyPress: 'KeyPress',
  KeyUp: 'KeyUp',
  MouseDown: 'MouseDown',
  MouseMove: 'MouseMove',
  MouseUp: 'MouseUp',
};

// VB6 FileListBox default properties
export const getFileListBoxDefaults = (id: number) => ({
  id,
  type: 'FileListBox',
  name: `File${id}`,
  x: 100,
  y: 100,
  width: 145,
  height: 135,
  path: 'C:\\',
  pattern: '*.*',
  fileName: '',
  backColor: '#FFFFFF',
  foreColor: '#000000',
  font: { name: 'MS Sans Serif', size: 8, bold: false, italic: false, underline: false },
  enabled: true,
  visible: true,
  multiSelect: 0,
  archive: true,
  hidden: false,
  normal: true,
  readOnly: true,
  system: false,
  toolTipText: '',
  tag: '',
  tabIndex: id,
  tabStop: true,
});

export default FileListBox;
