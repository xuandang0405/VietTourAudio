import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const sourceRoot = process.cwd();
const viteArgs = process.argv.slice(2);
const hasUnsafePath = /[#]/.test(sourceRoot);

const ignoredTopLevel = new Set([
  'node_modules',
  'dist',
  '.git',
  '.vite'
]);

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function nodeCommand() {
  return process.execPath;
}

function shouldIgnore(relativePath) {
  if (!relativePath) {
    return false;
  }

  const firstPart = relativePath.split(/[\\/]/)[0];
  return ignoredTopLevel.has(firstPart)
    || relativePath.endsWith('.log')
    || relativePath.includes(`${path.sep}.vite${path.sep}`);
}

function copyEntry(from, to) {
  if (!fs.existsSync(from)) {
    fs.rmSync(to, { recursive: true, force: true });
    return;
  }

  const stats = fs.statSync(from);

  if (stats.isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const child of fs.readdirSync(from)) {
      const childRelative = path.relative(sourceRoot, path.join(from, child));
      if (!shouldIgnore(childRelative)) {
        copyEntry(path.join(from, child), path.join(to, child));
      }
    }
    return;
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function syncProject(targetRoot) {
  fs.mkdirSync(targetRoot, { recursive: true });

  for (const entry of fs.readdirSync(sourceRoot)) {
    if (!shouldIgnore(entry)) {
      copyEntry(path.join(sourceRoot, entry), path.join(targetRoot, entry));
    }
  }
}

function ensureDependencies(targetRoot) {
  const viteBin = path.join(targetRoot, 'node_modules', 'vite', 'bin', 'vite.js');

  if (fs.existsSync(viteBin)) {
    return;
  }

  console.log('[vite-safe] Installing client dependencies in temporary dev workspace...');
  const result = spawnSync(npmCommand(), ['install'], {
    cwd: targetRoot,
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runVite(cwd) {
  const viteBin = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(nodeCommand(), [viteBin, ...viteArgs], {
    cwd,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      VTA_SOURCE_ROOT: sourceRoot
    }
  });

  const stop = () => {
    if (!child.killed) {
      child.kill();
    }
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

function watchAndSync(targetRoot) {
  if (process.platform !== 'win32') {
    return;
  }

  fs.watch(sourceRoot, { recursive: true }, (_event, fileName) => {
    if (!fileName) {
      return;
    }

    const relativePath = fileName.toString();
    if (shouldIgnore(relativePath)) {
      return;
    }

    const from = path.join(sourceRoot, relativePath);
    const to = path.join(targetRoot, relativePath);

    try {
      copyEntry(from, to);
    } catch (error) {
      console.warn(`[vite-safe] Sync skipped for ${relativePath}: ${error.message}`);
    }
  });
}

if (!hasUnsafePath) {
  runVite(sourceRoot);
} else {
  const tempRoot = path.join(os.tmpdir(), 'VietTourAudioClientDev');
  console.log(`[vite-safe] Path contains '#'. Running Vite from: ${tempRoot}`);
  syncProject(tempRoot);
  ensureDependencies(tempRoot);
  watchAndSync(tempRoot);
  runVite(tempRoot);
}
