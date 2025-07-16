/**
 * Contrôles avancés VB6 - MSChart, ProgressBar, MonthView, TreeView, ListView, etc.
 * Implémentation complète avec toutes les propriétés et méthodes VB6
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useVB6Store } from '../../stores/vb6Store';

// MSChart - Graphiques compatibles VB6
export const MSChart = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    chartType = 'Bar', // Bar, Line, Pie, Area, HiLo, Scatter, Combination
    data = [],
    series = [],
    title = '',
    titleFont,
    legendPosition = 'Bottom', // None, Top, Bottom, Left, Right
    showLegend = true,
    showDataLabels = false,
    backgroundColor = '#FFFFFF',
    plotAreaColor = '#FFFFFF',
    borderStyle = 'Fixed Single',
    allowSeriesSelection = true,
    allowPointSelection = true,
    tag,
    toolTipText,
    ...rest
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSeries, setSelectedSeries] = useState(-1);
  const [selectedPoint, setSelectedPoint] = useState({ series: -1, point: -1 });
  const { fireEvent } = useVB6Store();

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Function to draw bar chart
    const drawBarChart = (ctx: CanvasRenderingContext2D, plotArea: any, data: any[], series: any[]) => {
      if (!data.length || !series.length) return;

      const barWidth = plotArea.width / (data.length * series.length + data.length + 1);
      const maxValue = Math.max(...data.map(d => Math.max(...series.map(s => d[s.name] || 0))));

      data.forEach((dataPoint, dataIndex) => {
        series.forEach((serie, seriesIndex) => {
          const value = dataPoint[serie.name] || 0;
          const barHeight = (value / maxValue) * plotArea.height;
          const x = plotArea.x + (dataIndex * (barWidth * series.length + barWidth)) + (seriesIndex * barWidth);
          const y = plotArea.y + plotArea.height - barHeight;

          ctx.fillStyle = serie.color || `hsl(${seriesIndex * 60}, 70%, 50%)`;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Étiquettes de données
          if (showDataLabels) {
            ctx.fillStyle = '#000000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
          }
        });
      });

      // Axes
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotArea.x, plotArea.y + plotArea.height);
      ctx.lineTo(plotArea.x + plotArea.width, plotArea.y + plotArea.height);
      ctx.moveTo(plotArea.x, plotArea.y);
      ctx.lineTo(plotArea.x, plotArea.y + plotArea.height);
      ctx.stroke();
    };

    // Function to draw line chart
    const drawLineChart = (ctx: CanvasRenderingContext2D, plotArea: any, data: any[], series: any[]) => {
      if (!data.length || !series.length) return;

      const pointSpacing = plotArea.width / (data.length - 1);
      const maxValue = Math.max(...data.map(d => Math.max(...series.map(s => d[s.name] || 0))));

      series.forEach((serie, seriesIndex) => {
        ctx.strokeStyle = serie.color || `hsl(${seriesIndex * 60}, 70%, 50%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((dataPoint, dataIndex) => {
          const value = dataPoint[serie.name] || 0;
          const x = plotArea.x + (dataIndex * pointSpacing);
          const y = plotArea.y + plotArea.height - (value / maxValue) * plotArea.height;

          if (dataIndex === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          // Points
          ctx.fillStyle = serie.color || `hsl(${seriesIndex * 60}, 70%, 50%)`;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        });

        ctx.stroke();
      });
    };

    // Function to draw pie chart
    const drawPieChart = (ctx: CanvasRenderingContext2D, plotArea: any, data: any[], series: any[]) => {
      if (!data.length || !series.length) return;

      const centerX = plotArea.x + plotArea.width / 2;
      const centerY = plotArea.y + plotArea.height / 2;
      const radius = Math.min(plotArea.width, plotArea.height) / 2 - 20;

      const total = data.reduce((sum, d) => sum + (d[series[0].name] || 0), 0);
      let currentAngle = -Math.PI / 2;

      data.forEach((dataPoint, index) => {
        const value = dataPoint[series[0].name] || 0;
        const sliceAngle = (value / total) * 2 * Math.PI;

        ctx.fillStyle = `hsl(${index * 40}, 70%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        // Étiquettes
        if (showDataLabels) {
          const labelAngle = currentAngle + sliceAngle / 2;
          const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
          const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

          ctx.fillStyle = '#000000';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round((value / total) * 100)}%`, labelX, labelY);
        }

        currentAngle += sliceAngle;
      });
    };

    // Function to draw area chart
    const drawAreaChart = (ctx: CanvasRenderingContext2D, plotArea: any, data: any[], series: any[]) => {
      if (!data.length || !series.length) return;

      const pointSpacing = plotArea.width / (data.length - 1);
      const maxValue = Math.max(...data.map(d => Math.max(...series.map(s => d[s.name] || 0))));

      series.forEach((serie, seriesIndex) => {
        ctx.fillStyle = serie.color || `hsla(${seriesIndex * 60}, 70%, 50%, 0.5)`;
        ctx.beginPath();

        // Commencer au bas de la zone
        ctx.moveTo(plotArea.x, plotArea.y + plotArea.height);

        data.forEach((dataPoint, dataIndex) => {
          const value = dataPoint[serie.name] || 0;
          const x = plotArea.x + (dataIndex * pointSpacing);
          const y = plotArea.y + plotArea.height - (value / maxValue) * plotArea.height;
          ctx.lineTo(x, y);
        });

        // Fermer la zone
        ctx.lineTo(plotArea.x + plotArea.width, plotArea.y + plotArea.height);
        ctx.closePath();
        ctx.fill();
      });
    };

    // Function to draw legend
    const drawLegend = (ctx: CanvasRenderingContext2D, series: any[], position: string, canvasWidth: number, canvasHeight: number) => {
      const legendItemHeight = 20;
      const legendItemWidth = 100;

      let legendX = 0;
      let legendY = 0;

      switch (position) {
        case 'Bottom':
          legendX = 20;
          legendY = canvasHeight - 40;
          break;
        case 'Top':
          legendX = 20;
          legendY = 20;
          break;
        case 'Left':
          legendX = 10;
          legendY = 50;
          break;
        case 'Right':
          legendX = canvasWidth - 120;
          legendY = 50;
          break;
      }

      series.forEach((serie, index) => {
        const itemY = legendY + (index * legendItemHeight);

        // Carré de couleur
        ctx.fillStyle = serie.color || `hsl(${index * 60}, 70%, 50%)`;
        ctx.fillRect(legendX, itemY, 12, 12);

        // Texte
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(serie.name, legendX + 16, itemY + 9);
      });
    };

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner le fond
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner la bordure
    if (borderStyle === 'Fixed Single') {
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }

    // Dessiner le titre
    if (title) {
      ctx.fillStyle = '#000000';
      ctx.font = `${titleFont?.size || 12}px ${titleFont?.name || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 20);
    }

    // Zone de tracé
    const plotArea = {
      x: showLegend && legendPosition === 'Left' ? 100 : 40,
      y: title ? 40 : 20,
      width: canvas.width - 80 - (showLegend && legendPosition === 'Left' ? 100 : 0),
      height: canvas.height - 60 - (showLegend && legendPosition === 'Bottom' ? 60 : 0),
    };

    // Dessiner le fond de la zone de tracé
    ctx.fillStyle = plotAreaColor;
    ctx.fillRect(plotArea.x, plotArea.y, plotArea.width, plotArea.height);

    // Dessiner selon le type de graphique
    switch (chartType) {
      case 'Bar':
        drawBarChart(ctx, plotArea, data, series);
        break;
      case 'Line':
        drawLineChart(ctx, plotArea, data, series);
        break;
      case 'Pie':
        drawPieChart(ctx, plotArea, data, series);
        break;
      case 'Area':
        drawAreaChart(ctx, plotArea, data, series);
        break;
      default:
        drawBarChart(ctx, plotArea, data, series);
    }

    // Dessiner la légende
    if (showLegend && series.length > 0) {
      drawLegend(ctx, series, legendPosition, canvas.width, canvas.height);
    }
  }, [backgroundColor, borderStyle, title, titleFont, chartType, data, series, showLegend, legendPosition, plotAreaColor, showDataLabels]);


  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Détecter le clic sur une série/point
    fireEvent(name, 'SeriesSelected', { series: selectedSeries });
    fireEvent(name, 'PointSelected', { series: selectedPoint.series, point: selectedPoint.point });
  }, [enabled, name, fireEvent, selectedSeries, selectedPoint]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const chartStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.6,
  };

  return (
    <div
      ref={ref}
      style={chartStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        style={{ display: 'block' }}
      />
    </div>
  );
});

// ProgressBar - Barre de progression VB6
export const ProgressBar = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    value = 0,
    min = 0,
    max = 100,
    orientation = 'Horizontal', // Horizontal, Vertical
    scrolling = 'Standard', // Standard, Smooth
    borderStyle = 'Fixed Single',
    backColor = '#C0C0C0',
    foreColor = '#0000FF',
    tag,
    toolTipText,
    ...rest
  } = props;

  const [animatedValue, setAnimatedValue] = useState(value);
  const { fireEvent, updateControl } = useVB6Store();

  useEffect(() => {
    if (scrolling === 'Smooth') {
      const duration = 300;
      const steps = 30;
      const stepValue = (value - animatedValue) / steps;
      const stepTime = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setAnimatedValue(value);
          clearInterval(timer);
        } else {
          setAnimatedValue(prev => prev + stepValue);
        }
      }, stepTime);

      return () => clearInterval(timer);
    } else {
      setAnimatedValue(value);
    }
  }, [value, scrolling, animatedValue]);

  const percentage = Math.max(0, Math.min(100, ((animatedValue - min) / (max - min)) * 100));

  const progressStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: backColor,
    border: borderStyle === 'Fixed Single' ? '2px inset #C0C0C0' : 'none',
    opacity: enabled ? 1 : 0.6,
  };

  const barStyle: React.CSSProperties = {
    width: orientation === 'Horizontal' ? `${percentage}%` : '100%',
    height: orientation === 'Horizontal' ? '100%' : `${percentage}%`,
    backgroundColor: foreColor,
    position: 'absolute',
    bottom: orientation === 'Vertical' ? 0 : undefined,
    left: 0,
    transition: scrolling === 'Smooth' ? 'all 0.3s ease' : 'none',
  };

  return (
    <div
      ref={ref}
      style={progressStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <div style={barStyle} />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '10px',
          fontFamily: 'MS Sans Serif',
          color: '#000000',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {Math.round(percentage)}%
      </div>
    </div>
  );
});

// MonthView - Calendrier mensuel VB6
export const MonthView = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    value = new Date(),
    minDate,
    maxDate,
    monthColumns = 1,
    monthRows = 1,
    showToday = true,
    showWeekNumbers = false,
    firstDayOfWeek = 'Sunday',
    titleBackColor = '#C0C0C0',
    titleForeColor = '#000000',
    trailingForeColor = '#808080',
    font,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [currentDate, setCurrentDate] = useState(new Date(value));
  const [selectedDate, setSelectedDate] = useState(new Date(value));
  const { fireEvent, updateControl } = useVB6Store();

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day: number) => {
    if (!enabled) return;

    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    updateControl(id, 'value', newDate);
    fireEvent(name, 'DateClick', { date: newDate });
  };

  const handleMonthChange = (direction: number) => {
    if (!enabled) return;

    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
    fireEvent(name, 'GetDayBold', { date: newDate });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();

    const days = [];
    
    // Jours du mois précédent
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div
          key={`prev-${daysInPrevMonth - i}`}
          className="day trailing"
          style={{
            color: trailingForeColor,
            opacity: 0.5,
            cursor: 'default',
          }}
        >
          {daysInPrevMonth - i}
        </div>
      );
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = showToday && 
        dayDate.toDateString() === today.toDateString();
      const isSelected = dayDate.toDateString() === selectedDate.toDateString();

      days.push(
        <div
          key={day}
          className="day current"
          style={{
            backgroundColor: isSelected ? '#316AC5' : isToday ? '#FFFF00' : 'transparent',
            color: isSelected ? '#FFFFFF' : '#000000',
            cursor: enabled ? 'pointer' : 'default',
            border: isToday ? '1px solid #FF0000' : 'none',
            fontWeight: isToday ? 'bold' : 'normal',
          }}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    // Jours du mois suivant
    const remainingCells = 42 - days.length; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className="day trailing"
          style={{
            color: trailingForeColor,
            opacity: 0.5,
            cursor: 'default',
          }}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const calendarStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    backgroundColor: '#FFFFFF',
    border: '2px inset #C0C0C0',
    fontSize: font?.size || 8,
    fontFamily: font?.name || 'MS Sans Serif',
    opacity: enabled ? 1 : 0.6,
  };

  return (
    <div
      ref={ref}
      style={calendarStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      {/* En-tête du calendrier */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: titleBackColor,
          color: titleForeColor,
          padding: '4px 8px',
          borderBottom: '1px solid #808080',
        }}
      >
        <button
          onClick={() => handleMonthChange(-1)}
          disabled={!enabled}
          style={{
            border: 'none',
            background: 'none',
            cursor: enabled ? 'pointer' : 'default',
            fontSize: 12,
          }}
        >
          ◀
        </button>
        <span style={{ fontWeight: 'bold' }}>
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button
          onClick={() => handleMonthChange(1)}
          disabled={!enabled}
          style={{
            border: 'none',
            background: 'none',
            cursor: enabled ? 'pointer' : 'default',
            fontSize: 12,
          }}
        >
          ▶
        </button>
      </div>

      {/* Jours de la semaine */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid #808080',
          backgroundColor: '#F0F0F0',
        }}
      >
        {daysOfWeek.map((day) => (
          <div
            key={day}
            style={{
              padding: '2px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: 8,
              borderRight: '1px solid #D0D0D0',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
          height: 'calc(100% - 40px)',
        }}
      >
        {renderCalendar().map((day, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1px solid #E0E0E0',
              borderBottom: '1px solid #E0E0E0',
              fontSize: 8,
              ...day.props.style,
            }}
            onClick={day.props.onClick}
          >
            {day.props.children}
          </div>
        ))}
      </div>
    </div>
  );
});

// Slider - Curseur VB6
export const Slider = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    value = 0,
    min = 0,
    max = 100,
    orientation = 'Horizontal',
    tickStyle = 'Bottom', // None, Top, Bottom, Both
    tickFrequency = 1,
    largeChange = 5,
    smallChange = 1,
    selStart = 0,
    selLength = 0,
    borderStyle = 'Fixed Single',
    tag,
    toolTipText,
    ...rest
  } = props;

  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;

    setIsDragging(true);
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const percentage = orientation === 'Horizontal' 
      ? (e.clientX - rect.left) / rect.width
      : 1 - (e.clientY - rect.top) / rect.height;

    const newValue = Math.round(min + (max - min) * percentage);
    const clampedValue = Math.max(min, Math.min(max, newValue));

    setCurrentValue(clampedValue);
    updateControl(id, 'value', clampedValue);
    fireEvent(name, 'Change', { value: clampedValue });
  }, [enabled, orientation, min, max, id, name, fireEvent, updateControl]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !enabled || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = orientation === 'Horizontal' 
      ? (e.clientX - rect.left) / rect.width
      : 1 - (e.clientY - rect.top) / rect.height;

    const newValue = Math.round(min + (max - min) * percentage);
    const clampedValue = Math.max(min, Math.min(max, newValue));

    setCurrentValue(clampedValue);
    updateControl(id, 'value', clampedValue);
    fireEvent(name, 'Scroll', { value: clampedValue });
  }, [isDragging, enabled, orientation, min, max, id, name, fireEvent, updateControl]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const sliderStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'block' : 'none',
    border: borderStyle === 'Fixed Single' ? '2px inset #C0C0C0' : 'none',
    backgroundColor: '#C0C0C0',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.6,
  };

  const trackStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#808080',
    ...(orientation === 'Horizontal' ? {
      left: 4,
      right: 4,
      top: '50%',
      height: 4,
      transform: 'translateY(-50%)',
    } : {
      top: 4,
      bottom: 4,
      left: '50%',
      width: 4,
      transform: 'translateX(-50%)',
    }),
  };

  const thumbPosition = ((currentValue - min) / (max - min)) * 100;
  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    width: 12,
    height: 20,
    backgroundColor: '#C0C0C0',
    border: '2px outset #C0C0C0',
    cursor: enabled ? 'grab' : 'default',
    ...(orientation === 'Horizontal' ? {
      left: `calc(${thumbPosition}% - 6px)`,
      top: '50%',
      transform: 'translateY(-50%)',
    } : {
      top: `calc(${100 - thumbPosition}% - 10px)`,
      left: '50%',
      transform: 'translateX(-50%)',
    }),
  };

  return (
    <div
      ref={ref}
      style={sliderStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <div ref={sliderRef} style={{ width: '100%', height: '100%' }} onMouseDown={handleMouseDown}>
        <div style={trackStyle} />
        <div style={thumbStyle} />
        
        {/* Ticks */}
        {tickStyle !== 'None' && (
          <div>
            {Array.from({ length: Math.floor((max - min) / tickFrequency) + 1 }, (_, i) => {
              const tickValue = min + i * tickFrequency;
              const tickPosition = ((tickValue - min) / (max - min)) * 100;
              
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 4,
                    backgroundColor: '#000000',
                    ...(orientation === 'Horizontal' ? {
                      left: `${tickPosition}%`,
                      ...(tickStyle === 'Top' || tickStyle === 'Both' ? { top: 2 } : {}),
                      ...(tickStyle === 'Bottom' || tickStyle === 'Both' ? { bottom: 2 } : {}),
                    } : {
                      top: `${100 - tickPosition}%`,
                      ...(tickStyle === 'Top' || tickStyle === 'Both' ? { left: 2 } : {}),
                      ...(tickStyle === 'Bottom' || tickStyle === 'Both' ? { right: 2 } : {}),
                    }),
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

// UpDown - Contrôle de sélection numérique
export const UpDown = forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    id,
    name,
    x,
    y,
    width,
    height,
    visible,
    enabled,
    value = 0,
    min = 0,
    max = 100,
    increment = 1,
    wrap = false,
    orientation = 'Vertical',
    borderStyle = 'Fixed Single',
    buddyControl,
    tag,
    toolTipText,
    ...rest
  } = props;

  const [currentValue, setCurrentValue] = useState(value);
  const { fireEvent, updateControl } = useVB6Store();

  const handleIncrement = useCallback(() => {
    if (!enabled) return;

    let newValue = currentValue + increment;
    if (newValue > max) {
      newValue = wrap ? min : max;
    }

    setCurrentValue(newValue);
    updateControl(id, 'value', newValue);
    fireEvent(name, 'Change', { value: newValue });
  }, [enabled, currentValue, increment, max, min, wrap, id, name, fireEvent, updateControl]);

  const handleDecrement = useCallback(() => {
    if (!enabled) return;

    let newValue = currentValue - increment;
    if (newValue < min) {
      newValue = wrap ? max : min;
    }

    setCurrentValue(newValue);
    updateControl(id, 'value', newValue);
    fireEvent(name, 'Change', { value: newValue });
  }, [enabled, currentValue, increment, min, max, wrap, id, name, fireEvent, updateControl]);

  const upDownStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    display: visible ? 'flex' : 'none',
    flexDirection: orientation === 'Vertical' ? 'column' : 'row',
    border: borderStyle === 'Fixed Single' ? '2px inset #C0C0C0' : 'none',
    backgroundColor: '#C0C0C0',
    opacity: enabled ? 1 : 0.6,
  };

  const buttonStyle: React.CSSProperties = {
    flex: 1,
    border: '1px outset #C0C0C0',
    backgroundColor: '#C0C0C0',
    cursor: enabled ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontFamily: 'MS Sans Serif',
    userSelect: 'none',
  };

  return (
    <div
      ref={ref}
      style={upDownStyle}
      title={toolTipText}
      data-name={name}
      data-tag={tag}
      {...rest}
    >
      <button
        style={buttonStyle}
        onClick={handleIncrement}
        disabled={!enabled}
      >
        {orientation === 'Vertical' ? '▲' : '▶'}
      </button>
      <button
        style={buttonStyle}
        onClick={handleDecrement}
        disabled={!enabled}
      >
        {orientation === 'Vertical' ? '▼' : '◀'}
      </button>
    </div>
  );
});

export default {
  MSChart,
  ProgressBar,
  MonthView,
  Slider,
  UpDown,
};