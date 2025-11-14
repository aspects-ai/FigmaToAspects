"use client";

import { useState, useRef, useEffect } from "react";
import { LogIn, User, LogOut } from "lucide-react";
import { cn } from "../lib/utils";
import type { AuthUser } from "types";

interface AuthStatusButtonProps {
  isAuthenticated: boolean;
  user: AuthUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

export function AuthStatusButton({
  isAuthenticated,
  user,
  onLogin,
  onLogout,
}: AuthStatusButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  if (!isAuthenticated) {
    // Show login button
    return (
      <button
        onClick={onLogin}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
          "bg-purple-500 text-white hover:bg-purple-600",
        )}
        aria-label="Log in"
      >
        <LogIn size={14} />
        <span>Log In</span>
      </button>
    );
  }

  // Show user menu
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
          showMenu
            ? "bg-primary text-primary-foreground shadow-xs"
            : "bg-muted hover:bg-primary/90 hover:text-primary-foreground",
        )}
        aria-label="Account menu"
      >
        <User size={14} />
        <span className="max-w-[80px] truncate">{user?.name || user?.email}</span>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden">
          {/* User info section */}
          <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <User size={16} className="text-purple-600 dark:text-purple-300" />
              </div>
              <div className="flex-1 min-w-0">
                {user?.name && (
                  <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {user.name}
                  </div>
                )}
                <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Actions section */}
          <div className="p-1">
            <button
              onClick={() => {
                setShowMenu(false);
                onLogout();
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30",
              )}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
