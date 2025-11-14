/**
 * Auth package - OAuth 2.0 authentication for Aspects Figma Plugin
 * Exports all necessary components for implementing OAuth flow
 */

export { AuthStorage } from "./authStorage";
export { AspectsOAuthClient, type OAuthConfig } from "./oauthClient";
export { AuthTokenProvider, authTokenProvider } from "./authTokenProvider";
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generateReadKey,
} from "./pkceHelper";
