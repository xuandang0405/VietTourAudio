import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: process.cwd(),
  cacheDir: 'node_modules/.vite',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('react-leaflet') || id.includes('leaflet')) {
            return 'maps';
          }

          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }

          if (id.includes('framer-motion') || id.includes('motion-')) {
            return 'motion';
          }

          if (id.includes('lucide-react') || id.includes('qrcode.react')) {
            return 'ui';
          }

          if (id.includes('react') || id.includes('zustand')) {
            return 'react-core';
          }

          return undefined;
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
