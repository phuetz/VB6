import React, { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  X,
  Download,
  Copy,
  Trash2,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useVB6Store } from '../../stores/vb6Store';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  data?: any;
}

export const LogPanel: React.FC = () => {
  const { logs, clearLogs, toggleWindow, showLogPanel } = useVB6Store();
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [showData, setShowData] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getFilteredLogs = () => {
    return logs.filter(
      log =>
        (filter === 'all' || log.level === filter) &&
        (searchTerm === '' ||
          log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.source.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info size={14} className="text-blue-500" />;
      case 'warn':
        return <AlertTriangle size={14} className="text-yellow-500" />;
      case 'error':
        return <AlertCircle size={14} className="text-red-500" />;
      case 'debug':
        return <Bug size={14} className="text-purple-500" />;
      default:
        return <Info size={14} className="text-blue-500" />;
    }
  };

  const getBackgroundColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'hover:bg-blue-50';
      case 'warn':
        return 'hover:bg-yellow-50';
      case 'error':
        return 'hover:bg-red-50';
      case 'debug':
        return 'hover:bg-purple-50';
      default:
        return 'hover:bg-gray-50';
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const copyLogs = () => {
    const logText = getFilteredLogs()
      .map(
        log =>
          `[${formatTimestamp(log.timestamp)}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
      )
      .join('\n');

    navigator.clipboard.writeText(logText);
  };

  const downloadLogs = () => {
    const logText = getFilteredLogs()
      .map(
        log =>
          `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
      )
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vb6-logs-${new Date().toISOString().replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!showLogPanel) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-400 z-20"
      style={{ height: '250px' }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-blue-600 text-white text-xs font-bold p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug size={14} />
            <span>Debug Logs</span>
            <span className="ml-2 px-2 py-0.5 bg-blue-800 rounded-full text-xs">
              {logs.length} entries
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-1 hover:bg-blue-700 rounded"
              title="Clear logs"
              onClick={clearLogs}
            >
              <Trash2 size={14} />
            </button>
            <button className="p-1 hover:bg-blue-700 rounded" title="Copy logs" onClick={copyLogs}>
              <Copy size={14} />
            </button>
            <button
              className="p-1 hover:bg-blue-700 rounded"
              title="Download logs"
              onClick={downloadLogs}
            >
              <Download size={14} />
            </button>
            <button
              className={`p-1 hover:bg-blue-700 rounded ${autoScroll ? 'bg-blue-700' : ''}`}
              title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
              onClick={() => setAutoScroll(!autoScroll)}
            >
              {autoScroll ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              className="p-1 hover:bg-blue-700 rounded"
              title="Close"
              onClick={() => toggleWindow('showLogPanel')}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 bg-gray-100 border-b border-gray-300">
          <div className="flex items-center gap-1">
            <Filter size={14} className="text-gray-500" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Logs</option>
              <option value="info">Info</option>
              <option value="warn">Warnings</option>
              <option value="error">Errors</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 flex-1"
          />

          <div className="text-xs text-gray-500">
            Showing {getFilteredLogs().length} of {logs.length} logs
          </div>
        </div>

        {/* Log content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {getFilteredLogs().length > 0 ? (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-100">
                <tr className="border-b border-gray-200">
                  <th className="text-left p-1 w-24">Time</th>
                  <th className="text-left p-1 w-16">Level</th>
                  <th className="text-left p-1 w-32">Source</th>
                  <th className="text-left p-1">Message</th>
                  <th className="text-center p-1 w-16">Data</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredLogs().map(log => (
                  <tr
                    key={log.id}
                    className={`border-b border-gray-200 ${getBackgroundColor(log.level)}`}
                  >
                    <td className="p-1 font-mono">{formatTimestamp(log.timestamp)}</td>
                    <td className="p-1">
                      <div className="flex items-center gap-1">
                        {getLevelIcon(log.level)}
                        <span className="capitalize">{log.level}</span>
                      </div>
                    </td>
                    <td className="p-1">{log.source}</td>
                    <td className="p-1 whitespace-pre-wrap">{log.message}</td>
                    <td className="p-1 text-center">
                      {log.data && (
                        <button
                          onClick={() => setShowData(showData === log.id ? null : log.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {showData === log.id ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No logs match your filter criteria
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Data inspector modal */}
      {showData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Log Data</h3>
              <button onClick={() => setShowData(null)} className="p-1 hover:bg-gray-200 rounded">
                <X size={18} />
              </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded text-xs font-mono overflow-x-auto">
              {JSON.stringify(logs.find(l => l.id === showData)?.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
