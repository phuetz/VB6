import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

// Import collaboration components
import CollaborationManager from '../../components/Collaboration/CollaborationManager';
import CollaborationPanel from '../../components/Collaboration/CollaborationPanel';
import CollaborationCursors from '../../components/Collaboration/CollaborationCursors';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(
    public url: string,
    public protocols?: string | string[]
  ) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send(data: string | ArrayBuffer | Blob | ArrayBufferView) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.(new CloseEvent('close'));
    }, 0);
  }
}

global.WebSocket = MockWebSocket as any;

describe('Collaboration Features Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockCollaborationService: any;

  beforeEach(() => {
    user = userEvent.setup();
    mockCollaborationService = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendMessage: vi.fn(),
      onMessage: vi.fn(),
      getUsers: vi.fn().mockReturnValue([]),
      getCurrentUser: vi.fn().mockReturnValue({ id: '1', name: 'User1', color: '#FF0000' }),
      isConnected: vi.fn().mockReturnValue(true),
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Collaboration Manager', () => {
    it('should initialize collaboration service', async () => {
      render(<CollaborationManager service={mockCollaborationService} />);

      await waitFor(() => {
        expect(mockCollaborationService.connect).toHaveBeenCalled();
      });
    });

    it('should handle connection states', async () => {
      mockCollaborationService.isConnected.mockReturnValue(false);

      const { rerender } = render(<CollaborationManager service={mockCollaborationService} />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();

      mockCollaborationService.isConnected.mockReturnValue(true);
      rerender(<CollaborationManager service={mockCollaborationService} />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should sync form changes', async () => {
      const formChange = {
        type: 'CONTROL_MOVED',
        controlId: 'Button1',
        position: { x: 100, y: 200 },
        userId: '1',
      };

      render(<CollaborationManager service={mockCollaborationService} />);

      // Simulate form change
      fireEvent.custom(document, 'formChange', { detail: formChange });

      expect(mockCollaborationService.sendMessage).toHaveBeenCalledWith({
        type: 'FORM_CHANGE',
        data: formChange,
      });
    });

    it('should handle incoming changes from other users', async () => {
      const onFormChange = vi.fn();
      render(
        <CollaborationManager service={mockCollaborationService} onFormChange={onFormChange} />
      );

      const incomingChange = {
        type: 'FORM_CHANGE',
        data: {
          type: 'CONTROL_RESIZED',
          controlId: 'TextBox1',
          size: { width: 150, height: 25 },
          userId: '2',
        },
      };

      // Simulate incoming message
      act(() => {
        mockCollaborationService.onMessage.mock.calls[0][0](incomingChange);
      });

      expect(onFormChange).toHaveBeenCalledWith(incomingChange.data);
    });

    it('should merge concurrent changes', async () => {
      const onChange = vi.fn();
      render(<CollaborationManager service={mockCollaborationService} onChange={onChange} />);

      // Two users change the same control
      const change1 = {
        type: 'FORM_CHANGE',
        data: {
          type: 'PROPERTY_CHANGED',
          controlId: 'Button1',
          property: 'Caption',
          value: 'A',
          userId: '1',
          timestamp: 1000,
        },
      };

      const change2 = {
        type: 'FORM_CHANGE',
        data: {
          type: 'PROPERTY_CHANGED',
          controlId: 'Button1',
          property: 'Caption',
          value: 'B',
          userId: '2',
          timestamp: 1001,
        },
      };

      act(() => {
        mockCollaborationService.onMessage.mock.calls[0][0](change1);
        mockCollaborationService.onMessage.mock.calls[0][0](change2);
      });

      // Should apply the later change
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'B' }));
    });

    it('should handle conflict resolution', async () => {
      const onConflict = vi.fn();
      render(<CollaborationManager service={mockCollaborationService} onConflict={onConflict} />);

      const conflictingChanges = [
        {
          type: 'PROPERTY_CHANGED',
          controlId: 'Button1',
          property: 'Left',
          value: 100,
          userId: '1',
          timestamp: 1000,
        },
        {
          type: 'PROPERTY_CHANGED',
          controlId: 'Button1',
          property: 'Left',
          value: 200,
          userId: '2',
          timestamp: 1000,
        },
      ];

      act(() => {
        conflictingChanges.forEach(change => {
          mockCollaborationService.onMessage.mock.calls[0][0]({
            type: 'FORM_CHANGE',
            data: change,
          });
        });
      });

      expect(onConflict).toHaveBeenCalledWith(
        expect.objectContaining({
          controlId: 'Button1',
          conflicts: conflictingChanges,
        })
      );
    });

    it('should maintain operation history', async () => {
      render(<CollaborationManager service={mockCollaborationService} />);

      const operations = [
        { type: 'CONTROL_ADDED', controlId: 'Button1', userId: '1' },
        { type: 'CONTROL_MOVED', controlId: 'Button1', position: { x: 50, y: 50 }, userId: '2' },
        {
          type: 'PROPERTY_CHANGED',
          controlId: 'Button1',
          property: 'Caption',
          value: 'Test',
          userId: '1',
        },
      ];

      operations.forEach(op => {
        act(() => {
          mockCollaborationService.onMessage.mock.calls[0][0]({ type: 'FORM_CHANGE', data: op });
        });
      });

      const historyButton = screen.getByTestId('collaboration-history');
      await user.click(historyButton);

      expect(screen.getByText('Collaboration History')).toBeInTheDocument();
      expect(screen.getByText('Button1 added by User1')).toBeInTheDocument();
    });
  });

  describe('Collaboration Panel', () => {
    const mockUsers = [
      { id: '1', name: 'Alice', color: '#FF0000', status: 'active' },
      { id: '2', name: 'Bob', color: '#00FF00', status: 'editing' },
      { id: '3', name: 'Charlie', color: '#0000FF', status: 'idle' },
    ];

    it('should display active users', () => {
      render(<CollaborationPanel users={mockUsers} currentUser={mockUsers[0]} />);

      expect(screen.getByText('Active Users (3)')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('should show user status indicators', () => {
      render(<CollaborationPanel users={mockUsers} currentUser={mockUsers[0]} />);

      const bobAvatar = screen.getByTestId('user-avatar-2');
      expect(bobAvatar).toHaveClass('status-editing');

      const charlieAvatar = screen.getByTestId('user-avatar-3');
      expect(charlieAvatar).toHaveClass('status-idle');
    });

    it('should handle user interactions', async () => {
      const onUserClick = vi.fn();
      render(
        <CollaborationPanel
          users={mockUsers}
          currentUser={mockUsers[0]}
          onUserClick={onUserClick}
        />
      );

      const bobAvatar = screen.getByTestId('user-avatar-2');
      await user.click(bobAvatar);

      expect(onUserClick).toHaveBeenCalledWith(mockUsers[1]);
    });

    it('should show user permissions', async () => {
      const usersWithPermissions = mockUsers.map(u => ({
        ...u,
        permissions: u.id === '1' ? ['edit', 'delete', 'admin'] : ['edit'],
      }));

      render(
        <CollaborationPanel users={usersWithPermissions} currentUser={usersWithPermissions[0]} />
      );

      const aliceAvatar = screen.getByTestId('user-avatar-1');
      await user.hover(aliceAvatar);

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });
    });

    it('should support user chat', async () => {
      const onSendMessage = vi.fn();
      render(
        <CollaborationPanel
          users={mockUsers}
          currentUser={mockUsers[0]}
          showChat={true}
          onSendMessage={onSendMessage}
        />
      );

      const chatInput = screen.getByPlaceholderText('Type a message...');
      await user.type(chatInput, 'Hello everyone!');
      await user.keyboard('{Enter}');

      expect(onSendMessage).toHaveBeenCalledWith('Hello everyone!');
      expect(chatInput).toHaveValue('');
    });

    it('should display chat messages', () => {
      const messages = [
        { id: '1', userId: '1', text: 'Working on the login form', timestamp: Date.now() - 60000 },
        { id: '2', userId: '2', text: "I'll handle the validation", timestamp: Date.now() - 30000 },
      ];

      render(
        <CollaborationPanel
          users={mockUsers}
          currentUser={mockUsers[0]}
          messages={messages}
          showChat={true}
        />
      );

      expect(screen.getByText('Working on the login form')).toBeInTheDocument();
      expect(screen.getByText("I'll handle the validation")).toBeInTheDocument();
    });

    it('should handle user invitations', async () => {
      const onInviteUser = vi.fn();
      render(
        <CollaborationPanel
          users={mockUsers}
          currentUser={mockUsers[0]}
          onInviteUser={onInviteUser}
        />
      );

      const inviteButton = screen.getByTestId('invite-user');
      await user.click(inviteButton);

      const emailInput = screen.getByPlaceholderText('Enter email address');
      await user.type(emailInput, 'new@example.com');

      const sendButton = screen.getByText('Send Invitation');
      await user.click(sendButton);

      expect(onInviteUser).toHaveBeenCalledWith('new@example.com');
    });

    it('should show typing indicators', async () => {
      const typingUsers = [{ userId: '2', timestamp: Date.now() }];

      render(
        <CollaborationPanel
          users={mockUsers}
          currentUser={mockUsers[0]}
          typingUsers={typingUsers}
          showChat={true}
        />
      );

      expect(screen.getByText('Bob is typing...')).toBeInTheDocument();
    });
  });

  describe('Collaboration Cursors', () => {
    const mockCursors = [
      { userId: '2', position: { x: 100, y: 200 }, userName: 'Bob', color: '#00FF00' },
      { userId: '3', position: { x: 300, y: 150 }, userName: 'Charlie', color: '#0000FF' },
    ];

    it("should render other users' cursors", () => {
      render(<CollaborationCursors cursors={mockCursors} />);

      const bobCursor = screen.getByTestId('cursor-2');
      const charlieCursor = screen.getByTestId('cursor-3');

      expect(bobCursor).toBeInTheDocument();
      expect(charlieCursor).toBeInTheDocument();

      expect(bobCursor).toHaveStyle({
        left: '100px',
        top: '200px',
        borderColor: '#00FF00',
      });
    });

    it('should show user names on cursors', async () => {
      render(<CollaborationCursors cursors={mockCursors} showNames={true} />);

      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('should animate cursor movements', async () => {
      const { rerender } = render(<CollaborationCursors cursors={mockCursors} />);

      const updatedCursors = [{ ...mockCursors[0], position: { x: 150, y: 250 } }, mockCursors[1]];

      rerender(<CollaborationCursors cursors={updatedCursors} />);

      const bobCursor = screen.getByTestId('cursor-2');
      expect(bobCursor).toHaveClass('cursor-animating');
    });

    it('should handle cursor selections', () => {
      const cursorsWithSelection = [
        {
          ...mockCursors[0],
          selection: { controlId: 'Button1', bounds: { x: 100, y: 200, width: 80, height: 25 } },
        },
      ];

      render(<CollaborationCursors cursors={cursorsWithSelection} />);

      const selectionBox = screen.getByTestId('selection-2');
      expect(selectionBox).toHaveStyle({
        left: '100px',
        top: '200px',
        width: '80px',
        height: '25px',
        borderColor: '#00FF00',
      });
    });

    it('should show cursor activity indicators', () => {
      const cursorsWithActivity = [
        { ...mockCursors[0], activity: 'typing' },
        { ...mockCursors[1], activity: 'selecting' },
      ];

      render(<CollaborationCursors cursors={cursorsWithActivity} />);

      const bobCursor = screen.getByTestId('cursor-2');
      const charlieCursor = screen.getByTestId('cursor-3');

      expect(bobCursor).toHaveClass('activity-typing');
      expect(charlieCursor).toHaveClass('activity-selecting');
    });

    it('should fade out inactive cursors', async () => {
      const cursorsWithTimestamps = mockCursors.map(c => ({
        ...c,
        lastActivity: Date.now() - 30000, // 30 seconds ago
      }));

      render(<CollaborationCursors cursors={cursorsWithTimestamps} inactivityTimeout={10000} />);

      const bobCursor = screen.getByTestId('cursor-2');
      expect(bobCursor).toHaveClass('cursor-inactive');
    });
  });

  describe('Real-time Synchronization', () => {
    it('should sync control property changes', async () => {
      const onPropertyChange = vi.fn();
      render(
        <CollaborationManager
          service={mockCollaborationService}
          onPropertyChange={onPropertyChange}
        />
      );

      // Simulate property change from another user
      const change = {
        type: 'PROPERTY_CHANGED',
        controlId: 'Button1',
        property: 'Caption',
        value: 'Updated Caption',
        userId: '2',
      };

      act(() => {
        mockCollaborationService.onMessage.mock.calls[0][0]({ type: 'FORM_CHANGE', data: change });
      });

      expect(onPropertyChange).toHaveBeenCalledWith('Button1', 'Caption', 'Updated Caption');
    });

    it('should sync control additions', async () => {
      const onControlAdd = vi.fn();
      render(
        <CollaborationManager service={mockCollaborationService} onControlAdd={onControlAdd} />
      );

      const newControl = {
        type: 'CONTROL_ADDED',
        control: {
          id: 'NewButton',
          type: 'CommandButton',
          properties: { Caption: 'New Button', Left: 100, Top: 200 },
        },
        userId: '2',
      };

      act(() => {
        mockCollaborationService.onMessage.mock.calls[0][0]({
          type: 'FORM_CHANGE',
          data: newControl,
        });
      });

      expect(onControlAdd).toHaveBeenCalledWith(newControl.control);
    });

    it('should sync control deletions', async () => {
      const onControlDelete = vi.fn();
      render(
        <CollaborationManager
          service={mockCollaborationService}
          onControlDelete={onControlDelete}
        />
      );

      const deletion = {
        type: 'CONTROL_DELETED',
        controlId: 'Button1',
        userId: '2',
      };

      act(() => {
        mockCollaborationService.onMessage.mock.calls[0][0]({
          type: 'FORM_CHANGE',
          data: deletion,
        });
      });

      expect(onControlDelete).toHaveBeenCalledWith('Button1');
    });

    it('should handle form structure changes', async () => {
      const onStructureChange = vi.fn();
      render(
        <CollaborationManager
          service={mockCollaborationService}
          onStructureChange={onStructureChange}
        />
      );

      const structureChange = {
        type: 'FORM_STRUCTURE_CHANGED',
        changes: [
          { type: 'TAB_ORDER_CHANGED', newOrder: ['Button1', 'TextBox1', 'Button2'] },
          { type: 'LAYER_ORDER_CHANGED', controlId: 'Button1', newIndex: 2 },
        ],
        userId: '2',
      };

      act(() => {
        mockCollaborationService.onMessage.mock.calls[0][0]({
          type: 'FORM_CHANGE',
          data: structureChange,
        });
      });

      expect(onStructureChange).toHaveBeenCalledWith(structureChange.changes);
    });
  });

  describe('Collaboration Analytics', () => {
    it('should track user activity', async () => {
      render(<CollaborationManager service={mockCollaborationService} trackAnalytics={true} />);

      // Simulate various user activities
      const activities = [
        { type: 'CONTROL_SELECTED', controlId: 'Button1', userId: '2' },
        { type: 'PROPERTY_VIEWED', property: 'Caption', userId: '2' },
        { type: 'FORM_SAVED', userId: '2' },
      ];

      activities.forEach(activity => {
        act(() => {
          mockCollaborationService.onMessage.mock.calls[0][0]({
            type: 'USER_ACTIVITY',
            data: activity,
          });
        });
      });

      const analyticsButton = screen.getByTestId('collaboration-analytics');
      await user.click(analyticsButton);

      expect(screen.getByText('Collaboration Analytics')).toBeInTheDocument();
      expect(screen.getByText('Total Activities: 3')).toBeInTheDocument();
    });

    it('should show productivity metrics', async () => {
      const metrics = {
        totalChanges: 45,
        activeTime: 120, // minutes
        collaborationScore: 85,
        conflictResolutions: 3,
      };

      render(<CollaborationManager service={mockCollaborationService} metrics={metrics} />);

      const metricsButton = screen.getByTestId('collaboration-metrics');
      await user.click(metricsButton);

      expect(screen.getByText('45 changes made')).toBeInTheDocument();
      expect(screen.getByText('2h active')).toBeInTheDocument();
      expect(screen.getByText('85% collaboration score')).toBeInTheDocument();
    });

    it('should generate activity reports', async () => {
      render(<CollaborationManager service={mockCollaborationService} />);

      const reportButton = screen.getByTestId('generate-report');
      await user.click(reportButton);

      expect(screen.getByText('Activity Report')).toBeInTheDocument();
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });
  });

  describe('Offline Synchronization', () => {
    it('should queue changes when offline', async () => {
      mockCollaborationService.isConnected.mockReturnValue(false);

      render(<CollaborationManager service={mockCollaborationService} />);

      const change = {
        type: 'PROPERTY_CHANGED',
        controlId: 'Button1',
        property: 'Caption',
        value: 'Offline Change',
      };

      // Simulate form change while offline
      fireEvent.custom(document, 'formChange', { detail: change });

      // Should not send immediately
      expect(mockCollaborationService.sendMessage).not.toHaveBeenCalled();

      // Simulate reconnection
      mockCollaborationService.isConnected.mockReturnValue(true);
      fireEvent.custom(document, 'connectionRestored');

      // Should send queued changes
      expect(mockCollaborationService.sendMessage).toHaveBeenCalledWith({
        type: 'FORM_CHANGE',
        data: change,
      });
    });

    it('should show offline indicator', () => {
      mockCollaborationService.isConnected.mockReturnValue(false);

      render(<CollaborationManager service={mockCollaborationService} />);

      expect(screen.getByText('Offline - Changes queued')).toBeInTheDocument();
      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    });

    it('should handle sync conflicts after reconnection', async () => {
      const onConflictResolution = vi.fn();
      render(
        <CollaborationManager
          service={mockCollaborationService}
          onConflictResolution={onConflictResolution}
        />
      );

      // Simulate conflict after reconnection
      const conflicts = [
        {
          controlId: 'Button1',
          property: 'Caption',
          localValue: 'Local Change',
          remoteValue: 'Remote Change',
          timestamp: Date.now(),
        },
      ];

      act(() => {
        mockCollaborationService.onMessage.mock.calls[0][0]({
          type: 'SYNC_CONFLICTS',
          data: { conflicts },
        });
      });

      expect(screen.getByText('Sync Conflicts Detected')).toBeInTheDocument();

      const resolveButton = screen.getByText('Keep Local');
      await user.click(resolveButton);

      expect(onConflictResolution).toHaveBeenCalledWith(conflicts[0], 'local');
    });
  });

  describe('Access Control', () => {
    it('should enforce user permissions', async () => {
      const restrictedUser = { id: '3', name: 'ReadOnly', permissions: ['read'] };

      render(
        <CollaborationManager service={mockCollaborationService} currentUser={restrictedUser} />
      );

      // Try to make a change
      const change = { type: 'PROPERTY_CHANGED', controlId: 'Button1' };
      fireEvent.custom(document, 'formChange', { detail: change });

      // Should show permission error
      expect(screen.getByText('Insufficient permissions')).toBeInTheDocument();
      expect(mockCollaborationService.sendMessage).not.toHaveBeenCalled();
    });

    it('should support role-based restrictions', () => {
      const roles = {
        admin: ['read', 'write', 'delete', 'manage'],
        editor: ['read', 'write'],
        viewer: ['read'],
      };

      render(
        <CollaborationManager
          service={mockCollaborationService}
          roles={roles}
          currentUserRole="editor"
        />
      );

      // Should not show admin-only features
      expect(screen.queryByTestId('manage-users')).not.toBeInTheDocument();
      expect(screen.queryByTestId('project-settings')).not.toBeInTheDocument();
    });

    it('should handle permission changes', async () => {
      render(<CollaborationManager service={mockCollaborationService} />);

      const permissionChange = {
        type: 'PERMISSIONS_CHANGED',
        userId: '1',
        newPermissions: ['read'], // Downgraded
        changedBy: 'admin',
      };

      act(() => {
        mockCollaborationService.onMessage.mock.calls[0][0]({
          type: 'SYSTEM_MESSAGE',
          data: permissionChange,
        });
      });

      expect(screen.getByText('Your permissions have been updated')).toBeInTheDocument();
    });
  });
});
