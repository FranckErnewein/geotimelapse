'use client';

import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';

export const DAY_SECONDS = 24 * 60 * 60;
/** Default wall-clock duration of a full replay. */
export const DEFAULT_PLAYBACK_SECONDS = 180;
// Ticks are capped below the display refresh rate: extra updates are invisible
// and would only waste re-renders on high-refresh screens.
const MAX_TICKS_PER_SECOND = 24;
const MIN_TICK_MS = 1000 / MAX_TICKS_PER_SECOND;
// Bounds on the wall-clock delta applied per tick. The upper bound keeps a
// hidden tab (rAF suspended) or a main-thread stall from fast-forwarding the
// replay; the lower bound guards against the first rAF timestamp predating the
// performance.now() sampled in play() (vsync time is stamped before input).
const MAX_TICK_MS = 100;

export interface TimelapseClock {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  /** Seconds elapsed since the start of the replayed domain, in [0, span]. */
  getSeconds: () => number;
  /** Domain seconds covered by the full replay; DAY_SECONDS until setSpan. */
  getSpan: () => number;
  /** Adopts the loaded source's domain span (clamps the playhead into it). */
  setSpan: (spanSeconds: number) => void;
  /** Replayed seconds one nominal tick covers — the frame window unit. */
  getTickSpan: () => number;
  /** Increments on every time jump (seek, end-of-day restart): consumers use it to invalidate history. */
  getEpoch: () => number;
  isPlaying: () => boolean;
  /** Notified up to MAX_TICKS_PER_SECOND times while playing, and on play/pause/seek. */
  subscribe: (listener: () => void) => () => void;
}

function createClock(playbackSeconds: number): TimelapseClock {
  let spanSeconds = DAY_SECONDS;
  let rate = spanSeconds / playbackSeconds;
  let seconds = 0;
  let epoch = 0;
  let playing = false;
  let rafId = 0;
  let lastTick = 0;
  // Next tick due date, advanced on its own grid so the effective rate stays
  // at the cap instead of snapping down to a divisor of the refresh rate.
  let nextTickAt = 0;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const tick = (now: number) => {
    if (now < nextTickAt) {
      rafId = requestAnimationFrame(tick);
      return;
    }
    nextTickAt = Math.max(nextTickAt + MIN_TICK_MS, now);
    seconds += (Math.min(Math.max(now - lastTick, 0), MAX_TICK_MS) / 1000) * rate;
    lastTick = now;
    if (seconds >= spanSeconds) {
      seconds = spanSeconds;
      playing = false;
    } else {
      rafId = requestAnimationFrame(tick);
    }
    notify();
  };

  const play = () => {
    if (playing) return;
    if (seconds >= spanSeconds) {
      seconds = 0;
      epoch += 1;
    }
    playing = true;
    lastTick = performance.now();
    nextTickAt = lastTick;
    rafId = requestAnimationFrame(tick);
    notify();
  };

  const pause = () => {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(rafId);
    notify();
  };

  return {
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    seek: (value: number) => {
      seconds = Math.min(Math.max(value, 0), spanSeconds);
      epoch += 1;
      notify();
    },
    getSeconds: () => seconds,
    getSpan: () => spanSeconds,
    setSpan: (value: number) => {
      spanSeconds = Math.max(value, 1);
      rate = spanSeconds / playbackSeconds;
      seconds = Math.min(seconds, spanSeconds);
      notify();
    },
    getTickSpan: () => rate / MAX_TICKS_PER_SECOND,
    getEpoch: () => epoch,
    isPlaying: () => playing,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const ClockContext = createContext<TimelapseClock | null>(null);

export function TimelapseClockProvider({
  playbackSeconds = DEFAULT_PLAYBACK_SECONDS,
  children,
}: PropsWithChildren<{ playbackSeconds?: number }>) {
  // Fixed at mount: remount the provider to change the replay duration.
  const [clock] = useState(() => createClock(playbackSeconds));
  useEffect(() => () => clock.pause(), [clock]);
  return <ClockContext.Provider value={clock}>{children}</ClockContext.Provider>;
}

export function useTimelapseClock(): TimelapseClock {
  const clock = useContext(ClockContext);
  if (!clock) throw new Error('useTimelapseClock must be used within a TimelapseClockProvider');
  return clock;
}

export function useIsPlaying(): boolean {
  const clock = useTimelapseClock();
  return useSyncExternalStore(clock.subscribe, clock.isPlaying, () => false);
}

/**
 * Current playhead time, quantized: the component only re-renders when the
 * value crosses a quantum boundary, so each consumer picks its refresh rate.
 */
export function usePlayheadSeconds(quantum = 1): number {
  const clock = useTimelapseClock();
  const getSnapshot = useCallback(() => Math.floor(clock.getSeconds() / quantum) * quantum, [clock, quantum]);
  return useSyncExternalStore(clock.subscribe, getSnapshot, () => 0);
}
