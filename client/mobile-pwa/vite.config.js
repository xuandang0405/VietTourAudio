import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim();
  const proxy = proxyTarget
    ? {
        '/api': { target: proxyTarget, changeOrigin: true, secure: false },
        '/uploads': { target: proxyTarget, changeOrigin: true, secure: false },
        '/socket.io': { target: proxyTarget, ws: true, changeOrigin: true, secure: false }
      }
    : undefined;

  return {
    plugins: [
      react(),
      basicSsl(),
      VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/(tours|zones|narrations)/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-content-cache', expiration: { maxAgeSeconds: 3600 } }
          },
          {
            urlPattern: /\/uploads\/audio\//,
            handler: 'CacheFirst',
            options: { cacheName: 'audio-cache', expiration: { maxAgeSeconds: 86400 * 7 } }
          },
          {
            urlPattern: /\/uploads\/images\//,
            handler: 'CacheFirst',
            options: { cacheName: 'image-cache', expiration: { maxAgeSeconds: 86400 * 7 } }
          }
        ]
      },
      manifest: {
        name: 'VietTourAudio',
        short_name: 'VTA',
        theme_color: '#0d9488',
        background_color: '#f9fafb',
        display: 'standalone',
        start_url: '/scan',
        icons: [
          { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
      })
    ],
    server: {
      host: env.VITE_DEV_HOST || false,
      proxy
    }
  };
});
