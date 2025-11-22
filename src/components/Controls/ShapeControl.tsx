import React from 'react';
import { Control } from '../../context/types';

interface ShapeControlProps {
  control: Control;
  isDesignMode?: boolean;
}

export const ShapeControl: React.FC<ShapeControlProps> = ({ control, isDesignMode = false }) => {
  // VB6 Shape properties
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    shape = 0, // 0=Rectangle, 1=Square, 2=Oval, 3=Circle, 4=Rounded Rectangle, 5=Rounded Square
    fillColor = '#FFFFFF',
    fillStyle = 1, // 0=Solid, 1=Transparent, 2=HorizontalLine, 3=VerticalLine, 4=UpwardDiagonal, 5=DownwardDiagonal, 6=Cross, 7=DiagonalCross
    borderColor = '#000000',
    borderStyle = 1, // 0=Transparent, 1=Solid, 2=Dash, 3=Dot, 4=DashDot, 5=DashDotDot, 6=InsideSolid
    borderWidth = 1,
    backStyle = 1, // 0=Transparent, 1=Opaque
    visible = true,
    drawMode = 13,
    tag = '',
    index,
  } = control;

  if (!visible) return null;

  // Convert VB6 border style to SVG stroke-dasharray
  const getStrokeDashArray = (style: number): string | undefined => {
    switch (style) {
      case 0: return '0'; // Transparent
      case 2: return '5,5'; // Dash
      case 3: return '2,2'; // Dot
      case 4: return '5,2,2,2'; // DashDot
      case 5: return '5,2,2,2,2,2'; // DashDotDot
      default: return undefined; // Solid or InsideSolid
    }
  };

  // Create fill pattern for different fill styles
  const getFillPattern = () => {
    if (fillStyle === 0 || fillStyle === 1) return null; // Solid or Transparent
    
    const patternId = `pattern-${control.id}-${fillStyle}`;
    const strokeColor = fillStyle === 1 ? 'transparent' : borderColor;
    
    switch (fillStyle) {
      case 2: // Horizontal Line
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="4" height="4">
            <line x1="0" y1="2" x2="4" y2="2" stroke={strokeColor} strokeWidth="1" />
          </pattern>
        );
      case 3: // Vertical Line
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="4" height="4">
            <line x1="2" y1="0" x2="2" y2="4" stroke={strokeColor} strokeWidth="1" />
          </pattern>
        );
      case 4: // Upward Diagonal
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="4" height="4">
            <line x1="0" y1="4" x2="4" y2="0" stroke={strokeColor} strokeWidth="1" />
          </pattern>
        );
      case 5: // Downward Diagonal
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="4" height="4">
            <line x1="0" y1="0" x2="4" y2="4" stroke={strokeColor} strokeWidth="1" />
          </pattern>
        );
      case 6: // Cross
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="4" height="4">
            <line x1="0" y1="2" x2="4" y2="2" stroke={strokeColor} strokeWidth="1" />
            <line x1="2" y1="0" x2="2" y2="4" stroke={strokeColor} strokeWidth="1" />
          </pattern>
        );
      case 7: // Diagonal Cross
        return (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="4" height="4">
            <line x1="0" y1="0" x2="4" y2="4" stroke={strokeColor} strokeWidth="1" />
            <line x1="0" y1="4" x2="4" y2="0" stroke={strokeColor} strokeWidth="1" />
          </pattern>
        );
      default:
        return null;
    }
  };

  // Get fill value based on fill style
  const getFillValue = () => {
    if (backStyle === 0 || fillStyle === 1) return 'transparent';
    if (fillStyle === 0) return fillColor;
    if (fillStyle >= 2 && fillStyle <= 7) return `url(#pattern-${control.id}-${fillStyle})`;
    return fillColor;
  };

  // Render the appropriate shape
  const renderShape = () => {
    const strokeValue = borderStyle === 0 ? 'transparent' : borderColor;
    const strokeWidthValue = borderStyle === 6 ? borderWidth : borderWidth; // InsideSolid handled by vectorEffect
    
    const commonProps = {
      fill: getFillValue(),
      stroke: strokeValue,
      strokeWidth: strokeWidthValue,
      strokeDasharray: getStrokeDashArray(borderStyle),
      vectorEffect: borderStyle === 6 ? 'non-scaling-stroke' : undefined,
    };

    switch (shape) {
      case 0: // Rectangle
        return <rect x={0} y={0} width={width} height={height} {...commonProps} />;
      
      case 1: { // Square
        const squareSize = Math.min(width, height);
        return <rect x={0} y={0} width={squareSize} height={squareSize} {...commonProps} />;
      }
      
      case 2: // Oval
        return <ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} {...commonProps} />;
      
      case 3: { // Circle
        const radius = Math.min(width, height) / 2;
        return <circle cx={radius} cy={radius} r={radius} {...commonProps} />;
      }
      
      case 4: { // Rounded Rectangle
        const roundRadius = Math.min(width, height) * 0.2;
        return <rect x={0} y={0} width={width} height={height} rx={roundRadius} ry={roundRadius} {...commonProps} />;
      }
      
      case 5: { // Rounded Square
        const roundSquareSize = Math.min(width, height);
        const roundSquareRadius = roundSquareSize * 0.2;
        return <rect x={0} y={0} width={roundSquareSize} height={roundSquareSize} rx={roundSquareRadius} ry={roundSquareRadius} {...commonProps} />;
      }
      
      default:
        return <rect x={0} y={0} width={width} height={height} {...commonProps} />;
    }
  };

  // Convert VB6 DrawMode to SVG mix-blend-mode
  const getBlendMode = (mode: number): string => {
    switch (mode) {
      case 1: return 'normal'; // vbBlackness
      case 2: return 'normal'; // vbNotMergePen
      case 3: return 'multiply'; // vbMaskNotPen
      case 4: return 'normal'; // vbNotCopyPen
      case 5: return 'screen'; // vbMaskPenNot
      case 6: return 'difference'; // vbInvert
      case 7: return 'xor'; // vbXorPen
      case 8: return 'normal'; // vbNotMaskPen
      case 9: return 'multiply'; // vbMaskPen
      case 10: return 'xor'; // vbNotXorPen
      case 11: return 'normal'; // vbNop
      case 12: return 'screen'; // vbMergeNotPen
      case 13: return 'normal'; // vbCopyPen (default)
      case 14: return 'lighten'; // vbMergePenNot
      case 15: return 'lighten'; // vbMergePen
      case 16: return 'normal'; // vbWhiteness
      default: return 'normal';
    }
  };

  return (
    <svg
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        overflow: 'visible',
        pointerEvents: isDesignMode ? 'none' : 'auto',
        mixBlendMode: getBlendMode(drawMode),
      }}
      data-control-type="Shape"
      data-control-name={control.name}
      data-control-index={index}
    >
      <defs>
        {getFillPattern()}
      </defs>
      
      {renderShape()}
      
      {/* Design mode selection indicators */}
      {isDesignMode && (
        <rect
          x={-1}
          y={-1}
          width={width + 2}
          height={height + 2}
          fill="none"
          stroke="#0066cc"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity="0.5"
        />
      )}
    </svg>
  );
};

// VB6 Shape default properties
export const getShapeDefaults = (id: number) => ({
  id,
  type: 'Shape',
  name: `Shape${id}`,
  x: 100,
  y: 100,
  width: 100,
  height: 100,
  shape: 0, // Rectangle by default
  fillColor: '#FFFFFF',
  fillStyle: 1, // Transparent by default
  borderColor: '#000000',
  borderStyle: 1, // Solid
  borderWidth: 1,
  backStyle: 1, // Opaque
  visible: true,
  drawMode: 13,
  tag: '',
  tabIndex: id,
});

export default ShapeControl;