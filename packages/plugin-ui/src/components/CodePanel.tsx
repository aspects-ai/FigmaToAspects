import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Framework,
  HTMLPreview,
  LocalCodegenPreferenceOptions,
  PluginSettings,
  SelectPreferenceOptions,
} from "types";
import aspectsBanner from "../../../../assets/aspects_banner.webp";
import { cn } from "../lib/utils";
import { ExportButton } from "./ExportButton";
import FrameworkTabs from "./FrameworkTabs";
import Preview from "./Preview";
import { PreviewButton } from "./PreviewButton";
import SettingsGroup from "./SettingsGroup";
import { TailwindSettings } from "./TailwindSettings";

interface CodePanelProps {
  code: string;
  selectedFramework: Framework;
  settings: PluginSettings | null;
  preferenceOptions: LocalCodegenPreferenceOptions[];
  selectPreferenceOptions: SelectPreferenceOptions[];
  onPreferenceChanged: (
    key: keyof PluginSettings,
    value: boolean | string | number,
  ) => void;
  hasSelection: boolean;
  onPreviewRequest: () => void;
  onExportRequest: () => void;
  onPromptSubmit: (projectName: string, prompt: string) => void;
  onFormChange?: () => void;
  isLoading: boolean;
  isExporting: boolean;
  exportSuccess: boolean;
  htmlPreview: HTMLPreview;
  previewExpanded: boolean;
  setPreviewExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  previewViewMode: "desktop" | "mobile" | "precision";
  setPreviewViewMode: React.Dispatch<React.SetStateAction<"desktop" | "mobile" | "precision">>;
  previewBgColor: "white" | "black";
  setPreviewBgColor: React.Dispatch<React.SetStateAction<"white" | "black">>;
  defaultProjectName: string;
  projectGenerationLoading: boolean;
  projectGenerationError: string | null;
}

const CodePanel = (props: CodePanelProps) => {
  const [exportOptionsExpanded, setExportOptionsExpanded] = useState(false);
  const [projectName, setProjectName] = useState(props.defaultProjectName);
  const [prompt, setPrompt] = useState("");

  const {
    code,
    preferenceOptions,
    selectPreferenceOptions,
    selectedFramework,
    settings,
    onPreferenceChanged,
    hasSelection,
    onPreviewRequest,
    onPromptSubmit,
    onFormChange,
    isLoading,
    isExporting,
    exportSuccess,
    htmlPreview,
    previewExpanded,
    setPreviewExpanded,
    previewViewMode,
    setPreviewViewMode,
    previewBgColor,
    setPreviewBgColor,
    defaultProjectName,
    projectGenerationLoading,
    projectGenerationError,
  } = props;

  const isCodeEmpty = code === "";
  const hasPreview = htmlPreview && htmlPreview.content;

  // Update project name when default changes
  useEffect(() => {
    setProjectName(defaultProjectName);
  }, [defaultProjectName]);

  // Clear form fields on successful export
  useEffect(() => {
    if (exportSuccess) {
      setPrompt("");
      setProjectName(defaultProjectName);
    }
  }, [exportSuccess, defaultProjectName]);

  // Memoized preference groups
  const {
    essentialPreferences,
    stylingPreferences,
    selectableSettingsFiltered,
  } = useMemo(() => {
    const frameworkPreferences = preferenceOptions.filter((preference) =>
      preference.includedLanguages?.includes(selectedFramework),
    );

    const essentialPropertyNames = ["jsx"];
    const stylingPropertyNames = [
      "useTailwind4",
      "roundTailwindValues",
      "roundTailwindColors",
      "useColorVariables",
      "embedImages",
      "embedVectors",
      "showLayerNames",
    ];

    return {
      essentialPreferences: frameworkPreferences.filter((p) =>
        essentialPropertyNames.includes(p.propertyName),
      ),
      stylingPreferences: frameworkPreferences.filter((p) =>
        stylingPropertyNames.includes(p.propertyName),
      ),
      selectableSettingsFiltered: selectPreferenceOptions.filter((p) =>
        p.includedLanguages?.includes(selectedFramework),
      ),
    };
  }, [preferenceOptions, selectPreferenceOptions, selectedFramework]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && projectName.trim() && !projectGenerationLoading) {
      onPromptSubmit(projectName.trim(), prompt.trim());
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 mt-2">
      {/* Animate in Aspects Section */}
      <div className="flex flex-col bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
            >
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                onFormChange?.();
              }}
              disabled={projectGenerationLoading}
              placeholder="Enter project name"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md",
                "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600",
                "text-neutral-900 dark:text-white",
                "placeholder:text-neutral-400",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              required
            />
          </div>

          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
            >
              Animation Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                onFormChange?.();
              }}
              disabled={projectGenerationLoading}
              placeholder="Describe how you want to animate this design..."
              rows={3}
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md resize-none",
                "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600",
                "text-neutral-900 dark:text-white",
                "placeholder:text-neutral-400",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              required
            />
          </div>

          {projectGenerationError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
                {projectGenerationError}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <ExportButton
              onExport={handleSubmit as any}
              isLoading={isExporting || projectGenerationLoading}
              disabled={!hasSelection || !prompt.trim() || !projectName.trim()}
              showSuccess={exportSuccess}
            />
          </div>
        </form>
      </div>

      {/* Preview Section */}
      <div className="flex flex-col bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
        <div className="flex justify-end p-5">
          <PreviewButton
            onPreview={onPreviewRequest}
            isLoading={isLoading}
            disabled={!hasSelection}
          />
        </div>

        {(isLoading || hasPreview) && (
          <>
            {isLoading ? (
              <div className="flex justify-center items-center p-8 border-t dark:border-neutral-700">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading preview...</p>
                </div>
              </div>
            ) : hasPreview ? (
              <div className="border-t dark:border-neutral-700">
                <Preview
                  htmlPreview={htmlPreview}
                  expanded={previewExpanded}
                  setExpanded={setPreviewExpanded}
                  viewMode={previewViewMode}
                  setViewMode={setPreviewViewMode}
                  bgColor={previewBgColor}
                  setBgColor={setPreviewBgColor}
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Export Options Section - Hidden */}
      {/* <div className="flex flex-col bg-card border rounded-lg overflow-visible">
        <button
          onClick={() => setExportOptionsExpanded(!exportOptionsExpanded)}
          className="flex items-center justify-between px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <p className="text-sm font-medium dark:text-white">Export Options</p>
          {exportOptionsExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {exportOptionsExpanded && (
          <div className="px-3 pb-3 border-t dark:border-neutral-700">
            <SettingsGroup
              title=""
              settings={essentialPreferences}
              alwaysExpanded={true}
              selectedSettings={settings}
              onPreferenceChanged={onPreferenceChanged}
            />

            {selectableSettingsFiltered.length > 0 && (
              <div className="mt-2 mb-2">
                {selectableSettingsFiltered.map((preference) => (
                  <FrameworkTabs
                    key={preference.propertyName}
                    options={preference.options}
                    selectedValue={
                      (settings?.[preference.propertyName] ??
                        preference.options.find((option) => option.isDefault)
                          ?.value ??
                        "") as string
                    }
                    onChange={(value) => {
                      onPreferenceChanged(preference.propertyName, value);
                    }}
                  />
                ))}
              </div>
            )}

            {(stylingPreferences.length > 0 ||
              selectedFramework === "Tailwind") && (
              <div className="mt-2">
                {stylingPreferences.map((pref) => (
                  <SettingsGroup
                    key={pref.propertyName}
                    title=""
                    settings={[pref]}
                    alwaysExpanded={true}
                    selectedSettings={settings}
                    onPreferenceChanged={onPreferenceChanged}
                  />
                ))}

                {selectedFramework === "Tailwind" && (
                  <TailwindSettings
                    settings={settings}
                    onPreferenceChanged={onPreferenceChanged}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div> */}
    </div>
  );
};

export default CodePanel;
