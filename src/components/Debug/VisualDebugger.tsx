import React, { useState, useEffect, useRef } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { Eye, EyeOff, Activity, Layers, MousePointer, Grid, Zap, RefreshCw } from 'lucide-react';

interface DebugOverlay {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  icon: React.ReactNode;
}

interface RenderInfo {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

export const VisualDebugger: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [overlays, setOverlays] = useState<DebugOverlay[]>([
    { id: 'grid', name: 'Grid Lines', enabled: true, color: '#2196F3', icon: <Grid size={16} /> },
    { id: 'bounds', name: 'Control Bounds', enabled: true, color: '#4CAF50', icon: <Layers size={16} /> },
    { id: 'mouse', name: 'Mouse Tracking', enabled: false, color: '#FF9800', icon: <MousePointer size={16} /> },
    { id: 'performance', name: 'Render Performance', enabled: false, color: '#F44336', icon: <Activity size={16} /> },
    { id: 'events', name: 'Event Flow', enabled: false, color: '#9C27B0', icon: <Zap size={16} /> },
    { id: 'updates', name: 'State Updates', enabled: false, color: '#00BCD4', icon: <RefreshCw size={16} /> },
  ]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [renderInfo, setRenderInfo] = useState<Map<string, RenderInfo>>(new Map());
  const [stateUpdates, setStateUpdates] = useState<string[]>([]);
  const eventLogRef = useRef<HTMLDivElement>(null);

  const {
    controls,
    selectedControls,
    gridSize,
    snapToGrid,
    designerZoom,
  } = useVB6Store();

  // Mouse tracking
  useEffect(() => {
    if (!isEnabled || !overlays.find(o => o.id === 'mouse')?.enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isEnabled, overlays]);

  // Event tracking
  useEffect(() => {
    if (!isEnabled || !overlays.find(o => o.id === 'events')?.enabled) return;

    const captureEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      const info = `${e.type} on ${target.tagName}${target.id ? '#' + target.id : ''}${target.className ? '.' + target.className.split(' ')[0] : ''}`;
      setEventLog(prev => [...prev.slice(-19), info]);
    };

    const events = ['click', 'dblclick', 'mousedown', 'mouseup', 'keydown', 'keyup', 'focus', 'blur'];
    events.forEach(event => window.addEventListener(event, captureEvent, true));

    return () => {
      events.forEach(event => window.removeEventListener(event, captureEvent, true));
    };
  }, [isEnabled, overlays]);

  // State update tracking
  useEffect(() => {
    if (!isEnabled || !overlays.find(o => o.id === 'updates')?.enabled) return;

    const unsubscribe = useVB6Store.subscribe((state, prevState) => {
      const changes: string[] = [];
      
      // Check what changed
      if (state.controls !== prevState.controls) {
        changes.push(`Controls: ${prevState.controls.length} → ${state.controls.length}`);
      }
      if (state.selectedControls !== prevState.selectedControls) {
        changes.push(`Selected: ${prevState.selectedControls.length} → ${state.selectedControls.length}`);
      }
      if (state.designerZoom !== prevState.designerZoom) {
        changes.push(`Zoom: ${prevState.designerZoom}% → ${state.designerZoom}%`);
      }
      if (state.currentCode !== prevState.currentCode) {
        changes.push(`Code updated (${state.currentCode.length} chars)`);
      }

      if (changes.length > 0) {
        const timestamp = new Date().toLocaleTimeString();
        setStateUpdates(prev => [...prev.slice(-9), `[${timestamp}] ${changes.join(', ')}`]);
      }
    });

    return unsubscribe;
  }, [isEnabled, overlays]);

  // Performance tracking
  useEffect(() => {
    if (!isEnabled || !overlays.find(o => o.id === 'performance')?.enabled) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.includes('render')) {
          const componentName = entry.name.split('-')[0];
          setRenderInfo(prev => {
            const existing = prev.get(componentName) || {
              componentName,
              renderCount: 0,
              lastRenderTime: 0,
              averageRenderTime: 0,
            };
            
            const newCount = existing.renderCount + 1;
            const newAverage = (existing.averageRenderTime * existing.renderCount + entry.duration) / newCount;
            
            return new Map(prev).set(componentName, {
              componentName,
              renderCount: newCount,
              lastRenderTime: entry.duration,
              averageRenderTime: newAverage,
            });
          });
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, [isEnabled, overlays]);

  const toggleOverlay = (id: string) => {
    setOverlays(prev => prev.map(o => 
      o.id === id ? { ...o, enabled: !o.enabled } : o
    ));
  };

  if (!isEnabled) {
    return (
      <button
        onClick={() => setIsEnabled(true)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(63, 81, 181, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
        }}
        title="Enable Visual Debugger"
      >
        <Eye size={24} />
      </button>
    );
  }

  return (
    <>
      {/* Control Panel */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderRadius: '10px',
          padding: '15px',
          minWidth: '250px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>🔍 Visual Debugger</h3>
          <button
            onClick={() => setIsEnabled(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <EyeOff size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {overlays.map(overlay => (
            <label
              key={overlay.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '4px',
                background: overlay.enabled ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={overlay.enabled}
                onChange={() => toggleOverlay(overlay.id)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: overlay.color }}>{overlay.icon}</span>
              <span>{overlay.name}</span>
            </label>
          ))}
        </div>

        {/* Mouse Position */}
        {overlays.find(o => o.id === 'mouse')?.enabled && (
          <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}>
            <div style={{ color: '#FF9800', marginBottom: '5px' }}>🖱️ Mouse Position</div>
            <div>X: {mousePos.x}, Y: {mousePos.y}</div>
          </div>
        )}

        {/* State Updates */}
        {overlays.find(o => o.id === 'updates')?.enabled && stateUpdates.length > 0 && (
          <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}>
            <div style={{ color: '#00BCD4', marginBottom: '5px' }}>🔄 State Updates</div>
            <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '11px' }}>
              {stateUpdates.map((update, i) => (
                <div key={i} style={{ opacity: 1 - (stateUpdates.length - 1 - i) * 0.1 }}>
                  {update}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid Overlay */}
      {overlays.find(o => o.id === 'grid')?.enabled && snapToGrid && (
        <svg
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9998,
            opacity: 0.2,
          }}
        >
          <defs>
            <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2={gridSize} stroke="#2196F3" strokeWidth="0.5" />
              <line x1="0" y1="0" x2={gridSize} y2="0" stroke="#2196F3" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      )}

      {/* Control Bounds */}
      {overlays.find(o => o.id === 'bounds')?.enabled && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9997 }}>
          {controls.map(control => (
            <div
              key={control.id}
              style={{
                position: 'absolute',
                left: control.Left,
                top: control.Top,
                width: control.Width,
                height: control.Height,
                border: `2px ${selectedControls.includes(control.id) ? 'solid' : 'dashed'} #4CAF50`,
                background: selectedControls.includes(control.id) ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '0',
                  background: '#4CAF50',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                }}
              >
                {control.Name} ({control.type})
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '-20px',
                  right: '0',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontSize: '10px',
                }}
              >
                {control.Width}×{control.Height}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Log */}
      {overlays.find(o => o.id === 'events')?.enabled && (
        <div
          ref={eventLogRef}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '280px',
            width: '300px',
            maxHeight: '200px',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderRadius: '8px',
            padding: '10px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '11px',
            zIndex: 9999,
          }}
        >
          <div style={{ color: '#9C27B0', marginBottom: '5px', fontWeight: 'bold' }}>⚡ Event Log</div>
          {eventLog.length === 0 ? (
            <div style={{ opacity: 0.5 }}>No events captured yet...</div>
          ) : (
            eventLog.map((event, i) => (
              <div key={i} style={{ opacity: 1 - (eventLog.length - 1 - i) * 0.05 }}>
                {event}
              </div>
            ))
          )}
        </div>
      )}

      {/* Performance Overlay */}
      {overlays.find(o => o.id === 'performance')?.enabled && renderInfo.size > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderRadius: '8px',
            padding: '15px',
            minWidth: '250px',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 9999,
          }}
        >
          <div style={{ color: '#F44336', marginBottom: '10px', fontWeight: 'bold' }}>
            📊 Render Performance
          </div>
          {Array.from(renderInfo.values()).map(info => (
            <div key={info.componentName} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>{info.componentName}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                Renders: {info.renderCount} | 
                Last: {info.lastRenderTime.toFixed(2)}ms | 
                Avg: {info.averageRenderTime.toFixed(2)}ms
              </div>
              <div
                style={{
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginTop: '4px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: info.averageRenderTime > 16 ? '#F44336' : 
                               info.averageRenderTime > 8 ? '#FF9800' : '#4CAF50',
                    width: `${Math.min(100, (info.averageRenderTime / 50) * 100)}%`,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mouse Crosshair */}
      {overlays.find(o => o.id === 'mouse')?.enabled && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: mousePos.x,
              width: '1px',
              height: '100%',
              background: '#FF9800',
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: 9996,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: mousePos.y,
              left: 0,
              width: '100%',
              height: '1px',
              background: '#FF9800',
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: 9996,
            }}
          />
        </>
      )}
    </>
  );
};

export default VisualDebugger;