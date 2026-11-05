import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server } from 'socket.io';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { roomsRouter } from './routes/rooms.js';
import { statsRouter } from './routes/stats.js';
import { setupSocketHandler } from './socket/socketHandler.js';
import { roomManager } from './services/RoomManager.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/stats', statsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve frontend static files if built (for unified single-service deployment)
const frontendDistCandidates = [
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'packages/frontend/dist'),
  path.resolve(process.cwd(), 'dist/public'),
];

const staticDir = frontendDistCandidates.find(dir => fs.existsSync(dir));
if (staticDir) {
  console.log(`📦 Serving production frontend from: ${staticDir}`);
  app.use(express.static(staticDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

setupSocketHandler(io);

// Seed a default luxury showcase table
roomManager.createRoom('Emerald Lounge (High Stakes)', 'system', {
  startingChips: 2000,
  smallBlind: 10,
  bigBlind: 20,
  turnTimerSeconds: 30,
  maxPlayers: 8,
  autoStart: true,
});

server.listen(PORT, () => {
  console.log(`♠️ Texas Hold'em Poker Backend running on http://localhost:${PORT}`);
});

