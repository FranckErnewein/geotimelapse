import { addDays, addMonths, format, startOfDay, startOfMonth } from 'date-fns';

import type { TimeDomain } from './types.js';

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

const DAY_S = 24 * 3600;
// Up to two days the axis speaks in hours; up to ~four months, in days.
const HOURS_AXIS_MAX_S = 2 * DAY_S;
const DAYS_AXIS_MAX_S = 120 * DAY_S;

export interface AxisTick {
  /** Position along the seek bar, in [0, 1]. */
  fraction: number;
  /** Null on unlabeled marks. */
  label: string | null;
}

/** Seek-bar axis ticks, scaled to the domain: hours, then days, then months. */
export function domainTicks({ start, spanSeconds }: TimeDomain): AxisTick[] {
  if (spanSeconds <= HOURS_AXIS_MAX_S) {
    const hours = Math.ceil(spanSeconds / 3600);
    const labelEvery = Math.max(2, Math.ceil(hours / 24) * 2);
    return Array.from({ length: hours + 1 }, (_, hour) => ({
      fraction: (hour * 3600) / spanSeconds,
      label: hour % labelEvery === 0 || hour === hours ? formatHourLabel(hour) : null,
    })).filter((tick) => tick.fraction <= 1);
  }
  if (start && spanSeconds > DAYS_AXIS_MAX_S) {
    const end = new Date(start.getTime() + spanSeconds * 1000);
    const multiYear = spanSeconds > 366 * DAY_S;
    const ticks: AxisTick[] = [];
    for (let at = startOfMonth(addMonths(start, 1)); at < end; at = addMonths(at, 1)) {
      ticks.push({
        fraction: (at.getTime() - start.getTime()) / (spanSeconds * 1000),
        label: format(at, multiYear ? 'MMM yy' : 'MMM'),
      });
    }
    return ticks;
  }
  const days = Math.ceil(spanSeconds / DAY_S);
  const labelEvery = Math.max(1, Math.ceil(days / 10));
  const tickEvery = days > 40 ? labelEvery : 1;
  if (start) {
    const end = new Date(start.getTime() + spanSeconds * 1000);
    const ticks: AxisTick[] = [];
    let index = 0;
    for (let at = startOfDay(addDays(start, 1)); at < end; at = addDays(at, 1), index++) {
      if (index % tickEvery !== 0) continue;
      ticks.push({
        fraction: (at.getTime() - start.getTime()) / (spanSeconds * 1000),
        label: index % labelEvery === 0 ? format(at, 'MMM d') : null,
      });
    }
    return ticks;
  }
  return Array.from({ length: Math.floor(days / tickEvery) + 1 }, (_, i) => ({
    fraction: (i * tickEvery * DAY_S) / spanSeconds,
    label: (i * tickEvery) % labelEvery === 0 ? `d${i * tickEvery}` : null,
  })).filter((tick) => tick.fraction <= 1);
}

/** The playhead's time label, scaled to the domain. */
export function formatPlayhead(seconds: number, { start, spanSeconds }: TimeDomain): string {
  if (spanSeconds <= HOURS_AXIS_MAX_S) return formatDayTime12(seconds);
  if (!start) return `day ${Math.floor(seconds / DAY_S) + 1}, ${formatDayTime24(seconds % DAY_S)}`;
  const at = new Date(start.getTime() + seconds * 1000);
  return format(at, spanSeconds <= DAYS_AXIS_MAX_S ? 'MMM d, h a' : 'MMM d');
}

/** The seek-bar hover label: like the playhead, in compact 24-hour style. */
export function formatHover(seconds: number, { start, spanSeconds }: TimeDomain): string {
  if (spanSeconds <= HOURS_AXIS_MAX_S) return formatDayTime24(seconds);
  if (!start) return `day ${Math.floor(seconds / DAY_S) + 1}, ${formatDayTime24(seconds % DAY_S)}`;
  const at = new Date(start.getTime() + seconds * 1000);
  return format(at, spanSeconds <= DAYS_AXIS_MAX_S ? 'MMM d, H:mm' : 'MMM d');
}
