import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db, UserRecord } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'poker-super-secret-key-998877';

export interface AuthTokenPayload {
  userId: string;
  username: string;
  isGuest: boolean;
}

export class AuthService {
  public static async register(username: string, displayName: string, password: string, avatar?: string): Promise<{ user: UserRecord; token: string }> {
    const existing = db.getUserByUsername(username);
    if (existing) {
      throw new Error('Username already taken');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const defaultAvatars = ['👑', '♠️', '🦈', '🎲', '💎', '🔥', '🦁', '🚀', '🃏'];
    const chosenAvatar = avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const user: UserRecord = {
      id: uuidv4(),
      username,
      displayName: displayName || username,
      passwordHash,
      avatar: chosenAvatar,
      chips: 2500, // Initial bankroll
      gamesPlayed: 0,
      gamesWon: 0,
      chipsWon: 0,
      biggestPotWon: 0,
      isGuest: false,
      createdAt: Date.now(),
    };

    db.saveUser(user);

    const token = this.generateToken(user);
    return { user, token };
  }

  public static async login(username: string, password: string): Promise<{ user: UserRecord; token: string }> {
    const user = db.getUserByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    if (user.isGuest) {
      throw new Error('Cannot login to a guest account with password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid username or password');
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  public static createGuest(nickname: string): { user: UserRecord; token: string } {
    const defaultAvatars = ['🎩', '🦊', '⚡', '🍀', '🌟', '🎯'];
    const chosenAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const id = uuidv4();
    const guestUser: UserRecord = {
      id,
      username: `guest_${id.slice(0, 6)}`,
      displayName: nickname.trim() || `Player ${id.slice(0, 4)}`,
      passwordHash: '',
      avatar: chosenAvatar,
      chips: 2000,
      gamesPlayed: 0,
      gamesWon: 0,
      chipsWon: 0,
      biggestPotWon: 0,
      isGuest: true,
      createdAt: Date.now(),
    };

    db.saveUser(guestUser);
    const token = this.generateToken(guestUser);
    return { user: guestUser, token };
  }

  public static generateToken(user: UserRecord): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      username: user.username,
      isGuest: user.isGuest,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  public static verifyToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    } catch {
      return null;
    }
  }

  public static getUser(id: string): UserRecord | null {
    return db.getUserById(id);
  }
}

