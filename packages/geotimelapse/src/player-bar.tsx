'use client';

import { useEffect, useRef, useState } from 'react';

import { DAY_SECONDS, useDaySeconds, useTimelapseClock } from './clock.js';
import { formatDayTime, formatDayTime24, formatHourLabel } from './utils.js';

const SEEK_STEP = 60;
const BAR_PITCH_PX = 1;

const PLAYED_ALPHA = 0.55;
const CURRENT_ALPHA = 1;
const FUTURE_ALPHA = 0.22;

// The activity plot is the seek bar: event volume per minute drawn as 1px
// bars, played minutes brighter than upcoming ones, current one highlighted.
function ActivitySeekBar({ activity }: { activity: Float32Array | null }) {
  const clock = useTimelapseClock();
  const daySeconds = useDaySeconds();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(scale, scale);
      const fraction = daySeconds / DAY_SECONDS;
      if (activity) {
        const bucketCount = Math.max(1, Math.floor(width / BAR_PITCH_PX));
        // Average per minute, so a partial last bucket doesn't read as a dip.
        const sums = new Float32Array(bucketCount);
        const minutes = new Float32Array(bucketCount);
        for (let minute = 0; minute < activity.length; minute++) {
          const bucket = Math.min(Math.floor((minute / activity.length) * bucketCount), bucketCount - 1);
          sums[bucket] += activity[minute];
          minutes[bucket] += 1;
        }
        let max = 1;
        for (let bucket = 0; bucket < bucketCount; bucket++) {
          sums[bucket] /= Math.max(minutes[bucket], 1);
          max = Math.max(max, sums[bucket]);
        }
        const pitch = width / bucketCount;
        const barWidth = Math.max(pitch - 1, 1);
        const currentBucket = Math.min(Math.floor(fraction * bucketCount), bucketCount - 1);
        for (let bucket = 0; bucket < bucketCount; bucket++) {
          const alpha = bucket < currentBucket ? PLAYED_ALPHA : bucket === currentBucket ? CURRENT_ALPHA : FUTURE_ALPHA;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          const barHeight = (sums[bucket] / max) * height;
          ctx.fillRect(bucket * pitch, height - barHeight, barWidth, barHeight);
        }
      }
      // Full-height playhead at the exact time, finer than the minute bars.
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(fraction * (width - 1), 0, 1, height);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [activity, daySeconds]);

  const seekFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    clock.seek(Math.round((fraction * DAY_SECONDS) / SEEK_STEP) * SEEK_STEP);
  };

  const seekBy = (offset: number) => {
    clock.seek(Math.min(Math.max(clock.getDaySeconds() + offset, 0), DAY_SECONDS));
  };

  return (
    <canvas
      ref={canvasRef}
      role="slider"
      aria-label="Time of day"
      aria-valuemin={0}
      aria-valuemax={DAY_SECONDS}
      aria-valuenow={daySeconds}
      aria-valuetext={formatDayTime(daySeconds)}
      tabIndex={0}
      className="h-8 w-full cursor-pointer select-none focus-visible:outline-1 focus-visible:outline-white/60"
      onPointerDown={(event) => {
        seekFromPointer(event);
        // Capture keeps the drag scrubbing outside the canvas bounds; a
        // failed capture must never block the seek itself.
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // no active pointer (synthetic events, stale pointer id)
        }
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) seekFromPointer(event);
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 10 * SEEK_STEP : SEEK_STEP;
        if (event.key === 'ArrowLeft') seekBy(-step);
        else if (event.key === 'ArrowRight') seekBy(step);
        else if (event.key === 'PageDown') seekBy(-10 * SEEK_STEP);
        else if (event.key === 'PageUp') seekBy(10 * SEEK_STEP);
        else if (event.key === 'Home') clock.seek(0);
        else if (event.key === 'End') clock.seek(DAY_SECONDS);
        else return;
        event.preventDefault();
      }}
    />
  );
}

// Hour axis under the seek bar: a tick per hour, a label every two.
function HourAxis() {
  return (
    <div className="relative mt-0.5 h-3 font-mono text-[9px] text-white/40 tabular-nums">
      {Array.from({ length: 25 }, (_, hour) => (
        <div key={hour} className="absolute top-0" style={{ left: `${(hour / 24) * 100}%` }}>
          <div className="h-1 w-px bg-white/30" />
          {hour % 2 === 0 && (
            <div className={hour === 0 ? '' : hour === 24 ? '-translate-x-full' : '-translate-x-1/2'}>
              {formatHourLabel(hour)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PlayerBar({ activity }: { activity: Float32Array | null }) {
  const [hover, setHover] = useState<{ x: number; label: string } | null>(null);

  return (
    <div className="absolute inset-x-4 bottom-4 flex items-center gap-4 rounded-lg bg-black/60 px-4 py-3 text-white backdrop-blur-sm">
      <div
        className="relative min-w-0 flex-1"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const fraction = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
          const minuteSeconds = Math.floor((fraction * DAY_SECONDS) / 60) * 60;
          setHover({ x: event.clientX - rect.left, label: formatDayTime24(minuteSeconds) });
        }}
        onPointerLeave={() => setHover(null)}
      >
        {hover && (
          <div
            className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded-sm bg-black/80 px-1.5 py-0.5 font-mono text-[10px] tabular-nums"
            style={{ left: hover.x }}
          >
            {hover.label}
          </div>
        )}
        <ActivitySeekBar activity={activity} />
        <HourAxis />
      </div>
    </div>
  );
}
