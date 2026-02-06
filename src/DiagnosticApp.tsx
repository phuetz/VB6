import React, { useEffect, useState } from 'react';

const DiagnosticApp: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    // Test localStorage
    try {
      localStorage.setItem('diagnostic-test', 'ok');
    } catch (e) {
      console.error('❌ localStorage error:', e);
      setError('localStorage error: ' + e);
    }

    return () => {};
  }, []);

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        background: '#f0f0f0',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🔍 VB6 IDE Diagnostic</h1>

      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h2>Component Status</h2>

        <div style={{ marginTop: '10px' }}>
          <strong>Mounted:</strong> {mounted ? '✅ Yes' : '❌ No'}
        </div>

        <div style={{ marginTop: '10px' }}>
          <strong>Errors:</strong> {error || '✅ None'}
        </div>

        <div style={{ marginTop: '10px' }}>
          <strong>React Version:</strong> {React.version}
        </div>

        <div style={{ marginTop: '10px' }}>
          <strong>Window Object:</strong>{' '}
          {typeof window !== 'undefined' ? '✅ Available' : '❌ Not available'}
        </div>

        <div style={{ marginTop: '10px' }}>
          <strong>Document Ready:</strong> {document.readyState}
        </div>

        <h3 style={{ marginTop: '20px' }}>Console Logs</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>Check browser console for detailed logs</p>

        <h3 style={{ marginTop: '20px' }}>Next Steps</h3>
        <ol style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li>If this page loads, React is working</li>
          <li>Check console for error messages</li>
          <li>Try loading the main app components one by one</li>
          <li>Identify which component causes the issue</li>
        </ol>
      </div>
    </div>
  );
};

export default DiagnosticApp;
