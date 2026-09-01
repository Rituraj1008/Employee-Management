import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTeams, createTeam } from "@/services/team.service";
import {
  successResponse, errorResponse, unauthorizedResponse, serverErrorResponse,
} from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    const teams = await getTeams();
    return successResponse(teams);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (session.role !== "SUPER_ADMIN" && session.role !== "HR") {
      return errorResponse("Only Admin or HR can create teams", 403);
    }

    const body = await request.json();
    const { name, description, managerId, memberIds } = body as {
      name: string;
      description?: string;
      managerId?: string;
      memberIds?: string[];
    };

    if (!name?.trim()) return errorResponse("Team name is required");

    const team = await createTeam({ name: name.trim(), description, managerId, memberIds });
    return successResponse(team, 201);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
