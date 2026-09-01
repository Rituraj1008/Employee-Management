import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { LoginInput } from "@/lib/validations/auth";

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { employee: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const token = await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employee?.id,
    name: user.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`
      : undefined,
  });

  return { token, user: { id: user.id, email: user.email, role: user.role } };
}
