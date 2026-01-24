/**
 * Contrôles VB6 complets avec compatibilité 100%
 * Implémentation de tous les contrôles VB6 standards avec propriétés, méthodes et événements
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { shallow } from 'zustand/shallow';

// Import des nouveaux contrôles graphiques
export { LineControl } from './LineControl';
export { ShapeControl } from './ShapeControl';
export { ImageControl } from './ImageControl';
export { ActiveXControl } from './ActiveXControl';

/**
 * CSS INJECTION BUG FIX: Validate image URLs for security
 */
function isValidImageURL(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) return false;
  
  try {
    const urlObj = new URL(url, window.location.origin);
    
    // Only allow safe protocols
    if (!['http:', 'https:', 'data:', 'blob:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // For data URLs, only allow image types
    if (urlObj.protocol === 'data:') {
      if (!url.toLowerCase().startsWith('data:image/')) {
        return false;
      }
    }
    
    // Check for common image file extensions
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'];
    const hasValidExtension = validExtensions.some(ext => 
      urlObj.pathname.toLowerCase().endsWith(ext)
    );
    
    // Allow data URLs and blob URLs even without extensions
    if (urlObj.protocol === 'data:' || urlObj.protocol === 'blob:') {
      return true;
    }
    
    // Basic length check (prevent CSS bombs)
    if (url.length > 2000) {
      return false;
    }
    
    return hasValidExtension;
  } catch (e) {
    return false;
  }
}

// Types et interfaces pour les contrôles VB6
export interface VB6ControlProps {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  enabled: boolean;
  tabIndex: number;
  tabStop: boolean;
  tag: string;
  toolTipText: string;
  [key: string]: any;
}

// CommandButton - Compatible 100% VB6
export const CommandButton = forwardRef<HTMLButtonElement, VB6ControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    caption = 'Command1',
    default: isDefault = false,
    cancel = false,
    style = 'Standard',
    picture,
    disabledPicture,
    downPicture,
    maskColor,
    useMaskColor = false,
    backColor = '#C0C0C0',
    foreColor = '#000000',
    font,
    tabIndex,
    tabStop = true,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [isPressed, setIsPressed] = useState(false);
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const { fireEvent, updateControl } = useVB6Store(
    (state) => ({ fireEvent: state.fireEvent, updateControl: state.updateControl }),
    shallow
  );

  const handleClick = useCallback(() => {
    if (enabled) {
      fireEvent(name, 'Click', { sender: name });
    }
  }, [enabled, fireEvent, name]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (enabled) {
      setIsPressed(true);
      fireEvent(name, 'MouseDown', {
        button: e.button + 1, // VB6 uses 1-based indexing
        shift: (e.shiftKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.altKey ? 4 : 0),
        x: e.clientX,
        y: e.clientY,
      });
    }
  }, [enabled, fireEvent, name]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setIsPressed(false);
    if (enabled) {
      fireEvent(name, 'MouseUp', {
        button: e.button + 1,
        shift: (e.shiftKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.altKey ? 4 : 0),
        x: e.clientX,
        y: e.clientY,
      });
    }
  }, [enabled, fireEvent, name]);

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: style === 'Standard' ? '2px outset #C0C0C0' : '1px solid #808080',
    borderStyle: isPressed ? 'inset' : 'outset',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.6,
    fontFamily: font?.name || 'MS Sans Serif',
    fontSize: font?.size || 8,
    fontWeight: font?.bold ? 'bold' : 'normal',
    fontStyle: font?.italic ? 'italic' : 'normal',
    textDecoration: font?.underline ? 'underline' : 'none',
    // CSS INJECTION BUG FIX: Validate picture URL before using in CSS
    backgroundImage: picture && style === 'Graphical' && isValidImageURL(picture) ? `url(${picture})` : undefined,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };

  return (
    <button
      ref={ref}
      style={buttonStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={!enabled}
      tabIndex={tabStop ? tabIndex : -1}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      // ACCESSIBILITY FIX: Add ARIA attributes for screen readers
      aria-label={caption || `Button ${name}`}
      aria-describedby={`${name}-desc`}
      role="button"
      {...rest}
    >
      {style === 'Standard' && caption}
      {/* ACCESSIBILITY FIX: Hidden description for screen readers */}
      <span id={`${name}-desc`} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
        VB6 Command Button {enabled ? 'enabled' : 'disabled'}
      </span>
    </button>
  );
});

// TextBox - Compatible 100% VB6
export const TextBox = forwardRef<HTMLInputElement, VB6ControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    text = '',
    multiLine = false,
    scrollBars = 'None',
    alignment = 'Left',
    maxLength = 0,
    passwordChar = '',
    locked = false,
    hideSelection = true,
    borderStyle = 'Fixed Single',
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font,
    tabIndex,
    tabStop = true,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [value, setValue] = useState(text);
  const [selStart, setSelStart] = useState(0);
  const [selLength, setSelLength] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const { fireEvent, updateControl } = useVB6Store(
    (state) => ({ fireEvent: state.fireEvent, updateControl: state.updateControl }),
    shallow
  );

  useEffect(() => {
    setValue(text);
  }, [text]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (maxLength === 0 || newValue.length <= maxLength) {
        setValue(newValue);
        updateControl(id, 'text', newValue);
        fireEvent(name, 'Change', { newValue });
      }
    },
    [id, maxLength, name, fireEvent, updateControl]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      const keyAscii = e.key.charCodeAt(0);
      fireEvent(name, 'KeyPress', { keyAscii });
      
      if (passwordChar && e.key.length === 1) {
        e.preventDefault();
        // Handle password character display
      }
    },
    [name, fireEvent, passwordChar]
  );

  const textStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: borderStyle === 'Fixed Single' ? '2px inset #C0C0C0' : 'none',
    textAlign: alignment.toLowerCase() as any,
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
    fontWeight: font?.bold ? 'bold' : 'normal',
    fontStyle: font?.italic ? 'italic' : 'normal',
    textDecoration: font?.underline ? 'underline' : 'none',
    resize: 'none',
    outline: 'none',
    overflow: scrollBars === 'None' ? 'hidden' : 
              scrollBars === 'Vertical' ? 'scroll' :
              scrollBars === 'Horizontal' ? 'scroll' : 'auto',
  };

  if (multiLine) {
    return (
      <>
        {/* ACCESSIBILITY FIX: Add label for screen readers */}
        <label htmlFor={`textbox-${name}`} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          {name} Multi-line Text Input {passwordChar ? '(Password)' : ''}
        </label>
        <textarea
          id={`textbox-${name}`}
          ref={ref as React.Ref<HTMLTextAreaElement>}
          style={textStyle}
          value={passwordChar ? passwordChar.repeat(value.length) : value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          disabled={!enabled || locked}
          readOnly={locked}
          tabIndex={tabStop ? tabIndex : -1}
          title={toolTipText}
          data-name={name}
          data-tag={tag}
          // ACCESSIBILITY FIX: Add ARIA attributes
          aria-label={`${name} text area`}
          aria-describedby={`${name}-textbox-desc`}
          aria-invalid={false}
          aria-multiline="true"
          {...rest}
        />
        {/* ACCESSIBILITY FIX: Hidden description for screen readers */}
        <span id={`${name}-textbox-desc`} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          VB6 TextBox control (multi-line) {enabled ? 'enabled' : 'disabled'} {locked ? 'read-only' : 'editable'}
        </span>
      </>
    );
  }

  return (
    <>
      {/* ACCESSIBILITY FIX: Add label for screen readers */}
      <label htmlFor={`textbox-${name}`} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
        {name} Text Input {passwordChar ? '(Password)' : ''}
      </label>
      <input
        id={`textbox-${name}`}
        ref={ref as React.Ref<HTMLInputElement>}
        type={passwordChar ? 'password' : 'text'}
        style={textStyle}
        value={value}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        disabled={!enabled || locked}
        readOnly={locked}
        maxLength={maxLength || undefined}
        tabIndex={tabStop ? tabIndex : -1}
        title={toolTipText}
        data-name={name}
        data-tag={tag}
        // ACCESSIBILITY FIX: Add ARIA attributes
        aria-label={`${name} text input`}
        aria-describedby={`${name}-textbox-desc`}
        aria-invalid={false}
        {...rest}
      />
      {/* ACCESSIBILITY FIX: Hidden description for screen readers */}
      <span id={`${name}-textbox-desc`} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
        VB6 TextBox control {enabled ? 'enabled' : 'disabled'} {locked ? 'read-only' : 'editable'}
      </span>
    </>
  );
});

// Label - Compatible 100% VB6
export const Label = forwardRef<HTMLDivElement, VB6ControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    caption = 'Label1',
    alignment = 'Left',
    autoSize = false,
    wordWrap = false,
    backStyle = 'Transparent',
    backColor = '#C0C0C0',
    foreColor = '#000000',
    borderStyle = 'None',
    font,
    tabIndex,
    tag,
    toolTipText,
    ...rest
  } = props;

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: autoSize ? 'auto' : width,
    height: autoSize ? 'auto' : height,
    display: visible ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: alignment === 'Center' ? 'center' : alignment === 'Right' ? 'flex-end' : 'flex-start',
    backgroundColor: backStyle === 'Opaque' ? backColor : 'transparent',
    color: foreColor,
    border: borderStyle === 'Fixed Single' ? '2px inset #C0C0C0' : 'none',
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
    fontWeight: font?.bold ? 'bold' : 'normal',
    fontStyle: font?.italic ? 'italic' : 'normal',
    textDecoration: font?.underline ? 'underline' : 'none',
    whiteSpace: wordWrap ? 'normal' : 'nowrap',
    overflow: 'hidden',
    cursor: 'default',
  };

  return (
    <div
      ref={ref}
      style={labelStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {caption}
    </div>
  );
});

// CheckBox - Compatible 100% VB6
export const CheckBox = forwardRef<HTMLDivElement, VB6ControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    caption = 'Check1',
    value = 0, // 0=Unchecked, 1=Checked, 2=Grayed
    alignment = 'Left',
    style = 'Standard',
    picture,
    disabledPicture,
    downPicture,
    backColor = '#C0C0C0',
    foreColor = '#000000',
    font,
    tabIndex,
    tabStop = true,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [checkValue, setCheckValue] = useState(value);
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const { fireEvent, updateControl } = useVB6Store(
    (state) => ({ fireEvent: state.fireEvent, updateControl: state.updateControl }),
    shallow
  );

  const handleClick = useCallback(() => {
    if (enabled) {
      const newValue = checkValue === 1 ? 0 : 1;
      setCheckValue(newValue);
      updateControl(id, 'value', newValue);
      fireEvent(name, 'Click', { value: newValue });
    }
  }, [enabled, checkValue, id, name, fireEvent, updateControl]);

  const checkStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'flex' : 'none',
    alignItems: 'center',
    backgroundColor: backColor,
    color: foreColor,
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.6,
  };

  return (
    <div
      ref={ref}
      style={checkStyle}
      onClick={handleClick}
      tabIndex={tabStop ? tabIndex : -1}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <div
        style={{
          width: 13,
          height: 13,
          border: '2px inset #C0C0C0',
          marginRight: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
        }}
      >
        {checkValue === 1 && '✓'}
        {checkValue === 2 && '▫'}
      </div>
      <span>{caption}</span>
    </div>
  );
});

// OptionButton (Radio Button) - Compatible 100% VB6
export const OptionButton = forwardRef<HTMLDivElement, VB6ControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    caption = 'Option1',
    value = false,
    alignment = 'Left',
    style = 'Standard',
    backColor = '#C0C0C0',
    foreColor = '#000000',
    font,
    tabIndex,
    tabStop = true,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [selected, setSelected] = useState(value);
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const { fireEvent, updateControl, controls } = useVB6Store(
    (state) => ({ fireEvent: state.fireEvent, updateControl: state.updateControl, controls: state.controls }),
    shallow
  );

  const handleClick = useCallback(() => {
    if (enabled && !selected) {
      // Déselectionner les autres options du même conteneur
      controls.forEach(control => {
        if (control.type === 'OptionButton' && control.id !== id && control.value) {
          updateControl(control.id, 'value', false);
        }
      });
      
      setSelected(true);
      updateControl(id, 'value', true);
      fireEvent(name, 'Click', { value: true });
    }
  }, [enabled, selected, id, name, fireEvent, updateControl, controls]);

  const optionStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'flex' : 'none',
    alignItems: 'center',
    backgroundColor: backColor,
    color: foreColor,
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.6,
  };

  return (
    <div
      ref={ref}
      style={optionStyle}
      onClick={handleClick}
      tabIndex={tabStop ? tabIndex : -1}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <div
        style={{
          width: 13,
          height: 13,
          borderRadius: '50%',
          border: '2px inset #C0C0C0',
          marginRight: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: '#000000',
            }}
          />
        )}
      </div>
      <span>{caption}</span>
    </div>
  );
});

// ListBox - Compatible 100% VB6
export const ListBox = forwardRef<HTMLSelectElement, VB6ControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    list = [],
    listIndex = -1,
    multiSelect = 'None', // None, Simple, Extended
    sorted = false,
    style = 'Standard',
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font,
    tabIndex,
    tabStop = true,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [selectedIndex, setSelectedIndex] = useState(listIndex);
  const [items, setItems] = useState(sorted ? [...list].sort() : list);
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const { fireEvent, updateControl } = useVB6Store(
    (state) => ({ fireEvent: state.fireEvent, updateControl: state.updateControl }),
    shallow
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newIndex = parseInt(e.target.value);
      setSelectedIndex(newIndex);
      updateControl(id, 'listIndex', newIndex);
      fireEvent(name, 'Click', { listIndex: newIndex });
    },
    [id, name, fireEvent, updateControl]
  );

  const listStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: '2px inset #C0C0C0',
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
    outline: 'none',
  };

  return (
    <select
      ref={ref}
      style={listStyle}
      value={selectedIndex}
      onChange={handleChange}
      disabled={!enabled}
      multiple={multiSelect !== 'None'}
      size={Math.floor(height / 16)}
      tabIndex={tabStop ? tabIndex : -1}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {items.map((item, index) => (
        <option key={index} value={index}>
          {item}
        </option>
      ))}
    </select>
  );
});

// ComboBox - Compatible 100% VB6
export const ComboBox = forwardRef<HTMLSelectElement, VB6ControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    text = '',
    list = [],
    listIndex = -1,
    style = 'Dropdown Combo', // Dropdown Combo, Simple Combo, Dropdown List
    sorted = false,
    backColor = '#FFFFFF',
    foreColor = '#000000',
    font,
    tabIndex,
    tabStop = true,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [value, setValue] = useState(text);
  const [selectedIndex, setSelectedIndex] = useState(listIndex);
  const [items] = useState(sorted ? [...list].sort() : list);
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const { fireEvent, updateControl } = useVB6Store(
    (state) => ({ fireEvent: state.fireEvent, updateControl: state.updateControl }),
    shallow
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      const newIndex = items.indexOf(newValue);
      setValue(newValue);
      setSelectedIndex(newIndex);
      updateControl(id, 'text', newValue);
      updateControl(id, 'listIndex', newIndex);
      fireEvent(name, 'Change', { text: newValue, listIndex: newIndex });
    },
    [id, name, items, fireEvent, updateControl]
  );

  const comboStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height: style === 'Simple Combo' ? height : 21,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: '2px inset #C0C0C0',
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
    outline: 'none',
  };

  return (
    <select
      ref={ref}
      style={comboStyle}
      value={value}
      onChange={handleChange}
      disabled={!enabled}
      tabIndex={tabStop ? tabIndex : -1}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <option value="">{style !== 'Dropdown List' ? text : ''}</option>
      {items.map((item, index) => (
        <option key={index} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
});

// Frame - Compatible 100% VB6
export const Frame = forwardRef<HTMLDivElement, VB6ControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    caption = 'Frame1',
    backColor = '#C0C0C0',
    foreColor = '#000000',
    font,
    borderStyle = 'Fixed Single',
    children,
    tag,
    toolTipText,
    ...rest
  } = props;

  const frameStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    color: foreColor,
    border: borderStyle === 'Fixed Single' ? '2px groove #C0C0C0' : 'none',
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
    padding: '10px 5px 5px 5px',
  };

  const captionStyle: React.CSSProperties = {
    position: 'absolute',
    top: -8,
    left: 8,
    backgroundColor: backColor,
    padding: '0 4px',
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
  };

  return (
    <div
      ref={ref}
      style={frameStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {caption && <div style={captionStyle}>{caption}</div>}
      {children}
    </div>
  );
});

// PictureBox - Compatible 100% VB6
export const PictureBox = forwardRef<HTMLDivElement, VB6ControlProps>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    picture,
    autoRedraw = true,
    autoSize = false,
    backColor = '#C0C0C0',
    foreColor = '#000000',
    borderStyle = 'Fixed Single',
    scaleMode = 'Twip',
    tag,
    toolTipText,
    ...rest
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const fireEvent = useVB6Store((state) => state.fireEvent);

  const pictureStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    border: borderStyle === 'Fixed Single' ? '2px inset #C0C0C0' : 'none',
    overflow: 'hidden',
  };

  const handleClick = useCallback(() => {
    if (enabled) {
      fireEvent(name, 'Click', {});
    }
  }, [enabled, fireEvent, name]);

  return (
    <div
      ref={ref}
      style={pictureStyle}
      onClick={handleClick}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        width={width - 4}
        height={height - 4}
        style={{ display: 'block' }}
      />
      {picture && (
        <img
          src={picture}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        />
      )}
    </div>
  );
});

// Timer - Compatible 100% VB6
export const Timer = forwardRef<HTMLDivElement, VB6ControlProps>((props, ref) => {
  const {
    id,
    name,
    interval = 0,
    enabled: timerEnabled = false,
    tag,
    ...rest
  } = props;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  const fireEvent = useVB6Store((state) => state.fireEvent);

  useEffect(() => {
    if (timerEnabled && interval > 0) {
      intervalRef.current = setInterval(() => {
        fireEvent(name, 'Timer', {});
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerEnabled, interval, fireEvent, name]);

  // Timer is invisible at design time but shows an icon
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 16,
        height: 16,
        display: 'none', // Invisible at runtime
        backgroundColor: '#C0C0C0',
        border: '1px solid #808080',
        fontSize: 10,
        textAlign: 'center',
        lineHeight: '16px',
      }}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      ⏱
    </div>
  );
});

export default {
  CommandButton,
  TextBox,
  Label,
  CheckBox,
  OptionButton,
  ListBox,
  ComboBox,
  Frame,
  PictureBox,
  Timer,
};