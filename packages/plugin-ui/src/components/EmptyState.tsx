import React from "react";
import { Code, MousePointer, Download } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-card/50 border border-dashed border-border rounded-lg text-center">
      {/* Icon with "no code" symbol */}
      <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/60 rounded-full flex items-center justify-center mb-5 shadow-sm">
        <div className="relative">
          <Code size={24} className="text-muted-foreground" />
          <svg
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground/60"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
      </div>

      {/* Title and hint */}
      <h3 className="text-lg font-medium text-foreground mb-2">
        No Code Generated
      </h3>
      <p className="text-muted-foreground max-w-xs mb-8">
        Select a layer and click Preview or Export to generate code.
      </p>

      {/* Simplified steps section */}
      <div className="w-full max-w-xs">
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-border"></div>

          {/* Steps with connecting line */}
          <ol className="relative flex justify-between">
            {/* Step 1 - Current */}
            <li className="flex flex-col items-center">
              <div className="relative z-10">
                <div className="absolute -inset-1.5 rounded-full bg-primary/10 animate-pulse-slow"></div>
                <div className="relative flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground">
                  <MousePointer size={15} />
                </div>
              </div>
              <div className="mt-3 text-center">
                <div className="font-medium text-sm text-primary">
                  Select
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose a layer
                </p>
              </div>
            </li>

            {/* Step 2 */}
            <li className="flex flex-col items-center">
              <div className="z-10 flex items-center justify-center w-8 h-8 bg-background border-2 border-border rounded-full text-muted-foreground">
                <Download size={15} />
              </div>
              <div className="mt-3 text-center">
                <div className="font-medium text-sm text-foreground">
                  Export
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Download HTML
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
