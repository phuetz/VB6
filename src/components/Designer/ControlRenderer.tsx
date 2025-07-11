import React, { useCallback } from 'react';
import { useVB6 } from '../../context/VB6Context';
import { Control } from '../../context/types';
import ResizeHandles from './ResizeHandles';

interface ControlRendererProps {
  control: Control;
}

const ControlRenderer: React.FC<ControlRendererProps> = ({ control }) => {
  const { state, dispatch, updateControl, executeEvent } = useVB6();

  const isSelected = state.selectedControls.find(sc => sc.id === control.id);

  const handleControlClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Prevent interference with drag and drop
      if (state.isDragging) {
        return;
      }

      if (state.executionMode === 'design') {
        if (!e.ctrlKey && !isSelected) {
          dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: [control.id] } });
        } else if (e.ctrlKey) {
          const currentIds = state.selectedControls.map(c => c.id);
          const newIds = isSelected
            ? currentIds.filter(id => id !== control.id)
            : [...currentIds, control.id];
          dispatch({ type: 'SELECT_CONTROLS', payload: { controlIds: newIds } });
        }
      } else {
        executeEvent(control, 'Click');
      }
    },
    [
      state.executionMode,
      state.selectedControls,
      isSelected,
      control,
      dispatch,
      executeEvent,
      state.isDragging,
    ]
  );

  const handleControlDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (state.executionMode === 'run') {
        executeEvent(control, 'DblClick');
      } else {
        // Open code editor
        dispatch({ type: 'TOGGLE_WINDOW', payload: { windowName: 'showCodeEditor' } });
        dispatch({ type: 'SET_SELECTED_EVENT', payload: { eventName: 'Click' } });
      }
    },
    [state.executionMode, control, executeEvent, dispatch]
  );

  const handleControlChange = useCallback(
    (value: any, property = 'value') => {
      updateControl(control.id, property, value);
      if (state.executionMode === 'run') {
        executeEvent(control, 'Change', { Value: value });
      }
    },
    [control.id, state.executionMode, updateControl, executeEvent]
  );

  // Base style
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: control.x,
    top: control.y,
    cursor: state.executionMode === 'run' ? 'default' : 'move',
    userSelect: state.executionMode === 'run' ? 'auto' : 'none',
    opacity: control.enabled ? 1 : 0.5,
    zIndex: control.tabIndex || control.id,
    border: isSelected && state.executionMode === 'design' ? '1px dashed #0066cc' : undefined,
  };

  // Render specific control types
  const renderControl = () => {
    switch (control.type) {
      case 'CommandButton':
        return (
          <button
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              color: control.foreColor,
              fontSize: `${control.font?.size || 8}pt`,
              fontFamily: control.font?.name || 'MS Sans Serif',
              fontWeight: control.font?.bold ? 'bold' : 'normal',
              fontStyle: control.font?.italic ? 'italic' : 'normal',
              border: '1px solid #000',
              boxShadow: 'inset 1px 1px 0 #fff, inset -1px -1px 0 #808080',
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
            disabled={!control.enabled}
          >
            {control.caption}
          </button>
        );

      case 'Label':
        return (
          <div
            style={{
              ...baseStyle,
              width: control.autoSize ? 'auto' : control.width,
              height: control.autoSize ? 'auto' : control.height,
              backgroundColor: control.backStyle === 1 ? control.backColor : 'transparent',
              color: control.foreColor,
              fontSize: `${control.font?.size || 8}pt`,
              fontFamily: control.font?.name || 'MS Sans Serif',
              fontWeight: control.font?.bold ? 'bold' : 'normal',
              fontStyle: control.font?.italic ? 'italic' : 'normal',
              textAlign:
                control.alignment === 0 ? 'left' : control.alignment === 1 ? 'right' : 'center',
              whiteSpace: control.wordWrap ? 'normal' : 'nowrap',
              overflow: 'hidden',
              padding: '2px',
              border: control.borderStyle === 1 ? '1px solid #000' : 'none',
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            {control.caption}
          </div>
        );

      case 'TextBox':
        if (control.multiLine) {
          return (
            <div style={{ ...baseStyle, width: control.width, height: control.height }}>
              <textarea
                value={control.text || ''}
                onChange={e => handleControlChange(e.target.value, 'text')}
                style={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #000',
                  backgroundColor: control.backColor,
                  color: control.foreColor,
                  fontSize: `${control.font?.size || 8}pt`,
                  fontFamily: control.font?.name || 'MS Sans Serif',
                  resize: 'none',
                  outline: 'none',
                }}
                onClick={handleControlClick}
                onDoubleClick={handleControlDoubleClick}
                readOnly={control.locked || !control.enabled}
              />
            </div>
          );
        } else {
          return (
            <div style={{ ...baseStyle, width: control.width, height: control.height }}>
              <input
                type={control.passwordChar ? 'password' : 'text'}
                value={control.text || ''}
                onChange={e => handleControlChange(e.target.value, 'text')}
                maxLength={control.maxLength || undefined}
                style={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #000',
                  backgroundColor: control.backColor,
                  color: control.foreColor,
                  fontSize: `${control.font?.size || 8}pt`,
                  fontFamily: control.font?.name || 'MS Sans Serif',
                  outline: 'none',
                  padding: '2px',
                }}
                onClick={handleControlClick}
                onDoubleClick={handleControlDoubleClick}
                readOnly={control.locked || !control.enabled}
              />
            </div>
          );
        }

      case 'CheckBox':
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            <input
              type="checkbox"
              checked={control.value === 1}
              onChange={e => handleControlChange(e.target.checked ? 1 : 0, 'value')}
              disabled={!control.enabled}
            />
            <span
              style={{
                color: control.foreColor,
                fontSize: `${control.font?.size || 8}pt`,
                fontFamily: control.font?.name || 'MS Sans Serif',
              }}
            >
              {control.caption}
            </span>
          </div>
        );

      case 'OptionButton':
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            <input
              type="radio"
              checked={!!control.value}
              onChange={e => handleControlChange(e.target.checked, 'value')}
              disabled={!control.enabled}
              name={control.groupName || control.name}
            />
            <span
              style={{
                color: control.foreColor,
                fontSize: `${control.font?.size || 8}pt`,
                fontFamily: control.font?.name || 'MS Sans Serif',
              }}
            >
              {control.caption}
            </span>
          </div>
        );

      case 'ComboBox':
        return (
          <div
            style={{ ...baseStyle, width: control.width, height: control.height }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            <select
              value={control.text || ''}
              onChange={e => handleControlChange(e.target.value, 'text')}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: control.backColor,
                color: control.foreColor,
                fontSize: `${control.font?.size || 8}pt`,
                fontFamily: control.font?.name || 'MS Sans Serif',
              }}
              disabled={!control.enabled}
            >
              {(control.items || []).map((item: string, idx: number) => (
                <option key={idx} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        );

      case 'Frame':
        return (
          <fieldset
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              border: '1px solid #808080',
              padding: '8px',
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            <legend
              style={{
                color: control.foreColor,
                fontSize: `${control.font?.size || 8}pt`,
                fontFamily: control.font?.name || 'MS Sans Serif',
                padding: '0 4px',
              }}
            >
              {control.caption}
            </legend>
          </fieldset>
        );

      case 'PictureBox':
        return (
          <div
            style={{
              ...baseStyle,
              width: control.autoSize && control.picture ? 'auto' : control.width,
              height: control.autoSize && control.picture ? 'auto' : control.height,
              backgroundColor: control.backColor,
              border: control.borderStyle === 1 ? '1px solid #000' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            {control.picture ? (
              <img
                src={control.picture}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: '10px', color: '#555' }}>PictureBox</span>
            )}
          </div>
        );

      default:
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width || 100,
              height: control.height || 30,
              backgroundColor: control.backColor || '#C0C0C0',
              border: '1px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontFamily: control.font?.name || 'MS Sans Serif',
              color: control.foreColor || '#000000',
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            {control.caption || control.type}
          </div>
        );
    }
  };

  if (!control.visible) {
    return null;
  }

  return (
    <div className="relative">
      {renderControl()}
      {isSelected && state.executionMode === 'design' && <ResizeHandles control={control} />}
    </div>
  );
};

export default ControlRenderer;
