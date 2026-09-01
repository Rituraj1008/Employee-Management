import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";

export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm");
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function calcWorkingMinutes(checkIn: Date, checkOut: Date): number {
  return differenceInMinutes(checkOut, checkIn);
}

export function formatWorkingHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function getTodayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// Returns a Date object for the start of today's LOCAL calendar date, stored
// as UTC midnight so node-postgres writes the correct date to Postgres `date` columns.
export function getTodayDate(): Date {
  return new Date(format(new Date(), "yyyy-MM-dd") + "T00:00:00.000Z");
}

export function getDatesBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}
