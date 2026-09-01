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
  Menu,
  LogOut,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard, roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE] },
  { label: "Employees",   href: "/employees",   icon: Users,           roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER] },
  { label: "Departments", href: "/departments", icon: Building2,       roles: [RoleType.SUPER_ADMIN, RoleType.HR] },
  { label: "Teams",       href: "/teams",       icon: UsersRound,      roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER] },
  { label: "Attendance",  href: "/attendance",  icon: Clock,           roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE] },
  { label: "Leaves",      href: "/leaves",      icon: CalendarOff,     roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE] },
  { label: "Tasks",       href: "/tasks",        icon: CheckSquare,     roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE] },
];

const ROLE_BADGE: Record<RoleType, { label: string; cls: string }> = {
  SUPER_ADMIN: { label: "Admin",    cls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" },
  HR:          { label: "HR",       cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400" },
  MANAGER:     { label: "Manager",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
  EMPLOYEE:    { label: "Employee", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
};

interface MobileNavProps {
  role: RoleType;
  userName: string;
}

export function MobileNav({ role, userName }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const badge = ROLE_BADGE[role];
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground">
          <SheetHeader className="h-14 flex flex-row items-center gap-2.5 px-4 border-b border-sidebar-border">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shrink-0">
              W
            </div>
            <SheetTitle className="text-sm font-semibold text-sidebar-foreground tracking-tight">
              WorkForce
            </SheetTitle>
          </SheetHeader>

          <nav className="p-2 space-y-0.5 flex-1">
            {visibleItems.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-3 space-y-1">
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
              <div className="h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{userName}</p>
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", badge.cls)}>
                  {badge.label}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
