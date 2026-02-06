import React, { useState, useEffect, useRef } from 'react';
import { perfMonitor } from '../../utils/performanceMonitor';
import { useVB6Store } from '../../stores/vb6Store';

interface SystemMetrics {
  memory?: number;
  renderCount: number;
  errorCount: number;
  componentCount: number;
  lastError?: string;
  fps: number;
}

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  renderTime?: number;
  errorCount: number;
  lastError?: string;
}

export const DiagnosticDashboard: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    renderCount: 0,
    errorCount: 0,
    componentCount: 0,
    fps: 60,
  });
  const [componentHealth, setComponentHealth] = useState<ComponentHealth[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Monitor FPS
  useEffect(() => {
    const measureFPS = (timestamp: number) => {
      frameCountRef.current++;

      if (timestamp - lastTimeRef.current >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCountRef.current * 1000) / (timestamp - lastTimeRef.current)),
        }));
        frameCountRef.current = 0;
        lastTimeRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS);
    };

    animationFrameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Monitor memory usage
  useEffect(() => {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memory: Math.round(memInfo.usedJSHeapSize / 1048576), // Convert to MB
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Monitor component health
  useEffect(() => {
    const checkHealth = () => {
      const components: ComponentHealth[] = [
        {
          name: 'VB6Store',
          status: 'healthy',
          renderTime: perfMonitor.getAverageTime('VB6Store-render'),
          errorCount: 0,
        },
        {
          name: 'DragDropProvider',
          status: perfMonitor.checkRenderLoop('DragDropProvider') ? 'error' : 'healthy',
          renderTime: perfMonitor.getAverageTime('DragDropProvider-render'),
          errorCount: 0,
        },
        {
          name: 'FormDesigner',
          status: 'healthy',
          renderTime: perfMonitor.getAverageTime('FormDesigner-render'),
          errorCount: 0,
        },
      ];

      // Update status based on render time
      components.forEach(comp => {
        if (comp.renderTime && comp.renderTime > 100) {
          comp.status = 'warning';
        }
        if (comp.renderTime && comp.renderTime > 500) {
          comp.status = 'error';
        }
      });

      setComponentHealth(components);
    };

    const interval = setInterval(checkHealth, 2000);
    checkHealth();

    return () => clearInterval(interval);
  }, []);

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  // Listen for errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
      addLog(`ERROR: ${event.message}`);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
    }
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 50) return '#4CAF50';
    if (fps >= 30) return '#FF9800';
    return '#F44336';
  };

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: '14px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        }}
        onClick={() => setIsMinimized(false)}
      >
        📊 Diagnostics | FPS: {metrics.fps} | Errors: {metrics.errorCount}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxHeight: '600px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        borderRadius: '10px',
        overflow: 'hidden',
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'rgba(33, 150, 243, 0.8)',
          padding: '10px 15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>📊 Diagnostic Dashboard</span>
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          _
        </button>
      </div>

      {/* System Metrics */}
      <div style={{ padding: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>System Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px', borderRadius: '5px' }}
          >
            <div style={{ opacity: 0.7 }}>FPS</div>
            <div style={{ fontSize: '18px', color: getFPSColor(metrics.fps) }}>{metrics.fps}</div>
          </div>
          {metrics.memory && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '8px',
                borderRadius: '5px',
              }}
            >
              <div style={{ opacity: 0.7 }}>Memory</div>
              <div style={{ fontSize: '18px' }}>{metrics.memory} MB</div>
            </div>
          )}
          <div
            style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px', borderRadius: '5px' }}
          >
            <div style={{ opacity: 0.7 }}>Errors</div>
            <div
              style={{ fontSize: '18px', color: metrics.errorCount > 0 ? '#F44336' : '#4CAF50' }}
            >
              {metrics.errorCount}
            </div>
          </div>
          <div
            style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px', borderRadius: '5px' }}
          >
            <div style={{ opacity: 0.7 }}>Components</div>
            <div style={{ fontSize: '18px' }}>{componentHealth.length}</div>
          </div>
        </div>
      </div>

      {/* Component Health */}
      <div style={{ padding: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Component Health</h3>
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {componentHealth.map((comp, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px',
                background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              }}
            >
              <span>{comp.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {comp.renderTime && (
                  <span style={{ opacity: 0.7 }}>{comp.renderTime.toFixed(1)}ms</span>
                )}
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: getStatusColor(comp.status),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div style={{ padding: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Recent Logs</h3>
        <div
          style={{
            maxHeight: '150px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '5px',
            borderRadius: '5px',
            fontSize: '11px',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ opacity: 0.5 }}>No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px', opacity: 1 - index * 0.02 }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => perfMonitor.reset()}
            style={{
              flex: 1,
              padding: '8px',
              background: 'rgba(76, 175, 80, 0.8)',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Reset Metrics
          </button>
          <button
            onClick={() => perfMonitor.logSummary()}
            style={{
              flex: 1,
              padding: '8px',
              background: 'rgba(33, 150, 243, 0.8)',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Log Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticDashboard;
