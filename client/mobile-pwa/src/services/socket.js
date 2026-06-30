import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, { autoConnect: true });
  return socket;
}
