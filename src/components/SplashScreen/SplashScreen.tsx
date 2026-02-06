import React, { useEffect, useState } from 'react';
import { Code, Cpu, Database, Globe, Layers, Zap } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [visible, setVisible] = useState(true);

  const steps = [
    { name: 'Initializing Core Engine', icon: <Cpu className="w-5 h-5" />, duration: 400 },
    { name: 'Loading Language Runtime', icon: <Code className="w-5 h-5" />, duration: 600 },
    { name: 'Setting up Form Designer', icon: <Layers className="w-5 h-5" />, duration: 500 },
    {
      name: 'Preparing Database Connections',
      icon: <Database className="w-5 h-5" />,
      duration: 400,
    },
    { name: 'Configuring Network Services', icon: <Globe className="w-5 h-5" />, duration: 300 },
    { name: 'Finalizing Environment', icon: <Zap className="w-5 h-5" />, duration: 300 },
  ];

  useEffect(() => {
    let currentProgress = 0;
    let stepIndex = 0;

    const processSteps = () => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        setCurrentStep(step.name);

        const increment = 100 / steps.length;
        const duration = step.duration;
        const intervalTime = duration / increment;

        const interval = setInterval(() => {
          currentProgress += 1;
          if (currentProgress <= (stepIndex + 1) * increment) {
            setProgress(currentProgress);
          } else {
            clearInterval(interval);
            stepIndex++;
            processSteps();
          }
        }, intervalTime);
      } else {
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          setTimeout(() => {
            onComplete();
          }, 500);
        }, 500);
      }
    };

    processSteps();
  }, [onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-fadeIn">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 40% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center animate-scaleIn">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <Code size={64} className="text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-xl opacity-50 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2 animate-slideIn">
          <h1 className="text-5xl font-bold text-white tracking-tight">VB6 Studio</h1>
          <p className="text-xl text-gray-300">Professional Visual Basic 6 IDE</p>
        </div>

        {/* Loading Progress */}
        <div className="w-96 space-y-4">
          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white opacity-30 animate-shimmer" />
            </div>
          </div>

          {/* Current Step */}
          <div className="flex items-center justify-center space-x-2 text-gray-400 animate-fadeIn">
            {steps.find(s => s.name === currentStep)?.icon}
            <span className="text-sm">{currentStep}</span>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-8 animate-fadeIn">
          {[
            { icon: <Layers />, text: 'Form Designer' },
            { icon: <Code />, text: 'Code Editor' },
            { icon: <Database />, text: 'Data Tools' },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-2 text-gray-400 animate-slideIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {React.cloneElement(feature.icon, { size: 24 })}
              <span className="text-xs">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Version */}
        <div className="text-xs text-gray-500 pt-8 animate-fadeIn">
          Version 2.0.0 • © 2024 VB6 Studio
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;
