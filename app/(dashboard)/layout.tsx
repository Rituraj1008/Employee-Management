import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  // Name is stored in the JWT at login — no extra DB round trip needed
  const userName = session.name ?? session.email.split("@")[0];

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
