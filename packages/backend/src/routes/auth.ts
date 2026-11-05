import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { db } from '../database/db.js';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, displayName, password, avatar } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    const result = await AuthService.register(username, displayName, password, avatar);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    const result = await AuthService.login(username, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed' });
  }
});

authRouter.post('/guest', (req: Request, res: Response): Promise<void> => {
  try {
    const { nickname } = req.body;
    const result = AuthService.createGuest(nickname || 'Guest');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Guest login failed' });
  }
  return Promise.resolve();
});

authRouter.get('/me', (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return Promise.resolve();
  }

  const token = authHeader.split(' ')[1];
  const payload = AuthService.verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return Promise.resolve();
  }

  const user = AuthService.getUser(payload.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return Promise.resolve();
  }

  res.json({ user });
  return Promise.resolve();
});

authRouter.post('/topup', (req: Request, res: Response): Promise<void> => {
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

  const user = AuthService.getUser(payload.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return Promise.resolve();
  }

  // Refill chips if below 500
  if (user.chips < 500) {
    user.chips += 2000;
    db.saveUser(user);
  }

  res.json({ chips: user.chips });
  return Promise.resolve();
});

