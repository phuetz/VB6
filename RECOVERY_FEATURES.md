# VB6 Web IDE Recovery Features

## Overview

The VB6 Web IDE now includes comprehensive diagnostic and recovery features to prevent data loss and help debug issues.

## Features Implemented

### 1. **Diagnostic Dashboard** (`DiagnosticDashboard.tsx`)

- **Real-time Performance Monitoring**
  - FPS counter with color-coded indicators
  - Memory usage tracking (when available)
  - Error counting and logging
  - Component health monitoring with render times

- **Visual Indicators**
  - Minimizable floating panel (bottom-right corner)
  - Color-coded component health status
  - Recent logs display with timestamps
  - System metrics grid view

- **Actions**
  - Reset metrics button
  - Log summary to console
  - Auto-refresh every 2 seconds

### 2. **Recovery Panel** (`RecoveryPanel.tsx`)

- **Automatic Recovery Points**
  - Auto-save every minute when enabled
  - Captures state on errors
  - Maximum 10 recovery points (FIFO)

- **Manual Operations**
  - Create manual save points
  - Restore any recovery point
  - Export recovery points as JSON
  - Import recovery points

- **Visual Features**
  - Floating button (bottom-left corner)
  - Expandable panel with recovery point list
  - Time-based sorting (newest first)
  - Relative time display ("5m ago")

### 3. **Auto Recovery Service** (`AutoRecoveryService.ts`)

- **State Preservation**
  - Controls and their properties
  - Selected controls
  - Current code
  - Execution mode
  - Grid settings
  - Zoom level

- **Error Detection**
  - Listens for window errors
  - Captures unhandled promise rejections
  - Creates recovery points on crashes

- **Storage Management**
  - LocalStorage persistence
  - JSON serialization
  - Automatic cleanup of old points

## Usage

### Normal Operation

1. The app automatically creates recovery points every minute
2. Recovery points are also created when errors occur
3. Use the recovery panel (green button, bottom-left) to view/manage points

### After a Crash

1. If the app crashes, it will detect this on next launch
2. You'll see the option to start in Safe Mode
3. Use the recovery panel to restore your last working state

### Safe Mode

- Access by appending `?safe=true` to the URL
- Minimal interface for troubleshooting
- Can still access recovery points

### Testing

1. Open `test-recovery.html` in a browser
2. Use the buttons to:
   - Simulate crashes
   - Create test recovery points
   - Check recovery status
   - Open the app in different modes

## Integration Points

The recovery system integrates with:

- **Zustand Store**: For state capture/restore
- **Error Boundary**: For React error handling
- **Performance Monitor**: For diagnostics
- **DragDropProvider**: For operation tracking

## Best Practices

1. **Keep auto-save enabled** for continuous protection
2. **Create manual saves** before risky operations
3. **Export important states** for backup
4. **Monitor the diagnostic dashboard** for performance issues
5. **Use Safe Mode** when troubleshooting crashes

## Technical Details

- Recovery points are stored in `localStorage` under `vb6-recovery-points`
- Crash detection uses `vb6-crash-detected` flag
- Maximum recovery point size: ~5MB (localStorage limit)
- Minimum time between auto-saves: 5 seconds
- Performance measurement uses `performance.now()`

## Future Enhancements

- Cloud backup of recovery points
- Diff view between recovery points
- Automatic issue reporting
- Performance baseline comparison
- Network sync for collaboration
