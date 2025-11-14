import { useState, ReactNode } from "react";
import { LocalCodegenPreferenceOptions, PluginSettings } from "types";
import SelectableToggle from "./SelectableToggle";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

interface SettingsGroupProps {
  title: string;
  settings?: LocalCodegenPreferenceOptions[];
  alwaysExpanded?: boolean;
  selectedSettings?: PluginSettings | null;
  onPreferenceChanged?: (
    key: keyof PluginSettings,
    value: boolean | string,
  ) => void;
  children?: ReactNode;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({
  title,
  settings = [],
  alwaysExpanded = false,
  selectedSettings,
  onPreferenceChanged,
  children,
}) => {
  const [expanded, setExpanded] = useState(alwaysExpanded);

  const hasContent = settings.length > 0 || children;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="w-full mb-2.5 last:mb-0">
      {alwaysExpanded ? (
        <div className="flex items-center mb-1">
          <span className="text-xs font-semibold text-foreground">
            {title}
          </span>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left"
        >
          {expanded ? (
            <ChevronDownIcon className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronRightIcon className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="truncate">{title}</span>
        </button>
      )}

      {(expanded || alwaysExpanded) && (
        <div
          className={`flex flex-col gap-2.5 ${!alwaysExpanded ? "px-4 mt-2" : ""}`}
        >
          {/* Render preference toggles if any */}
          {settings.length > 0 && (
            <div className="flex gap-2 items-center flex-wrap">
              {settings.map((preference) => (
                <SelectableToggle
                  key={preference.propertyName}
                  title={preference.label}
                  description={preference.description}
                  isSelected={
                    typeof selectedSettings?.[preference.propertyName] ===
                    "boolean"
                      ? (selectedSettings?.[preference.propertyName] as boolean)
                      : preference.isDefault
                  }
                  onSelect={(value) => {
                    onPreferenceChanged?.(preference.propertyName, value);
                  }}
                  buttonClass="bg-accent/10 dark:bg-accent/20 ring-accent"
                  checkClass="bg-accent dark:bg-accent border-accent ring-accent/30"
                />
              ))}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default SettingsGroup;
