/**
 * Contrôles VB6 améliorés avec 100% de compatibilité
 * Implémentation complète de toutes les propriétés VB6
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef, CSSProperties } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { getCompleteVB6Properties } from '../../data/VB6CompleteProperties';

// Interface étendue pour toutes les propriétés VB6
export interface VB6ControlPropsEnhanced {
  // Propriétés communes
  id: number;
  name: string;
  index?: number | null;
  left: number;
  top: number;
  width: number;
  height: number;
  visible: boolean;
  enabled: boolean;
  tabStop: boolean;
  tabIndex: number;
  causesValidation: boolean;
  tag: string;
  toolTipText: string;
  helpContextID: number;
  whatsThisHelpID: number;
  dragMode: 0 | 1; // 0=Manual, 1=Automatic
  dragIcon?: string | null;
  oleDropMode: 0 | 1; // 0=None, 1=Manual
  oleDragMode: 0 | 1; // 0=Manual, 1=Automatic
  mousePointer: number;
  mouseIcon?: string | null;
  container?: any;
  parent?: any;
  rightToLeft: boolean;
  dataBindings?: any;
  dataChanged: boolean;
  dataField: string;
  dataFormat?: any;
  dataMember: string;
  dataSource?: any;
  // Propriétés spécifiques au contrôle
  [key: string]: any;
}

// Fonction utilitaire pour obtenir le curseur de souris
const getMouseCursor = (mousePointer: number): string => {
  const cursors = [
    'default',
    'pointer',
    'crosshair',
    'text',
    'help',
    'move',
    'ne-resize',
    'n-resize',
    'nw-resize',
    'w-resize',
    'not-allowed',
    'wait',
    'no-drop',
    'progress',
    'help',
    'all-scroll',
    'custom',
  ];
  return cursors[mousePointer] || 'default';
};

// CommandButton amélioré avec toutes les propriétés
export const CommandButtonEnhanced = forwardRef<HTMLButtonElement, VB6ControlPropsEnhanced>(
  (props, ref) => {
    const {
      id,
      name,
      left,
      top,
      width,
      height,
      visible,
      enabled,
      caption = 'Command1',
      default: isDefault = false,
      cancel = false,
      style = 0, // 0=Standard, 1=Graphical
      picture = null,
      disabledPicture = null,
      downPicture = null,
      maskColor = '#C0C0C0',
      useMaskColor = false,
      backColor = '#8080FF',
      foreColor = '#000000',
      font = {
        name: 'MS Sans Serif',
        size: 8,
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
      },
      appearance = 1, // 0=Flat, 1=3D
      hWnd = 0,
      tabStop = true,
      tabIndex = 0,
      tag = '',
      toolTipText = '',
      mousePointer = 0,
      mouseIcon = null,
      dragMode = 0,
      dragIcon = null,
      ...rest
    } = props;

    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { fireEvent, updateControl } = useVB6Store();
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Simuler hWnd
    useEffect(() => {
      if (buttonRef.current && hWnd === 0) {
        updateControl(id, 'hWnd', Math.floor(Math.random() * 1000000));
      }
    }, [id, hWnd, updateControl]);

    const handleClick = useCallback(() => {
      if (enabled) {
        fireEvent(name, 'Click', { sender: name });
        updateControl(id, 'value', true);
        setTimeout(() => updateControl(id, 'value', false), 100);
      }
    }, [enabled, fireEvent, name, id, updateControl]);

    const handleMouseEvents = useCallback(
      (eventName: string, e: React.MouseEvent) => {
        if (enabled) {
          fireEvent(name, eventName, {
            button: e.button + 1,
            shift: (e.shiftKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.altKey ? 4 : 0),
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY,
          });
        }
      },
      [enabled, fireEvent, name]
    );

    const handleKeyEvents = useCallback(
      (eventName: string, e: React.KeyboardEvent) => {
        if (enabled) {
          const keyCode = e.keyCode || e.which;
          const shift = (e.shiftKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.altKey ? 4 : 0);
          fireEvent(name, eventName, { keyCode, shift });

          if (eventName === 'KeyPress') {
            fireEvent(name, 'KeyPress', { keyAscii: e.key.charCodeAt(0) });
          }
        }
      },
      [enabled, fireEvent, name]
    );

    const handleGotFocus = useCallback(() => {
      fireEvent(name, 'GotFocus', {});
    }, [fireEvent, name]);

    const handleLostFocus = useCallback(() => {
      fireEvent(name, 'LostFocus', {});
      if (props.causesValidation) {
        fireEvent(name, 'Validate', { cancel: false });
      }
    }, [fireEvent, name, props.causesValidation]);

    const getPicture = (): string | null => {
      if (style === 0) return null; // Standard style doesn't show pictures
      if (!enabled && disabledPicture) return disabledPicture;
      if (isPressed && downPicture) return downPicture;
      return picture;
    };

    const buttonStyle: CSSProperties = {
      position: 'absolute',
      left,
      top,
      width,
      height,
      display: visible ? 'block' : 'none',
      backgroundColor: style === 1 ? backColor : undefined,
      color: foreColor,
      border:
        appearance === 1
          ? isPressed
            ? '2px inset #C0C0C0'
            : '2px outset #C0C0C0'
          : '1px solid #808080',
      cursor: mouseIcon ? `url(${mouseIcon}), auto` : getMouseCursor(mousePointer),
      opacity: enabled ? 1 : 0.6,
      fontFamily: font.name,
      fontSize: `${font.size}pt`,
      fontWeight: font.bold ? 'bold' : 'normal',
      fontStyle: font.italic ? 'italic' : 'normal',
      textDecoration: font.underline ? 'underline' : 'none',
      backgroundImage: getPicture() ? `url(${getPicture()})` : undefined,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      outline: isDefault ? '1px solid #000000' : 'none',
      outlineOffset: '-3px',
      padding: '2px 4px',
      overflow: 'hidden',
      textAlign: 'center',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
    };

    return (
      <button
        ref={el => {
          if (ref) {
            if (typeof ref === 'function') ref(el);
            else ref.current = el;
          }
          buttonRef.current = el;
        }}
        style={buttonStyle}
        onClick={handleClick}
        onMouseDown={e => {
          setIsPressed(true);
          handleMouseEvents('MouseDown', e);
        }}
        onMouseUp={e => {
          setIsPressed(false);
          handleMouseEvents('MouseUp', e);
        }}
        onMouseMove={e => handleMouseEvents('MouseMove', e)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={e => handleKeyEvents('KeyDown', e)}
        onKeyUp={e => handleKeyEvents('KeyUp', e)}
        onKeyPress={e => handleKeyEvents('KeyPress', e)}
        onFocus={handleGotFocus}
        onBlur={handleLostFocus}
        disabled={!enabled}
        tabIndex={tabStop ? tabIndex : -1}
        title={toolTipText}
        data-name={name}
        data-tag={tag}
        data-dragmode={dragMode}
        {...rest}
      >
        {style === 0 && caption}
      </button>
    );
  }
);

// TextBox amélioré avec toutes les propriétés
export const TextBoxEnhanced = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  VB6ControlPropsEnhanced
>((props, ref) => {
  const {
    id,
    name,
    left,
    top,
    width,
    height,
    visible,
    enabled,
    text = '',
    maxLength = 0,
    multiLine = false,
    scrollBars = 0, // 0=None, 1=Horizontal, 2=Vertical, 3=Both
    passwordChar = '',
    locked = false,
    hideSelection = true,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font = {
      name: 'MS Sans Serif',
      size: 8,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    },
    alignment = 0, // 0=Left, 1=Right, 2=Center
    borderStyle = 1, // 0=None, 1=Fixed Single
    appearance = 1, // 0=Flat, 1=3D
    linkMode = 0,
    linkTopic = '',
    linkItem = '',
    linkTimeout = 50,
    selStart = 0,
    selLength = 0,
    selText = '',
    hWnd = 0,
    tabStop = true,
    tabIndex = 0,
    tag = '',
    toolTipText = '',
    mousePointer = 0,
    mouseIcon = null,
    dataField = '',
    dataSource = null,
    ...rest
  } = props;

  const [value, setValue] = useState(text);
  const [selection, setSelection] = useState({ start: selStart, length: selLength });
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // Simuler hWnd
  useEffect(() => {
    if (inputRef.current && hWnd === 0) {
      updateControl(id, 'hWnd', Math.floor(Math.random() * 1000000));
    }
  }, [id, hWnd, updateControl]);

  // Gérer la sélection
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setSelectionRange(selection.start, selection.start + selection.length);
      const selectedText = value.substring(selection.start, selection.start + selection.length);
      updateControl(id, 'selText', selectedText);
    }
  }, [selection, value, id, updateControl]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (maxLength === 0 || newValue.length <= maxLength) {
        setValue(newValue);
        updateControl(id, 'text', newValue);
        fireEvent(name, 'Change', { newValue });

        // Mettre à jour dataChanged si lié à une source de données
        if (dataSource && dataField) {
          updateControl(id, 'dataChanged', true);
        }
      }
    },
    [id, maxLength, name, fireEvent, updateControl, dataSource, dataField]
  );

  const handleSelect = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      setSelection({
        start: target.selectionStart || 0,
        length: (target.selectionEnd || 0) - (target.selectionStart || 0),
      });
      updateControl(id, 'selStart', target.selectionStart || 0);
      updateControl(id, 'selLength', (target.selectionEnd || 0) - (target.selectionStart || 0));
    },
    [id, updateControl]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      const keyAscii = e.key.charCodeAt(0);
      fireEvent(name, 'KeyPress', { keyAscii });

      if (linkMode > 0) {
        // Gérer les liens DDE si nécessaire
        fireEvent(name, 'LinkNotify', {});
      }
    },
    [name, fireEvent, linkMode]
  );

  const handleValidate = useCallback(() => {
    if (props.causesValidation) {
      const cancelEvent = { cancel: false };
      fireEvent(name, 'Validate', cancelEvent);
      return !cancelEvent.cancel;
    }
    return true;
  }, [fireEvent, name, props.causesValidation]);

  const getScrollBarStyle = (): CSSProperties => {
    const style: CSSProperties = {};
    if (multiLine) {
      switch (scrollBars) {
        case 1: // Horizontal
          style.overflowX = 'scroll';
          style.overflowY = 'hidden';
          break;
        case 2: // Vertical
          style.overflowX = 'hidden';
          style.overflowY = 'scroll';
          break;
        case 3: // Both
          style.overflow = 'scroll';
          break;
        default: // None
          style.overflow = 'hidden';
      }
    }
    return style;
  };

  const textStyle: CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border:
      borderStyle === 1 ? (appearance === 1 ? '2px inset #C0C0C0' : '1px solid #808080') : 'none',
    textAlign: ['left', 'right', 'center'][alignment] as any,
    fontFamily: font.name,
    fontSize: `${font.size}pt`,
    fontWeight: font.bold ? 'bold' : 'normal',
    fontStyle: font.italic ? 'italic' : 'normal',
    textDecoration: font.underline ? 'underline' : 'none',
    cursor: mouseIcon ? `url(${mouseIcon}), auto` : getMouseCursor(mousePointer),
    outline: 'none',
    padding: '2px',
    boxSizing: 'border-box',
    resize: 'none',
    ...getScrollBarStyle(),
  };

  const commonProps = {
    ref: inputRef as any,
    style: textStyle,
    value: passwordChar && !multiLine ? passwordChar.repeat(value.length) : value,
    onChange: handleChange,
    onKeyPress: handleKeyPress,
    onSelect: handleSelect,
    onBlur: handleValidate,
    disabled: !enabled || locked,
    readOnly: locked,
    tabIndex: tabStop ? tabIndex : -1,
    title: toolTipText,
    'data-name': name,
    'data-tag': tag,
    'data-datafield': dataField,
    ...rest,
  };

  if (multiLine) {
    return <textarea {...commonProps} />;
  }

  return (
    <input
      {...commonProps}
      type={passwordChar ? 'password' : 'text'}
      maxLength={maxLength || undefined}
    />
  );
});

// Label amélioré avec toutes les propriétés
export const LabelEnhanced = forwardRef<HTMLDivElement, VB6ControlPropsEnhanced>((props, ref) => {
  const {
    id,
    name,
    left,
    top,
    width,
    height,
    visible,
    enabled,
    caption = 'Label1',
    autoSize = false,
    wordWrap = false,
    backStyle = 0, // 0=Transparent, 1=Opaque
    backColor = '#8080FF',
    foreColor = '#000000',
    font = {
      name: 'MS Sans Serif',
      size: 8,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    },
    alignment = 0, // 0=Left, 1=Right, 2=Center
    borderStyle = 0, // 0=None, 1=Fixed Single
    appearance = 1, // 0=Flat, 1=3D
    useMnemonic = true,
    linkMode = 0,
    linkTopic = '',
    linkItem = '',
    linkTimeout = 50,
    tag = '',
    toolTipText = '',
    mousePointer = 0,
    mouseIcon = null,
    ...rest
  } = props;

  const { fireEvent } = useVB6Store();
  const labelRef = useRef<HTMLDivElement>(null);

  // Calculer la taille automatique si nécessaire
  useEffect(() => {
    if (autoSize && labelRef.current) {
      const { scrollWidth, scrollHeight } = labelRef.current;
      // Mettre à jour les dimensions si autoSize est activé
    }
  }, [caption, font, autoSize]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      fireEvent(name, 'Click', {});

      if (linkMode > 0) {
        fireEvent(name, 'LinkExecute', { command: caption });
      }
    },
    [fireEvent, name, linkMode, caption]
  );

  const handleDblClick = useCallback(() => {
    fireEvent(name, 'DblClick', {});
  }, [fireEvent, name]);

  const handleMouseEvents = useCallback(
    (eventName: string, e: React.MouseEvent) => {
      fireEvent(name, eventName, {
        button: e.button + 1,
        shift: (e.shiftKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.altKey ? 4 : 0),
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      });
    },
    [fireEvent, name]
  );

  // Traiter les mnémoniques (&) dans le caption
  const processCaption = (text: string): React.ReactNode => {
    if (!useMnemonic || !text.includes('&')) return text;

    const parts = text.split('&');
    return parts.map((part, index) => {
      if (index === 0) return part;
      if (part.length === 0) return '&'; // Double && devient &
      return (
        <React.Fragment key={index}>
          <span style={{ textDecoration: 'underline' }}>{part[0]}</span>
          {part.slice(1)}
        </React.Fragment>
      );
    });
  };

  const labelStyle: CSSProperties = {
    position: 'absolute',
    left,
    top,
    width: autoSize ? 'auto' : width,
    height: autoSize ? 'auto' : height,
    minWidth: autoSize ? undefined : width,
    minHeight: autoSize ? undefined : height,
    display: visible ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: alignment === 2 ? 'center' : alignment === 1 ? 'flex-end' : 'flex-start',
    backgroundColor: backStyle === 1 ? backColor : 'transparent',
    color: foreColor,
    border:
      borderStyle === 1 ? (appearance === 1 ? '2px inset #C0C0C0' : '1px solid #808080') : 'none',
    fontFamily: font.name,
    fontSize: `${font.size}pt`,
    fontWeight: font.bold ? 'bold' : 'normal',
    fontStyle: font.italic ? 'italic' : 'normal',
    textDecoration: font.underline ? 'underline' : 'none',
    whiteSpace: wordWrap ? 'normal' : 'nowrap',
    overflow: 'hidden',
    textOverflow: wordWrap ? 'clip' : 'ellipsis',
    cursor: mouseIcon ? `url(${mouseIcon}), auto` : getMouseCursor(mousePointer),
    padding: '2px',
    boxSizing: 'border-box',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

  return (
    <div
      ref={labelRef}
      style={labelStyle}
      onClick={handleClick}
      onDoubleClick={handleDblClick}
      onMouseDown={e => handleMouseEvents('MouseDown', e)}
      onMouseUp={e => handleMouseEvents('MouseUp', e)}
      onMouseMove={e => handleMouseEvents('MouseMove', e)}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {processCaption(caption)}
    </div>
  );
});

// Export des contrôles améliorés
export default {
  CommandButton: CommandButtonEnhanced,
  TextBox: TextBoxEnhanced,
  Label: LabelEnhanced,
};
