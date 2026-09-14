'use client';

import { useEffect, useState } from 'react';

import { useDaySeconds, useTimelapseClock } from './clock.js';
import type { GeoTimelapseSource, Totals } from './types.js';
import { formatDayTime12 } from './utils.js';

interface CounterProps {
  source: GeoTimelapseSource;
  ready: boolean;
  error: string | null;
  progress: { loadedBytes: number; totalBytes: number } | null;
  scopeVersion: number;
  dateLabel?: string;
  timeZoneLabel?: string;
  formatValue: (value: number) => string;
  formatCount: (count: number) => string;
}

export default function Counter({
  source,
  ready,
  error,
  progress,
  scopeVersion,
  dateLabel,
  timeZoneLabel,
  formatValue,
  formatCount,
}: CounterProps) {
  const clock = useTimelapseClock();
  const daySeconds = useDaySeconds(60);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let disposed = false;
    let inFlight = false;
    let lastQueried = -1;

    // One query at a time: each tick tries, and is skipped while the previous
    // query is still running, so the counter refreshes as fast as the source
    // can answer and never queues up.
    const query = async () => {
      const second = Math.floor(clock.getDaySeconds());
      if (inFlight || second === lastQueried) return;
      inFlight = true;
      try {
        const result = await source.totals(second);
        if (disposed) return;
        lastQueried = second;
        setQueryError(null);
        setTotals(result);
      } catch (totalsError) {
        if (!disposed) setQueryError(totalsError instanceof Error ? totalsError.message : String(totalsError));
      } finally {
        inFlight = false;
      }
    };

    void query();
    const unsubscribe = clock.subscribe(() => void query());
    return () => {
      disposed = true;
      unsubscribe();
    };
    // scopeVersion re-runs the effect so a re-scoped source is re-read.
  }, [clock, source, ready, scopeVersion]);

  return (
    <div className="absolute top-4 right-4 h-24 w-64 rounded-lg bg-black/60 px-4 py-3 text-right font-mono text-white backdrop-blur-sm">
      {(error ?? queryError) ? (
        <div className="max-w-xs overflow-hidden text-xs text-red-400">{error ?? queryError}</div>
      ) : ready && totals ? (
        <>
          <div className="text-xs text-white/50 tabular-nums">
            {dateLabel && `${dateLabel}, `}
            {formatDayTime12(daySeconds)}
            {timeZoneLabel && ` ${timeZoneLabel}`}
          </div>
          <div className="text-2xl tabular-nums">{formatValue(totals.value)}</div>
          <div className="text-xs text-white/70 tabular-nums">{formatCount(totals.count)}</div>
        </>
      ) : (
        <div className="text-xs text-white/70 tabular-nums">
          {progress
            ? `loading day… ${Math.round(progress.loadedBytes / 1e6)}/${Math.round(progress.totalBytes / 1e6)} MB`
            : 'loading…'}
        </div>
      )}
    </div>
  );
}
