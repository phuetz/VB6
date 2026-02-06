import React, { useRef, useState, useCallback } from 'react';
import { Control } from '../../context/types';

interface ImageListProps {
  control: Control;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (corner: string, deltaX: number, deltaY: number) => void;
}

interface VB6Image {
  index: number;
  key: string;
  tag: string;
  picture: string; // Base64 encoded image or URL
}

const ImageList: React.FC<ImageListProps> = ({
  control,
  selected,
  onSelect,
  onDoubleClick,
  onMove,
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const properties = control.properties || {};

  // VB6 ImageList Properties
  const images: VB6Image[] = properties.Images || [];
  const imageWidth = properties.ImageWidth || 16;
  const imageHeight = properties.ImageHeight || 16;
  const backColor = properties.BackColor || 0xc0c0c0; // VB6 color format
  const maskColor = properties.MaskColor || 0xff00ff; // Magenta default
  const useMaskColor = properties.UseMaskColor === true;

  // Convert VB6 color format (&HBBGGRR) to CSS hex color
  const vb6ColorToCss = useCallback((vb6Color: number): string => {
    const r = vb6Color & 0xff;
    const g = (vb6Color >> 8) & 0xff;
    const b = (vb6Color >> 16) & 0xff;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, []);

  // VB6 ImageList Methods
  const vb6Methods = {
    Add: (index?: number, key?: string, picture?: string) => {
      const newImage: VB6Image = {
        index: index || images.length + 1,
        key: key || `Image${images.length + 1}`,
        tag: '',
        picture: picture || '',
      };

      const newImages = [...images, newImage];
      if (control.events?.onChange) {
        control.events.onChange('Images', newImages);
      }

      return newImage;
    },

    Remove: (indexOrKey: number | string) => {
      let imageIndex: number;
      if (typeof indexOrKey === 'string') {
        imageIndex = images.findIndex(img => img.key === indexOrKey);
      } else {
        imageIndex = images.findIndex(img => img.index === indexOrKey);
      }

      if (imageIndex >= 0) {
        const newImages = images.filter((_, i) => i !== imageIndex);
        // Reindex remaining images
        newImages.forEach((img, i) => {
          img.index = i + 1;
        });

        if (control.events?.onChange) {
          control.events.onChange('Images', newImages);
        }
      }
    },

    Clear: () => {
      if (control.events?.onChange) {
        control.events.onChange('Images', []);
      }
    },

    ExtractIcon: (index: number): string | null => {
      const image = images.find(img => img.index === index);
      return image ? image.picture : null;
    },

    Overlay: (index1: number, index2: number): string | null => {
      // Simulate overlay functionality - in real VB6 this would combine images
      const image1 = images.find(img => img.index === index1);
      const image2 = images.find(img => img.index === index2);

      if (image1 && image2) {
        // Return first image as overlay simulation
        return image1.picture;
      }
      return null;
    },
  };

  // Handle file drop for adding images
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = event => {
          const base64 = event.target?.result as string;
          vb6Methods.Add(undefined, file.name.split('.')[0], base64);
        };
        reader.readAsDataURL(file);
      });
    },
    [vb6Methods]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Mouse event handlers for control dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();

    if (e.detail === 2) {
      onDoubleClick();
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      onMove(deltaX, deltaY);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, onMove]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: control.left,
    top: control.top,
    width: 32, // ImageList is typically not visible in VB6, but we show a small icon
    height: 32,
    border: selected ? '2px dashed #0066cc' : '1px solid #808080',
    backgroundColor: vb6ColorToCss(backColor),
    cursor: isDragging ? 'move' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    overflow: 'hidden',
  };

  const previewStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: Math.max(200, imageWidth * Math.min(8, images.length) + 16),
    backgroundColor: '#f0f0f0',
    border: '1px solid #808080',
    padding: 8,
    zIndex: 1000,
    display: selected ? 'block' : 'none',
    maxHeight: 200,
    overflowY: 'auto',
  };

  return (
    <>
      <div
        ref={containerRef}
        style={containerStyle}
        onMouseDown={handleMouseDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="vb6-imagelist"
        title={`ImageList - ${images.length} images (${imageWidth}x${imageHeight})`}
      >
        🖼️
        {images.length > 0 && (
          <span
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              backgroundColor: '#ff0000',
              color: 'white',
              fontSize: '8px',
              padding: '1px 3px',
              borderRadius: '2px',
              minWidth: '12px',
              textAlign: 'center',
            }}
          >
            {images.length}
          </span>
        )}
      </div>

      {/* Preview panel when selected */}
      <div style={previewStyle}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            marginBottom: 8,
            color: '#333',
          }}
        >
          ImageList Preview ({imageWidth}×{imageHeight})
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, ${imageWidth + 4}px)`,
            gap: 4,
            justifyContent: 'start',
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.key}
              style={{
                width: imageWidth,
                height: imageHeight,
                border: '1px solid #ccc',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
              title={`${image.key} (${image.index})`}
            >
              {image.picture ? (
                <img
                  src={image.picture}
                  alt={image.key}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <span style={{ fontSize: '8px', color: '#999' }}>{image.index}</span>
              )}
            </div>
          ))}

          {/* Add new image placeholder */}
          <div
            style={{
              width: imageWidth,
              height: imageHeight,
              border: '2px dashed #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#999',
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = 'image/*';
              input.onchange = e => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = event => {
                    const base64 = event.target?.result as string;
                    vb6Methods.Add(undefined, file.name.split('.')[0], base64);
                  };
                  reader.readAsDataURL(file);
                });
              };
              input.click();
            }}
            title="Click to add images"
          >
            +
          </div>
        </div>

        {images.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#999',
              fontSize: '10px',
              fontStyle: 'italic',
              padding: 20,
            }}
          >
            No images loaded
            <br />
            Drop image files here or click + to add
          </div>
        )}

        <div
          style={{
            marginTop: 8,
            padding: 4,
            backgroundColor: '#e0e0e0',
            fontSize: '9px',
            color: '#666',
          }}
        >
          <div>Count: {images.length}</div>
          <div>
            Size: {imageWidth}×{imageHeight}
          </div>
          <div>Mask: {useMaskColor ? vb6ColorToCss(maskColor) : 'None'}</div>
        </div>
      </div>
    </>
  );
};

export default ImageList;
