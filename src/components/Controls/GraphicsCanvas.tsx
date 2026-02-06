import React, { useEffect, useRef, useState } from 'react';
import { VB6Control } from '../../types/vb6';
import { VB6GraphicsFunctions, GraphicsContext } from '../../runtime/VB6GraphicsFunctions';

/**
 * BROWSER FINGERPRINTING BUG FIX: Canvas fingerprinting protection
 */
class CanvasFingerprintingProtection {
  private static instance: CanvasFingerprintingProtection;
  private fingerprintingNoise: Map<string, number> = new Map();

  static getInstance(): CanvasFingerprintingProtection {
    if (!this.instance) {
      this.instance = new CanvasFingerprintingProtection();
    }
    return this.instance;
  }

  /**
   * BROWSER FINGERPRINTING BUG FIX: Add imperceptible noise to canvas
   */
  addCanvasNoise(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Add subtle noise to canvas to prevent fingerprinting
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Add minimal noise to random pixels (invisible to human eye)
    const noiseCount = Math.max(1, Math.floor(data.length / 2000)); // 0.05% of pixels
    for (let i = 0; i < noiseCount; i++) {
      const pixelIndex = Math.floor(this.getSessionNoise(`pixel_${i}`) * (data.length / 4)) * 4;
      if (pixelIndex < data.length - 3) {
        // Add ±1 value noise to RGB channels (imperceptible)
        const noiseR = (this.getSessionNoise(`r_${i}`) - 0.5) * 2;
        const noiseG = (this.getSessionNoise(`g_${i}`) - 0.5) * 2;
        const noiseB = (this.getSessionNoise(`b_${i}`) - 0.5) * 2;

        data[pixelIndex] = Math.max(0, Math.min(255, data[pixelIndex] + noiseR));
        data[pixelIndex + 1] = Math.max(0, Math.min(255, data[pixelIndex + 1] + noiseG));
        data[pixelIndex + 2] = Math.max(0, Math.min(255, data[pixelIndex + 2] + noiseB));
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * BROWSER FINGERPRINTING BUG FIX: Obfuscate mouse coordinates
   */
  obfuscateCoordinates(x: number, y: number): { x: number; y: number } {
    // Add small random offset to prevent precise input device fingerprinting
    const offsetX = (this.getSessionNoise('mouse_x') - 0.5) * 2; // ±1 pixel
    const offsetY = (this.getSessionNoise('mouse_y') - 0.5) * 2; // ±1 pixel

    return {
      x: Math.round(x + offsetX),
      y: Math.round(y + offsetY),
    };
  }

  /**
   * BROWSER FINGERPRINTING BUG FIX: Get session-consistent noise
   */
  private getSessionNoise(key: string): number {
    if (!this.fingerprintingNoise.has(key)) {
      // Generate session-consistent pseudo-random noise
      let hash = 0;
      const sessionKey = key + (sessionStorage.getItem('vb6_canvas_session') || 'canvas_default');
      for (let i = 0; i < sessionKey.length; i++) {
        const char = sessionKey.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      this.fingerprintingNoise.set(key, Math.abs(hash % 1000) / 1000);
    }
    return this.fingerprintingNoise.get(key)!;
  }
}

interface GraphicsCanvasProps {
  control: VB6Control;
  isSelected: boolean;
  isRunning: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<VB6Control>) => void;
}

const GraphicsCanvas: React.FC<GraphicsCanvasProps> = ({
  control,
  isSelected,
  isRunning,
  onSelect,
  onUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<GraphicsContext | null>(null);

  // Initialize graphics context
  useEffect(() => {
    if (canvasRef.current && !context) {
      const graphicsContext = VB6GraphicsFunctions.initializeGraphics(canvasRef.current);

      // Set initial properties
      graphicsContext.foreColor = control.properties.ForeColor || 0x000000;
      graphicsContext.fillColor = control.properties.FillColor || 0xffffff;
      graphicsContext.drawWidth = control.properties.DrawWidth || 1;
      graphicsContext.drawStyle = control.properties.DrawStyle || 0;
      graphicsContext.fillStyle = control.properties.FillStyle || 0;
      graphicsContext.scaleMode = control.properties.ScaleMode || 1;
      graphicsContext.autoRedraw = control.properties.AutoRedraw || false;

      setContext(graphicsContext);

      // Make context available globally for the control
      (window as any)[`${control.properties.Name}_Graphics`] = graphicsContext;
    }
  }, [control.properties.Name]);

  // Update graphics properties when control properties change
  useEffect(() => {
    if (context) {
      context.foreColor = control.properties.ForeColor || 0x000000;
      context.fillColor = control.properties.FillColor || 0xffffff;
      context.drawWidth = control.properties.DrawWidth || 1;
      context.drawStyle = control.properties.DrawStyle || 0;
      context.fillStyle = control.properties.FillStyle || 0;
      context.scaleMode = control.properties.ScaleMode || 1;
      context.autoRedraw = control.properties.AutoRedraw || false;
    }
  }, [control.properties, context]);

  // Handle Paint event
  useEffect(() => {
    if (isRunning && context && control.events?.Paint) {
      try {
        // Set the current context for graphics operations
        VB6GraphicsFunctions.setContext(context);

        // Execute Paint event code
        const paintFunction = new Function(control.events.Paint);
        paintFunction();
      } catch (error) {
        console.error('Error in Paint event:', error);
      }
    }
  }, [isRunning, context, control.events?.Paint]);

  // Handle mouse events for drawing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRunning || !context) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // BROWSER FINGERPRINTING BUG FIX: Obfuscate mouse coordinates
    const protection = CanvasFingerprintingProtection.getInstance();
    const { x, y } = protection.obfuscateCoordinates(rawX, rawY);

    context.currentX = x;
    context.currentY = y;

    if (control.events?.MouseDown) {
      try {
        VB6GraphicsFunctions.setContext(context);
        const mouseDownFunction = new Function(
          'Button',
          'Shift',
          'X',
          'Y',
          control.events.MouseDown
        );
        mouseDownFunction(
          e.buttons,
          e.shiftKey ? 1 : 0 | e.ctrlKey ? 2 : 0 | e.altKey ? 4 : 0,
          x,
          y
        );
      } catch (error) {
        console.error('Error in MouseDown event:', error);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isRunning || !context) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // BROWSER FINGERPRINTING BUG FIX: Obfuscate mouse coordinates
    const protection = CanvasFingerprintingProtection.getInstance();
    const { x, y } = protection.obfuscateCoordinates(rawX, rawY);

    if (control.events?.MouseMove) {
      try {
        VB6GraphicsFunctions.setContext(context);
        const mouseMoveFunction = new Function(
          'Button',
          'Shift',
          'X',
          'Y',
          control.events.MouseMove
        );
        mouseMoveFunction(
          e.buttons,
          e.shiftKey ? 1 : 0 | e.ctrlKey ? 2 : 0 | e.altKey ? 4 : 0,
          x,
          y
        );
      } catch (error) {
        console.error('Error in MouseMove event:', error);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isRunning || !context) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // BROWSER FINGERPRINTING BUG FIX: Obfuscate mouse coordinates
    const protection = CanvasFingerprintingProtection.getInstance();
    const { x, y } = protection.obfuscateCoordinates(rawX, rawY);

    if (control.events?.MouseUp) {
      try {
        VB6GraphicsFunctions.setContext(context);
        const mouseUpFunction = new Function('Button', 'Shift', 'X', 'Y', control.events.MouseUp);
        mouseUpFunction(e.buttons, e.shiftKey ? 1 : 0 | e.ctrlKey ? 2 : 0 | e.altKey ? 4 : 0, x, y);
      } catch (error) {
        console.error('Error in MouseUp event:', error);
      }
    }
  };

  const handleClick = () => {
    if (!isRunning) {
      onSelect();
    } else if (control.events?.Click) {
      try {
        const clickFunction = new Function(control.events.Click);
        clickFunction();
      } catch (error) {
        console.error('Error in Click event:', error);
      }
    }
  };

  return (
    <div
      className={`absolute ${isSelected && !isRunning ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: control.properties.Left,
        top: control.properties.Top,
        width: control.properties.Width,
        height: control.properties.Height,
        cursor: isRunning ? 'crosshair' : 'move',
      }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        width={control.properties.Width}
        height={control.properties.Height}
        style={{
          border: control.properties.BorderStyle ? '1px solid #000' : 'none',
          backgroundColor: control.properties.BackColor
            ? `#${control.properties.BackColor.toString(16).padStart(6, '0')}`
            : 'white',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        // BROWSER FINGERPRINTING BUG FIX: Add canvas noise after rendering
        ref={el => {
          if (el && isRunning) {
            setTimeout(() => {
              CanvasFingerprintingProtection.getInstance().addCanvasNoise(el);
            }, 100); // Add noise after initial render
          }
        }}
      />
      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-500">{control.properties.Name} (Graphics)</span>
        </div>
      )}
    </div>
  );
};

export default GraphicsCanvas;
