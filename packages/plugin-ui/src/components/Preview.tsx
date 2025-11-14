import React from "react";
import { HTMLPreview } from "types";
import {
  Maximize2,
  Minimize2,
  MonitorSmartphone,
  Smartphone,
  Circle,
  Ruler,
  Monitor,
} from "lucide-react";
import { cn, replaceExternalImagesWithCanvas } from "../lib/utils";

// Update the component props to receive state from parent
const Preview: React.FC<{
  htmlPreview: HTMLPreview;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: "desktop" | "mobile" | "precision";
  setViewMode: React.Dispatch<
    React.SetStateAction<"desktop" | "mobile" | "precision">
  >;
  bgColor: "white" | "black";
  setBgColor: React.Dispatch<React.SetStateAction<"white" | "black">>;
}> = (props) => {
  const {
    htmlPreview,
    expanded,
    setExpanded,
    viewMode,
    setViewMode,
    bgColor,
    setBgColor,
  } = props;

  // Define consistent dimensions regardless of mode
  const containerWidth = expanded ? 320 : 240;
  const containerHeight = expanded ? 180 : 120;

  // Calculate scale factor first to use in content width calculation
  const scaleFactor = Math.min(
    containerWidth / htmlPreview.size.width,
    containerHeight / htmlPreview.size.height,
  );

  // Calculate content dimensions based on view mode
  const contentWidth =
    viewMode === "desktop"
      ? containerWidth
      : viewMode === "mobile"
        ? Math.floor(containerWidth * 0.4) // Narrower for mobile
        : htmlPreview.size.width * scaleFactor + 2; // I don't know why I need the 2, but it works always. I guess rounding error for zoom.

  return (
    <div className="flex flex-col w-full">
      {/* Preview container */}
      <div className="flex justify-center items-center bg-neutral-50 dark:bg-neutral-900 p-3 rounded-b-lg">
        {/* Outer container with fixed dimensions */}
        <div
          className="relative"
          style={{
            width: containerWidth,
            height: containerHeight,
            transition: "width 0.3s ease, height 0.3s ease",
          }}
        >
          {/* Inner content positioned based on view mode */}
          <div
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}
            style={{
              width: contentWidth,
              height:
                viewMode === "mobile"
                  ? Math.min(containerHeight * 0.9, containerHeight)
                  : viewMode === "precision"
                    ? htmlPreview.size.height * scaleFactor // Use scaled height for precision
                    : containerHeight,
              transition: "width 0.3s ease, height 0.3s ease",
            }}
          >
            {/* Device frame - no background for precision mode */}
            <div
              className={cn(
                "w-full h-full flex justify-center items-center overflow-hidden",
                bgColor === "white" ? "bg-white" : "bg-black",
                viewMode === "desktop"
                  ? "border border-border rounded-sm shadow-sm"
                  : viewMode === "mobile"
                    ? "border-2 border-border rounded-xl shadow-sm"
                    : "border border-primary rounded-sm shadow-sm",
                `transition-all duration-300 ease-in-out`,
              )}
            >
              {/* Content */}
              <div className="w-full h-full flex justify-center items-center">
                <div
                  style={{
                    zoom: scaleFactor,
                    width:
                      viewMode === "precision"
                        ? htmlPreview.size.width
                        : "100%",
                    height:
                      viewMode === "precision"
                        ? htmlPreview.size.height
                        : "100%",
                    transformOrigin: "center",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    aspectRatio:
                      viewMode === "precision"
                        ? `${htmlPreview.size.width} / ${htmlPreview.size.height}`
                        : undefined,
                    transition: "all 0.3s ease",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: replaceExternalImagesWithCanvas(htmlPreview.content),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with size info */}
      <div className="px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
        <span>
          {htmlPreview.size.width.toFixed(0)}×
          {htmlPreview.size.height.toFixed(0)}px
        </span>
        {/* <div className="flex items-center gap-1.5">
          {viewMode === "mobile" ? (
            <span className="flex items-center gap-1">
              <Smartphone size={10} />
              <span>Mobile view</span>
            </span>
          ) : viewMode === "precision" ? (
            <span className="flex items-center gap-1">
              <Ruler size={10} />
              <span>Precision view</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Monitor size={10} />
              <span>Desktop view</span>
            </span>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default Preview;
