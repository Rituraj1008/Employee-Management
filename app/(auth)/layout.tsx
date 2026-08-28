import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-full flex items-center justify-center bg-muted/30">
      {children}
    </div>
  );
}
