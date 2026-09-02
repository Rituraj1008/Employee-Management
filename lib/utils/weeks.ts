const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

// Mon–Sat dates for project-relative week N (1-indexed)
export function getWeekDates(projectStart: Date | string, weekNumber: number): Date[] {
  const monday = getMondayOfWeek(new Date(projectStart));
  monday.setDate(monday.getDate() + (weekNumber - 1) * 7);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// Total weeks from project start to deadline (min 1, default 8 if no deadline)
export function getTotalProjectWeeks(
  projectStart: Date | string,
  projectDeadline: Date | string | null,
): number {
  if (!projectDeadline) return 8;
  const ms = new Date(projectDeadline).getTime() - new Date(projectStart).getTime();
  return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
}

// "Sep 2 – Sep 7, 2026"
export function formatWeekRange(projectStart: Date | string, weekNumber: number): string {
  const days = getWeekDates(projectStart, weekNumber);
  const mon = days[0];
  const sat = days[5];
  const fmt = (d: Date) => `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
  return `${fmt(mon)} – ${fmt(sat)}, ${sat.getFullYear()}`;
}

// "Mon, Sep 2"
export function formatDayLabel(date: Date): string {
  return `${DAY_SHORT[date.getDay()]}, ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

// "YYYY-MM-DD" local
export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
