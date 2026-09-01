"use client";

import { useState } from "react";
import { RoleType } from "@prisma/client";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  role: RoleType;
  userName: string;
  userEmail: string;
  pageTitle?: string;
}

export function DashboardShell({
  children,
  role,
  userName,
  userEmail,
  pageTitle,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          role={role}
          userName={userName}
          userEmail={userEmail}
          collapsed={collapsed}
          onCollapse={() => setCollapsed((prev) => !prev)}
        />
      </div>

      {/* Main content */}
      <div
        className={cn(
          "flex flex-1 flex-col min-w-0 overflow-hidden transition-all duration-300"
        )}
      >
        <Header role={role} userName={userName} title={pageTitle} />
        <main className="flex-1 overflow-y-auto page-fade">{children}</main>
      </div>
    </div>
  );
}
