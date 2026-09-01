import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTeamById, updateTeam, deleteTeam } from "@/services/team.service";
import {
  successResponse, errorResponse, unauthorizedResponse,
  notFoundResponse, serverErrorResponse,
} from "@/lib/utils/api";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/teams/[id]">) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    const { id } = await ctx.params;
    const team = await getTeamById(id);
    if (!team) return notFoundResponse("Team");
    return successResponse(team);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/teams/[id]">) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== "SUPER_ADMIN" && session.role !== "HR") {
      return errorResponse("Only Admin or HR can edit teams", 403);
    }

    const { id } = await ctx.params;
    const body = await request.json();
    const { name, description, managerId, isActive } = body as {
      name?: string;
      description?: string;
      managerId?: string | null;
      isActive?: boolean;
    };

    const team = await updateTeam(id, { name, description, managerId, isActive });
    return successResponse(team);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/teams/[id]">) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== "SUPER_ADMIN" && session.role !== "HR") {
      return errorResponse("Only Admin or HR can delete teams", 403);
    }

    const { id } = await ctx.params;
    await deleteTeam(id);
    return successResponse({ deleted: true });
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
