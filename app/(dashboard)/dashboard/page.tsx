import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/guards";
import { RoleType } from "@prisma/client";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { HRDashboard } from "@/components/dashboard/hr-dashboard";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireAuth();

  switch (session.role) {
    case RoleType.SUPER_ADMIN:
      return <AdminDashboard session={session} />;
    case RoleType.HR:
      return <HRDashboard session={session} />;
    case RoleType.MANAGER:
      return <ManagerDashboard session={session} />;
    case RoleType.EMPLOYEE:
    default:
      return <EmployeeDashboard session={session} />;
  }
}
