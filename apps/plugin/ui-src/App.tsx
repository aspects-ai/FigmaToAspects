import copy from "copy-to-clipboard";
import { PluginUI, AuthDialog } from "plugin-ui";
import { downloadFile, generateHtmlFilename } from "plugin-ui/src/lib/utils";
import { useEffect, useState } from "react";
import {
  ConversionMessage,
  ErrorMessage,
  Framework,
  HTMLPreview,
  LinearGradientConversion,
  Message,
  PluginSettings,
  SettingsChangedMessage,
  SolidColorConversion,
  Warning,
  AuthState,
  AuthCompleteMessage,
  AuthErrorMessage,
  AuthStatusMessage,
  AuthPollingStatusMessage,
} from "types";
import {
  postExportRequest,
  postPreviewRequest,
  postUISettingsChangingMessage,
  postAuthInitiate,
  postLogout,
  postAuthStatusRequest,
} from "./messaging";
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from "auth";

interface AppState {
  code: string;
  selectedFramework: Framework;
  isLoading: boolean;
  isExporting: boolean;
  hasSelection: boolean;
  htmlPreview: HTMLPreview;
  settings: PluginSettings | null;
  colors: SolidColorConversion[];
  gradients: LinearGradientConversion[];
  warnings: Warning[];
  authState: AuthState;
  showAuthDialog: boolean;
  pendingExport: boolean;
  isAuthenticating: boolean;
  authPollingStatus: string | null;
  currentAuthUrl: string | null;
}

const emptyPreview = { size: { width: 0, height: 0 }, content: "" };

export default function App() {
  const [state, setState] = useState<AppState>({
    code: "",
    selectedFramework: "HTML",
    isLoading: false,
    isExporting: false,
    hasSelection: false,
    htmlPreview: emptyPreview,
    settings: null,
    colors: [],
    gradients: [],
    warnings: [],
    authState: {
      isAuthenticated: false,
      user: null,
    },
    showAuthDialog: false,
    pendingExport: false,
    isAuthenticating: false,
    authPollingStatus: null,
    currentAuthUrl: null,
  });

  const rootStyles = getComputedStyle(document.documentElement);
  const figmaColorBgValue = rootStyles
    .getPropertyValue("--figma-color-bg")
    .trim();

  useEffect(() => {
    window.onmessage = (event: MessageEvent) => {
      const untypedMessage = event.data.pluginMessage as Message;
      console.log("[ui] message received:", untypedMessage);

      switch (untypedMessage.type) {
        case "conversionStart":
          setState((prevState) => ({
            ...prevState,
            code: "",
            isLoading: true,
          }));
          break;

        case "code":
          const conversionMessage = untypedMessage as ConversionMessage;
          setState((prevState) => {
            const newState = {
              ...prevState,
              ...conversionMessage,
              selectedFramework: conversionMessage.settings.framework,
              isLoading: false,
            };

            // If this was an export request, trigger download
            if (prevState.isExporting) {
              const filename = generateHtmlFilename();
              downloadFile(conversionMessage.code, filename, "text/html");
              newState.isExporting = false;
            }

            return newState;
          });
          break;

        case "pluginSettingChanged":
        case "pluginSettingsChanged":
          const settingsMessage = untypedMessage as SettingsChangedMessage;
          setState((prevState) => ({
            ...prevState,
            settings: settingsMessage.settings,
            selectedFramework: settingsMessage.settings.framework,
          }));
          break;

        case "empty":
          // const emptyMessage = untypedMessage as EmptyMessage;
          setState((prevState) => ({
            ...prevState,
            code: "",
            htmlPreview: emptyPreview,
            warnings: [],
            colors: [],
            gradients: [],
            isLoading: false,
            hasSelection: false,
          }));
          break;

        case "selection-state":
          const selectionMessage = untypedMessage as any;
          setState((prevState) => ({
            ...prevState,
            hasSelection: selectionMessage.hasSelection,
          }));
          break;

        case "error":
          const errorMessage = untypedMessage as ErrorMessage;

          setState((prevState) => ({
            ...prevState,
            colors: [],
            gradients: [],
            code: `Error :(\n// ${errorMessage.error}`,
            isLoading: false,
          }));
          break;

        case "selection-json":
          const json = event.data.pluginMessage.data;
          copy(JSON.stringify(json, null, 2));
          break;

        case "auth-polling-status":
          const pollingMessage = untypedMessage as AuthPollingStatusMessage;
          setState((prevState) => ({
            ...prevState,
            authPollingStatus: pollingMessage.status,
            showAuthDialog: true, // Keep dialog open during polling
          }));
          break;

        case "auth-complete":
          const authCompleteMessage = untypedMessage as AuthCompleteMessage;
          setState((prevState) => {
            const newState = {
              ...prevState,
              authState: {
                isAuthenticated: true,
                user: authCompleteMessage.user,
              },
              showAuthDialog: false,
              isAuthenticating: false,
              authPollingStatus: null,
              currentAuthUrl: null,
            };

            // If export was pending, trigger download automatically
            // The plugin will have already processed the export with auth
            return newState;
          });

          // If export was pending, retry it now that we're authenticated
          if (state.pendingExport) {
            setState((prevState) => ({ ...prevState, pendingExport: false }));
            postExportRequest({ targetOrigin: "*" });
          }
          break;

        case "auth-error":
          const authErrorMessage = untypedMessage as AuthErrorMessage;
          console.error("[ui] Auth error:", authErrorMessage.error);
          alert(`Authentication failed: ${authErrorMessage.error}`);
          setState((prevState) => ({
            ...prevState,
            showAuthDialog: false,
            pendingExport: false,
            isAuthenticating: false,
            authPollingStatus: null,
            currentAuthUrl: null,
          }));
          break;

        case "auth-status":
          const authStatusMessage = untypedMessage as AuthStatusMessage;
          setState((prevState) => ({
            ...prevState,
            authState: authStatusMessage.authState,
          }));
          break;

        default:
          break;
      }
    };

    // Request initial auth status after message handler is ready
    postAuthStatusRequest({ targetOrigin: "*" });

    return () => {
      window.onmessage = null;
    };
  }, []);

  const handleFrameworkChange = (updatedFramework: Framework) => {
    if (updatedFramework !== state.selectedFramework) {
      setState((prevState) => ({
        ...prevState,
        // code: "// Loading...",
        selectedFramework: updatedFramework,
      }));
      postUISettingsChangingMessage("framework", updatedFramework, {
        targetOrigin: "*",
      });
    }
  };
  const handlePreferencesChange = (
    key: keyof PluginSettings,
    value: boolean | string | number,
  ) => {
    if (state.settings && state.settings[key] === value) {
      // do nothing
    } else {
      postUISettingsChangingMessage(key, value, { targetOrigin: "*" });
    }
  };

  const handlePreview = () => {
    console.log("[ui] Preview requested");
    postPreviewRequest({ targetOrigin: "*" });
  };

  const handleExport = () => {
    console.log("[ui] Export requested");

    // Check if authenticated before exporting
    if (!state.authState.isAuthenticated) {
      console.log("[ui] Not authenticated, showing auth dialog");
      setState((prevState) => ({
        ...prevState,
        showAuthDialog: true,
        pendingExport: true,
      }));
      return;
    }

    setState((prevState) => ({
      ...prevState,
      isExporting: true,
    }));
    postExportRequest({ targetOrigin: "*" });
  };

  const handleLogin = async () => {
    console.log("[ui] Login requested");
    setState((prevState) => ({
      ...prevState,
      isAuthenticating: true,
    }));

    try {
      // Generate PKCE code challenge in UI thread (has access to Web Crypto API)
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      console.log("[ui] Generated PKCE challenge");
      postAuthInitiate(challenge, { targetOrigin: "*" });
    } catch (error) {
      console.error("[ui] Failed to generate PKCE:", error);
      setState((prevState) => ({
        ...prevState,
        isAuthenticating: false,
      }));
      alert(
        `Failed to start authentication: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleAuthDialogClose = () => {
    setState((prevState) => ({
      ...prevState,
      showAuthDialog: false,
      pendingExport: false,
      authPollingStatus: null,
      currentAuthUrl: null,
      isAuthenticating: false,
    }));
  };

  const handleRetryAuth = () => {
    // Retry opening the browser - call login again
    handleLogin();
  };

  const handleManualPoll = () => {
    // Manual poll trigger - just log for now since polling is continuous
    // This is mostly for user reassurance that something is happening
    console.log("[ui] Manual poll requested");
    setState((prevState) => ({
      ...prevState,
      authPollingStatus: "Checking for authorization...",
    }));
  };

  const handleLogout = () => {
    console.log("[ui] Logout requested");
    postLogout({ targetOrigin: "*" });
  };

  const darkMode = figmaColorBgValue !== "#ffffff";

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <PluginUI
        isLoading={state.isLoading}
        code={state.code}
        warnings={state.warnings}
        selectedFramework={state.selectedFramework}
        setSelectedFramework={handleFrameworkChange}
        onPreferenceChanged={handlePreferencesChange}
        htmlPreview={state.htmlPreview}
        settings={state.settings}
        colors={state.colors}
        gradients={state.gradients}
        hasSelection={state.hasSelection}
        onPreviewRequest={handlePreview}
        onExportRequest={handleExport}
        isExporting={state.isExporting}
        authState={state.authState}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <AuthDialog
        isOpen={state.showAuthDialog}
        onClose={handleAuthDialogClose}
        onLogin={handleLogin}
        isLoading={state.isAuthenticating}
        pollingStatus={state.authPollingStatus}
        onRetry={handleRetryAuth}
        onManualPoll={handleManualPoll}
      />
    </div>
  );
}
