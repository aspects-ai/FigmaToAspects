#!/usr/bin/env node

/**
 * Injects ALLOWED_DOMAINS from .env.local into manifest.json
 * Run before dev builds to configure network access dynamically
 */

const fs = require('fs');
const path = require('path');

// Paths relative to project root
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(PROJECT_ROOT, '.env.local');
const TEMPLATE_FILE = path.join(PROJECT_ROOT, 'manifest.template.json');
const MANIFEST_FILE = path.join(PROJECT_ROOT, 'manifest.json');

// Parse .env.local file
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('❌ Error: .env.local not found');
    console.log('Create .env.local from .env.local.example and configure ALLOWED_DOMAINS');
    process.exit(1);
  }

  const envContent = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...valueParts] = trimmed.split('=');
    if (key) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

// Main execution
try {
  console.log('🔧 Generating manifest.json from template...\n');

  // Check template exists
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error('❌ Error: manifest.template.json not found');
    process.exit(1);
  }

  // Parse .env.local
  const env = parseEnvFile(ENV_FILE);
  const domainsStr = env.ALLOWED_DOMAINS || '';
  const devDomainsStr = env.DEV_ALLOWED_DOMAINS || '';

  // Parse comma-separated domains
  let devDomains = [];
  if (devDomainsStr) {
    devDomains = devDomainsStr
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    console.log('✓ Found allowed dev domains:', devDomains.join(', '));
  } else {
    console.log('⚠️  Warning: DEV_ALLOWED_DOMAINS not set in .env.local');
    console.log('   Network requests will be blocked in dev mode\n');
  }

  let domains = [];
  if (domainsStr) {
    domains = domainsStr
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    console.log('✓ Found allowed domains:', domains.join(', '));
  } else {
    console.log('⚠️  Warning: ALLOWED_DOMAINS not set in .env.local');
    console.log('   Network requests will be blocked in dev mode\n');
  }

  // Read template and inject dev domains
  const manifest = JSON.parse(fs.readFileSync(TEMPLATE_FILE, 'utf-8'));

  if (!manifest.networkAccess) {
    manifest.networkAccess = {};
  }

  manifest.networkAccess.devAllowedDomains = devDomains;
  manifest.networkAccess.allowedDomains = domains;

  // Write generated manifest
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n');

  console.log('✅ Generated manifest.json with allowedDomains\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
