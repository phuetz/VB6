/**
 * Calendar Control - Complete VB6 Calendar Implementation
 * Full date selection with VB6 API compatibility
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback, useMemo } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// VB6 Calendar Constants
export enum CalendarConstants {
  mvwMaximumDays = 42, // Maximum days displayed
  mvwMinimumWeeks = 1,
  mvwMaximumWeeks = 6,
}

export enum DayOfWeekConstants {
  mvwSunday = 1,
  mvwMonday = 2,
  mvwTuesday = 3,
  mvwWednesday = 4,
  mvwThursday = 5,
  mvwFriday = 6,
  mvwSaturday = 7,
}

export interface CalendarProps extends VB6ControlPropsEnhanced {
  // Date properties
  value?: Date;
  minDate?: Date;
  maxDate?: Date;

  // Display properties
  showDateSelectors?: boolean;
  showDays?: boolean;
  showHorizontalGrid?: boolean;
  showTitle?: boolean;
  showToday?: boolean;
  showVerticalGrid?: boolean;
  showWeekNumbers?: boolean;

  // Behavior properties
  dayLength?: number; // 0=long, 1=short, 2=single letter
  firstDay?: DayOfWeekConstants;
  monthLength?: number; // 0=long, 1=short
  scrollRate?: number;

  // Colors
  backColor?: string;
  dayOfWeekBackColor?: string;
  dayOfWeekForeColor?: string;
  gridForeColor?: string;
  titleBackColor?: string;
  titleForeColor?: string;
  trailingForeColor?: string;
  weekNumberBackColor?: string;
  weekNumberForeColor?: string;

  // Font properties
  titleFont?: string;
  dayOfWeekFont?: string;
  dateFont?: string;

  // Events
  onSelChange?: (value: Date) => void;
  onGetDayBold?: (date: Date, bold: boolean) => void;
  onBeforeUpdate?: (startDate: Date, endDate: Date, cancel: boolean) => void;
}

export const CalendarControl = forwardRef<HTMLDivElement, CalendarProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 230,
    height = 170,
    visible = true,
    enabled = true,
    value = new Date(),
    minDate = new Date(1900, 0, 1),
    maxDate = new Date(2100, 11, 31),
    showDateSelectors = true,
    showDays = true,
    showHorizontalGrid = true,
    showTitle = true,
    showToday = true,
    showVerticalGrid = true,
    showWeekNumbers = false,
    dayLength = 0, // Long day names
    firstDay = DayOfWeekConstants.mvwSunday,
    monthLength = 0, // Long month names
    scrollRate = 1,
    backColor = '#FFFFFF',
    dayOfWeekBackColor = '#C0C0C0',
    dayOfWeekForeColor = '#000000',
    gridForeColor = '#C0C0C0',
    titleBackColor = '#0000FF',
    titleForeColor = '#FFFFFF',
    trailingForeColor = '#808080',
    weekNumberBackColor = '#C0C0C0',
    weekNumberForeColor = '#000000',
    titleFont = '12px Arial',
    dayOfWeekFont = '10px Arial',
    dateFont = '10px Arial',
    onSelChange,
    onGetDayBold,
    onBeforeUpdate,
    ...rest
  } = props;

  const [currentDate, setCurrentDate] = useState(new Date(value));
  const [selectedDate, setSelectedDate] = useState(new Date(value));
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [boldDates, setBoldDates] = useState<Set<string>>(new Set());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // Month and day names
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthNamesShort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // VB6 Methods
  const vb6Methods = useMemo(
    () => ({
      AboutBox: () => {
        alert('Microsoft Calendar Control\nVersion 6.0\n© Microsoft Corporation');
      },

      NextDay: () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        if (newDate <= maxDate) {
          setSelectedDate(newDate);
          setCurrentDate(newDate);
          updateViewIfNeeded(newDate);
          onSelChange?.(newDate);
          fireEvent(name, 'SelChange', { value: newDate });
        }
      },

      PreviousDay: () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        if (newDate >= minDate) {
          setSelectedDate(newDate);
          setCurrentDate(newDate);
          updateViewIfNeeded(newDate);
          onSelChange?.(newDate);
          fireEvent(name, 'SelChange', { value: newDate });
        }
      },

      NextWeek: () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 7);
        if (newDate <= maxDate) {
          setSelectedDate(newDate);
          setCurrentDate(newDate);
          updateViewIfNeeded(newDate);
          onSelChange?.(newDate);
          fireEvent(name, 'SelChange', { value: newDate });
        }
      },

      PreviousWeek: () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 7);
        if (newDate >= minDate) {
          setSelectedDate(newDate);
          setCurrentDate(newDate);
          updateViewIfNeeded(newDate);
          onSelChange?.(newDate);
          fireEvent(name, 'SelChange', { value: newDate });
        }
      },

      NextMonth: () => {
        let newMonth = viewMonth + 1;
        let newYear = viewYear;
        if (newMonth > 11) {
          newMonth = 0;
          newYear++;
        }
        setViewMonth(newMonth);
        setViewYear(newYear);
      },

      PreviousMonth: () => {
        let newMonth = viewMonth - 1;
        let newYear = viewYear;
        if (newMonth < 0) {
          newMonth = 11;
          newYear--;
        }
        setViewMonth(newMonth);
        setViewYear(newYear);
      },

      NextYear: () => {
        setViewYear(viewYear + 1);
      },

      PreviousYear: () => {
        setViewYear(viewYear - 1);
      },

      Today: () => {
        const today = new Date();
        setSelectedDate(today);
        setCurrentDate(today);
        setViewMonth(today.getMonth());
        setViewYear(today.getFullYear());
        onSelChange?.(today);
        fireEvent(name, 'SelChange', { value: today });
      },

      Refresh: () => {
        // Force re-render
        setCurrentDate(new Date(selectedDate));
      },
    }),
    [
      selectedDate,
      viewMonth,
      viewYear,
      minDate,
      maxDate,
      name,
      onSelChange,
      fireEvent,
      updateControl,
      setSelectedDate,
      setCurrentDate,
      setViewMonth,
      setViewYear,
    ]
  );

  const updateViewIfNeeded = (date: Date) => {
    if (date.getMonth() !== viewMonth || date.getFullYear() !== viewYear) {
      setViewMonth(date.getMonth());
      setViewYear(date.getFullYear());
    }
  };

  const getDayNames = () => {
    switch (dayLength) {
      case 1:
        return dayNamesShort;
      case 2:
        return dayNamesLetter;
      default:
        return dayNames;
    }
  };

  const getMonthName = () => {
    const months = monthLength === 1 ? monthNamesShort : monthNames;
    return months[viewMonth];
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    // Adjust for VB6 FirstDay property
    return (firstDay - (firstDay - 1) + 7) % 7;
  };

  const getWeekNumber = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + firstDay.getDay() + 1) / 7);
  };

  const isDateInRange = (date: Date) => {
    return date >= minDate && date <= maxDate;
  };

  const isDateBold = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return boldDates.has(dateKey);
  };

  const handleDateClick = (date: Date) => {
    if (!enabled || !isDateInRange(date)) return;

    const oldDate = new Date(selectedDate);

    // Fire BeforeUpdate event
    const cancel = false;
    onBeforeUpdate?.(oldDate, date, cancel);
    if (cancel) return;

    setSelectedDate(date);
    setCurrentDate(date);
    updateViewIfNeeded(date);

    onSelChange?.(date);
    fireEvent(name, 'SelChange', { value: date });
  };

  const handleDateHover = (date: Date | null) => {
    setHoveredDate(date);
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const daysInPrevMonth = getDaysInMonth(viewYear, viewMonth - 1);

    const weeks = [];
    let dayCount = 1;
    let nextMonthDay = 1;

    // Calculate total weeks needed
    const totalDays = firstDay + daysInMonth;
    const totalWeeks = Math.ceil(totalDays / 7);

    for (let week = 0; week < Math.max(6, totalWeeks); week++) {
      const days = [];

      for (let day = 0; day < 7; day++) {
        const dayIndex = week * 7 + day;
        let displayDate: Date;
        let isCurrentMonth = false;
        let isTrailing = false;

        if (dayIndex < firstDay) {
          // Previous month days
          const prevMonthDay = daysInPrevMonth - (firstDay - dayIndex - 1);
          displayDate = new Date(viewYear, viewMonth - 1, prevMonthDay);
          isTrailing = true;
        } else if (dayCount <= daysInMonth) {
          // Current month days
          displayDate = new Date(viewYear, viewMonth, dayCount);
          isCurrentMonth = true;
          dayCount++;
        } else {
          // Next month days
          displayDate = new Date(viewYear, viewMonth + 1, nextMonthDay);
          isTrailing = true;
          nextMonthDay++;
        }

        const isSelected = displayDate.toDateString() === selectedDate.toDateString();
        const isToday = displayDate.toDateString() === new Date().toDateString();
        const isHovered = hoveredDate && displayDate.toDateString() === hoveredDate.toDateString();
        const isInRange = isDateInRange(displayDate);
        const isBold = isDateBold(displayDate);

        days.push(
          <td
            key={day}
            className="calendar-day"
            style={{
              textAlign: 'center',
              padding: '2px',
              cursor: enabled && isInRange ? 'pointer' : 'default',
              backgroundColor: isSelected ? '#0000FF' : isHovered ? '#E0E0FF' : 'transparent',
              color: isSelected
                ? '#FFFFFF'
                : isTrailing
                  ? trailingForeColor
                  : !isInRange
                    ? '#C0C0C0'
                    : '#000000',
              fontWeight: isBold ? 'bold' : 'normal',
              border:
                isToday && showToday
                  ? '1px solid #FF0000'
                  : showHorizontalGrid || showVerticalGrid
                    ? `1px solid ${gridForeColor}`
                    : 'none',
              borderLeft: showVerticalGrid ? `1px solid ${gridForeColor}` : 'none',
              borderTop: showHorizontalGrid ? `1px solid ${gridForeColor}` : 'none',
              font: dateFont,
              width: '28px',
              height: '20px',
            }}
            onClick={() => handleDateClick(displayDate)}
            onMouseEnter={() => handleDateHover(displayDate)}
            onMouseLeave={() => handleDateHover(null)}
          >
            {displayDate.getDate()}
          </td>
        );
      }

      weeks.push(
        <tr key={week}>
          {showWeekNumbers && (
            <td
              style={{
                textAlign: 'center',
                padding: '2px',
                backgroundColor: weekNumberBackColor,
                color: weekNumberForeColor,
                font: dateFont,
                border: showVerticalGrid ? `1px solid ${gridForeColor}` : 'none',
                width: '20px',
              }}
            >
              {getWeekNumber(new Date(viewYear, viewMonth, Math.max(1, dayCount - 7)))}
            </td>
          )}
          {days}
        </tr>
      );
    }

    return weeks;
  };

  // Update control properties
  useEffect(() => {
    updateControl(id, 'Value', selectedDate);
    updateControl(id, 'Month', viewMonth + 1); // VB6 months are 1-based
    updateControl(id, 'Year', viewYear);
    updateControl(id, 'Day', selectedDate.getDate());
  }, [id, selectedDate, viewMonth, viewYear, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  // Handle GetDayBold events
  useEffect(() => {
    if (onGetDayBold) {
      const startDate = new Date(viewYear, viewMonth, 1);
      const endDate = new Date(viewYear, viewMonth + 1, 0);
      const newBoldDates = new Set<string>();

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const bold = false;
        onGetDayBold(new Date(d), bold);
        if (bold) {
          const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          newBoldDates.add(dateKey);
        }
      }

      setBoldDates(newBoldDates);
    }
  }, [viewMonth, viewYear, onGetDayBold]);

  if (!visible) return null;

  const dayNamesList = getDayNames();

  return (
    <div
      ref={ref}
      className="calendar-control"
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: backColor,
        border: '2px inset #C0C0C0',
        fontFamily: 'MS Sans Serif',
        fontSize: '8pt',
        opacity: enabled ? 1 : 0.5,
        overflow: 'hidden',
      }}
      {...rest}
    >
      {/* Title bar */}
      {showTitle && (
        <div
          style={{
            backgroundColor: titleBackColor,
            color: titleForeColor,
            padding: '2px 4px',
            textAlign: 'center',
            font: titleFont,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {showDateSelectors && (
            <button
              onClick={vb6Methods.PreviousMonth}
              style={{
                background: 'none',
                border: 'none',
                color: titleForeColor,
                cursor: 'pointer',
                fontSize: '12px',
              }}
              disabled={!enabled}
            >
              ◀
            </button>
          )}

          <span>
            {getMonthName()} {viewYear}
          </span>

          {showDateSelectors && (
            <button
              onClick={vb6Methods.NextMonth}
              style={{
                background: 'none',
                border: 'none',
                color: titleForeColor,
                cursor: 'pointer',
                fontSize: '12px',
              }}
              disabled={!enabled}
            >
              ▶
            </button>
          )}
        </div>
      )}

      {/* Calendar grid */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: backColor,
        }}
      >
        {/* Day of week headers */}
        {showDays && (
          <thead>
            <tr>
              {showWeekNumbers && (
                <th
                  style={{
                    backgroundColor: weekNumberBackColor,
                    color: weekNumberForeColor,
                    font: dayOfWeekFont,
                    padding: '2px',
                    border: showVerticalGrid ? `1px solid ${gridForeColor}` : 'none',
                    width: '20px',
                  }}
                ></th>
              )}
              {dayNamesList.map((dayName, index) => (
                <th
                  key={index}
                  style={{
                    backgroundColor: dayOfWeekBackColor,
                    color: dayOfWeekForeColor,
                    font: dayOfWeekFont,
                    padding: '2px',
                    textAlign: 'center',
                    border: showVerticalGrid ? `1px solid ${gridForeColor}` : 'none',
                    width: '28px',
                  }}
                >
                  {dayName}
                </th>
              ))}
            </tr>
          </thead>
        )}

        {/* Calendar days */}
        <tbody>{renderCalendarGrid()}</tbody>
      </table>
    </div>
  );
});

CalendarControl.displayName = 'CalendarControl';

export default CalendarControl;
