"use client";

import { useState } from "react";
import { RoleType } from "@prisma/client";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

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
    <div className="flex h-full">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar
          role={role}
          userName={userName}
          userEmail={userEmail}
          collapsed={collapsed}
          onCollapse={() => setCollapsed((prev) => !prev)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header role={role} userName={userName} title={pageTitle} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
