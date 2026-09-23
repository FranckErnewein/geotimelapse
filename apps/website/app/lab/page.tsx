'use client';

import { useEffect, useState } from 'react';
import type { GeoTimelapseSource } from 'geotimelapse';
import { GeoTimelapse } from 'geotimelapse';
import { createSyntheticSource } from 'geotimelapse/synthetic';

import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZnJhbmNrZXJuZXdlaW4iLCJhIjoiYXJLM0dISSJ9.mod0ppb2kjzuMy8j1pl0Bw';

const TOTALS = [5, 500, 5_000, 50_000, 500_000, 5_000_000];

const number = new Intl.NumberFormat('en-US');

export default function LabPage() {
  const [total, setTotal] = useState(500_000);
  const [seed, setSeed] = useState(42);
  const [source, setSource] = useState<GeoTimelapseSource | null>(null);

  useEffect(() => {
    const created = createSyntheticSource({ total, seed });
    setSource(created);
    return () => void created.dispose();
  }, [total, seed]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-6 border-b border-white/10 px-4 py-2 font-mono text-xs">
        <span className="font-bold">geotimelapse lab</span>
        <a href="/lab/glow" className="text-white/60 underline hover:text-white">
          glow only →
        </a>
        <label className="flex items-center gap-2">
          events
          <select
            value={total}
            onChange={(event) => setTotal(Number(event.target.value))}
            className="rounded-sm border border-white/20 bg-black px-2 py-1"
          >
            {TOTALS.map((value) => (
              <option key={value} value={value}>
                {number.format(value)}
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
      </header>
      <div className="min-h-0 flex-1">
        {source && (
          <GeoTimelapse
            key={`${total}-${seed}`}
            source={source}
            mapboxAccessToken={MAPBOX_TOKEN}
            dateLabel="Synthetic day"
            formatValue={(value) => number.format(value)}
            formatCount={(count) => `${number.format(count)} events`}
          />
        )}
      </div>
    </div>
  );
}
