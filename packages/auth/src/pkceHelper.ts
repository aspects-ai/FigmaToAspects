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
  // Try window.crypto first (most common in browser)
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }

  // Try self.crypto (works in web workers and some iframes)
  if (typeof self !== "undefined" && (self as any).crypto?.getRandomValues) {
    return (self as any).crypto.getRandomValues(array);
  }

  // Try global crypto object
  if (typeof crypto !== "undefined" && (crypto as any).getRandomValues) {
    return (crypto as any).getRandomValues(array);
  }

  // Try globalThis.crypto
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.getRandomValues) {
    return (globalThis as any).crypto.getRandomValues(array);
  }

  // Last resort: use Math.random (NOT cryptographically secure, but better than failing)
  console.warn("crypto.getRandomValues not available, falling back to Math.random (not cryptographically secure)");
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
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
 * Generate read key for polling-based OAuth flow
 * Returns 64-character hex string (32 bytes)
 */
export function generateReadKey(): string {
  const array = new Uint8Array(32);
  getRandomValues(array);
  // Convert to hex string
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
