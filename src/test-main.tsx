import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TestApp from './TestApp.tsx';
import './index.css';

console.log('🚀 Starting minimal React test...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

console.log('✅ Root element found, creating React root...');

try {
  const root = createRoot(rootElement);
  console.log('✅ React root created, rendering test app...');
  
  root.render(
    <StrictMode>
      <TestApp />
    </StrictMode>
  );
  
  console.log('✅ Test app rendered successfully!');
} catch (error) {
  console.error('❌ Error during app initialization:', error);
  throw error;
}