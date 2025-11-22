import React, { useState, useEffect } from 'react';
import { VB6Provider } from './context/VB6Context';
import { DragDropProvider } from './components/DragDrop/DragDropProvider';
import { useVB6Store } from './stores/vb6Store';

interface ComponentStatus {
  name: string;
  loaded: boolean;
  error?: string;
}

const SafeModeApp: React.FC = () => {
  console.log('🛡️ SafeModeApp starting in safe mode...');
  const [components, setComponents] = useState<ComponentStatus[]>([
    { name: 'React Core', loaded: true },
    { name: 'VB6 Store', loaded: false },
    { name: 'VB6 Context', loaded: false },
    { name: 'DragDrop Provider', loaded: false },
    { name: 'Main Interface', loaded: false },
  ]);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Test VB6 Store
  useEffect(() => {
    if (currentStep === 0) {
      console.log('🛡️ Testing VB6 Store...');
      try {
        const state = useVB6Store.getState();
        console.log('✅ VB6 Store loaded:', state);
        updateComponentStatus('VB6 Store', true);
        setCurrentStep(1);
      } catch (e) {
        console.error('❌ VB6 Store error:', e);
        updateComponentStatus('VB6 Store', false, e.toString());
        setError('VB6 Store failed to load');
      }
    }
  }, [currentStep]);

  const updateComponentStatus = (name: string, loaded: boolean, error?: string) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.name === name ? { ...comp, loaded, error } : comp
      )
    );
  };

  const handleLoadFull = () => {
    console.log('🛡️ Attempting to load full application...');
    window.location.href = '/?fullMode=true';
  };

  const handleClearStorage = () => {
    console.log('🛡️ Clearing all storage...');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '40px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '40px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ fontSize: '2.5em', marginBottom: '20px' }}>
          🛡️ VB6 IDE - Safe Mode
        </h1>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h2>Component Status</h2>
          <div style={{ marginTop: '10px' }}>
            {components.map((comp, index) => (
              <div key={comp.name} style={{ 
                padding: '10px',
                marginTop: '5px',
                background: comp.loaded ? 'rgba(76, 175, 80, 0.3)' : 
                           comp.error ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{comp.loaded ? '✅' : comp.error ? '❌' : '⏳'}</span>
                  <span>{comp.name}</span>
                  {comp.error && (
                    <span style={{ fontSize: '0.8em', opacity: 0.8 }}>
                      - {comp.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 67, 54, 0.3)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h3>⚠️ Error Detected</h3>
            <p>{error}</p>
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <h3>Actions</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={handleLoadFull}
              style={{
                padding: '10px 20px',
                background: 'rgba(76, 175, 80, 0.8)',
                border: 'none',
                borderRadius: '5px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Try Full Application
            </button>
            
            <button
              onClick={handleClearStorage}
              style={{
                padding: '10px 20px',
                background: 'rgba(255, 152, 0, 0.8)',
                border: 'none',
                borderRadius: '5px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Clear Storage & Reload
            </button>
          </div>
        </div>

        <div style={{ marginTop: '30px', opacity: 0.8 }}>
          <h3>Diagnostics</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>React Version: {React.version}</li>
            <li>Browser: {navigator.userAgent.slice(0, 50)}...</li>
            <li>Local Storage Available: {typeof Storage !== 'undefined' ? 'Yes' : 'No'}</li>
            <li>Console Errors: Check browser console (F12)</li>
          </ul>
        </div>

        {currentStep === 1 && (
          <div style={{ marginTop: '30px' }}>
            <h3>Testing VB6 Context...</h3>
            <VB6Provider>
              <div style={{ padding: '10px', background: 'rgba(76, 175, 80, 0.3)', borderRadius: '5px' }}>
                ✅ VB6 Context loaded successfully!
              </div>
            </VB6Provider>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafeModeApp;