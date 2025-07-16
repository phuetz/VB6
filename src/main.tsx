import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ModernApp from './ModernApp.tsx';
import ThemeProvider from './context/ThemeContext.tsx';
import { ToastProvider } from './components/UI/ToastManager.tsx';
import './index.css';
import { reportWebVitals } from './utils/reportWebVitals';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ModernApp />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);

// Start tracking Web Vitals performance metrics
reportWebVitals();
