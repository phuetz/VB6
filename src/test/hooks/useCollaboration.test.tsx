/**
 * Tests unitaires pour le hook de collaboration
 * Teste toutes les fonctionnalités de collaboration en temps réel
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollaboration } from '../../hooks/useCollaboration';
import VB6CollaborationEngine from '../../services/VB6CollaborationEngine';

// Mock the collaboration engine
vi.mock('../../services/VB6CollaborationEngine');

describe('useCollaboration Hook', () => {
  const mockOptions = {
    userId: 'test-user-123',
    userName: 'Test User',
    userColor: '#FF6B6B',
    enabled: true
  };

  let mockEngine: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock engine instance
    mockEngine = {
      createSession: vi.fn(),
      joinSession: vi.fn(),
      leaveSession: vi.fn(),
      applyOperation: vi.fn(),
      updateCursor: vi.fn(),
      updateSelection: vi.fn(),
      getCollaborators: vi.fn().mockReturnValue([]),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };

    // Mock the VB6CollaborationEngine constructor
    (VB6CollaborationEngine as any).mockImplementation(() => mockEngine);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [state] = result.current;

      expect(state.isEnabled).toBe(true);
      expect(state.isConnected).toBe(false);
      expect(state.currentSession).toBeNull();
      expect(state.collaborators).toEqual([]);
      expect(state.engine).toBeDefined();
    });

    it('should create collaboration engine with correct parameters', () => {
      renderHook(() => useCollaboration(mockOptions));

      expect(VB6CollaborationEngine).toHaveBeenCalledWith(
        'test-user-123',
        {
          name: 'Test User',
          color: '#FF6B6B'
        }
      );
    });

    it('should set up event listeners on engine', () => {
      renderHook(() => useCollaboration(mockOptions));

      expect(mockEngine.on).toHaveBeenCalledWith('sessionCreated', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('sessionJoined', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('sessionLeft', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('collaboratorJoined', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('collaboratorLeft', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('collaboratorUpdated', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('peerConnected', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('peerDisconnected', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('documentUpdated', expect.any(Function));
    });

    it('should not initialize engine when disabled', () => {
      const disabledOptions = { ...mockOptions, enabled: false };
      const { result } = renderHook(() => useCollaboration(disabledOptions));
      const [state] = result.current;

      expect(state.isEnabled).toBe(false);
      expect(state.engine).toBeNull();
      expect(VB6CollaborationEngine).not.toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should create session successfully', async () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [, actions] = result.current;

      mockEngine.createSession.mockResolvedValue('session-123');

      let sessionId: string | null = null;
      await act(async () => {
        sessionId = await actions.createSession('Test Session', {
          isPrivate: true,
          maxParticipants: 5
        });
      });

      expect(sessionId).toBe('session-123');
      expect(mockEngine.createSession).toHaveBeenCalledWith('Test Session', {
        isPrivate: true,
        maxParticipants: 5
      });
    });

    it('should handle create session failure', async () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [, actions] = result.current;

      mockEngine.createSession.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      let sessionId: string | null = null;
      await act(async () => {
        sessionId = await actions.createSession('Test Session');
      });

      expect(sessionId).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create collaboration session:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should join session successfully', async () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [, actions] = result.current;

      mockEngine.joinSession.mockResolvedValue(undefined);

      let success = false;
      await act(async () => {
        success = await actions.joinSession('session-456');
      });

      expect(success).toBe(true);
      expect(mockEngine.joinSession).toHaveBeenCalledWith('session-456');
    });

    it('should handle join session failure', async () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [, actions] = result.current;

      mockEngine.joinSession.mockRejectedValue(new Error('Join failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      let success = true;
      await act(async () => {
        success = await actions.joinSession('session-456');
      });

      expect(success).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to join collaboration session:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should leave session successfully', async () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [, actions] = result.current;

      mockEngine.leaveSession.mockResolvedValue(undefined);

      await act(async () => {
        await actions.leaveSession();
      });

      expect(mockEngine.leaveSession).toHaveBeenCalled();
    });
  });

  describe('Text Operations', () => {
    it('should apply text operations', async () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [, actions] = result.current;

      mockEngine.applyOperation.mockResolvedValue(undefined);

      await act(async () => {
        await actions.applyTextOperation('doc1', 'insert', 10, 'hello');
      });

      expect(mockEngine.applyOperation).toHaveBeenCalledWith('doc1', {
        type: 'insert',
        position: 10,
        content: 'hello'
      });
    });

    it('should handle text operation errors', async () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [, actions] = result.current;

      mockEngine.applyOperation.mockRejectedValue(new Error('Operation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        await actions.applyTextOperation('doc1', 'delete', 5, 'text');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to apply text operation:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Cursor and Selection Updates', () => {
    it('should update cursor position', async () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [, actions] = result.current;

      mockEngine.updateCursor.mockResolvedValue(undefined);

      await act(async () => {
        await actions.updateCursor('doc1', 5, 10);
      });

      expect(mockEngine.updateCursor).toHaveBeenCalledWith('doc1', 5, 10);
    });

    it('should update selection range', async () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [, actions] = result.current;

      mockEngine.updateSelection.mockResolvedValue(undefined);

      await act(async () => {
        await actions.updateSelection('doc1', 2, 5, 4, 15);
      });

      expect(mockEngine.updateSelection).toHaveBeenCalledWith('doc1', 2, 5, 4, 15);
    });
  });

  describe('Event Handling', () => {
    it('should handle session created event', () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));

      // Get the event handler
      const sessionCreatedHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'sessionCreated'
      )[1];

      const mockSession = {
        id: 'session-123',
        name: 'Test Session',
        participants: new Set(['user1', 'user2'])
      };

      act(() => {
        sessionCreatedHandler(mockSession);
      });

      const [state] = result.current;
      expect(state.currentSession).toBe(mockSession);
      expect(state.isConnected).toBe(true);
    });

    it('should handle session joined event', () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));

      const sessionJoinedHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'sessionJoined'
      )[1];

      const mockSession = {
        id: 'session-456',
        name: 'Joined Session',
        participants: new Set(['user1'])
      };

      act(() => {
        sessionJoinedHandler(mockSession);
      });

      const [state] = result.current;
      expect(state.currentSession).toBe(mockSession);
      expect(state.isConnected).toBe(true);
    });

    it('should handle session left event', () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));

      // First join a session
      const sessionJoinedHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'sessionJoined'
      )[1];

      act(() => {
        sessionJoinedHandler({ id: 'session-123', participants: new Set() });
      });

      // Then leave the session
      const sessionLeftHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'sessionLeft'
      )[1];

      act(() => {
        sessionLeftHandler();
      });

      const [state] = result.current;
      expect(state.currentSession).toBeNull();
      expect(state.isConnected).toBe(false);
      expect(state.collaborators).toEqual([]);
    });

    it('should handle collaborator joined event', () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));

      const collaboratorJoinedHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'collaboratorJoined'
      )[1];

      const mockCollaborator = {
        id: 'user2',
        name: 'New User',
        color: '#00FF00',
        isOnline: true,
        lastSeen: Date.now()
      };

      act(() => {
        collaboratorJoinedHandler(mockCollaborator);
      });

      const [state] = result.current;
      expect(state.collaborators).toContain(mockCollaborator);
    });

    it('should handle collaborator left event', () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));

      const collaboratorJoinedHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'collaboratorJoined'
      )[1];
      const collaboratorLeftHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'collaboratorLeft'
      )[1];

      const mockCollaborator = {
        id: 'user2',
        name: 'User',
        color: '#00FF00',
        isOnline: true,
        lastSeen: Date.now()
      };

      // Add collaborator
      act(() => {
        collaboratorJoinedHandler(mockCollaborator);
      });

      // Remove collaborator
      act(() => {
        collaboratorLeftHandler(mockCollaborator);
      });

      const [state] = result.current;
      expect(state.collaborators).not.toContain(mockCollaborator);
    });

    it('should handle collaborator updated event', () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));

      const collaboratorJoinedHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'collaboratorJoined'
      )[1];
      const collaboratorUpdatedHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'collaboratorUpdated'
      )[1];

      const mockCollaborator = {
        id: 'user2',
        name: 'User',
        color: '#00FF00',
        isOnline: true,
        lastSeen: Date.now()
      };

      // Add collaborator
      act(() => {
        collaboratorJoinedHandler(mockCollaborator);
      });

      // Update collaborator
      const updatedCollaborator = {
        ...mockCollaborator,
        name: 'Updated User',
        cursor: { line: 5, column: 10, documentId: 'doc1' }
      };

      act(() => {
        collaboratorUpdatedHandler(updatedCollaborator);
      });

      const [state] = result.current;
      const found = state.collaborators.find(c => c.id === 'user2');
      expect(found?.name).toBe('Updated User');
      expect(found?.cursor).toEqual({ line: 5, column: 10, documentId: 'doc1' });
    });

    it('should handle peer connection events', () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));

      const peerConnectedHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'peerConnected'
      )[1];

      act(() => {
        peerConnectedHandler();
      });

      const [state] = result.current;
      expect(state.isConnected).toBe(true);
    });

    it('should handle document updated event', () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));

      const documentUpdatedHandler = mockEngine.on.mock.calls.find(
        call => call[0] === 'documentUpdated'
      )[1];

      // Mock window.dispatchEvent
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

      const mockData = {
        documentId: 'doc1',
        document: { content: 'updated content' },
        operation: { type: 'insert', author: 'user2' }
      };

      act(() => {
        documentUpdatedHandler(mockData);
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'collaborationDocumentUpdated',
          detail: mockData
        })
      );

      dispatchEventSpy.mockRestore();
    });
  });

  describe('Collaborator Updates', () => {
    it('should update collaborators periodically', async () => {
      const mockCollaborators = [
        { id: 'user1', name: 'User 1', color: '#FF0000', isOnline: true, lastSeen: Date.now() },
        { id: 'user2', name: 'User 2', color: '#00FF00', isOnline: false, lastSeen: Date.now() - 60000 }
      ];

      mockEngine.getCollaborators.mockReturnValue(mockCollaborators);

      const { result } = renderHook(() => useCollaboration(mockOptions));

      // Wait for the periodic update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2100)); // Wait for interval
      });

      const [state] = result.current;
      expect(state.collaborators).toEqual(mockCollaborators);
    });
  });

  describe('Enable/Disable Collaboration', () => {
    it('should enable collaboration', () => {
      const disabledOptions = { ...mockOptions, enabled: false };
      const { result } = renderHook(() => useCollaboration(disabledOptions));
      const [initialState, actions] = result.current;

      expect(initialState.isEnabled).toBe(false);

      act(() => {
        actions.enableCollaboration();
      });

      const [newState] = result.current;
      expect(newState.isEnabled).toBe(true);
    });

    it('should disable collaboration and cleanup', () => {
      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [, actions] = result.current;

      act(() => {
        actions.disableCollaboration();
      });

      const [state] = result.current;
      expect(state.isEnabled).toBe(false);
      expect(state.isConnected).toBe(false);
      expect(state.currentSession).toBeNull();
      expect(state.collaborators).toEqual([]);
      expect(state.engine).toBeNull();
      expect(mockEngine.destroy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useCollaboration(mockOptions));

      unmount();

      expect(mockEngine.off).toHaveBeenCalledTimes(9); // All event listeners
      expect(mockEngine.destroy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle engine initialization errors', () => {
      (VB6CollaborationEngine as any).mockImplementation(() => {
        throw new Error('Engine initialization failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCollaboration(mockOptions));
      const [state] = result.current;

      expect(state.engine).toBeNull();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing engine gracefully', async () => {
      const disabledOptions = { ...mockOptions, enabled: false };
      const { result } = renderHook(() => useCollaboration(disabledOptions));
      const [, actions] = result.current;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // These should not throw errors
      await act(async () => {
        const sessionId = await actions.createSession('Test');
        expect(sessionId).toBeNull();
      });

      await act(async () => {
        const success = await actions.joinSession('session-123');
        expect(success).toBe(false);
      });

      await act(async () => {
        await actions.leaveSession();
        await actions.applyTextOperation('doc1', 'insert', 0, 'text');
        await actions.updateCursor('doc1', 0, 0);
        await actions.updateSelection('doc1', 0, 0, 1, 1);
      });

      expect(consoleSpy).toHaveBeenCalledTimes(2); // Only for create and join session
      consoleSpy.mockRestore();
    });
  });
});