// Ultra-Think Hot-Reload Dashboard
// 🔥 Interface de contrôle et monitoring pour le système de rechargement à chaud

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Code,
  GitBranch,
  Cpu,
  MemoryStick,
  TrendingUp,
  RefreshCw,
  X,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useHotReload, useHotReloadMetrics } from '../../hooks/useHotReload';
import { HotReloadConfig } from '../../services/HotReloadEngine';

interface HotReloadDashboardProps {
  visible: boolean;
  onClose: () => void;
  compact?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const HotReloadDashboard: React.FC<HotReloadDashboardProps> = ({
  visible,
  onClose,
  compact = false,
  position = 'bottom-right'
}) => {
  const [status, actions] = useHotReload({
    enabled: true,
    autoWatch: true,
    preserveState: true,
    debounceMs: 300
  });
  
  const metrics = useHotReloadMetrics();
  const [activeTab, setActiveTab] = useState<'status' | 'metrics' | 'config' | 'debug'>('status');
  const [isCompact, setIsCompact] = useState(compact);
  const [config, setConfig] = useState<Partial<HotReloadConfig>>({
    enabled: true,
    watchFiles: true,
    preserveState: true,
    incrementalCompilation: true,
    debounceMs: 300,
    errorRecovery: true,
    verboseLogging: false
  });

  // Auto-hide after inactivity
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [autoHide, setAutoHide] = useState(false);

  useEffect(() => {
    if (autoHide && Date.now() - lastActivity > 10000) {
      onClose();
    }
  }, [lastActivity, autoHide, onClose]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    actions.updateConfig(newConfig);
    setLastActivity(Date.now());
  };

  if (!visible) return null;

  return (
    <div className={`fixed z-[10000] ${positionClasses[position]}`}>
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
        isCompact ? 'w-80' : 'w-96'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Zap size={16} className="animate-pulse" />
            <h3 className="font-semibold text-sm">Hot-Reload Dashboard</h3>
            {status.active && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
              title={isCompact ? "Expand" : "Compact"}
            >
              {isCompact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
            <button
              onClick={onClose}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Compact Status Bar */}
        {isCompact ? (
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={actions.toggleHotReload}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    status.enabled
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                  }`}
                >
                  {status.enabled ? <Play size={12} /> : <Pause size={12} />}
                  {status.enabled ? 'ON' : 'OFF'}
                </button>
                
                {status.isReloading && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <RefreshCw size={12} className="animate-spin" />
                    <span className="text-xs">Reloading...</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>{status.patchCount} patches</span>
                <span>{Math.round(metrics.successRate)}% success</span>
                <span>{Math.round(status.averageReloadTime)}ms avg</span>
              </div>
            </div>
            
            {status.lastError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <div className="flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {status.lastError}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { id: 'status', label: 'Status', icon: Activity },
                { id: 'metrics', label: 'Metrics', icon: TrendingUp },
                { id: 'config', label: 'Config', icon: Settings },
                { id: 'debug', label: 'Debug', icon: Code }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setLastActivity(Date.now());
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 max-h-80 overflow-y-auto">
              {activeTab === 'status' && (
                <div className="space-y-4">
                  {/* Main Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        actions.toggleHotReload();
                        setLastActivity(Date.now());
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded font-medium transition-colors ${
                        status.enabled
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                      }`}
                    >
                      {status.enabled ? <Play size={16} /> : <Pause size={16} />}
                      {status.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    
                    <button
                      onClick={() => {
                        actions.performManualReload();
                        setLastActivity(Date.now());
                      }}
                      disabled={!status.enabled || status.isReloading}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      <RefreshCw size={16} className={status.isReloading ? 'animate-spin' : ''} />
                      Reload Now
                    </button>
                  </div>

                  {/* Status Information */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-600">Status</div>
                      <div className={`font-semibold flex items-center gap-1 ${
                        status.active ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {status.active ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                        {status.active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-600">Last Reload</div>
                      <div className="font-semibold text-sm">
                        {status.lastReload 
                          ? new Date(status.lastReload).toLocaleTimeString()
                          : 'Never'
                        }
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-600">Patches Applied</div>
                      <div className="font-semibold text-lg">{status.patchCount}</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-600">Avg Reload Time</div>
                      <div className="font-semibold text-lg">
                        {Math.round(status.averageReloadTime)}ms
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
                  {status.lastError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                        <AlertTriangle size={16} />
                        Last Error
                      </div>
                      <div className="text-sm text-red-600">{status.lastError}</div>
                      <button
                        onClick={() => {
                          actions.rollbackLastPatch();
                          setLastActivity(Date.now());
                        }}
                        className="mt-2 flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                      >
                        <RotateCcw size={12} />
                        Rollback
                      </button>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        actions.testHotReload();
                        setLastActivity(Date.now());
                      }}
                      className="flex-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                    >
                      Test Reload
                    </button>
                    <button
                      onClick={() => {
                        actions.clearHistory();
                        setLastActivity(Date.now());
                      }}
                      className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                    >
                      Clear History
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'metrics' && (
                <div className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded p-3">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Activity size={16} />
                        <span className="font-medium">Success Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-800">
                        {Math.round(metrics.successRate)}%
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded p-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <Clock size={16} />
                        <span className="font-medium">Avg Time</span>
                      </div>
                      <div className="text-2xl font-bold text-green-800">
                        {Math.round(metrics.averageReloadTime)}ms
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded p-3">
                      <div className="flex items-center gap-2 text-purple-700">
                        <Cpu size={16} />
                        <span className="font-medium">Cache Hit</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-800">
                        {Math.round(metrics.cacheHitRate)}%
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 rounded p-3">
                      <div className="flex items-center gap-2 text-orange-700">
                        <MemoryStick size={16} />
                        <span className="font-medium">Memory</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-800">
                        {Math.round(metrics.memoryUsage)}MB
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Reloads:</span>
                      <span className="font-semibold">{metrics.totalReloads}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Errors:</span>
                      <span className="font-semibold text-red-600">{status.errorCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rollbacks:</span>
                      <span className="font-semibold text-orange-600">{status.rollbackCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'config' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Watch Files</span>
                      <input
                        type="checkbox"
                        checked={config.watchFiles}
                        onChange={(e) => handleConfigUpdate('watchFiles', e.target.checked)}
                        className="rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Preserve State</span>
                      <input
                        type="checkbox"
                        checked={config.preserveState}
                        onChange={(e) => handleConfigUpdate('preserveState', e.target.checked)}
                        className="rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Incremental Compilation</span>
                      <input
                        type="checkbox"
                        checked={config.incrementalCompilation}
                        onChange={(e) => handleConfigUpdate('incrementalCompilation', e.target.checked)}
                        className="rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Error Recovery</span>
                      <input
                        type="checkbox"
                        checked={config.errorRecovery}
                        onChange={(e) => handleConfigUpdate('errorRecovery', e.target.checked)}
                        className="rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Verbose Logging</span>
                      <input
                        type="checkbox"
                        checked={config.verboseLogging}
                        onChange={(e) => handleConfigUpdate('verboseLogging', e.target.checked)}
                        className="rounded"
                      />
                    </label>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block">
                      <span className="text-sm text-gray-700">Debounce Delay (ms)</span>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={config.debounceMs}
                        onChange={(e) => handleConfigUpdate('debounceMs', parseInt(e.target.value))}
                        className="w-full mt-1"
                      />
                      <div className="text-xs text-gray-500 text-center">{config.debounceMs}ms</div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'debug' && (
                <div className="space-y-4">
                  <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-40">
                    <div>Hot-Reload Engine v1.0.0</div>
                    <div>Status: {status.enabled ? 'ENABLED' : 'DISABLED'}</div>
                    <div>Active: {status.active ? 'YES' : 'NO'}</div>
                    <div>Watching: {config.watchFiles ? 'YES' : 'NO'}</div>
                    <div>State Preservation: {config.preserveState ? 'ON' : 'OFF'}</div>
                    <div>Incremental: {config.incrementalCompilation ? 'ON' : 'OFF'}</div>
                    <div>---</div>
                    <div>Memory: {Math.round(metrics.memoryUsage)}MB</div>
                    <div>Cache Hit Rate: {Math.round(metrics.cacheHitRate)}%</div>
                    <div>Last Activity: {new Date(lastActivity).toLocaleTimeString()}</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        console.log('Hot-Reload Debug Info:', { status, metrics, config });
                        setLastActivity(Date.now());
                      }}
                      className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                    >
                      Log Debug Info
                    </button>
                    <button
                      onClick={() => {
                        setAutoHide(!autoHide);
                        setLastActivity(Date.now());
                      }}
                      className={`flex-1 text-xs px-2 py-1 rounded transition-colors ${
                        autoHide 
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {autoHide ? <EyeOff size={12} /> : <Eye size={12} />}
                      {autoHide ? 'Auto-Hide' : 'Always Show'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HotReloadDashboard;