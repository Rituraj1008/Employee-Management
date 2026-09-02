import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";
import {
  successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse,
} from "@/lib/utils/api";
import { createProjectSchema } from "@/lib/validations/project";
import { listProjects, createProject } from "@/services/project.service";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;

    const projects = await listProjects({
      role: session.role,
      employeeId: session.employeeId,
      managerId: session.role === "MANAGER" ? session.employeeId : undefined,
      status,
    });

    return successResponse(projects);
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();
    if (!isAdmin(session.role)) return forbiddenResponse();

    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const project = await createProject(session.userId, parsed.data);
    return successResponse(project, 201);
  } catch (err) {
    return serverErrorResponse(err);
  }
}
