"use client";

import { Lock, Sparkles, X } from "lucide-react";
import { cn } from "../lib/utils";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  isLoading?: boolean;
}

export function AuthDialog({
  isOpen,
  onClose,
  onLogin,
  isLoading = false,
}: AuthDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-500 to-purple-700 p-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Sign In Required
            </h2>
          </div>
          <p className="text-purple-100 text-sm">
            Create motion graphics from your designs with Aspects
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2 text-sm text-purple-900 dark:text-purple-100">
                <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Animate in Aspects</strong> requires authentication to host your
                  images
                </span>
              </div>
            </div>

            <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
              <p>When you sign in, we can:</p>
              <ul className="pl-4 space-y-1">
                <li>• Upload and host your design images securely</li>
                <li>• Create motion graphics directly from your design</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
              "text-neutral-700 dark:text-neutral-300",
              "bg-neutral-100 dark:bg-neutral-800",
              "hover:bg-neutral-200 dark:hover:bg-neutral-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            Maybe Later
          </button>
          <button
            onClick={onLogin}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all",
              "text-white bg-purple-500",
              "hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/30",
              "disabled:bg-neutral-300 disabled:dark:bg-neutral-700 disabled:cursor-not-allowed",
              "disabled:shadow-none",
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Opening browser...
              </span>
            ) : (
              "Sign In with Aspects"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
