import React, { useState, useEffect } from 'react';
import { autoRecoveryService } from '../../services/AutoRecoveryService';
import { Calendar, Clock, Download, Trash2, RotateCcw, Save } from 'lucide-react';

interface RecoveryPoint {
  timestamp: number;
  state: any;
  description: string;
}

export const RecoveryPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [recoveryPoints, setRecoveryPoints] = useState<RecoveryPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  useEffect(() => {
    // Load recovery points
    const loadPoints = () => {
      const points = autoRecoveryService.getRecoveryPoints();
      setRecoveryPoints(points);
    };

    loadPoints();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadPoints, 5000);

    // Start auto-save if enabled
    if (autoSaveEnabled) {
      autoRecoveryService.startAutoSave(60000); // Every minute
    }

    return () => {
      clearInterval(interval);
      autoRecoveryService.stopAutoSave();
    };
  }, [autoSaveEnabled]);

  const handleRestore = (timestamp: number) => {
    const confirmed = window.confirm('Are you sure you want to restore this recovery point? Current work will be lost.');
    
    if (confirmed) {
      const success = autoRecoveryService.restoreRecoveryPoint(timestamp);
      if (success) {
        alert('Recovery point restored successfully!');
        window.location.reload();
      } else {
        alert('Failed to restore recovery point');
      }
    }
  };

  const handleExport = (timestamp: number) => {
    const data = autoRecoveryService.exportRecoveryPoint(timestamp);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vb6-recovery-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCreateManualSave = () => {
    autoRecoveryService.createRecoveryPoint('Manual save');
    // Refresh the list
    setRecoveryPoints(autoRecoveryService.getRecoveryPoints());
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeDiff = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return `${minutes}m ago`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(76, 175, 80, 0.9)',
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
          zIndex: 1000,
        }}
        title="Recovery Points"
      >
        <RotateCcw size={24} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        width: '350px',
        maxHeight: '500px',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RotateCcw size={20} />
          Recovery Points
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '0',
            width: '30px',
            height: '30px',
          }}
        >
          ×
        </button>
      </div>

      {/* Controls */}
      <div style={{ padding: '15px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={handleCreateManualSave}
            style={{
              flex: 1,
              padding: '8px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <Save size={16} />
            Manual Save
          </button>
          <button
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            style={{
              flex: 1,
              padding: '8px',
              background: autoSaveEnabled ? '#2196F3' : '#9E9E9E',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Auto-save: {autoSaveEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {recoveryPoints.length} recovery points available
        </div>
      </div>

      {/* Recovery Points List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {recoveryPoints.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            No recovery points yet
          </div>
        ) : (
          recoveryPoints.slice().reverse().map((point, index) => (
            <div
              key={point.timestamp}
              style={{
                background: selectedPoint === point.timestamp ? '#f5f5f5' : 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setSelectedPoint(point.timestamp)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f8f8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 
                  selectedPoint === point.timestamp ? '#f5f5f5' : 'white';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {point.description}
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {getTimeDiff(point.timestamp)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#888' }}>
                <Calendar size={14} />
                {formatDate(point.timestamp)}
              </div>
              {selectedPoint === point.timestamp && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(point.timestamp);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw size={14} />
                    Restore
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(point.timestamp);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Download size={14} />
                    Export
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px', borderTop: '1px solid #e0e0e0', fontSize: '11px', color: '#666' }}>
        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
        Auto-save every minute when enabled
      </div>
    </div>
  );
};

export default RecoveryPanel;