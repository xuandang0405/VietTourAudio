import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.frontendOrigins,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) return next();
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      socket.user = payload;
      return next();
    } catch {
      return next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.user?.sub) socket.join(`user:${socket.user.sub}`);
    if (socket.user?.shopId) socket.join(`vendor:${socket.user.shopId}`);

    socket.on('join:vendor', (shopId) => {
      if (shopId) socket.join(`vendor:${shopId}`);
    });
  });

  return io;
}
