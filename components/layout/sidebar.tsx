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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE],
  },
];

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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-background transition-all duration-200 shrink-0",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-border">
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight truncate">Office Mgmt</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          className="h-7 w-7 shrink-0 ml-auto"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
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
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-2">
        {!collapsed && (
          <div className="px-2 py-1 mb-1">
            <p className="text-xs font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground",
            "hover:bg-accent hover:text-accent-foreground transition-colors"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
