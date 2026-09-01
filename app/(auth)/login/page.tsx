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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm group-hover:opacity-90 transition-opacity">
            W
          </div>
          <span className="font-semibold text-foreground tracking-tight">WorkForce</span>
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
