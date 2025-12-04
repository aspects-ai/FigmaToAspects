"use client";

import { Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

interface ExportButtonProps {
  onExport: () => void;
  isLoading: boolean;
  disabled: boolean;
  className?: string;
  showSuccess?: boolean;
}

export function ExportButton({
  onExport,
  isLoading,
  disabled,
  className,
  showSuccess = false,
}: ExportButtonProps) {
  const [localSuccess, setLocalSuccess] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      setLocalSuccess(true);
      const timer = setTimeout(() => setLocalSuccess(false), 2000);
      return () => clearTimeout(timer);
    } else {
      // Reset local success state when parent clears showSuccess
      setLocalSuccess(false);
    }
  }, [showSuccess]);

  return (
    <button
      onClick={onExport}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300",
        localSuccess
          ? "bg-green-500 text-white"
          : disabled || isLoading
          ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
          : "bg-primary hover:shadow-[0_0_12px_hsl(var(--primary)/0.5)] hover:bg-primary/90 text-primary-foreground",
        className
      )}
      aria-label={
        isLoading ? "Uploading..." : localSuccess ? "Opened!" : "Animate in Aspects"
      }
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 mr-1.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Queuing generation...</span>
        </>
      ) : (
        <>
          <div className="relative h-4 w-4 mr-1.5">
            <span
              className={cn(
                "absolute inset-0 transition-all duration-200",
                localSuccess
                  ? "opacity-0 scale-75"
                  : "opacity-100 scale-100"
              )}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <span
              className={cn(
                "absolute inset-0 transition-all duration-200",
                localSuccess
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-75"
              )}
            >
              <Check className="h-4 w-4" />
            </span>
          </div>
          <span className="font-medium">
            {localSuccess ? "Opened!" : "Animate in Aspects"}
          </span>
        </>
      )}
    </button>
  );
}
