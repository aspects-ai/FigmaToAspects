#!/usr/bin/env node

/**
 * Generates manifest.json from template with environment-specific configuration
 * - Injects ALLOWED_DOMAINS for network access
 * - Sets plugin name based on environment (dev vs prod)
 *
 * Usage:
 *   node inject-dev-domains.js           # Dev mode (uses .env.local, adds "(Development)" suffix)
 *   node inject-dev-domains.js --prod    # Prod mode (uses .env.production, no suffix)
 */

const fs = require('fs');
const path = require('path');

// Check for --prod flag
const isProd = process.argv.includes('--prod');

// Paths relative to project root
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(PROJECT_ROOT, isProd ? '.env.production' : '.env.local');
const TEMPLATE_FILE = path.join(PROJECT_ROOT, 'manifest.template.json');
const MANIFEST_FILE = path.join(PROJECT_ROOT, 'manifest.json');

// Plugin names
const PLUGIN_NAME_PROD = 'Figma to Aspects';
const PLUGIN_NAME_DEV = 'Figma to Aspects (Development)';

// Parse env file
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    const fileName = path.basename(filePath);
    console.error(`❌ Error: ${fileName} not found`);
    if (!isProd) {
      console.log('Create .env.local from .env.local.example and configure ALLOWED_DOMAINS');
    }
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
  const mode = isProd ? 'production' : 'development';
  const pluginName = isProd ? PLUGIN_NAME_PROD : PLUGIN_NAME_DEV;
  const envFileName = path.basename(ENV_FILE);

  console.log(`🔧 Generating manifest.json for ${mode}...`);
  console.log(`   Using: ${envFileName}`);
  console.log(`   Plugin name: "${pluginName}"\n`);

  // Check template exists
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error('❌ Error: manifest.template.json not found');
    process.exit(1);
  }

  // Parse env file
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
  } else if (!isProd) {
    console.log('⚠️  Warning: DEV_ALLOWED_DOMAINS not set');
    console.log('   Network requests may be blocked in dev mode\n');
  }

  let domains = [];
  if (domainsStr) {
    domains = domainsStr
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    console.log('✓ Found allowed domains:', domains.join(', '));
  } else {
    console.log('⚠️  Warning: ALLOWED_DOMAINS not set');
    console.log('   Network requests will be blocked\n');
  }

  // Read template and inject values
  const manifest = JSON.parse(fs.readFileSync(TEMPLATE_FILE, 'utf-8'));

  // Set plugin name
  manifest.name = pluginName;

  // Set network access
  if (!manifest.networkAccess) {
    manifest.networkAccess = {};
  }

  manifest.networkAccess.devAllowedDomains = devDomains;
  manifest.networkAccess.allowedDomains = domains;

  // Write generated manifest
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\n✅ Generated manifest.json for ${mode}\n`);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
