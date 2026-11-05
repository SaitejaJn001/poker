import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { PokerTable } from '../engine/PokerTable.js';
import { HandPotResult, TableConfig } from '../engine/types.js';
import { db } from '../database/db.js';

export class RoomManager {
  private static instance: RoomManager;
  private tables: Map<string, PokerTable> = new Map();
  private userToRoom: Map<string, string> = new Map(); // userId -> roomId
  private io?: Server;

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public setSocketServer(io: Server): void {
    this.io = io;
  }

  public createRoom(
    name: string,
    hostId: string,
    options: Partial<TableConfig> = {},
    customRoomId?: string
  ): { roomId: string; table: PokerTable } {
    const roomId = customRoomId || `room-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const config: TableConfig = {
      id: roomId,
      name: name || `High Stakes Table`,
      maxPlayers: Math.max(2, Math.min(9, options.maxPlayers || 8)),
      startingChips: options.startingChips || 2000,
      smallBlind: options.smallBlind || 10,
      bigBlind: options.bigBlind || 20,
      minBuyIn: options.minBuyIn || 500,
      maxBuyIn: options.maxBuyIn || 5000,
      turnTimerSeconds: options.turnTimerSeconds || 30,
      allowSpectators: options.allowSpectators !== undefined ? options.allowSpectators : true,
      password: options.password || undefined,
      autoStart: options.autoStart !== undefined ? options.autoStart : true,
    };

    const table = new PokerTable(config, {
      onTableUpdate: (tbl) => this.broadcastTableState(tbl),
      onHandComplete: (tbl, results) => this.handleHandComplete(tbl, results),
    });

    this.tables.set(roomId, table);

    // Save to persistent db
    db.saveRoom({
      id: roomId,
      name: config.name,
      hostId,
      config,
      createdAt: Date.now(),
      isClosed: false,
    });

    return { roomId, table };
  }

  public getTable(roomId: string): PokerTable | null {
    return this.tables.get(roomId) ?? null;
  }

  public getAllActiveRooms(): Array<{
    id: string;
    name: string;
    playersCount: number;
    maxPlayers: number;
    smallBlind: number;
    bigBlind: number;
    isHandInProgress: boolean;
    hasPassword: boolean;
  }> {
    const list = [];
    for (const [id, table] of this.tables.entries()) {
      const seated = table.seats.filter(s => s !== null).length;
      list.push({
        id,
        name: table.config.name,
        playersCount: seated,
        maxPlayers: table.config.maxPlayers,
        smallBlind: table.config.smallBlind,
        bigBlind: table.config.bigBlind,
        isHandInProgress: table.isHandInProgress(),
        hasPassword: !!table.config.password,
      });
    }
    return list;
  }

  public deleteRoom(roomId: string): boolean {
    const table = this.tables.get(roomId);
    if (!table) return false;

    this.tables.delete(roomId);
    const roomRecord = db.getRoom(roomId);
    if (roomRecord) {
      roomRecord.isClosed = true;
      db.saveRoom(roomRecord);
    }

    if (this.io) {
      this.io.to(roomId).emit('room:closed', { roomId, message: 'The table has been closed by the host.' });
    }

    return true;
  }

  public handleHandComplete(table: PokerTable, results: HandPotResult[]): void {
    // Record stats in db
    for (const pot of results) {
      for (const winner of pot.winners) {
        db.updateUserStats(winner.playerId, true, winner.amount, pot.amount);
      }
    }

    // Save hand history entry to db
    if (table.handHistory.length > 0) {
      const latestHistory = table.handHistory[0];
      db.saveHandHistory({
        handId: latestHistory.handId,
        tableId: table.config.id,
        timestamp: latestHistory.timestamp,
        data: latestHistory,
      });
    }

    if (this.io) {
      this.io.to(table.config.id).emit('table:hand_complete', {
        results,
        communityCards: table.communityCards,
      });
    }
  }

  public broadcastTableState(table: PokerTable): void {
    if (!this.io) return;

    const roomId = table.config.id;
    const roomSockets = this.io.sockets.adapter.rooms.get(roomId);

    if (!roomSockets) return;

    for (const socketId of roomSockets) {
      const clientSocket = this.io.sockets.sockets.get(socketId);
      if (!clientSocket) continue;

      const userId = (clientSocket as any).userId;
      // Per-client serialized state: hole cards masked for everyone else!
      const state = table.getPublicState(userId);
      clientSocket.emit('table:state', state);
    }
  }
}

export const roomManager = RoomManager.getInstance();
