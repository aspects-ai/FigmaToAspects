import { tailwindCodeGenTextStyles } from "./../../../packages/backend/src/tailwind/tailwindMain";
import {
  run,
  flutterMain,
  tailwindMain,
  swiftuiMain,
  htmlMain,
  composeMain,
  postSettingsChanged,
} from "backend";
import { nodesToJSON } from "backend/src/altNodes/jsonNodeConversion";
import { retrieveGenericSolidUIColors } from "backend/src/common/retrieveUI/retrieveColors";
import { flutterCodeGenTextStyles } from "backend/src/flutter/flutterMain";
import { htmlCodeGenTextStyles } from "backend/src/html/htmlMain";
import { swiftUICodeGenTextStyles } from "backend/src/swiftui/swiftuiMain";
import { composeCodeGenTextStyles } from "backend/src/compose/composeMain";
import {
  PluginSettings,
  SettingWillChangeMessage,
  ConfigureImageUploadMessage,
  AspectsBackendConfig,
  AuthInitiateMessage,
  AuthCallbackMessage,
  LogoutMessage,
} from "types";
import { imageUploadService } from "backend/src/common/imageUploadService";
import { AspectsBackendClient } from "backend/src/common/aspectsBackendClient";
import {
  AuthStorage,
  AspectsOAuthClient,
  authTokenProvider,
} from "auth";

let userPluginSettings: PluginSettings;

export const defaultPluginSettings: PluginSettings = {
  framework: "HTML",
  showLayerNames: false,
  useOldPluginVersion2025: false,
  responsiveRoot: false,
  flutterGenerationMode: "snippet",
  swiftUIGenerationMode: "snippet",
  composeGenerationMode: "snippet",
  roundTailwindValues: true,
  roundTailwindColors: true,
  useColorVariables: true,
  customTailwindPrefix: "",
  imageUploadMode: "upload",
  embedVectors: true,
  htmlGenerationMode: "html",
  tailwindGenerationMode: "jsx",
  baseFontSize: 16,
  useTailwind4: false,
  thresholdPercent: 15,
  baseFontFamily: "",
};

// A helper type guard to ensure the key belongs to the PluginSettings type
function isKeyOfPluginSettings(key: string): key is keyof PluginSettings {
  return key in defaultPluginSettings;
}

const getUserSettings = async () => {
  const possiblePluginSrcSettings =
    (await figma.clientStorage.getAsync("userPluginSettings")) ?? {};

  const updatedPluginSrcSettings = {
    ...defaultPluginSettings,
    ...Object.keys(defaultPluginSettings).reduce((validSettings, key) => {
      if (
        isKeyOfPluginSettings(key) &&
        key in possiblePluginSrcSettings &&
        typeof possiblePluginSrcSettings[key] ===
          typeof defaultPluginSettings[key]
      ) {
        validSettings[key] = possiblePluginSrcSettings[key] as any;
      }
      return validSettings;
    }, {} as Partial<PluginSettings>),
  };

  userPluginSettings = updatedPluginSrcSettings as PluginSettings;
  return userPluginSettings;
};

const initSettings = async () => {
  await getUserSettings();
  postSettingsChanged(userPluginSettings);
  // Removed auto-run - user must click Preview or Export
};

// Used to prevent running from happening again.
let isLoading = false;
const safeRun = async (settings: PluginSettings) => {
  if (isLoading === false) {
    try {
      isLoading = true;
      await run(settings);
      // hack to make it not immediately set to false when complete. (executes on next frame)
      setTimeout(() => {
        isLoading = false;
      }, 1);
    } catch (e) {
      isLoading = false; // Make sure to reset the flag on error
      if (e && typeof e === "object" && "message" in e) {
        const error = e as Error;
        console.log("error: ", error.stack);
        figma.ui.postMessage({ type: "error", error: error.message });
      } else {
        // Handle non-standard errors or unknown error types
        const errorMessage = String(e);
        console.log("Unknown error: ", errorMessage);
        figma.ui.postMessage({
          type: "error",
          error: errorMessage || "Unknown error occurred",
        });
      }

      // Send a message to reset the UI state
      figma.ui.postMessage({ type: "conversion-complete", success: false });
    }
  }
};

// Development configuration: These will be replaced at build time by esbuild --define
declare const DEV_BACKEND_URL: string | undefined;
declare const DEV_AUTH_TOKEN: string | undefined;

// OAuth client instance
let oauthClient: AspectsOAuthClient;

// Initialize auth system
const initializeAuth = async () => {
  const isDevelopment = typeof DEV_BACKEND_URL !== "undefined";
  const webAppUrl = isDevelopment
    ? "http://localhost:3003"
    : "https://aspects.ai";
  const apiUrl = isDevelopment
    ? "http://localhost:5003"
    : "https://api.aspects.ai";

  // Initialize OAuth client
  // Note: Figma plugins cannot use figma:// custom URI schemes
  // The callback goes to the web app, which will display the auth code to copy
  const redirectUri = `${webAppUrl}/oauth/callback`;

  oauthClient = new AspectsOAuthClient({
    webAppUrl,
    apiUrl,
    clientId: "figma_plugin_v1",
    redirectUri,
  });

  // Configure auth token provider
  authTokenProvider.configure(oauthClient);

  // Configure backend client with auth
  const backendClient = new AspectsBackendClient({
    baseUrl: apiUrl,
    getAuthToken: async () => {
      try {
        return await authTokenProvider.getAccessToken();
      } catch (error) {
        // User not authenticated, return undefined to allow unauthenticated requests
        console.log("[auth] User not authenticated:", error);
        return undefined;
      }
    },
  });

  imageUploadService.configure(backendClient);

  // Check auth status and notify UI
  const isAuth = await authTokenProvider.isAuthenticated();
  const user = await AuthStorage.getUser();

  figma.ui.postMessage({
    type: "auth-status",
    authState: {
      isAuthenticated: isAuth,
      user: user,
    },
  });

  console.log(
    "[auth] Auth initialized, authenticated:",
    isAuth,
    "user:",
    user?.email,
  );
};

// Development helper: Auto-configure image upload from build-time constants
const configureImageUploadFromDevSettings = () => {
  // Check if build-time dev constants are defined
  if (
    typeof DEV_BACKEND_URL !== "undefined" &&
    typeof DEV_AUTH_TOKEN !== "undefined"
  ) {
    const client = new AspectsBackendClient({
      baseUrl: DEV_BACKEND_URL,
      getAuthToken: DEV_AUTH_TOKEN,
    });
    imageUploadService.configure(client);
  }
};

const standardMode = async () => {
  figma.showUI(__html__, { width: 450, height: 700, themeColors: true });
  await initSettings();

  // Initialize auth system (production)
  await initializeAuth();

  // Auto-configure image upload if dev config is set at build time (dev override)
  configureImageUploadFromDevSettings();

  // Send initial selection state to UI
  const initialSelection = figma.currentPage.selection.length > 0;
  figma.ui.postMessage({
    type: "selection-state",
    hasSelection: initialSelection,
  });

  // Track selection changes but don't auto-convert
  figma.on("selectionchange", () => {
    const hasSelection = figma.currentPage.selection.length > 0;
    figma.ui.postMessage({
      type: "selection-state",
      hasSelection: hasSelection,
    });
  });

  // Removed documentchange listener - no longer needed without auto-conversion

  figma.ui.onmessage = async (msg) => {
    // Auth message handlers
    if (msg.type === "auth-initiate") {
      try {
        console.log("[auth] Auth initiate requested");

        // PKCE parameters are now generated in the UI thread and passed here
        const { verifier, challenge, state } = msg as AuthInitiateMessage;

        // Store for later verification
        await AuthStorage.savePKCEVerifier(verifier);
        await AuthStorage.saveOAuthState(state);

        // Build auth URL
        const authUrl = oauthClient.buildAuthUrl(challenge, state);

        console.log("[auth] Opening auth URL:", authUrl);

        // Open in browser
        figma.openExternal(authUrl);
      } catch (error) {
        console.error("[auth] Failed to initiate auth:", error);
        figma.ui.postMessage({
          type: "auth-error",
          error:
            error instanceof Error ? error.message : "Failed to initiate auth",
        });
      }
    } else if (msg.type === "auth-callback") {
      try {
        const { code, state } = msg as AuthCallbackMessage;
        console.log("[auth] Auth callback received");

        // Verify state (CSRF protection)
        const storedState = await AuthStorage.getOAuthState();
        if (state !== storedState) {
          throw new Error("Invalid state parameter - possible CSRF attack");
        }

        // Get PKCE verifier
        const verifier = await AuthStorage.getPKCEVerifier();
        if (!verifier) {
          throw new Error("PKCE verifier not found");
        }

        // Exchange code for tokens
        console.log("[auth] Exchanging code for tokens");
        const tokenResponse = await oauthClient.exchangeCodeForToken(
          code,
          verifier,
        );

        // Store tokens and user
        await AuthStorage.saveTokens({
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresAt: Date.now() / 1000 + tokenResponse.expiresIn,
        });
        await AuthStorage.saveUser(tokenResponse.user);

        // Clean up temporary storage
        await AuthStorage.clearPKCEVerifier();
        await AuthStorage.clearOAuthState();

        console.log("[auth] Auth complete, user:", tokenResponse.user.email);

        // Notify UI
        figma.ui.postMessage({
          type: "auth-complete",
          user: tokenResponse.user,
        });
      } catch (error) {
        console.error("[auth] Auth callback failed:", error);
        figma.ui.postMessage({
          type: "auth-error",
          error:
            error instanceof Error ? error.message : "Authentication failed",
        });
      }
    } else if (msg.type === "logout") {
      try {
        console.log("[auth] Logout requested");
        const tokens = await AuthStorage.getTokens();
        if (tokens) {
          await oauthClient.revokeToken(tokens.accessToken);
        }
        await AuthStorage.clearAll();

        figma.ui.postMessage({
          type: "auth-status",
          authState: {
            isAuthenticated: false,
            user: null,
          },
        });

        console.log("[auth] Logout complete");
      } catch (error) {
        console.error("[auth] Logout error:", error);
        // Clear tokens anyway
        await AuthStorage.clearAll();
      }
    } else if (msg.type === "configure-image-upload") {
      const { config } = msg as ConfigureImageUploadMessage;
      const client = new AspectsBackendClient(config);

      imageUploadService.configure(client);
    } else if (msg.type === "pluginSettingWillChange") {
      const { key, value } = msg as SettingWillChangeMessage<unknown>;
      (userPluginSettings as any)[key] = value;
      figma.clientStorage.setAsync("userPluginSettings", userPluginSettings);
      // Send updated settings back to UI
      postSettingsChanged(userPluginSettings);
      // Removed auto-run on settings change
    } else if (msg.type === "preview-requested") {
      await safeRun(userPluginSettings);
    } else if (msg.type === "export-requested") {
      await safeRun(userPluginSettings);
    } else if (msg.type === "get-selection-json") {

      const nodes = figma.currentPage.selection;
      if (nodes.length === 0) {
        figma.ui.postMessage({
          type: "selection-json",
          data: { message: "No nodes selected" },
        });
        return;
      }
      const result: {
        json?: SceneNode[];
        oldConversion?: any;
        newConversion?: any;
      } = {};

      try {
        result.json = (await Promise.all(
          nodes.map(
            async (node) =>
              (
                (await node.exportAsync({
                  format: "JSON_REST_V1",
                })) as any
              ).document,
          ),
        )) as SceneNode[];
      } catch (error) {
        console.error("Error exporting JSON:", error);
      }

      try {
        const newNodes = await nodesToJSON(nodes, userPluginSettings);
        const removeParent = (node: any) => {
          if (node.parent) {
            delete node.parent;
          }
          if (node.children) {
            node.children.forEach(removeParent);
          }
        };
        newNodes.forEach(removeParent);
        result.newConversion = newNodes;
      } catch (error) {
        console.error("Error in new conversion:", error);
      }

      const nodeJson = result;

      // Send the JSON data back to the UI
      figma.ui.postMessage({
        type: "selection-json",
        data: nodeJson,
      });
    }
  };
};

const codegenMode = async () => {
  // figma.showUI(__html__, { visible: false });
  await getUserSettings();

  figma.codegen.on(
    "generate",
    async ({ language, node }: CodegenEvent): Promise<CodegenResult[]> => {
      const convertedSelection = await nodesToJSON([node], userPluginSettings);

      switch (language) {
        case "html":
          return [
            {
              title: "Code",
              code: (
                await htmlMain(
                  convertedSelection,
                  { ...userPluginSettings, htmlGenerationMode: "html" },
                  true,
                )
              ).html,
              language: "HTML",
            },
            {
              title: "Text Styles",
              code: htmlCodeGenTextStyles(userPluginSettings),
              language: "HTML",
            },
          ];
        case "html_jsx":
          return [
            {
              title: "Code",
              code: (
                await htmlMain(
                  convertedSelection,
                  { ...userPluginSettings, htmlGenerationMode: "jsx" },
                  true,
                )
              ).html,
              language: "HTML",
            },
            {
              title: "Text Styles",
              code: htmlCodeGenTextStyles(userPluginSettings),
              language: "HTML",
            },
          ];

        case "html_svelte":
          return [
            {
              title: "Code",
              code: (
                await htmlMain(
                  convertedSelection,
                  { ...userPluginSettings, htmlGenerationMode: "svelte" },
                  true,
                )
              ).html,
              language: "HTML",
            },
            {
              title: "Text Styles",
              code: htmlCodeGenTextStyles(userPluginSettings),
              language: "HTML",
            },
          ];

        case "html_styled_components":
          return [
            {
              title: "Code",
              code: (
                await htmlMain(
                  convertedSelection,
                  {
                    ...userPluginSettings,
                    htmlGenerationMode: "styled-components",
                  },
                  true,
                )
              ).html,
              language: "HTML",
            },
            {
              title: "Text Styles",
              code: htmlCodeGenTextStyles(userPluginSettings),
              language: "HTML",
            },
          ];

        case "tailwind":
        case "tailwind_jsx":
          return [
            {
              title: "Code",
              code: await tailwindMain(convertedSelection, {
                ...userPluginSettings,
                tailwindGenerationMode:
                  language === "tailwind_jsx" ? "jsx" : "html",
              }),
              language: "HTML",
            },
            // {
            //   title: "Style",
            //   code: tailwindMain(convertedSelection, defaultPluginSettings),
            //   language: "HTML",
            // },
            {
              title: "Tailwind Colors",
              code: (await retrieveGenericSolidUIColors("Tailwind"))
                .map((d) => {
                  let str = `${d.hex};`;
                  if (d.colorName !== d.hex) {
                    str += ` // ${d.colorName}`;
                  }
                  if (d.meta) {
                    str += ` (${d.meta})`;
                  }
                  return str;
                })
                .join("\n"),
              language: "JAVASCRIPT",
            },
            {
              title: "Text Styles",
              code: tailwindCodeGenTextStyles(),
              language: "HTML",
            },
          ];
        case "flutter":
          return [
            {
              title: "Code",
              code: flutterMain(convertedSelection, {
                ...userPluginSettings,
                flutterGenerationMode: "snippet",
              }),
              language: "SWIFT",
            },
            {
              title: "Text Styles",
              code: flutterCodeGenTextStyles(),
              language: "SWIFT",
            },
          ];
        case "swiftUI":
          return [
            {
              title: "SwiftUI",
              code: swiftuiMain(convertedSelection, {
                ...userPluginSettings,
                swiftUIGenerationMode: "snippet",
              }),
              language: "SWIFT",
            },
            {
              title: "Text Styles",
              code: swiftUICodeGenTextStyles(),
              language: "SWIFT",
            },
          ];
        // case "compose":
        //   return [
        //     {
        //       title: "Jetpack Compose",
        //       code: composeMain(convertedSelection, {
        //         ...userPluginSettings,
        //         composeGenerationMode: "snippet",
        //       }),
        //       language: "KOTLIN",
        //     },
        //     {
        //       title: "Text Styles",
        //       code: composeCodeGenTextStyles(),
        //       language: "KOTLIN",
        //     },
        //   ];
        default:
          break;
      }

      const blocks: CodegenResult[] = [];
      return blocks;
    },
  );
};

switch (figma.mode) {
  case "default":
  case "inspect":
    standardMode();
    break;
  case "codegen":
    codegenMode();
    break;
  default:
    break;
}
