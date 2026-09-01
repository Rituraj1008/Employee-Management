import Link from "next/link";
import { LandingNavbar } from "./landing-navbar";
import { Button } from "@/components/ui/button";
import {
  Users, Clock, CalendarOff, CheckSquare, Building2,
  UsersRound, BarChart3, Shield, ArrowRight,
  TrendingUp, ClipboardList, UserCheck, Bell,
  Settings, Banknote, Zap, Globe, Lock,
} from "lucide-react";

/* ─── Data ──────────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Users,
    title: "Employee Management",
    description: "Centralized profiles, role assignments, department mapping, and full lifecycle management.",
    gradient: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    border: "hover:border-blue-500/30",
    glow: "hover:shadow-blue-500/10",
  },
  {
    icon: Clock,
    title: "Attendance Tracking",
    description: "Real-time check-in/out, break tracking, and precise working hours per employee.",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    border: "hover:border-emerald-500/30",
    glow: "hover:shadow-emerald-500/10",
  },
  {
    icon: CalendarOff,
    title: "Leave Management",
    description: "Streamlined requests, multi-type balances, approval workflows, and status tracking.",
    gradient: "from-amber-500/20 to-amber-600/5",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    border: "hover:border-amber-500/30",
    glow: "hover:shadow-amber-500/10",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    description: "Assign tasks with priorities, track progress across statuses, and collaborate inline.",
    gradient: "from-violet-500/20 to-violet-600/5",
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10",
    border: "hover:border-violet-500/30",
    glow: "hover:shadow-violet-500/10",
  },
  {
    icon: UsersRound,
    title: "Team Management",
    description: "Create teams, assign managers, and manage cross-department collaboration seamlessly.",
    gradient: "from-rose-500/20 to-rose-600/5",
    iconColor: "text-rose-500",
    iconBg: "bg-rose-500/10",
    border: "hover:border-rose-500/30",
    glow: "hover:shadow-rose-500/10",
  },
  {
    icon: Building2,
    title: "Departments",
    description: "Organize your company with dedicated managers and clear reporting hierarchies.",
    gradient: "from-cyan-500/20 to-cyan-600/5",
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/10",
    border: "hover:border-cyan-500/30",
    glow: "hover:shadow-cyan-500/10",
  },
  {
    icon: Banknote,
    title: "Salary & Payroll",
    description: "Set base salaries, generate attendance-based monthly slips, and track deductions.",
    gradient: "from-teal-500/20 to-teal-600/5",
    iconColor: "text-teal-500",
    iconBg: "bg-teal-500/10",
    border: "hover:border-teal-500/30",
    glow: "hover:shadow-teal-500/10",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Fine-grained permissions for Super Admin, HR, Manager, and Employee — out of the box.",
    gradient: "from-slate-500/20 to-slate-600/5",
    iconColor: "text-slate-500",
    iconBg: "bg-slate-500/10",
    border: "hover:border-slate-500/30",
    glow: "hover:shadow-slate-500/10",
  },
];

const ROLES = [
  {
    role: "Super Admin",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-500",
    icon: Settings,
    description: "Full organizational visibility — employees, departments, teams, tasks, and all approval flows.",
    capabilities: ["Manage all employees & departments", "Oversee all leave & attendance", "Full task and team visibility", "Salary management & payroll"],
  },
  {
    role: "HR",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    dot: "bg-violet-500",
    icon: UserCheck,
    description: "People operations — onboarding, leave approvals, attendance review, and HR reporting.",
    capabilities: ["Employee onboarding & profiles", "Approve/reject leave requests", "Monitor attendance trends", "Department management"],
  },
  {
    role: "Manager",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    icon: UsersRound,
    description: "Team-centric — track attendance, manage tasks, and handle team leave requests.",
    capabilities: ["Team attendance overview", "Assign & track team tasks", "Review team leave requests", "Monitor team performance"],
  },
  {
    role: "Employee",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    icon: Bell,
    description: "Personal dashboard — check in/out, apply for leave, view tasks, and track your salary slip.",
    capabilities: ["Daily check-in / check-out", "Apply for leave", "View task assignments", "View own salary slip"],
  },
];

const STATS = [
  { value: "4", label: "Role Types", sub: "Admin · HR · Manager · Employee", color: "text-blue-500" },
  { value: "8+", label: "Core Modules", sub: "Employees, Leaves, Tasks, Salary…", color: "text-violet-500" },
  { value: "100%", label: "Web-Based", sub: "No install. Any device, anywhere.", color: "text-emerald-500" },
  { value: "∞", label: "Scalable", sub: "Grows with your team, always.", color: "text-amber-500" },
];

const WHY = [
  { icon: Zap, title: "Fast to set up", desc: "Get your team running in under 10 minutes — no IT required." },
  { icon: Globe, title: "Works everywhere", desc: "Fully web-based. Runs on any browser, any device, any OS." },
  { icon: Lock, title: "Secure by default", desc: "JWT sessions, bcrypt passwords, and role-based guards on every route." },
  { icon: BarChart3, title: "Data you can trust", desc: "Real-time dashboard KPIs always reflect live attendance and task data." },
];

/* ─── Dashboard mockup ───────────────────────────────────────────────────────── */

function DashboardMockup() {
  return (
    <div className="relative">
      {/* Outer glow */}
      <div className="absolute -inset-4 rounded-2xl bg-primary/10 blur-2xl pointer-events-none" />

      <div className="relative rounded-2xl overflow-hidden border border-white/10 dark:border-white/8 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900/95 border-b border-white/8">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-4 h-5 rounded-md bg-white/8 text-[10px] flex items-center justify-center text-white/30 font-mono tracking-tight select-none">
            app.emplyra.io/dashboard
          </div>
        </div>

        {/* App shell */}
        <div className="flex h-[400px] bg-zinc-950">
          {/* Sidebar */}
          <div className="w-48 shrink-0 border-r border-white/8 bg-zinc-900/80 p-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-2 mb-4 px-2 py-1">
              <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-[9px] text-white font-bold shadow-lg shadow-blue-600/40">E</div>
              <span className="font-semibold text-[11px] text-white/90 tracking-tight">Emplyra</span>
            </div>
            {[
              { label: "Dashboard", active: true, dot: "bg-blue-500" },
              { label: "Employees", active: false, dot: "bg-zinc-600" },
              { label: "Attendance", active: false, dot: "bg-zinc-600" },
              { label: "Leaves", active: false, dot: "bg-zinc-600" },
              { label: "Tasks", active: false, dot: "bg-zinc-600" },
              { label: "Teams", active: false, dot: "bg-zinc-600" },
              { label: "Salary", active: false, dot: "bg-zinc-600" },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                  item.active
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.dot}`} />
                {item.label}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 overflow-hidden p-5 space-y-4 bg-zinc-950">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-white/90">Good morning, Admin</div>
                <div className="text-[9px] text-white/30 mt-0.5">Monday, September 01, 2026</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white/40" />
                </div>
                <div className="h-6 px-3 rounded-lg bg-blue-600/80 text-[9px] text-white flex items-center font-medium">+ Add Employee</div>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Total Employees", val: "124", delta: "+3", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                { label: "Present Today", val: "98", delta: "+12", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                { label: "On Leave", val: "12", delta: "-2", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                { label: "Pending Tasks", val: "7", delta: "+1", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
              ].map((card) => (
                <div key={card.label} className={`rounded-xl border ${card.border} ${card.bg} p-3 space-y-2`}>
                  <div className="text-[8px] text-white/40 font-medium">{card.label}</div>
                  <div className="flex items-end justify-between">
                    <span className={`text-base font-bold ${card.color}`}>{card.val}</span>
                    <span className={`text-[8px] ${card.color} opacity-70`}>{card.delta}</span>
                  </div>
                  <div className={`h-1 rounded-full ${card.color} opacity-30 w-full`}>
                    <div className={`h-full rounded-full ${card.color.replace("text-", "bg-")} opacity-80`} style={{ width: "70%" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom panels */}
            <div className="grid grid-cols-5 gap-2 h-[180px]">
              {/* Recent employees */}
              <div className="col-span-3 rounded-xl border border-white/8 bg-white/3 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                  <span className="text-[9px] font-semibold text-white/60">Recent Employees</span>
                  <span className="text-[8px] text-blue-400">View all</span>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { name: "Sarah Chen", role: "HR", dept: "People Ops", color: "bg-violet-500" },
                    { name: "Alex Kumar", role: "Manager", dept: "Engineering", color: "bg-amber-500" },
                    { name: "Priya Das", role: "Employee", dept: "Design", color: "bg-emerald-500" },
                  ].map((emp) => (
                    <div key={emp.name} className="flex items-center gap-2.5 px-3 py-2">
                      <div className={`h-5 w-5 rounded-full ${emp.color}/20 border border-white/10 flex items-center justify-center text-[7px] text-white/60 font-bold shrink-0`}>
                        {emp.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-medium text-white/80 truncate">{emp.name}</div>
                        <div className="text-[7px] text-white/30">{emp.dept}</div>
                      </div>
                      <div className={`text-[7px] px-1.5 py-0.5 rounded-full ${emp.color}/15 text-white/50 border border-white/8`}>{emp.role}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance ring + tasks */}
              <div className="col-span-2 flex flex-col gap-2">
                <div className="flex-1 rounded-xl border border-white/8 bg-white/3 p-3">
                  <div className="text-[9px] font-semibold text-white/60 mb-2">Today&apos;s Attendance</div>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="65 35" strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-400">79%</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /><span className="text-[8px] text-white/50">Present 98</span></div>
                      <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" /><span className="text-[8px] text-white/50">Leave 12</span></div>
                      <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-red-500" /><span className="text-[8px] text-white/50">Absent 14</span></div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                  <div className="text-[9px] font-semibold text-white/60 mb-1.5">Active Tasks</div>
                  <div className="space-y-1">
                    {[{ w: "w-3/4", c: "bg-red-500" }, { w: "w-1/2", c: "bg-amber-500" }, { w: "w-4/5", c: "bg-blue-500" }].map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`h-1 rounded-full bg-white/10 flex-1`}><div className={`h-full rounded-full ${t.c}/60 ${t.w}`} /></div>
                        <div className={`h-1.5 w-1.5 rounded-full ${t.c}/80 shrink-0`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <div className="min-h-dvh bg-background text-foreground overflow-x-hidden">
      <LandingNavbar isLoggedIn={isLoggedIn} />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden noise">
        {/* Background orbs */}
        <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-20%] left-[10%] w-[700px] h-[700px] rounded-full bg-primary/8 blur-[120px] animate-orb" />
          <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-500/6 blur-[100px] animate-orb-slow" />
          <div className="absolute bottom-0 left-[30%] w-[400px] h-[300px] rounded-full bg-cyan-500/5 blur-[80px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium border border-primary/20 bg-primary/5 text-primary backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              Built for modern HR teams · 8 core modules
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.06] text-foreground">
              The employee platform
              <br />
              <span className="text-gradient">your team deserves.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto font-light">
              Employees, attendance, leave, tasks, salary, and teams — unified in one
              precision-built platform. No bloat. No spreadsheets.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Button asChild size="lg" className="btn-shimmer h-12 px-8 text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 border-0">
              <Link href="/login">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-sm rounded-xl border-border/60 backdrop-blur-sm hover:border-primary/30">
              <Link href="#features">
                See all features
              </Link>
            </Button>
          </div>

          {/* Trust */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-xs text-muted-foreground">
            {["No credit card needed", "4 roles built-in", "Setup in minutes", "Fully web-based"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary/60" />
                {item}
              </span>
            ))}
          </div>

          {/* Mockup */}
          <div className="mt-20 max-w-5xl mx-auto animate-float-slow">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 border-y border-border/50 bg-muted/20" />
        <div className="relative max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center group">
              <div className={`text-4xl sm:text-5xl font-bold tabular-nums stat-number ${stat.color} drop-shadow-sm`}>
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-foreground mt-2">{stat.label}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/4 blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest border border-primary/20 bg-primary/5 text-primary mb-4">
              Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Everything HR needs,
              <br />
              <span className="text-muted-foreground font-normal">nothing it doesn&apos;t.</span>
            </h2>
            <p className="mt-4 text-muted-foreground/80">
              Eight tightly integrated modules covering the complete employee management lifecycle.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`feature-card group relative rounded-2xl border border-border/60 bg-card p-6 overflow-hidden cursor-default ${feature.border} hover:shadow-xl ${feature.glow}`}
                >
                  {/* Ambient gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                  <div className="relative">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${feature.iconBg} mb-5 ring-1 ring-white/10`}>
                      <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground mb-2 tracking-tight">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ROLES ─────────────────────────────────────────────────────────────── */}
      <section id="solutions" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/20 border-y border-border/50" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest border border-primary/20 bg-primary/5 text-primary mb-4">
              Role-Based Experience
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Tailored for everyone
              <br />
              <span className="text-muted-foreground font-normal">on your team.</span>
            </h2>
            <p className="mt-4 text-muted-foreground/80">
              Each user sees exactly what they need. No noise. No missing features.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.role}
                  className={`group rounded-2xl border ${role.border} bg-card p-6 space-y-5 hover:shadow-lg transition-all duration-200 hover:border-current relative overflow-hidden`}
                >
                  {/* Top */}
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${role.bg} ring-1 ring-white/10`}>
                      <Icon className={`h-5 w-5 ${role.color}`} />
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${role.bg} ${role.color} border ${role.border}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${role.dot}`} />
                      {role.role}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>

                  {/* Capabilities */}
                  <ul className="space-y-2">
                    {role.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-2.5 text-xs text-foreground/80">
                        <div className={`h-4 w-4 rounded-md ${role.bg} flex items-center justify-center shrink-0`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${role.dot}`} />
                        </div>
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

      {/* ── WHY WORKFORCE ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest border border-primary/20 bg-primary/5 text-primary mb-6">
                Why Emplyra
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                Built to replace<br />
                your HR headaches.
              </h2>
              <p className="mt-4 text-muted-foreground/80 leading-relaxed">
                No more juggling spreadsheets, chasing approvals over WhatsApp, or losing track of who&apos;s on leave. Emplyra brings it all into one intentional platform.
              </p>
              <div className="mt-8 flex flex-col gap-4">
                {WHY.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-primary/20">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Workflow steps */}
            <div id="workflow" className="space-y-3">
              {[
                { n: "01", t: "Employee Joins", d: "HR creates the profile and assigns department, designation, and role — instantly active.", color: "border-blue-500/30 bg-blue-500/5", num: "text-blue-500" },
                { n: "02", t: "HR Configures", d: "Set up leave types, balances, attendance rules, and salary in minutes.", color: "border-violet-500/30 bg-violet-500/5", num: "text-violet-500" },
                { n: "03", t: "Manager Leads", d: "Assign tasks, track team attendance, review leave — all from one dashboard.", color: "border-amber-500/30 bg-amber-500/5", num: "text-amber-500" },
                { n: "04", t: "Employee Performs", d: "Check in, apply for leave, complete tasks, and view their own salary slip.", color: "border-emerald-500/30 bg-emerald-500/5", num: "text-emerald-500" },
                { n: "05", t: "Admin Oversees", d: "Full organizational picture with live KPIs, payroll management, and quick actions.", color: "border-rose-500/30 bg-rose-500/5", num: "text-rose-500" },
              ].map((step) => (
                <div key={step.n} className={`flex items-start gap-4 rounded-2xl border ${step.color} p-4`}>
                  <span className={`text-2xl font-black tabular-nums ${step.num} shrink-0 leading-none mt-0.5`}>{step.n}</span>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{step.t}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────────── */}
      <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Dark background */}
            <div className="absolute inset-0 bg-zinc-950 dark:bg-zinc-900" />
            {/* Orbs */}
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/20 blur-[80px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-violet-500/15 blur-[80px]" />
            {/* Border */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10" />

            <div className="relative z-10 text-center px-8 py-16 sm:py-20 sm:px-16">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border border-white/15 bg-white/8 text-white/70 mb-6">
                <TrendingUp className="h-3 w-3" />
                Ready to modernize your HR?
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Start managing your
                <br />
                <span className="text-gradient">your team today.</span>
              </h2>
              <p className="mt-5 text-white/50 max-w-lg mx-auto leading-relaxed">
                Set up your team, configure roles, and start tracking attendance, leaves, tasks, and salary — all in under 10 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
                <Button asChild size="lg" className="btn-shimmer h-12 px-8 text-sm font-semibold rounded-xl border-0 shadow-lg shadow-primary/30">
                  <Link href="/login">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-white/30 mt-4">No credit card required. Setup in minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30">
                  E
                </div>
                <span className="font-bold text-foreground tracking-tight">Emplyra</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Modern employee management for teams of all sizes. Attendance, leaves, tasks, salary, and more in one place.
              </p>
            </div>

            {[
              { heading: "Product", links: ["Features", "Solutions", "Pricing", "Changelog"] },
              { heading: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { heading: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/70 mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Emplyra. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClipboardList className="h-3 w-3 text-primary" />
              Built for modern HR teams
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
