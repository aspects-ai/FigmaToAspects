/**
 * OAuth 2.0 client for Aspects API
 * Implements authorization code flow with PKCE (RFC 7636)
 * Matches the backend API specification
 */

import { TokenResponse, UserInfoResponse } from "types";

export interface OAuthConfig {
  webAppUrl: string; // e.g., "https://aspects.ai" or "http://localhost:3003"
  apiUrl: string; // e.g., "https://api.aspects.ai" or "http://localhost:5003"
  clientId: string; // "figma_plugin_v1"
  redirectUri: string; // "figma://plugin/842128343887142055/callback"
}

export class AspectsOAuthClient {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Create OAuth session for polling-based flow
   * Returns write key that will be used in state parameter
   */
  async createSession(
    clientId: string,
    readKey: string,
  ): Promise<{ writeKey: string; expiresIn: number }> {
    const response = await fetch(`${this.config.apiUrl}/oauth/session/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        readKey,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to create OAuth session: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Build OAuth authorization URL
   * User will be redirected to this URL to log in and authorize the plugin
   *
   * Note: Uses manual URL encoding instead of URLSearchParams
   * because URLSearchParams is not available in Figma plugin sandbox
   */
  buildAuthUrl(codeChallenge: string, writeKey: string): string {
    const params = {
      responseType: "code",
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      codeChallenge: codeChallenge,
      codeChallengeMethod: "S256",
      state: writeKey, // Write key goes in state parameter
    };

    // Manually build query string (URLSearchParams not available in Figma sandbox)
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");

    return `${this.config.apiUrl}/oauth/authorize?${queryString}`;
  }

  /**
   * Poll for OAuth completion
   * Returns tokens when user completes authorization
   * Polls every 5 seconds with 10 minute timeout
   * Pauses polling when window is not visible (backgrounded)
   */
  async pollForTokens(
    readKey: string,
    onStatusUpdate?: (message: string) => void,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    const startTime = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < timeout) {
      // Check if window/document is visible (pause polling when backgrounded)
      // Use both document.hidden and document.hasFocus() for better detection
      const isDocumentHidden = typeof document !== "undefined" ? document.hidden : false;
      const hasDocumentFocus = typeof document !== "undefined" ? document.hasFocus() : true;
      const isVisible = !isDocumentHidden && hasDocumentFocus;

      if (!isVisible) {
        // Window is backgrounded, wait before checking again
        onStatusUpdate?.("Paused (Figma is backgrounded)");
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        continue;
      }

      try {
        onStatusUpdate?.("Waiting for authorization...");
        const response = await fetch(`${this.config.apiUrl}/oauth/poll/${readKey}`);

        if (response.ok) {
          const data = await response.json();
          if (data.status === "completed") {
            // Success! User has authorized
            onStatusUpdate?.("Authorization complete!");
            return {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              user: data.user,
            };
          } else if (data.status === "pending") {
            // Still waiting for user to authorize
            onStatusUpdate?.("Waiting for authorization...");
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            continue;
          }
        } else if (response.status === 404) {
          // Session expired or not found
          throw new Error("OAuth session expired. Please try again.");
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("expired")) {
          throw error;
        }
        // Network error, continue polling
        console.warn("Polling error:", error);
        onStatusUpdate?.("Network error, retrying...");
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error("OAuth authorization timed out after 10 minutes");
  }

  /**
   * Exchange authorization code for tokens
   * Called after user authorizes and is redirected back to plugin
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
  ): Promise<TokenResponse> {
    const response = await fetch(`${this.config.apiUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grantType: "authorization_code",
        code: code,
        redirectUri: this.config.redirectUri,
        codeVerifier: codeVerifier,
        clientId: this.config.clientId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "unknown_error",
        error_description: response.statusText,
      }));
      throw new Error(
        errorData.error_description ||
          errorData.error ||
          `Token exchange failed: ${response.status}`,
      );
    }

    return await response.json();
  }

  /**
   * Refresh access token using refresh token
   * Access tokens expire after 1 hour
   * Note: Refresh tokens are rotated - always store the new one
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${this.config.apiUrl}/oauth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grantType: "refresh_token",
        refreshToken: refreshToken,
        clientId: this.config.clientId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "invalid_grant",
        error_description: "Refresh token expired",
      }));
      throw new Error(
        errorData.error_description ||
          errorData.error ||
          `Token refresh failed: ${response.status}`,
      );
    }

    return await response.json();
  }

  /**
   * Get current user info (validates token)
   */
  async getUserInfo(accessToken: string): Promise<UserInfoResponse> {
    const response = await fetch(`${this.config.apiUrl}/oauth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Revoke access token (logout)
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await fetch(`${this.config.apiUrl}/oauth/revoke`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      // Best-effort logout - don't throw
      console.warn("Failed to revoke token:", error);
    }
  }
}
