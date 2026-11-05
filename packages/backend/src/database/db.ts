import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  avatar: string;
  chips: number;
  gamesPlayed: number;
  gamesWon: number;
  chipsWon: number;
  biggestPotWon: number;
  isGuest: boolean;
  createdAt: number;
}

export interface StoredRoomRecord {
  id: string;
  name: string;
  hostId: string;
  config: any;
  createdAt: number;
  isClosed: boolean;
}

export interface StoredHandHistory {
  handId: string;
  tableId: string;
  timestamp: number;
  data: any;
}

interface DatabaseSchema {
  users: Record<string, UserRecord>;
  rooms: Record<string, StoredRoomRecord>;
  handHistories: StoredHandHistory[];
}

export class Database {
  private filePath: string;
  private data: DatabaseSchema;

  constructor(filePath?: string) {
    const dataDir = path.resolve(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = filePath || path.join(dataDir, 'poker_db.json');
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('Failed to load database file, initializing empty db', e);
    }
    return {
      users: {},
      rooms: {},
      handHistories: [],
    };
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist database file', e);
    }
  }

  // Users
  public getUserById(id: string): UserRecord | null {
    return this.data.users[id] ?? null;
  }

  public getUserByUsername(username: string): UserRecord | null {
    const lower = username.toLowerCase();
    for (const user of Object.values(this.data.users)) {
      if (user.username.toLowerCase() === lower) {
        return user;
      }
    }
    return null;
  }

  public saveUser(user: UserRecord): void {
    this.data.users[user.id] = user;
    this.save();
  }

  public updateUserStats(userId: string, wonHand: boolean, chipsWon: number, potSize: number): void {
    const user = this.getUserById(userId);
    if (!user) return;

    user.gamesPlayed += 1;
    if (wonHand) {
      user.gamesWon += 1;
    }
    if (chipsWon > 0) {
      user.chipsWon += chipsWon;
      user.chips += chipsWon;
    }
    if (potSize > user.biggestPotWon) {
      user.biggestPotWon = potSize;
    }

    this.saveUser(user);
  }

  // Rooms
  public getRoom(id: string): StoredRoomRecord | null {
    return this.data.rooms[id] ?? null;
  }

  public saveRoom(room: StoredRoomRecord): void {
    this.data.rooms[room.id] = room;
    this.save();
  }

  public getActiveRooms(): StoredRoomRecord[] {
    return Object.values(this.data.rooms).filter(r => !r.isClosed);
  }

  // Hand Histories
  public saveHandHistory(entry: StoredHandHistory): void {
    this.data.handHistories.unshift(entry);
    if (this.data.handHistories.length > 500) {
      this.data.handHistories.pop();
    }
    this.save();
  }

  public getHandHistoriesForRoom(roomId: string, limit = 20): StoredHandHistory[] {
    return this.data.handHistories
      .filter(h => h.tableId === roomId)
      .slice(0, limit);
  }
}

export const db = new Database();

