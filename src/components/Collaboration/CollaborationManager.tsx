/**
 * Real-time Collaboration Manager - Ultra-Advanced Edition
 * CRDT-based multi-user editing with WebRTC P2P communication
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVB6Store } from '../../stores/vb6Store';
import { eventSystem } from '../../services/VB6EventSystem';
import { useAuth } from '../../hooks/useAuth';
import { useCollaboration } from '../../hooks/useCollaboration';
import CollaborationPanel from './CollaborationPanel';
import CollaborationCursors from './CollaborationCursors';

export const CollaborationManager: React.FC = () => {
  const { user: authUser } = useAuth();
  const { currentCode, updateCode, controls, updateControl, currentForm } = useVB6Store();
  const [showPanel, setShowPanel] = useState(false);
  const [editorElement, setEditorElement] = useState<HTMLElement | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState('main-form');

  // User colors for cursors and selections
  const userColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FECA57',
    '#48C9B0',
    '#F368E0',
    '#00D2D3',
    '#6C5CE7',
    '#FDA7DF',
  ];

  // Initialize collaboration with user info
  const [collaborationState, collaborationActions] = useCollaboration({
    userId: authUser?.id || 'guest_' + Math.random().toString(36).substr(2, 9),
    userName: authUser?.name || 'Guest User',
    userColor: userColors[Math.floor(Math.random() * userColors.length)],
    enabled: true,
  });

  const { isEnabled, isConnected, currentSession, collaborators, engine } = collaborationState;

  const {
    createSession,
    joinSession,
    leaveSession,
    applyTextOperation,
    updateCursor,
    updateSelection,
    enableCollaboration,
    disableCollaboration,
  } = collaborationActions;

  // Track Monaco editor element
  useEffect(() => {
    const findMonacoEditor = () => {
      const monacoContainer = document.querySelector('.monaco-editor');
      if (monacoContainer) {
        setEditorElement(monacoContainer as HTMLElement);
      }
    };

    findMonacoEditor();

    // Check periodically for Monaco editor
    const interval = setInterval(findMonacoEditor, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle code changes and sync with collaboration
  const lastSentCode = useRef<string>('');
  useEffect(() => {
    if (!isConnected || !currentSession || currentCode === lastSentCode.current) {
      return;
    }

    // Calculate text diff and send operations
    const oldCode = lastSentCode.current;
    const newCode = currentCode;

    if (oldCode.length === 0 && newCode.length > 0) {
      // Initial content
      applyTextOperation(currentDocumentId, 'insert', 0, newCode);
    } else if (oldCode !== newCode) {
      // Find differences (simple implementation)
      const changes = calculateTextDiff(oldCode, newCode);
      for (const change of changes) {
        if (change.type === 'insert') {
          applyTextOperation(currentDocumentId, 'insert', change.position, change.content);
        } else if (change.type === 'delete') {
          applyTextOperation(currentDocumentId, 'delete', change.position, change.content);
        }
      }
    }

    lastSentCode.current = newCode;
  }, [currentCode, isConnected, currentSession, applyTextOperation, currentDocumentId]);

  // Handle remote document updates
  useEffect(() => {
    const handleDocumentUpdate = (event: CustomEvent) => {
      const { documentId, document, operation } = event.detail;

      if (documentId === currentDocumentId && document.content !== currentCode) {
        // Update local code without triggering another sync
        lastSentCode.current = document.content;
        updateCode(document.content);

        eventSystem.fire('Collaboration', 'DocumentUpdated', {
          documentId,
          operation,
          author: operation.author,
        });
      }
    };

    window.addEventListener('collaborationDocumentUpdated', handleDocumentUpdate as EventListener);

    return () => {
      window.removeEventListener(
        'collaborationDocumentUpdated',
        handleDocumentUpdate as EventListener
      );
    };
  }, [currentDocumentId, currentCode, updateCode]);

  // Handle cursor and selection updates in Monaco editor
  useEffect(() => {
    if (!editorElement || !isConnected || !currentSession) return;

    const monacoEditor = (editorElement as any)?._monacoEditor;
    if (!monacoEditor) return;

    let cursorUpdateTimeout: NodeJS.Timeout;

    const handleCursorPositionChange = () => {
      const position = monacoEditor.getPosition();
      if (position) {
        // Debounce cursor updates
        clearTimeout(cursorUpdateTimeout);
        cursorUpdateTimeout = setTimeout(() => {
          updateCursor(currentDocumentId, position.lineNumber - 1, position.column - 1);
        }, 100);
      }
    };

    const handleSelectionChange = () => {
      const selection = monacoEditor.getSelection();
      if (selection && !selection.isEmpty()) {
        updateSelection(
          currentDocumentId,
          selection.startLineNumber - 1,
          selection.startColumn - 1,
          selection.endLineNumber - 1,
          selection.endColumn - 1
        );
      }
    };

    // Subscribe to Monaco editor events
    const cursorDisposable = monacoEditor.onDidChangeCursorPosition(handleCursorPositionChange);
    const selectionDisposable = monacoEditor.onDidChangeCursorSelection(handleSelectionChange);

    return () => {
      clearTimeout(cursorUpdateTimeout);
      cursorDisposable?.dispose();
      selectionDisposable?.dispose();
    };
  }, [
    editorElement,
    isConnected,
    currentSession,
    updateCursor,
    updateSelection,
    currentDocumentId,
  ]);

  // Calculate text differences for operation transformation
  const calculateTextDiff = (oldText: string, newText: string) => {
    const changes: Array<{
      type: 'insert' | 'delete';
      position: number;
      content: string;
    }> = [];

    // Simple diff algorithm (in production, use a more sophisticated one)
    if (newText.length > oldText.length) {
      // Text was inserted
      const commonPrefix = getCommonPrefix(oldText, newText);
      const insertedText = newText.slice(
        commonPrefix,
        commonPrefix + (newText.length - oldText.length)
      );

      if (insertedText) {
        changes.push({
          type: 'insert',
          position: commonPrefix,
          content: insertedText,
        });
      }
    } else if (newText.length < oldText.length) {
      // Text was deleted
      const commonPrefix = getCommonPrefix(oldText, newText);
      const deletedText = oldText.slice(
        commonPrefix,
        commonPrefix + (oldText.length - newText.length)
      );

      if (deletedText) {
        changes.push({
          type: 'delete',
          position: commonPrefix,
          content: deletedText,
        });
      }
    }

    return changes;
  };

  const getCommonPrefix = (str1: string, str2: string): number => {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return i;
  };

  // Handle session creation
  const handleCreateSession = useCallback(async () => {
    const sessionId = await createSession('VB6 Collaboration Session', {
      isPrivate: false,
      maxParticipants: 10,
    });

    if (sessionId) {
      eventSystem.fire('Collaboration', 'SessionCreated', { sessionId });
    }
  }, [createSession]);

  // Handle session joining
  const handleJoinSession = useCallback(
    async (sessionId: string) => {
      const success = await joinSession(sessionId);

      if (success) {
        eventSystem.fire('Collaboration', 'SessionJoined', { sessionId });
      }
    },
    [joinSession]
  );

  // Handle session leaving
  const handleLeaveSession = useCallback(async () => {
    await leaveSession();
    eventSystem.fire('Collaboration', 'SessionLeft', {});
  }, [leaveSession]);

  return (
    <>
      {/* Collaboration Status Indicator */}
      <div className="fixed top-16 right-4 z-40">
        <motion.button
          className="bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-2 flex items-center gap-2 hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPanel(!showPanel)}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected && currentSession
                ? 'bg-green-500 animate-pulse'
                : isEnabled
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
            }`}
          />
          <span className="text-sm font-medium">
            {currentSession
              ? `${collaborators.length + 1} users`
              : isEnabled
                ? 'Start Collaboration'
                : 'Offline'}
          </span>
          {isConnected && currentSession && (
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
          )}
        </motion.button>
      </div>

      {/* Real-time Cursors and Selections */}
      {currentSession && editorElement && (
        <CollaborationCursors
          collaborators={collaborators}
          currentUserId={authUser?.id || 'guest'}
          editorElement={editorElement}
          documentId={currentDocumentId}
        />
      )}

      {/* Collaboration Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-16 bottom-0 z-50 shadow-2xl"
          >
            <CollaborationPanel
              collaborationEngine={engine}
              onCreateSession={handleCreateSession}
              onJoinSession={handleJoinSession}
              onLeaveSession={handleLeaveSession}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Toast */}
      <AnimatePresence>
        {currentSession && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-40"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                Collaborating with {collaborators.length} others
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collaboration Notifications */}
      <div id="collaboration-notifications" className="fixed top-20 right-4 z-50 space-y-2">
        {/* Notifications will be rendered here by the event system */}
      </div>
    </>
  );
};

export default CollaborationManager;
