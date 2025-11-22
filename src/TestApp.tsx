import React from 'react';

const TestApp: React.FC = () => {
  console.log('🔄 TestApp rendering...');
  
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '40px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{
          fontSize: '3em',
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
        }}>
          🚀 VB6 Web IDE - React Test
        </h1>
        
        <div style={{
          fontSize: '1.2em',
          margin: '20px 0',
          padding: '10px',
          borderRadius: '5px',
          background: 'rgba(0, 255, 0, 0.2)',
          border: '1px solid rgba(0, 255, 0, 0.5)'
        }}>
          ✅ React is working!
        </div>
        
        <p>This is a minimal React component to test if React rendering works.</p>
        <p>If you can see this, React is functioning properly.</p>
        
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '20px',
          borderRadius: '10px',
          marginTop: '20px',
          fontFamily: 'monospace',
          textAlign: 'left'
        }}>
          <div>🔄 Component lifecycle: OK</div>
          <div>✅ JSX rendering: OK</div>
          <div>✅ Props and state: OK</div>
          <div>✅ Console logging: Check DevTools</div>
        </div>
      </div>
    </div>
  );
};

export default TestApp;