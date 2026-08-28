import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  const employee = session.employeeId
    ? await prisma.employee.findUnique({
        where: { id: session.employeeId },
        select: { firstName: true, lastName: true },
      })
    : null;

  const userName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : session.email.split("@")[0];

  return (
    <DashboardShell
      role={session.role}
      userName={userName}
      userEmail={session.email}
    >
      {children}
    </DashboardShell>
  );
}
