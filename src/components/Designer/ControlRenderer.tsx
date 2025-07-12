import React, { useCallback, useEffect } from 'react';
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

  // Timer interval handling
  useEffect(() => {
    if (
      control.type === 'Timer' &&
      state.executionMode === 'run' &&
      control.enabled &&
      control.interval > 0
    ) {
      const handle = setInterval(() => {
        executeEvent(control, 'Timer');
      }, control.interval);
      return () => clearInterval(handle);
    }
  }, [control, state.executionMode, executeEvent]);

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

      case 'ListBox':
        return (
          <div
            style={{ ...baseStyle, width: control.width, height: control.height }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            <select
              multiple={control.multiSelect > 0}
              value={control.value || (control.multiSelect > 0 ? [] : '')}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions).map(o => o.value);
                handleControlChange(control.multiSelect > 0 ? options : options[0], 'value');
              }}
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

      case 'HScrollBar':
        return (
          <input
            type="range"
            min={control.min}
            max={control.max}
            value={control.value}
            onChange={e =>
              handleControlChange(Number(e.target.value), 'value')
            }
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
            disabled={!control.enabled}
          />
        );

      case 'VScrollBar':
        return (
          <input
            type="range"
            min={control.min}
            max={control.max}
            value={control.value}
            onChange={e =>
              handleControlChange(Number(e.target.value), 'value')
            }
            style={{
              ...baseStyle,
              width: control.height,
              height: control.width,
              transform: 'rotate(-90deg)',
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
            disabled={!control.enabled}
          />
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

      case 'Timer':
        return state.executionMode === 'design' ? (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              border: '1px dashed #666',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            ⏱
          </div>
        ) : null;

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

      case 'Image':
        return (
          <div
            style={{
              ...baseStyle,
              width: control.autoSize && control.picture ? 'auto' : control.width,
              height: control.autoSize && control.picture ? 'auto' : control.height,
              border: control.borderStyle === 1 ? '1px solid #000' : 'none',
              overflow: 'hidden'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            {control.picture ? (
              <img src={control.picture} style={{ width: '100%', height: '100%', objectFit: control.stretch ? 'fill' : 'contain' }} />
            ) : (
              <span style={{ fontSize: '10px', color: '#555' }}>Image</span>
            )}
          </div>
        );

      case 'Data':
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: '#f0f0f0',
              border: '1px solid #000',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '4px',
              fontSize: '10px',
              fontFamily: control.font?.name || 'MS Sans Serif'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            {control.name}
          </div>
        );

      case 'OLE':
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: '#ffffff',
              border: '1px dashed #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontFamily: control.font?.name || 'MS Sans Serif'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            OLE
          </div>
        );

      case 'DriveListBox':
      case 'DirListBox':
      case 'FileListBox':
        return (
          <div
            style={{ ...baseStyle, width: control.width, height: control.height }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            <select
              value={control.value}
              onChange={e => handleControlChange(e.target.value, 'value')}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: control.backColor,
                color: control.foreColor,
                fontSize: `${control.font?.size || 8}pt`,
                fontFamily: control.font?.name || 'MS Sans Serif'
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

      case 'ProgressBar':
        const percentage = ((control.value - control.min) / (control.max - control.min)) * 100;
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              border: '1px solid #000',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, percentage))}%`,
                height: '100%',
                backgroundColor: control.foreColor || '#0078D4'
              }}
            />
          </div>
        );

      case 'Slider':
        const orientation = control.orientation || 'horizontal';
        return (
          <input
            type="range"
            min={control.min}
            max={control.max}
            value={control.value}
            onChange={e => handleControlChange(Number(e.target.value), 'value')}
            style={{
              ...baseStyle,
              ...(orientation === 'vertical'
                ? { width: control.height, height: control.width, transform: 'rotate(-90deg)' }
                : { width: control.width, height: control.height })
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
            disabled={!control.enabled}
          />
        );

      case 'UpDown':
        return (
          <input
            type="number"
            min={control.min}
            max={control.max}
            step={control.increment || 1}
            value={control.value}
            onChange={e => handleControlChange(Number(e.target.value), 'value')}
            style={{ ...baseStyle, width: control.width, height: control.height }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
            disabled={!control.enabled}
          />
        );

      case 'TabStrip':
        const tabs = control.tabs || ['Tab1'];
        const selectedIndex = control.selectedIndex || 0;
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              border: '1px solid #000',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
              {tabs.map((tab: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => handleControlChange(idx, 'selectedIndex')}
                  style={{
                    padding: '2px 8px',
                    cursor: 'pointer',
                    backgroundColor: selectedIndex === idx ? control.foreColor || '#0078D4' : control.backColor,
                    color: selectedIndex === idx ? '#fff' : '#000',
                    borderRight: '1px solid #000',
                    fontSize: `${control.font?.size || 8}pt`,
                    fontFamily: control.font?.name || 'MS Sans Serif'
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }} />
          </div>
        );

      case 'Toolbar':
        const buttons = control.buttons || [];
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              border: '1px solid #000',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            {buttons.map((btn: string, idx: number) => (
              <button
                key={idx}
                style={{ marginRight: '2px', fontSize: '10px' }}
                disabled={!control.enabled}
              >
                {btn}
              </button>
            ))}
          </div>
        );

      case 'StatusBar':
        const panels = control.panels || ['Ready'];
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              border: '1px solid #000',
              display: 'flex',
              fontSize: '10px'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            {panels.map((p: string, idx: number) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  padding: '0 4px',
                  borderLeft: idx > 0 ? '1px solid #808080' : undefined
                }}
              >
                {p}
              </div>
            ))}
          </div>
        );

      case 'ListView':
        const columns = control.columns || [];
        const lvItems = control.items || [];
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              color: control.foreColor,
              fontSize: `${control.font?.size || 8}pt`,
              fontFamily: control.font?.name || 'MS Sans Serif',
              border: '1px solid #000',
              overflow: 'auto'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {columns.map((c: string, idx: number) => (
                    <th
                      key={idx}
                      style={{ border: '1px solid #000', padding: '2px', background: '#e0e0e0', textAlign: 'left' }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lvItems.map((item: any, idx: number) => (
                  <tr key={idx}>
                    {[item.text, ...(item.subItems || [])].slice(0, Math.max(columns.length, 1)).map((val: string, cidx: number) => (
                      <td key={cidx} style={{ border: '1px solid #000', padding: '2px' }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'DateTimePicker':
        return (
          <input
            type="datetime-local"
            value={control.value || ''}
            onChange={e => handleControlChange(e.target.value, 'value')}
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              color: control.foreColor,
              fontSize: `${control.font?.size || 8}pt`,
              fontFamily: control.font?.name || 'MS Sans Serif',
              border: '1px solid #000'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
            disabled={!control.enabled}
          />
        );

      case 'MonthView':
        return (
          <input
            type="date"
            value={control.value || ''}
            onChange={e => handleControlChange(e.target.value, 'value')}
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              color: control.foreColor,
              fontSize: `${control.font?.size || 8}pt`,
              fontFamily: control.font?.name || 'MS Sans Serif',
              border: '1px solid #000'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
            disabled={!control.enabled}
          />
        );

      case 'ImageList':
        const images = control.images || [];
        const imgW = control.imageWidth || 16;
        const imgH = control.imageHeight || 16;
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              border: '1px solid #000',
              display: 'flex',
              flexWrap: 'wrap',
              alignContent: 'flex-start',
              overflow: 'auto'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            {images.map((src: string, idx: number) => (
              <img key={idx} src={src} style={{ width: imgW, height: imgH }} />
            ))}
          </div>
        );

      case 'TreeView':
        const nodes = control.nodes || [];
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backColor,
              color: control.foreColor,
              fontSize: `${control.font?.size || 8}pt`,
              fontFamily: control.font?.name || 'MS Sans Serif',
              border: '1px solid #000',
              overflow: 'auto'
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          >
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {nodes.map((n: string, idx: number) => (
                <li key={idx}>{n}</li>
              ))}
            </ul>
          </div>
        );

      case 'Shape':
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.height,
              backgroundColor: control.backStyle === 1 ? control.backColor : 'transparent',
              border: control.borderStyle === 1 ? `${control.borderWidth}px solid ${control.borderColor}` : 'none',
              borderRadius: control.shape === 2 || control.shape === 3 ? '50%' : 0
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          />
        );

      case 'Line':
        return (
          <div
            style={{
              ...baseStyle,
              width: control.width,
              height: control.borderWidth,
              backgroundColor: control.borderColor
            }}
            onClick={handleControlClick}
            onDoubleClick={handleControlDoubleClick}
          />
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
