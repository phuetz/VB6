import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TestApp from './TestApp.tsx';
import './index.css';
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}
try {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <TestApp />
    </StrictMode>
  );
} catch (error) {
  console.error('❌ Error during app initialization:', error);
  throw error;
}
