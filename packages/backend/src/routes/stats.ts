import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';

export const statsRouter = Router();

statsRouter.get('/user/:id', (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id as string;
  const user = db.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return Promise.resolve();
  }

  const winRate = user.gamesPlayed > 0 
    ? Math.round((user.gamesWon / user.gamesPlayed) * 100) 
    : 0;

  res.json({
    id: user.id,
    displayName: user.displayName,
    avatar: user.avatar,
    chips: user.chips,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    winRate,
    chipsWon: user.chipsWon,
    biggestPotWon: user.biggestPotWon,
    createdAt: user.createdAt,
  });
  return Promise.resolve();
});
