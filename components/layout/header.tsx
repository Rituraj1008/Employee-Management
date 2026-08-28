import { RoleType } from "@prisma/client";
import { MobileNav } from "./mobile-nav";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: "Super Admin",
  HR: "HR",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

interface HeaderProps {
  role: RoleType;
  userName: string;
  title?: string;
}

export function Header({ role, userName, title }: HeaderProps) {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-3">
        <MobileNav role={role} userName={userName} />
        {title && (
          <h1 className="text-sm font-medium text-foreground">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
        <Badge variant="secondary" className="text-xs">
          {ROLE_LABELS[role]}
        </Badge>
      </div>
    </header>
  );
}
