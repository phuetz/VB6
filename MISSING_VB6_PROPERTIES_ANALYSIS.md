# Missing VB6 Properties Analysis

This document provides a comprehensive analysis of missing VB6 properties in the current implementation.

## Summary

The codebase has two property definition files:

1. `VB6Properties.ts` - Contains a good set of properties but not exhaustive
2. `VB6CompleteProperties.ts` - Contains more complete property definitions
3. `controlDefaults.ts` - Contains only the most basic properties for runtime

## Missing Properties by Control

### Common Properties (Missing from all controls)

Based on VB6CompleteProperties.ts common properties, these are missing from controlDefaults.ts:

- `Container` - Parent container reference
- `Parent` - Parent control reference
- `RightToLeft` - Right-to-left reading support
- `DataBindings` - Data binding configuration
- `DataChanged` - Data modification flag
- `DataField` - Data field name
- `DataFormat` - Data formatting
- `DataMember` - Data member name
- `DataSource` - Data source reference
- `OLEDragMode` - OLE drag mode
- `OLEDropMode` - OLE drop mode
- `MousePointer` - Mouse cursor type
- `MouseIcon` - Custom mouse cursor
- `DragMode` - Drag mode setting
- `DragIcon` - Drag icon
- `HelpContextID` - Help context ID
- `WhatsThisHelpID` - What's This help ID
- `CausesValidation` - Validation triggering

### CommandButton

Missing properties from VB6CompleteProperties.ts:

- `Appearance` - 3D/Flat appearance
- `hWnd` - Window handle
- `DisabledPicture` - Picture when disabled
- `DownPicture` - Picture when pressed
- `MaskColor` - Transparent color for pictures
- `UseMaskColor` - Use mask color flag
- `Picture` - Button picture
- `Value` - Button state (for graphical style)

### TextBox

Missing properties:

- `Appearance` - 3D/Flat appearance
- `hWnd` - Window handle
- `LinkMode` - DDE link mode
- `LinkTopic` - DDE link topic
- `LinkItem` - DDE link item
- `LinkTimeout` - DDE link timeout
- `HideSelection` - Hide selection when not focused
- `SelStart` - Selection start position
- `SelLength` - Selection length
- `SelText` - Selected text

### Label

Missing properties:

- `Appearance` - 3D/Flat appearance
- `LinkMode` - DDE link mode
- `LinkTopic` - DDE link topic
- `LinkItem` - DDE link item
- `LinkTimeout` - DDE link timeout
- `UseMnemonic` - Use mnemonic characters

### CheckBox

Missing properties:

- `Appearance` - 3D/Flat appearance
- `hWnd` - Window handle
- `Style` - Standard/Graphical style
- `Picture` - Picture for graphical style
- `DisabledPicture` - Picture when disabled
- `DownPicture` - Picture when pressed
- `MaskColor` - Transparent color
- `UseMaskColor` - Use mask color flag

### OptionButton

Missing properties:

- `Appearance` - 3D/Flat appearance
- `hWnd` - Window handle
- `Style` - Standard/Graphical style
- `Picture` - Picture for graphical style
- `DisabledPicture` - Picture when disabled
- `DownPicture` - Picture when pressed
- `MaskColor` - Transparent color
- `UseMaskColor` - Use mask color flag

### ListBox

Missing properties:

- `Appearance` - 3D/Flat appearance
- `hWnd` - Window handle
- `ListIndex` - Selected item index
- `ListCount` - Number of items
- `Selected` - Array of selected states
- `IntegralHeight` - Show complete items only
- `ItemData` - Item data array
- `Columns` - Number of columns
- `TopIndex` - First visible item
- `NewIndex` - Recently added item index
- `Text` - Selected item text

### ComboBox

Missing properties:

- `Appearance` - 3D/Flat appearance
- `hWnd` - Window handle
- `ListIndex` - Selected item index
- `ListCount` - Number of items
- `IntegralHeight` - Show complete items only
- `ItemData` - Item data array
- `Locked` - Lock text editing
- `MaxLength` - Maximum text length
- `SelStart` - Selection start
- `SelLength` - Selection length
- `SelText` - Selected text
- `TopIndex` - First visible item
- `NewIndex` - Recently added item index

### Frame

Missing properties:

- `BorderStyle` - Border style
- `ClipControls` - Clip child controls
- `Appearance` - 3D/Flat appearance

### PictureBox

Missing extensive properties including:

- `Font` - Font settings
- `ForeColor` - Text color
- `Appearance` - 3D/Flat appearance
- `Align` - Alignment to parent
- `ClipControls` - Clip child controls
- `AutoRedraw` - Persistent graphics
- `ScaleMode` - Scale units
- `ScaleLeft/Top/Width/Height` - Custom scale
- `CurrentX/Y` - Drawing position
- `DrawMode` - Drawing mode
- `DrawStyle` - Line style
- `DrawWidth` - Line width
- `FillColor` - Fill color
- `FillStyle` - Fill pattern
- `hDC` - Device context handle
- `Image` - Persistent image
- `LinkMode/Topic/Item/Timeout` - DDE properties

### Timer

Complete - has all essential properties

### Form

Missing many properties including:

- `BorderStyle` - Window border style
- `Icon` - Window icon
- `WindowState` - Normal/Minimized/Maximized
- `StartUpPosition` - Window position
- `MDIChild` - MDI child flag
- `MaxButton` - Maximize button
- `MinButton` - Minimize button
- `ControlBox` - Control box
- `ShowInTaskbar` - Taskbar visibility
- `Moveable` - Can be moved
- `AutoRedraw` - Persistent graphics
- `ClipControls` - Clip child controls
- Drawing properties (DrawMode, DrawStyle, etc.)
- Scale properties
- `KeyPreview` - Form receives key events first
- Many others...

### Advanced Controls

Many advanced controls have only basic properties implemented:

#### TreeView

Missing: Style, LineStyle, Appearance, BorderStyle, ImageList, Indentation, LabelEdit, PathSeparator, Sorted, SingleSel, HideSelection, HotTracking, FullRowSelect, Checkboxes, OLE properties, DropHighlight

#### ListView

Missing: View modes, Arrange, LabelEdit, Sort properties, MultiSelect, GridLines, FullRowSelect, HideSelection, HotTracking, HoverSelection, FlatScrollBar, Checkboxes, Appearance, BorderStyle, Icon lists, OLE properties

#### MSFlexGrid

Not implemented in controlDefaults.ts but has extensive properties in VB6CompleteProperties.ts

#### DataGrid

Basic implementation missing many data-binding and appearance properties

#### ProgressBar

Missing: Orientation, Scrolling mode, Appearance, BorderStyle, OLE properties

#### Slider

Missing: TickStyle, TickFrequency, LargeChange, SmallChange, SelectRange, Selection properties, BorderStyle, MousePointer/Icon, OLE properties

## Recommendations

1. **Priority 1 - Common Properties**: Add missing common properties that apply to all controls, especially:
   - Window handles (hWnd)
   - Appearance (3D/Flat)
   - Data binding properties
   - OLE drag/drop support
   - Mouse pointer customization

2. **Priority 2 - Core Control Properties**: Update core controls (TextBox, Label, CommandButton, etc.) with:
   - Appearance settings
   - Link/DDE properties
   - Selection properties for text controls
   - Picture properties for buttons

3. **Priority 3 - Advanced Controls**: Enhance advanced controls with their specific properties:
   - TreeView/ListView view modes and behaviors
   - Grid controls with full data support
   - Rich property sets for data controls

4. **Implementation Approach**:
   - Update `controlDefaults.ts` to include more properties
   - Ensure property panel can handle all property types
   - Add property validation and type checking
   - Implement property change handlers for visual updates

## Property Coverage Statistics

Based on comparison with VB6CompleteProperties.ts:

- **CommandButton**: ~60% coverage (missing Appearance, handles, advanced picture props)
- **TextBox**: ~70% coverage (missing Appearance, DDE, selection runtime props)
- **Label**: ~75% coverage (missing Appearance, DDE props)
- **CheckBox**: ~65% coverage (missing Appearance, graphical style props)
- **OptionButton**: ~65% coverage (missing Appearance, graphical style props)
- **ListBox**: ~40% coverage (missing many list management props)
- **ComboBox**: ~50% coverage (missing list and selection props)
- **Frame**: ~80% coverage (missing appearance props)
- **PictureBox**: ~25% coverage (missing extensive graphics props)
- **TreeView**: ~20% coverage (minimal implementation)
- **ListView**: ~25% coverage (minimal implementation)
- **Form**: ~20% coverage (missing most window and graphics props)

Overall, the current implementation covers basic functionality but lacks many VB6-specific properties for full compatibility.
