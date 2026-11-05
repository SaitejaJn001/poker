import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import { LobbyPage } from './pages/LobbyPage';
import { TablePage } from './pages/TablePage';

export const AppContent: React.FC = () => {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  // Parse room from URL parameter (e.g. ?room=room-XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setCurrentRoomId(roomParam);
    }
  }, []);

  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    window.history.pushState({}, '', url.toString());
  };

  const handleLeaveRoom = () => {
    setCurrentRoomId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  };

  if (currentRoomId) {
    return <TablePage roomId={currentRoomId} onLeave={handleLeaveRoom} />;
  }

  return <LobbyPage onJoinRoom={handleJoinRoom} />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </AuthProvider>
  );
};

export default App;

