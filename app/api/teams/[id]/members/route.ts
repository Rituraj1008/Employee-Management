import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { addTeamMember, removeTeamMember } from "@/services/team.service";
import {
  successResponse, errorResponse, unauthorizedResponse, serverErrorResponse,
} from "@/lib/utils/api";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/teams/[id]/members">) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== "SUPER_ADMIN" && session.role !== "HR" && session.role !== "MANAGER") {
      return errorResponse("Permission denied", 403);
    }

    const { id: teamId } = await ctx.params;
    const { employeeId } = await request.json() as { employeeId: string };
    if (!employeeId) return errorResponse("employeeId is required");

    const member = await addTeamMember(teamId, employeeId);
    return successResponse(member, 201);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/teams/[id]/members">) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== "SUPER_ADMIN" && session.role !== "HR" && session.role !== "MANAGER") {
      return errorResponse("Permission denied", 403);
    }

    const { id: teamId } = await ctx.params;
    const { employeeId } = await request.json() as { employeeId: string };
    if (!employeeId) return errorResponse("employeeId is required");

    await removeTeamMember(teamId, employeeId);
    return successResponse({ removed: true });
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
