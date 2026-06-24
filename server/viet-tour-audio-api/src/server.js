import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { createSocketServer } from './socket/index.js';
import { attachIo } from './services/notification.service.js';

const httpServer = http.createServer();
const io = createSocketServer(httpServer);
const app = createApp(io);
attachIo(io);

httpServer.removeAllListeners('request');
httpServer.on('request', app);

httpServer.listen(env.port, () => {
  console.log(`VietTourAudio API running on http://localhost:${env.port}`);
});

const gracefulShutdown = async () => {
  console.log('Shutting down...');
  io.close();
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
