/**
 * StatusBar Control - Complete VB6 Status Bar Control
 * Provides comprehensive status bar with multiple panels and styling options
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// StatusBar Constants
export enum SbrStyle {
  sbrNormal = 0,
  sbrSimple = 1
}

export enum SbrAlignment {
  sbrLeft = 0,
  sbrCenter = 1,
  sbrRight = 2
}

export enum SbrContentsType {
  sbrText = 0,
  sbrCaps = 1,
  sbrNum = 2,
  sbrIns = 3,
  sbrScrl = 4,
  sbrTime = 5,
  sbrDate = 6,
  sbrKana = 7
}

export interface StatusBarPanel {
  index: number;
  key: string;
  text: string;
  toolTipText: string;
  width: number;
  minWidth: number;
  alignment: SbrAlignment;
  autoSize: number; // 0-None, 1-Spring, 2-Contents
  bevel: number; // 0-None, 1-Inset, 2-Raised
  enabled: boolean;
  visible: boolean;
  style: SbrContentsType;
  picture?: string;
  tag: string;
}

export interface StatusBarProps extends VB6ControlPropsEnhanced {
  // Style properties
  style?: SbrStyle;
  showTips?: boolean;
  
  // Panel properties
  panels?: StatusBarPanel[];
  simpleText?: string;
  
  // Events
  onPanelClick?: (panel: StatusBarPanel) => void;
  onPanelDblClick?: (panel: StatusBarPanel) => void;
}

export const StatusBarControl = forwardRef<HTMLDivElement, StatusBarProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 400,
    height = 24,
    visible = true,
    enabled = true,
    style = SbrStyle.sbrNormal,
    showTips = true,
    panels = [],
    simpleText = '',
    onPanelClick,
    onPanelDblClick,
    ...rest
  } = props;

  const [currentPanels, setCurrentPanels] = useState<StatusBarPanel[]>(panels);
  const [currentSimpleText, setCurrentSimpleText] = useState(simpleText);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredPanel, setHoveredPanel] = useState<number | null>(null);

  const statusBarRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // Initialize default panels if none provided
  useEffect(() => {
    if (panels.length === 0 && style === SbrStyle.sbrNormal) {
      const defaultPanels: StatusBarPanel[] = [
        {
          index: 0,
          key: 'Ready',
          text: 'Ready',
          toolTipText: 'Application Status',
          width: 200,
          minWidth: 100,
          alignment: SbrAlignment.sbrLeft,
          autoSize: 1, // Spring
          bevel: 1, // Inset
          enabled: true,
          visible: true,
          style: SbrContentsType.sbrText,
          tag: ''
        },
        {
          index: 1,
          key: 'Caps',
          text: '',
          toolTipText: 'Caps Lock Status',
          width: 40,
          minWidth: 40,
          alignment: SbrAlignment.sbrCenter,
          autoSize: 0, // None
          bevel: 1, // Inset
          enabled: true,
          visible: true,
          style: SbrContentsType.sbrCaps,
          tag: ''
        },
        {
          index: 2,
          key: 'Num',
          text: '',
          toolTipText: 'Num Lock Status',
          width: 40,
          minWidth: 40,
          alignment: SbrAlignment.sbrCenter,
          autoSize: 0, // None
          bevel: 1, // Inset
          enabled: true,
          visible: true,
          style: SbrContentsType.sbrNum,
          tag: ''
        },
        {
          index: 3,
          key: 'Time',
          text: '',
          toolTipText: 'Current Time',
          width: 80,
          minWidth: 80,
          alignment: SbrAlignment.sbrCenter,
          autoSize: 0, // None
          bevel: 1, // Inset
          enabled: true,
          visible: true,
          style: SbrContentsType.sbrTime,
          tag: ''
        }
      ];
      setCurrentPanels(defaultPanels);
    } else {
      setCurrentPanels(panels);
    }
  }, [panels, style]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // VB6 Methods
  const vb6Methods = {
    Refresh: () => {
      setCurrentTime(new Date());
      updateKeyboardStatus();
    },

    AddPanel: (index?: number, key?: string, text?: string, width?: number) => {
      const newPanel: StatusBarPanel = {
        index: index || currentPanels.length,
        key: key || `Panel${currentPanels.length}`,
        text: text || '',
        toolTipText: '',
        width: width || 100,
        minWidth: 50,
        alignment: SbrAlignment.sbrLeft,
        autoSize: 0,
        bevel: 1,
        enabled: true,
        visible: true,
        style: SbrContentsType.sbrText,
        tag: ''
      };

      const newPanels = [...currentPanels];
      if (index !== undefined && index < newPanels.length) {
        newPanels.splice(index, 0, newPanel);
        // Update indices of subsequent panels
        for (let i = index + 1; i < newPanels.length; i++) {
          newPanels[i].index = i;
        }
      } else {
        newPanels.push(newPanel);
      }

      setCurrentPanels(newPanels);
      fireEvent(name, 'PanelAdded', { panel: newPanel });
    },

    RemovePanel: (indexOrKey: number | string) => {
      const newPanels = currentPanels.filter(panel => 
        typeof indexOrKey === 'number' ? panel.index !== indexOrKey : panel.key !== indexOrKey
      );
      
      // Update indices
      newPanels.forEach((panel, i) => {
        panel.index = i;
      });

      setCurrentPanels(newPanels);
      fireEvent(name, 'PanelRemoved', { indexOrKey });
    },

    GetPanel: (indexOrKey: number | string): StatusBarPanel | null => {
      return currentPanels.find(panel => 
        typeof indexOrKey === 'number' ? panel.index === indexOrKey : panel.key === indexOrKey
      ) || null;
    },

    SetPanelText: (indexOrKey: number | string, text: string) => {
      const newPanels = currentPanels.map(panel => {
        if (typeof indexOrKey === 'number' ? panel.index === indexOrKey : panel.key === indexOrKey) {
          return { ...panel, text };
        }
        return panel;
      });
      setCurrentPanels(newPanels);
    },

    SetPanelWidth: (indexOrKey: number | string, width: number) => {
      const newPanels = currentPanels.map(panel => {
        if (typeof indexOrKey === 'number' ? panel.index === indexOrKey : panel.key === indexOrKey) {
          return { ...panel, width };
        }
        return panel;
      });
      setCurrentPanels(newPanels);
    },

    SetSimpleText: (text: string) => {
      setCurrentSimpleText(text);
    },

    ShowPanels: () => {
      updateControl(id, 'Style', SbrStyle.sbrNormal);
    },

    HidePanels: () => {
      updateControl(id, 'Style', SbrStyle.sbrSimple);
    }
  };

  const updateKeyboardStatus = useCallback(() => {
    // Update Caps Lock and Num Lock status (browser limitations)
    const newPanels = currentPanels.map(panel => {
      if (panel.style === SbrContentsType.sbrCaps) {
        // Limited detection in browser
        return { ...panel, text: 'CAPS' };
      } else if (panel.style === SbrContentsType.sbrNum) {
        // Limited detection in browser
        return { ...panel, text: 'NUM' };
      } else if (panel.style === SbrContentsType.sbrTime) {
        return { ...panel, text: currentTime.toLocaleTimeString() };
      } else if (panel.style === SbrContentsType.sbrDate) {
        return { ...panel, text: currentTime.toLocaleDateString() };
      }
      return panel;
    });
    setCurrentPanels(newPanels);
  }, [currentPanels, currentTime]);

  const handlePanelClick = (panel: StatusBarPanel, event: React.MouseEvent) => {
    if (!enabled || !panel.enabled) return;

    onPanelClick?.(panel);
    fireEvent(name, 'PanelClick', { panel, button: event.button });
  };

  const handlePanelDoubleClick = (panel: StatusBarPanel, event: React.MouseEvent) => {
    if (!enabled || !panel.enabled) return;

    onPanelDblClick?.(panel);
    fireEvent(name, 'PanelDblClick', { panel, button: event.button });
  };

  const getPanelText = (panel: StatusBarPanel): string => {
    switch (panel.style) {
      case SbrContentsType.sbrText:
        return panel.text;
      case SbrContentsType.sbrCaps:
        // Browser limitation - can't detect caps lock reliably
        return 'CAPS';
      case SbrContentsType.sbrNum:
        // Browser limitation - can't detect num lock reliably
        return 'NUM';
      case SbrContentsType.sbrIns:
        return 'INS';
      case SbrContentsType.sbrScrl:
        return 'SCRL';
      case SbrContentsType.sbrTime:
        return currentTime.toLocaleTimeString();
      case SbrContentsType.sbrDate:
        return currentTime.toLocaleDateString();
      case SbrContentsType.sbrKana:
        return 'KANA';
      default:
        return panel.text;
    }
  };

  const getBevelStyle = (bevel: number) => {
    switch (bevel) {
      case 0: // None
        return { border: 'none' };
      case 1: // Inset
        return { border: '1px inset #c0c0c0' };
      case 2: // Raised
        return { border: '1px outset #c0c0c0' };
      default:
        return { border: '1px inset #c0c0c0' };
    }
  };

  const getTextAlignment = (alignment: SbrAlignment) => {
    switch (alignment) {
      case SbrAlignment.sbrLeft:
        return 'left';
      case SbrAlignment.sbrCenter:
        return 'center';
      case SbrAlignment.sbrRight:
        return 'right';
      default:
        return 'left';
    }
  };

  const calculatePanelWidths = () => {
    const totalWidth = width - 4; // Account for border
    const fixedPanels = currentPanels.filter(p => p.autoSize === 0 && p.visible);
    const springPanels = currentPanels.filter(p => p.autoSize === 1 && p.visible);
    const contentPanels = currentPanels.filter(p => p.autoSize === 2 && p.visible);

    let usedWidth = 0;
    
    // Calculate fixed widths
    fixedPanels.forEach(panel => {
      usedWidth += panel.width;
    });

    // Calculate content-based widths (simplified)
    contentPanels.forEach(panel => {
      const textWidth = Math.max(panel.text.length * 8, panel.minWidth);
      panel.width = textWidth;
      usedWidth += textWidth;
    });

    // Distribute remaining space among spring panels
    const remainingWidth = Math.max(0, totalWidth - usedWidth);
    const springWidth = springPanels.length > 0 ? Math.max(50, remainingWidth / springPanels.length) : 0;
    
    springPanels.forEach(panel => {
      panel.width = Math.max(panel.minWidth, springWidth);
    });

    return currentPanels;
  };

  // Update control properties
  useEffect(() => {
    updateControl(id, 'Panels', currentPanels);
    updateControl(id, 'SimpleText', currentSimpleText);
    updateControl(id, 'Style', style);
  }, [id, currentPanels, currentSimpleText, style, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  // Update keyboard status periodically
  useEffect(() => {
    updateKeyboardStatus();
  }, [updateKeyboardStatus]);

  if (!visible) return null;

  const panelsToDisplay = calculatePanelWidths().filter(p => p.visible);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        border: '1px solid #c0c0c0',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'MS Sans Serif',
        fontSize: '8pt',
        opacity: enabled ? 1 : 0.5
      }}
      {...rest}
    >
      {style === SbrStyle.sbrSimple ? (
        // Simple mode - single text area
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '4px',
            paddingRight: '4px',
            ...getBevelStyle(1)
          }}
        >
          {currentSimpleText}
        </div>
      ) : (
        // Normal mode - multiple panels
        panelsToDisplay.map((panel, index) => (
          <div
            key={panel.key}
            style={{
              width: `${panel.width}px`,
              height: 'calc(100% - 2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: getTextAlignment(panel.alignment),
              padding: '1px 4px',
              cursor: enabled && panel.enabled ? 'default' : 'not-allowed',
              opacity: panel.enabled ? 1 : 0.5,
              backgroundColor: hoveredPanel === panel.index ? '#e0e0e0' : 'transparent',
              ...getBevelStyle(panel.bevel)
            }}
            title={showTips ? panel.toolTipText : ''}
            onClick={(e) => handlePanelClick(panel, e)}
            onDoubleClick={(e) => handlePanelDoubleClick(panel, e)}
            onMouseEnter={() => setHoveredPanel(panel.index)}
            onMouseLeave={() => setHoveredPanel(null)}
          >
            {panel.picture && (
              <img
                src={panel.picture}
                alt=""
                style={{
                  width: '16px',
                  height: '16px',
                  marginRight: panel.text ? '4px' : '0'
                }}
              />
            )}
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '8pt',
                color: panel.enabled ? '#000000' : '#808080'
              }}
            >
              {getPanelText(panel)}
            </span>
          </div>
        ))
      )}
      
      {/* Resize grip (for design-time) */}
      <div
        style={{
          width: '12px',
          height: '100%',
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              #c0c0c0,
              #c0c0c0 1px,
              transparent 1px,
              transparent 3px
            )
          `,
          marginLeft: 'auto',
          cursor: 'se-resize'
        }}
      />
    </div>
  );
});

StatusBarControl.displayName = 'StatusBarControl';

export default StatusBarControl;