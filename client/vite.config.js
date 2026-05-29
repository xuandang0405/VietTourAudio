import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: process.cwd(),
  cacheDir: 'node_modules/.vite',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
