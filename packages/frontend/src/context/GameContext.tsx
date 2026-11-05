import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { ActionType, ChatMessage, EmojiReaction, PublicTableView } from '../types';
import { soundManager } from '../audio/soundManager';

interface GameContextType {
  tableState: PublicTableView | null;
  isConnected: boolean;
  chatMessages: ChatMessage[];
  reactions: EmojiReaction[];
  error: string | null;
  clearError: () => void;
  joinRoom: (roomId: string, password?: string) => void;
  leaveRoom: () => void;
  sitAtTable: (seatIndex?: number, buyIn?: number) => void;
  standUp: () => void;
  sendAction: (type: ActionType, amount?: number) => void;
  startGame: () => void;
  rebuy: (amount?: number) => void;
  kickPlayer: (targetUserId: string) => void;
  sendChatMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, refreshUser } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [tableState, setTableState] = useState<PublicTableView | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const prevStageRef = useRef<string>('WAITING');
  const prevCardsCountRef = useRef<number>(0);
  const prevPotRef = useRef<number>(0);

  // Initialize Socket connection
  useEffect(() => {
    const socketInstance = io({
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to poker websocket server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('room:error', (err: { message: string }) => {
      setError(err.message);
    });

    socketInstance.on('table:state', (newState: PublicTableView) => {
      // Audio cues based on state transitions
      if (newState.stage !== prevStageRef.current) {
        if (newState.stage === 'PREFLOP') {
          soundManager.playCardSlide();
        } else if (newState.stage === 'FLOP' || newState.stage === 'TURN' || newState.stage === 'RIVER') {
          soundManager.playCardFlip();
        }
        prevStageRef.current = newState.stage;
      }

      // Check if community cards were added
      if (newState.communityCards.length > prevCardsCountRef.current) {
        soundManager.playCardFlip();
        prevCardsCountRef.current = newState.communityCards.length;
      }

      // Check if pot increased (bet action took place)
      if (newState.pot > prevPotRef.current && newState.pot > 0) {
        soundManager.playChipSound();
        prevPotRef.current = newState.pot;
      } else if (newState.pot === 0) {
        prevPotRef.current = 0;
      }

      // Turn countdown alert when <= 5s left
      if (newState.currentTurnSeatIndex !== null && newState.turnTimeRemaining <= 5 && newState.turnTimeRemaining > 0) {
        if (newState.mySeatIndex === newState.currentTurnSeatIndex) {
          soundManager.playTurnTimerAlert();
        }
      }

      setTableState(newState);
    });

    socketInstance.on('table:hand_complete', (data: any) => {
      soundManager.playWinFanfare();
      refreshUser();

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e6c875', '#ffffff', '#22c55e', '#ffd700'],
        });
      } catch {}
    });

    socketInstance.on('room:chat_message', (msg: ChatMessage) => {
      setChatMessages(prev => [...prev.slice(-49), msg]);
    });

    socketInstance.on('room:reaction_event', (reaction: EmojiReaction) => {
      setReactions(prev => [...prev.slice(-15), reaction]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.timestamp !== reaction.timestamp));
      }, 2500);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  const joinRoom = (roomId: string, password?: string) => {
    if (!socket) return;
    setError(null);
    socket.emit('room:join', { roomId, password });
  };

  const leaveRoom = () => {
    if (!socket) return;
    socket.emit('room:stand');
    setTableState(null);
    setChatMessages([]);
  };

  const sitAtTable = (seatIndex?: number, buyIn?: number) => {
    if (!socket) return;
    setError(null);
    socket.emit('room:sit', { seatIndex, buyIn });
  };

  const standUp = () => {
    if (!socket) return;
    socket.emit('room:stand');
  };

  const sendAction = (type: ActionType, amount?: number) => {
    if (!socket) return;
    setError(null);

    // Play local action sound feedback
    if (type === 'CHECK') {
      soundManager.playCheckKnock();
    } else if (type === 'FOLD') {
      soundManager.playFoldSound();
    } else if (type === 'CALL' || type === 'BET' || type === 'RAISE') {
      soundManager.playChipSound();
    } else if (type === 'ALL_IN') {
      soundManager.playAllInSound();
    }

    socket.emit('game:action', { type, amount });
  };

  const startGame = () => {
    if (!socket) return;
    setError(null);
    socket.emit('game:start');
  };

  const rebuy = (amount?: number) => {
    if (!socket) return;
    socket.emit('game:rebuy', { amount });
  };

  const kickPlayer = (targetUserId: string) => {
    if (!socket) return;
    socket.emit('room:kick', { targetUserId });
  };

  const sendChatMessage = (text: string) => {
    if (!socket) return;
    socket.emit('room:chat', { text });
  };

  const sendReaction = (emoji: string) => {
    if (!socket) return;
    socket.emit('room:reaction', { emoji });
  };

  const clearError = () => setError(null);

  return (
    <GameContext.Provider value={{
      tableState,
      isConnected,
      chatMessages,
      reactions,
      error,
      clearError,
      joinRoom,
      leaveRoom,
      sitAtTable,
      standUp,
      sendAction,
      startGame,
      rebuy,
      kickPlayer,
      sendChatMessage,
      sendReaction,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

