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
   * Build OAuth authorization URL
   * User will be redirected to this URL to log in and authorize the plugin
   *
   * Note: Uses manual URL encoding instead of URLSearchParams
   * because URLSearchParams is not available in Figma plugin sandbox
   */
  buildAuthUrl(codeChallenge: string, state: string): string {
    const params = {
      responseType: "code",
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      codeChallenge: codeChallenge,
      codeChallengeMethod: "S256",
      state: state,
    };

    // Manually build query string (URLSearchParams not available in Figma sandbox)
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");

    return `${this.config.webAppUrl}/oauth/consent?${queryString}`;
  }

  /**
   * Exchange authorization code for tokens
   * Called after user authorizes and is redirected back to plugin
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
  ): Promise<TokenResponse> {
    const response = await fetch(`${this.config.apiUrl}/api/oauth/token`, {
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
    const response = await fetch(`${this.config.apiUrl}/api/oauth/refresh`, {
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
    const response = await fetch(`${this.config.apiUrl}/api/oauth/me`, {
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
      await fetch(`${this.config.apiUrl}/api/oauth/revoke`, {
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
