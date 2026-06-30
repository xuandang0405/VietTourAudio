import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDirectory, '..', 'client');
const distRoot = path.join(clientRoot, 'dist');
const require = createRequire(path.join(clientRoot, 'package.json'));
const { build } = await import(pathToFileURL(require.resolve('vite')).href);
const { default: react } = await import(pathToFileURL(require.resolve('@vitejs/plugin-react')).href);

process.chdir(clientRoot);

console.log('Dang tao ban frontend moi...');
await build({
  root: clientRoot,
  configFile: false,
  cacheDir: path.join(clientRoot, 'node_modules', '.vite'),
  plugins: [react()],
  css: { postcss: path.join(clientRoot, 'postcss.config.js') },
  build: { outDir: distRoot }
});

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let filePath = path.join(distRoot, requestPath === '/' ? 'index.html' : requestPath);

  if (!filePath.startsWith(distRoot) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = path.join(distRoot, 'index.html');
  }

  response.setHeader('Content-Type', mimeTypes[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream');
  createReadStream(filePath).pipe(response);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('Cong 5173 dang duoc su dung. Hay dong cua so frontend cu roi chay lai.');
    process.exit(1);
  }
  throw error;
});

server.listen(5173, '0.0.0.0', () => {
  const url = 'http://localhost:5173';
  console.log(`Frontend dang chay tai: ${url}`);
  console.log('Nhan Ctrl+C de dung.');

  if (process.platform === 'win32') {
    const browser = spawn('cmd.exe', ['/d', '/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    browser.unref();
  }
});
