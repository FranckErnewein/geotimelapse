import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { FramePoints, GeoTimelapseSource, MapBounds, Totals } from 'geotimelapse';
import { GeoTimelapse } from 'geotimelapse';

import './styles.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZnJhbmNrZXJuZXdlaW4iLCJhIjoiYXJLM0dISSJ9.mod0ppb2kjzuMy8j1pl0Bw';

const FRANCE: MapBounds = { west: -5.2, south: 41.3, east: 9.6, north: 51.1 };
const DAY_SECONDS = 86400;
const MINUTES = 24 * 60;
const DAY_MS = 24 * 3600 * 1000;

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('fr-FR');

function lowerBound(array: Uint32Array, value: number): number {
  let low = 0;
  let high = array.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (array[mid] < value) low = mid + 1;
    else high = mid;
  }
  return low;
}

interface Columns {
  seconds: Uint32Array;
  lons: Float32Array;
  lats: Float32Array;
  /** cumulative[i] = sum of sale values before row i (length rows + 1). */
  cumulative: Float64Array;
  minuteCounts: Float32Array;
}

function buildColumns(rows: { second: number; lon: number; lat: number; value: number }[]): Columns {
  rows.sort((a, b) => a.second - b.second);
  const seconds = new Uint32Array(rows.length);
  const lons = new Float32Array(rows.length);
  const lats = new Float32Array(rows.length);
  const cumulative = new Float64Array(rows.length + 1);
  const minuteCounts = new Float32Array(MINUTES);
  rows.forEach((row, i) => {
    seconds[i] = row.second;
    lons[i] = row.lon;
    lats[i] = row.lat;
    cumulative[i + 1] = cumulative[i] + row.value;
    minuteCounts[Math.floor(row.second / 60)] += 1;
  });
  return { seconds, lons, lats, cumulative, minuteCounts };
}

/**
 * A GeoTimelapseSource over the DVF sample (French property sales): the CSV's
 * date span is mapped linearly onto the player's day, so the month replays as
 * one 24h timelapse. Multi-lot sales carry their price on the first row only,
 * keeping the running total honest.
 */
function createDvfCsvSource(url: string): GeoTimelapseSource {
  let loadPromise: Promise<void> | null = null;
  let all: Columns | null = null;
  let scoped: Columns | null = null;

  const load = (onProgress?: (loadedBytes: number, totalBytes: number) => void) =>
    (loadPromise ??= (async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`fetching ${url}: ${response.status}`);
      const text = await response.text();
      const lines = text.trim().split('\n');
      const header = lines[0].split(',');
      const idColumn = header.indexOf('id_mutation');
      const dateColumn = header.indexOf('date_mutation');
      const valueColumn = header.indexOf('valeur_fonciere');
      const lonColumn = header.indexOf('longitude');
      const latColumn = header.indexOf('latitude');

      const parsed: { day: number; lon: number; lat: number; value: number }[] = [];
      const pricedMutations = new Set<string>();
      let firstDay = Infinity;
      let lastDay = -Infinity;
      for (const line of lines.slice(1)) {
        const cells = line.split(',');
        const lon = Number(cells[lonColumn]);
        const lat = Number(cells[latColumn]);
        if (!cells[lonColumn] || !cells[latColumn] || Number.isNaN(lon) || Number.isNaN(lat)) continue;
        const day = Date.parse(cells[dateColumn]);
        if (Number.isNaN(day)) continue;
        const id = cells[idColumn];
        const value = pricedMutations.has(id) ? 0 : Number(cells[valueColumn]) || 0;
        pricedMutations.add(id);
        parsed.push({ day, lon, lat, value });
        firstDay = Math.min(firstDay, day);
        lastDay = Math.max(lastDay, day);
      }

      const span = lastDay - firstDay + DAY_MS;
      all = buildColumns(
        parsed.map(({ day, lon, lat, value }) => ({
          second: Math.min(Math.floor(((day - firstDay) / span) * DAY_SECONDS), DAY_SECONDS - 1),
          lon,
          lat,
          value,
        })),
      );
      onProgress?.(text.length, text.length);
    })());

  const frame = async (fromSecond: number, toSecond: number): Promise<FramePoints> => {
    const { seconds, lons, lats } = all ?? buildColumns([]);
    const start = lowerBound(seconds, Math.floor(fromSecond));
    const end = lowerBound(seconds, Math.floor(toSecond));
    const byLocation = new Map<string, { lon: number; lat: number; weight: number }>();
    for (let i = start; i < end; i++) {
      const key = `${lons[i]},${lats[i]}`;
      const entry = byLocation.get(key);
      if (entry) entry.weight += 1;
      else byLocation.set(key, { lon: lons[i], lat: lats[i], weight: 1 });
    }
    const positions = new Float32Array(byLocation.size * 2);
    const weights = new Float32Array(byLocation.size);
    let i = 0;
    for (const { lon, lat, weight } of byLocation.values()) {
      positions[2 * i] = lon;
      positions[2 * i + 1] = lat;
      weights[i] = weight;
      i += 1;
    }
    return { positions, weights, count: byLocation.size };
  };

  const totals = async (second: number): Promise<Totals> => {
    const columns = scoped ?? all;
    if (!columns) return { count: 0, value: 0 };
    const index = lowerBound(columns.seconds, Math.floor(second));
    return { count: index, value: columns.cumulative[index] };
  };

  const activity = async (): Promise<Float32Array> =>
    Float32Array.from((scoped ?? all)?.minuteCounts ?? new Float32Array(MINUTES));

  const setScope = async (scope: MapBounds | null): Promise<void> => {
    if (!scope || !all) {
      scoped = null;
      return;
    }
    const rows: { second: number; lon: number; lat: number; value: number }[] = [];
    for (let i = 0; i < all.seconds.length; i++) {
      const lon = all.lons[i];
      const lat = all.lats[i];
      if (lon >= scope.west && lon <= scope.east && lat >= scope.south && lat <= scope.north) {
        rows.push({ second: all.seconds[i], lon, lat, value: all.cumulative[i + 1] - all.cumulative[i] });
      }
    }
    scoped = buildColumns(rows);
  };

  const dispose = async (): Promise<void> => {
    all = null;
    scoped = null;
    loadPromise = null;
  };

  return { load, frame, totals, activity, setScope, dispose };
}

function DemoPage() {
  const [source, setSource] = useState<GeoTimelapseSource | null>(null);

  useEffect(() => {
    const created = createDvfCsvSource(`${import.meta.env.BASE_URL}immo-fr-sample.csv`);
    // The resource must be created here so this effect's cleanup disposes exactly what it made.
    // oxlint-disable-next-line react/set-state-in-effect
    setSource(created);
    return () => void created.dispose();
  }, []);

  if (!source) return null;

  return (
    <div className="h-screen">
      <GeoTimelapse
        source={source}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialBounds={FRANCE}
        dateLabel="France · Jan 2023, one month in a day"
        formatValue={(value) => euro.format(value)}
        formatCount={(count) => `${number.format(count)} sales`}
        /* ~2k sparse events on a country view: small bright sparks. */
        tuning={{ pointAlpha: 200, flashRadius: 12_000, ghostMaxRadius: 8_000, ghostMinRadius: 1_000, minRadiusPx: 4 }}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<DemoPage />);
