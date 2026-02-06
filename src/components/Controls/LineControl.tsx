import React from 'react';
import { Control } from '../../context/types';

interface LineControlProps {
  control: Control;
  isDesignMode?: boolean;
}

export const LineControl: React.FC<LineControlProps> = ({ control, isDesignMode = false }) => {
  // VB6 Line properties
  const {
    x = 0,
    y = 0,
    x1 = 0,
    y1 = 0,
    x2 = 100,
    y2 = 100,
    borderColor = '#000000',
    borderStyle = 1, // 0=Transparent, 1=Solid, 2=Dash, 3=Dot, 4=DashDot, 5=DashDotDot
    borderWidth = 1,
    visible = true,
    drawMode = 13, // VB6 DrawMode constants
    tag = '',
    index,
  } = control;

  if (!visible) return null;

  // Calculate absolute positions based on x,y offset
  const absoluteX1 = x + x1;
  const absoluteY1 = y + y1;
  const absoluteX2 = x + x2;
  const absoluteY2 = y + y2;

  // Convert VB6 border style to SVG stroke-dasharray
  const getStrokeDashArray = (style: number): string | undefined => {
    switch (style) {
      case 0:
        return '0'; // Transparent
      case 2:
        return '5,5'; // Dash
      case 3:
        return '2,2'; // Dot
      case 4:
        return '5,2,2,2'; // DashDot
      case 5:
        return '5,2,2,2,2,2'; // DashDotDot
      default:
        return undefined; // Solid
    }
  };

  // Convert VB6 DrawMode to SVG mix-blend-mode
  const getBlendMode = (mode: number): string => {
    switch (mode) {
      case 1:
        return 'normal'; // vbBlackness
      case 2:
        return 'normal'; // vbNotMergePen
      case 3:
        return 'multiply'; // vbMaskNotPen
      case 4:
        return 'normal'; // vbNotCopyPen
      case 5:
        return 'screen'; // vbMaskPenNot
      case 6:
        return 'difference'; // vbInvert
      case 7:
        return 'xor'; // vbXorPen
      case 8:
        return 'normal'; // vbNotMaskPen
      case 9:
        return 'multiply'; // vbMaskPen
      case 10:
        return 'xor'; // vbNotXorPen
      case 11:
        return 'normal'; // vbNop
      case 12:
        return 'screen'; // vbMergeNotPen
      case 13:
        return 'normal'; // vbCopyPen (default)
      case 14:
        return 'lighten'; // vbMergePenNot
      case 15:
        return 'lighten'; // vbMergePen
      case 16:
        return 'normal'; // vbWhiteness
      default:
        return 'normal';
    }
  };

  // Calculate SVG container size
  const svgWidth = Math.abs(x2 - x1) + borderWidth;
  const svgHeight = Math.abs(y2 - y1) + borderWidth;
  const svgX = Math.min(absoluteX1, absoluteX2) - borderWidth / 2;
  const svgY = Math.min(absoluteY1, absoluteY2) - borderWidth / 2;

  // Adjust line coordinates relative to SVG container
  const lineX1 = absoluteX1 - svgX;
  const lineY1 = absoluteY1 - svgY;
  const lineX2 = absoluteX2 - svgX;
  const lineY2 = absoluteY2 - svgY;

  return (
    <svg
      style={{
        position: 'absolute',
        left: svgX,
        top: svgY,
        width: svgWidth,
        height: svgHeight,
        overflow: 'visible',
        pointerEvents: isDesignMode ? 'none' : 'auto',
        mixBlendMode: getBlendMode(drawMode),
      }}
      data-control-type="Line"
      data-control-name={control.name}
      data-control-index={index}
    >
      <line
        x1={lineX1}
        y1={lineY1}
        x2={lineX2}
        y2={lineY2}
        stroke={borderStyle === 0 ? 'transparent' : borderColor}
        strokeWidth={borderWidth}
        strokeDasharray={getStrokeDashArray(borderStyle)}
        strokeLinecap="square"
        vectorEffect="non-scaling-stroke"
      />

      {/* Design mode selection handles */}
      {isDesignMode && (
        <>
          <circle
            cx={lineX1}
            cy={lineY1}
            r="4"
            fill="#0066cc"
            stroke="#fff"
            strokeWidth="1"
            style={{ cursor: 'move' }}
          />
          <circle
            cx={lineX2}
            cy={lineY2}
            r="4"
            fill="#0066cc"
            stroke="#fff"
            strokeWidth="1"
            style={{ cursor: 'move' }}
          />
        </>
      )}
    </svg>
  );
};

// VB6 Line default properties
export const getLineDefaults = (id: number) => ({
  id,
  type: 'Line',
  name: `Line${id}`,
  x: 0,
  y: 0,
  x1: 0,
  y1: 0,
  x2: 100,
  y2: 100,
  borderColor: '#000000',
  borderStyle: 1,
  borderWidth: 1,
  visible: true,
  drawMode: 13,
  tag: '',
  tabIndex: id,
});

export default LineControl;
