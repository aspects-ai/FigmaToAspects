#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env.production from project root
const envPath = path.resolve(__dirname, '../../../.env.production');

if (fs.existsSync(envPath)) {
  console.log('[build-prod] Loading environment from .env.production');
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
  console.error('[build-prod] Error: .env.production not found');
  process.exit(1);
}

// Build define flags for esbuild
const defines = [];

if (process.env.ASPECTS_BACKEND_URL) {
  defines.push(`--define:ASPECTS_BACKEND_URL='"${process.env.ASPECTS_BACKEND_URL}"'`);
  console.log('[build-prod] ASPECTS_BACKEND_URL:', process.env.ASPECTS_BACKEND_URL);
}

if (process.env.WEB_APP_URL) {
  defines.push(`--define:WEB_APP_URL='"${process.env.WEB_APP_URL}"'`);
  console.log('[build-prod] WEB_APP_URL:', process.env.WEB_APP_URL);
}

// Build command with minification and tree-shaking for production
const baseCommand = 'npx esbuild plugin-src/code.ts --bundle --target=ES6 --outfile=dist/code.js --minify --tree-shaking=true';
const defineFlags = defines.join(' ');
const command = `${baseCommand} ${defineFlags}`.trim();

console.log('[build-prod] Building plugin for production...');

try {
  execSync(command, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log('[build-prod] ✓ Build complete');
} catch (error) {
  console.error('[build-prod] Build failed:', error.message);
  process.exit(1);
}
