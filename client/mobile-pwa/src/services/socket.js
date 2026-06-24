import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', { autoConnect: true });
  return socket;
}
