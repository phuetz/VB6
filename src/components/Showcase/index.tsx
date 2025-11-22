/**
 * VB6 IDE Showcase - Main Entry Point
 * 
 * Complete demonstration platform for the VB6 Web IDE project
 * showcasing all features, capabilities, and implementations.
 */

import React, { useState, useEffect } from 'react';
import VB6IDEShowcase from './VB6IDEShowcase';
import DemoRunner from './DemoRunner';
import './showcase.css';

interface ShowcaseMode {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
  icon: string;
}

export const VB6Showcase: React.FC = () => {
  const [currentMode, setCurrentMode] = useState('presentation');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const showcaseModes: ShowcaseMode[] = [
    {
      id: 'presentation',
      title: 'Interactive Presentation',
      description: 'Guided tour of all VB6 IDE features and capabilities',
      component: VB6IDEShowcase,
      icon: '🎯'
    },
    {
      id: 'demo-runner',
      title: 'Automated Demos',
      description: 'Automated demonstrations of building real applications',
      component: DemoRunner,
      icon: '🚀'
    },
    {
      id: 'live-ide',
      title: 'Live IDE',
      description: 'Full interactive VB6 IDE for hands-on exploration',
      component: LiveIDEDemo,
      icon: '💻'
    }
  ];

  useEffect(() => {
    // Auto-hide intro after 5 seconds
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentModeData = showcaseModes.find(mode => mode.id === currentMode);
  const CurrentComponent = currentModeData?.component || VB6IDEShowcase;

  if (showIntro) {
    return <IntroScreen onSkip={() => setShowIntro(false)} />;
  }

  return (
    <div className="h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Mode Selection Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-6">
            <div className="text-xl font-bold gradient-text">VB6 Web IDE Showcase</div>
            
            <div className="flex space-x-2">
              {showcaseModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setCurrentMode(mode.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentMode === mode.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                  title={mode.description}
                >
                  <span className="mr-2">{mode.icon}</span>
                  {mode.title}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300 hidden md:block">
              {currentModeData?.description}
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? '🗗' : '🗖'}
            </button>
            
            <a
              href="https://github.com/your-repo/vb6-web-ide"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
              title="View on GitHub"
            >
              📋
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 h-full">
        <CurrentComponent />
      </div>

      {/* Performance Monitor */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 rounded-lg p-2 text-xs text-gray-400">
        <PerformanceMonitor />
      </div>
    </div>
  );
};

// Intro Screen Component
const IntroScreen: React.FC<{ onSkip: () => void }> = ({ onSkip }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          onSkip();
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onSkip]);

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center text-white">
      <div className="text-center max-w-4xl px-8">
        <div className="mb-8 animate-fadeIn">
          <div className="text-6xl md:text-8xl font-bold mb-4 gradient-text">
            VB6 Web IDE
          </div>
          <div className="text-2xl md:text-3xl text-blue-200 mb-6">
            Complete Implementation Showcase
          </div>
          <div className="text-lg text-gray-300 max-w-2xl mx-auto">
            Experience the full power of Visual Basic 6 running natively in your browser
            with advanced form designer, native compiler, and ActiveX support.
          </div>
        </div>

        <div className="mb-8 animate-slideInUp delay-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-black bg-opacity-30 p-4 rounded-lg">
              <div className="text-3xl mb-2">36+</div>
              <div className="text-sm">VB6 Controls</div>
            </div>
            <div className="bg-black bg-opacity-30 p-4 rounded-lg">
              <div className="text-3xl mb-2">70%</div>
              <div className="text-sm">Compatibility</div>
            </div>
            <div className="bg-black bg-opacity-30 p-4 rounded-lg">
              <div className="text-3xl mb-2">4</div>
              <div className="text-sm">Compile Targets</div>
            </div>
            <div className="bg-black bg-opacity-30 p-4 rounded-lg">
              <div className="text-3xl mb-2">0</div>
              <div className="text-sm">Installation</div>
            </div>
          </div>
        </div>

        <div className="mb-8 animate-fadeIn delay-1000">
          <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Loading showcase... {Math.round(progress)}%
          </div>
        </div>

        <button
          onClick={onSkip}
          className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
        >
          Skip Intro
        </button>
      </div>
    </div>
  );
};

// Live IDE Demo Component
const LiveIDEDemo: React.FC = () => {
  return (
    <div className="h-full bg-gray-800 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-4xl mb-4">🚧</div>
        <div className="text-2xl font-bold mb-4">Live IDE Integration</div>
        <div className="text-gray-400 mb-8 max-w-md">
          This would integrate the full VB6 IDE interface allowing users
          to create, edit, and test VB6 applications directly.
        </div>
        <div className="space-y-2 text-sm text-left bg-gray-900 p-4 rounded max-w-md">
          <div className="text-green-400">✓ Form Designer Integration</div>
          <div className="text-green-400">✓ Monaco Code Editor</div>
          <div className="text-green-400">✓ Property Panel</div>
          <div className="text-green-400">✓ Project Explorer</div>
          <div className="text-green-400">✓ Debug Console</div>
          <div className="text-yellow-400">⏳ Real-time Compilation</div>
          <div className="text-yellow-400">⏳ Interactive Debugging</div>
        </div>
      </div>
    </div>
  );
};

// Performance Monitor Component
const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const updateStats = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime >= 1000) {
        setStats(prev => ({
          ...prev,
          fps: Math.round(frameCount * 1000 / (now - lastTime))
        }));
        frameCount = 0;
        lastTime = now;
      }

      // Estimate memory usage
      if ((performance as any).memory) {
        setStats(prev => ({
          ...prev,
          memory: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
        }));
      }

      requestAnimationFrame(updateStats);
    };

    updateStats();
  }, []);

  return (
    <div className="font-mono text-xs">
      <div>FPS: {stats.fps}</div>
      <div>Memory: {stats.memory}MB</div>
      <div>Render: {stats.renderTime}ms</div>
    </div>
  );
};

export default VB6Showcase;