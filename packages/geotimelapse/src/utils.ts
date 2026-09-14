import { format } from 'date-fns';

/** Manual on purpose: the end-of-day marker 24:00:00 has no date-fns spelling. */
export function formatDayTime(daySeconds: number): string {
  const total = Math.max(Math.floor(daySeconds), 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// An arbitrary DST-free local date carrying a time of day for date-fns.
function dayTimeAsDate(daySeconds: number): Date {
  const total = Math.max(Math.floor(daySeconds), 0);
  return new Date(2000, 0, 1, Math.floor(total / 3600) % 24, Math.floor((total % 3600) / 60), total % 60);
}

/** US-style clock time, e.g. "2:30 AM"; the end of day wraps to "12:00 AM". */
export function formatDayTime12(daySeconds: number): string {
  return format(dayTimeAsDate(daySeconds), 'h:mm a');
}

/** Compact 24-hour time, e.g. "2:30" or "13:05". */
export function formatDayTime24(daySeconds: number): string {
  return format(dayTimeAsDate(daySeconds), 'H:mm');
}

/** Compact 24-hour label for a full hour, e.g. 2 → "2:00"; 24 marks the end of day. */
export function formatHourLabel(hour: number): string {
  return hour === 24 ? '24:00' : formatDayTime24(hour * 3600);
}
