import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  accent?: "blue" | "green" | "amber" | "red" | "violet" | "default";
}

const ACCENT_STYLES = {
  blue: {
    icon: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-400",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-400",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-400",
  },
  red: {
    icon: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    value: "text-red-700 dark:text-red-400",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    value: "text-violet-700 dark:text-violet-400",
  },
  default: {
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
  },
};

export function StatCard({ label, value, icon: Icon, description, accent = "default" }: StatCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div className="group rounded-xl border border-border bg-card p-5 hover:shadow-sm hover:border-border/80 transition-all duration-150">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", styles.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn("text-2xl font-bold stat-number leading-none", styles.value)}>
        {value}
      </p>
      <p className="text-xs font-medium text-foreground/70 mt-1.5">{label}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  );
}
