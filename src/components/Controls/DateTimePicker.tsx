import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Control } from '../../context/types';

interface DateTimePickerProps {
  control: Control;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (corner: string, deltaX: number, deltaY: number) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  control,
  selected,
  onSelect,
  onDoubleClick,
  onMove,
  onResize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const properties = control.properties || {};

  // VB6 DateTimePicker Properties
  const value = properties.Value ? new Date(properties.Value) : new Date();
  const format = properties.Format || 0; // 0=Long, 1=Short, 2=Time, 3=Custom
  const customFormat = properties.CustomFormat || '';
  const maxDate = properties.MaxDate ? new Date(properties.MaxDate) : new Date(2999, 11, 31);
  const minDate = properties.MinDate ? new Date(properties.MinDate) : new Date(1753, 0, 1);
  const showUpDown = properties.ShowUpDown === true;
  const rightToLeft = properties.RightToLeft === true;
  const showCheckBox = properties.ShowCheckBox === true;
  const checked = properties.Checked !== false;
  const calendarForeColor = properties.CalendarForeColor || 0x000000;
  const calendarBackColor = properties.CalendarBackColor || 0xFFFFFF;
  const calendarTitleForeColor = properties.CalendarTitleForeColor || 0xFFFFFF;
  const calendarTitleBackColor = properties.CalendarTitleBackColor || 0x800000;

  const [currentValue, setCurrentValue] = useState(value);
  const [currentMonth, setCurrentMonth] = useState(value.getMonth());
  const [currentYear, setCurrentYear] = useState(value.getFullYear());
  const [isChecked, setIsChecked] = useState(checked);

  // Convert VB6 color format to CSS
  const vb6ColorToCss = useCallback((vb6Color: number): string => {
    const r = vb6Color & 0xFF;
    const g = (vb6Color >> 8) & 0xFF;
    const b = (vb6Color >> 16) & 0xFF;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, []);

  // Format date based on format property
  const formatDate = useCallback((date: Date): string => {
    if (!isChecked && showCheckBox) return '';

    switch (format) {
      case 0: // Long date
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 1: // Short date
        return date.toLocaleDateString('en-US');
      case 2: // Time
        return date.toLocaleTimeString('en-US');
      case 3: // Custom
        if (customFormat) {
          // Simple custom format implementation
          let formatted = customFormat;
          formatted = formatted.replace(/yyyy/g, date.getFullYear().toString());
          formatted = formatted.replace(/yy/g, date.getFullYear().toString().slice(-2));
          formatted = formatted.replace(/MM/g, (date.getMonth() + 1).toString().padStart(2, '0'));
          formatted = formatted.replace(/M/g, (date.getMonth() + 1).toString());
          formatted = formatted.replace(/dd/g, date.getDate().toString().padStart(2, '0'));
          formatted = formatted.replace(/d/g, date.getDate().toString());
          formatted = formatted.replace(/HH/g, date.getHours().toString().padStart(2, '0'));
          formatted = formatted.replace(/H/g, date.getHours().toString());
          formatted = formatted.replace(/mm/g, date.getMinutes().toString().padStart(2, '0'));
          formatted = formatted.replace(/m/g, date.getMinutes().toString());
          formatted = formatted.replace(/ss/g, date.getSeconds().toString().padStart(2, '0'));
          formatted = formatted.replace(/s/g, date.getSeconds().toString());
          return formatted;
        }
        return date.toLocaleDateString('en-US');
      default:
        return date.toLocaleDateString('en-US');
    }
  }, [format, customFormat, isChecked, showCheckBox]);

  // Handle value change
  const handleValueChange = useCallback((newValue: Date) => {
    if (newValue < minDate || newValue > maxDate) return;

    setCurrentValue(newValue);
    setCurrentMonth(newValue.getMonth());
    setCurrentYear(newValue.getFullYear());

    // Update control value
    if (control.events?.onChange) {
      control.events.onChange('Value', newValue.toISOString());
    }

    // Trigger VB6 events
    if (control.events?.Change) {
      control.events.Change();
    }
  }, [minDate, maxDate, control.events]);

  // Handle up/down button clicks
  const handleUpDown = useCallback((direction: 'up' | 'down') => {
    if (!isChecked && showCheckBox) return;

    const newValue = new Date(currentValue);
    
    if (format === 2) { // Time format
      if (direction === 'up') {
        newValue.setMinutes(newValue.getMinutes() + 1);
      } else {
        newValue.setMinutes(newValue.getMinutes() - 1);
      }
    } else { // Date formats
      if (direction === 'up') {
        newValue.setDate(newValue.getDate() + 1);
      } else {
        newValue.setDate(newValue.getDate() - 1);
      }
    }

    handleValueChange(newValue);
  }, [currentValue, format, isChecked, showCheckBox, handleValueChange]);

  // Generate calendar days
  const generateCalendarDays = useCallback((year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  }, []);

  // Handle calendar date click
  const handleCalendarDateClick = useCallback((date: Date) => {
    // Preserve time part if in time mode
    const newValue = new Date(date);
    if (format === 2) {
      newValue.setHours(currentValue.getHours());
      newValue.setMinutes(currentValue.getMinutes());
      newValue.setSeconds(currentValue.getSeconds());
    } else {
      newValue.setHours(currentValue.getHours());
      newValue.setMinutes(currentValue.getMinutes());
      newValue.setSeconds(currentValue.getSeconds());
    }

    handleValueChange(newValue);
    setShowCalendar(false);
  }, [format, currentValue, handleValueChange]);

  // Navigate calendar months
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  }, [currentMonth, currentYear]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();

    if (e.detail === 2) {
      onDoubleClick();
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on resize handles
    const handleSize = 8;
    const isOnRightEdge = x >= control.width - handleSize;
    const isOnBottomEdge = y >= control.height - handleSize;
    const isOnLeftEdge = x <= handleSize;
    const isOnTopEdge = y <= handleSize;

    if (selected && (isOnRightEdge || isOnBottomEdge || isOnLeftEdge || isOnTopEdge)) {
      setIsResizing(true);
      let corner = '';
      if (isOnTopEdge && isOnLeftEdge) corner = 'nw';
      else if (isOnTopEdge && isOnRightEdge) corner = 'ne';
      else if (isOnBottomEdge && isOnLeftEdge) corner = 'sw';
      else if (isOnBottomEdge && isOnRightEdge) corner = 'se';
      else if (isOnTopEdge) corner = 'n';
      else if (isOnBottomEdge) corner = 's';
      else if (isOnLeftEdge) corner = 'w';
      else if (isOnRightEdge) corner = 'e';
      setResizeCorner(corner);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Global mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (isDragging) {
        onMove(deltaX, deltaY);
      } else if (isResizing) {
        onResize(resizeCorner, deltaX, deltaY);
      }

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeCorner('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeCorner, onMove, onResize]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: control.left,
    top: control.top,
    width: control.width,
    height: control.height,
    border: selected ? '2px dashed #0066cc' : '1px inset #c0c0c0',
    backgroundColor: properties.BackColor || '#ffffff',
    cursor: isDragging ? 'move' : 'default',
    fontFamily: properties.FontName || 'MS Sans Serif',
    fontSize: `${properties.FontSize || 8}pt`,
    color: properties.ForeColor || '#000000',
    display: 'flex',
    alignItems: 'center',
    direction: rightToLeft ? 'rtl' : 'ltr'
  };

  const textStyle: React.CSSProperties = {
    flex: 1,
    padding: '2px 4px',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: (!isChecked && showCheckBox) ? '#808080' : 'inherit',
    textAlign: rightToLeft ? 'right' : 'left'
  };

  const buttonStyle: React.CSSProperties = {
    width: 17,
    height: '100%',
    backgroundColor: '#c0c0c0',
    border: '1px outset #c0c0c0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8pt',
    userSelect: 'none'
  };

  const calendarDays = generateCalendarDays(currentYear, currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <>
      <div
        ref={containerRef}
        style={containerStyle}
        onMouseDown={handleMouseDown}
        className="vb6-datetimepicker"
      >
        {/* Checkbox */}
        {showCheckBox && (
          <div style={{ padding: '0 4px' }}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                setIsChecked(e.target.checked);
                if (control.events?.onChange) {
                  control.events.onChange('Checked', e.target.checked);
                }
              }}
              style={{ cursor: 'pointer' }}
            />
          </div>
        )}

        {/* Date/Time display */}
        <input
          type="text"
          value={formatDate(currentValue)}
          readOnly
          style={textStyle}
          onClick={() => {
            if (!showUpDown && (isChecked || !showCheckBox)) {
              setShowCalendar(true);
            }
          }}
        />

        {/* Up/Down buttons or Dropdown button */}
        {showUpDown ? (
          <div style={{ display: 'flex', flexDirection: 'column', width: 17, height: '100%' }}>
            <button
              style={{
                ...buttonStyle,
                height: '50%',
                fontSize: '6pt',
                borderBottom: '1px solid #808080'
              }}
              onClick={() => handleUpDown('up')}
              disabled={!isChecked && showCheckBox}
            >
              ▲
            </button>
            <button
              style={{
                ...buttonStyle,
                height: '50%',
                fontSize: '6pt',
                borderTop: 'none'
              }}
              onClick={() => handleUpDown('down')}
              disabled={!isChecked && showCheckBox}
            >
              ▼
            </button>
          </div>
        ) : (
          <button
            style={buttonStyle}
            onClick={() => {
              if (isChecked || !showCheckBox) {
                setShowCalendar(!showCalendar);
              }
            }}
            disabled={!isChecked && showCheckBox}
          >
            ▼
          </button>
        )}

        {/* Resize handles */}
        {selected && (
          <>
            <div className="vb6-resize-handle nw" style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'nw-resize' }} />
            <div className="vb6-resize-handle ne" style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'ne-resize' }} />
            <div className="vb6-resize-handle sw" style={{ position: 'absolute', bottom: -4, left: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'sw-resize' }} />
            <div className="vb6-resize-handle se" style={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'se-resize' }} />
            <div className="vb6-resize-handle n" style={{ position: 'absolute', top: -4, left: '50%', marginLeft: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'n-resize' }} />
            <div className="vb6-resize-handle s" style={{ position: 'absolute', bottom: -4, left: '50%', marginLeft: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 's-resize' }} />
            <div className="vb6-resize-handle w" style={{ position: 'absolute', top: '50%', left: -4, marginTop: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'w-resize' }} />
            <div className="vb6-resize-handle e" style={{ position: 'absolute', top: '50%', right: -4, marginTop: -4, width: 8, height: 8, backgroundColor: '#0066cc', cursor: 'e-resize' }} />
          </>
        )}
      </div>

      {/* Calendar dropdown */}
      {showCalendar && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            left: control.left,
            top: control.top + control.height,
            width: 200,
            backgroundColor: vb6ColorToCss(calendarBackColor),
            border: '1px solid #808080',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            zIndex: 1000,
            fontFamily: 'MS Sans Serif',
            fontSize: '8pt'
          }}
        >
          {/* Calendar title */}
          <div
            style={{
              backgroundColor: vb6ColorToCss(calendarTitleBackColor),
              color: vb6ColorToCss(calendarTitleForeColor),
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 'bold'
            }}
          >
            <button
              onClick={() => navigateMonth('prev')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '12pt',
                padding: 0
              }}
            >
              ◀
            </button>
            
            <span>{monthNames[currentMonth]} {currentYear}</span>
            
            <button
              onClick={() => navigateMonth('next')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '12pt',
                padding: 0
              }}
            >
              ▶
            </button>
          </div>

          {/* Day headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              backgroundColor: '#e0e0e0',
              borderBottom: '1px solid #808080',
              fontSize: '7pt',
              fontWeight: 'bold'
            }}
          >
            {dayNames.map(day => (
              <div key={day} style={{ padding: '2px', textAlign: 'center' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: 'repeat(6, 1fr)'
            }}
          >
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth;
              const isSelected = date.toDateString() === currentValue.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  style={{
                    padding: '2px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#316AC5' : 'transparent',
                    color: isSelected ? 'white' : 
                           !isCurrentMonth ? '#808080' : vb6ColorToCss(calendarForeColor),
                    border: isToday ? '1px solid red' : '1px solid transparent',
                    fontSize: '8pt',
                    minHeight: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => handleCalendarDateClick(date)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#E0E0E0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>

          {/* Today button */}
          <div
            style={{
              borderTop: '1px solid #808080',
              padding: '2px 4px',
              backgroundColor: '#f0f0f0',
              fontSize: '7pt',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => {
              const today = new Date();
              handleCalendarDateClick(today);
            }}
          >
            Today: {new Date().toLocaleDateString()}
          </div>
        </div>
      )}
    </>
  );
};

export default DateTimePicker;