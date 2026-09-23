'use client';

import { useEffect, useState } from 'react';

import { useTimelapseClock } from './clock.js';
import type { GeoTimelapseSource } from './types.js';

// One clock tick of replayed time (480x speed, 24 ticks/s).
const DEFAULT_WINDOW_S = 20;
// Widened-window cap when ticks were skipped (slow queries, render lag).
// Kept tight: giant catch-up frames feed the lag they compensate for.
const MAX_WINDOW_S = 3 * DEFAULT_WINDOW_S;

export interface FrameBids {
  /** Monotonic frame number, also the identity of the frame's layer slot. */
  key: number;
  /** Interleaved [lon, lat] pairs, one per distinct location, ready for a binary deck.gl attribute. */
  positions: Float32Array;
  /** Per-location sqrt(weight): scaling the radius by it keeps the point AREA linear in the weight. */
  radii: Float32Array;
  /** Distinct locations in the frame (the instance count). */
  count: number;
  queryMs: number;
}

/** How many past frames stay visible as fading ghost trails. */
export const FRAME_HISTORY = 12;

/**
 * The last FRAME_HISTORY frames of events, newest first. Each frame holds
 * the window since the frame before it; a seek resets the history.
 */
export function useFrameHistory(source: GeoTimelapseSource, ready: boolean): FrameBids[] {
  const clock = useTimelapseClock();
  const [frames, setFrames] = useState<FrameBids[]>([]);

  useEffect(() => {
    if (!ready) return;
    let disposed = false;
    let inFlight = false;
    let lastQueried = -1;
    let lastEpoch = -1;
    let frameKey = 0;

    const query = async () => {
      const daySeconds = Math.floor(clock.getDaySeconds());
      const epoch = clock.getEpoch();
      if (inFlight || (daySeconds === lastQueried && epoch === lastEpoch)) return;
      inFlight = true;
      try {
        const started = performance.now();
        // A time jump (seek, restart) starts the trail over; mere lag only
        // widens the window, capped, so skipped ticks don't drop events.
        const jumped = epoch !== lastEpoch || lastQueried < 0 || daySeconds <= lastQueried;
        const span = jumped ? DEFAULT_WINDOW_S : Math.min(daySeconds - lastQueried, MAX_WINDOW_S);
        lastQueried = daySeconds;
        lastEpoch = epoch;
        const result = await source.frame(daySeconds - span, daySeconds);
        if (disposed) return;
        const radii = new Float32Array(result.count);
        for (let i = 0; i < result.count; i++) radii[i] = Math.sqrt(result.weights[i]);
        const frame: FrameBids = {
          key: frameKey++,
          positions: result.positions,
          radii,
          count: result.count,
          queryMs: Math.round(performance.now() - started),
        };
        // Ghost trails only make sense over contiguous playback.
        setFrames((history) => (jumped ? [frame] : [frame, ...history.slice(0, FRAME_HISTORY - 1)]));
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
    // ready re-arms the reader once the source has loaded.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [clock, source, ready]);

  return frames;
}

/** Event count for each minute of the replayed day, within the current scope. */
export function useMinuteActivity(
  source: GeoTimelapseSource,
  ready: boolean,
  scopeVersion: number,
): Float32Array | null {
  const [activity, setActivity] = useState<Float32Array | null>(null);

  useEffect(() => {
    if (!ready) return;
    let disposed = false;
    void source.activity().then((counts) => {
      if (!disposed) setActivity(counts);
    });
    return () => {
      disposed = true;
    };
    // ready and scopeVersion re-run the effect so a (re)loaded source is re-read.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [source, ready, scopeVersion]);

  return activity;
}

/**
 * Trail length that adapts to the achieved frame rate: under 24 fps ghosts
 * are shed one per second, above 58 fps they come back, up to FRAME_HISTORY.
 * (58, not 60: a 60 Hz display — the TV target — never reads past 60.) The
 * 1s sampling window doubles as a cooldown so the count settles instead of
 * oscillating across the wide 24-58 dead band.
 */
export function useAdaptiveTrailFrames(): number {
  const [count, setCount] = useState(FRAME_HISTORY);

  useEffect(() => {
    let rafId = 0;
    let ticks = 0;
    let windowStart = performance.now();
    const loop = (now: number) => {
      ticks += 1;
      if (now - windowStart >= 1000) {
        const fps = (ticks * 1000) / (now - windowStart);
        if (fps < 24) setCount((current) => Math.max(current - 1, 2));
        else if (fps > 58) setCount((current) => Math.min(current + 1, FRAME_HISTORY));
        ticks = 0;
        windowStart = now;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return count;
}

/** Rendered frames per second, sampled twice a second. */
export function useFps(): number {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let count = 0;
    let windowStart = performance.now();
    const loop = (now: number) => {
      count += 1;
      if (now - windowStart >= 500) {
        setFps(Math.round((count * 1000) / (now - windowStart)));
        count = 0;
        windowStart = now;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}
