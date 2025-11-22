import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Toolbar Designer Types
export enum ButtonStyle {
  Default = 'Default',
  Check = 'Check',
  ButtonGroup = 'ButtonGroup',
  Separator = 'Separator',
  Placeholder = 'Placeholder',
  DropDown = 'DropDown'
}

export enum ButtonState {
  Unpressed = 'Unpressed',
  Pressed = 'Pressed',
  Enabled = 'Enabled',
  Disabled = 'Disabled',
  Hidden = 'Hidden',
  Indeterminate = 'Indeterminate'
}

export enum ImageListType {
  Normal = 'Normal',
  Hot = 'Hot',
  Disabled = 'Disabled'
}

export interface ToolbarButton {
  id: string;
  key: string;
  index: number;
  caption: string;
  description: string;
  tooltipText: string;
  enabled: boolean;
  visible: boolean;
  style: ButtonStyle;
  state: ButtonState;
  value: number;
  tag: string;
  image: number;
  width: number;
  minWidth: number;
  maxWidth: number;
  allowCustomize: boolean;
  group: number;
  mixedState: boolean;
  useMaskColor: boolean;
  maskColor: string;
}

export interface ToolbarImageList {
  id: string;
  type: ImageListType;
  imageWidth: number;
  imageHeight: number;
  maskColor: string;
  useMaskColor: boolean;
  images: Array<{
    index: number;
    key: string;
    filename: string;
    data?: string;
  }>;
}

export interface ToolbarSettings {
  allowCustomize: boolean;
  borderStyle: 'None' | 'FixedSingle';
  buttonHeight: number;
  buttonWidth: number;
  appearance: 'Flat' | '3D';
  align: 'Top' | 'Bottom' | 'Left' | 'Right';
  showTips: boolean;
  wrappable: boolean;
  enabled: boolean;
  visible: boolean;
  mousePointer: string;
  hoverSelection: boolean;
  hotTracking: boolean;
  textAlign: 'Right' | 'Bottom';
  style: 'Transparent' | 'Standard';
}

export interface ToolbarStructure {
  id: string;
  name: string;
  formName: string;
  buttons: ToolbarButton[];
  imageLists: ToolbarImageList[];
  settings: ToolbarSettings;
  version: string;
  lastModified: Date;
  description?: string;
}

export interface ToolbarTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: ToolbarButton[];
  isBuiltIn: boolean;
}

interface ToolbarDesignerProps {
  formName?: string;
  initialToolbar?: ToolbarStructure;
  onToolbarChange?: (toolbar: ToolbarStructure) => void;
  onGenerateCode?: (toolbar: ToolbarStructure) => string;
  onPreviewToolbar?: (toolbar: ToolbarStructure) => void;
  onSaveTemplate?: (template: ToolbarTemplate) => void;
}

export const ToolbarDesigner: React.FC<ToolbarDesignerProps> = ({
  formName = 'Form1',
  initialToolbar,
  onToolbarChange,
  onGenerateCode,
  onPreviewToolbar,
  onSaveTemplate
}) => {
  const [toolbarStructure, setToolbarStructure] = useState<ToolbarStructure>({
    id: 'toolbar1',
    name: 'Toolbar1',
    formName,
    buttons: [],
    imageLists: [],
    settings: {
      allowCustomize: true,
      borderStyle: 'None',
      buttonHeight: 22,
      buttonWidth: 23,
      appearance: 'Flat',
      align: 'Top',
      showTips: true,
      wrappable: false,
      enabled: true,
      visible: true,
      mousePointer: 'Default',
      hoverSelection: true,
      hotTracking: true,
      textAlign: 'Right',
      style: 'Standard'
    },
    version: '1.0',
    lastModified: new Date()
  });
  const [selectedButton, setSelectedButton] = useState<ToolbarButton | null>(null);
  const [draggedButton, setDraggedButton] = useState<ToolbarButton | null>(null);
  const [showProperties, setShowProperties] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedImageList, setSelectedImageList] = useState<ToolbarImageList | null>(null);
  const [templates, setTemplates] = useState<ToolbarTemplate[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newButtonDialog, setNewButtonDialog] = useState(false);
  const [newButtonType, setNewButtonType] = useState<ButtonStyle>(ButtonStyle.Default);
  const [newButtonProperties, setNewButtonProperties] = useState({
    key: '',
    caption: '',
    tooltipText: '',
    description: ''
  });
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; button?: ToolbarButton }>({
    visible: false,
    x: 0,
    y: 0
  });

  const eventEmitter = useRef(new EventEmitter());
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Initialize with sample toolbar or provided toolbar
  useEffect(() => {
    if (initialToolbar) {
      setToolbarStructure(initialToolbar);
    } else {
      // Create default toolbar structure
      const defaultImageList: ToolbarImageList = {
        id: 'imglist1',
        type: ImageListType.Normal,
        imageWidth: 16,
        imageHeight: 16,
        maskColor: '#FF00FF',
        useMaskColor: true,
        images: [
          { index: 0, key: 'new', filename: 'new.bmp' },
          { index: 1, key: 'open', filename: 'open.bmp' },
          { index: 2, key: 'save', filename: 'save.bmp' },
          { index: 3, key: 'cut', filename: 'cut.bmp' },
          { index: 4, key: 'copy', filename: 'copy.bmp' },
          { index: 5, key: 'paste', filename: 'paste.bmp' },
          { index: 6, key: 'print', filename: 'print.bmp' },
          { index: 7, key: 'find', filename: 'find.bmp' },
          { index: 8, key: 'help', filename: 'help.bmp' }
        ]
      };

      const defaultButtons: ToolbarButton[] = [
        {
          id: 'btn1',
          key: 'btnNew',
          index: 0,
          caption: '',
          description: 'New Document',
          tooltipText: 'New',
          enabled: true,
          visible: true,
          style: ButtonStyle.Default,
          state: ButtonState.Unpressed,
          value: 0,
          tag: 'new',
          image: 0,
          width: 23,
          minWidth: 23,
          maxWidth: 100,
          allowCustomize: true,
          group: 0,
          mixedState: false,
          useMaskColor: true,
          maskColor: '#FF00FF'
        },
        {
          id: 'btn2',
          key: 'btnOpen',
          index: 1,
          caption: '',
          description: 'Open Document',
          tooltipText: 'Open',
          enabled: true,
          visible: true,
          style: ButtonStyle.Default,
          state: ButtonState.Unpressed,
          value: 0,
          tag: 'open',
          image: 1,
          width: 23,
          minWidth: 23,
          maxWidth: 100,
          allowCustomize: true,
          group: 0,
          mixedState: false,
          useMaskColor: true,
          maskColor: '#FF00FF'
        },
        {
          id: 'btn3',
          key: 'btnSave',
          index: 2,
          caption: '',
          description: 'Save Document',
          tooltipText: 'Save',
          enabled: true,
          visible: true,
          style: ButtonStyle.Default,
          state: ButtonState.Unpressed,
          value: 0,
          tag: 'save',
          image: 2,
          width: 23,
          minWidth: 23,
          maxWidth: 100,
          allowCustomize: true,
          group: 0,
          mixedState: false,
          useMaskColor: true,
          maskColor: '#FF00FF'
        },
        {
          id: 'sep1',
          key: 'sep1',
          index: 3,
          caption: '',
          description: '',
          tooltipText: '',
          enabled: true,
          visible: true,
          style: ButtonStyle.Separator,
          state: ButtonState.Enabled,
          value: 0,
          tag: '',
          image: -1,
          width: 8,
          minWidth: 8,
          maxWidth: 8,
          allowCustomize: true,
          group: 0,
          mixedState: false,
          useMaskColor: false,
          maskColor: ''
        },
        {
          id: 'btn4',
          key: 'btnCut',
          index: 4,
          caption: '',
          description: 'Cut',
          tooltipText: 'Cut',
          enabled: true,
          visible: true,
          style: ButtonStyle.Default,
          state: ButtonState.Unpressed,
          value: 0,
          tag: 'cut',
          image: 3,
          width: 23,
          minWidth: 23,
          maxWidth: 100,
          allowCustomize: true,
          group: 1,
          mixedState: false,
          useMaskColor: true,
          maskColor: '#FF00FF'
        },
        {
          id: 'btn5',
          key: 'btnCopy',
          index: 5,
          caption: '',
          description: 'Copy',
          tooltipText: 'Copy',
          enabled: true,
          visible: true,
          style: ButtonStyle.Default,
          state: ButtonState.Unpressed,
          value: 0,
          tag: 'copy',
          image: 4,
          width: 23,
          minWidth: 23,
          maxWidth: 100,
          allowCustomize: true,
          group: 1,
          mixedState: false,
          useMaskColor: true,
          maskColor: '#FF00FF'
        },
        {
          id: 'btn6',
          key: 'btnPaste',
          index: 6,
          caption: '',
          description: 'Paste',
          tooltipText: 'Paste',
          enabled: true,
          visible: true,
          style: ButtonStyle.Default,
          state: ButtonState.Unpressed,
          value: 0,
          tag: 'paste',
          image: 5,
          width: 23,
          minWidth: 23,
          maxWidth: 100,
          allowCustomize: true,
          group: 1,
          mixedState: false,
          useMaskColor: true,
          maskColor: '#FF00FF'
        }
      ];

      const defaultToolbar: ToolbarStructure = {
        id: 'toolbar1',
        name: 'Toolbar1',
        formName,
        buttons: defaultButtons,
        imageLists: [defaultImageList],
        settings: toolbarStructure.settings,
        version: '1.0',
        lastModified: new Date()
      };

      setToolbarStructure(defaultToolbar);
    }

    // Initialize templates
    const builtInTemplates: ToolbarTemplate[] = [
      {
        id: 'standard',
        name: 'Standard Toolbar',
        description: 'New, Open, Save, Cut, Copy, Paste buttons',
        category: 'Standard',
        isBuiltIn: true,
        structure: []
      },
      {
        id: 'formatting',
        name: 'Formatting Toolbar',
        description: 'Font formatting buttons',
        category: 'Text',
        isBuiltIn: true,
        structure: []
      },
      {
        id: 'debug',
        name: 'Debug Toolbar',
        description: 'Debug control buttons',
        category: 'Development',
        isBuiltIn: true,
        structure: []
      }
    ];
    setTemplates(builtInTemplates);
  }, [initialToolbar, formName, toolbarStructure.settings]);

  // Notify parent of changes
  useEffect(() => {
    onToolbarChange?.(toolbarStructure);
  }, [toolbarStructure, onToolbarChange]);

  // Generate unique key for toolbar button
  const generateButtonKey = useCallback((caption: string): string => {
    const cleanCaption = caption
      .replace(/[&\-\s.]/g, '')
      .replace(/\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    
    return `btn${cleanCaption || 'Button'}`;
  }, []);

  // Add new toolbar button
  const addToolbarButton = useCallback((insertIndex?: number) => {
    const newButton: ToolbarButton = {
      id: `btn_${Date.now()}`,
      key: newButtonProperties.key || generateButtonKey(newButtonProperties.caption || 'Button'),
      index: insertIndex ?? toolbarStructure.buttons.length,
      caption: newButtonProperties.caption || (newButtonType === ButtonStyle.Separator ? '' : 'Button'),
      description: newButtonProperties.description || '',
      tooltipText: newButtonProperties.tooltipText || newButtonProperties.caption || '',
      enabled: true,
      visible: true,
      style: newButtonType,
      state: newButtonType === ButtonStyle.Separator ? ButtonState.Enabled : ButtonState.Unpressed,
      value: 0,
      tag: '',
      image: newButtonType === ButtonStyle.Separator ? -1 : 0,
      width: newButtonType === ButtonStyle.Separator ? 8 : 23,
      minWidth: newButtonType === ButtonStyle.Separator ? 8 : 23,
      maxWidth: newButtonType === ButtonStyle.Separator ? 8 : 100,
      allowCustomize: true,
      group: 0,
      mixedState: false,
      useMaskColor: newButtonType !== ButtonStyle.Separator,
      maskColor: '#FF00FF'
    };

    setToolbarStructure(prev => {
      const newButtons = [...prev.buttons];
      if (insertIndex !== undefined) {
        newButtons.splice(insertIndex, 0, newButton);
        // Update indices of subsequent buttons
        for (let i = insertIndex + 1; i < newButtons.length; i++) {
          newButtons[i].index = i;
        }
      } else {
        newButtons.push(newButton);
      }

      return {
        ...prev,
        buttons: newButtons,
        lastModified: new Date()
      };
    });

    setSelectedButton(newButton);
    setNewButtonDialog(false);
    setNewButtonProperties({ key: '', caption: '', tooltipText: '', description: '' });
  }, [newButtonType, newButtonProperties, generateButtonKey, toolbarStructure.buttons.length]);

  // Update toolbar button
  const updateToolbarButton = useCallback((buttonId: string, updates: Partial<ToolbarButton>) => {
    setToolbarStructure(prev => ({
      ...prev,
      buttons: prev.buttons.map(button =>
        button.id === buttonId ? { ...button, ...updates } : button
      ),
      lastModified: new Date()
    }));
  }, []);

  // Delete toolbar button
  const deleteToolbarButton = useCallback((buttonId: string) => {
    setToolbarStructure(prev => {
      const newButtons = prev.buttons
        .filter(button => button.id !== buttonId)
        .map((button, index) => ({ ...button, index }));

      return {
        ...prev,
        buttons: newButtons,
        lastModified: new Date()
      };
    });

    if (selectedButton?.id === buttonId) {
      setSelectedButton(null);
    }
  }, [selectedButton]);

  // Move toolbar button
  const moveToolbarButton = useCallback((buttonId: string, targetIndex: number) => {
    setToolbarStructure(prev => {
      const buttons = [...prev.buttons];
      const buttonIndex = buttons.findIndex(b => b.id === buttonId);
      
      if (buttonIndex === -1) return prev;
      
      const [movedButton] = buttons.splice(buttonIndex, 1);
      buttons.splice(targetIndex, 0, movedButton);
      
      // Update all indices
      buttons.forEach((button, index) => {
        button.index = index;
      });

      return {
        ...prev,
        buttons,
        lastModified: new Date()
      };
    });
  }, []);

  // Get button style icon
  const getButtonStyleIcon = (style: ButtonStyle): string => {
    switch (style) {
      case ButtonStyle.Default:
        return '🔲';
      case ButtonStyle.Check:
        return '☑️';
      case ButtonStyle.ButtonGroup:
        return '📊';
      case ButtonStyle.Separator:
        return '|';
      case ButtonStyle.Placeholder:
        return '⬜';
      case ButtonStyle.DropDown:
        return '🔽';
    }
  };

  // Get button state color
  const getButtonStateColor = (state: ButtonState): string => {
    switch (state) {
      case ButtonState.Pressed:
        return 'bg-blue-200 border-blue-400';
      case ButtonState.Disabled:
        return 'bg-gray-100 border-gray-300 opacity-50';
      case ButtonState.Hidden:
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  // Render toolbar preview
  const renderToolbarPreview = useCallback(() => {
    return (
      <div className="p-4">
        <div 
          className={`flex items-center gap-1 p-1 ${
            toolbarStructure.settings.appearance === 'Flat' ? 'bg-gray-100' : 'bg-gray-200 border border-gray-400'
          }`}
          style={{ 
            height: `${toolbarStructure.settings.buttonHeight + 4}px`,
            flexWrap: toolbarStructure.settings.wrappable ? 'wrap' : 'nowrap'
          }}
        >
          {toolbarStructure.buttons
            .filter(button => button.visible)
            .map(button => (
              <div
                key={button.id}
                className={`flex items-center justify-center ${getButtonStateColor(button.state)} ${
                  button.style === ButtonStyle.Separator ? 'mx-1' : 'hover:bg-gray-200'
                }`}
                style={{
                  width: button.style === ButtonStyle.Separator ? '2px' : `${button.width}px`,
                  height: `${toolbarStructure.settings.buttonHeight}px`,
                  minWidth: `${button.minWidth}px`,
                  maxWidth: `${button.maxWidth}px`
                }}
                title={button.tooltipText}
              >
                {button.style === ButtonStyle.Separator ? (
                  <div className="w-px h-full bg-gray-400"></div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-xs">
                    {button.image >= 0 && (
                      <div className="w-4 h-4 bg-gray-300 border border-gray-400 mb-1 flex items-center justify-center text-xs">
                        {button.image}
                      </div>
                    )}
                    {button.caption && (
                      <span className="truncate max-w-full">{button.caption}</span>
                    )}
                    {button.style === ButtonStyle.DropDown && (
                      <span className="ml-1">▼</span>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    );
  }, [toolbarStructure]);

  // Generate VB6 code
  const generateCode = useCallback(() => {
    if (!onGenerateCode) return '';
    return onGenerateCode(toolbarStructure);
  }, [toolbarStructure, onGenerateCode]);

  // Context menu items
  const contextMenuItems = [
    {
      label: 'Insert Button Before',
      action: () => {
        if (contextMenu.button) {
          setNewButtonDialog(true);
        }
      }
    },
    {
      label: 'Insert Button After',
      action: () => {
        if (contextMenu.button) {
          setNewButtonDialog(true);
        }
      }
    },
    {
      label: 'Insert Separator',
      action: () => {
        if (contextMenu.button) {
          const separatorButton: ToolbarButton = {
            id: `sep_${Date.now()}`,
            key: `sep${Date.now()}`,
            index: contextMenu.button.index + 1,
            caption: '',
            description: '',
            tooltipText: '',
            enabled: true,
            visible: true,
            style: ButtonStyle.Separator,
            state: ButtonState.Enabled,
            value: 0,
            tag: '',
            image: -1,
            width: 8,
            minWidth: 8,
            maxWidth: 8,
            allowCustomize: true,
            group: 0,
            mixedState: false,
            useMaskColor: false,
            maskColor: ''
          };

          setToolbarStructure(prev => {
            const newButtons = [...prev.buttons];
            newButtons.splice(contextMenu.button!.index + 1, 0, separatorButton);
            
            // Update indices
            for (let i = contextMenu.button!.index + 1; i < newButtons.length; i++) {
              newButtons[i].index = i;
            }

            return {
              ...prev,
              buttons: newButtons,
              lastModified: new Date()
            };
          });
        }
      }
    },
    {
      label: 'Delete Button',
      action: () => {
        if (contextMenu.button) {
          deleteToolbarButton(contextMenu.button.id);
        }
      }
    },
    {
      label: 'Button Properties',
      action: () => {
        if (contextMenu.button) {
          setSelectedButton(contextMenu.button);
          setShowProperties(true);
        }
      }
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Toolbar Designer</h3>
          <span className="text-xs text-gray-500">({toolbarStructure.formName})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setNewButtonDialog(true)}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            title="Add Button"
          >
            ➕
          </button>
          
          <button
            onClick={() => setShowImageEditor(true)}
            className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
            title="Image Editor"
          >
            🖼️
          </button>
          
          <button
            onClick={() => setShowTemplateDialog(true)}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Templates"
          >
            📋
          </button>
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-2 py-1 text-xs rounded ${
              showPreview ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            title="Preview"
          >
            👁️
          </button>
          
          <button
            onClick={() => setShowProperties(!showProperties)}
            className={`px-2 py-1 text-xs rounded ${
              showProperties ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            title="Properties"
          >
            🔧
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar Buttons List */}
        <div className="w-80 border-r border-gray-200 overflow-hidden">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium text-gray-700">Toolbar Buttons</h4>
          </div>
          
          <div ref={toolbarRef} className="flex-1 overflow-y-auto">
            {toolbarStructure.buttons.map((button, index) => {
              const isSelected = selectedButton?.id === button.id;

              return (
                <div
                  key={button.id}
                  className={`flex items-center py-2 px-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
                    isSelected ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => setSelectedButton(button)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      button
                    });
                  }}
                  draggable
                  onDragStart={(e) => {
                    setDraggedButton(button);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    if (draggedButton && draggedButton.id !== button.id) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedButton && draggedButton.id !== button.id) {
                      moveToolbarButton(draggedButton.id, index);
                      setDraggedButton(null);
                    }
                  }}
                >
                  {/* Index */}
                  <div className="w-8 text-xs text-gray-500 text-center">
                    {button.index}
                  </div>

                  {/* Style Icon */}
                  <span className="w-6 text-center">{getButtonStyleIcon(button.style)}</span>

                  {/* Key/Caption */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {button.key}
                    </div>
                    {button.caption && (
                      <div className="text-xs text-gray-600 truncate">
                        {button.caption}
                      </div>
                    )}
                  </div>

                  {/* Image Index */}
                  {button.image >= 0 && (
                    <div className="w-8 text-xs text-gray-500 text-center">
                      #{button.image}
                    </div>
                  )}

                  {/* Status indicators */}
                  <div className="flex items-center gap-1">
                    {!button.enabled && <span className="text-gray-400">🚫</span>}
                    {!button.visible && <span className="text-red-600">👁️</span>}
                    {button.state === ButtonState.Pressed && <span className="text-blue-600">📌</span>}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600">
              Buttons: {toolbarStructure.buttons.length} | 
              Selected: {selectedButton?.key || 'None'}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {showProperties && selectedButton && (
          <div className="w-64 border-r border-gray-200 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-700">Button Properties</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Key</label>
                  <input
                    type="text"
                    value={selectedButton.key}
                    onChange={(e) => updateToolbarButton(selectedButton.id, { key: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Caption</label>
                  <input
                    type="text"
                    value={selectedButton.caption}
                    onChange={(e) => updateToolbarButton(selectedButton.id, { caption: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={selectedButton.description}
                    onChange={(e) => updateToolbarButton(selectedButton.id, { description: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ToolTip Text</label>
                  <input
                    type="text"
                    value={selectedButton.tooltipText}
                    onChange={(e) => updateToolbarButton(selectedButton.id, { tooltipText: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Style</label>
                  <select
                    value={selectedButton.style}
                    onChange={(e) => updateToolbarButton(selectedButton.id, { style: e.target.value as ButtonStyle })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    {Object.values(ButtonStyle).map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Image</label>
                  <input
                    type="number"
                    min="-1"
                    value={selectedButton.image}
                    onChange={(e) => updateToolbarButton(selectedButton.id, { image: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                  <input
                    type="number"
                    min="8"
                    value={selectedButton.width}
                    onChange={(e) => updateToolbarButton(selectedButton.id, { width: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tag</label>
                  <input
                    type="text"
                    value={selectedButton.tag}
                    onChange={(e) => updateToolbarButton(selectedButton.id, { tag: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedButton.enabled}
                      onChange={(e) => updateToolbarButton(selectedButton.id, { enabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                  
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedButton.visible}
                      onChange={(e) => updateToolbarButton(selectedButton.id, { visible: e.target.checked })}
                    />
                    Visible
                  </label>
                  
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedButton.allowCustomize}
                      onChange={(e) => updateToolbarButton(selectedButton.id, { allowCustomize: e.target.checked })}
                    />
                    Allow Customize
                  </label>
                  
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedButton.useMaskColor}
                      onChange={(e) => updateToolbarButton(selectedButton.id, { useMaskColor: e.target.checked })}
                    />
                    Use Mask Color
                  </label>
                </div>
                
                {selectedButton.useMaskColor && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mask Color</label>
                    <input
                      type="color"
                      value={selectedButton.maskColor}
                      onChange={(e) => updateToolbarButton(selectedButton.id, { maskColor: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview/Design Panel */}
        <div className="flex-1 overflow-hidden">
          {showPreview ? (
            <div className="h-full">
              <div className="p-2 bg-gray-50 border-b border-gray-200">
                <h4 className="font-medium text-gray-700">Toolbar Preview</h4>
              </div>
              {renderToolbarPreview()}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">🔧</div>
                <p className="text-lg">Toolbar Designer</p>
                <p className="text-sm mt-2">Select buttons from the list to edit properties</p>
                <p className="text-sm">Enable preview to see toolbar appearance</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Button Dialog */}
      {newButtonDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Add Toolbar Button</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Type</label>
                <select
                  value={newButtonType}
                  onChange={(e) => setNewButtonType(e.target.value as ButtonStyle)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(ButtonStyle).map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
              
              {newButtonType !== ButtonStyle.Separator && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                    <input
                      type="text"
                      value={newButtonProperties.key}
                      onChange={(e) => setNewButtonProperties(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="btnButton"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                    <input
                      type="text"
                      value={newButtonProperties.caption}
                      onChange={(e) => setNewButtonProperties(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="Button"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ToolTip Text</label>
                    <input
                      type="text"
                      value={newButtonProperties.tooltipText}
                      onChange={(e) => setNewButtonProperties(prev => ({ ...prev, tooltipText: e.target.value }))}
                      placeholder="Button tooltip"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setNewButtonDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => addToolbarButton()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-300 shadow-lg z-50 py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
          onMouseLeave={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        >
          {contextMenuItems.map((item, index) => (
            <button
              key={index}
              className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
              onClick={() => {
                item.action();
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolbarDesigner;