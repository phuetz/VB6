/**
 * Collaboration Server
 * WebSocket server for real-time collaboration features
 */

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

// Types
interface User {
  id: string;
  socketId: string;
  name: string;
  email: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number; file: string };
  status: 'online' | 'away' | 'busy';
  activeFile?: string;
}

interface Session {
  id: string;
  name: string;
  owner: User;
  participants: Map<string, User>;
  createdAt: Date;
  projectId: string;
  projectData: any;
  changes: Change[];
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

// Initialize server
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with Redis for production)
const sessions = new Map<string, Session>();
const users = new Map<string, User>();
const socketToUser = new Map<string, string>();
const comments = new Map<string, Comment[]>();

// User colors
const userColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#48C9B0', '#F368E0', '#00D2D3', '#6C5CE7', '#FDA7DF',
];

// Socket handlers
io.on('connection', (socket: Socket) => {
  console.log('New client connected:', socket.id);

  // Handle user authentication
  socket.on('auth:login', (data: { name: string; email: string }) => {
    const user: User = {
      id: uuidv4(),
      socketId: socket.id,
      name: data.name,
      email: data.email,
      color: userColors[Math.floor(Math.random() * userColors.length)],
      status: 'online',
    };

    users.set(user.id, user);
    socketToUser.set(socket.id, user.id);

    socket.emit('auth:success', { user });
  });

  // Handle session creation
  socket.on('session:create', (data: { name: string; projectId: string; owner: User }) => {
    const session: Session = {
      id: uuidv4().substring(0, 8).toUpperCase(),
      name: data.name,
      owner: data.owner,
      participants: new Map([[data.owner.id, data.owner]]),
      createdAt: new Date(),
      projectId: data.projectId,
      projectData: {},
      changes: [],
    };

    sessions.set(session.id, session);
    socket.join(session.id);

    socket.emit('session:joined', {
      session: {
        ...session,
        participants: Array.from(session.participants.values()),
      },
      user: data.owner,
    });
  });

  // Handle session join
  socket.on('session:join', (data: { sessionId: string; user: User }) => {
    const session = sessions.get(data.sessionId);
    if (!session) {
      socket.emit('session:error', { message: 'Session not found' });
      return;
    }

    // Add user to session
    session.participants.set(data.user.id, data.user);
    socket.join(data.sessionId);

    // Notify all participants
    io.to(data.sessionId).emit('user:joined', data.user);

    // Send session data to new user
    socket.emit('session:joined', {
      session: {
        ...session,
        participants: Array.from(session.participants.values()),
      },
      user: data.user,
    });

    // Send current state to new user
    socket.emit('session:sync', {
      projectData: session.projectData,
      changes: session.changes.slice(-100), // Last 100 changes
      comments: comments.get(data.sessionId) || [],
    });
  });

  // Handle session leave
  socket.on('session:leave', (data: { sessionId: string }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    const session = sessions.get(data.sessionId);
    if (!session) return;

    session.participants.delete(userId);
    socket.leave(data.sessionId);

    // Notify other participants
    io.to(data.sessionId).emit('user:left', userId);
  });

  // Handle cursor movement
  socket.on('cursor:move', (data: { sessionId: string; cursor: { x: number; y: number } }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    socket.to(data.sessionId).emit('cursor:update', {
      userId,
      cursor: data.cursor,
    });
  });

  // Handle selection change
  socket.on('selection:change', (data: { sessionId: string; selection: any }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    socket.to(data.sessionId).emit('selection:update', {
      userId,
      selection: data.selection,
    });
  });

  // Handle code changes
  socket.on('code:change', (data: { sessionId: string; change: Change }) => {
    const session = sessions.get(data.sessionId);
    if (!session) return;

    // Store change
    session.changes.push(data.change);

    // Broadcast to other participants
    socket.to(data.sessionId).emit('code:change', data.change);
  });

  // Handle control changes
  socket.on('control:change', (data: { sessionId: string; controlId: string; updates: any; userId: string }) => {
    socket.to(data.sessionId).emit('control:change', data);
  });

  // Handle typing indicators
  socket.on('typing:start', (data: { sessionId: string }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    socket.to(data.sessionId).emit('typing:start', userId);
  });

  socket.on('typing:stop', (data: { sessionId: string }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    socket.to(data.sessionId).emit('typing:stop', userId);
  });

  // Handle comments
  socket.on('comment:add', (data: { sessionId: string; comment: Comment }) => {
    const sessionComments = comments.get(data.sessionId) || [];
    sessionComments.push(data.comment);
    comments.set(data.sessionId, sessionComments);

    io.to(data.sessionId).emit('comment:added', data.comment);
  });

  socket.on('comment:resolve', (data: { sessionId: string; commentId: string }) => {
    const sessionComments = comments.get(data.sessionId);
    if (!sessionComments) return;

    const comment = sessionComments.find(c => c.id === data.commentId);
    if (comment) {
      comment.resolved = true;
      io.to(data.sessionId).emit('comment:resolved', data.commentId);
    }
  });

  socket.on('comment:reply', (data: { sessionId: string; commentId: string; reply: Comment }) => {
    const sessionComments = comments.get(data.sessionId);
    if (!sessionComments) return;

    const comment = sessionComments.find(c => c.id === data.commentId);
    if (comment) {
      comment.replies.push(data.reply);
      io.to(data.sessionId).emit('comment:replied', { commentId: data.commentId, reply: data.reply });
    }
  });

  // Handle invitations
  socket.on('session:invite', (data: { sessionId: string; email: string; invitedBy: User }) => {
    // In a real implementation, send email invitation
    console.log(`Invitation sent to ${data.email} for session ${data.sessionId}`);
    
    socket.emit('session:invited', {
      email: data.email,
      sessionId: data.sessionId,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    const userId = socketToUser.get(socket.id);
    if (userId) {
      // Remove user from all sessions
      sessions.forEach((session, sessionId) => {
        if (session.participants.has(userId)) {
          session.participants.delete(userId);
          io.to(sessionId).emit('user:left', userId);
        }
      });

      users.delete(userId);
      socketToUser.delete(socket.id);
    }
  });
});

// REST API endpoints for session management
app.get('/api/sessions', (req, res) => {
  const sessionList = Array.from(sessions.values()).map(session => ({
    id: session.id,
    name: session.name,
    owner: session.owner.name,
    participantCount: session.participants.size,
    createdAt: session.createdAt,
  }));

  res.json({ sessions: sessionList });
});

app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    ...session,
    participants: Array.from(session.participants.values()),
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    sessions: sessions.size,
    users: users.size,
    uptime: process.uptime(),
  });
});

// Start server
const PORT = process.env.COLLAB_PORT || 3002;
server.listen(PORT, () => {
  console.log(`Collaboration server running on port ${PORT}`);
});

export { server, io };