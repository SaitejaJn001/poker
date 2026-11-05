import { Router, Request, Response } from 'express';
import { roomManager } from '../services/RoomManager.js';
import { AuthService } from '../services/AuthService.js';
import { db } from '../database/db.js';

export const roomsRouter = Router();

roomsRouter.get('/', (_req: Request, res: Response) => {
  const rooms = roomManager.getAllActiveRooms();
  res.json({ rooms });
});

roomsRouter.post('/', (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return Promise.resolve();
  }

  const token = authHeader.split(' ')[1];
  const payload = AuthService.verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' });
    return Promise.resolve();
  }

  const { name, maxPlayers, startingChips, smallBlind, bigBlind, minBuyIn, maxBuyIn, turnTimerSeconds, allowSpectators, password, autoStart } = req.body;

  const { roomId, table } = roomManager.createRoom(name, payload.userId, {
    maxPlayers: Number(maxPlayers) || 8,
    startingChips: Number(startingChips) || 2000,
    smallBlind: Number(smallBlind) || 10,
    bigBlind: Number(bigBlind) || 20,
    minBuyIn: Number(minBuyIn) || 500,
    maxBuyIn: Number(maxBuyIn) || 5000,
    turnTimerSeconds: Number(turnTimerSeconds) || 30,
    allowSpectators: allowSpectators !== false,
    password: password || undefined,
    autoStart: autoStart !== false,
  });

  res.json({
    roomId,
    config: table.config,
  });
  return Promise.resolve();
});

roomsRouter.get('/:id', (req: Request, res: Response): Promise<void> => {
  const roomId = req.params.id as string;
  const table = roomManager.getTable(roomId);
  if (!table) {
    res.status(404).json({ error: 'Room not found' });
    return Promise.resolve();
  }

  res.json({
    id: table.config.id,
    name: table.config.name,
    config: table.config,
    isHandInProgress: table.isHandInProgress(),
    seatedPlayers: table.seats.filter(s => s !== null).length,
  });
  return Promise.resolve();
});

roomsRouter.get('/:id/history', (req: Request, res: Response): Promise<void> => {
  const roomId = req.params.id as string;
  const histories = db.getHandHistoriesForRoom(roomId);
  res.json({ histories });
  return Promise.resolve();
});
