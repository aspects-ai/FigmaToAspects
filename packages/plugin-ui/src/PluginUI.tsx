import copy from "copy-to-clipboard";
import GradientsPanel from "./components/GradientsPanel";
import ColorsPanel from "./components/ColorsPanel";
import CodePanel from "./components/CodePanel";
import About from "./components/About";
import WarningsPanel from "./components/WarningsPanel";
import {
  Framework,
  HTMLPreview,
  LinearGradientConversion,
  PluginSettings,
  SolidColorConversion,
  Warning,
  AuthState,
} from "types";
import {
  preferenceOptions,
  selectPreferenceOptions,
} from "./codegenPreferenceOptions";
import Loading from "./components/Loading";
import { useState } from "react";
import { InfoIcon, ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import logoFull from "../../../assets/full_logo.svg";
import { AuthStatusButton } from "./components/AuthStatusButton";

type PluginUIProps = {
  code: string;
  htmlPreview: HTMLPreview;
  warnings: Warning[];
  selectedFramework: Framework;
  setSelectedFramework: (framework: Framework) => void;
  settings: PluginSettings | null;
  onPreferenceChanged: (
    key: keyof PluginSettings,
    value: boolean | string | number,
  ) => void;
  colors: SolidColorConversion[];
  gradients: LinearGradientConversion[];
  isLoading: boolean;
  hasSelection: boolean;
  onPreviewRequest: () => void;
  onExportRequest: () => void;
  onPromptSubmit: (projectName: string, prompt: string) => void;
  isExporting: boolean;
  exportSuccess: boolean;
  authState: AuthState;
  onLogin: () => void;
  onLogout: () => void;
  defaultProjectName: string;
  projectGenerationLoading: boolean;
  projectGenerationError: string | null;
};

export const PluginUI = (props: PluginUIProps) => {
  const [showAbout, setShowAbout] = useState(false);
  const [otherDetailsExpanded, setOtherDetailsExpanded] = useState(false);

  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [previewViewMode, setPreviewViewMode] = useState<
    "desktop" | "mobile" | "precision"
  >("precision");
  const [previewBgColor, setPreviewBgColor] = useState<"white" | "black">(
    "white",
  );

  // Removed full-screen loading - now handled inline in preview section

  const isEmpty = props.code === "";
  const warnings = props.warnings ?? [];

  // Check if we're in development mode (show warnings)
  const isDevelopment = props.settings?.useOldPluginVersion2025 === true;

  return (
    <div className="flex flex-col h-full dark:text-white">
      <div className="p-2 dark:bg-card">
        <div className="flex justify-between items-center bg-muted dark:bg-card rounded-lg p-2">
          <img src={logoFull} alt="Aspects" className="h-12 dark:invert" />
          <div className="flex items-center gap-2">
            <AuthStatusButton
              isAuthenticated={props.authState.isAuthenticated}
              user={props.authState.user}
              onLogin={props.onLogin}
              onLogout={props.onLogout}
            />
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                showAbout
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted hover:bg-primary/90 hover:text-primary-foreground"
              }`}
              onClick={() => setShowAbout(!showAbout)}
              aria-label="About"
            >
              <InfoIcon size={16} />
            </button>
          </div>
        </div>
      </div>
      <div
        style={{
          height: 1,
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.12)",
        }}
      ></div>
      <div className="flex flex-col h-full overflow-y-auto">
        {showAbout ? (
          <About />
        ) : (
          <div className="flex flex-col items-center px-4 py-2 gap-2 dark:bg-transparent">
            {isDevelopment && warnings.length > 0 && <WarningsPanel warnings={warnings} />}

            <CodePanel
              code={props.code}
              selectedFramework={props.selectedFramework}
              preferenceOptions={preferenceOptions}
              selectPreferenceOptions={selectPreferenceOptions}
              settings={props.settings}
              onPreferenceChanged={props.onPreferenceChanged}
              hasSelection={props.hasSelection}
              onPreviewRequest={props.onPreviewRequest}
              onExportRequest={props.onExportRequest}
              onPromptSubmit={props.onPromptSubmit}
              isLoading={props.isLoading}
              isExporting={props.isExporting}
              exportSuccess={props.exportSuccess}
              htmlPreview={props.htmlPreview}
              previewExpanded={previewExpanded}
              setPreviewExpanded={setPreviewExpanded}
              previewViewMode={previewViewMode}
              setPreviewViewMode={setPreviewViewMode}
              previewBgColor={previewBgColor}
              setBgColor={setPreviewBgColor}
              defaultProjectName={props.defaultProjectName}
              projectGenerationLoading={props.projectGenerationLoading}
              projectGenerationError={props.projectGenerationError}
            />

            {(props.colors.length > 0 || props.gradients.length > 0) && (
              <div className="w-full flex flex-col bg-card border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOtherDetailsExpanded(!otherDetailsExpanded)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <p className="text-sm font-medium dark:text-white">Other Details</p>
                  {otherDetailsExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {otherDetailsExpanded && (
                  <div className="px-3 pb-3 border-t dark:border-neutral-700 space-y-3">
                    {props.colors.length > 0 && (
                      <ColorsPanel
                        colors={props.colors}
                        onColorClick={(value) => {
                          copy(value);
                        }}
                      />
                    )}

                    {props.gradients.length > 0 && (
                      <GradientsPanel
                        gradients={props.gradients}
                        onColorClick={(value) => {
                          copy(value);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
