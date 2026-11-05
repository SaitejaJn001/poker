import { Server, Socket } from 'socket.io';
import { AuthService } from '../services/AuthService.js';
import { roomManager } from '../services/RoomManager.js';
import { ActionType } from '../engine/types.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  userAvatar?: string;
  isGuest?: boolean;
  currentRoomId?: string;
}

export function setupSocketHandler(io: Server): void {
  roomManager.setSocketServer(io);

  // Auth Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow anonymous connection but limit actions
      return next();
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return next(new Error('Authentication failed: Invalid token'));
    }

    const user = AuthService.getUser(payload.userId);
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    socket.userName = user.displayName;
    socket.userAvatar = user.avatar;
    socket.isGuest = user.isGuest;
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`[Socket] Connected: ${socket.id} (User: ${socket.userName || 'Anonymous'})`);

    // 1. Join Room
    socket.on('room:join', ({ roomId, password }: { roomId: string; password?: string }) => {
      let table = roomManager.getTable(roomId);

      if (!table) {
        // Automatically create room if joining default room or room code
        const res = roomManager.createRoom(`Room ${roomId.toUpperCase()}`, socket.userId || 'system', {}, roomId);
        table = res.table;
      }

      if (table.config.password && table.config.password !== password) {
        socket.emit('room:error', { message: 'Incorrect room password' });
        return;
      }

      // Leave previous room if any
      if (socket.currentRoomId) {
        socket.leave(socket.currentRoomId);
      }

      socket.join(roomId);
      socket.currentRoomId = roomId;

      // Check if user was already seated (reconnect)
      if (socket.userId) {
        const player = table.getPlayer(socket.userId);
        if (player) {
          player.isConnected = true;
        } else {
          table.spectatorIds.add(socket.userId);
        }
      }

      // Send initial customized state to this player
      const state = table.getPublicState(socket.userId);
      socket.emit('table:state', state);

      // Broadcast update to others
      roomManager.broadcastTableState(table);
    });

    // 2. Sit at table
    socket.on('room:sit', ({ seatIndex, buyIn }: { seatIndex?: number; buyIn?: number }) => {
      if (!socket.userId || !socket.currentRoomId) {
        socket.emit('room:error', { message: 'Must be logged in and inside a room to sit' });
        return;
      }

      const table = roomManager.getTable(socket.currentRoomId);
      if (!table) {
        socket.emit('room:error', { message: 'Room not found' });
        return;
      }

      const user = AuthService.getUser(socket.userId);
      if (!user) {
        socket.emit('room:error', { message: 'User record not found' });
        return;
      }

      const minBuyIn = table.config.minBuyIn;
      const maxBuyIn = Math.min(table.config.maxBuyIn, user.chips);

      const requestedBuyIn = buyIn !== undefined ? buyIn : Math.max(minBuyIn, Math.min(table.config.startingChips, user.chips));

      if (user.chips < requestedBuyIn || requestedBuyIn < minBuyIn) {
        socket.emit('room:error', { message: `Minimum buy-in is ${minBuyIn} chips. You have ${user.chips}.` });
        return;
      }

      try {
        const isHost = table.seats.filter(s => s !== null).length === 0;

        table.sitPlayer({
          id: socket.userId,
          name: socket.userName || user.displayName,
          avatar: socket.userAvatar || user.avatar,
          chips: requestedBuyIn,
          isHost,
          isConnected: true,
          isGuest: !!socket.isGuest,
        }, seatIndex);

        roomManager.broadcastTableState(table);
      } catch (err: any) {
        socket.emit('room:error', { message: err.message || 'Could not take seat' });
      }
    });

    // 3. Stand up / Leave Seat
    socket.on('room:stand', () => {
      if (!socket.userId || !socket.currentRoomId) return;

      const table = roomManager.getTable(socket.currentRoomId);
      if (!table) return;

      table.standPlayer(socket.userId);
      table.spectatorIds.add(socket.userId);

      roomManager.broadcastTableState(table);
    });

    // 4. Start Hand (Host or ready trigger)
    socket.on('game:start', () => {
      if (!socket.currentRoomId) return;
      const table = roomManager.getTable(socket.currentRoomId);
      if (!table) return;

      const check = table.canStartHand();
      if (!check.canStart) {
        socket.emit('room:error', { message: check.reason || 'Cannot start hand' });
        return;
      }

      table.startHand();
    });

    // 5. Game Action
    socket.on('game:action', ({ type, amount }: { type: ActionType; amount?: number }) => {
      if (!socket.userId || !socket.currentRoomId) return;

      const table = roomManager.getTable(socket.currentRoomId);
      if (!table) return;

      const result = table.handleAction(socket.userId, { type, amount });
      if (!result.success) {
        socket.emit('room:error', { message: result.error || 'Invalid action' });
      }
    });

    // 6. In-Game Chat
    socket.on('room:chat', ({ text }: { text: string }) => {
      if (!socket.currentRoomId || !text || text.trim().length === 0) return;

      const cleanText = text.trim().slice(0, 200);
      io.to(socket.currentRoomId).emit('room:chat_message', {
        id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: socket.userId || 'guest',
        senderName: socket.userName || 'Guest',
        senderAvatar: socket.userAvatar || '👤',
        text: cleanText,
        timestamp: Date.now(),
      });
    });

    // 7. Quick Reaction Emojis (Float on Table!)
    socket.on('room:reaction', ({ emoji }: { emoji: string }) => {
      if (!socket.currentRoomId || !socket.userId) return;

      const table = roomManager.getTable(socket.currentRoomId);
      const player = table?.getPlayer(socket.userId);

      io.to(socket.currentRoomId).emit('room:reaction_event', {
        playerId: socket.userId,
        seatIndex: player ? player.seatIndex : null,
        emoji,
        timestamp: Date.now(),
      });
    });

    // 8. Rebuy / Top Up chips at table
    socket.on('game:rebuy', ({ amount }: { amount?: number }) => {
      if (!socket.userId || !socket.currentRoomId) return;
      const table = roomManager.getTable(socket.currentRoomId);
      if (!table) return;

      const player = table.getPlayer(socket.userId);
      if (!player) return;

      const rebuyAmount = amount || table.config.startingChips;
      player.chips += rebuyAmount;
      if (player.status === 'SITTING_OUT') {
        player.status = 'ACTIVE';
      }

      roomManager.broadcastTableState(table);
    });

    // 9. Host Actions
    socket.on('room:kick', ({ targetUserId }: { targetUserId: string }) => {
      if (!socket.userId || !socket.currentRoomId) return;
      const table = roomManager.getTable(socket.currentRoomId);
      if (!table) return;

      const caller = table.getPlayer(socket.userId);
      if (!caller || !caller.isHost) {
        socket.emit('room:error', { message: 'Only the host can kick players' });
        return;
      }

      table.standPlayer(targetUserId);
      roomManager.broadcastTableState(table);
    });

    // 10. Disconnect Handling
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id} (${socket.userName || 'Anonymous'})`);

      if (socket.currentRoomId && socket.userId) {
        const table = roomManager.getTable(socket.currentRoomId);
        if (table) {
          const player = table.getPlayer(socket.userId);
          if (player) {
            player.isConnected = false;
            // Notify other players
            roomManager.broadcastTableState(table);
          } else {
            table.spectatorIds.delete(socket.userId);
          }
        }
      }
    });
  });
}
