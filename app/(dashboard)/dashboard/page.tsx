import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireAuth();

  const isAdmin =
    session.role === RoleType.SUPER_ADMIN ||
    session.role === RoleType.HR ||
    session.role === RoleType.MANAGER;

  if (isAdmin) {
    return <AdminDashboard session={session} />;
  }

  return <EmployeeDashboard session={session} />;
}
