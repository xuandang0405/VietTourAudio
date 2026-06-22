import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const sourceRoot = process.cwd();
const buildArgs = process.argv.slice(2);
const hasUnsafePath = /[#]/.test(sourceRoot);

const ignoredTopLevel = new Set([
  'node_modules',
  'dist',
  '.git',
  '.vite'
]);

function nodeCommand() {
  return process.execPath;
}

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function npmInstallCommand() {
  if (process.platform === 'win32') {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm', 'install']
    };
  }

  return {
    command: npmCommand(),
    args: ['install']
  };
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

function assertInside(parent, target) {
  const resolvedParent = path.resolve(parent);
  const resolvedTarget = path.resolve(target);

  if (resolvedTarget !== resolvedParent && !resolvedTarget.startsWith(`${resolvedParent}${path.sep}`)) {
    throw new Error(`Refusing to write outside ${resolvedParent}: ${resolvedTarget}`);
  }
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

  console.log('[vite-safe] Installing client dependencies in temporary build workspace...');
  const install = npmInstallCommand();
  const result = spawnSync(install.command, install.args, {
    cwd: targetRoot,
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    console.error(`[vite-safe] Failed to start npm install: ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runViteBuild(cwd) {
  const viteBin = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js');
  const result = spawnSync(nodeCommand(), [viteBin, 'build', '--configLoader', 'runner', ...buildArgs], {
    cwd,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      VTA_SOURCE_ROOT: sourceRoot
    }
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyDistBack(fromRoot) {
  const fromDist = path.join(fromRoot, 'dist');
  const toDist = path.join(sourceRoot, 'dist');

  assertInside(sourceRoot, toDist);
  fs.rmSync(toDist, { recursive: true, force: true });
  copyEntry(fromDist, toDist);
}

if (!hasUnsafePath) {
  runViteBuild(sourceRoot);
} else {
  const tempRoot = path.join(os.tmpdir(), 'VietTourAudioClientBuild');
  console.log(`[vite-safe] Path contains '#'. Building Vite from: ${tempRoot}`);

  assertInside(os.tmpdir(), tempRoot);
  fs.rmSync(tempRoot, { recursive: true, force: true });
  syncProject(tempRoot);
  ensureDependencies(tempRoot);
  runViteBuild(tempRoot);
  copyDistBack(tempRoot);
}
