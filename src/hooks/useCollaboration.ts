/**
 * Collaboration Hook - Manages real-time collaboration state
 * 
 * Features:
 * - Collaboration engine lifecycle management
 * - Document synchronization
 * - Cursor and selection tracking
 * - Presence management
 * - Conflict resolution
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import VB6CollaborationEngine, { CollaboratorInfo, CollaborationSession } from '../services/VB6CollaborationEngine';

interface UseCollaborationOptions {
  userId: string;
  userName: string;
  userColor: string;
  enabled?: boolean;
}

interface CollaborationState {
  isEnabled: boolean;
  isConnected: boolean;
  currentSession: CollaborationSession | null;
  collaborators: CollaboratorInfo[];
  engine: VB6CollaborationEngine | null;
}

interface CollaborationActions {
  createSession: (name: string, options?: { isPrivate?: boolean; maxParticipants?: number }) => Promise<string | null>;
  joinSession: (sessionId: string) => Promise<boolean>;
  leaveSession: () => Promise<void>;
  applyTextOperation: (documentId: string, type: 'insert' | 'delete', position: number, content?: string) => Promise<void>;
  updateCursor: (documentId: string, line: number, column: number) => Promise<void>;
  updateSelection: (documentId: string, startLine: number, startColumn: number, endLine: number, endColumn: number) => Promise<void>;
  enableCollaboration: () => void;
  disableCollaboration: () => void;
}

export const useCollaboration = (options: UseCollaborationOptions): [CollaborationState, CollaborationActions] => {
  const { userId, userName, userColor, enabled = true } = options;
  
  const [state, setState] = useState<CollaborationState>({
    isEnabled: enabled,
    isConnected: false,
    currentSession: null,
    collaborators: [],
    engine: null
  });

  const engineRef = useRef<VB6CollaborationEngine | null>(null);
  const documentSubscriptions = useRef<Map<string, () => void>>(new Map());

  // Initialize collaboration engine
  useEffect(() => {
    if (!state.isEnabled || engineRef.current) return;

    const engine = new VB6CollaborationEngine(userId, {
      name: userName,
      color: userColor
    });

    engineRef.current = engine;
    setState(prev => ({ ...prev, engine }));

    // Set up event listeners
    const handleSessionCreated = (session: CollaborationSession) => {
      setState(prev => ({
        ...prev,
        currentSession: session,
        isConnected: true
      }));
    };

    const handleSessionJoined = (session: CollaborationSession) => {
      setState(prev => ({
        ...prev,
        currentSession: session,
        isConnected: true
      }));
    };

    const handleSessionLeft = () => {
      setState(prev => ({
        ...prev,
        currentSession: null,
        isConnected: false,
        collaborators: []
      }));
    };

    const handleCollaboratorJoined = (collaborator: CollaboratorInfo) => {
      setState(prev => ({
        ...prev,
        collaborators: [...prev.collaborators.filter(c => c.id !== collaborator.id), collaborator]
      }));
    };

    const handleCollaboratorLeft = (collaborator: CollaboratorInfo) => {
      setState(prev => ({
        ...prev,
        collaborators: prev.collaborators.filter(c => c.id !== collaborator.id)
      }));
    };

    const handleCollaboratorUpdated = (collaborator: CollaboratorInfo) => {
      setState(prev => ({
        ...prev,
        collaborators: prev.collaborators.map(c => c.id === collaborator.id ? collaborator : c)
      }));
    };

    const handlePeerConnected = () => {
      setState(prev => ({ ...prev, isConnected: true }));
    };

    const handlePeerDisconnected = () => {
      // Don't immediately set disconnected - might be temporary
      setTimeout(() => {
        if (engineRef.current && engineRef.current.getCollaborators().length === 0) {
          setState(prev => ({ ...prev, isConnected: false }));
        }
      }, 5000);
    };

    const handleDocumentUpdated = (data: { documentId: string; document: any; operation: any }) => {
      // Emit document change event for external listeners
      const event = new CustomEvent('collaborationDocumentUpdated', {
        detail: data
      });
      window.dispatchEvent(event);
    };

    // Subscribe to events
    engine.on('sessionCreated', handleSessionCreated);
    engine.on('sessionJoined', handleSessionJoined);
    engine.on('sessionLeft', handleSessionLeft);
    engine.on('collaboratorJoined', handleCollaboratorJoined);
    engine.on('collaboratorLeft', handleCollaboratorLeft);
    engine.on('collaboratorUpdated', handleCollaboratorUpdated);
    engine.on('peerConnected', handlePeerConnected);
    engine.on('peerDisconnected', handlePeerDisconnected);
    engine.on('documentUpdated', handleDocumentUpdated);

    if (process.env.NODE_ENV === 'development') {
      console.log('🤝 Collaboration engine initialized');
    }

    return () => {
      // Cleanup
      engine.off('sessionCreated', handleSessionCreated);
      engine.off('sessionJoined', handleSessionJoined);
      engine.off('sessionLeft', handleSessionLeft);
      engine.off('collaboratorJoined', handleCollaboratorJoined);
      engine.off('collaboratorLeft', handleCollaboratorLeft);
      engine.off('collaboratorUpdated', handleCollaboratorUpdated);
      engine.off('peerConnected', handlePeerConnected);
      engine.off('peerDisconnected', handlePeerDisconnected);
      engine.off('documentUpdated', handleDocumentUpdated);
      
      engine.destroy();
      engineRef.current = null;
    };
  }, [state.isEnabled, userId, userName, userColor]);

  // Update collaborators periodically
  useEffect(() => {
    if (!engineRef.current) return;

    const updateCollaborators = () => {
      const current = engineRef.current?.getCollaborators() || [];
      setState(prev => ({ ...prev, collaborators: current }));
    };

    const interval = setInterval(updateCollaborators, 2000);
    return () => clearInterval(interval);
  }, [state.engine]);

  // Actions
  const createSession = useCallback(async (
    name: string,
    options?: { isPrivate?: boolean; maxParticipants?: number }
  ): Promise<string | null> => {
    if (!engineRef.current) {
      console.error('Collaboration engine not initialized');
      return null;
    }

    try {
      const sessionId = await engineRef.current.createSession(name, options);
      return sessionId;
    } catch (error) {
      console.error('Failed to create collaboration session:', error);
      return null;
    }
  }, []);

  const joinSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!engineRef.current) {
      console.error('Collaboration engine not initialized');
      return false;
    }

    try {
      await engineRef.current.joinSession(sessionId);
      return true;
    } catch (error) {
      console.error('Failed to join collaboration session:', error);
      return false;
    }
  }, []);

  const leaveSession = useCallback(async (): Promise<void> => {
    if (!engineRef.current) return;

    try {
      await engineRef.current.leaveSession();
    } catch (error) {
      console.error('Failed to leave collaboration session:', error);
    }
  }, []);

  const applyTextOperation = useCallback(async (
    documentId: string,
    type: 'insert' | 'delete',
    position: number,
    content?: string
  ): Promise<void> => {
    if (!engineRef.current) return;

    try {
      await engineRef.current.applyOperation(documentId, {
        type,
        position,
        content
      });
    } catch (error) {
      console.error('Failed to apply text operation:', error);
    }
  }, []);

  const updateCursor = useCallback(async (
    documentId: string,
    line: number,
    column: number
  ): Promise<void> => {
    if (!engineRef.current) return;

    try {
      await engineRef.current.updateCursor(documentId, line, column);
    } catch (error) {
      console.error('Failed to update cursor:', error);
    }
  }, []);

  const updateSelection = useCallback(async (
    documentId: string,
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number
  ): Promise<void> => {
    if (!engineRef.current) return;

    try {
      await engineRef.current.updateSelection(
        documentId,
        startLine,
        startColumn,
        endLine,
        endColumn
      );
    } catch (error) {
      console.error('Failed to update selection:', error);
    }
  }, []);

  const enableCollaboration = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: true }));
  }, []);

  const disableCollaboration = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setState({
      isEnabled: false,
      isConnected: false,
      currentSession: null,
      collaborators: [],
      engine: null
    });
  }, []);

  const actions: CollaborationActions = {
    createSession,
    joinSession,
    leaveSession,
    applyTextOperation,
    updateCursor,
    updateSelection,
    enableCollaboration,
    disableCollaboration
  };

  return [state, actions];
};

export default useCollaboration;