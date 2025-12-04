#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Try to load .env.local from project root
const envPath = path.resolve(__dirname, '../../../.env.local');

if (fs.existsSync(envPath)) {
  console.log('[build-dev] Loading environment from .env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');

  // Parse .env file manually (simple parser)
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
} else {
  console.warn('[build-dev] No .env.local found, building without dev config');
}

// Build define flags for esbuild
const defines = [];

if (process.env.ASPECTS_BACKEND_URL) {
  defines.push(`--define:ASPECTS_BACKEND_URL='"${process.env.ASPECTS_BACKEND_URL}"'`);
  console.log('[build-dev] ASPECTS_BACKEND_URL:', process.env.ASPECTS_BACKEND_URL);
}

if (process.env.WEB_APP_URL) {
  defines.push(`--define:WEB_APP_URL='"${process.env.WEB_APP_URL}"'`);
  console.log('[build-dev] WEB_APP_URL:', process.env.WEB_APP_URL);
}

// Check if --watch flag was passed
const watchMode = process.argv.includes('--watch');

// Build command
const baseCommand = 'npx esbuild plugin-src/code.ts --bundle --target=ES6 --outfile=dist/code.js';
const defineFlags = defines.join(' ');
const watchFlag = watchMode ? '--watch' : '';
const command = `${baseCommand} ${defineFlags} ${watchFlag}`.trim();

console.log('[build-dev] Building plugin with dev configuration...');
if (watchMode) {
  console.log('[build-dev] Watch mode enabled - will rebuild on changes');
}

try {
  execSync(command, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  if (!watchMode) {
    console.log('[build-dev] ✓ Build complete');
  }
} catch (error) {
  console.error('[build-dev] Build failed:', error.message);
  process.exit(1);
}
