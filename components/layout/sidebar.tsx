"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { RoleType } from "@prisma/client";
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarOff,
  CheckSquare,
  ChevronLeft,
  LogOut,
  UsersRound,
  Banknote,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: RoleType[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE],
  },
  {
    label: "Employees",
    href: "/employees",
    icon: Users,
    roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER],
  },
  {
    label: "Departments",
    href: "/departments",
    icon: Building2,
    roles: [RoleType.SUPER_ADMIN, RoleType.HR],
  },
  {
    label: "Teams",
    href: "/teams",
    icon: UsersRound,
    roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER],
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: Clock,
    roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE],
  },
  {
    label: "Leaves",
    href: "/leaves",
    icon: CalendarOff,
    roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE],
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    roles: [RoleType.EMPLOYEE],
  },
  {
    label: "Salary",
    href: "/salary",
    icon: Banknote,
    roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE],
  },
];

const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "HR",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

const ROLE_COLORS: Record<RoleType, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  HR: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  MANAGER: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  EMPLOYEE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
};

interface SidebarProps {
  role: RoleType;
  userName: string;
  userEmail: string;
  collapsed: boolean;
  onCollapse: () => void;
}

export function Sidebar({ role, userName, userEmail, collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out shrink-0",
          collapsed ? "w-[52px]" : "w-[220px]"
        )}
      >
        {/* Logo / header */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-sidebar-border shrink-0",
            collapsed ? "justify-center px-0" : "justify-between px-4"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-sm shadow-violet-500/30 shrink-0">
                <span className="font-black text-white text-xs select-none">E</span>
              </div>
              <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Emplyra</span>
            </div>
          )}
          {collapsed && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-sm shadow-violet-500/30">
              <span className="font-black text-white text-xs select-none">E</span>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCollapse}
              className="h-6 w-6 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {collapsed && (
            <div className="flex justify-center mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onCollapse}
                className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                aria-label="Expand sidebar"
              >
                <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
              </Button>
            </div>
          )}

          {visibleItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            const navLink = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md transition-colors duration-150",
                  collapsed ? "h-8 w-8 justify-center mx-auto" : "px-2.5 py-1.5 text-sm",
                  active
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("shrink-0", collapsed ? "h-4 w-4" : "h-4 w-4")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navLink;
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-2">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 bg-sidebar-accent/40">
              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-primary font-bold text-xs ring-1 ring-primary/20 select-none">
                {initials}
              </div>

              {/* Name + role */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">{userName}</p>
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", ROLE_COLORS[role])}>
                  {ROLE_LABELS[role]}
                </span>
              </div>

              {/* Logout icon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/40 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">Sign out</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-md mx-auto text-sidebar-foreground/50 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium">Sign out</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
