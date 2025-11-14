"use client";

import { Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { HTMLPreview } from "types";

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectName: string, prompt: string) => void;
  isLoading: boolean;
  loadingStage: 'uploading' | 'creating' | 'generating' | null;
  error?: string;
  defaultProjectName?: string;
  htmlPreview?: HTMLPreview;
}

const LOADING_MESSAGES = {
  uploading: "Uploading files...",
  creating: "Creating project...",
  generating: "Starting generation...",
};

export function PromptDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  loadingStage,
  error,
  defaultProjectName = "New Project",
  htmlPreview,
}: PromptDialogProps) {
  const [projectName, setProjectName] = useState(defaultProjectName);
  const [prompt, setPrompt] = useState("");

  // Update project name when default changes
  useEffect(() => {
    if (defaultProjectName) {
      setProjectName(defaultProjectName);
    }
  }, [defaultProjectName]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setPrompt("");
      // Don't reset project name, it will be set when dialog reopens
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && projectName.trim() && !isLoading) {
      onSubmit(projectName.trim(), prompt.trim());
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold dark:text-white">
              Animate in Aspects
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5 dark:text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Preview */}
          <div className="border rounded-md overflow-hidden dark:border-neutral-700">
            <div className="bg-neutral-50 dark:bg-neutral-800 px-3 py-2 border-b dark:border-neutral-700">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Preview
              </p>
            </div>
            <div
              className="bg-white dark:bg-neutral-900 p-4 overflow-auto"
              style={{
                minHeight: "200px",
                maxHeight: "300px",
              }}
            >
              {htmlPreview && htmlPreview.content ? (
                <div className="flex items-center justify-center w-full h-full">
                  <div
                    dangerouslySetInnerHTML={{ __html: htmlPreview.content }}
                    style={{
                      transform: "scale(0.5)",
                      transformOrigin: "center center",
                      maxWidth: "200%",
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-400 dark:text-neutral-500">
                  <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Generating preview...</p>
                </div>
              )}
            </div>
          </div>

          {/* Project Name Input */}
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium mb-1 dark:text-neutral-300"
            >
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isLoading}
              placeholder="Enter project name"
              className={cn(
                "w-full px-3 py-2 border rounded-md",
                "dark:bg-neutral-800 dark:border-neutral-700 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              required
            />
          </div>

          {/* Prompt Input */}
          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium mb-1 dark:text-neutral-300"
            >
              Animation Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              placeholder="Describe how you want to animate this design..."
              rows={4}
              className={cn(
                "w-full px-3 py-2 border rounded-md resize-none",
                "dark:bg-neutral-800 dark:border-neutral-700 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              required
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {prompt.length} characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && loadingStage && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                {LOADING_MESSAGES[loadingStage]}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className={cn(
                "flex-1 px-4 py-2 border rounded-md font-medium",
                "dark:border-neutral-700 dark:text-neutral-300",
                "hover:bg-neutral-50 dark:hover:bg-neutral-800",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !prompt.trim() || !projectName.trim()}
              className={cn(
                "flex-1 px-4 py-2 rounded-md font-medium",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
