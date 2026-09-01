import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const teamModel = (prisma as any).team as typeof prisma.team | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const teamMemberModel = (prisma as any).teamMember as typeof prisma.teamMember | undefined;

function requireTeam() {
  if (!teamModel) throw new Error("Teams feature requires a server restart to activate. Please stop and restart `npm run dev`.");
  return teamModel;
}
function requireTeamMember() {
  if (!teamMemberModel) throw new Error("Teams feature requires a server restart to activate. Please stop and restart `npm run dev`.");
  return teamMemberModel;
}

const MEMBER_SELECT = {
  id: true,
  employeeId: true,
  joinedAt: true,
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      designation: { select: { name: true } },
      user: { select: { email: true } },
    },
  },
};

const TEAM_INCLUDE = {
  manager: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      designation: { select: { name: true } },
      user: { select: { email: true } },
    },
  },
  members: { select: MEMBER_SELECT },
  _count: { select: { members: true } },
};

export async function getTeams(options: { managerId?: string; isActive?: boolean } = {}) {
  if (!teamModel) return [];
  const where: Record<string, unknown> = {};
  if (options.managerId) where.managerId = options.managerId;
  if (options.isActive !== undefined) where.isActive = options.isActive;

  return teamModel.findMany({
    where,
    include: TEAM_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function getTeamById(id: string) {
  if (!teamModel) return null;
  return teamModel.findUnique({ where: { id }, include: TEAM_INCLUDE });
}

export async function createTeam(data: {
  name: string;
  description?: string;
  managerId?: string;
  memberIds?: string[];
}) {
  const { memberIds = [], ...rest } = data;
  return requireTeam().create({
    data: {
      ...rest,
      members: memberIds.length
        ? { create: memberIds.map((employeeId) => ({ employeeId })) }
        : undefined,
    },
    include: TEAM_INCLUDE,
  });
}

export async function updateTeam(
  id: string,
  data: { name?: string; description?: string; managerId?: string | null; isActive?: boolean }
) {
  return requireTeam().update({ where: { id }, data, include: TEAM_INCLUDE });
}

export async function deleteTeam(id: string) {
  return requireTeam().delete({ where: { id } });
}

export async function addTeamMember(teamId: string, employeeId: string) {
  const existing = await requireTeamMember().findUnique({
    where: { teamId_employeeId: { teamId, employeeId } },
  });
  if (existing) throw new Error("Employee is already a team member");

  return requireTeamMember().create({
    data: { teamId, employeeId },
    select: MEMBER_SELECT,
  });
}

export async function removeTeamMember(teamId: string, employeeId: string) {
  return requireTeamMember().delete({
    where: { teamId_employeeId: { teamId, employeeId } },
  });
}
