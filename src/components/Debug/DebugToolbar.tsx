import React, { useState, useEffect, useCallback } from 'react';
import { VB6DebugEngine, DebugState, VB6DebugSession } from '../../services/VB6DebugEngine';

interface DebugToolbarProps {
  debugEngine: VB6DebugEngine;
  currentFile?: string;
  onBreakpointToggle?: (filename: string, line: number) => void;
}

export const DebugToolbar: React.FC<DebugToolbarProps> = ({ 
  debugEngine, 
  currentFile = 'Module1.bas',
  onBreakpointToggle 
}) => {
  const [debugSession, setDebugSession] = useState<VB6DebugSession | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugState, setDebugState] = useState<DebugState>(DebugState.NotStarted);
  const [currentLine, setCurrentLine] = useState(0);
  const [executionTime, setExecutionTime] = useState<string>('00:00');

  useEffect(() => {
    const updateSession = () => {
      const session = debugEngine.getActiveSession();
      setDebugSession(session);
      setIsDebugging(session?.state === DebugState.Running || session?.state === DebugState.Paused);
      setDebugState(session?.state || DebugState.NotStarted);
    };

    const handleDebugStarted = (session: VB6DebugSession) => {
      setDebugSession(session);
      setIsDebugging(true);
      setDebugState(DebugState.Running);
    };

    const handleDebugPaused = (session: VB6DebugSession) => {
      setDebugSession(session);
      setDebugState(DebugState.Paused);
    };

    const handleDebugContinued = (session: VB6DebugSession) => {
      setDebugSession(session);
      setDebugState(DebugState.Running);
    };

    const handleDebugStopped = (session: VB6DebugSession) => {
      setDebugSession(session);
      setIsDebugging(false);
      setDebugState(DebugState.Stopped);
      setCurrentLine(0);
    };

    const handleStepAction = (line: number) => {
      setCurrentLine(line);
    };

    const handleBreakpointHit = () => {
      setDebugState(DebugState.Paused);
    };

    // Initial state
    updateSession();

    // Event listeners
    debugEngine.on('debugStarted', handleDebugStarted);
    debugEngine.on('debugPaused', handleDebugPaused);
    debugEngine.on('debugContinued', handleDebugContinued);
    debugEngine.on('debugStopped', handleDebugStopped);
    debugEngine.on('stepOver', handleStepAction);
    debugEngine.on('stepInto', handleStepAction);
    debugEngine.on('stepOut', handleStepAction);
    debugEngine.on('breakpointHit', handleBreakpointHit);

    return () => {
      debugEngine.off('debugStarted', handleDebugStarted);
      debugEngine.off('debugPaused', handleDebugPaused);
      debugEngine.off('debugContinued', handleDebugContinued);
      debugEngine.off('debugStopped', handleDebugStopped);
      debugEngine.off('stepOver', handleStepAction);
      debugEngine.off('stepInto', handleStepAction);
      debugEngine.off('stepOut', handleStepAction);
      debugEngine.off('breakpointHit', handleBreakpointHit);
    };
  }, [debugEngine]);

  // Update execution time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (debugSession && debugSession.state === DebugState.Running) {
      interval = setInterval(() => {
        const elapsed = Date.now() - debugSession.startTime.getTime();
        const seconds = Math.floor(elapsed / 1000) % 60;
        const minutes = Math.floor(elapsed / 60000);
        setExecutionTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [debugSession]);

  const handleStart = useCallback(() => {
    try {
      if (!debugSession) {
        debugEngine.createSession();
      }
      
      // Initialize mock data for demonstration
      debugEngine.initializeMockData();
      
      debugEngine.startDebug(currentFile);
    } catch (error) {
      console.error('Error starting debug:', error);
    }
  }, [debugEngine, debugSession, currentFile]);

  const handleStop = useCallback(() => {
    try {
      debugEngine.stopDebug();
    } catch (error) {
      console.error('Error stopping debug:', error);
    }
  }, [debugEngine]);

  const handlePause = useCallback(() => {
    try {
      debugEngine.pauseDebug();
    } catch (error) {
      console.error('Error pausing debug:', error);
    }
  }, [debugEngine]);

  const handleContinue = useCallback(() => {
    try {
      debugEngine.continueDebug();
    } catch (error) {
      console.error('Error continuing debug:', error);
    }
  }, [debugEngine]);

  const handleStepOver = useCallback(() => {
    try {
      debugEngine.stepOver();
    } catch (error) {
      console.error('Error stepping over:', error);
    }
  }, [debugEngine]);

  const handleStepInto = useCallback(() => {
    try {
      debugEngine.stepInto();
    } catch (error) {
      console.error('Error stepping into:', error);
    }
  }, [debugEngine]);

  const handleStepOut = useCallback(() => {
    try {
      debugEngine.stepOut();
    } catch (error) {
      console.error('Error stepping out:', error);
    }
  }, [debugEngine]);

  const handleToggleBreakpoint = useCallback(() => {
    if (onBreakpointToggle) {
      // Use current line from editor or default to line 1
      onBreakpointToggle(currentFile, currentLine || 1);
    } else {
      // Fallback: add breakpoint directly
      debugEngine.addBreakpoint(currentFile, currentLine || 1);
    }
  }, [debugEngine, currentFile, currentLine, onBreakpointToggle]);

  const handleRestart = useCallback(() => {
    try {
      if (debugSession) {
        debugEngine.stopDebug();
        setTimeout(() => {
          debugEngine.startDebug(currentFile);
        }, 100);
      }
    } catch (error) {
      console.error('Error restarting debug:', error);
    }
  }, [debugEngine, debugSession, currentFile]);

  const getStateIcon = (): string => {
    switch (debugState) {
      case DebugState.Running:
        return '▶️';
      case DebugState.Paused:
        return '⏸️';
      case DebugState.Stopped:
        return '⏹️';
      case DebugState.Error:
        return '❌';
      default:
        return '⚪';
    }
  };

  const getStateText = (): string => {
    switch (debugState) {
      case DebugState.Running:
        return 'Running';
      case DebugState.Paused:
        return 'Paused';
      case DebugState.Stopped:
        return 'Stopped';
      case DebugState.Error:
        return 'Error';
      default:
        return 'Ready';
    }
  };

  const getStateColor = (): string => {
    switch (debugState) {
      case DebugState.Running:
        return 'text-green-600';
      case DebugState.Paused:
        return 'text-orange-600';
      case DebugState.Stopped:
        return 'text-gray-600';
      case DebugState.Error:
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="flex items-center gap-1 p-2 bg-white border-b border-gray-200">
      {/* Main Debug Controls */}
      <div className="flex items-center gap-1 mr-4">
        {/* Start/Continue */}
        {debugState === DebugState.NotStarted || debugState === DebugState.Stopped ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            title="Start Debugging (F5)"
          >
            ▶️ Start
          </button>
        ) : debugState === DebugState.Paused ? (
          <button
            onClick={handleContinue}
            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            title="Continue (F5)"
          >
            ▶️ Continue
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            title="Pause"
          >
            ⏸️ Pause
          </button>
        )}

        {/* Stop */}
        <button
          onClick={handleStop}
          disabled={debugState === DebugState.NotStarted || debugState === DebugState.Stopped}
          className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Stop Debugging (Shift+F5)"
        >
          ⏹️ Stop
        </button>

        {/* Restart */}
        <button
          onClick={handleRestart}
          disabled={!isDebugging}
          className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Restart (Ctrl+Shift+F5)"
        >
          🔄
        </button>
      </div>

      {/* Step Controls */}
      <div className="flex items-center gap-1 mr-4">
        <button
          onClick={handleStepOver}
          disabled={debugState !== DebugState.Paused}
          className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Step Over (F10)"
        >
          ⏭️
        </button>

        <button
          onClick={handleStepInto}
          disabled={debugState !== DebugState.Paused}
          className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Step Into (F11)"
        >
          ⬇️
        </button>

        <button
          onClick={handleStepOut}
          disabled={debugState !== DebugState.Paused}
          className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Step Out (Shift+F11)"
        >
          ⬆️
        </button>
      </div>

      {/* Breakpoint Control */}
      <div className="flex items-center gap-1 mr-4">
        <button
          onClick={handleToggleBreakpoint}
          className="flex items-center gap-1 px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          title="Toggle Breakpoint (F9)"
        >
          🔴 BP
        </button>
      </div>

      {/* Status Info */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Current Location */}
        {currentLine > 0 && (
          <div className="text-sm text-gray-600">
            Line: {currentLine}
          </div>
        )}

        {/* Execution Time */}
        {isDebugging && (
          <div className="text-sm text-gray-600">
            Time: {executionTime}
          </div>
        )}

        {/* Debug State */}
        <div className={`flex items-center gap-1 text-sm ${getStateColor()}`}>
          <span>{getStateIcon()}</span>
          <span>{getStateText()}</span>
        </div>

        {/* Session Info */}
        {debugSession && (
          <div className="text-xs text-gray-500">
            Session: {debugSession.id.slice(-8)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugToolbar;