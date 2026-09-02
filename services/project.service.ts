import { prisma } from "@/lib/prisma";
import {
  CreateProjectInput,
  UpdateProjectInput,
  ChangeManagerInput,
  CreateWorkNoteInput,
} from "@/lib/validations/project";

const memberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      designation: { select: { name: true } },
      user: { select: { role: true } },
    },
  },
};

const managerHistorySelect = {
  id: true,
  assignedAt: true,
  removedAt: true,
  manager: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      designation: { select: { name: true } },
    },
  },
  changedBy: {
    select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } },
  },
};

export async function listProjects(options: {
  employeeId?: string;
  managerId?: string;
  status?: string;
  role: string;
}) {
  const { employeeId, managerId, status, role } = options;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  // Employees see only projects they are a member of
  if (role === "EMPLOYEE" && employeeId) {
    where.members = { some: { employeeId } };
  }

  // Managers see projects they manage
  if (role === "MANAGER" && managerId) {
    where.managerId = managerId;
  }

  return prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      team: { select: { id: true, name: true } },
      manager: {
        select: { id: true, firstName: true, lastName: true, profileImage: true },
      },
      _count: { select: { members: true, weeklyTasks: true } },
    },
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, profileImage: true, designation: { select: { name: true } } },
      },
      createdBy: {
        select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } },
      },
      members: { include: memberSelect },
      managerHistory: {
        include: managerHistorySelect,
        orderBy: { assignedAt: "desc" },
      },
      _count: { select: { weeklyTasks: true, workNotes: true } },
    },
  });
}

export async function createProject(createdById: string, input: CreateProjectInput) {
  const { name, description, teamId, deadline } = input;

  // Fetch the team with its manager and all members
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { select: { employeeId: true } },
    },
  });
  if (!team) throw new Error("Team not found");

  const managerId = team.managerId ?? undefined;
  const memberEmployeeIds = team.members.map((m) => m.employeeId);

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : undefined,
        teamId,
        managerId,
        createdById,
      },
    });

    // Add all team members as project members
    if (memberEmployeeIds.length > 0) {
      await tx.projectMember.createMany({
        data: memberEmployeeIds.map((employeeId) => ({ projectId: project.id, employeeId })),
        skipDuplicates: true,
      });
    }

    // Record initial manager history if a manager exists
    if (managerId) {
      await tx.projectManagerHistory.create({
        data: { projectId: project.id, managerId, changedById: createdById },
      });
    }

    return project;
  });
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  return prisma.project.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.deadline !== undefined && {
        deadline: input.deadline ? new Date(input.deadline) : null,
      }),
    },
  });
}

export async function changeProjectManager(
  projectId: string,
  changedById: string,
  input: ChangeManagerInput,
) {
  return prisma.$transaction(async (tx) => {
    // Close the current active history record
    await tx.projectManagerHistory.updateMany({
      where: { projectId, removedAt: null },
      data: { removedAt: new Date() },
    });

    // Update the project manager
    const project = await tx.project.update({
      where: { id: projectId },
      data: { managerId: input.managerId },
    });

    // Create new history record
    await tx.projectManagerHistory.create({
      data: { projectId, managerId: input.managerId, changedById },
    });

    return project;
  });
}

export async function addProjectMember(projectId: string, employeeId: string, role = "MEMBER") {
  return prisma.projectMember.upsert({
    where: { projectId_employeeId: { projectId, employeeId } },
    create: { projectId, employeeId, role: role as "LEAD" | "MEMBER" },
    update: { role: role as "LEAD" | "MEMBER" },
  });
}

export async function removeProjectMember(projectId: string, employeeId: string) {
  return prisma.projectMember.delete({
    where: { projectId_employeeId: { projectId, employeeId } },
  });
}

export async function listWorkNotes(projectId: string) {
  return prisma.workNote.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, profileImage: true },
      },
    },
  });
}

export async function createWorkNote(
  projectId: string,
  employeeId: string,
  input: CreateWorkNoteInput,
) {
  return prisma.workNote.create({
    data: { projectId, employeeId, content: input.content },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, profileImage: true },
      },
    },
  });
}
