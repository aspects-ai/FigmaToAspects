# Development Setup

## Quick Start

1. **Create `.env.local`** from the example:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure your environment variables** in `.env.local`:

3. **Run the dev build**:
   ```bash
   pnpm dev:plugin
   ```

   This will:
   - Inject environemnt variables into `manifest.json`
   - Build the plugin with dev credentials (from `.env.local`)
   - Start watch mode for auto-rebuild

## What Gets Injected?

### 1. Manifest Network Access
The script generates `manifest.json` from `manifest.template.json` and injects `ALLOWED_DOMAINS` from `.env.local`:

```json
{
  "networkAccess": {
    "allowedDomains": ["http://localhost:5003", "https://..."]
  }
}
```

This allows the plugin to make network requests to your backend and storage in development mode.

**Note**: `manifest.json` is gitignored. Always edit `manifest.template.json` for structural changes.

### 2. Build-Time Constants
The build script reads environment variables and injects them as compile-time constants using esbuild's `--define` flag:

```typescript
// These are replaced at build time
declare const ASPECTS_BACKEND_URL: string | undefined;
declare const WEB_APP_URL: string | undefined;
```

The plugin auto-configures image upload on load if these constants are defined.

## Files Involved

- **`.env.local`** - Your local dev configuration (gitignored)
- **`manifest.template.json`** - Template manifest (committed to git)
- **`manifest.json`** - Generated manifest with dev domains (gitignored)
- **`scripts/inject-dev-domains.js`** - Generates manifest from template
- **`apps/plugin/scripts/build-dev.js`** - Handles build-time constant injection

## Production Builds

Production builds (`pnpm build`) don't use `.env.local` or inject dev domains:
- No build-time constants defined
- Only `allowedDomains` (not `devAllowedDomains`) are used
- Image upload must be configured at runtime via UI or API

## Troubleshooting

### Network requests blocked
- Ensure `ALLOWED_DOMAINS` includes your backend URL and storage domain
- Check that `manifest.json` was generated with correct `devAllowedDomains` after running `pnpm dev:plugin`
- Verify the domains match exactly (including protocol: http vs https)
- If `manifest.json` doesn't exist, run `pnpm dev:plugin` to generate it

### Image upload not working
- Check `.env.local` has correct `ASPECTS_BACKEND_URL` and `WEB_APP_URL`
- Ensure you're using `pnpm dev:plugin` (not `pnpm dev`)
- Backend must have CORS configured to allow `origin: null` (Figma plugin origin)

### Manifest changes not applying
- Restart Figma after manifest changes
- Edit `manifest.template.json` (not `manifest.json` directly)
- Run `pnpm dev:plugin` to regenerate `manifest.json`
