import { redirect } from "next/navigation";
import { RoleType } from "@prisma/client";
import { getSession, SessionPayload } from "./session";

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(
  allowedRoles: RoleType[]
): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function getOptionalSession(): Promise<SessionPayload | null> {
  return getSession();
}

export function isAdmin(role: RoleType): boolean {
  return role === RoleType.SUPER_ADMIN || role === RoleType.HR;
}

export function canManageEmployees(role: RoleType): boolean {
  return role === RoleType.SUPER_ADMIN || role === RoleType.HR;
}

export function canManageTasks(role: RoleType): boolean {
  return (
    role === RoleType.SUPER_ADMIN ||
    role === RoleType.HR ||
    role === RoleType.MANAGER
  );
}

export function canApproveLeave(role: RoleType): boolean {
  return role === RoleType.SUPER_ADMIN || role === RoleType.HR;
}
