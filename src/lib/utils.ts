import { format } from "date-fns";

export function getTodayDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getCurrentHourMinute(): { hour: number; minute: number } {
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

export function isWriteTime(): boolean {
  // Between 20:30 and 21:30 is "write window" for demo flexibility
  // Strict: 21:00 reminder
  const { hour, minute } = getCurrentHourMinute();
  return (hour === 20 && minute >= 30) || (hour === 21 && minute < 30);
}

export function isReceiveTime(): boolean {
  // After 21:30
  const { hour, minute } = getCurrentHourMinute();
  return hour > 21 || (hour === 21 && minute >= 30);
}

export function canWriteToday(): boolean {
  // Always allow writing for demo; in production restrict to evening
  return true;
}
