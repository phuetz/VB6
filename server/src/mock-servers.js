import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Enable CORS for all servers
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
};

// Main Database Server (Port 3001)
const dbApp = express();
dbApp.use(cors(corsOptions));
dbApp.use(express.json());

dbApp.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'database', timestamp: new Date() });
});

dbApp.post('/api/ado/connection', (req, res) => {
  res.json({ 
    connectionId: 'mock-conn-' + Date.now(),
    status: 'connected',
    database: req.body.database || 'MockDB'
  });
});

dbApp.post('/api/ado/query', (req, res) => {
  res.json({
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ],
    rowCount: 2
  });
});

const dbPort = process.env.PORT || 3011;
dbApp.listen(dbPort, () => {
  console.log(`Database server running on port ${dbPort}`);
});

// Collaboration Server (Port 3002)
const collabApp = express();
const collabServer = createServer(collabApp);
const io = new Server(collabServer, {
  cors: corsOptions
});

collabApp.use(cors(corsOptions));
collabApp.use(express.json());

collabApp.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'collaboration', timestamp: new Date() });
});

io.on('connection', (socket) => {
  console.log('New collaboration client connected:', socket.id);
  
  socket.on('session:create', (data) => {
    const sessionId = 'SESSION-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    socket.join(sessionId);
    socket.emit('session:joined', {
      session: {
        id: sessionId,
        name: data.name,
        participants: [],
      },
      user: data.owner
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const collabPort = process.env.COLLAB_PORT || 3012;
collabServer.listen(collabPort, () => {
  console.log(`Collaboration server running on port ${collabPort}`);
});

// AI Server (Port 3003)
const aiApp = express();
aiApp.use(cors(corsOptions));
aiApp.use(express.json());

aiApp.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'ai', timestamp: new Date() });
});

aiApp.post('/api/ai/generate', (req, res) => {
  const { request } = req.body;
  
  // Mock AI response
  const suggestions = [];
  
  if (request.includes('button')) {
    suggestions.push({
      type: 'completion',
      title: 'Create Command Button',
      description: 'Add a button with click handler',
      code: `Private Sub Command1_Click()
    MsgBox "Button clicked!"
End Sub`,
      confidence: 0.9
    });
  }
  
  res.json({ suggestions });
});

aiApp.post('/api/ai/analyze', (req, res) => {
  res.json({
    issues: [
      {
        line: 1,
        type: 'info',
        message: 'Code analysis complete',
        suggestion: 'No issues found'
      }
    ]
  });
});

const aiPort = process.env.AI_PORT || 3013;
aiApp.listen(aiPort, () => {
  console.log(`AI server running on port ${aiPort}`);
});