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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE] },
  { label: "Employees", href: "/employees", icon: Users, roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER] },
  { label: "Departments", href: "/departments", icon: Building2, roles: [RoleType.SUPER_ADMIN, RoleType.HR] },
  { label: "Attendance", href: "/attendance", icon: Clock, roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE] },
  { label: "Leaves", href: "/leaves", icon: CalendarOff, roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE] },
  { label: "Tasks", href: "/tasks", icon: CheckSquare, roles: [RoleType.SUPER_ADMIN, RoleType.HR, RoleType.MANAGER, RoleType.EMPLOYEE] },
];

interface MobileNavProps {
  role: RoleType;
  userName: string;
}

export function MobileNav({ role, userName }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

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
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="h-14 flex flex-row items-center justify-between px-4 border-b">
            <SheetTitle className="text-sm font-semibold">Office Management</SheetTitle>
          </SheetHeader>

          <nav className="p-2 space-y-0.5">
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
                    "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t p-2">
            <div className="px-2 py-1 mb-1">
              <p className="text-xs font-medium">{userName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
