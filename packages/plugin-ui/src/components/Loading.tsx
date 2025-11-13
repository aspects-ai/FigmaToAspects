import React from "react";
import { Code } from "lucide-react";

interface LoadingProps {}

const Loading = (_props: LoadingProps) => (
  <div className="flex items-center justify-center w-full h-full p-4 bg-background text-foreground animate-fadeIn">
    <div className="flex flex-col items-center max-w-sm">
      {/* Logo animation */}
      <div className="relative w-16 h-16 mb-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 rounded-xl opacity-20 animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Code size={32} className="text-primary" />
        </div>
        {/* Loading spinner */}
        <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-primary/20"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-primary"
            strokeDasharray="60 200"
            strokeDashoffset="0"
          />
        </svg>
      </div>

      {/* Text */}
      <h2 className="text-xl font-semibold mb-2 text-center">
        Converting Design
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Please wait while your design is being converted to code. This may take a moment for complex designs.
      </p>

      {/* Progress bar */}
      <div className="w-64 h-1 bg-muted rounded-full overflow-hidden mt-5">
        <div className="h-full bg-primary rounded-full animate-progress"></div>
      </div>
    </div>
  </div>
);

export default Loading;
