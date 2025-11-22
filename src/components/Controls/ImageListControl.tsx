/**
 * ImageList Control - Complete VB6 Image Collection Implementation
 * Provides image storage and management for other controls
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// ImageList Constants
export enum ImageListColorDepth {
  ccColorDepth4Bit = 0,
  ccColorDepth8Bit = 1,
  ccColorDepth16Bit = 2,
  ccColorDepth24Bit = 3,
  ccColorDepth32Bit = 4
}

export interface ListImage {
  index: number;
  key: string;
  tag: string;
  picture: string | HTMLImageElement | ImageData;
  width: number;
  height: number;
  maskColor?: string;
}

export interface ImageListProps extends VB6ControlPropsEnhanced {
  // Image properties
  imageWidth?: number;
  imageHeight?: number;
  colorDepth?: ImageListColorDepth;
  maskColor?: string;
  useMaskColor?: boolean;
  
  // Images collection
  listImages?: ListImage[];
  
  // Events
  onImageAdded?: (image: ListImage) => void;
  onImageRemoved?: (index: number) => void;
}

export const ImageListControl = forwardRef<HTMLDivElement, ImageListProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 32,
    height = 32,
    visible = true,
    enabled = true,
    imageWidth = 16,
    imageHeight = 16,
    colorDepth = ImageListColorDepth.ccColorDepth24Bit,
    maskColor = '#FF00FF', // Magenta default
    useMaskColor = false,
    listImages: initialImages = [],
    onImageAdded,
    onImageRemoved,
    ...rest
  } = props;

  const [listImages, setListImages] = useState<ListImage[]>(initialImages);
  const [previewImage, setPreviewImage] = useState<ListImage | null>(null);
  
  const imageListRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // VB6 Methods
  const vb6Methods = {
    // Add image from various sources
    Add: (index?: number, key?: string, picture?: string | HTMLImageElement | File | Blob, maskColor?: string) => {
      return new Promise<ListImage>((resolve, reject) => {
        const newIndex = index ?? listImages.length + 1;
        const newKey = key || `Image${newIndex}`;
        
        const createListImage = (imageData: string | HTMLImageElement | ImageData) => {
          const newImage: ListImage = {
            index: newIndex,
            key: newKey,
            tag: '',
            picture: imageData,
            width: imageWidth,
            height: imageHeight,
            maskColor: maskColor || props.maskColor
          };
          
          const updatedImages = [...listImages];
          if (index !== undefined && index <= listImages.length) {
            updatedImages.splice(index - 1, 0, newImage);
            // Reindex subsequent images
            for (let i = index; i < updatedImages.length; i++) {
              updatedImages[i].index = i + 1;
            }
          } else {
            updatedImages.push(newImage);
          }
          
          setListImages(updatedImages);
          onImageAdded?.(newImage);
          fireEvent(name, 'ImageAdded', { image: newImage });
          resolve(newImage);
        };
        
        if (typeof picture === 'string') {
          // URL or data URL
          const img = new Image();
          img.onload = () => createListImage(img);
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = picture;
        } else if (picture instanceof HTMLImageElement) {
          createListImage(picture);
        } else if (picture instanceof File || picture instanceof Blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => createListImage(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(picture);
        } else {
          reject(new Error('Invalid picture format'));
        }
      });
    },

    // Remove image
    Remove: (indexOrKey: number | string) => {
      const imageIndex = typeof indexOrKey === 'number' 
        ? indexOrKey - 1 
        : listImages.findIndex(img => img.key === indexOrKey);
        
      if (imageIndex < 0 || imageIndex >= listImages.length) {
        return false;
      }
      
      const removedImage = listImages[imageIndex];
      const updatedImages = listImages.filter((_, i) => i !== imageIndex);
      
      // Reindex remaining images
      updatedImages.forEach((img, i) => {
        img.index = i + 1;
      });
      
      setListImages(updatedImages);
      onImageRemoved?.(removedImage.index);
      fireEvent(name, 'ImageRemoved', { image: removedImage });
      return true;
    },

    // Clear all images
    Clear: () => {
      setListImages([]);
      fireEvent(name, 'ImagesCleared', {});
    },

    // Get image by index or key
    Item: (indexOrKey: number | string): ListImage | null => {
      if (typeof indexOrKey === 'number') {
        return listImages[indexOrKey - 1] || null;
      } else {
        return listImages.find(img => img.key === indexOrKey) || null;
      }
    },

    // Get image count
    get Count() { return listImages.length; },

    // Extract image as canvas/data URL
    ExtractImage: (indexOrKey: number | string, format: 'canvas' | 'dataURL' | 'blob' = 'dataURL') => {
      const image = vb6Methods.Item(indexOrKey);
      if (!image) return null;
      
      const canvas = document.createElement('canvas');
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      return new Promise((resolve) => {
        const drawImage = (img: HTMLImageElement) => {
          ctx.clearRect(0, 0, imageWidth, imageHeight);
          
          // Apply mask color if enabled
          if (useMaskColor && image.maskColor) {
            ctx.fillStyle = image.maskColor;
            ctx.fillRect(0, 0, imageWidth, imageHeight);
            ctx.globalCompositeOperation = 'source-in';
          }
          
          ctx.drawImage(img, 0, 0, imageWidth, imageHeight);
          
          switch (format) {
            case 'canvas':
              resolve(canvas);
              break;
            case 'dataURL':
              resolve(canvas.toDataURL());
              break;
            case 'blob':
              canvas.toBlob(resolve);
              break;
          }
        };
        
        if (image.picture instanceof HTMLImageElement) {
          drawImage(image.picture);
        } else if (typeof image.picture === 'string') {
          const img = new Image();
          img.onload = () => drawImage(img);
          img.src = image.picture as string;
        }
      });
    },

    // Draw image to external canvas
    Draw: (indexOrKey: number | string, canvas: HTMLCanvasElement, x: number, y: number, style?: number) => {
      const image = vb6Methods.Item(indexOrKey);
      if (!image || !canvas.getContext) return false;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      const drawImage = (img: HTMLImageElement) => {
        // Apply drawing style
        switch (style) {
          case 1: // Transparent
            ctx.globalCompositeOperation = 'source-over';
            break;
          case 2: // Masked
            if (useMaskColor && image.maskColor) {
              // Create a temporary canvas for masking
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = imageWidth;
              tempCanvas.height = imageHeight;
              const tempCtx = tempCanvas.getContext('2d');
              
              if (tempCtx) {
                tempCtx.drawImage(img, 0, 0, imageWidth, imageHeight);
                const imageData = tempCtx.getImageData(0, 0, imageWidth, imageHeight);
                const data = imageData.data;
                
                // Convert mask color to RGB
                const maskRGB = hexToRgb(image.maskColor);
                if (maskRGB) {
                  for (let i = 0; i < data.length; i += 4) {
                    if (data[i] === maskRGB.r && data[i + 1] === maskRGB.g && data[i + 2] === maskRGB.b) {
                      data[i + 3] = 0; // Make transparent
                    }
                  }
                }
                
                tempCtx.putImageData(imageData, 0, 0);
                ctx.drawImage(tempCanvas, x, y);
                return true;
              }
            }
            break;
          default:
            break;
        }
        
        ctx.drawImage(img, x, y, imageWidth, imageHeight);
        return true;
      };
      
      if (image.picture instanceof HTMLImageElement) {
        return drawImage(image.picture);
      } else if (typeof image.picture === 'string') {
        const img = new Image();
        img.onload = () => drawImage(img);
        img.src = image.picture as string;
        return true; // Async operation
      }
      
      return false;
    },

    // Overlay image
    Overlay: (indexOrKey: number | string, overlayIndex: number | string) => {
      const baseImage = vb6Methods.Item(indexOrKey);
      const overlayImage = vb6Methods.Item(overlayIndex);
      
      if (!baseImage || !overlayImage) return null;
      
      return vb6Methods.ExtractImage(indexOrKey, 'canvas').then((baseCanvas: any) => {
        if (!baseCanvas) return null;
        
        const ctx = baseCanvas.getContext('2d');
        if (!ctx) return null;
        
        return new Promise((resolve) => {
          const drawOverlay = (overlayImg: HTMLImageElement) => {
            ctx.drawImage(overlayImg, 0, 0, imageWidth, imageHeight);
            resolve(baseCanvas.toDataURL());
          };
          
          if (overlayImage.picture instanceof HTMLImageElement) {
            drawOverlay(overlayImage.picture);
          } else if (typeof overlayImage.picture === 'string') {
            const img = new Image();
            img.onload = () => drawOverlay(img);
            img.src = overlayImage.picture as string;
          }
        });
      });
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const handlePreviewHover = useCallback((image: ListImage | null) => {
    setPreviewImage(image);
  }, []);

  // Update control properties
  useEffect(() => {
    updateControl(id, 'ListImages', listImages);
    updateControl(id, 'Count', listImages.length);
    updateControl(id, 'ImageWidth', imageWidth);
    updateControl(id, 'ImageHeight', imageHeight);
  }, [id, listImages, imageWidth, imageHeight, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  // Expose methods globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalAny = window as any;
      globalAny.VB6Controls = globalAny.VB6Controls || {};
      globalAny.VB6Controls[name] = {
        Add: vb6Methods.Add,
        Remove: vb6Methods.Remove,
        Clear: vb6Methods.Clear,
        Item: vb6Methods.Item,
        ExtractImage: vb6Methods.ExtractImage,
        Draw: vb6Methods.Draw,
        Overlay: vb6Methods.Overlay,
        get Count() { return vb6Methods.Count; }
      };
    }
  }, [name, vb6Methods]);

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
        border: '2px inset #c0c0c0',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'MS Sans Serif',
        fontSize: '8pt',
        opacity: enabled ? 1 : 0.5,
        overflow: 'hidden',
        cursor: 'default'
      }}
      title={`ImageList: ${listImages.length} images (${imageWidth}x${imageHeight})`}
      {...rest}
    >
      {/* Design-time preview */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        {/* ImageList icon */}
        <div style={{
          width: '24px',
          height: '24px',
          backgroundImage: `linear-gradient(45deg, #808080 25%, transparent 25%, transparent 75%, #808080 75%, #808080),
                           linear-gradient(45deg, #808080 25%, transparent 25%, transparent 75%, #808080 75%, #808080)`,
          backgroundPosition: '0 0, 6px 6px',
          backgroundSize: '12px 12px',
          border: '1px solid #606060',
          marginBottom: '2px'
        }} />
        
        {/* Control info */}
        <div style={{
          fontSize: '6pt',
          color: '#666666',
          lineHeight: '1.1'
        }}>
          <div>ImageList</div>
          <div>{listImages.length} images</div>
          <div>{imageWidth}×{imageHeight}</div>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        width={imageWidth}
        height={imageHeight}
        style={{ display: 'none' }}
      />
      
      {/* Image preview tooltip (if hovering over an image) */}
      {previewImage && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          border: '1px solid #000000',
          padding: '4px',
          fontSize: '8pt',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          <div>Key: {previewImage.key}</div>
          <div>Index: {previewImage.index}</div>
          <div>Size: {previewImage.width}×{previewImage.height}</div>
          {previewImage.picture instanceof HTMLImageElement && (
            <img
              src={previewImage.picture.src}
              alt={previewImage.key}
              style={{
                width: Math.min(previewImage.width * 2, 64),
                height: Math.min(previewImage.height * 2, 64),
                imageRendering: 'pixelated'
              }}
            />
          )}
        </div>
      )}
    </div>
  );
});

ImageListControl.displayName = 'ImageListControl';

export default ImageListControl;