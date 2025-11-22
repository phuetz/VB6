/**
 * VB6 Toolbar Control Implementation
 * 
 * Toolbar with buttons and full VB6 compatibility
 */

import React, { useState, useCallback } from 'react';

export interface ToolbarButton {
  index: number;
  key: string;
  caption: string;
  description: string;
  style: number; // 0=Default, 1=Check, 2=Group, 3=Separator, 4=Placeholder, 5=Dropdown
  value: number; // For check and group buttons
  enabled: boolean;
  visible: boolean;
  image: number; // ImageList index
  disabledImage: number;
  hotImage: number;
  tag: string;
  toolTipText: string;
  width: number; // 0 = auto
  mixedState: boolean; // For check buttons
}

export interface ToolbarControl {
  type: 'Toolbar';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Button management
  buttons: ToolbarButton[];
  
  // Appearance
  allowCustomize: boolean;
  showTips: boolean;
  style: number; // 0=Standard, 1=Flat
  appearance: number; // 0=Flat, 1=3D
  borderStyle: number; // 0=None, 1=Fixed Single
  
  // Button appearance
  buttonHeight: number;
  buttonWidth: number;
  wrappable: boolean;
  
  // ImageList associations
  imageList: string; // ImageList control name
  disabledImageList: string;
  hotImageList: string;
  
  // Behavior
  enabled: boolean;
  visible: boolean;
  mousePointer: number;
  tag: string;
  
  // Events
  onButtonClick?: string;
  onButtonMenuClick?: string;
  onChange?: string;
}

interface ToolbarControlProps {
  control: ToolbarControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const ToolbarControl: React.FC<ToolbarControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 400,
    height = 28,
    buttons = [],
    allowCustomize = false,
    showTips = true,
    style = 0,
    appearance = 1,
    borderStyle = 1,
    buttonHeight = 22,
    buttonWidth = 23,
    wrappable = false,
    imageList = '',
    disabledImageList = '',
    hotImageList = '',
    enabled = true,
    visible = true,
    mousePointer = 0,
    tag = ''
  } = control;

  const [hoveredButton, setHoveredButton] = useState<number>(-1);
  const [pressedButton, setPressedButton] = useState<number>(-1);

  const handleButtonClick = useCallback((button: ToolbarButton, event: React.MouseEvent) => {
    if (!enabled || !button.enabled) return;
    
    event.preventDefault();
    
    // Handle different button styles
    if (button.style === 1) { // Check button
      const newValue = button.value === 0 ? 1 : 0;
      onPropertyChange?.(`buttons[${button.index}].value`, newValue);
      onEvent?.('Change', { button: button.index });
    } else if (button.style === 2) { // Group button
      // Uncheck other buttons in the same group (simplified)
      const newValue = 1;
      onPropertyChange?.(`buttons[${button.index}].value`, newValue);
      onEvent?.('Change', { button: button.index });
    }
    
    onEvent?.('ButtonClick', { button: button.index, key: button.key });
  }, [enabled, onPropertyChange, onEvent]);

  const handleButtonMouseDown = useCallback((buttonIndex: number) => {
    setPressedButton(buttonIndex);
  }, []);

  const handleButtonMouseUp = useCallback(() => {
    setPressedButton(-1);
  }, []);

  const handleButtonMouseEnter = useCallback((buttonIndex: number) => {
    setHoveredButton(buttonIndex);
  }, []);

  const handleButtonMouseLeave = useCallback(() => {
    setHoveredButton(-1);
    setPressedButton(-1);
  }, []);

  if (!visible) {
    return null;
  }

  const getBorderStyle = () => {
    if (borderStyle === 0) return 'none';
    return appearance === 0 ? '1px solid #808080' : '1px outset #d0d0d0';
  };

  const getCursorStyle = () => {
    const cursors = [
      'default', 'auto', 'crosshair', 'text', 'wait', 'help',
      'pointer', 'not-allowed', 'move', 'col-resize', 'row-resize',
      'n-resize', 's-resize', 'e-resize', 'w-resize'
    ];
    return cursors[mousePointer] || 'default';
  };

  const getButtonStyle = (button: ToolbarButton, index: number) => {
    const isFlat = style === 1;
    const isHovered = hoveredButton === index;
    const isPressed = pressedButton === index;
    const isChecked = button.style === 1 && button.value === 1; // Check button
    const isGroupSelected = button.style === 2 && button.value === 1; // Group button
    
    let border = 'none';
    let background = 'transparent';
    
    if (button.style === 3) { // Separator
      return {
        width: '8px',
        height: `${buttonHeight}px`,
        borderRight: '1px solid #c0c0c0',
        margin: '0 2px',
        cursor: 'default'
      };
    }
    
    if (button.style === 4) { // Placeholder
      return {
        width: `${button.width || buttonWidth}px`,
        height: `${buttonHeight}px`,
        background: 'transparent',
        cursor: 'default'
      };
    }
    
    if (isFlat) {
      if (isPressed || isChecked || isGroupSelected) {
        border = '1px inset #c0c0c0';
        background = '#e0e0e0';
      } else if (isHovered) {
        border = '1px outset #c0c0c0';
        background = '#f0f0f0';
      }
    } else {
      if (isPressed || isChecked || isGroupSelected) {
        border = '2px inset #c0c0c0';
        background = '#e0e0e0';
      } else if (isHovered) {
        border = '2px outset #c0c0c0';
        background = '#f0f0f0';
      } else {
        border = '2px outset #d0d0d0';
      }
    }
    
    return {
      width: `${button.width || buttonWidth}px`,
      height: `${buttonHeight}px`,
      border,
      background,
      cursor: button.enabled && enabled ? 'pointer' : 'not-allowed',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2px',
      margin: '1px',
      opacity: button.enabled && enabled ? 1 : 0.5,
      userSelect: 'none' as const,
      fontSize: '11px',
      color: '#000'
    };
  };

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: getBorderStyle(),
    background: '#f0f0f0',
    cursor: getCursorStyle(),
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
    overflow: wrappable ? 'wrap' : 'hidden',
    flexWrap: wrappable ? 'wrap' : 'nowrap' as const
  };

  return (
    <div
      className={`vb6-toolbar ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      data-name={name}
      data-type="Toolbar"
      onMouseLeave={handleButtonMouseLeave}
    >
      {buttons.map((button, index) => {
        if (!button.visible) return null;
        
        return (
          <div
            key={button.key || index}
            style={getButtonStyle(button, index)}
            onClick={(e) => handleButtonClick(button, e)}
            onMouseDown={() => handleButtonMouseDown(index)}
            onMouseUp={handleButtonMouseUp}
            onMouseEnter={() => handleButtonMouseEnter(index)}
            title={showTips ? button.toolTipText || button.description : ''}
          >
            {/* Button Image */}
            {button.image >= 0 && imageList && (
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  background: `url(images/${imageList}) -${button.image * 16}px 0`,
                  marginBottom: button.caption ? '2px' : '0'
                }}
              />
            )}
            
            {/* Button Caption */}
            {button.caption && (
              <span
                style={{
                  fontSize: '9px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                }}
              >
                {button.caption}
              </span>
            )}
            
            {/* Dropdown Arrow */}
            {button.style === 5 && (
              <div
                style={{
                  position: 'absolute',
                  right: '2px',
                  bottom: '2px',
                  width: '8px',
                  height: '4px',
                  fontSize: '6px'
                }}
              >
                ▼
              </div>
            )}
          </div>
        );
      })}

      {/* Design Mode Info */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            fontSize: '10px',
            color: '#666',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            zIndex: 1000
          }}
        >
          {name} ({buttons.length} buttons)
        </div>
      )}
    </div>
  );
};

// Helper functions for Toolbar management
export const ToolbarHelpers = {
  /**
   * Create default button
   */
  createButton: (index: number, key: string = '', caption: string = ''): ToolbarButton => ({
    index,
    key: key || `button${index}`,
    caption,
    description: '',
    style: 0, // Default
    value: 0,
    enabled: true,
    visible: true,
    image: -1,
    disabledImage: -1,
    hotImage: -1,
    tag: '',
    toolTipText: '',
    width: 0, // Auto
    mixedState: false
  }),

  /**
   * Create separator button
   */
  createSeparator: (index: number): ToolbarButton => ({
    ...ToolbarHelpers.createButton(index, `sep${index}`, ''),
    style: 3 // Separator
  }),

  /**
   * Add button to toolbar
   */
  addButton: (buttons: ToolbarButton[], caption: string = '', style: number = 0): ToolbarButton[] => {
    const newButton = ToolbarHelpers.createButton(buttons.length, '', caption);
    newButton.style = style;
    return [...buttons, newButton];
  },

  /**
   * Add separator to toolbar
   */
  addSeparator: (buttons: ToolbarButton[]): ToolbarButton[] => {
    const separator = ToolbarHelpers.createSeparator(buttons.length);
    return [...buttons, separator];
  },

  /**
   * Remove button from toolbar
   */
  removeButton: (buttons: ToolbarButton[], index: number): ToolbarButton[] => {
    return buttons.filter((_, i) => i !== index).map((button, i) => ({
      ...button,
      index: i
    }));
  },

  /**
   * Update button caption
   */
  updateButtonCaption: (buttons: ToolbarButton[], index: number, caption: string): ToolbarButton[] => {
    return buttons.map((button, i) => 
      i === index ? { ...button, caption } : button
    );
  },

  /**
   * Update button style
   */
  updateButtonStyle: (buttons: ToolbarButton[], index: number, style: number): ToolbarButton[] => {
    return buttons.map((button, i) => 
      i === index ? { ...button, style } : button
    );
  },

  /**
   * Set button checked state
   */
  setButtonChecked: (buttons: ToolbarButton[], index: number, checked: boolean): ToolbarButton[] => {
    return buttons.map((button, i) => 
      i === index ? { ...button, value: checked ? 1 : 0 } : button
    );
  },

  /**
   * Set button enabled state
   */
  setButtonEnabled: (buttons: ToolbarButton[], index: number, enabled: boolean): ToolbarButton[] => {
    return buttons.map((button, i) => 
      i === index ? { ...button, enabled } : button
    );
  }
};

export default ToolbarControl;