'use client';

import { useEffect, useState } from 'react';
import DeckGL from 'deck.gl';
import type { FrameBids, GlowTuning } from 'geotimelapse';
import { buildGlowLayers, DEFAULT_GLOW_TUNING } from 'geotimelapse';
import type { SyntheticSourceOptions } from 'geotimelapse/synthetic';
import { createSyntheticSource } from 'geotimelapse/synthetic';

const COUNTS = [5, 50, 500, 5_000, 50_000, 500_000];
const DISTRIBUTIONS = ['point', 'uniform', 'clusters'] as const;
const number = new Intl.NumberFormat('en-US');

const INITIAL_VIEW = { longitude: -98.5, latitude: 38.8, zoom: 4, pitch: 0, bearing: 0 };

function useFps(): number {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let rafId = 0;
    let count = 0;
    let start = performance.now();
    const loop = (now: number) => {
      count += 1;
      if (now - start >= 500) {
        setFps(Math.round((count * 1000) / (now - start)));
        count = 0;
        start = now;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);
  return fps;
}

/** The glow layer out of time: one static frame, direct tuning knobs. */
export default function GlowLabPage() {
  const [count, setCount] = useState(5_000);
  const [distribution, setDistribution] = useState<NonNullable<SyntheticSourceOptions['distribution']>>('clusters');
  const [seed, setSeed] = useState(42);
  const [pointAlpha, setPointAlpha] = useState(DEFAULT_GLOW_TUNING.pointAlpha);
  const [flashRadius, setFlashRadius] = useState(DEFAULT_GLOW_TUNING.flashRadius);
  const [frame, setFrame] = useState<FrameBids | null>(null);
  const fps = useFps();

  useEffect(() => {
    let disposed = false;
    const source = createSyntheticSource({ total: count, distribution, seed });
    void source
      .load()
      .then(() => source.frame(0, 86400))
      .then((points) => {
        if (disposed) return;
        const radii = new Float32Array(points.count);
        for (let i = 0; i < points.count; i++) radii[i] = Math.sqrt(points.weights[i]);
        setFrame({ key: 0, positions: points.positions, radii, count: points.count, queryMs: 0 });
      })
      .finally(() => void source.dispose());
    return () => {
      disposed = true;
    };
  }, [count, distribution, seed]);

  const tuning: GlowTuning = { ...DEFAULT_GLOW_TUNING, pointAlpha, flashRadius };
  const layers = frame ? buildGlowLayers([frame], tuning) : [];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/10 px-4 py-2 font-mono text-xs">
        <span className="font-bold">glow lab</span>
        <label className="flex items-center gap-2">
          events
          <select
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="rounded-sm border border-white/20 bg-black px-2 py-1"
          >
            {COUNTS.map((value) => (
              <option key={value} value={value}>
                {number.format(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          distribution
          <select
            value={distribution}
            onChange={(event) => setDistribution(event.target.value as (typeof DISTRIBUTIONS)[number])}
            className="rounded-sm border border-white/20 bg-black px-2 py-1"
          >
            {DISTRIBUTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setSeed((value) => value + 1)}
          className="cursor-pointer rounded-sm border border-white/20 px-2 py-1 hover:bg-white/10"
        >
          reseed ({seed})
        </button>
        <label className="flex items-center gap-2">
          alpha {pointAlpha}
          <input
            type="range"
            min={4}
            max={255}
            value={pointAlpha}
            onChange={(event) => setPointAlpha(Number(event.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          radius {flashRadius}px
          <input
            type="range"
            min={2}
            max={40}
            value={flashRadius}
            onChange={(event) => setFlashRadius(Number(event.target.value))}
          />
        </label>
        <span className="ml-auto text-white/50 tabular-nums">
          {frame ? `${number.format(frame.count)} locations · ` : ''}
          {fps} fps
        </span>
      </header>
      <div className="relative min-h-0 flex-1 bg-black">
        <DeckGL initialViewState={INITIAL_VIEW} controller layers={layers} />
      </div>
    </div>
  );
}
