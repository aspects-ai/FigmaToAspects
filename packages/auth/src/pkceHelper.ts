/**
 * PKCE (Proof Key for Code Exchange) helpers for OAuth security
 * Implements the client-side of RFC 7636
 *
 * Uses pure JS implementation compatible with Figma plugin sandboxed iframes
 * which have null origin and don't support crypto.subtle in insecure contexts
 */

import { sha256 } from "js-sha256";

/**
 * Get crypto.getRandomValues - available even in sandboxed iframes
 */
function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(array);
  }
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return crypto.getRandomValues(array);
  }
  throw new Error("crypto.getRandomValues not available in this environment");
}

/**
 * Generate random code verifier (43-128 characters)
 * Uses cryptographically secure random values
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generate code challenge from verifier using SHA-256
 * Uses pure JS implementation since crypto.subtle is not available in Figma plugin iframes
 */
export async function generateCodeChallenge(
  verifier: string,
): Promise<string> {
  // Use js-sha256 library instead of crypto.subtle (which requires secure context)
  const hash = sha256.arrayBuffer(verifier);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * Generate random state for CSRF protection
 * Should be verified when receiving the authorization callback
 */
export function generateState(): string {
  const array = new Uint8Array(16);
  getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Base64 URL encoding (RFC 4648 Section 5)
 * - No padding (no '=' characters)
 * - URL-safe characters (- and _ instead of + and /)
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...Array.from(buffer)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
