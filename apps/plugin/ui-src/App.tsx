import copy from "copy-to-clipboard";
import { PluginUI } from "plugin-ui";
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
} from "types";
import { postExportRequest, postPreviewRequest, postUISettingsChangingMessage } from "./messaging";

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

        default:
          break;
      }
    };

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
    setState((prevState) => ({
      ...prevState,
      isExporting: true,
    }));
    postExportRequest({ targetOrigin: "*" });
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
      />
    </div>
  );
}
