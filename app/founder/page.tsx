import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { getSession } from "@/lib/auth/session";
import { ArrowLeft, GitBranch, Globe, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "From the Founder | Emplyra",
  description:
    "A personal message from Ritu Raj, Founder & CEO of Emplyra — why he built it and what he hopes it means for your team.",
};

const SOCIAL = [
  {
    icon: Globe,
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/ritu-raj-ray-55a96a284/",
    display: "linkedin.com/in/ritu-raj-ray",
  },
  {
    icon: GitBranch,
    label: "GitHub",
    href: "https://github.com/Rituraj100",
    display: "github.com/Rituraj100",
  },
  {
    icon: Mail,
    label: "Email",
    href: "mailto:riturajray720@gmail.com",
    display: "riturajray720@gmail.com",
  },
];

export default async function FounderPage() {
  const session = await getSession().catch(() => null);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNavbar isLoggedIn={!!session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-28">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-14"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        {/* Page eyebrow */}
        <div className="flex items-center gap-4 mb-16">
          <div className="h-px flex-1 max-w-[60px] bg-primary/40" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            A note from the founder
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] gap-14 xl:gap-24 items-start">

          {/* ── LEFT: Identity card (sticky) ── */}
          <div className="lg:sticky lg:top-24 flex flex-col gap-7">

            {/* Photo */}
            <div className="relative">
              <div className="absolute -inset-3 rounded-3xl bg-primary/6 blur-2xl pointer-events-none" />
              <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-xl shadow-black/10 dark:shadow-black/40 aspect-[3/4]">
                <Image
                  src="https://riturajray.in/images/img2.png"
                  alt="Ritu Raj — Founder & CEO, Emplyra"
                  fill
                  sizes="(max-width: 1024px) 100vw, 380px"
                  className="object-cover object-top"
                  priority
                />
                {/* Subtle gradient at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-bold text-lg leading-tight tracking-tight">Ritu Raj</p>
                  <p className="text-white/60 text-xs mt-0.5 font-medium">Founder & CEO, Emplyra</p>
                </div>
              </div>
            </div>

            {/* Info below photo */}
            <div className="space-y-4">
              <div className="h-px bg-border/50" />

              {/* Social links */}
              <div className="space-y-3">
                {SOCIAL.map(({ icon: Icon, label, href, display }) => (
                  <a
                    key={label}
                    href={href}
                    target={label !== "Email" ? "_blank" : undefined}
                    rel={label !== "Email" ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 group"
                  >
                    <div className="h-7 w-7 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-primary/30 transition-colors shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {display}
                    </span>
                  </a>
                ))}
              </div>

              <div className="h-px bg-border/50" />

              <p className="text-[11px] text-muted-foreground/60 leading-relaxed font-mono">
                Building Emplyra full-time · India · 2024–present
              </p>
            </div>
          </div>

          {/* ── RIGHT: The letter ── */}
          <div className="max-w-[640px]">
            {/* Opening quote mark — typographic, not decorative */}
            <div
              className="text-[120px] leading-none text-primary/15 dark:text-primary/20 font-black select-none -mb-6 -ml-2"
              aria-hidden="true"
            >
              &ldquo;
            </div>

            {/* Letter body */}
            <div className="space-y-6 text-[15px] sm:text-[15.5px] leading-[1.9] text-foreground/75">
              <p>
                When I started building Emplyra, the question wasn&apos;t whether the
                product was needed — it was obvious that it was. Every company I knew
                was managing their team through a patchwork of spreadsheets, chasing
                leave approvals over WhatsApp, and spending hours assembling salary
                slips by hand at the end of every month.
              </p>

              <p>
                The tools that existed were either built for enterprises with six-figure
                IT budgets, or so stripped-down that they just shifted the problem
                somewhere else. Nobody had built something that simply&hellip; worked.
                For real teams. Without a week-long onboarding process.
              </p>

              <p className="text-foreground font-semibold">
                So I decided to build it myself.
              </p>

              <p>
                Emplyra handles attendance, leaves, tasks, salary, and team management
                — not as separate products bolted together, but as one cohesive system
                that understands how these things are connected. A leave affects
                attendance. Attendance affects payroll. Tasks belong to people on
                teams. None of that should require manual reconciliation.
              </p>

              {/* Pull quote */}
              <blockquote className="relative my-10 pl-6 border-l-2 border-primary/50">
                <p className="text-base sm:text-lg font-light italic text-foreground/80 leading-[1.75]">
                  &ldquo;Every decision in this product comes from one question: does
                  this make an HR manager&apos;s Monday morning meaningfully easier? If
                  yes, it ships. If it adds noise, it doesn&apos;t.&rdquo;
                </p>
              </blockquote>

              <p>
                We&apos;re still early. There&apos;s a long list of things I want to
                build next. But what exists today is solid, fast, and made with genuine
                care. I&apos;m proud of it — and I hope it makes a real difference for
                your team the way I always imagined it would.
              </p>

              <p>
                If you have questions, ideas, or feedback — reach me directly. I read
                every message.
              </p>

              <p className="text-foreground/90">
                Thank you for giving Emplyra a chance.
              </p>
            </div>

            {/* Signature block */}
            <div className="mt-12 pt-8 border-t border-border/50">
              <div className="flex items-end justify-between flex-wrap gap-6">
                <div>
                  {/* Stylised name as "signature" */}
                  <p
                    className="text-3xl font-black tracking-tight text-foreground"
                    style={{ fontStyle: "italic", letterSpacing: "-0.03em" }}
                  >
                    Ritu Raj
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Founder &amp; CEO, Emplyra
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">
                    September 2026
                  </p>
                </div>

                {/* Logo mark */}
                <div className="flex items-center gap-2.5 opacity-50">
                  <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-base shadow shadow-primary/30">
                    E
                  </div>
                  <span className="font-bold text-foreground tracking-tight text-sm">
                    Emplyra
                  </span>
                </div>
              </div>
            </div>

            {/* Direct contact nudge */}
            <div className="mt-10 rounded-xl border border-border/60 bg-muted/30 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Have a question or feedback? Ritu reads every message personally.
              </p>
              <a
                href="mailto:riturajray720@gmail.com"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline underline-offset-4 shrink-0"
              >
                <Mail className="h-3.5 w-3.5" />
                Send a message
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
