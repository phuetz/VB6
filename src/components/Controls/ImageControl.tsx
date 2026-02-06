import React, { useState, useCallback } from 'react';
import { Control } from '../../context/types';

interface ImageControlProps {
  control: Control;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
}

export const ImageControl: React.FC<ImageControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
}) => {
  // VB6 Image properties
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    picture = '', // Path or base64 image data
    stretch = false, // True to stretch image to fit control
    appearance = 1, // 0=Flat, 1=3D
    borderStyle = 0, // 0=None, 1=Fixed Single
    enabled = true,
    visible = true,
    dataField = '',
    dataSource = '',
    dragMode = 0, // 0=Manual, 1=Automatic
    toolTipText = '',
    tag = '',
    index,
  } = control;

  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
    console.warn(`Failed to load image for control ${control.name}`);
  }, [control.name]);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  if (!visible) return null;

  // Handle different image sources (file path, URL, base64)
  const getImageSrc = (): string => {
    if (!picture) return '';

    // Check if it's a base64 image
    if (picture.startsWith('data:image')) {
      return picture;
    }

    // Check if it's a URL
    if (picture.startsWith('http://') || picture.startsWith('https://')) {
      return picture;
    }

    // Otherwise treat as a relative path
    // In a real implementation, this would need to resolve VB6 project paths
    return `/images/${picture}`;
  };

  // Get border style
  const getBorderStyle = () => {
    if (borderStyle === 0) return {};

    return {
      border: appearance === 0 ? '1px solid #000000' : '1px solid #808080',
      boxShadow: appearance === 1 ? 'inset -1px -1px #ffffff, inset 1px 1px #808080' : undefined,
    };
  };

  // Calculate image sizing based on stretch property
  const getImageStyle = (): React.CSSProperties => {
    if (stretch) {
      return {
        width: '100%',
        height: '100%',
        objectFit: 'fill' as const,
      };
    } else {
      return {
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain' as const,
      };
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: enabled ? 1 : 0.5,
        cursor: dragMode === 1 ? 'move' : enabled ? 'pointer' : 'default',
        ...getBorderStyle(),
      }}
      data-control-type="Image"
      data-control-name={control.name}
      data-control-index={index}
      title={toolTipText}
    >
      {picture && !imageError ? (
        <img
          src={getImageSrc()}
          alt={control.name}
          style={getImageStyle()}
          onError={handleImageError}
          onLoad={handleImageLoad}
          draggable={dragMode === 1}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#666',
            fontSize: '12px',
            textAlign: 'center',
            padding: '4px',
          }}
        >
          {imageError ? 'Error loading image' : 'No image'}
        </div>
      )}

      {/* Design mode selection indicator */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: -1,
            left: -1,
            right: -1,
            bottom: -1,
            border: '1px dashed #0066cc',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

// VB6 Image control methods
export const ImageControlMethods = {
  // Move method
  move: (control: Control, left?: number, top?: number, width?: number, height?: number) => {
    const updates: Partial<Control> = {};
    if (left !== undefined) updates.x = left;
    if (top !== undefined) updates.y = top;
    if (width !== undefined) updates.width = width;
    if (height !== undefined) updates.height = height;
    return updates;
  },

  // Refresh method
  refresh: (control: Control) => {
    // In React, this would trigger a re-render
    return { ...control, _refresh: Date.now() };
  },

  // Drag method
  drag: (control: Control) => {
    // Initiate OLE drag operation
  },
};

// VB6 Image events
export const ImageControlEvents = {
  Click: 'Click',
  DblClick: 'DblClick',
  MouseDown: 'MouseDown',
  MouseMove: 'MouseMove',
  MouseUp: 'MouseUp',
  DragDrop: 'DragDrop',
  DragOver: 'DragOver',
};

// VB6 Image default properties
export const getImageDefaults = (id: number) => ({
  id,
  type: 'Image',
  name: `Image${id}`,
  x: 100,
  y: 100,
  width: 100,
  height: 100,
  picture: '',
  stretch: false,
  appearance: 1,
  borderStyle: 0,
  enabled: true,
  visible: true,
  dataField: '',
  dataSource: '',
  dragMode: 0,
  toolTipText: '',
  tag: '',
  tabIndex: id,
});

export default ImageControl;
