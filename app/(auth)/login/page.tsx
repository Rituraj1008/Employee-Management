import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm px-4">
      {/* Logo + heading */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-md shadow-violet-500/30 group-hover:shadow-lg group-hover:shadow-violet-500/40 transition-shadow duration-200 shrink-0">
            <span className="font-black text-white text-sm select-none">E</span>
          </div>
          <span className="font-bold tracking-tight text-[15px] bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
            Emplyra
          </span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Sign in to your account to continue</p>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <LoginForm />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-5">
        Having trouble signing in?{" "}
        <Link href="/" className="text-primary hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}
