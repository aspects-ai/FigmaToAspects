"use client";

import { Eye } from "lucide-react";
import { cn } from "../lib/utils";

interface PreviewButtonProps {
  onPreview: () => void;
  isLoading: boolean;
  disabled: boolean;
  className?: string;
}

export function PreviewButton({
  onPreview,
  isLoading,
  disabled,
  className,
}: PreviewButtonProps) {
  return (
    <button
      onClick={onPreview}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300",
        disabled || isLoading
          ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
          : "bg-blue-500 hover:bg-blue-600 text-white",
        className
      )}
      aria-label={isLoading ? "Generating preview..." : "Preview"}
    >
      <Eye className="h-4 w-4 mr-1.5" />
      <span className="font-medium">
        {isLoading ? "Generating..." : "Preview"}
      </span>
    </button>
  );
}
