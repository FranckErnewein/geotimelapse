import type { FramePoints, GeoTimelapseSource, MapBounds, Totals } from './types.js';

export interface SyntheticSourceOptions {
  /** Total events over the day. */
  total: number;
  /** Area events land in; defaults to the continental US. */
  bounds?: MapBounds;
  clusterCount?: number;
  /** Same seed, same day — handy to compare tunings. */
  seed?: number;
}

// Every dataset mixes the three spatial regimes the renderer must handle:
// gaussian clusters, a diffuse background, and exact-spot stacks of
// geometrically increasing size (to exercise the weight-driven brightness).
const UNIFORM_SHARE = 0.25;
const POINT_SHARE = 0.05;
const POINT_STACKS = 5;

const CONTINENTAL_US: MapBounds = { west: -124.7, south: 24.5, east: -66.9, north: 49.4 };
const DAY_SECONDS = 86400;
const MINUTES = 24 * 60;

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

// Quiet night, morning bump, evening prime-time peak.
function diurnalWeight(minute: number): number {
  const hour = minute / 60;
  const morning = Math.exp(-((hour - 8.5) ** 2) / (2 * 2.2 ** 2)) * 0.6;
  const evening = Math.exp(-((hour - 20.5) ** 2) / (2 * 2.8 ** 2)) * 1.4;
  return 0.25 + morning + evening;
}

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

/**
 * A GeoTimelapseSource generating a deterministic synthetic day in memory —
 * no engine, no network. Made for benches, demos and tests: pick a volume and
 * the component runs on it like on real data.
 * Each event has value 1, so totals().value mirrors the event count.
 */
export function createSyntheticSource({
  total,
  bounds = CONTINENTAL_US,
  clusterCount = 12,
  seed = 42,
}: SyntheticSourceOptions): GeoTimelapseSource {
  let loadPromise: Promise<void> | null = null;
  let seconds = new Uint32Array(0);
  let lons = new Float32Array(0);
  let lats = new Float32Array(0);
  let minuteCounts = new Float32Array(MINUTES);
  let scopedSeconds: Uint32Array | null = null;
  let scopedMinuteCounts: Float32Array | null = null;

  const load = (onProgress?: (loaded: number, totalBytes: number) => void) =>
    (loadPromise ??= (async () => {
      const rng = makeRng(seed);

      // Spread the total over minutes following the diurnal curve.
      const weights = Array.from({ length: MINUTES }, (_, minute) => diurnalWeight(minute));
      const weightSum = weights.reduce((a, b) => a + b, 0);
      const counts = weights.map((w) => Math.floor((total * w) / weightSum));
      let remainder = total - counts.reduce((a, b) => a + b, 0);
      for (let minute = 0; remainder > 0; minute = (minute + 7) % MINUTES) {
        counts[minute] += 1;
        remainder -= 1;
      }

      seconds = new Uint32Array(total);
      lons = new Float32Array(total);
      lats = new Float32Array(total);

      const width = bounds.east - bounds.west;
      const height = bounds.north - bounds.south;
      const hotspots = Array.from({ length: POINT_STACKS }, (_, i) => ({
        lon: bounds.west + width * (0.2 + 0.6 * rng()),
        lat: bounds.south + height * (0.2 + 0.6 * rng()),
        pull: 2 ** i,
      }));
      const hotspotPullSum = hotspots.reduce((a, h) => a + h.pull, 0);
      const centers = Array.from({ length: clusterCount }, () => ({
        lon: bounds.west + width * (0.1 + 0.8 * rng()),
        lat: bounds.south + height * (0.1 + 0.8 * rng()),
        pull: 0.3 + rng(),
      }));
      const pullSum = centers.reduce((a, c) => a + c.pull, 0);
      const sigma = Math.min(width, height) / 40;
      // Box-Muller, one gaussian pair per call.
      const gaussian = () => {
        const radius = Math.sqrt(-2 * Math.log(1 - rng()));
        const angle = 2 * Math.PI * rng();
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
      };

      let index = 0;
      for (let minute = 0; minute < MINUTES; minute++) {
        const count = counts[minute];
        minuteCounts[minute] = count;
        for (let i = 0; i < count; i++, index++) {
          seconds[index] = minute * 60 + Math.min(Math.floor((i + rng()) * (60 / Math.max(count, 1))), 59);
          const roll = rng();
          if (roll < POINT_SHARE) {
            let pick = rng() * hotspotPullSum;
            let hotspot = hotspots[0];
            for (const candidate of hotspots) {
              pick -= candidate.pull;
              if (pick <= 0) {
                hotspot = candidate;
                break;
              }
            }
            lons[index] = hotspot.lon;
            lats[index] = hotspot.lat;
          } else if (roll < POINT_SHARE + UNIFORM_SHARE) {
            lons[index] = bounds.west + width * rng();
            lats[index] = bounds.south + height * rng();
          } else {
            let pick = rng() * pullSum;
            let center = centers[0];
            for (const candidate of centers) {
              pick -= candidate.pull;
              if (pick <= 0) {
                center = candidate;
                break;
              }
            }
            const [dx, dy] = gaussian();
            lons[index] = center.lon + dx * sigma;
            lats[index] = center.lat + dy * sigma;
          }
        }
        if (minute % 288 === 0) onProgress?.(index, total);
      }
      onProgress?.(total, total);
    })());

  const frame = async (fromSecond: number, toSecond: number): Promise<FramePoints> => {
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
    const array = scopedSeconds ?? seconds;
    const count = lowerBound(array, Math.floor(second));
    return { count, value: count };
  };

  const activity = async (): Promise<Float32Array> => Float32Array.from(scopedMinuteCounts ?? minuteCounts);

  const setScope = async (scope: MapBounds | null): Promise<void> => {
    if (!scope) {
      scopedSeconds = null;
      scopedMinuteCounts = null;
      return;
    }
    const kept = new Uint32Array(seconds.length);
    const minutes = new Float32Array(MINUTES);
    let size = 0;
    for (let i = 0; i < seconds.length; i++) {
      const lon = lons[i];
      const lat = lats[i];
      if (lon >= scope.west && lon <= scope.east && lat >= scope.south && lat <= scope.north) {
        kept[size] = seconds[i];
        size += 1;
        minutes[Math.floor(seconds[i] / 60)] += 1;
      }
    }
    scopedSeconds = kept.subarray(0, size);
    scopedMinuteCounts = minutes;
  };

  const dispose = async (): Promise<void> => {
    seconds = new Uint32Array(0);
    lons = new Float32Array(0);
    lats = new Float32Array(0);
    minuteCounts = new Float32Array(MINUTES);
    scopedSeconds = null;
    scopedMinuteCounts = null;
    loadPromise = null;
  };

  return { load, frame, totals, activity, setScope, dispose };
}
