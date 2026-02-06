import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Version ultra-simplifiée pour test
function SimpleApp() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>🎉 VB6 Web IDE - Test Simple</h1>
      <p>Si vous voyez ce message, l'application fonctionne !</p>
      <div
        style={{
          background: '#f0f0f0',
          border: '1px solid #ccc',
          padding: '20px',
          margin: '20px 0',
        }}
      >
        <h2>Statut :</h2>
        <ul>
          <li>✅ React fonctionne</li>
          <li>✅ TypeScript fonctionne</li>
          <li>✅ Serveur Vite fonctionne</li>
        </ul>
      </div>
      <button
        onClick={() => alert('Button works!')}
        style={{
          background: '#007acc',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Test Button
      </button>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <SimpleApp />
  </StrictMode>
);
