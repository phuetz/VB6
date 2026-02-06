import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Control } from '../../context/types';

interface MonthViewProps {
  control: Control;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (corner: string, deltaX: number, deltaY: number) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  control,
  selected,
  onSelect,
  onDoubleClick,
  onMove,
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const properties = control.properties || {};

  // VB6 MonthView Properties
  const value = properties.Value ? new Date(properties.Value) : new Date();
  const maxDate = properties.MaxDate ? new Date(properties.MaxDate) : new Date(2999, 11, 31);
  const minDate = properties.MinDate ? new Date(properties.MinDate) : new Date(1753, 0, 1);
  const maxSelectionCount = properties.MaxSelectionCount || 1;
  const monthColumns = properties.MonthColumns || 1;
  const monthRows = properties.MonthRows || 1;
  const showToday = properties.ShowToday !== false;
  const showTodayCircle = properties.ShowTodayCircle !== false;
  const showWeekNumbers = properties.ShowWeekNumbers === true;
  const weekDayFormat = properties.StartOfWeek || 0; // 0=Sunday, 1=Monday, etc.
  const titleBackColor = properties.TitleBackColor || 0x800000; // Dark red
  const titleForeColor = properties.TitleForeColor || 0xffffff; // White
  const monthBackColor = properties.MonthBackColor || 0xffffff; // White
  const trailingForeColor = properties.TrailingForeColor || 0x808080; // Gray

  const [currentMonth, setCurrentMonth] = useState(value.getMonth());
  const [currentYear, setCurrentYear] = useState(value.getFullYear());
  const [selectedDates, setSelectedDates] = useState<Date[]>([value]);

  // Convert VB6 color format to CSS
  const vb6ColorToCss = useCallback((vb6Color: number): string => {
    const r = vb6Color & 0xff;
    const g = (vb6Color >> 8) & 0xff;
    const b = (vb6Color >> 16) & 0xff;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, []);

  // Get week number
  const getWeekNumber = useCallback((date: Date): number => {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }, []);

  // Generate calendar days for a month
  const generateCalendarDays = useCallback(
    (year: number, month: number) => {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startOfWeek = weekDayFormat; // 0=Sunday, 1=Monday

      // Calculate start date (may be from previous month)
      const startDate = new Date(firstDay);
      const dayOfWeek = (firstDay.getDay() - startOfWeek + 7) % 7;
      startDate.setDate(startDate.getDate() - dayOfWeek);

      // Generate 42 days (6 weeks)
      const days: Date[] = [];
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
      }

      return days;
    },
    [weekDayFormat]
  );

  // Handle date selection
  const handleDateClick = useCallback(
    (date: Date) => {
      if (date < minDate || date > maxDate) return;

      if (maxSelectionCount === 1) {
        setSelectedDates([date]);
      } else {
        // Multiple selection logic
        const isSelected = selectedDates.some(
          d =>
            d.getFullYear() === date.getFullYear() &&
            d.getMonth() === date.getMonth() &&
            d.getDate() === date.getDate()
        );

        if (isSelected) {
          setSelectedDates(
            selectedDates.filter(
              d =>
                !(
                  d.getFullYear() === date.getFullYear() &&
                  d.getMonth() === date.getMonth() &&
                  d.getDate() === date.getDate()
                )
            )
          );
        } else if (selectedDates.length < maxSelectionCount) {
          setSelectedDates([...selectedDates, date]);
        }
      }

      // Update control value
      if (control.events?.onChange) {
        control.events.onChange('Value', date.toISOString());
      }

      // Trigger VB6 events
      if (control.events?.DateClick) {
        control.events.DateClick(date);
      }
    },
    [minDate, maxDate, maxSelectionCount, selectedDates, control.events]
  );

  // Navigate months
  const navigateMonth = useCallback(
    (direction: 'prev' | 'next') => {
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
    },
    [currentMonth, currentYear]
  );

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

  React.useEffect(() => {
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

  // Generate days for current month
  const calendarDays = useMemo(
    () => generateCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth, generateCalendarDays]
  );

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: control.left,
    top: control.top,
    width: control.width,
    height: control.height,
    border: selected ? '2px dashed #0066cc' : '1px solid #808080',
    backgroundColor: vb6ColorToCss(monthBackColor),
    cursor: isDragging ? 'move' : 'default',
    fontFamily: 'MS Sans Serif',
    fontSize: '8pt',
    overflow: 'hidden',
  };

  const titleStyle: React.CSSProperties = {
    backgroundColor: vb6ColorToCss(titleBackColor),
    color: vb6ColorToCss(titleForeColor),
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontWeight: 'bold',
    fontSize: '8pt',
  };

  const dayHeaderStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: showWeekNumbers ? 'auto repeat(7, 1fr)' : 'repeat(7, 1fr)',
    backgroundColor: '#e0e0e0',
    borderBottom: '1px solid #808080',
    fontSize: '7pt',
    fontWeight: 'bold',
  };

  const dayGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: showWeekNumbers ? 'auto repeat(7, 1fr)' : 'repeat(7, 1fr)',
    gridTemplateRows: 'repeat(6, 1fr)',
    flex: 1,
    fontSize: '8pt',
  };

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

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const reorderedDayNames = dayNames.slice(weekDayFormat).concat(dayNames.slice(0, weekDayFormat));

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      className="vb6-monthview"
    >
      {/* Title bar */}
      <div style={titleStyle}>
        <button
          onClick={() => navigateMonth('prev')}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '12pt',
            padding: 0,
            width: 16,
            height: 16,
          }}
        >
          ◀
        </button>

        <span>
          {monthNames[currentMonth]} {currentYear}
        </span>

        <button
          onClick={() => navigateMonth('next')}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '12pt',
            padding: 0,
            width: 16,
            height: 16,
          }}
        >
          ▶
        </button>
      </div>

      {/* Day headers */}
      <div style={dayHeaderStyle}>
        {showWeekNumbers && (
          <div
            style={{ padding: '2px 4px', textAlign: 'center', borderRight: '1px solid #808080' }}
          >
            Wk
          </div>
        )}
        {reorderedDayNames.map(day => (
          <div key={day} style={{ padding: '2px 4px', textAlign: 'center' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={dayGridStyle}>
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isSelected = selectedDates.some(
            d =>
              d.getFullYear() === date.getFullYear() &&
              d.getMonth() === date.getMonth() &&
              d.getDate() === date.getDate()
          );
          const isToday = date.getTime() === today.getTime();
          const isWeekNumber = showWeekNumbers && index % 7 === 0;

          if (isWeekNumber) {
            return (
              <div
                key={`week-${index}`}
                style={{
                  padding: '2px 4px',
                  textAlign: 'center',
                  backgroundColor: '#f0f0f0',
                  borderRight: '1px solid #808080',
                  fontSize: '7pt',
                  color: '#666',
                }}
              >
                {getWeekNumber(date)}
              </div>
            );
          }

          const dayStyle: React.CSSProperties = {
            padding: '2px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isSelected ? '#316AC5' : 'transparent',
            color: isSelected
              ? 'white'
              : !isCurrentMonth
                ? vb6ColorToCss(trailingForeColor)
                : 'black',
            border: isToday && showTodayCircle ? '1px solid red' : '1px solid transparent',
            fontSize: '8pt',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '16px',
          };

          return (
            <div
              key={date.toISOString()}
              style={dayStyle}
              onClick={() => handleDateClick(date)}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#E0E0E0';
                }
              }}
              onMouseLeave={e => {
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

      {/* Today section */}
      {showToday && (
        <div
          style={{
            borderTop: '1px solid #808080',
            padding: '2px 4px',
            backgroundColor: '#f0f0f0',
            fontSize: '7pt',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => {
            setCurrentMonth(today.getMonth());
            setCurrentYear(today.getFullYear());
            handleDateClick(today);
          }}
        >
          Today: {today.toLocaleDateString()}
        </div>
      )}

      {/* Resize handles */}
      {selected && (
        <>
          <div
            className="vb6-resize-handle nw"
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'nw-resize',
            }}
          />
          <div
            className="vb6-resize-handle ne"
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'ne-resize',
            }}
          />
          <div
            className="vb6-resize-handle sw"
            style={{
              position: 'absolute',
              bottom: -4,
              left: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'sw-resize',
            }}
          />
          <div
            className="vb6-resize-handle se"
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'se-resize',
            }}
          />
          <div
            className="vb6-resize-handle n"
            style={{
              position: 'absolute',
              top: -4,
              left: '50%',
              marginLeft: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'n-resize',
            }}
          />
          <div
            className="vb6-resize-handle s"
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              marginLeft: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 's-resize',
            }}
          />
          <div
            className="vb6-resize-handle w"
            style={{
              position: 'absolute',
              top: '50%',
              left: -4,
              marginTop: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'w-resize',
            }}
          />
          <div
            className="vb6-resize-handle e"
            style={{
              position: 'absolute',
              top: '50%',
              right: -4,
              marginTop: -4,
              width: 8,
              height: 8,
              backgroundColor: '#0066cc',
              cursor: 'e-resize',
            }}
          />
        </>
      )}
    </div>
  );
};

export default MonthView;
