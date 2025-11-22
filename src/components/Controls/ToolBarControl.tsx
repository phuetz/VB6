/**
 * ToolBar Control - Complete VB6 Toolbar Control
 * Provides comprehensive toolbar with buttons, separators, and dropdown menus
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// ToolBar Constants
export enum TbrStyle {
  tbrStandard = 0,
  tbrFlat = 1
}

export enum TbrButtonStyle {
  tbrDefault = 0,
  tbrCheck = 1,
  tbrButtonGroup = 2,
  tbrSeparator = 3,
  tbrPlaceholder = 4,
  tbrDropdown = 5
}

export enum TbrButtonState {
  tbrUnpressed = 0,
  tbrPressed = 1,
  tbrEnabled = 2,
  tbrHidden = 3,
  tbrIndeterminate = 4,
  tbrDisabled = 5
}

export interface ToolBarButton {
  index: number;
  key: string;
  caption: string;
  description: string;
  tooltipText: string;
  image?: string;
  imageIndex: number;
  style: TbrButtonStyle;
  value: TbrButtonState;
  enabled: boolean;
  visible: boolean;
  width: number;
  mixedState: boolean;
  tag: string;
}

export interface ToolBarProps extends VB6ControlPropsEnhanced {
  // Style properties
  style?: TbrStyle;
  appearance?: number; // 0-Flat, 1-3D
  borderStyle?: number; // 0-None, 1-Fixed Single
  
  // Button properties
  buttons?: ToolBarButton[];
  buttonWidth?: number;
  buttonHeight?: number;
  allowCustomize?: boolean;
  wrappable?: boolean;
  
  // Image properties
  imageList?: string[];
  disabledImageList?: string[];
  hotImageList?: string[];
  
  // Events
  onButtonClick?: (button: ToolBarButton) => void;
  onButtonMenuClick?: (button: ToolBarButton, menuIndex: number) => void;
  onChange?: (button: ToolBarButton) => void;
}

export const ToolBarControl = forwardRef<HTMLDivElement, ToolBarProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 400,
    height = 32,
    visible = true,
    enabled = true,
    style = TbrStyle.tbrStandard,
    appearance = 1,
    borderStyle = 1,
    buttons = [],
    buttonWidth = 24,
    buttonHeight = 24,
    allowCustomize = false,
    wrappable = false,
    imageList = [],
    disabledImageList = [],
    hotImageList = [],
    onButtonClick,
    onButtonMenuClick,
    onChange,
    ...rest
  } = props;

  const [currentButtons, setCurrentButtons] = useState<ToolBarButton[]>(buttons);
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);
  const [pressedButton, setPressedButton] = useState<number | null>(null);
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // Initialize default buttons if none provided
  useEffect(() => {
    if (buttons.length === 0) {
      const defaultButtons: ToolBarButton[] = [
        {
          index: 0,
          key: 'New',
          caption: 'New',
          description: 'Create new document',
          tooltipText: 'New (Ctrl+N)',
          imageIndex: 0,
          style: TbrButtonStyle.tbrDefault,
          value: TbrButtonState.tbrUnpressed,
          enabled: true,
          visible: true,
          width: buttonWidth,
          mixedState: false,
          tag: ''
        },
        {
          index: 1,
          key: 'Open',
          caption: 'Open',
          description: 'Open existing document',
          tooltipText: 'Open (Ctrl+O)',
          imageIndex: 1,
          style: TbrButtonStyle.tbrDefault,
          value: TbrButtonState.tbrUnpressed,
          enabled: true,
          visible: true,
          width: buttonWidth,
          mixedState: false,
          tag: ''
        },
        {
          index: 2,
          key: 'Save',
          caption: 'Save',
          description: 'Save document',
          tooltipText: 'Save (Ctrl+S)',
          imageIndex: 2,
          style: TbrButtonStyle.tbrDefault,
          value: TbrButtonState.tbrUnpressed,
          enabled: true,
          visible: true,
          width: buttonWidth,
          mixedState: false,
          tag: ''
        },
        {
          index: 3,
          key: 'Sep1',
          caption: '',
          description: '',
          tooltipText: '',
          imageIndex: -1,
          style: TbrButtonStyle.tbrSeparator,
          value: TbrButtonState.tbrUnpressed,
          enabled: true,
          visible: true,
          width: 8,
          mixedState: false,
          tag: ''
        },
        {
          index: 4,
          key: 'Cut',
          caption: 'Cut',
          description: 'Cut selection',
          tooltipText: 'Cut (Ctrl+X)',
          imageIndex: 3,
          style: TbrButtonStyle.tbrDefault,
          value: TbrButtonState.tbrUnpressed,
          enabled: true,
          visible: true,
          width: buttonWidth,
          mixedState: false,
          tag: ''
        },
        {
          index: 5,
          key: 'Copy',
          caption: 'Copy',
          description: 'Copy selection',
          tooltipText: 'Copy (Ctrl+C)',
          imageIndex: 4,
          style: TbrButtonStyle.tbrDefault,
          value: TbrButtonState.tbrUnpressed,
          enabled: true,
          visible: true,
          width: buttonWidth,
          mixedState: false,
          tag: ''
        },
        {
          index: 6,
          key: 'Paste',
          caption: 'Paste',
          description: 'Paste from clipboard',
          tooltipText: 'Paste (Ctrl+V)',
          imageIndex: 5,
          style: TbrButtonStyle.tbrDefault,
          value: TbrButtonState.tbrUnpressed,
          enabled: true,
          visible: true,
          width: buttonWidth,
          mixedState: false,
          tag: ''
        }
      ];
      setCurrentButtons(defaultButtons);
    } else {
      setCurrentButtons(buttons);
    }
  }, [buttons, buttonWidth]);

  // VB6 Methods
  const vb6Methods = {
    Refresh: () => {
      // Force refresh of toolbar
      setCurrentButtons(prev => [...prev]);
    },

    AddButton: (index?: number, key?: string, caption?: string, style?: TbrButtonStyle, imageIndex?: number) => {
      const newButton: ToolBarButton = {
        index: index || currentButtons.length,
        key: key || `Button${currentButtons.length}`,
        caption: caption || '',
        description: caption || '',
        tooltipText: caption || '',
        imageIndex: imageIndex || -1,
        style: style || TbrButtonStyle.tbrDefault,
        value: TbrButtonState.tbrUnpressed,
        enabled: true,
        visible: true,
        width: style === TbrButtonStyle.tbrSeparator ? 8 : buttonWidth,
        mixedState: false,
        tag: ''
      };

      const newButtons = [...currentButtons];
      if (index !== undefined && index < newButtons.length) {
        newButtons.splice(index, 0, newButton);
        // Update indices of subsequent buttons
        for (let i = index + 1; i < newButtons.length; i++) {
          newButtons[i].index = i;
        }
      } else {
        newButtons.push(newButton);
      }

      setCurrentButtons(newButtons);
      fireEvent(name, 'ButtonAdded', { button: newButton });
    },

    RemoveButton: (indexOrKey: number | string) => {
      const newButtons = currentButtons.filter(button => 
        typeof indexOrKey === 'number' ? button.index !== indexOrKey : button.key !== indexOrKey
      );
      
      // Update indices
      newButtons.forEach((button, i) => {
        button.index = i;
      });

      setCurrentButtons(newButtons);
      fireEvent(name, 'ButtonRemoved', { indexOrKey });
    },

    GetButton: (indexOrKey: number | string): ToolBarButton | null => {
      return currentButtons.find(button => 
        typeof indexOrKey === 'number' ? button.index === indexOrKey : button.key === indexOrKey
      ) || null;
    },

    SetButtonEnabled: (indexOrKey: number | string, enabled: boolean) => {
      const newButtons = currentButtons.map(button => {
        if (typeof indexOrKey === 'number' ? button.index === indexOrKey : button.key === indexOrKey) {
          return { ...button, enabled, value: enabled ? TbrButtonState.tbrEnabled : TbrButtonState.tbrDisabled };
        }
        return button;
      });
      setCurrentButtons(newButtons);
    },

    SetButtonVisible: (indexOrKey: number | string, visible: boolean) => {
      const newButtons = currentButtons.map(button => {
        if (typeof indexOrKey === 'number' ? button.index === indexOrKey : button.key === indexOrKey) {
          return { ...button, visible, value: visible ? TbrButtonState.tbrEnabled : TbrButtonState.tbrHidden };
        }
        return button;
      });
      setCurrentButtons(newButtons);
    },

    SetButtonPressed: (indexOrKey: number | string, pressed: boolean) => {
      const newButtons = currentButtons.map(button => {
        if (typeof indexOrKey === 'number' ? button.index === indexOrKey : button.key === indexOrKey) {
          if (button.style === TbrButtonStyle.tbrCheck || button.style === TbrButtonStyle.tbrButtonGroup) {
            return { ...button, value: pressed ? TbrButtonState.tbrPressed : TbrButtonState.tbrUnpressed };
          }
        }
        return button;
      });
      setCurrentButtons(newButtons);
    },

    SetButtonCaption: (indexOrKey: number | string, caption: string) => {
      const newButtons = currentButtons.map(button => {
        if (typeof indexOrKey === 'number' ? button.index === indexOrKey : button.key === indexOrKey) {
          return { ...button, caption, description: caption, tooltipText: caption };
        }
        return button;
      });
      setCurrentButtons(newButtons);
    },

    SetButtonImage: (indexOrKey: number | string, imageIndex: number) => {
      const newButtons = currentButtons.map(button => {
        if (typeof indexOrKey === 'number' ? button.index === indexOrKey : button.key === indexOrKey) {
          return { ...button, imageIndex };
        }
        return button;
      });
      setCurrentButtons(newButtons);
    },

    ShowCustomizeDialog: () => {
      if (allowCustomize) {
        setShowCustomizeDialog(true);
      }
    },

    SaveToolbar: () => {
      // Save toolbar configuration (would typically save to registry or file)
      const config = {
        buttons: currentButtons,
        style,
        buttonWidth,
        buttonHeight
      };
      localStorage.setItem(`${name}_toolbar_config`, JSON.stringify(config));
      fireEvent(name, 'ToolbarSaved', { config });
    },

    RestoreToolbar: () => {
      // Restore toolbar configuration
      const configStr = localStorage.getItem(`${name}_toolbar_config`);
      if (configStr) {
        try {
          const config = JSON.parse(configStr);
          if (config.buttons) {
            setCurrentButtons(config.buttons);
            fireEvent(name, 'ToolbarRestored', { config });
          }
        } catch (error) {
          console.warn('Failed to restore toolbar configuration:', error);
        }
      }
    }
  };

  const handleButtonClick = (button: ToolBarButton, event: React.MouseEvent) => {
    if (!enabled || !button.enabled || button.style === TbrButtonStyle.tbrSeparator) return;

    // Handle different button styles
    if (button.style === TbrButtonStyle.tbrCheck) {
      // Toggle check button
      const newValue = button.value === TbrButtonState.tbrPressed ? 
                      TbrButtonState.tbrUnpressed : TbrButtonState.tbrPressed;
      vb6Methods.SetButtonPressed(button.index, newValue === TbrButtonState.tbrPressed);
      
      onChange?.(button);
      fireEvent(name, 'Change', { button });
    } else if (button.style === TbrButtonStyle.tbrButtonGroup) {
      // Button group - unpress others in same group
      const newButtons = currentButtons.map(btn => {
        if (btn.style === TbrButtonStyle.tbrButtonGroup && btn.index !== button.index) {
          return { ...btn, value: TbrButtonState.tbrUnpressed };
        } else if (btn.index === button.index) {
          return { ...btn, value: TbrButtonState.tbrPressed };
        }
        return btn;
      });
      setCurrentButtons(newButtons);
      
      onChange?.(button);
      fireEvent(name, 'Change', { button });
    } else if (button.style === TbrButtonStyle.tbrDropdown) {
      // Show dropdown menu (simplified)
      onButtonMenuClick?.(button, 0);
      fireEvent(name, 'ButtonMenuClick', { button, menuIndex: 0 });
    }

    onButtonClick?.(button);
    fireEvent(name, 'ButtonClick', { button, x: event.clientX, y: event.clientY });
  };

  const handleButtonMouseDown = (button: ToolBarButton) => {
    if (!enabled || !button.enabled || button.style === TbrButtonStyle.tbrSeparator) return;
    setPressedButton(button.index);
  };

  const handleButtonMouseUp = () => {
    setPressedButton(null);
  };

  const getButtonImage = (button: ToolBarButton, isHovered: boolean, isPressed: boolean) => {
    if (button.imageIndex >= 0) {
      if (!button.enabled && disabledImageList[button.imageIndex]) {
        return disabledImageList[button.imageIndex];
      } else if (isHovered && hotImageList[button.imageIndex]) {
        return hotImageList[button.imageIndex];
      } else if (imageList[button.imageIndex]) {
        return imageList[button.imageIndex];
      }
    }
    
    if (button.image) {
      return button.image;
    }

    // Default icons based on common button names
    const defaultIcons: { [key: string]: string } = {
      'New': '📄',
      'Open': '📂',
      'Save': '💾',
      'Cut': '✂️',
      'Copy': '📋',
      'Paste': '📄',
      'Undo': '↶',
      'Redo': '↷',
      'Print': '🖨️',
      'Find': '🔍',
      'Bold': 'B',
      'Italic': 'I',
      'Underline': 'U'
    };

    return defaultIcons[button.key] || defaultIcons[button.caption] || '⚬';
  };

  const getButtonStyle = (button: ToolBarButton, isHovered: boolean, isPressed: boolean) => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${button.width}px`,
      height: `${buttonHeight}px`,
      margin: '1px',
      padding: '2px',
      cursor: button.enabled ? 'pointer' : 'not-allowed',
      opacity: button.enabled ? 1 : 0.5,
      backgroundColor: 'transparent',
      border: 'none',
      fontSize: '12px',
      fontFamily: 'MS Sans Serif'
    };

    if (button.style === TbrButtonStyle.tbrSeparator) {
      return {
        ...baseStyle,
        width: `${button.width}px`,
        borderLeft: '1px solid #c0c0c0',
        cursor: 'default'
      };
    }

    // Button appearance based on style
    if (style === TbrStyle.tbrFlat) {
      if (isPressed || pressedButton === button.index || button.value === TbrButtonState.tbrPressed) {
        return {
          ...baseStyle,
          border: '1px inset #c0c0c0',
          backgroundColor: '#e0e0e0'
        };
      } else if (isHovered) {
        return {
          ...baseStyle,
          border: '1px outset #c0c0c0',
          backgroundColor: '#f0f0f0'
        };
      } else {
        return {
          ...baseStyle,
          border: '1px solid transparent'
        };
      }
    } else {
      // 3D style
      if (isPressed || pressedButton === button.index || button.value === TbrButtonState.tbrPressed) {
        return {
          ...baseStyle,
          border: '1px inset #c0c0c0',
          backgroundColor: '#e0e0e0'
        };
      } else {
        return {
          ...baseStyle,
          border: '1px outset #c0c0c0',
          backgroundColor: '#f0f0f0'
        };
      }
    }
  };

  const renderButton = (button: ToolBarButton) => {
    if (!button.visible) return null;

    const isHovered = hoveredButton === button.index;
    const isPressed = pressedButton === button.index;
    const buttonStyle = getButtonStyle(button, isHovered, isPressed);
    const buttonImage = getButtonImage(button, isHovered, isPressed);

    if (button.style === TbrButtonStyle.tbrSeparator) {
      return (
        <div
          key={button.key}
          style={buttonStyle}
          title={button.tooltipText}
        />
      );
    }

    return (
      <button
        key={button.key}
        style={buttonStyle}
        title={button.tooltipText}
        disabled={!button.enabled}
        onClick={(e) => handleButtonClick(button, e)}
        onMouseDown={() => handleButtonMouseDown(button)}
        onMouseUp={handleButtonMouseUp}
        onMouseEnter={() => setHoveredButton(button.index)}
        onMouseLeave={() => setHoveredButton(null)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', lineHeight: 1 }}>
            {buttonImage}
          </span>
          {button.caption && (
            <span style={{ fontSize: '8px', marginTop: '1px' }}>
              {button.caption}
            </span>
          )}
        </div>
        {button.style === TbrButtonStyle.tbrDropdown && (
          <span style={{ marginLeft: '2px', fontSize: '8px' }}>▼</span>
        )}
      </button>
    );
  };

  // Update control properties
  useEffect(() => {
    updateControl(id, 'Buttons', currentButtons);
    updateControl(id, 'Style', style);
    updateControl(id, 'ButtonWidth', buttonWidth);
    updateControl(id, 'ButtonHeight', buttonHeight);
  }, [id, currentButtons, style, buttonWidth, buttonHeight, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  if (!visible) return null;

  const containerStyle = {
    position: 'absolute' as const,
    left,
    top,
    width,
    height,
    backgroundColor: '#f0f0f0',
    border: borderStyle === 1 ? '1px solid #c0c0c0' : 'none',
    display: 'flex',
    alignItems: 'flex-start',
    padding: '2px',
    overflow: 'hidden',
    fontFamily: 'MS Sans Serif',
    fontSize: '8pt',
    opacity: enabled ? 1 : 0.5,
    flexWrap: wrappable ? 'wrap' : 'nowrap'
  };

  return (
    <div
      ref={ref}
      style={containerStyle}
      {...rest}
    >
      {currentButtons.map(button => renderButton(button))}
      
      {/* Customize Dialog (simplified) */}
      {showCustomizeDialog && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '300px',
            backgroundColor: 'white',
            border: '2px outset #c0c0c0',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <h3>Customize Toolbar</h3>
          <p>Toolbar customization dialog would appear here.</p>
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => setShowCustomizeDialog(false)}
              style={{
                padding: '4px 12px',
                border: '1px outset #c0c0c0',
                backgroundColor: '#f0f0f0',
                marginRight: '8px'
              }}
            >
              OK
            </button>
            <button
              onClick={() => setShowCustomizeDialog(false)}
              style={{
                padding: '4px 12px',
                border: '1px outset #c0c0c0',
                backgroundColor: '#f0f0f0'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ToolBarControl.displayName = 'ToolBarControl';

export default ToolBarControl;