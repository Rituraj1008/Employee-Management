import Link from "next/link";
import { LandingNavbar } from "./landing-navbar";
import { Button } from "@/components/ui/button";
import {
  Users, Clock, CalendarOff, CheckSquare, Building2,
  UsersRound, BarChart3, Shield, ArrowRight,
  TrendingUp, UserCheck, Bell,
  Settings, Banknote, Zap, Globe, Lock,
  GitBranch, X, Mail,
} from "lucide-react";

/* ─── Data ──────────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Users,
    title: "Employee Management",
    description: "Centralized profiles, role assignments, department mapping, and full lifecycle management.",
    gradient: "from-orange-500/20 to-orange-600/5",
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    border: "hover:border-orange-500/30",
    glow: "hover:shadow-orange-500/10",
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
    gradient: "from-purple-500/20 to-purple-600/5",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
    border: "hover:border-purple-500/30",
    glow: "hover:shadow-purple-500/10",
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
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    dot: "bg-purple-500",
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
  { value: "4", label: "Role Types", sub: "Admin · HR · Manager · Employee", color: "text-orange-500" },
  { value: "8+", label: "Core Modules", sub: "Employees, Leaves, Tasks, Salary…", color: "text-amber-500" },
  { value: "100%", label: "Web-Based", sub: "No install. Any device, anywhere.", color: "text-emerald-500" },
  { value: "∞", label: "Scalable", sub: "Grows with your team, always.", color: "text-yellow-600 dark:text-yellow-400" },
];

const ACTIVITY_FEED = [
  {
    icon: Clock,
    action: "Sarah Chen checked in",
    time: "Today, 09:02 AM",
    status: "Present",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    statusBg: "bg-emerald-500/10",
    statusColor: "text-emerald-400",
    statusBorder: "border-emerald-500/20",
  },
  {
    icon: CalendarOff,
    action: "Alex Kumar — leave approved",
    time: "Today, 09:15 AM",
    status: "Approved",
    iconBg: "bg-orange-500/15",
    iconColor: "text-orange-400",
    statusBg: "bg-orange-500/10",
    statusColor: "text-orange-400",
    statusBorder: "border-orange-500/20",
  },
  {
    icon: CheckSquare,
    action: "Design system review assigned",
    time: "Today, 09:31 AM",
    status: "Assigned",
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
    statusBg: "bg-purple-500/10",
    statusColor: "text-purple-400",
    statusBorder: "border-purple-500/20",
  },
  {
    icon: Banknote,
    action: "August salary slips generated",
    time: "Today, 10:00 AM",
    status: "Generated",
    iconBg: "bg-teal-500/15",
    iconColor: "text-teal-400",
    statusBg: "bg-teal-500/10",
    statusColor: "text-teal-400",
    statusBorder: "border-teal-500/20",
  },
  {
    icon: Users,
    action: "Engineering team — 3 members added",
    time: "Today, 10:14 AM",
    status: "Updated",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    statusBg: "bg-amber-500/10",
    statusColor: "text-amber-400",
    statusBorder: "border-amber-500/20",
  },
];

const TICKER_ITEMS = [
  "Employee Management",
  "Attendance Tracking",
  "Leave Management",
  "Task Assignment",
  "Team Management",
  "Salary & Payroll",
  "Role-Based Access",
  "Department Setup",
  "Approval Workflows",
  "HR Analytics",
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
              <div className="h-6 w-6 rounded-lg bg-orange-600 flex items-center justify-center text-[9px] text-white font-bold shadow-lg shadow-orange-600/40">E</div>
              <span className="font-semibold text-[11px] text-white/90 tracking-tight">Emplyra</span>
            </div>
            {[
              { label: "Dashboard", active: true, dot: "bg-orange-500" },
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
                    ? "bg-orange-600/20 text-orange-400 border border-orange-500/20"
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
                <div className="h-6 px-3 rounded-lg bg-orange-600/80 text-[9px] text-white flex items-center font-medium">+ Add Employee</div>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Total Employees", val: "124", delta: "+3", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
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
                  <span className="text-[8px] text-orange-400">View all</span>
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
                    {[{ w: "w-3/4", c: "bg-orange-500" }, { w: "w-1/2", c: "bg-amber-500" }, { w: "w-4/5", c: "bg-rose-500" }].map((t, i) => (
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
      <section className="relative overflow-hidden noise">
        {/* Background — single light source, top-right; dot grid for depth */}
        <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -right-32 w-[900px] h-[900px] rounded-full bg-primary/7 blur-[150px]" />
          <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full bg-amber-500/6 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.018] dark:opacity-[0.045]"
            style={{
              backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-14 xl:gap-20 items-center pt-32 pb-20 lg:pt-40 lg:pb-28">

            {/* ── LEFT: Typography column ── */}
            <div className="flex flex-col">

              {/* Eyebrow — monospace with a hairline rule */}
              <div className="flex items-center gap-3 mb-10 animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both">
                <div className="h-px w-10 bg-primary/50 shrink-0" />
                <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.22em]">
                  Emplyra · Employee Management
                </span>
              </div>

              {/* Headline — light/black weight contrast is the typographic signature */}
              <h1 className="animate-in fade-in slide-in-from-left-4 duration-700 delay-100 fill-mode-both">
                <span className="block text-[2.8rem] sm:text-6xl lg:text-[4rem] xl:text-[4.75rem] leading-[1.06] font-extralight tracking-tight text-foreground/60">
                  The platform
                </span>
                <span className="block text-[2.8rem] sm:text-6xl lg:text-[4rem] xl:text-[4.75rem] leading-[1.06] font-extralight tracking-tight text-foreground/60">
                  HR teams
                </span>
                <span className="block text-[2.8rem] sm:text-6xl lg:text-[4rem] xl:text-[4.75rem] leading-[1.06] font-black tracking-tight text-gradient">
                  actually want.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-7 text-base sm:text-lg text-muted-foreground/75 leading-relaxed max-w-[360px] font-light animate-in fade-in slide-in-from-left-4 duration-700 delay-200 fill-mode-both">
                Attendance, leaves, tasks, and payroll — all in one place.
                No spreadsheets. No WhatsApp threads. Just clarity.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mt-10 animate-in fade-in slide-in-from-left-4 duration-700 delay-300 fill-mode-both">
                <Button asChild size="lg" className="btn-shimmer h-12 px-8 text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 border-0">
                  <Link href="/login">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="h-12 px-8 text-sm rounded-xl text-muted-foreground hover:text-foreground">
                  <Link href="#features">See all features</Link>
                </Button>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-9 animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both" style={{ animationDelay: "420ms" }}>
                {["No credit card needed", "4 roles built-in", "Setup in minutes"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Live activity feed — the signature element ── */}
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-700 delay-200 fill-mode-both">
              {/* Ambient glow behind card */}
              <div className="absolute -inset-6 rounded-3xl bg-primary/5 blur-3xl pointer-events-none" />

              <div className="relative rounded-2xl border border-white/10 dark:border-white/[0.07] bg-zinc-950 overflow-hidden shadow-[0_32px_72px_-16px_rgba(0,0,0,0.6)]">

                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg bg-orange-600 flex items-center justify-center text-[9px] text-white font-black shadow-lg shadow-orange-600/40">
                      E
                    </div>
                    <span className="text-[11px] font-semibold text-white/60 tracking-tight">Emplyra Workspace</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">Live</span>
                  </div>
                </div>

                {/* Activity items */}
                <div className="px-4 py-1 divide-y divide-white/[0.05]">
                  {ACTIVITY_FEED.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-3.5 animate-in fade-in slide-in-from-right-4 fill-mode-both"
                        style={{ animationDuration: "500ms", animationDelay: `${380 + i * 110}ms` }}
                      >
                        <div className={`h-8 w-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-white/80 truncate">{item.action}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{item.time}</p>
                        </div>
                        <div className={`shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${item.statusBg} ${item.statusColor} ${item.statusBorder}`}>
                          {item.status}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-3 border-t border-white/[0.07] divide-x divide-white/[0.07]">
                  {[
                    { label: "Present", value: "98", color: "text-emerald-400" },
                    { label: "On Leave", value: "12", color: "text-amber-400" },
                    { label: "Tasks Due", value: "7", color: "text-violet-400" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="flex flex-col items-center py-4">
                      <span className={`text-xl font-black tabular-nums ${kpi.color}`}>{kpi.value}</span>
                      <span className="text-[9px] text-white/25 mt-0.5 uppercase tracking-wider font-medium">{kpi.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating feature chips below card */}
              <div
                className="flex flex-wrap gap-2 mt-4 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
                style={{ animationDelay: "800ms" }}
              >
                {["Attendance", "Leave Mgmt", "Tasks", "Payroll", "Role Access"].map((chip) => (
                  <span
                    key={chip}
                    className="text-[10px] font-medium px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground bg-background/40 backdrop-blur-sm"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom ticker strip ── */}
        <div className="border-t border-border/40 overflow-hidden bg-muted/5">
          <div className="flex animate-marquee">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div key={i} className="flex items-center gap-5 px-8 py-3.5 shrink-0">
                <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                <span className="text-[11px] font-medium text-muted-foreground/60 whitespace-nowrap tracking-wide">
                  {item}
                </span>
              </div>
            ))}
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
                { n: "01", t: "Employee Joins", d: "HR creates the profile and assigns department, designation, and role — instantly active.", color: "border-orange-500/30 bg-orange-500/5", num: "text-orange-500" },
                { n: "02", t: "HR Configures", d: "Set up leave types, balances, attendance rules, and salary in minutes.", color: "border-rose-500/30 bg-rose-500/5", num: "text-rose-500" },
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
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-amber-500/15 blur-[80px]" />
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
      <footer className="border-t border-border/60 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main grid */}
          <div className="py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
            {/* Brand — spans 2 cols */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                  E
                </div>
                <span className="font-bold text-foreground tracking-tight text-base">Emplyra</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed mb-7">
                Modern employee management for teams of all sizes. Attendance, leaves, tasks, salary — unified in one place.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-2">
                {[
                  { Icon: GitBranch, label: "GitHub" },
                  { Icon: X, label: "Twitter" },
                  { Icon: Globe, label: "LinkedIn" },
                  { Icon: Mail, label: "Email" },
                ].map(({ Icon, label }) => (
                  <Link
                    key={label}
                    href="#"
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {[
              {
                heading: "Product",
                links: ["Features", "Solutions", "Workflow", "Changelog", "Status"],
              },
              {
                heading: "Resources",
                links: ["Documentation", "API Reference", "Blog", "Support", "Community"],
              },
              {
                heading: "Company",
                links: ["About", "Careers", "Press", "Contact", "Partners"],
                hrefs: { About: "/founder" },
              },
              {
                heading: "Legal",
                links: ["Privacy", "Terms", "Security", "Cookies", "Accessibility"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        href={"hrefs" in col && col.hrefs?.[link as keyof typeof col.hrefs] ? col.hrefs[link as keyof typeof col.hrefs] : "#"}
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

          {/* Bottom bar */}
          <div className="border-t border-border/60 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Emplyra Inc. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              {["Privacy", "Terms of use", "Cookies", "Security", "Sitemap"].map((item) => (
                <Link
                  key={item}
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
