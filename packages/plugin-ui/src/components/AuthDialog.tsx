"use client";

import { Lock, Sparkles, X } from "lucide-react";
import { cn } from "../lib/utils";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  isLoading?: boolean;
  pollingStatus?: string | null;
  onRetry?: () => void;
  onManualPoll?: () => void;
}

export function AuthDialog({
  isOpen,
  onClose,
  onLogin,
  isLoading = false,
  pollingStatus = null,
  onRetry,
  onManualPoll,
}: AuthDialogProps) {
  if (!isOpen) return null;

  const isPolling = !!pollingStatus;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-foreground p-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 text-background/80 hover:text-background transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-background/20 rounded-lg backdrop-blur-sm">
              <Lock className="h-6 w-6 text-background" />
            </div>
            <h2 className="text-2xl font-bold text-background">
              Sign In Required
            </h2>
          </div>
          <p className="text-background/80 text-sm">
            Create motion graphics from your designs with Aspects
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isPolling ? (
            /* Polling Status */
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400"
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {pollingStatus}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-2">
                <p>Complete the sign-in process in your browser.</p>
                <p className="text-neutral-400 dark:text-neutral-500">
                  The plugin will automatically detect when you've signed in.
                  Keep this window open.
                </p>
                {onManualPoll && (
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={onManualPoll}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
                    >
                      Not detecting your sign in? Click here
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Initial state */
            <div className="space-y-3">
              <div className="bg-muted border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Animate in Aspects</strong> requires authentication to host your
                    images
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>When you sign in, we can:</p>
                <ul className="pl-4 space-y-1">
                  <li>• Upload and host your design images securely</li>
                  <li>• Create motion graphics directly from your design</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {isPolling ? (
            /* Polling actions */
            <>
              <button
                onClick={onClose}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                  "text-neutral-700 dark:text-neutral-300",
                  "bg-neutral-100 dark:bg-neutral-800",
                  "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                )}
              >
                Cancel
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all",
                    "text-white bg-blue-500",
                    "hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30",
                  )}
                >
                  Reopen Browser
                </button>
              )}
            </>
          ) : (
            /* Initial actions */
            <>
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
                  "text-background bg-foreground",
                  "hover:bg-foreground/90 hover:shadow-lg",
                  "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed",
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
