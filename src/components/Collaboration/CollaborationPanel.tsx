/**
 * Collaboration Panel - Real-time collaboration UI
 *
 * Features:
 * - Live collaborator presence with avatars and status
 * - Session management (create, join, leave)
 * - Real-time cursor and selection indicators
 * - Connection status and latency monitoring
 * - Conflict resolution notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Wifi,
  WifiOff,
  Activity,
  MessageCircle,
  Settings,
  UserPlus,
  LogOut,
} from 'lucide-react';
import VB6CollaborationEngine, {
  CollaboratorInfo,
  CollaborationSession,
} from '../../services/VB6CollaborationEngine';

interface CollaborationPanelProps {
  collaborationEngine: VB6CollaborationEngine | null;
  onCreateSession: () => void;
  onJoinSession: (sessionId: string) => void;
  onLeaveSession: () => void;
}

interface ConnectionStatus {
  isConnected: boolean;
  participantCount: number;
  latency: number;
  lastSync: number;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  collaborationEngine,
  onCreateSession,
  onJoinSession,
  onLeaveSession,
}) => {
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    participantCount: 0,
    latency: 0,
    lastSync: 0,
  });
  const [joinSessionId, setJoinSessionId] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [isPrivateSession, setIsPrivateSession] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(10);

  // Event handlers for collaboration engine
  useEffect(() => {
    if (!collaborationEngine) return;

    const handleCollaboratorJoined = (collaborator: CollaboratorInfo) => {
      setCollaborators(prev => [...prev.filter(c => c.id !== collaborator.id), collaborator]);
    };

    const handleCollaboratorLeft = (collaborator: CollaboratorInfo) => {
      setCollaborators(prev => prev.filter(c => c.id !== collaborator.id));
    };

    const handleCollaboratorUpdated = (collaborator: CollaboratorInfo) => {
      setCollaborators(prev => prev.map(c => (c.id === collaborator.id ? collaborator : c)));
    };

    const handleSessionCreated = (session: CollaborationSession) => {
      setCurrentSession(session);
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        participantCount: session.participants.size,
      }));
    };

    const handleSessionJoined = (session: CollaborationSession) => {
      setCurrentSession(session);
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        participantCount: session.participants.size,
      }));
    };

    const handleSessionLeft = () => {
      setCurrentSession(null);
      setCollaborators([]);
      setConnectionStatus({
        isConnected: false,
        participantCount: 0,
        latency: 0,
        lastSync: 0,
      });
    };

    const handlePeerConnected = (peerId: string) => {
      setConnectionStatus(prev => ({ ...prev, isConnected: true }));
    };

    const handlePeerDisconnected = (peerId: string) => {};

    // Subscribe to events
    collaborationEngine.on('collaboratorJoined', handleCollaboratorJoined);
    collaborationEngine.on('collaboratorLeft', handleCollaboratorLeft);
    collaborationEngine.on('collaboratorUpdated', handleCollaboratorUpdated);
    collaborationEngine.on('sessionCreated', handleSessionCreated);
    collaborationEngine.on('sessionJoined', handleSessionJoined);
    collaborationEngine.on('sessionLeft', handleSessionLeft);
    collaborationEngine.on('peerConnected', handlePeerConnected);
    collaborationEngine.on('peerDisconnected', handlePeerDisconnected);

    return () => {
      collaborationEngine.off('collaboratorJoined', handleCollaboratorJoined);
      collaborationEngine.off('collaboratorLeft', handleCollaboratorLeft);
      collaborationEngine.off('collaboratorUpdated', handleCollaboratorUpdated);
      collaborationEngine.off('sessionCreated', handleSessionCreated);
      collaborationEngine.off('sessionJoined', handleSessionJoined);
      collaborationEngine.off('sessionLeft', handleSessionLeft);
      collaborationEngine.off('peerConnected', handlePeerConnected);
      collaborationEngine.off('peerDisconnected', handlePeerDisconnected);
    };
  }, [collaborationEngine]);

  // Update collaborators periodically
  useEffect(() => {
    if (!collaborationEngine) return;

    const updateCollaborators = () => {
      const current = collaborationEngine.getCollaborators();
      setCollaborators(current);
    };

    updateCollaborators();
    const interval = setInterval(updateCollaborators, 2000);

    return () => clearInterval(interval);
  }, [collaborationEngine]);

  const handleCreateSession = async () => {
    if (!collaborationEngine || !newSessionName.trim()) return;

    try {
      const sessionId = await collaborationEngine.createSession(newSessionName, {
        isPrivate: isPrivateSession,
        maxParticipants,
      });
      setShowCreateDialog(false);
      setNewSessionName('');
      onCreateSession();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleJoinSession = async () => {
    if (!collaborationEngine || !joinSessionId.trim()) return;

    try {
      await collaborationEngine.joinSession(joinSessionId);
      setShowJoinDialog(false);
      setJoinSessionId('');
      onJoinSession(joinSessionId);
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  const handleLeaveSession = async () => {
    if (!collaborationEngine) return;

    try {
      await collaborationEngine.leaveSession();
      onLeaveSession();
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  const formatLastSeen = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="bg-white border-r border-gray-200 flex flex-col h-full w-64">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-sm">Collaboration</span>
        </div>
        <div className="flex items-center space-x-1">
          {connectionStatus.isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs text-gray-500">{connectionStatus.participantCount}</span>
        </div>
      </div>

      {/* Session Controls */}
      <div className="p-3 border-b border-gray-200">
        {currentSession ? (
          <div className="space-y-2">
            <div className="text-sm">
              <div className="font-medium text-gray-900 truncate">{currentSession.name}</div>
              <div className="text-xs text-gray-500">
                {currentSession.participants.size} participants
              </div>
            </div>
            <button
              onClick={handleLeaveSession}
              className="w-full flex items-center justify-center space-x-1 px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded"
            >
              <LogOut className="w-3 h-3" />
              <span>Leave Session</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="w-full flex items-center justify-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
            >
              <UserPlus className="w-3 h-3" />
              <span>Create Session</span>
            </button>
            <button
              onClick={() => setShowJoinDialog(true)}
              className="w-full flex items-center justify-center space-x-1 px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded"
            >
              <Activity className="w-3 h-3" />
              <span>Join Session</span>
            </button>
          </div>
        )}
      </div>

      {/* Connection Status */}
      {currentSession && (
        <div className="p-3 border-b border-gray-200">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={connectionStatus.isConnected ? 'text-green-600' : 'text-red-600'}>
                {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {connectionStatus.latency > 0 && (
              <div className="flex justify-between">
                <span>Latency:</span>
                <span>{connectionStatus.latency}ms</span>
              </div>
            )}
            {connectionStatus.lastSync > 0 && (
              <div className="flex justify-between">
                <span>Last Sync:</span>
                <span>{formatLastSeen(connectionStatus.lastSync)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collaborators List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Collaborators ({collaborators.length})
          </div>
          <div className="space-y-2">
            {collaborators.map(collaborator => (
              <div
                key={collaborator.id}
                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50"
              >
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: collaborator.color }}
                  >
                    {collaborator.avatar ? (
                      <img
                        src={collaborator.avatar}
                        alt={collaborator.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      collaborator.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(collaborator.isOnline)}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {collaborator.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {collaborator.isOnline
                      ? collaborator.cursor
                        ? `Line ${collaborator.cursor.line}`
                        : 'Active'
                      : formatLastSeen(collaborator.lastSeen)}
                  </div>
                </div>
                {collaborator.cursor && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: collaborator.color }}
                  />
                )}
              </div>
            ))}
            {collaborators.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">No collaborators yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Create Session Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Create Collaboration Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={e => setNewSessionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter session name..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="private"
                  checked={isPrivateSession}
                  onChange={e => setIsPrivateSession(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="private" className="text-sm text-gray-700">
                  Private session
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Participants
                </label>
                <input
                  type="number"
                  value={maxParticipants}
                  onChange={e => setMaxParticipants(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="2"
                  max="50"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!newSessionName.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Session Dialog */}
      {showJoinDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Join Collaboration Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
                <input
                  type="text"
                  value={joinSessionId}
                  onChange={e => setJoinSessionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter session ID..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowJoinDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinSession}
                disabled={!joinSessionId.trim()}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationPanel;
