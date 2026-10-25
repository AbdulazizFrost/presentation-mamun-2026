import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const serverPort = Number(process.env.SERVER_PORT ?? 3001);
const clientPort = Number(process.env.CLIENT_PORT ?? 5173);

export default defineConfig({
  root: 'client',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./shared/src', import.meta.url)),
    },
  },
  server: {
    host: true, // reachable from phones on the same network
    port: clientPort,
    strictPort: true,
    proxy: {
      '/socket.io': { target: `http://localhost:${serverPort}`, ws: true },
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    // Three.js lives in the lazily loaded projector chunk (~700 kB); phones never download it.
    chunkSizeWarningLimit: 800,
  },
});
