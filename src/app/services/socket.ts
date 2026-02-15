// Socket.IO service for real-time updates
// Connects to the backend WebSocket server using socket.io-client

import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

let socket: Socket | null = null;

/**
 * Initialize and return the Socket.IO connection.
 * Attaches the auth token for authentication.
 */
export function initializeSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const token = getToken();

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('🔌 Socket.IO connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket.IO disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('🔌 Socket.IO connection error:', error.message);
  });

  return socket;
}

/**
 * Get the current socket instance (may be null if not initialized).
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Join a board room to receive real-time events for that board.
 */
export function joinBoard(boardId: string) {
  if (socket?.connected) {
    socket.emit('join:board', { boardId });
    console.log(`📋 Joined board room: ${boardId}`);
  }
}

/**
 * Leave a board room to stop receiving events for that board.
 */
export function leaveBoard(boardId: string) {
  if (socket?.connected) {
    socket.emit('leave:board', { boardId });
    console.log(`📋 Left board room: ${boardId}`);
  }
}

/**
 * Disconnect the socket and clean up.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
