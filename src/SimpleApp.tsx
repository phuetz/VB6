import React, { useState, useEffect } from 'react';
import { VB6Provider } from './context/VB6Context';
import { useVB6Store } from './stores/vb6Store';
import SplashScreen from './components/SplashScreen/SplashScreen';
import './index.css';

function SimpleApp() {
  console.log('🔄 SimpleApp component initializing...');
  const [showSplash, setShowSplash] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  console.log('🔄 Initializing VB6 store...');
  const { controls } = useVB6Store();
  console.log('✅ VB6 store initialized, controls:', controls.length);

  // Show splash screen only on first load
  useEffect(() => {
    console.log('🔄 Checking splash screen...');
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      console.log('✅ Splash screen already seen, skipping');
      setShowSplash(false);
    } else {
      console.log('🔄 First time, showing splash screen');
    }
  }, []);

  const handleSplashComplete = () => {
    console.log('✅ Splash screen completed');
    setShowSplash(false);
    localStorage.setItem('hasSeenSplash', 'true');
  };

  if (showSplash) {
    console.log('🔄 Showing splash screen...');
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  console.log('🔄 Rendering main app...');
  return (
    <VB6Provider>
      <div
        className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
          darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🚀 VB6 Web IDE
            </h1>
            <p className="text-gray-600 mb-4">
              Application simplifiée pour tests
            </p>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              ✅ L'application fonctionne correctement !
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Contrôles chargés: {controls.length}
            </div>
          </div>
        </div>
      </div>
    </VB6Provider>
  );
}

export default SimpleApp;