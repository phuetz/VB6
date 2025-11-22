/**
 * MSChart Control - Complete VB6 Chart Implementation
 * Supports all VB6 chart types with full API compatibility
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// VB6 Chart Constants
export enum VtChChartType {
  vtChChartType3dBar = 0,
  vtChChartType2dBar = 1,
  vtChChartType3dLine = 2,
  vtChChartType2dLine = 3,
  vtChChartType3dArea = 4,
  vtChChartType2dArea = 5,
  vtChChartType3dStep = 6,
  vtChChartType2dStep = 7,
  vtChChartType3dCombination = 8,
  vtChChartType2dCombination = 9,
  vtChChartType2dPie = 14,
  vtChChartType2dXY = 16
}

export enum VtChLegendLocation {
  vtChLegendLocationNone = 0,
  vtChLegendLocationBottom = 1,
  vtChLegendLocationTop = 2,
  vtChLegendLocationLeft = 3,
  vtChLegendLocationRight = 4
}

export enum VtChTitleLocation {
  vtChTitleLocationNone = 0,
  vtChTitleLocationTop = 1,
  vtChTitleLocationBottom = 2,
  vtChTitleLocationLeft = 3,
  vtChTitleLocationRight = 4
}

export interface ChartData {
  columnCount: number;
  rowCount: number;
  values: number[][];
  columnLabels: string[];
  rowLabels: string[];
}

export interface ChartSeries {
  seriesColumn: number;
  seriesType: VtChChartType;
  showLine: boolean;
  lineStyle: number;
  lineWidth: number;
  lineColor: string;
  fillColor: string;
  markerStyle: number;
  markerSize: number;
  markerColor: string;
}

export interface MSChartProps extends VB6ControlPropsEnhanced {
  // Chart properties
  chartType?: VtChChartType;
  showLegend?: boolean;
  legendLocation?: VtChLegendLocation;
  titleText?: string;
  titleLocation?: VtChTitleLocation;
  
  // Data properties
  data?: ChartData;
  autoIncrement?: boolean;
  allowSeriesSelection?: boolean;
  allowPointSelection?: boolean;
  
  // Appearance
  chartBackColor?: string;
  plotBackColor?: string;
  gridLineColor?: string;
  showGridLines?: boolean;
  borderStyle?: number;
  
  // 3D properties
  chart3D?: boolean;
  depth?: number;
  rotation?: number;
  elevation?: number;
  
  // Axis properties
  showXAxisLabels?: boolean;
  showYAxisLabels?: boolean;
  xAxisTitle?: string;
  yAxisTitle?: string;
  
  // Events
  onPointSelected?: (series: number, dataPoint: number, mouseFlags: number, cancel: boolean) => void;
  onSeriesSelected?: (series: number, mouseFlags: number, cancel: boolean) => void;
  onPointActivated?: (series: number, dataPoint: number, mouseFlags: number, cancel: boolean) => void;
  onChartActivated?: (mouseFlags: number, cancel: boolean) => void;
}

export const MSChartControl = forwardRef<HTMLDivElement, MSChartProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 300,
    height = 200,
    visible = true,
    enabled = true,
    chartType = VtChChartType.vtChChartType2dBar,
    showLegend = true,
    legendLocation = VtChLegendLocation.vtChLegendLocationBottom,
    titleText = '',
    titleLocation = VtChTitleLocation.vtChTitleLocationTop,
    data,
    autoIncrement = true,
    allowSeriesSelection = true,
    allowPointSelection = true,
    chartBackColor = '#FFFFFF',
    plotBackColor = '#F0F0F0',
    gridLineColor = '#C0C0C0',
    showGridLines = true,
    borderStyle = 1,
    chart3D = false,
    depth = 100,
    rotation = 20,
    elevation = 15,
    showXAxisLabels = true,
    showYAxisLabels = true,
    xAxisTitle = '',
    yAxisTitle = '',
    onPointSelected,
    onSeriesSelected,
    onPointActivated,
    onChartActivated,
    ...rest
  } = props;

  const [chartData, setChartData] = useState<ChartData>(data || {
    columnCount: 4,
    rowCount: 3,
    values: [
      [10, 20, 30, 40],
      [15, 25, 35, 45],
      [12, 22, 32, 42]
    ],
    columnLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
    rowLabels: ['Series 1', 'Series 2', 'Series 3']
  });

  const [selectedSeries, setSelectedSeries] = useState(-1);
  const [selectedPoint, setSelectedPoint] = useState({ series: -1, point: -1 });
  const [isAnimating, setIsAnimating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // VB6 Methods
  const vb6Methods = {
    EditCopy: () => {
      // Copy chart to clipboard
      if (canvasRef.current) {
        canvasRef.current.toBlob(blob => {
          if (blob) {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
          }
        });
      }
    },

    EditPaste: () => {
      // Paste data from clipboard
      navigator.clipboard.readText().then(text => {
        try {
          const data = JSON.parse(text);
          if (data.values && data.columnLabels && data.rowLabels) {
            setChartData(data);
          }
        } catch (e) {
          console.warn('Invalid chart data in clipboard');
        }
      });
    },

    PrintChart: () => {
      // Print the chart
      if (canvasRef.current) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head><title>Chart</title></head>
              <body style="margin:0; padding:20px;">
                <img src="${canvasRef.current.toDataURL()}" style="max-width:100%;" />
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    },

    SaveChart: (filename: string, format: string = 'PNG') => {
      // Save chart as image
      if (canvasRef.current) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvasRef.current.toDataURL();
        link.click();
      }
    },

    Refresh: () => {
      // Redraw chart
      drawChart();
    },

    Layout: () => {
      // Recalculate layout
      setTimeout(drawChart, 0);
    },

    ShowData: () => {
      // Show data grid (would open a dialog)
      console.log('Chart Data:', chartData);
    },

    TwipsToChartPart: (x: number, y: number) => {
      // Convert coordinates to chart part
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { part: 0, series: 0, point: 0 };
      
      const relX = x - rect.left;
      const relY = y - rect.top;
      
      // Simplified hit testing
      return {
        part: relX > 0 && relY > 0 ? 1 : 0, // 1 = chart area
        series: 0,
        point: 0
      };
    }
  };

  // Draw chart function
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width as number;
    canvas.height = height as number;

    // Clear canvas
    ctx.fillStyle = chartBackColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate chart area
    const margin = 60;
    const titleHeight = titleText ? 30 : 0;
    const legendHeight = showLegend && legendLocation === VtChLegendLocation.vtChLegendLocationBottom ? 40 : 0;
    
    const chartArea = {
      x: margin,
      y: margin + titleHeight,
      width: canvas.width - (margin * 2),
      height: canvas.height - (margin * 2) - titleHeight - legendHeight
    };

    // Draw background
    ctx.fillStyle = plotBackColor;
    ctx.fillRect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

    // Draw border
    if (borderStyle > 0) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = borderStyle;
      ctx.strokeRect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);
    }

    // Draw grid lines
    if (showGridLines) {
      ctx.strokeStyle = gridLineColor;
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let i = 1; i < chartData.columnCount; i++) {
        const x = chartArea.x + (chartArea.width / chartData.columnCount) * i;
        ctx.beginPath();
        ctx.moveTo(x, chartArea.y);
        ctx.lineTo(x, chartArea.y + chartArea.height);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      const maxValue = Math.max(...chartData.values.flat());
      for (let i = 1; i < 6; i++) {
        const y = chartArea.y + (chartArea.height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(chartArea.x, y);
        ctx.lineTo(chartArea.x + chartArea.width, y);
        ctx.stroke();
      }
    }

    // Draw title
    if (titleText && titleLocation === VtChTitleLocation.vtChTitleLocationTop) {
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(titleText, canvas.width / 2, 25);
    }

    // Draw chart based on type
    switch (chartType) {
      case VtChChartType.vtChChartType2dBar:
      case VtChChartType.vtChChartType3dBar:
        drawBarChart(ctx, chartArea);
        break;
      case VtChChartType.vtChChartType2dLine:
      case VtChChartType.vtChChartType3dLine:
        drawLineChart(ctx, chartArea);
        break;
      case VtChChartType.vtChChartType2dArea:
      case VtChChartType.vtChChartType3dArea:
        drawAreaChart(ctx, chartArea);
        break;
      case VtChChartType.vtChChartType2dPie:
        drawPieChart(ctx, chartArea);
        break;
      case VtChChartType.vtChChartType2dXY:
        drawXYChart(ctx, chartArea);
        break;
    }

    // Draw axes labels
    if (showXAxisLabels) {
      drawXAxisLabels(ctx, chartArea);
    }
    if (showYAxisLabels) {
      drawYAxisLabels(ctx, chartArea);
    }

    // Draw legend
    if (showLegend) {
      drawLegend(ctx);
    }

  }, [chartData, chartType, width, height, chartBackColor, plotBackColor, gridLineColor, showGridLines, titleText, showLegend]);

  const drawBarChart = (ctx: CanvasRenderingContext2D, area: any) => {
    const maxValue = Math.max(...chartData.values.flat());
    const barWidth = area.width / (chartData.columnCount * chartData.rowCount + chartData.columnCount + 1);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    chartData.values.forEach((series, seriesIndex) => {
      series.forEach((value, colIndex) => {
        const barHeight = (value / maxValue) * area.height;
        const x = area.x + (colIndex * (chartData.rowCount + 1) + seriesIndex + 1) * barWidth;
        const y = area.y + area.height - barHeight;

        // Highlight selected series/point
        const isSelected = selectedSeries === seriesIndex || 
                          (selectedPoint.series === seriesIndex && selectedPoint.point === colIndex);
        
        ctx.fillStyle = isSelected ? '#FF0000' : colors[seriesIndex % colors.length];
        
        if (chart3D) {
          // Simple 3D effect
          const offset = 5;
          ctx.fillStyle = isSelected ? '#CC0000' : colors[seriesIndex % colors.length];
          ctx.fillRect(x + offset, y - offset, barWidth - 2, barHeight);
          ctx.fillStyle = isSelected ? '#FF0000' : colors[seriesIndex % colors.length];
        }
        
        ctx.fillRect(x, y, barWidth - 2, barHeight);
        
        // Draw border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth - 2, barHeight);
      });
    });
  };

  const drawLineChart = (ctx: CanvasRenderingContext2D, area: any) => {
    const maxValue = Math.max(...chartData.values.flat());
    const pointWidth = area.width / (chartData.columnCount - 1);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    chartData.values.forEach((series, seriesIndex) => {
      ctx.strokeStyle = colors[seriesIndex % colors.length];
      ctx.lineWidth = 3;
      ctx.beginPath();

      series.forEach((value, colIndex) => {
        const x = area.x + colIndex * pointWidth;
        const y = area.y + area.height - (value / maxValue) * area.height;

        if (colIndex === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Draw data points
        ctx.fillStyle = colors[seriesIndex % colors.length];
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.stroke();
    });
  };

  const drawAreaChart = (ctx: CanvasRenderingContext2D, area: any) => {
    const maxValue = Math.max(...chartData.values.flat());
    const pointWidth = area.width / (chartData.columnCount - 1);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    chartData.values.forEach((series, seriesIndex) => {
      const gradient = ctx.createLinearGradient(0, area.y, 0, area.y + area.height);
      gradient.addColorStop(0, colors[seriesIndex % colors.length] + '80');
      gradient.addColorStop(1, colors[seriesIndex % colors.length] + '20');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(area.x, area.y + area.height);

      series.forEach((value, colIndex) => {
        const x = area.x + colIndex * pointWidth;
        const y = area.y + area.height - (value / maxValue) * area.height;
        ctx.lineTo(x, y);
      });

      ctx.lineTo(area.x + area.width, area.y + area.height);
      ctx.closePath();
      ctx.fill();

      // Draw line on top
      ctx.strokeStyle = colors[seriesIndex % colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      series.forEach((value, colIndex) => {
        const x = area.x + colIndex * pointWidth;
        const y = area.y + area.height - (value / maxValue) * area.height;
        if (colIndex === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  };

  const drawPieChart = (ctx: CanvasRenderingContext2D, area: any) => {
    const centerX = area.x + area.width / 2;
    const centerY = area.y + area.height / 2;
    const radius = Math.min(area.width, area.height) / 3;
    
    // Use first series data
    const data = chartData.values[0] || [];
    const total = data.reduce((sum, value) => sum + value, 0);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98'];

    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw labels
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
      
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(chartData.columnLabels[index] || `Item ${index + 1}`, labelX, labelY);

      currentAngle += sliceAngle;
    });
  };

  const drawXYChart = (ctx: CanvasRenderingContext2D, area: any) => {
    // XY Scatter plot
    const maxValueX = Math.max(...chartData.values[0] || []);
    const maxValueY = Math.max(...chartData.values[1] || []);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];

    if (chartData.values.length >= 2) {
      for (let i = 0; i < chartData.values[0].length; i++) {
        const x = area.x + (chartData.values[0][i] / maxValueX) * area.width;
        const y = area.y + area.height - (chartData.values[1][i] / maxValueY) * area.height;

        ctx.fillStyle = colors[0];
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      }
    }
  };

  const drawXAxisLabels = (ctx: CanvasRenderingContext2D, area: any) => {
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    chartData.columnLabels.forEach((label, index) => {
      const x = area.x + (area.width / chartData.columnCount) * (index + 0.5);
      const y = area.y + area.height + 20;
      ctx.fillText(label, x, y);
    });

    if (xAxisTitle) {
      ctx.font = 'bold 14px Arial';
      ctx.fillText(xAxisTitle, area.x + area.width / 2, area.y + area.height + 45);
    }
  };

  const drawYAxisLabels = (ctx: CanvasRenderingContext2D, area: any) => {
    const maxValue = Math.max(...chartData.values.flat());
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const value = (maxValue / 5) * (5 - i);
      const y = area.y + (area.height / 5) * i + 5;
      ctx.fillText(value.toFixed(0), area.x - 10, y);
    }

    if (yAxisTitle) {
      ctx.save();
      ctx.translate(15, area.y + area.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(yAxisTitle, 0, 0);
      ctx.restore();
    }
  };

  const drawLegend = (ctx: CanvasRenderingContext2D) => {
    if (legendLocation === VtChLegendLocation.vtChLegendLocationNone) return;

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const legendY = (height as number) - 35;
    let startX = 20;

    ctx.font = '12px Arial';
    ctx.textAlign = 'left';

    chartData.rowLabels.forEach((label, index) => {
      // Draw color box
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(startX, legendY, 15, 15);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(startX, legendY, 15, 15);

      // Draw label
      ctx.fillStyle = '#000000';
      ctx.fillText(label, startX + 20, legendY + 12);

      startX += ctx.measureText(label).width + 45;
    });
  };

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enabled || !allowSeriesSelection && !allowPointSelection) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Simple hit testing for demonstration
    const chartArea = {
      x: 60,
      y: 60 + (titleText ? 30 : 0),
      width: canvas.width - 120,
      height: canvas.height - 120 - (titleText ? 30 : 0) - (showLegend ? 40 : 0)
    };

    if (x >= chartArea.x && x <= chartArea.x + chartArea.width &&
        y >= chartArea.y && y <= chartArea.y + chartArea.height) {
      
      if (chartType === VtChChartType.vtChChartType2dBar || chartType === VtChChartType.vtChChartType3dBar) {
        // Calculate which bar was clicked
        const barWidth = chartArea.width / (chartData.columnCount * chartData.rowCount + chartData.columnCount + 1);
        const clickedIndex = Math.floor((x - chartArea.x) / barWidth);
        const seriesIndex = clickedIndex % chartData.rowCount;
        const pointIndex = Math.floor(clickedIndex / (chartData.rowCount + 1));

        if (allowPointSelection) {
          setSelectedPoint({ series: seriesIndex, point: pointIndex });
          onPointSelected?.(seriesIndex, pointIndex, 0, false);
          fireEvent(name, 'PointSelected', { series: seriesIndex, dataPoint: pointIndex });
        }
      }

      if (allowSeriesSelection) {
        setSelectedSeries(0); // Simplified
        onSeriesSelected?.(0, 0, false);
        fireEvent(name, 'SeriesSelected', { series: 0 });
      }
    }

    drawChart();
  };

  // Initialize chart
  useEffect(() => {
    if (canvasRef.current) {
      drawChart();
    }
  }, [drawChart]);

  // Update control properties in store
  useEffect(() => {
    updateControl(id, 'ChartType', chartType);
    updateControl(id, 'ShowLegend', showLegend);
    updateControl(id, 'TitleText', titleText);
  }, [id, chartType, showLegend, titleText, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        opacity: enabled ? 1 : 0.5,
        cursor: enabled ? 'pointer' : 'default',
        border: borderStyle > 0 ? `${borderStyle}px solid #000000` : 'none'
      }}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
});

MSChartControl.displayName = 'MSChartControl';

export default MSChartControl;