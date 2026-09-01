"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function HrAttendanceTabs({ active }: { active: "company" | "mine" }) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
      <Link
        href="/attendance"
        className={cn(
          "px-3 py-1.5 text-sm rounded-md transition-colors font-medium",
          active === "company"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Attendance Monitor
      </Link>
      <Link
        href="/attendance?view=mine"
        className={cn(
          "px-3 py-1.5 text-sm rounded-md transition-colors font-medium",
          active === "mine"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        My Attendance
      </Link>
    </div>
  );
}
