// Load environment variables from .env file
import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';

// Import route handlers for different API endpoints
import userRoutes from './routes/users';
import pollRoutes from './routes/polls';
import voteRoutes from './routes/votes';
import { errorHandler } from './middleware/errorHandler';

// Initialize Express application
const app = express();
// Create HTTP server instance
const server = http.createServer(app);
// Initialize Socket.IO server for real-time communication
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Enable CORS for all routes to allow cross-origin requests
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// Attach Socket.IO instance to app locals for use in route handlers
// This allows controllers to emit real-time updates to connected clients
app.locals.io = io;

// Health check endpoint to verify server is running
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Mount API route handlers
app.use('/api/users', userRoutes);    // User management endpoints
app.use('/api/polls', pollRoutes);    // Poll creation and retrieval endpoints
app.use('/api/votes', voteRoutes);    // Voting endpoints

// Track active connections
let activeConnections = 0;

// Socket.IO event handlers for real-time poll updates and presence
io.on('connection', socket => {
  activeConnections += 1;
  io.emit('active_users', { count: activeConnections });
  // Allow clients to join a specific poll room for real-time updates
  socket.on('join_poll', (pollId: string) => {
    socket.join(`poll:${pollId}`);
  });
  // Allow clients to leave a poll room
  socket.on('leave_poll', (pollId: string) => {
    socket.leave(`poll:${pollId}`);
  });
  socket.on('disconnect', () => {
    activeConnections = Math.max(0, activeConnections - 1);
    io.emit('active_users', { count: activeConnections });
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});


