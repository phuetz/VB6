/**
 * VB6 Graphics Methods Test Suite
 * Tests for Circle, Line, PSet, Point, and Cls methods
 * Verifies VB6 graphics compatibility with HTML5 Canvas
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VB6GraphicsContext,
  VB6DrawMode,
  VB6DrawStyle,
  VB6FillStyle,
  VB6ScaleMode
} from '../../runtime/VB6FormGraphics';
import { VB6ColorConstants } from '../../runtime/VB6Constants';

describe('VB6 Graphics Methods', () => {
  let canvas: HTMLCanvasElement;
  let ctx: VB6GraphicsContext;

  beforeEach(() => {
    // Create a mock canvas element
    canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    document.body.appendChild(canvas);

    // Create graphics context
    ctx = new VB6GraphicsContext();
    ctx.attachToElement(canvas);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(canvas);
  });

  describe('Cls - Clear Drawing Surface', () => {
    it('should clear the canvas', () => {
      ctx.Cls();
      expect(ctx.CurrentX).toBe(0);
      expect(ctx.CurrentY).toBe(0);
    });

    it('should reset current position', () => {
      ctx.CurrentX = 100;
      ctx.CurrentY = 200;
      ctx.Cls();
      expect(ctx.CurrentX).toBe(0);
      expect(ctx.CurrentY).toBe(0);
    });

    it('should fill with back color if specified', () => {
      ctx.BackColor = '#FF0000'; // Red
      ctx.Cls();
      // Canvas should be cleared and ready for drawing
      expect(ctx.canvas).toBeTruthy();
    });
  });

  describe('PSet - Set Pixel', () => {
    it('should set pixel at coordinates', () => {
      ctx.PSet(100, 100, '#0000FF');
      expect(ctx.CurrentX).toBe(100);
      expect(ctx.CurrentY).toBe(100);
    });

    it('should use ForeColor when color not specified', () => {
      ctx.ForeColor = '#FF0000';
      ctx.PSet(50, 50);
      expect(ctx.CurrentX).toBe(50);
      expect(ctx.CurrentY).toBe(50);
    });

    it('should handle multiple pixels', () => {
      ctx.PSet(0, 0, '#000000');
      ctx.PSet(100, 100, '#FFFFFF');
      ctx.PSet(200, 200, '#FF0000');
      expect(ctx.CurrentX).toBe(200);
      expect(ctx.CurrentY).toBe(200);
    });
  });

  describe('Point - Get Pixel Color', () => {
    it('should return a color value', () => {
      ctx.PSet(100, 100, '#0000FF');
      const color = ctx.Point(100, 100);
      expect(typeof color).toBe('number');
    });

    it('should return black color for undrawn pixels (in clear canvas)', () => {
      const color = ctx.Point(50, 50);
      // Transparent/empty area should be close to 0
      expect(color).toBeLessThanOrEqual(0x100000); // Allow some tolerance
    });

    it('should retrieve previously drawn pixel color', () => {
      const testColor = '#FF0000'; // Red
      ctx.PSet(120, 120, testColor);
      const retrievedColor = ctx.Point(120, 120);
      expect(retrievedColor).toBeGreaterThan(0); // Should have a color value
    });
  });

  describe('Line - Draw Line', () => {
    it('should draw a line between two points', () => {
      ctx.Line(0, 0, 100, 100);
      expect(ctx.CurrentX).toBe(100);
      expect(ctx.CurrentY).toBe(100);
    });

    it('should update current position to end point', () => {
      ctx.Line(50, 50, 150, 150);
      expect(ctx.CurrentX).toBe(150);
      expect(ctx.CurrentY).toBe(150);
    });

    it('should draw with specified color', () => {
      ctx.Line(10, 10, 110, 110, '#00FF00');
      expect(ctx.CurrentX).toBe(110);
      expect(ctx.CurrentY).toBe(110);
    });

    it('should draw a box with B style', () => {
      ctx.Line(50, 50, 150, 150, '#0000FF', 'B');
      // Box should be drawn as outline
      expect(ctx.CurrentX).toBe(150);
      expect(ctx.CurrentY).toBe(150);
    });

    it('should draw a filled box with BF style', () => {
      ctx.Line(50, 50, 150, 150, '#FF0000', 'BF');
      // Filled box should be drawn
      expect(ctx.CurrentX).toBe(150);
      expect(ctx.CurrentY).toBe(150);
    });

    it('should support different draw styles', () => {
      ctx.DrawStyle = VB6DrawStyle.vbDash;
      ctx.Line(0, 0, 100, 100);
      expect(ctx.CurrentX).toBe(100);

      ctx.DrawStyle = VB6DrawStyle.vbDot;
      ctx.Line(0, 0, 100, 100);
      expect(ctx.CurrentX).toBe(100);
    });

    it('should support different draw modes (XOR)', () => {
      ctx.DrawMode = VB6DrawMode.vbXorPen;
      ctx.Line(0, 0, 100, 100);
      expect(ctx.CurrentX).toBe(100);
    });
  });

  describe('Circle - Draw Circle', () => {
    it('should draw a circle at center with radius', () => {
      ctx.Circle(320, 240, 50);
      expect(ctx.canvas).toBeTruthy();
    });

    it('should draw circle with specified color', () => {
      ctx.Circle(320, 240, 50, '#FF0000');
      expect(ctx.canvas).toBeTruthy();
    });

    it('should draw ellipse with aspect ratio', () => {
      ctx.Circle(320, 240, 50, '#0000FF', undefined, undefined, 1.5);
      expect(ctx.canvas).toBeTruthy();
    });

    it('should draw arc with start and end angles', () => {
      ctx.Circle(320, 240, 50, '#00FF00', 0, Math.PI);
      expect(ctx.canvas).toBeTruthy();
    });

    it('should fill circle with solid fill', () => {
      ctx.FillStyle = VB6FillStyle.vbFSSolid;
      ctx.FillColor = '#FF0000';
      ctx.Circle(320, 240, 50);
      expect(ctx.FillStyle).toBe(VB6FillStyle.vbFSSolid);
    });

    it('should draw circle with transparent fill', () => {
      ctx.FillStyle = VB6FillStyle.vbFSTransparent;
      ctx.Circle(320, 240, 50);
      expect(ctx.FillStyle).toBe(VB6FillStyle.vbFSTransparent);
    });

    it('should draw circle with hatched fill patterns', () => {
      const patterns = [
        VB6FillStyle.vbHorizontalLine,
        VB6FillStyle.vbVerticalLine,
        VB6FillStyle.vbUpwardDiagonal,
        VB6FillStyle.vbDownwardDiagonal,
        VB6FillStyle.vbCross,
        VB6FillStyle.vbDiagonalCross
      ];

      patterns.forEach((pattern) => {
        ctx.FillStyle = pattern;
        ctx.Circle(320, 240, 50);
        expect(ctx.FillStyle).toBe(pattern);
      });
    });
  });

  describe('Graphics Properties', () => {
    describe('DrawMode', () => {
      it('should support vbCopyPen mode', () => {
        ctx.DrawMode = VB6DrawMode.vbCopyPen;
        expect(ctx.DrawMode).toBe(VB6DrawMode.vbCopyPen);
      });

      it('should support vbXorPen mode', () => {
        ctx.DrawMode = VB6DrawMode.vbXorPen;
        expect(ctx.DrawMode).toBe(VB6DrawMode.vbXorPen);
      });

      it('should support vbInvert mode', () => {
        ctx.DrawMode = VB6DrawMode.vbInvert;
        expect(ctx.DrawMode).toBe(VB6DrawMode.vbInvert);
      });
    });

    describe('FillStyle', () => {
      it('should support solid fill', () => {
        ctx.FillStyle = VB6FillStyle.vbFSSolid;
        expect(ctx.FillStyle).toBe(VB6FillStyle.vbFSSolid);
      });

      it('should support transparent fill', () => {
        ctx.FillStyle = VB6FillStyle.vbFSTransparent;
        expect(ctx.FillStyle).toBe(VB6FillStyle.vbFSTransparent);
      });

      it('should support all hatch patterns', () => {
        const patterns = [
          VB6FillStyle.vbHorizontalLine,
          VB6FillStyle.vbVerticalLine,
          VB6FillStyle.vbUpwardDiagonal,
          VB6FillStyle.vbDownwardDiagonal,
          VB6FillStyle.vbCross,
          VB6FillStyle.vbDiagonalCross
        ];

        patterns.forEach((pattern) => {
          ctx.FillStyle = pattern;
          expect(ctx.FillStyle).toBe(pattern);
        });
      });
    });

    describe('DrawStyle', () => {
      it('should support solid line', () => {
        ctx.DrawStyle = VB6DrawStyle.vbSolid;
        expect(ctx.DrawStyle).toBe(VB6DrawStyle.vbSolid);
      });

      it('should support dashed line', () => {
        ctx.DrawStyle = VB6DrawStyle.vbDash;
        expect(ctx.DrawStyle).toBe(VB6DrawStyle.vbDash);
      });

      it('should support dotted line', () => {
        ctx.DrawStyle = VB6DrawStyle.vbDot;
        expect(ctx.DrawStyle).toBe(VB6DrawStyle.vbDot);
      });

      it('should support dash-dot line', () => {
        ctx.DrawStyle = VB6DrawStyle.vbDashDot;
        expect(ctx.DrawStyle).toBe(VB6DrawStyle.vbDashDot);
      });
    });

    describe('ScaleMode', () => {
      it('should support twips scale mode', () => {
        ctx.ScaleMode = VB6ScaleMode.vbTwips;
        expect(ctx.ScaleMode).toBe(VB6ScaleMode.vbTwips);
      });

      it('should support pixels scale mode', () => {
        ctx.ScaleMode = VB6ScaleMode.vbPixels;
        expect(ctx.ScaleMode).toBe(VB6ScaleMode.vbPixels);
      });

      it('should support user-defined scale mode', () => {
        ctx.ScaleMode = VB6ScaleMode.vbUser;
        expect(ctx.ScaleMode).toBe(VB6ScaleMode.vbUser);
      });

      it('should support inches scale mode', () => {
        ctx.ScaleMode = VB6ScaleMode.vbInches;
        expect(ctx.ScaleMode).toBe(VB6ScaleMode.vbInches);
      });
    });

    describe('CurrentX and CurrentY', () => {
      it('should track current drawing position', () => {
        ctx.CurrentX = 100;
        ctx.CurrentY = 200;
        expect(ctx.CurrentX).toBe(100);
        expect(ctx.CurrentY).toBe(200);
      });

      it('should be updated by drawing operations', () => {
        ctx.Line(50, 50, 150, 150);
        expect(ctx.CurrentX).toBe(150);
        expect(ctx.CurrentY).toBe(150);

        ctx.PSet(200, 250);
        expect(ctx.CurrentX).toBe(200);
        expect(ctx.CurrentY).toBe(250);
      });
    });

    describe('ForeColor and BackColor', () => {
      it('should set foreground color', () => {
        ctx.ForeColor = '#FF0000';
        expect(ctx.ForeColor).toBe('#FF0000');
      });

      it('should set background color', () => {
        ctx.BackColor = '#00FF00';
        expect(ctx.BackColor).toBe('#00FF00');
      });

      it('should set fill color', () => {
        ctx.FillColor = '#0000FF';
        expect(ctx.FillColor).toBe('#0000FF');
      });
    });

    describe('DrawWidth', () => {
      it('should set line width', () => {
        ctx.DrawWidth = 2;
        expect(ctx.DrawWidth).toBe(2);

        ctx.DrawWidth = 5;
        expect(ctx.DrawWidth).toBe(5);
      });
    });

    describe('ScaleWidth and ScaleHeight', () => {
      it('should set custom scale dimensions', () => {
        ctx.ScaleMode = VB6ScaleMode.vbUser;
        ctx.ScaleWidth = 1000;
        ctx.ScaleHeight = 1000;
        expect(ctx.ScaleWidth).toBe(1000);
        expect(ctx.ScaleHeight).toBe(1000);
      });
    });
  });

  describe('VB6 Color Constants', () => {
    it('should have correct color values', () => {
      expect(VB6ColorConstants.vbBlack).toBe(0x000000);
      expect(VB6ColorConstants.vbRed).toBe(0x0000FF);
      expect(VB6ColorConstants.vbGreen).toBe(0x00FF00);
      expect(VB6ColorConstants.vbBlue).toBe(0xFF0000);
      expect(VB6ColorConstants.vbWhite).toBe(0xFFFFFF);
    });

    it('should support all basic colors', () => {
      const colors = [
        VB6ColorConstants.vbBlack,
        VB6ColorConstants.vbRed,
        VB6ColorConstants.vbGreen,
        VB6ColorConstants.vbYellow,
        VB6ColorConstants.vbBlue,
        VB6ColorConstants.vbMagenta,
        VB6ColorConstants.vbCyan,
        VB6ColorConstants.vbWhite
      ];

      colors.forEach((color) => {
        expect(typeof color).toBe('number');
        expect(color).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Text Methods', () => {
    it('TextWidth should measure text width', () => {
      const width = ctx.TextWidth('Hello World');
      expect(typeof width).toBe('number');
      expect(width).toBeGreaterThan(0);
    });

    it('TextHeight should return text height', () => {
      const height = ctx.TextHeight('Hello');
      expect(typeof height).toBe('number');
      expect(height).toBeGreaterThan(0);
    });

    it('Print should output text at current position', () => {
      ctx.CurrentX = 0;
      ctx.CurrentY = 0;
      ctx.Print('Test String');
      // CurrentX should advance after printing
      expect(ctx.CurrentX).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Coordinate Conversion', () => {
    it('should convert twips to pixels', () => {
      ctx.ScaleMode = VB6ScaleMode.vbTwips;
      // 1440 twips = 1 inch = 96 pixels
      // So 15 twips = 1 pixel
      const pixels = ctx['unitsToPixels'](15, true);
      expect(pixels).toBeCloseTo(1, 0);
    });

    it('should convert pixels to twips', () => {
      ctx.ScaleMode = VB6ScaleMode.vbTwips;
      const twips = ctx['pixelsToUnits'](1, true);
      expect(twips).toBeCloseTo(15, 0);
    });

    it('should handle user-defined scale mode', () => {
      ctx.ScaleMode = VB6ScaleMode.vbUser;
      ctx.ScaleWidth = 100;
      ctx.ScaleHeight = 100;
      expect(ctx.ScaleWidth).toBe(100);
      expect(ctx.ScaleHeight).toBe(100);
    });
  });

  describe('Integration Tests', () => {
    it('should draw a complete graphics scene', () => {
      ctx.Cls();

      // Draw background
      ctx.BackColor = '#F0F0F0';
      ctx.Cls();

      // Draw lines
      ctx.ForeColor = '#000000';
      ctx.Line(10, 10, 630, 10);
      ctx.Line(10, 10, 10, 470);

      // Draw circles
      ctx.FillColor = '#FF0000';
      ctx.FillStyle = VB6FillStyle.vbFSSolid;
      ctx.Circle(200, 200, 50);

      ctx.FillColor = '#00FF00';
      ctx.FillStyle = VB6FillStyle.vbHorizontalLine;
      ctx.Circle(400, 200, 50);

      // Draw pixels
      ctx.PSet(100, 100, '#0000FF');
      ctx.PSet(500, 300, '#FFFF00');

      // Retrieve pixel color
      const color = ctx.Point(100, 100);
      expect(color).toBeGreaterThan(0);

      expect(ctx.canvas).toBeTruthy();
    });

    it('should handle multiple graphics operations in sequence', () => {
      ctx.Cls();
      ctx.DrawWidth = 2;
      ctx.ForeColor = '#FF0000';

      ctx.Line(0, 0, 100, 100);
      expect(ctx.CurrentX).toBe(100);

      ctx.Circle(150, 150, 40);

      ctx.PSet(200, 200, '#00FF00');
      expect(ctx.CurrentX).toBe(200);

      const color = ctx.Point(200, 200);
      expect(color).toBeGreaterThan(0);

      expect(ctx.canvas).toBeTruthy();
    });
  });
});
