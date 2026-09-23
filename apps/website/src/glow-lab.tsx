import { useEffect, useMemo, useState } from 'react';
import DeckGL from 'deck.gl';
import type { FrameBids, GlowTuning } from 'geotimelapse';
import { buildGlowLayers, DEFAULT_GLOW_TUNING } from 'geotimelapse';

const number = new Intl.NumberFormat('en-US');

const INITIAL_VIEW = { longitude: -98.5, latitude: 38.8, zoom: 4, pitch: 0, bearing: 0 };

// Calibration grid: one column per volume, four bands per column — a gaussian
// cluster, a uniform fog, everything stacked on a single location, and the
// three motifs superimposed.
const GRID = { west: -128, south: 28, east: -69, north: 50 };
const COLUMN_COUNTS = [10, 100, 1_000, 10_000];
const BANDS = 4;

// Deterministic PRNG (mulberry32).
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGridFrame(seed: number): FrameBids {
  const rng = makeRng(seed);
  const gaussian = () => {
    const radius = Math.sqrt(-2 * Math.log(1 - rng()));
    const angle = 2 * Math.PI * rng();
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  };

  const cellWidth = (GRID.east - GRID.west) / COLUMN_COUNTS.length;
  const bandHeight = (GRID.north - GRID.south) / BANDS;
  const size = COLUMN_COUNTS.reduce((a, b) => a + b, 0) * 4 + COLUMN_COUNTS.length * 2;
  const positions = new Float32Array(size * 2);
  const radii = new Float32Array(size);
  let i = 0;
  const push = (lon: number, lat: number, weight: number) => {
    positions[2 * i] = lon;
    positions[2 * i + 1] = lat;
    radii[i] = Math.sqrt(weight);
    i += 1;
  };

  const sigma = cellWidth / 10;
  COLUMN_COUNTS.forEach((count, column) => {
    const centerLon = GRID.west + cellWidth * (column + 0.5);
    const bandCenterLat = (band: number) => GRID.north - bandHeight * (band + 0.5);

    // Gaussian cluster (lat sigma shrunk so it reads circular on mercator).
    const cluster = (band: number) => {
      const centerLat = bandCenterLat(band);
      const latShrink = Math.cos((centerLat * Math.PI) / 180);
      for (let k = 0; k < count; k++) {
        const [dx, dy] = gaussian();
        push(centerLon + dx * sigma, centerLat + dy * sigma * latShrink, 1);
      }
    };
    // Uniform fog over the cell.
    const fog = (band: number) => {
      const south = GRID.north - bandHeight * (band + 1);
      for (let k = 0; k < count; k++) {
        push(GRID.west + cellWidth * (column + 0.1 + 0.8 * rng()), south + bandHeight * (0.1 + 0.8 * rng()), 1);
      }
    };
    // The whole column count on one exact spot.
    const stack = (band: number) => push(centerLon, bandCenterLat(band), count);

    cluster(0);
    fog(1);
    stack(2);
    // Bottom band: the three motifs superimposed.
    cluster(3);
    fog(3);
    stack(3);
  });

  return { key: 0, positions, radii, count: i, queryMs: 0 };
}

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

/** The glow layer out of time: a static calibration grid, direct tuning knobs. */
export function GlowLab() {
  const [seed, setSeed] = useState(42);
  const [pointAlpha, setPointAlpha] = useState(DEFAULT_GLOW_TUNING.pointAlpha);
  const [flashRadius, setFlashRadius] = useState(DEFAULT_GLOW_TUNING.flashRadius);
  const [minRadiusPx, setMinRadiusPx] = useState(DEFAULT_GLOW_TUNING.minRadiusPx);
  const [maxRadiusPx, setMaxRadiusPx] = useState(DEFAULT_GLOW_TUNING.maxRadiusPx);
  const fps = useFps();

  const frame = useMemo(() => buildGridFrame(seed), [seed]);
  const tuning: GlowTuning = { ...DEFAULT_GLOW_TUNING, pointAlpha, flashRadius, minRadiusPx, maxRadiusPx };
  const layers = buildGlowLayers([frame], tuning);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/10 px-4 py-2 font-mono text-xs">
        <span className="font-bold">glow lab</span>
        <span className="text-white/50">
          bands: cluster / fog / stack / mix · columns: {COLUMN_COUNTS.map((value) => number.format(value)).join(' · ')}
        </span>
        <button
          type="button"
          onClick={() => setSeed((value) => value + 1)}
          className="cursor-pointer rounded-sm border border-white/20 px-2 py-1 hover:bg-white/10"
        >
          reseed ({seed})
        </button>
        <label className="flex items-center gap-2">
          alpha
          <input
            type="number"
            min={1}
            max={255}
            value={pointAlpha}
            onChange={(event) => setPointAlpha(Number(event.target.value))}
            className="w-16 rounded-sm border border-white/20 bg-black px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          radius (km)
          <input
            type="number"
            min={1}
            max={1000}
            value={Math.round(flashRadius / 1000)}
            onChange={(event) => setFlashRadius(Number(event.target.value) * 1000)}
            className="w-20 rounded-sm border border-white/20 bg-black px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          min radius (px)
          <input
            type="number"
            min={0}
            max={64}
            step={0.5}
            value={minRadiusPx}
            onChange={(event) => setMinRadiusPx(Number(event.target.value))}
            className="w-16 rounded-sm border border-white/20 bg-black px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          max radius (px)
          <input
            type="number"
            min={1}
            max={512}
            value={maxRadiusPx}
            onChange={(event) => setMaxRadiusPx(Number(event.target.value))}
            className="w-20 rounded-sm border border-white/20 bg-black px-2 py-1"
          />
        </label>
        <span className="ml-auto text-white/50 tabular-nums">
          {number.format(frame.count)} locations · {fps} fps
        </span>
      </header>
      <div className="relative min-h-0 flex-1 bg-black">
        <DeckGL initialViewState={INITIAL_VIEW} controller layers={layers} />
      </div>
    </div>
  );
}
