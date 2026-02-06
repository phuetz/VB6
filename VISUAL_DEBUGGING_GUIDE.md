# Visual Debugging Guide for VB6 Web IDE

## Overview

The VB6 Web IDE now includes a comprehensive Visual Debugger that provides real-time insights into your application's behavior, performance, and state changes.

## Features

### 1. **Grid Lines Overlay**

- **Purpose**: Shows the snap-to-grid alignment guides
- **Color**: Blue (#2196F3)
- **Usage**: Helps align controls precisely on the form designer
- **Toggle**: Enabled by default

### 2. **Control Bounds**

- **Purpose**: Displays boundaries and information for all controls
- **Color**: Green (#4CAF50)
- **Information Shown**:
  - Control name and type (top-left)
  - Dimensions (bottom-right)
  - Selected state highlighting
- **Toggle**: Enabled by default

### 3. **Mouse Tracking**

- **Purpose**: Shows real-time mouse position and crosshairs
- **Color**: Orange (#FF9800)
- **Features**:
  - X/Y coordinates display
  - Vertical and horizontal guide lines
  - Useful for precise positioning

### 4. **Render Performance**

- **Purpose**: Monitors component rendering performance
- **Color**: Red (#F44336)
- **Metrics**:
  - Render count per component
  - Last render time
  - Average render time
  - Performance bar (green/orange/red based on speed)
- **Warning Levels**:
  - Green: < 8ms (good)
  - Orange: 8-16ms (warning)
  - Red: > 16ms (poor)

### 5. **Event Flow**

- **Purpose**: Captures and displays DOM events in real-time
- **Color**: Purple (#9C27B0)
- **Events Tracked**:
  - Click, double-click
  - Mouse down/up
  - Keyboard events
  - Focus/blur
- **Display**: Shows last 20 events with fade effect

### 6. **State Updates**

- **Purpose**: Tracks Zustand store state changes
- **Color**: Cyan (#00BCD4)
- **Information**:
  - Control count changes
  - Selection changes
  - Zoom level updates
  - Code modifications
- **Display**: Timestamped log of last 10 changes

## How to Use

### Activation

1. Click the **eye icon** (👁️) button in the top-right corner
2. The Visual Debugger panel will appear

### Control Panel

- **Toggle Features**: Check/uncheck overlays as needed
- **Minimize**: Click the eye-off icon to minimize
- **Position**: Fixed at top-right of screen

### Performance Optimization Tips

1. **Reduce Render Counts**:
   - If a component shows high render counts, consider:
     - Using React.memo()
     - Optimizing state updates
     - Checking for unnecessary re-renders

2. **Monitor Event Flow**:
   - Look for event bubbling issues
   - Identify unnecessary event listeners
   - Check for event handler memory leaks

3. **Track State Updates**:
   - Identify frequent state changes
   - Look for update patterns
   - Optimize state structure if needed

## Integration with Other Debug Tools

The Visual Debugger works seamlessly with:

### Diagnostic Dashboard

- Provides system-wide metrics (FPS, memory)
- Component health overview
- Error tracking

### Recovery Panel

- Save states when debugging
- Restore to previous states
- Export debug sessions

### Performance Monitor

- Detailed timing metrics
- Render loop detection
- Performance history

## Best Practices

1. **Development Phase**:
   - Keep Grid Lines and Control Bounds enabled
   - Use Mouse Tracking for precise positioning
   - Monitor Performance during heavy operations

2. **Debugging Phase**:
   - Enable Event Flow to track user interactions
   - Watch State Updates for unexpected changes
   - Use Performance overlay to find bottlenecks

3. **Optimization Phase**:
   - Focus on Performance metrics
   - Identify components with high render counts
   - Track state update patterns

## Keyboard Shortcuts

- **Toggle Visual Debugger**: `Ctrl+Shift+D` (when implemented)
- **Reset Performance Metrics**: Available in control panel
- **Export Debug Data**: Use Diagnostic Dashboard

## Advanced Usage

### Custom Performance Marks

The Visual Debugger automatically tracks components that use the performance monitor:

```typescript
perfMonitor.startMeasure('MyComponent-render');
// ... component logic
perfMonitor.endMeasure('MyComponent-render');
```

### Event Filtering

Future versions will support:

- Event type filtering
- Custom event patterns
- Event breakpoints

### State Diff Viewer

Planned features:

- Before/after state comparison
- State history timeline
- State replay functionality

## Troubleshooting

### High CPU Usage

- Disable unnecessary overlays
- Reduce event tracking scope
- Clear performance history

### Missing Overlays

- Check browser console for errors
- Ensure components are properly mounted
- Verify z-index conflicts

### Performance Impact

- The debugger itself is optimized for minimal impact
- Disable when not actively debugging
- Use selectively based on needs

## Color Reference

- 🔵 Blue (#2196F3) - Grid and layout
- 🟢 Green (#4CAF50) - Control information
- 🟠 Orange (#FF9800) - Mouse tracking
- 🔴 Red (#F44336) - Performance warnings
- 🟣 Purple (#9C27B0) - Event flow
- 🔷 Cyan (#00BCD4) - State updates

## Future Enhancements

1. **Network Inspector**: Track API calls and responses
2. **Memory Profiler**: Detailed memory usage analysis
3. **Component Tree**: Visual component hierarchy
4. **Time Travel**: Step through state changes
5. **Export/Import**: Save and share debug sessions
