/**
 * Secure storage for OAuth tokens and temporary data using Figma's clientStorage API
 * Data is persisted across plugin sessions and encrypted by Figma
 */

import { AuthTokens, AuthUser } from "types";

const STORAGE_KEYS = {
  TOKENS: "aspects_auth_tokens",
  USER: "aspects_auth_user",
  PKCE_VERIFIER: "aspects_pkce_verifier",
  OAUTH_STATE: "aspects_oauth_state",
} as const;

export class AuthStorage {
  /**
   * Store auth tokens in Figma's clientStorage
   */
  static async saveTokens(tokens: AuthTokens): Promise<void> {
    await figma.clientStorage.setAsync(STORAGE_KEYS.TOKENS, tokens);
  }

  static async getTokens(): Promise<AuthTokens | null> {
    return (await figma.clientStorage.getAsync(STORAGE_KEYS.TOKENS)) || null;
  }

  static async clearTokens(): Promise<void> {
    await figma.clientStorage.deleteAsync(STORAGE_KEYS.TOKENS);
  }

  /**
   * Store user info
   */
  static async saveUser(user: AuthUser): Promise<void> {
    await figma.clientStorage.setAsync(STORAGE_KEYS.USER, user);
  }

  static async getUser(): Promise<AuthUser | null> {
    return (await figma.clientStorage.getAsync(STORAGE_KEYS.USER)) || null;
  }

  static async clearUser(): Promise<void> {
    await figma.clientStorage.deleteAsync(STORAGE_KEYS.USER);
  }

  /**
   * PKCE helpers (temporary storage during OAuth flow)
   */
  static async savePKCEVerifier(verifier: string): Promise<void> {
    await figma.clientStorage.setAsync(STORAGE_KEYS.PKCE_VERIFIER, verifier);
  }

  static async getPKCEVerifier(): Promise<string | null> {
    return (
      (await figma.clientStorage.getAsync(STORAGE_KEYS.PKCE_VERIFIER)) || null
    );
  }

  static async clearPKCEVerifier(): Promise<void> {
    await figma.clientStorage.deleteAsync(STORAGE_KEYS.PKCE_VERIFIER);
  }

  /**
   * OAuth state (CSRF protection)
   */
  static async saveOAuthState(state: string): Promise<void> {
    await figma.clientStorage.setAsync(STORAGE_KEYS.OAUTH_STATE, state);
  }

  static async getOAuthState(): Promise<string | null> {
    return (
      (await figma.clientStorage.getAsync(STORAGE_KEYS.OAUTH_STATE)) || null
    );
  }

  static async clearOAuthState(): Promise<void> {
    await figma.clientStorage.deleteAsync(STORAGE_KEYS.OAUTH_STATE);
  }

  /**
   * Clear all auth data (logout)
   */
  static async clearAll(): Promise<void> {
    await Promise.all([
      this.clearTokens(),
      this.clearUser(),
      this.clearPKCEVerifier(),
      this.clearOAuthState(),
    ]);
  }
}
