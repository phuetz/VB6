/**
 * Real-time Collaboration Manager
 * Multi-user editing, presence awareness, and live cursors
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { useVB6Store } from '../../stores/vb6Store';
import { eventSystem } from '../../services/VB6EventSystem';
import { useAuth } from '../../hooks/useAuth';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number; file: string };
  status: 'online' | 'away' | 'busy';
  activeFile?: string;
  isTyping?: boolean;
}

interface CollaborationSession {
  id: string;
  name: string;
  owner: User;
  participants: User[];
  createdAt: Date;
  projectId: string;
  activeUsers: number;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
  };
}

interface Change {
  id: string;
  userId: string;
  timestamp: Date;
  type: 'insert' | 'delete' | 'format' | 'control';
  file: string;
  position?: number;
  content?: string;
  length?: number;
  controlData?: any;
}

interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
  file: string;
  line: number;
  resolved: boolean;
  replies: Comment[];
}

export const CollaborationManager: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [typing, setTyping] = useState<Map<string, boolean>>(new Map());
  
  const { currentCode, updateCode, controls, updateControl } = useVB6Store();
  const { user: authUser, requireAuth } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // User colors for cursors and selections
  const userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#48C9B0', '#F368E0', '#00D2D3', '#6C5CE7', '#FDA7DF',
  ];

  // Define callbacks before useEffect
  const getUserById = useCallback((userId: string): User | undefined => {
    return users.get(userId);
  }, [users]);

  const showNotification = useCallback((message: string) => {
    eventSystem.fire('Collaboration', 'Notification', { message });
  }, []);

  const handleRemoteCodeChange = useCallback((change: Change) => {
    // Apply remote change to local code
    if (change.userId === currentUser?.id) return; // Skip own changes

    const { updateCode } = useVB6Store.getState();
    
    switch (change.type) {
      case 'insert':
        if (change.position !== undefined && change.content) {
          const before = currentCode.slice(0, change.position);
          const after = currentCode.slice(change.position);
          updateCode(before + change.content + after);
        }
        break;
      case 'delete':
        if (change.position !== undefined && change.length) {
          const before = currentCode.slice(0, change.position);
          const after = currentCode.slice(change.position + change.length);
          updateCode(before + after);
        }
        break;
    }
  }, [currentUser?.id, currentCode]);

  const handleRemoteControlChange = useCallback((data: any) => {
    if (data.userId === currentUser?.id) return;
    
    const { updateControl } = useVB6Store.getState();
    updateControl(data.controlId, data.updates);
  }, [currentUser?.id]);

  // Initialize collaboration
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_COLLAB_SERVER || 'http://localhost:3012', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to collaboration server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setIsConnected(false);
    });

    newSocket.on('session:joined', (data: { session: CollaborationSession; user: User }) => {
      setSession(data.session);
      setCurrentUser(data.user);
      eventSystem.fire('Collaboration', 'SessionJoined', data);
    });

    newSocket.on('user:joined', (user: User) => {
      setUsers(prev => new Map(prev).set(user.id, user));
      showNotification(`${user.name} joined the session`);
    });

    newSocket.on('user:left', (userId: string) => {
      setUsers(prev => {
        const next = new Map(prev);
        const user = next.get(userId);
        if (user) {
          showNotification(`${user.name} left the session`);
        }
        next.delete(userId);
        return next;
      });
    });

    newSocket.on('cursor:update', (data: { userId: string; cursor: { x: number; y: number } }) => {
      setUsers(prev => {
        const next = new Map(prev);
        const user = next.get(data.userId);
        if (user) {
          user.cursor = data.cursor;
          next.set(data.userId, user);
        }
        return next;
      });
    });

    newSocket.on('selection:update', (data: { userId: string; selection: any }) => {
      setUsers(prev => {
        const next = new Map(prev);
        const user = next.get(data.userId);
        if (user) {
          user.selection = data.selection;
          next.set(data.userId, user);
        }
        return next;
      });
    });

    newSocket.on('code:change', (change: Change) => {
      handleRemoteCodeChange(change);
      setChanges(prev => [...prev, change]);
    });

    newSocket.on('control:change', (data: any) => {
      handleRemoteControlChange(data);
    });

    newSocket.on('comment:added', (comment: Comment) => {
      setComments(prev => [...prev, comment]);
      showNotification(`New comment from ${getUserById(comment.userId)?.name}`);
    });

    newSocket.on('typing:start', (userId: string) => {
      setTyping(prev => new Map(prev).set(userId, true));
    });

    newSocket.on('typing:stop', (userId: string) => {
      setTyping(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [handleRemoteCodeChange, handleRemoteControlChange, getUserById, showNotification]);

  const createSession = async (name: string, projectId: string) => {
    if (!requireAuth('collaboration_full')) return;
    if (!socket || !authUser) return;

    const user: User = {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      color: userColors[Math.floor(Math.random() * userColors.length)],
      status: 'online',
    };

    setCurrentUser(user);

    socket.emit('session:create', {
      name,
      projectId,
      owner: user,
    });
  };

  const joinSession = async (sessionId: string) => {
    if (!socket || !currentUser) return;

    socket.emit('session:join', {
      sessionId,
      user: currentUser,
    });
  };

  const leaveSession = () => {
    if (!socket || !session) return;

    socket.emit('session:leave', {
      sessionId: session.id,
    });

    setSession(null);
    setUsers(new Map());
  };

  const inviteUser = (email: string) => {
    if (!socket || !session) return;

    socket.emit('session:invite', {
      sessionId: session.id,
      email,
      invitedBy: currentUser,
    });

    showNotification(`Invitation sent to ${email}`);
    setInviteEmail('');
    setShowInviteDialog(false);
  };

  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!socket || !session || !currentUser) return;

    socket.emit('cursor:move', {
      sessionId: session.id,
      cursor: { x, y },
    });
  }, [socket, session, currentUser]);

  const broadcastSelection = useCallback((selection: any) => {
    if (!socket || !session || !currentUser) return;

    socket.emit('selection:change', {
      sessionId: session.id,
      selection,
    });
  }, [socket, session, currentUser]);

  const broadcastCodeChange = useCallback((change: Omit<Change, 'id' | 'userId' | 'timestamp'>) => {
    if (!socket || !session || !currentUser) return;

    const fullChange: Change = {
      ...change,
      id: `change_${Date.now()}`,
      userId: currentUser.id,
      timestamp: new Date(),
    };

    socket.emit('code:change', {
      sessionId: session.id,
      change: fullChange,
    });
  }, [socket, session, currentUser]);

  const broadcastTyping = useCallback((isTyping: boolean) => {
    if (!socket || !session || !currentUser) return;

    socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      sessionId: session.id,
    });
  }, [socket, session, currentUser]);

  const addComment = (text: string, file: string, line: number) => {
    if (!socket || !session || !currentUser) return;

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      userId: currentUser.id,
      text,
      timestamp: new Date(),
      file,
      line,
      resolved: false,
      replies: [],
    };

    socket.emit('comment:add', {
      sessionId: session.id,
      comment,
    });
  };

  // Handle local typing
  useEffect(() => {
    const handleKeyPress = () => {
      if (!session) return;

      broadcastTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping(false);
      }, 1000);
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [session, broadcastTyping]);

  // Render user cursors
  const renderCursors = () => {
    return Array.from(users.values())
      .filter(user => user.id !== currentUser?.id && user.cursor)
      .map(user => (
        <motion.div
          key={user.id}
          className="absolute pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            x: user.cursor!.x,
            y: user.cursor!.y,
          }}
          transition={{ type: 'spring', damping: 30 }}
        >
          <div
            className="w-4 h-4 transform -rotate-45 origin-top-left"
            style={{ backgroundColor: user.color }}
          />
          <div
            className="ml-4 -mt-2 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
            style={{ backgroundColor: user.color }}
          >
            {user.name}
          </div>
        </motion.div>
      ));
  };

  return (
    <>
      {/* Collaboration Status Bar */}
      <div className="fixed top-16 right-4 z-40">
        <motion.button
          className="bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-2 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPanel(!showPanel)}
        >
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium">
            {session ? `${users.size + 1} users` : 'Start Collaboration'}
          </span>
        </motion.button>
      </div>

      {/* User Cursors */}
      {session && renderCursors()}

      {/* Collaboration Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-24 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b dark:border-gray-800">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Collaboration</h3>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {!session ? (
              // Start or Join Session
              <div className="flex-1 p-4">
                <div className="space-y-4">
                  <button
                    onClick={() => createSession('New Session', 'project-1')}
                    className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Start New Session
                  </button>
                  
                  <div className="text-center text-gray-500">or</div>
                  
                  <input
                    type="text"
                    placeholder="Enter session ID"
                    className="w-full p-3 border dark:border-gray-700 rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        joinSession(e.currentTarget.value);
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              // Active Session
              <div className="flex-1 flex flex-col">
                {/* Session Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800">
                  <h4 className="font-semibold">{session.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Session ID: {session.id}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setShowInviteDialog(true)}
                      className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Invite
                    </button>
                    <button
                      onClick={leaveSession}
                      className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Leave
                    </button>
                  </div>
                </div>

                {/* Users */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <h5 className="font-semibold mb-3">Active Users</h5>
                    <div className="space-y-2">
                      {/* Current User */}
                      {currentUser && (
                        <UserCard user={currentUser} isCurrentUser={true} />
                      )}
                      
                      {/* Other Users */}
                      {Array.from(users.values()).map(user => (
                        <UserCard 
                          key={user.id} 
                          user={user} 
                          isTyping={typing.get(user.id) || false}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="p-4 border-t dark:border-gray-800">
                    <h5 className="font-semibold mb-3">Recent Activity</h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {changes.slice(-5).reverse().map(change => (
                        <div key={change.id} className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">
                            {getUserById(change.userId)?.name || 'Unknown'}
                          </span>
                          {' '}
                          {change.type === 'insert' ? 'added' : 'removed'} text
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(change.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Dialog */}
      <AnimatePresence>
        {showInviteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowInviteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Invite to Session</h3>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full p-3 border dark:border-gray-700 rounded-lg mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowInviteDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => inviteUser(inviteEmail)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// User Card Component
const UserCard: React.FC<{ user: User; isCurrentUser?: boolean; isTyping?: boolean }> = ({ 
  user, 
  isCurrentUser = false,
  isTyping = false 
}) => {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
        style={{ backgroundColor: user.color }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {user.name} {isCurrentUser && '(You)'}
          </span>
          {isTyping && (
            <span className="text-xs text-gray-500 italic">typing...</span>
          )}
        </div>
        {user.activeFile && (
          <p className="text-xs text-gray-500">Editing: {user.activeFile}</p>
        )}
      </div>
      <div className={`w-2 h-2 rounded-full ${
        user.status === 'online' ? 'bg-green-500' :
        user.status === 'away' ? 'bg-yellow-500' :
        'bg-red-500'
      }`} />
    </div>
  );
};

export default CollaborationManager;