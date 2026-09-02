"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Workflow", href: "#workflow" },
];

export function LandingNavbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setLoaded(true), 40);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo — slides in from left */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 shrink-0 group transition-all duration-500 ease-out",
                loaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              )}
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-md shadow-orange-500/25 shrink-0 group-hover:shadow-lg group-hover:shadow-orange-500/35 transition-shadow duration-200">
                <span className="font-black text-white text-sm select-none">E</span>
              </div>
              <span className="font-bold tracking-tight text-[15px] bg-gradient-to-r from-orange-700 to-amber-600 dark:from-orange-400 dark:to-amber-300 bg-clip-text text-transparent">
                Emplyra
              </span>
            </Link>

            {/* Desktop nav — slides in from left with slight delay */}
            <nav
              className={cn(
                "hidden md:flex items-center gap-1 transition-all duration-500 ease-out delay-100",
                loaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              )}
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions — slides in from left with more delay */}
            <div
              className={cn(
                "flex items-center gap-2 transition-all duration-500 ease-out delay-[180ms]",
                loaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
              )}
            >
              {mounted && (
                <button
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              )}

              {/* Auth buttons — desktop */}
              <div className="hidden sm:flex items-center gap-2">
                {isLoggedIn ? (
                  <Button asChild size="sm" className="h-8 px-4 text-sm font-medium">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm" className="h-8 px-4 text-sm font-medium">
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button asChild size="sm" className="h-8 px-4 text-sm font-medium">
                      <Link href="/login">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-300 md:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile sidebar — slides in from left */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-72 bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-out md:hidden flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-md shadow-orange-500/25">
              <span className="font-black text-white text-sm select-none">E</span>
            </div>
            <span className="font-bold tracking-tight text-[15px] bg-gradient-to-r from-orange-700 to-amber-600 dark:from-orange-400 dark:to-amber-300 bg-clip-text text-transparent">
              Emplyra
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Sidebar auth buttons */}
        <div className="px-4 py-6 border-t border-border space-y-2 shrink-0">
          {isLoggedIn ? (
            <Button asChild className="w-full h-10 text-sm font-medium">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" className="w-full h-10 text-sm font-medium">
                <Link href="/login" onClick={() => setMobileOpen(false)}>Log In</Link>
              </Button>
              <Button asChild className="w-full h-10 text-sm font-medium">
                <Link href="/login" onClick={() => setMobileOpen(false)}>Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
