"use client";

import { RoleType } from "@prisma/client";
import { MobileNav } from "./mobile-nav";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "HR",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

const ROLE_BADGE: Record<RoleType, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  HR: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  MANAGER: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  EMPLOYEE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
};

interface HeaderProps {
  role: RoleType;
  userName: string;
  title?: string;
}

export function Header({ role, userName, title }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-3">
        <MobileNav role={role} userName={userName} />
        {title && (
          <h1 className="text-sm font-semibold text-foreground hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* User name (desktop) */}
        <span className="text-sm text-muted-foreground hidden md:block">{userName}</span>

        {/* Role badge */}
        <span
          className={cn(
            "text-[11px] font-medium px-2 py-0.5 rounded-full hidden sm:inline-flex",
            ROLE_BADGE[role]
          )}
        >
          {ROLE_LABELS[role]}
        </span>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
      </div>
    </header>
  );
}
