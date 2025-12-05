import {
  AspectsOAuthClient,
  AuthStorage,
  authTokenProvider,
  generateReadKey,
} from "auth";
import {
  flutterMain,
  htmlMain,
  postSettingsChanged,
  run,
  swiftuiMain,
  tailwindMain
} from "backend";
import { nodesToJSON } from "backend/src/altNodes/jsonNodeConversion";
import { AspectsBackendClient } from "backend/src/common/aspectsBackendClient";
import { imageUploadService } from "backend/src/common/imageUploadService";
import { convertToCode } from "backend/src/common/retrieveUI/convertToCode";
import { retrieveGenericSolidUIColors } from "backend/src/common/retrieveUI/retrieveColors";
import { flutterCodeGenTextStyles } from "backend/src/flutter/flutterMain";
import { htmlCodeGenTextStyles } from "backend/src/html/htmlMain";
import { swiftUICodeGenTextStyles } from "backend/src/swiftui/swiftuiMain";
import {
  AuthInitiateMessage,
  ConfigureImageUploadMessage,
  PluginSettings,
  SettingWillChangeMessage
} from "types";
import { tailwindCodeGenTextStyles } from "./../../../packages/backend/src/tailwind/tailwindMain";

let userPluginSettings: PluginSettings;

// Helper to convert string to Uint8Array (TextEncoder not available in Figma sandbox)
function stringToUint8Array(str: string): Uint8Array {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

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
  embedImages: true
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

// Debounce timer for screenshot capture
let screenshotDebounceTimer: number | null = null;

// Capture screenshot of selection and send to UI
const captureSelectionScreenshot = () => {
  // Debounce: wait 150ms after last selection change before capturing
  if (screenshotDebounceTimer !== null) {
    clearTimeout(screenshotDebounceTimer);
  }

  screenshotDebounceTimer = setTimeout(async () => {
    screenshotDebounceTimer = null;

    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.ui.postMessage({
        type: "screenshot-preview",
        screenshots: null,
        size: { width: 0, height: 0 },
      });
      return;
    }

    try {
      // Calculate bounding box and collect screenshots
      let totalWidth = 0;
      let maxHeight = 0;

      const screenshotData: Array<{ base64: string; width: number; height: number }> = [];

      // Export at a reasonable size for preview (max 400px on longest side)
      // This balances quality with performance
      const MAX_EXPORT_SIZE = 400;

      for (const node of selection) {
        if ('exportAsync' in node && 'absoluteBoundingBox' in node && node.absoluteBoundingBox) {
          const { width, height } = node.absoluteBoundingBox;

          // Use WIDTH or HEIGHT constraint to limit the exported size
          // This produces better quality than SCALE for large frames
          const longestSide = Math.max(width, height);
          const constraint = longestSide > MAX_EXPORT_SIZE
            ? { type: 'WIDTH' as const, value: width >= height ? MAX_EXPORT_SIZE : Math.round(MAX_EXPORT_SIZE * width / height) }
            : { type: 'SCALE' as const, value: 1 };

          const imageData = await node.exportAsync({
            format: 'PNG',
            constraint,
          });

          const base64 = figma.base64Encode(imageData);
          screenshotData.push({
            base64,
            width,
            height,
          });

          totalWidth += width;
          maxHeight = Math.max(maxHeight, height);
        }
      }

      if (screenshotData.length === 0) {
        figma.ui.postMessage({
          type: "screenshot-preview",
          screenshots: null,
          size: { width: 0, height: 0 },
        });
        return;
      }

      figma.ui.postMessage({
        type: "screenshot-preview",
        screenshots: screenshotData,
        size: { width: totalWidth, height: maxHeight },
      });
    } catch (e) {
      console.error("[screenshot] Failed to capture:", e);
      figma.ui.postMessage({
        type: "screenshot-preview",
        screenshots: null,
        size: { width: 0, height: 0 },
      });
    }
  }, 150) as unknown as number;
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
        console.error("error: ", error.stack);
        figma.ui.postMessage({ type: "error", error: error.message });
      } else {
        // Handle non-standard errors or unknown error types
        const errorMessage = String(e);
        console.error("Unknown error: ", errorMessage);
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

// Export handler: generates code, uploads to backend, and opens deep link
const safeExport = async (settings: PluginSettings) => {
  if (isLoading === false) {
    try {
      isLoading = true;

      // Run code generation (this sends code to UI for preview)
      await run(settings);

      // Re-generate code for upload
      const selection = figma.currentPage.selection;
      if (selection.length === 0) {
        throw new Error("No selection to export");
      }
      if (selection.length > 3) {
        throw new Error("Please select a maximum of 3 elements to export");
      }

      // Generate timestamp for filenames
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);

      // Generate code for each selected node
      const files: Array<{ data: Uint8Array; filename: string; description: string }> = [];
      for (let i = 0; i < selection.length; i++) {
        const node = selection[i];
        const convertedNode = await nodesToJSON([node], settings);
        const code = await convertToCode(convertedNode, settings);
        const fileData = stringToUint8Array(code);

        files.push({
          data: fileData,
          filename: `figma-export-${timestamp}-${i + 1}.html`,
          description: `${node.name} - ${timestamp}`,
        });
      }

      // Upload to backend
      const uploadedFiles = await backendClient.uploadFiles(files);

      if (uploadedFiles.length === 0) {
        throw new Error("No file was uploaded");
      }

      const attachmentId = uploadedFiles[0].id;
      const deepLinkUrl = `${webAppUrl}?attachmentPreloadIds=[${attachmentId}]`;

      // Notify UI of success
      figma.ui.postMessage({
        type: "export-success",
        attachmentId,
        deepLinkUrl,
      });

      // Open the deep link in browser
      figma.openExternal(deepLinkUrl);

      setTimeout(() => {
        isLoading = false;
      }, 1);
    } catch (e) {
      isLoading = false;
      console.error("[export] Export failed:", e);

      // Notify UI of error
      const errorMessage = e instanceof Error ? e.message : String(e);
      figma.ui.postMessage({
        type: "export-error",
        error: errorMessage,
      });

      figma.ui.postMessage({ type: "conversion-complete", success: false });
    }
  }
};

// Project generation handler: uploads files, creates project, and starts AI generation
const safeGenerateProject = async (
  settings: PluginSettings,
  projectName: string,
  prompt: string
) => {
  if (isLoading === false) {
    try {
      isLoading = true;

      // Step 1: Upload files
      figma.ui.postMessage({
        type: "project-generation-progress",
        stage: "uploading",
        message: "Uploading files...",
      });

      const selection = figma.currentPage.selection;
      if (selection.length === 0) {
        throw new Error("No selection to export");
      }
      if (selection.length > 3) {
        throw new Error("Please select a maximum of 3 elements to export");
      }

      // Generate timestamp for filenames
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);

      // Generate code for each selected node
      const files: Array<{ data: Uint8Array; filename: string; description: string }> = [];
      for (let i = 0; i < selection.length; i++) {
        const node = selection[i];
        const convertedNode = await nodesToJSON([node], settings);
        const code = await convertToCode(convertedNode, settings);
        const fileData = stringToUint8Array(code);

        files.push({
          data: fileData,
          filename: `figma-export-${timestamp}-${i + 1}.html`,
          description: `${node.name} - ${timestamp}`,
        });
      }

      // Upload to backend
      const uploadedFiles = await backendClient.uploadFiles(files);

      if (uploadedFiles.length === 0) {
        throw new Error("No file was uploaded");
      }

      // Step 2: Create project
      figma.ui.postMessage({
        type: "project-generation-progress",
        stage: "creating",
        message: "Creating project...",
      });

      // Get current user
      const user = await AuthStorage.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const project = await backendClient.createProject(
        projectName,
        "", // Empty description
        { width: 1080, height: 1080 }, // Default dimensions
        user.id
      );

      // Create conversation for the project
      const conversation = await backendClient.createConversation(
        project.id,
        user.id,
        "Import from Figma"
      );

      // Step 3: Start inference
      figma.ui.postMessage({
        type: "project-generation-progress",
        stage: "generating",
        message: "Starting generation...",
      });

      const attachmentIds = uploadedFiles.map((file) => file.id);
      const inferenceContext =
        "This is a project exported directly from the user's Figma as HTML. This is a new project generation, which means you will have an starter composition in the compositions directory that you should use as a starting point. You should: 1. Decide on an appropriate dimensions for the project; 2. Update the manifest (dimensions, title, description); 3. Replace starter composition with the desired content; 4. Optionally, update the style-guide.yml file with an appropriate style guide for the project. Remember you can write multiple files at once so do this all in a single batch of tool calls.";

      await backendClient.performInference(
        project.id,
        conversation.id,
        prompt,
        attachmentIds,
        inferenceContext
      );

      // Success! Construct deep link and open
      const deepLinkUrl = `${webAppUrl}/project/${project.id}`;

      // Notify UI of success
      figma.ui.postMessage({
        type: "project-generation-success",
        projectId: project.id,
        deepLinkUrl,
      });

      // Open the deep link in browser
      figma.openExternal(deepLinkUrl);

      setTimeout(() => {
        isLoading = false;
      }, 1);
    } catch (e) {
      isLoading = false;
      console.error("[project-gen] Generation failed:", e);

      // Determine which stage failed and extract error message
      let errorMessage: string;
      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (typeof e === "string") {
        errorMessage = e;
      } else if (e && typeof e === "object") {
        // Try to extract meaningful error info from object
        errorMessage = JSON.stringify(e);
      } else {
        errorMessage = "An unknown error occurred";
      }

      let stage = "unknown";
      if (errorMessage.includes("upload")) stage = "uploading";
      else if (errorMessage.includes("project")) stage = "creating";
      else if (errorMessage.includes("inference")) stage = "generating";

      // Notify UI of error
      figma.ui.postMessage({
        type: "project-generation-error",
        error: errorMessage,
        stage,
      });
    }
  }
};

// Development configuration: These will be replaced at build time by esbuild --define
declare const ASPECTS_BACKEND_URL: string;
declare const WEB_APP_URL: string;

// OAuth client instance
let oauthClient: AspectsOAuthClient;
// Backend client instance (global for export functionality)
let backendClient: AspectsBackendClient;
// Web app URL (global for deep linking)
let webAppUrl: string;

// Initialize auth system
const initializeAuth = async () => {
  // Initialize OAuth client
  // For polling flow: redirect URI is used to reactivate Figma after auth
  // The actual tokens come via polling, not from the redirect
  const redirectUri = "figma://plugin/1573793526647744572/callback";

  webAppUrl = WEB_APP_URL;

  oauthClient = new AspectsOAuthClient({
    webAppUrl,
    apiUrl: ASPECTS_BACKEND_URL,
    clientId: "figma_plugin_v1",
    redirectUri,
  });

  // Configure auth token provider
  authTokenProvider.configure(oauthClient);

  // Configure backend client with auth
  backendClient = new AspectsBackendClient({
    baseUrl: ASPECTS_BACKEND_URL,
    getAuthToken: async () => {
      try {
        return await authTokenProvider.getAccessToken();
      } catch (error) {
        // User not authenticated, return undefined to allow unauthenticated requests
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
};

const standardMode = async () => {
  figma.showUI(__html__, { width: 450, height: 550, themeColors: true });
  await initSettings();

  // Initialize auth system (production)
  await initializeAuth();

  // Send initial selection state to UI
  const initialSelection = figma.currentPage.selection;
  const hasInitialSelection = initialSelection.length > 0;
  const initialSelectionName = hasInitialSelection
    ? initialSelection[0].name
    : "New Project";

  figma.ui.postMessage({
    type: "selection-state",
    hasSelection: hasInitialSelection,
    selectionName: initialSelectionName,
    selectionCount: initialSelection.length,
  });

  // Capture initial screenshot if there's a selection
  if (hasInitialSelection) {
    captureSelectionScreenshot();
  }

  // Track selection changes and auto-capture screenshot
  figma.on("selectionchange", () => {
    const selection = figma.currentPage.selection;
    const hasSelection = selection.length > 0;
    const selectionName = hasSelection ? selection[0].name : "New Project";

    figma.ui.postMessage({
      type: "selection-state",
      hasSelection: hasSelection,
      selectionName: selectionName,
      selectionCount: selection.length,
    });

    // Auto-capture screenshot when selection changes
    captureSelectionScreenshot();
  });

  // Removed documentchange listener - no longer needed without auto-conversion

  figma.ui.onmessage = async (msg) => {
    // Auth message handlers
    if (msg.type === "auth-initiate") {
      try {
        // PKCE challenge generated in UI thread
        const { challenge } = msg as AuthInitiateMessage;

        // Generate read key for polling
        const readKey = generateReadKey();

        // Create OAuth session
        const { writeKey, expiresIn } = await oauthClient.createSession(
          "figma_plugin_v1",
          readKey,
        );

        // Build auth URL with write key in state parameter
        const authUrl = oauthClient.buildAuthUrl(challenge, writeKey);

        // Open in browser
        figma.openExternal(authUrl);

        // Start polling for tokens
        const { accessToken, refreshToken, user } =
          await oauthClient.pollForTokens(readKey, (status) => {
            // Send status updates to UI
            figma.ui.postMessage({
              type: "auth-polling-status",
              status,
            });
          });

        // Store tokens and user
        await AuthStorage.saveTokens({
          accessToken,
          refreshToken,
          expiresAt: Date.now() / 1000 + 3600, // 1 hour from now
        });
        await AuthStorage.saveUser(user);

        // Notify UI
        figma.ui.postMessage({
          type: "auth-complete",
          user: user,
        });
      } catch (error) {
        console.error("[auth] Auth flow failed:", error);
        figma.ui.postMessage({
          type: "auth-error",
          error:
            error instanceof Error ? error.message : "Authentication failed",
        });
      }
    } else if (msg.type === "logout") {
      try {
        const tokens = await AuthStorage.getTokens();
        if (tokens?.refreshToken) {
          await oauthClient.revokeToken(tokens.refreshToken);
        }
        await AuthStorage.clearAll();

        figma.ui.postMessage({
          type: "auth-status",
          authState: {
            isAuthenticated: false,
            user: null,
          },
        });
      } catch (error) {
        console.error("[auth] Logout error:", error);
        // Clear tokens anyway
        await AuthStorage.clearAll();
      }
    } else if (msg.type === "auth-status-request") {
      // UI is requesting current auth status
      const isAuth = await authTokenProvider.isAuthenticated();
      const user = await AuthStorage.getUser();

      figma.ui.postMessage({
        type: "auth-status",
        authState: {
          isAuthenticated: isAuth,
          user: user,
        },
      });
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
    } else if (msg.type === "project-generation-request") {
      const { projectName, prompt } = msg as any;
      await safeGenerateProject(userPluginSettings, projectName, prompt);
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
