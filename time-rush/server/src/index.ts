import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { GAME_CONFIG } from '@shared/config';
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/protocol/events';
import { QUESTION_BANK } from '@shared/questions/bank';
import { createId, createRoomCode, createToken } from './game/ids';
import { RealScheduler } from './game/scheduler';
import { createJoinUrlBuilder } from './joinUrl';
import { RoomManager } from './rooms/RoomManager';
import { registerHandlers, type SocketData } from './socket/registerHandlers';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: defaults and real environment variables are used.
}

const isDev = process.argv.includes('--dev');
// Development uses SERVER_PORT (Vite proxies to it); hosting platforms set PORT in production.
const port = Number((isDev ? process.env.SERVER_PORT : process.env.PORT ?? process.env.SERVER_PORT) ?? 3001);
const clientPort = isDev ? Number(process.env.CLIENT_PORT ?? 5173) : port;
// Render sets RENDER_EXTERNAL_URL to the service's public https address.
const publicUrl = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || undefined;

const app = express();
app.disable('x-powered-by');
app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

// In production the server also serves the built client (npm run build).
const clientDir = resolve(dirname(fileURLToPath(import.meta.url)), '../client');
if (!isDev && existsSync(clientDir)) {
  app.use(express.static(clientDir, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!socket\.io).*/, (_req, res) => {
    res.sendFile(resolve(clientDir, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
  cors: isDev ? { origin: true } : undefined,
  maxHttpBufferSize: 16 * 1024,
});

const scheduler = new RealScheduler();
const rooms = new RoomManager({
  scheduler,
  config: GAME_CONFIG,
  questions: QUESTION_BANK,
  random: Math.random,
  createId,
  createToken,
  createRoomCode,
});

registerHandlers({
  io,
  rooms,
  scheduler,
  buildJoinUrl: createJoinUrlBuilder({ publicUrl, clientPort }),
  log: (message) => console.log(`[time-rush] ${message}`),
});

httpServer.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[time-rush] Port ${port} is already in use. Stop the other process or set ${isDev ? 'SERVER_PORT' : 'PORT'} in .env.`);
    process.exit(1);
  }
  throw error;
});

httpServer.listen(port, () => {
  console.log(`[time-rush] server listening on http://localhost:${port} (${isDev ? 'development' : 'production'})`);
  if (!publicUrl) {
    console.log('[time-rush] PUBLIC_URL is not set: QR codes use this laptop\'s LAN address (same network only).');
  }
});
