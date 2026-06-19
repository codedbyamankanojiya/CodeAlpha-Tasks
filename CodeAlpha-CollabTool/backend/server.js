require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const socketHandler = require('./socket/socketHandler');

// ─── Route Imports ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const listRoutes = require('./routes/listRoutes');
const cardRoutes = require('./routes/cardRoutes');
const fileRoutes = require('./routes/fileRoutes');
const whiteboardRoutes = require('./routes/whiteboardRoutes');

// ─── App & Server Initialization ────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io Initialization ───────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (Development) ────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'CollabTool API is running', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api', fileRoutes);
app.use('/api/boards', whiteboardRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── WebSocket Handler ───────────────────────────────────────────────────────
socketHandler(io);

// ─── Ensure Uploads Directory Exists ─────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('[Server] 📁 Created uploads directory');
}

// ─── MongoDB Connection & Server Start ──────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[MongoDB] ✅ Connected to database');
    httpServer.listen(PORT, () => {
      console.log(`[Server] 🚀 CollabTool API running on http://localhost:${PORT}`);
      console.log(`[Socket.io] 🔌 WebSocket server initialized`);
    });
  })
  .catch((err) => {
    console.error('[MongoDB] ❌ Connection failed:', err.message);
    process.exit(1);
  });

module.exports = { app, io };
