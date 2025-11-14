/**
 * Token provider that manages token lifecycle
 * Handles automatic refresh and provides valid access tokens to API clients
 */

import { AuthTokens } from "types";
import { AuthStorage } from "./authStorage";
import { AspectsOAuthClient } from "./oauthClient";

export class AuthTokenProvider {
  private oauthClient: AspectsOAuthClient | null = null;
  private refreshPromise: Promise<string> | null = null;

  /**
   * Configure the token provider with an OAuth client
   * Must be called before using getAccessToken()
   */
  configure(oauthClient: AspectsOAuthClient): void {
    this.oauthClient = oauthClient;
  }

  /**
   * Get a valid access token (refreshes automatically if needed)
   * Throws if not authenticated or if refresh fails
   */
  async getAccessToken(): Promise<string> {
    // If already refreshing, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const tokens = await AuthStorage.getTokens();

    if (!tokens) {
      throw new Error("No auth tokens found - user must log in");
    }

    // Check if token is expired (with 60s buffer for clock skew)
    const now = Date.now() / 1000;
    if (tokens.expiresAt > now + 60) {
      return tokens.accessToken;
    }

    // Token expired, refresh it
    return this.refreshAccessToken(tokens.refreshToken);
  }

  /**
   * Refresh access token using refresh token
   * Uses a lock to prevent multiple simultaneous refreshes
   */
  private async refreshAccessToken(refreshToken: string): Promise<string> {
    if (!this.oauthClient) {
      throw new Error("OAuth client not configured");
    }

    // Prevent multiple simultaneous refreshes
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response =
          await this.oauthClient!.refreshAccessToken(refreshToken);

        const newTokens: AuthTokens = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken, // Backend rotates refresh tokens
          expiresAt: Date.now() / 1000 + response.expiresIn,
        };

        await AuthStorage.saveTokens(newTokens);

        return newTokens.accessToken;
      } catch (error) {
        // Refresh failed - clear tokens so user can re-authenticate
        await AuthStorage.clearAll();
        throw new Error(
          "Session expired - please log in again: " +
            (error instanceof Error ? error.message : String(error)),
        );
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await AuthStorage.getTokens();
    return tokens !== null;
  }

  /**
   * Clear all tokens (logout)
   */
  async clearTokens(): Promise<void> {
    await AuthStorage.clearAll();
  }
}

// Singleton instance for use across the plugin
export const authTokenProvider = new AuthTokenProvider();
