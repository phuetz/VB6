/**
 * DTPicker Control - Complete VB6 DateTimePicker Control Implementation
 * Provides comprehensive date and time selection with full VB6 API compatibility
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// DTPicker Constants
export enum DTPFormat {
  dtpLongDate = 0,
  dtpShortDate = 1,
  dtpTime = 2,
  dtpCustom = 3
}

export enum DTPUpDown {
  dtpUpDownNone = 0,
  dtpUpDownUpDown = 1
}

export interface DTPickerProps extends VB6ControlPropsEnhanced {
  // Date/Time properties
  value?: Date;
  minDate?: Date;
  maxDate?: Date;
  
  // Format properties
  format?: DTPFormat;
  customFormat?: string;
  upDown?: DTPUpDown;
  showCheckBox?: boolean;
  checked?: boolean;
  
  // Calendar properties
  showDropDown?: boolean;
  calendarBackColor?: string;
  calendarForeColor?: string;
  calendarTitleBackColor?: string;
  calendarTitleForeColor?: string;
  calendarTrailingForeColor?: string;
  
  // Events
  onValueChange?: (newValue: Date) => void;
  onCloseUp?: () => void;
  onDropDown?: () => void;
  onCheckChange?: (checked: boolean) => void;
}

export const DTPicker = forwardRef<HTMLDivElement, DTPickerProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 200,
    height = 24,
    visible = true,
    enabled = true,
    value = new Date(),
    minDate = new Date(1900, 0, 1),
    maxDate = new Date(2099, 11, 31),
    format = DTPFormat.dtpShortDate,
    customFormat = '',
    upDown = DTPUpDown.dtpUpDownNone,
    showCheckBox = false,
    checked = true,
    showDropDown = true,
    calendarBackColor = '#FFFFFF',
    calendarForeColor = '#000000',
    calendarTitleBackColor = '#0078D4',
    calendarTitleForeColor = '#FFFFFF',
    calendarTrailingForeColor = '#808080',
    onValueChange,
    onCloseUp,
    onDropDown,
    onCheckChange,
    ...rest
  } = props;

  // State management
  const [currentValue, setCurrentValue] = useState<Date>(value);
  const [isChecked, setIsChecked] = useState(checked);
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState('');
  const [focusedSegment, setFocusedSegment] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // VB6 Methods
  const vb6Methods = {
    // Date/Time manipulation
    get Value() { return currentValue; },
    set Value(newValue: Date) {
      if (newValue >= minDate && newValue <= maxDate) {
        setCurrentValue(newValue);
        updateControl(id, 'Value', newValue);
        onValueChange?.(newValue);
        fireEvent(name, 'Change', { value: newValue });
      }
    },

    get Year() { return currentValue.getFullYear(); },
    set Year(year: number) {
      const newDate = new Date(currentValue);
      newDate.setFullYear(year);
      vb6Methods.Value = newDate;
    },

    get Month() { return currentValue.getMonth() + 1; }, // VB6 uses 1-based months
    set Month(month: number) {
      const newDate = new Date(currentValue);
      newDate.setMonth(month - 1); // Convert to 0-based
      vb6Methods.Value = newDate;
    },

    get Day() { return currentValue.getDate(); },
    set Day(day: number) {
      const newDate = new Date(currentValue);
      newDate.setDate(day);
      vb6Methods.Value = newDate;
    },

    get Hour() { return currentValue.getHours(); },
    set Hour(hour: number) {
      const newDate = new Date(currentValue);
      newDate.setHours(hour);
      vb6Methods.Value = newDate;
    },

    get Minute() { return currentValue.getMinutes(); },
    set Minute(minute: number) {
      const newDate = new Date(currentValue);
      newDate.setMinutes(minute);
      vb6Methods.Value = newDate;
    },

    get Second() { return currentValue.getSeconds(); },
    set Second(second: number) {
      const newDate = new Date(currentValue);
      newDate.setSeconds(second);
      vb6Methods.Value = newDate;
    },

    // Format properties
    get Format() { return format; },
    set Format(newFormat: DTPFormat) {
      updateControl(id, 'Format', newFormat);
    },

    get CustomFormat() { return customFormat; },
    set CustomFormat(format: string) {
      updateControl(id, 'CustomFormat', format);
    },

    // Checkbox functionality
    get Checked() { return isChecked; },
    set Checked(checked: boolean) {
      setIsChecked(checked);
      updateControl(id, 'Checked', checked);
      onCheckChange?.(checked);
      fireEvent(name, 'CheckChange', { checked });
    },

    // Calendar methods
    ShowCalendar: () => {
      if (enabled && showDropDown) {
        setIsDropDownOpen(true);
        onDropDown?.();
        fireEvent(name, 'DropDown', {});
      }
    },

    HideCalendar: () => {
      if (isDropDownOpen) {
        setIsDropDownOpen(false);
        onCloseUp?.();
        fireEvent(name, 'CloseUp', {});
      }
    },

    // Navigation methods
    AddDays: (days: number) => {
      const newDate = new Date(currentValue);
      newDate.setDate(newDate.getDate() + days);
      vb6Methods.Value = newDate;
    },

    AddMonths: (months: number) => {
      const newDate = new Date(currentValue);
      newDate.setMonth(newDate.getMonth() + months);
      vb6Methods.Value = newDate;
    },

    AddYears: (years: number) => {
      const newDate = new Date(currentValue);
      newDate.setFullYear(newDate.getFullYear() + years);
      vb6Methods.Value = newDate;
    },

    // Utility methods
    IsLeapYear: (year?: number): boolean => {
      const checkYear = year || currentValue.getFullYear();
      return ((checkYear % 4 === 0) && (checkYear % 100 !== 0)) || (checkYear % 400 === 0);
    },

    DaysInMonth: (month?: number, year?: number): number => {
      const checkMonth = month || (currentValue.getMonth() + 1);
      const checkYear = year || currentValue.getFullYear();
      return new Date(checkYear, checkMonth, 0).getDate();
    },

    WeekDay: (): number => {
      return currentValue.getDay() + 1; // VB6 uses 1-based weekdays (Sunday = 1)
    },

    DateAdd: (interval: string, number: number, date?: Date): Date => {
      const baseDate = date || currentValue;
      const result = new Date(baseDate);
      
      switch (interval.toLowerCase()) {
        case 'yyyy': result.setFullYear(result.getFullYear() + number); break;
        case 'm': result.setMonth(result.getMonth() + number); break;
        case 'd': result.setDate(result.getDate() + number); break;
        case 'h': result.setHours(result.getHours() + number); break;
        case 'n': result.setMinutes(result.getMinutes() + number); break;
        case 's': result.setSeconds(result.getSeconds() + number); break;
        case 'w': result.setDate(result.getDate() + (number * 7)); break;
        case 'q': result.setMonth(result.getMonth() + (number * 3)); break;
      }
      
      return result;
    },

    DateDiff: (interval: string, date1: Date, date2: Date): number => {
      const timeDiff = date2.getTime() - date1.getTime();
      
      switch (interval.toLowerCase()) {
        case 'yyyy': return date2.getFullYear() - date1.getFullYear();
        case 'm': return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
        case 'd': return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        case 'h': return Math.floor(timeDiff / (1000 * 60 * 60));
        case 'n': return Math.floor(timeDiff / (1000 * 60));
        case 's': return Math.floor(timeDiff / 1000);
        case 'w': return Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
        default: return 0;
      }
    }
  };

  // Format date/time for display
  const formatDateTime = useCallback((date: Date): string => {
    if (!isChecked && showCheckBox) return '';
    
    switch (format) {
      case DTPFormat.dtpLongDate:
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case DTPFormat.dtpShortDate:
        return date.toLocaleDateString('en-US');
      case DTPFormat.dtpTime:
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
      case DTPFormat.dtpCustom:
        return formatCustom(date, customFormat);
      default:
        return date.toLocaleDateString('en-US');
    }
  }, [format, customFormat, isChecked, showCheckBox]);

  const formatCustom = (date: Date, formatStr: string): string => {
    if (!formatStr) return date.toLocaleDateString('en-US');
    
    const formatMap: { [key: string]: string } = {
      'yyyy': date.getFullYear().toString(),
      'yy': date.getFullYear().toString().slice(-2),
      'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
      'M': (date.getMonth() + 1).toString(),
      'dd': date.getDate().toString().padStart(2, '0'),
      'd': date.getDate().toString(),
      'HH': date.getHours().toString().padStart(2, '0'),
      'H': date.getHours().toString(),
      'mm': date.getMinutes().toString().padStart(2, '0'),
      'm': date.getMinutes().toString(),
      'ss': date.getSeconds().toString().padStart(2, '0'),
      's': date.getSeconds().toString()
    };
    
    let result = formatStr;
    Object.keys(formatMap).forEach(key => {
      result = result.replace(new RegExp(key, 'g'), formatMap[key]);
    });
    
    return result;
  };

  // Handle date selection
  const handleDateSelect = useCallback((selectedDate: Date) => {
    vb6Methods.Value = selectedDate;
    setIsDropDownOpen(false);
    onCloseUp?.();
    fireEvent(name, 'CloseUp', {});
  }, [vb6Methods, onCloseUp, fireEvent, name]);

  // Handle checkbox change
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    updateControl(id, 'Checked', checked);
    onCheckChange?.(checked);
    fireEvent(name, 'CheckChange', { checked });
  }, [id, updateControl, onCheckChange, fireEvent, name]);

  // Handle dropdown button click
  const handleDropdownClick = useCallback(() => {
    if (!enabled) return;
    
    if (isDropDownOpen) {
      vb6Methods.HideCalendar();
    } else {
      vb6Methods.ShowCalendar();
    }
  }, [enabled, isDropDownOpen, vb6Methods]);

  // Handle up/down buttons
  const handleUpDown = useCallback((direction: 'up' | 'down') => {
    if (!enabled || !isChecked) return;
    
    const increment = direction === 'up' ? 1 : -1;
    
    switch (format) {
      case DTPFormat.dtpShortDate:
      case DTPFormat.dtpLongDate:
        vb6Methods.AddDays(increment);
        break;
      case DTPFormat.dtpTime:
        vb6Methods.Minute = currentValue.getMinutes() + increment;
        break;
      default:
        vb6Methods.AddDays(increment);
        break;
    }
  }, [enabled, isChecked, format, vb6Methods, currentValue]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enabled) return;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        handleUpDown('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (e.altKey && showDropDown) {
          handleDropdownClick();
        } else {
          handleUpDown('down');
        }
        break;
      case 'Escape':
        if (isDropDownOpen) {
          vb6Methods.HideCalendar();
        }
        break;
      case 'Enter':
        if (isDropDownOpen) {
          vb6Methods.HideCalendar();
        }
        break;
    }
  }, [enabled, handleUpDown, showDropDown, handleDropdownClick, isDropDownOpen, vb6Methods]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isDropDownOpen) {
          vb6Methods.HideCalendar();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropDownOpen, vb6Methods]);

  // Update control properties
  useEffect(() => {
    updateControl(id, 'Value', currentValue);
    updateControl(id, 'Checked', isChecked);
    updateControl(id, 'Format', format);
  }, [id, currentValue, isChecked, format, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  // Expose methods globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalAny = window as any;
      globalAny.VB6Controls = globalAny.VB6Controls || {};
      globalAny.VB6Controls[name] = vb6Methods;
    }
  }, [name, vb6Methods]);

  if (!visible) return null;

  const displayText = formatDateTime(currentValue);

  return (
    <>
      <div
        ref={ref}
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: enabled ? '#FFFFFF' : '#F0F0F0',
          border: '2px inset #c0c0c0',
          fontFamily: 'MS Sans Serif',
          fontSize: '8pt',
          opacity: enabled ? 1 : 0.5
        }}
        onKeyDown={handleKeyDown}
        tabIndex={enabled ? 0 : -1}
        {...rest}
      >
        {/* Checkbox */}
        {showCheckBox && (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
            disabled={!enabled}
            style={{
              margin: '0 4px 0 2px',
              cursor: enabled ? 'pointer' : 'default'
            }}
          />
        )}

        {/* Date/Time display */}
        <div
          style={{
            flex: 1,
            padding: '2px 4px',
            cursor: enabled ? 'text' : 'default',
            color: isChecked || !showCheckBox ? '#000000' : '#808080',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          onClick={() => enabled && inputRef.current?.focus()}
        >
          {displayText}
        </div>

        {/* Up/Down buttons */}
        {upDown === DTPUpDown.dtpUpDownUpDown && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '16px',
            height: '100%',
            borderLeft: '1px solid #808080'
          }}>
            <button
              style={{
                flex: 1,
                border: 'none',
                backgroundColor: '#f0f0f0',
                cursor: enabled ? 'pointer' : 'default',
                fontSize: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              disabled={!enabled}
              onClick={() => handleUpDown('up')}
            >
              ▲
            </button>
            <button
              style={{
                flex: 1,
                border: 'none',
                borderTop: '1px solid #808080',
                backgroundColor: '#f0f0f0',
                cursor: enabled ? 'pointer' : 'default',
                fontSize: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              disabled={!enabled}
              onClick={() => handleUpDown('down')}
            >
              ▼
            </button>
          </div>
        )}

        {/* Dropdown button */}
        {showDropDown && upDown !== DTPUpDown.dtpUpDownUpDown && (
          <button
            style={{
              width: '20px',
              height: '100%',
              border: 'none',
              borderLeft: '1px solid #808080',
              backgroundColor: '#f0f0f0',
              cursor: enabled ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            disabled={!enabled}
            onClick={handleDropdownClick}
          >
            ▼
          </button>
        )}
      </div>

      {/* Dropdown Calendar */}
      {isDropDownOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            left,
            top: top + height,
            zIndex: 1000,
            backgroundColor: calendarBackColor,
            border: '2px outset #c0c0c0',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            fontFamily: 'MS Sans Serif',
            fontSize: '8pt'
          }}
        >
          <CalendarDropdown
            value={currentValue}
            minDate={minDate}
            maxDate={maxDate}
            onSelect={handleDateSelect}
            backColor={calendarBackColor}
            foreColor={calendarForeColor}
            titleBackColor={calendarTitleBackColor}
            titleForeColor={calendarTitleForeColor}
            trailingForeColor={calendarTrailingForeColor}
          />
        </div>
      )}
    </>
  );
});

// Calendar Dropdown Component
interface CalendarDropdownProps {
  value: Date;
  minDate: Date;
  maxDate: Date;
  onSelect: (date: Date) => void;
  backColor: string;
  foreColor: string;
  titleBackColor: string;
  titleForeColor: string;
  trailingForeColor: string;
}

const CalendarDropdown: React.FC<CalendarDropdownProps> = ({
  value,
  minDate,
  maxDate,
  onSelect,
  backColor,
  foreColor,
  titleBackColor,
  titleForeColor,
  trailingForeColor
}) => {
  const [displayDate, setDisplayDate] = useState(new Date(value));
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const navigateMonth = (direction: number) => {
    const newDate = new Date(displayDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setDisplayDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Array<{ date: number; isCurrentMonth: boolean; isSelected: boolean; isToday: boolean; date_obj: Date }> = [];
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      days.push({
        date: day,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false,
        date_obj: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day)
      });
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        isSelected: dateObj.toDateString() === value.toDateString(),
        isToday: dateObj.toDateString() === today.toDateString(),
        date_obj: dateObj
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false,
        date_obj: new Date(year, month + 1, day)
      });
    }
    
    return days;
  };

  const days = getDaysInMonth(displayDate);

  return (
    <div style={{ width: '200px', padding: '4px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: titleBackColor,
        color: titleForeColor,
        padding: '4px',
        marginBottom: '4px'
      }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: titleForeColor,
            cursor: 'pointer',
            fontSize: '12px'
          }}
          onClick={() => navigateMonth(-1)}
        >
          ‹
        </button>
        <span style={{ fontWeight: 'bold' }}>
          {monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}
        </span>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: titleForeColor,
            cursor: 'pointer',
            fontSize: '12px'
          }}
          onClick={() => navigateMonth(1)}
        >
          ›
        </button>
      </div>

      {/* Day names */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        marginBottom: '2px'
      }}>
        {dayNames.map(day => (
          <div key={day} style={{
            textAlign: 'center',
            padding: '2px',
            fontSize: '8pt',
            fontWeight: 'bold',
            color: foreColor
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px'
      }}>
        {days.map((day, index) => (
          <div
            key={index}
            style={{
              textAlign: 'center',
              padding: '4px 2px',
              cursor: 'pointer',
              backgroundColor: day.isSelected ? '#0078D4' : 'transparent',
              color: day.isSelected ? '#FFFFFF' : 
                     day.isCurrentMonth ? foreColor : trailingForeColor,
              fontWeight: day.isToday ? 'bold' : 'normal',
              border: day.isToday ? '1px solid #0078D4' : 'none',
              fontSize: '8pt',
              minHeight: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              if (day.date_obj >= minDate && day.date_obj <= maxDate) {
                onSelect(day.date_obj);
              }
            }}
            onMouseEnter={(e) => {
              if (day.date_obj >= minDate && day.date_obj <= maxDate && !day.isSelected) {
                e.currentTarget.style.backgroundColor = '#E3F2FD';
              }
            }}
            onMouseLeave={(e) => {
              if (!day.isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {day.date}
          </div>
        ))}
      </div>
    </div>
  );
};

DTPicker.displayName = 'DTPicker';

export default DTPicker;