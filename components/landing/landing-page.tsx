import Link from "next/link";
import { LandingNavbar } from "./landing-navbar";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  CalendarOff,
  CheckSquare,
  Building2,
  UsersRound,
  BarChart3,
  Shield,
  ArrowRight,
  ChevronRight,
  Star,
  TrendingUp,
  ClipboardList,
  UserCheck,
  Bell,
  Settings,
} from "lucide-react";

/* ── Feature data ──────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Users,
    title: "Employee Management",
    description: "Centralized employee profiles, role assignments, department mapping, and lifecycle management.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    icon: Clock,
    title: "Attendance Tracking",
    description: "Real-time check-in/check-out, break tracking, and working hours calculation per employee.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    icon: CalendarOff,
    title: "Leave Management",
    description: "Streamlined leave requests, multi-type balances, approval workflows, and status tracking.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    description: "Assign tasks with priorities, track progress across statuses, and collaborate with comments.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    icon: UsersRound,
    title: "Team Management",
    description: "Create teams, assign managers, track membership, and manage cross-department collaboration.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
  {
    icon: Building2,
    title: "Department Structure",
    description: "Organize your company into departments with dedicated managers and clear reporting hierarchies.",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
  },
  {
    icon: BarChart3,
    title: "Insights & Reports",
    description: "Dashboard KPIs for attendance rates, leave summaries, task completion, and team performance.",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Fine-grained permissions for Super Admin, HR, Manager, and Employee roles out of the box.",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800/40",
  },
];

/* ── Role data ─────────────────────────────────────────────────────────────── */

const ROLES = [
  {
    role: "Super Admin",
    badge: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
    icon: Settings,
    description: "Full visibility across the organization — employees, departments, teams, tasks, and all approval flows.",
    capabilities: ["Manage all employees & departments", "Oversee all leave & attendance", "Full task and team visibility", "System configuration"],
  },
  {
    role: "HR",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
    icon: UserCheck,
    description: "Focus on people operations — onboarding, leave approvals, attendance review, and HR reporting.",
    capabilities: ["Employee onboarding & profiles", "Approve/reject leave requests", "Monitor attendance trends", "Department management"],
  },
  {
    role: "Manager",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    icon: UsersRound,
    description: "Team-centric view — track your team's attendance, manage task assignments, and approve team requests.",
    capabilities: ["Team attendance overview", "Assign & track team tasks", "Review team leave requests", "Monitor team performance"],
  },
  {
    role: "Employee",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    icon: Bell,
    description: "Personal dashboard — check in/out, apply for leave, view assigned tasks, and track your own performance.",
    capabilities: ["Daily check-in / check-out", "Apply for leave", "View task assignments", "Track leave balances"],
  },
];

/* ── Workflow steps ────────────────────────────────────────────────────────── */

const WORKFLOW = [
  { step: "01", title: "Employee Joins", desc: "HR creates the employee profile and assigns department, designation, and role." },
  { step: "02", title: "HR Manages", desc: "HR configures leave types, balances, and ensures all records are up to date." },
  { step: "03", title: "Manager Collaborates", desc: "Managers assign tasks, track team attendance, and review leave requests." },
  { step: "04", title: "Employee Performs", desc: "Employees check in daily, complete tasks, and manage their own leave requests." },
  { step: "05", title: "Admin Oversees", desc: "Admins get a full organizational picture with KPIs, reports, and quick actions." },
];

/* ── Stats ─────────────────────────────────────────────────────────────────── */

const STATS = [
  { value: "4", label: "Role Types", sublabel: "Admin · HR · Manager · Employee" },
  { value: "7+", label: "Core Modules", sublabel: "Employees, Attendance, Leaves..." },
  { value: "100%", label: "Web-Based", sublabel: "No install required" },
  { value: "∞", label: "Scalable", sublabel: "Grows with your team" },
];

/* ── Dashboard preview ─────────────────────────────────────────────────────── */

function DashboardPreview() {
  return (
    <div className="relative rounded-xl border border-border bg-card shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 mx-4 h-5 rounded bg-border/60 text-[10px] flex items-center px-3 text-muted-foreground">
          app.workforce.io/dashboard
        </div>
      </div>

      {/* App shell */}
      <div className="flex h-[380px] text-xs">
        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r border-border bg-sidebar p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="h-5 w-5 rounded bg-primary flex items-center justify-center text-[8px] text-primary-foreground font-bold">W</div>
            <span className="font-semibold text-[10px] text-sidebar-foreground">WorkForce</span>
          </div>
          {[
            { label: "Dashboard", active: true },
            { label: "Employees", active: false },
            { label: "Attendance", active: false },
            { label: "Leaves", active: false },
            { label: "Tasks", active: false },
            { label: "Teams", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-[10px] ${
                item.active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-sidebar-foreground/60"
              }`}
            >
              <div className="h-2.5 w-2.5 rounded-sm bg-current opacity-60" />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 overflow-hidden bg-background p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 w-20 rounded bg-foreground/80" />
              <div className="h-2 w-28 rounded bg-muted-foreground/40 mt-1" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded bg-muted" />
              <div className="h-6 w-16 rounded bg-primary/20" />
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Employees", val: "124", color: "bg-blue-500" },
              { label: "Present", val: "98", color: "bg-emerald-500" },
              { label: "On Leave", val: "12", color: "bg-amber-500" },
              { label: "Pending", val: "7", color: "bg-violet-500" },
            ].map((card) => (
              <div key={card.label} className="rounded-lg border border-border bg-card p-2.5 space-y-1.5">
                <div className="text-[8px] text-muted-foreground uppercase tracking-wide">{card.label}</div>
                <div className="text-sm font-semibold text-foreground">{card.val}</div>
                <div className={`h-1 rounded-full ${card.color} w-8`} />
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-2">
            {/* Teams list */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <div className="h-2 w-16 rounded bg-foreground/70" />
              </div>
              <div className="divide-y divide-border">
                {["Engineering", "Product", "Design"].map((team) => (
                  <div key={team} className="flex items-center justify-between px-3 py-2">
                    <div className="h-2 w-16 rounded bg-muted-foreground/40" />
                    <div className="h-3 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks list */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <div className="h-2 w-16 rounded bg-foreground/70" />
              </div>
              <div className="divide-y divide-border">
                {[
                  { priority: "bg-red-400", w: "w-20" },
                  { priority: "bg-amber-400", w: "w-24" },
                  { priority: "bg-blue-400", w: "w-16" },
                ].map((task, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <div className={`h-2 rounded bg-muted-foreground/40 ${task.w}`} />
                    <div className={`h-3 w-8 rounded-full ${task.priority} opacity-20`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page component ────────────────────────────────────────────────────────── */

export function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNavbar isLoggedIn={isLoggedIn} />



      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-20 right-0 w-[300px] h-[300px] rounded-full bg-primary/3 blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Built for modern HR teams
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              Manage Your Workforce.{" "}
              <span className="text-gradient">Simplify Your HR.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              WorkForce brings employees, attendance, leave, tasks, and team management
              into one unified platform — designed for teams that value clarity and efficiency.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Button asChild size="lg" className="h-11 px-6 text-sm font-medium">
              <Link href="/login">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-6 text-sm">
              <Link href="#features">
                Explore features
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 mt-10 text-xs text-muted-foreground">
            {["No credit card required", "4 role types built in", "Setup in minutes"].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Star className="h-3 w-3 text-primary fill-primary" />
                {item}
              </div>
            ))}
          </div>

          {/* Product preview */}
          <div className="mt-16 max-w-5xl mx-auto">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-foreground stat-number">{stat.value}</div>
              <div className="text-sm font-medium text-foreground/80 mt-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.sublabel}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Platform Features</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything your HR team needs
            </h2>
            <p className="mt-4 text-muted-foreground">
              Eight core modules designed to cover the complete employee management lifecycle.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${feature.bg} mb-4`}>
                    <Icon className={`h-4 w-4 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-2">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Role Solutions ─────────────────────────────────────────────────── */}
      <section id="solutions" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/20 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Role-Based Experience</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Tailored for every role
            </h2>
            <p className="mt-4 text-muted-foreground">
              Each user sees exactly what they need — no more, no less.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.role}
                  className="rounded-xl border border-border bg-card p-5 space-y-4 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${role.badge}`}>
                      {role.role}
                    </span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>
                  <ul className="space-y-1.5">
                    {role.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-2 text-xs text-foreground/80">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Workflow ───────────────────────────────────────────────────────── */}
      <section id="workflow" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">How it works</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              The complete employee lifecycle
            </h2>
            <p className="mt-4 text-muted-foreground">
              From onboarding to daily operations — one connected flow.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-6 left-8 right-8 h-px bg-border hidden sm:block" aria-hidden="true" />

            <div className="grid sm:grid-cols-5 gap-8 relative">
              {WORKFLOW.map((step, i) => (
                <div key={step.step} className="flex flex-col items-center text-center sm:items-center">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background border-2 border-primary text-primary font-bold text-sm mb-4 shadow-sm">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-2">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-10 sm:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
              <TrendingUp className="h-3 w-3" />
              Ready to streamline HR?
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Start managing your workforce today
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Set up your team, configure roles, and start tracking attendance and leaves — all in under 10 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Button asChild size="lg" className="h-11 px-7 text-sm font-medium">
                <Link href="/login">
                  Get started now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-6">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                  W
                </div>
                <span className="font-semibold text-foreground">WorkForce</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Modern workforce management for teams of all sizes. Manage employees, attendance, leaves, and tasks in one place.
              </p>
            </div>

            {/* Links */}
            {[
              {
                heading: "Product",
                links: ["Features", "Solutions", "Pricing", "Changelog"],
              },
              {
                heading: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
              {
                heading: "Legal",
                links: ["Privacy", "Terms", "Security", "Cookies"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} WorkForce. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClipboardList className="h-3 w-3 text-primary" />
              Built for modern HR teams
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
