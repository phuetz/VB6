# VB6 Graphics Methods - Quick Reference Guide

## Five Core Methods

### 1. Cls() - Clear Drawing Surface

```javascript
form.Cls();
```

Clears the canvas and resets CurrentX/Y to 0.

---

### 2. Line(x1, y1)-(x2, y2), [color], [style]

```javascript
form.Line(10, 10, 100, 100); // Simple line
form.Line(10, 10, 100, 100, vbRed); // Red line
form.Line(10, 10, 100, 100, vbBlue, 'B'); // Box outline
form.Line(10, 10, 100, 100, vbGreen, 'BF'); // Filled box
```

- Updates CurrentX/Y to endpoint
- Optional color parameter
- Optional style: "B" (box), "BF" (filled box)

---

### 3. Circle(x, y, radius, [color], [start], [end], [aspect])

```javascript
form.Circle(320, 240, 50); // Circle
form.Circle(320, 240, 50, vbRed); // Colored circle
form.Circle(320, 240, 50, vbBlue, 0, Math.PI); // Arc (semicircle)
form.Circle(320, 240, 50, vbGreen, 0, 2 * Math.PI, 1.5); // Ellipse
```

- Center (x, y), radius
- Optional color
- Optional start/end angles (radians)
- Optional aspect ratio for ellipses
- Respects FillStyle and FillColor

---

### 4. PSet(x, y, [color])

```javascript
form.PSet(100, 100); // Black pixel (ForeColor)
form.PSet(100, 100, vbRed); // Red pixel
```

- Sets single pixel at (x, y)
- Updates CurrentX/Y
- Uses ForeColor if no color specified

---

### 5. Point(x, y) → color

```javascript
const color = form.Point(100, 100);
```

- Returns pixel color at (x, y)
- Returns as VB6 color (0x00BBGGRR)

---

## Essential Properties

| Property      | Type   | Example                      | Effect             |
| ------------- | ------ | ---------------------------- | ------------------ |
| **CurrentX**  | Number | `form.CurrentX = 100`        | Current X position |
| **CurrentY**  | Number | `form.CurrentY = 200`        | Current Y position |
| **ForeColor** | Color  | `form.ForeColor = vbRed`     | Drawing color      |
| **BackColor** | Color  | `form.BackColor = vbWhite`   | Background color   |
| **FillColor** | Color  | `form.FillColor = vbBlue`    | Fill color         |
| **FillStyle** | Number | `form.FillStyle = vbFSSolid` | Fill pattern       |
| **DrawMode**  | Number | `form.DrawMode = vbCopyPen`  | Drawing mode       |
| **DrawStyle** | Number | `form.DrawStyle = vbDash`    | Line pattern       |
| **DrawWidth** | Number | `form.DrawWidth = 2`         | Line thickness     |
| **ScaleMode** | Number | `form.ScaleMode = vbPixels`  | Coordinate system  |

---

## Color Constants

| Constant  | Hex Value | RGB           |
| --------- | --------- | ------------- |
| vbBlack   | 0x000000  | 0, 0, 0       |
| vbRed     | 0x0000FF  | 255, 0, 0     |
| vbGreen   | 0x00FF00  | 0, 255, 0     |
| vbYellow  | 0x00FFFF  | 255, 255, 0   |
| vbBlue    | 0xFF0000  | 0, 0, 255     |
| vbMagenta | 0xFF00FF  | 255, 0, 255   |
| vbCyan    | 0xFFFF00  | 0, 255, 255   |
| vbWhite   | 0xFFFFFF  | 255, 255, 255 |

**Note:** VB6 uses BGR format (0x00BBGGRR), not standard RGB!

---

## Fill Styles

| Constant           | Value | Result                 |
| ------------------ | ----- | ---------------------- |
| vbFSSolid          | 0     | Solid fill             |
| vbFSTransparent    | 1     | No fill (outline only) |
| vbHorizontalLine   | 2     | Horizontal lines       |
| vbVerticalLine     | 3     | Vertical lines         |
| vbUpwardDiagonal   | 4     | Diagonal lines /       |
| vbDownwardDiagonal | 5     | Diagonal lines \       |
| vbCross            | 6     | Cross pattern          |
| vbDiagonalCross    | 7     | Diagonal cross         |

```javascript
form.FillStyle = vbHorizontalLine;
form.FillColor = vbBlue;
form.Circle(320, 240, 50); // Horizontally hatched circle
```

---

## Draw Modes

| Constant  | Value | Effect            |
| --------- | ----- | ----------------- |
| vbCopyPen | 13    | Copy (default)    |
| vbXorPen  | 7     | XOR with existing |
| vbInvert  | 6     | Invert colors     |

```javascript
form.DrawMode = vbXorPen;
form.Line(0, 0, 100, 100); // XOR drawing
```

---

## Draw Styles

| Constant     | Value | Pattern           |
| ------------ | ----- | ----------------- |
| vbSolid      | 0     | **\_** (solid)    |
| vbDash       | 1     | \_ \_ \_ (dashed) |
| vbDot        | 2     | . . . (dotted)    |
| vbDashDot    | 3     | _._.\_.           |
| vbDashDotDot | 4     | _.._..            |

```javascript
form.DrawStyle = vbDash;
form.DrawWidth = 2;
form.Line(0, 0, 100, 100); // 2-pixel dashed line
```

---

## Scale Modes

| Constant      | Value | Unit                  |
| ------------- | ----- | --------------------- |
| vbTwips       | 1     | 1/1440 inch (DEFAULT) |
| vbPixels      | 3     | Pixels                |
| vbPoints      | 2     | 1/72 inch             |
| vbInches      | 5     | Inches (at 96 DPI)    |
| vbMillimeters | 6     | Millimeters           |
| vbCentimeters | 7     | Centimeters           |
| vbCharacters  | 4     | Character units       |
| vbUser        | 0     | Custom coordinates    |

```javascript
form.ScaleMode = vbPixels;
form.Line(0, 0, 640, 480); // 640x480 pixel line

form.ScaleMode = vbInches;
form.Circle(2, 2, 1); // 1-inch radius circle at (2, 2) inches

form.ScaleMode = vbUser;
form.ScaleWidth = 100;
form.ScaleHeight = 100;
form.Line(0, 0, 100, 100); // Diagonal across custom coordinate space
```

---

## Complete Example

```javascript
// Setup
form.BackColor = vbWhite;
form.Cls();

// Draw border
form.DrawWidth = 2;
form.ForeColor = vbBlack;
form.Line(10, 10, 630, 10);
form.Line(630, 10, 630, 470);
form.Line(630, 470, 10, 470);
form.Line(10, 470, 10, 10);

// Draw circles with different fills
form.FillStyle = vbFSSolid;
form.FillColor = vbRed;
form.Circle(150, 150, 50);

form.FillStyle = vbHorizontalLine;
form.FillColor = vbGreen;
form.Circle(350, 150, 50);

form.FillStyle = vbFSTransparent;
form.ForeColor = vbBlue;
form.DrawWidth = 3;
form.Circle(550, 150, 50);

// Draw lines with different styles
form.DrawWidth = 2;
form.ForeColor = vbBlack;

form.DrawStyle = vbSolid;
form.Line(50, 250, 600, 250);

form.DrawStyle = vbDash;
form.Line(50, 300, 600, 300);

form.DrawStyle = vbDot;
form.Line(50, 350, 600, 350);

// Read and display pixel color
const pixelColor = form.Point(150, 150);
// pixelColor is in BGR format
```

---

## Common Patterns

### Clear and Reset

```javascript
form.Cls();
form.CurrentX = 0;
form.CurrentY = 0;
```

### Draw Box

```javascript
form.ForeColor = vbBlack;
form.Line(x1, y1, x2, y2, vbBlack, 'B');
```

### Draw Filled Box

```javascript
form.FillStyle = vbFSSolid;
form.FillColor = vbBlue;
form.Line(x1, y1, x2, y2, , "BF");
```

### Draw Circle with Hatch

```javascript
form.FillStyle = vbDiagonalCross;
form.FillColor = vbRed;
form.Circle(x, y, radius);
```

### Set Pixel and Read It Back

```javascript
form.PSet(100, 100, vbRed);
const color = form.Point(100, 100); // Read back the red color
```

---

## Important Notes

1. **Color Format:** VB6 uses BGR (0x00BBGGRR), not RGB!
   - vbRed = 0x0000FF (FF in blue position = 255 red)
   - vbBlue = 0xFF0000 (FF in red position = 255 blue)

2. **Default Scale:** Twips (1/1440 inch per unit)
   - 1440 twips = 1 inch
   - ~15 twips = 1 pixel at 96 DPI

3. **Coordinates:** Always (x, y) where:
   - x = horizontal, increases right
   - y = vertical, increases down

4. **Updates CurrentX/Y:** Line, PSet, and movement operations
   - Useful for chaining operations
   - Always points to last drawing position

5. **FillStyle applies to:** Circle() method
   - Line() method with "B" or "BF" uses colors directly
   - FillStyle does NOT affect Line method fills

---

## Performance Tips

1. Use `form.DrawWidth = 1` for thin lines (fastest)
2. Solid lines faster than patterned lines
3. Use vbPixels scale mode for pixel-perfect drawings
4. Minimize Cls() calls if possible
5. Batch related drawing operations together

---

## Troubleshooting

| Issue                     | Solution                               |
| ------------------------- | -------------------------------------- |
| Colors inverted           | Remember BGR format, not RGB           |
| Thin lines not visible    | Increase DrawWidth or zoom             |
| Patterns not showing      | Check FillStyle is set before Circle() |
| Wrong scale               | Verify ScaleMode and coordinate values |
| Text overlapping graphics | Use Print() or adjust CurrentY         |

---

For complete documentation, see: **docs/VB6_GRAPHICS_IMPLEMENTATION.md**
